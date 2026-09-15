class_name SliceSettlementAuthority
extends RefCounted

var world
var settlements: Dictionary = {}

const LOCAL_CONSUMPTION_INTERVAL_HOURS := 4
const LOCAL_MEAT_REVENUE := 2

func _init(owner_world) -> void:
	world = owner_world

func register_baseline(raw_settlements: Array) -> int:
	settlements.clear()
	var count := 0
	for raw in raw_settlements:
		if not raw is Dictionary:
			continue
		var spec: Dictionary = raw
		var id := String(spec.get("id", ""))
		if id.is_empty() or settlements.has(id):
			continue
		settlements[id] = {
			"id": id,
			"name": String(spec.get("name", id)),
			"founding_faction": String(spec.get("founding_faction", "")),
			"anchor_cell": _decode_cell(spec.get("anchor_cell", [])),
			"market_cell": _decode_cell(spec.get("market_cell", [])),
			"structures": (spec.get("structures", []) as Array).duplicate(),
			"inventory": _clean_counts(spec.get("initial_inventory", {})),
			"stolen_deficit": {},
			"targets": _clean_counts(spec.get("targets", {})),
			"base_prices": _clean_counts(spec.get("base_prices", {})),
			"local_production": _clean_counts(spec.get("local_production", {})),
			"local_consumption": _clean_counts(spec.get("local_consumption", {})),
			"treasury": maxi(0, int(spec.get("initial_treasury", 0))),
			"treasury_target": maxi(0, int(spec.get("initial_treasury", 0))),
			"security": 100,
		}
		count += 1
	return count

func ids() -> Array[String]:
	var result: Array[String] = []
	for raw_id in settlements.keys():
		result.append(String(raw_id))
	result.sort()
	return result

func has(settlement_id: String) -> bool:
	return settlements.has(settlement_id)

func state(settlement_id: String) -> Dictionary:
	return (settlements.get(settlement_id, {}) as Dictionary).duplicate(true)

func owner_id(settlement_id: String) -> String:
	if not settlements.has(settlement_id):
		return "wilderness"
	var row: Dictionary = settlements[settlement_id]
	return world.owner_at(row["anchor_cell"])

func market_cell(settlement_id: String) -> Vector2i:
	if not settlements.has(settlement_id):
		return Vector2i(99999, 99999)
	return (settlements[settlement_id] as Dictionary)["market_cell"]

func nearby_market(at: Vector2, radius := 102.4) -> String:
	var best := ""
	var best_distance := radius
	for settlement_id in ids():
		var center: Vector2 = world.cell_center(market_cell(settlement_id))
		var distance := at.distance_to(center)
		if distance <= best_distance:
			best = settlement_id
			best_distance = distance
	return best

func item_count(settlement_id: String, item_id: String) -> int:
	if not settlements.has(settlement_id):
		return 0
	var inventory: Dictionary = (settlements[settlement_id] as Dictionary)["inventory"]
	return maxi(0, int(inventory.get(item_id, 0)))

func treasury(settlement_id: String) -> int:
	return maxi(0, int((settlements.get(settlement_id, {}) as Dictionary).get("treasury", 0)))

func production_profile(settlement_id: String) -> Dictionary:
	return ((settlements.get(settlement_id, {}) as Dictionary).get("local_production", {}) as Dictionary).duplicate(true)

func consumption_profile(settlement_id: String) -> Dictionary:
	return ((settlements.get(settlement_id, {}) as Dictionary).get("local_consumption", {}) as Dictionary).duplicate(true)

func accepted_goods(settlement_id: String) -> Array[String]:
	var goods: Array[String] = []
	var row: Dictionary = settlements.get(settlement_id, {})
	var prices: Dictionary = row.get("base_prices", {})
	for raw_id in prices.keys():
		goods.append(String(raw_id))
	goods.sort()
	return goods

func buy_price(settlement_id: String, item_id: String) -> int:
	return _buy_price_at_stock(settlement_id, item_id, item_count(settlement_id, item_id))

func _buy_price_at_stock(settlement_id: String, item_id: String, stock: int) -> int:
	if not settlements.has(settlement_id):
		return 0
	var row: Dictionary = settlements[settlement_id]
	var base_prices: Dictionary = row["base_prices"]
	var base := maxi(0, int(base_prices.get(item_id, 0)))
	if base <= 0:
		return 0
	var targets: Dictionary = row["targets"]
	var target := maxi(1, int(targets.get(item_id, 1)))
	var ratio := float(maxi(0, stock)) / float(target)
	var shortage := clampf(1.0 - ratio, 0.0, 1.0)
	var loss := int((row.get("stolen_deficit", {}) as Dictionary).get(item_id, 0))
	# Ordinary demand moves gently; physical supply destruction drives crises.
	var crisis := clampf(float(loss) / float(target), 0.0, 1.0) * shortage
	var security_factor := (1.0 - float(security(settlement_id)) / 100.0) * 0.35
	var factor := 1.0 + shortage * 0.08 + crisis * 1.5 + security_factor
	return maxi(1, int(round(float(base) * factor)))

func sale_quote(settlement_id: String, item_id: String, quantity := 1) -> Dictionary:
	if not settlements.has(settlement_id) or quantity <= 0 or quantity > 99:
		return {"ok": false, "reason": "invalid_trade"}
	var starting_stock := item_count(settlement_id, item_id)
	var unit_price := buy_price(settlement_id, item_id)
	if unit_price <= 0:
		return {"ok": false, "reason": "not_bought_here"}
	var total := 0
	for offset in range(quantity):
		total += _buy_price_at_stock(settlement_id, item_id, starting_stock + offset)
	var row: Dictionary = settlements[settlement_id]
	var target := maxi(0, int((row["targets"] as Dictionary).get(item_id, 0)))
	var available_treasury := maxi(0, int(row["treasury"]))
	return {
		"ok": true,
		"settlement_id": settlement_id,
		"item_id": item_id,
		"quantity": quantity,
		"unit_price": unit_price,
		"total": total,
		"stock": starting_stock,
		"target": target,
		"treasury": available_treasury,
		"affordable": available_treasury >= total,
		"needed": maxi(0, target - starting_stock),
		"demand_met": quantity <= maxi(0, target - starting_stock),
		"crisis": int((row.get("stolen_deficit", {}) as Dictionary).get(item_id, 0)) > 0,
	}

func sell_from_player(player, settlement_id: String, item_id: String, quantity := 1) -> Dictionary:
	if player == null or not settlements.has(settlement_id) or quantity <= 0:
		return {"ok": false, "reason": "invalid_trade"}
	if nearby_market(player.global_position) != settlement_id:
		return {"ok": false, "reason": "not_at_market"}
	if market_closed_to_player(settlement_id):
		return {"ok": false, "reason": "wanted"}
	if player.item_count(item_id) < quantity:
		return {"ok": false, "reason": "insufficient_goods"}
	var quote := sale_quote(settlement_id, item_id, quantity)
	if not bool(quote.get("ok", false)):
		return quote
	if not bool(quote.get("demand_met", false)):
		return {"ok": false, "reason": "demand_filled"}
	var unit_price := int(quote.get("unit_price", 0))
	var total := int(quote.get("total", 0))
	if not bool(quote.get("affordable", false)):
		return {"ok": false, "reason": "treasury_short"}
	var row: Dictionary = settlements[settlement_id]
	if not player.spend_item(item_id, quantity):
		return {"ok": false, "reason": "insufficient_goods"}
	var inventory: Dictionary = row["inventory"]
	inventory[item_id] = maxi(0, int(inventory.get(item_id, 0))) + quantity
	row["inventory"] = inventory
	row["treasury"] = int(row["treasury"]) - total
	settlements[settlement_id] = row
	player.forge_marks += total
	_relieve_stolen_deficit(settlement_id, item_id, quantity)
	if world.faction_authority != null and world.faction_authority.at_war(world.faction_authority.controller_for_settlement(settlement_id)):
		recover_security(settlement_id, mini(quantity, 3))
	return {"ok": true, "item_id": item_id, "quantity": quantity, "unit_price": unit_price, "total": total}

# Retail is priced after each withdrawal. Buying then selling to the same
# stock level therefore always loses the spread, including bulk trades.
func purchase_quote(settlement_id: String, item_id: String, quantity := 1) -> Dictionary:
	if not settlements.has(settlement_id) or quantity <= 0 or quantity > 99:
		return {"ok": false, "reason": "invalid_trade"}
	if item_id not in accepted_goods(settlement_id):
		return {"ok": false, "reason": "not_sold_here"}
	var stock := item_count(settlement_id, item_id)
	var row: Dictionary = settlements[settlement_id]
	var target := int((row["targets"] as Dictionary).get(item_id, 0))
	var reserve_ratio := 0.25
	if world.faction_authority != null:
		match world.faction_authority.conflict_status(settlement_id):
			"tense": reserve_ratio = 0.35
			"war": reserve_ratio = 0.50
			"raid": reserve_ratio = 0.75
			"occupied": reserve_ratio = 0.40
	var reserve := int(ceil(float(target) * reserve_ratio)) if (row.get("local_consumption", {}) as Dictionary).has(item_id) else 0
	var total := 0
	for offset in range(quantity):
		total += maxi(1, int(ceil(float(_buy_price_at_stock(settlement_id, item_id, maxi(0, stock - offset - 1))) * 1.25)))
	return {"ok": true, "settlement_id": settlement_id, "item_id": item_id,
		"quantity": quantity, "stock": stock, "available": stock - reserve >= quantity, "reserve": reserve,
		"reserve_ratio": reserve_ratio, "conflict_status": world.faction_authority.conflict_status(settlement_id) if world.faction_authority != null else "peace",
		"total": total}

func buy_to_player(player, settlement_id: String, item_id: String, quantity := 1) -> Dictionary:
	if player == null or not settlements.has(settlement_id):
		return {"ok": false, "reason": "invalid_trade"}
	if nearby_market(player.global_position) != settlement_id:
		return {"ok": false, "reason": "not_at_market"}
	if market_closed_to_player(settlement_id):
		return {"ok": false, "reason": "wanted"}
	var quote := purchase_quote(settlement_id, item_id, quantity)
	if not bool(quote.get("ok", false)):
		return quote
	if not bool(quote.get("available", false)):
		return {"ok": false, "reason": "stock_short"}
	if not player.can_carry(item_id, quantity):
		return {"ok": false, "reason": "overburdened"}
	var total := int(quote["total"])
	if player.forge_marks < total:
		return {"ok": false, "reason": "marks_short"}
	var row: Dictionary = settlements[settlement_id]
	var inventory: Dictionary = row["inventory"]
	inventory[item_id] = int(inventory[item_id]) - quantity
	row["inventory"] = inventory
	row["treasury"] = int(row["treasury"]) + total
	settlements[settlement_id] = row
	player.forge_marks -= total
	player.add_item(item_id, quantity)
	return {"ok": true, "item_id": item_id, "quantity": quantity, "total": total}

# A read-only market lead, not a delivery contract or guaranteed reward.
func export_opportunity(origin_id: String, item_id: String, quantity := 1) -> Dictionary:
	var purchase := purchase_quote(origin_id, item_id, quantity)
	if not bool(purchase.get("ok", false)) or not bool(purchase.get("available", false)):
		return {}
	var best: Dictionary = {}
	var best_profit := 0
	for destination_id in ids():
		if destination_id == origin_id or market_closed_to_player(destination_id):
			continue
		var sale := sale_quote(destination_id, item_id, quantity)
		if not bool(sale.get("ok", false)) or not bool(sale.get("affordable", false)) or not bool(sale.get("demand_met", false)):
			continue
		var profit := int(sale["total"]) - int(purchase["total"])
		if profit > best_profit:
			best_profit = profit
			best = {"destination_id": destination_id, "profit": profit,
				"sale_total": int(sale["total"]), "quantity": quantity,
				"distance_cells": absi(market_cell(destination_id).x - market_cell(origin_id).x),
				"east": market_cell(destination_id).x > market_cell(origin_id).x,
				"risk": world.faction_authority.conflict_status(destination_id) if world.faction_authority != null else "peace"}
	return best

func simulate_hour(absolute_hour: int) -> Dictionary:
	var events: Array = []
	if absolute_hour < 0 or absolute_hour % LOCAL_CONSUMPTION_INTERVAL_HOURS != 0:
		return {"hour": absolute_hour, "events": events}
	for settlement_id in ids():
		var row: Dictionary = settlements[settlement_id]
		var inventory: Dictionary = row["inventory"]
		var targets: Dictionary = row["targets"]
		var consumed: Dictionary = {}
		var produced: Dictionary = {}
		var total_consumed := 0
		var consumption: Dictionary = row.get("local_consumption", {})
		var consumption_ids: Array = consumption.keys()
		consumption_ids.sort()
		for raw_id in consumption_ids:
			var item_id := String(raw_id)
			if item_id != "raw_meat" and absolute_hour % 24 != 0:
				continue
			var available := maxi(0, int(inventory.get(item_id, 0)))
			var amount := mini(maxi(0, int(consumption[item_id])), available)
			if amount <= 0:
				continue
			inventory[item_id] = available - amount
			consumed[item_id] = amount
			total_consumed += amount
		var production: Dictionary = row.get("local_production", {})
		var production_ids: Array = production.keys()
		production_ids.sort()
		for raw_id in production_ids:
			var item_id := String(raw_id)
			var current := maxi(0, int(inventory.get(item_id, 0)))
			var target := maxi(current, int(targets.get(item_id, current)))
			var amount := mini(maxi(0, int(production[item_id])), maxi(0, target - current))
			if amount <= 0:
				continue
			inventory[item_id] = current + amount
			produced[item_id] = amount
			var deficit: Dictionary = row.get("stolen_deficit", {})
			deficit[item_id] = maxi(0, int(deficit.get(item_id, 0)) - amount)
			row["stolen_deficit"] = deficit
		row["inventory"] = inventory
		var treasury_before := maxi(0, int(row["treasury"]))
		var treasury_target := maxi(treasury_before, int(row.get("treasury_target", treasury_before)))
		var revenue := mini(LOCAL_MEAT_REVENUE * total_consumed, maxi(0, treasury_target - treasury_before))
		row["treasury"] = treasury_before + revenue
		settlements[settlement_id] = row
		if not consumed.is_empty():
			events.append({"settlement_id": settlement_id, "kind": "local_consumption", "items": consumed, "treasury_revenue": revenue})
		if not produced.is_empty():
			events.append({"settlement_id": settlement_id, "kind": "local_production", "items": produced})
		if world.faction_authority != null and not world.faction_authority.has_raid_targeting(settlement_id):
			var before_security := security(settlement_id)
			var conflict: String = world.faction_authority.conflict_status(settlement_id)
			var recovery := 3 if conflict == "peace" else (2 if conflict == "occupied" else 1)
			var after_security := recover_security(settlement_id, recovery)
			if after_security > before_security:
				events.append({"settlement_id": settlement_id, "kind": "security_recovery", "amount": after_security - before_security, "security": after_security})
			if absolute_hour % 24 == 0 and after_security >= 75 and conflict != "occupied":
				var founding := String((settlements[settlement_id] as Dictionary).get("founding_faction", ""))
				var status_before := String(world.faction_authority.state(founding).get("status", "active"))
				var status_after: String = world.faction_authority.recover_status(founding)
				if status_after != status_before:
					events.append({"settlement_id": settlement_id, "kind": "faction_recovery", "from": status_before, "to": status_after})
	if absolute_hour % 24 == 0:
		events.append_array(apply_annexation_taxes())
	return {"hour": absolute_hour, "events": events}

func export_state() -> Array:
	var rows: Array = []
	for settlement_id in ids():
		var row: Dictionary = settlements[settlement_id]
		rows.append({
			"id": settlement_id,
			"inventory": (row["inventory"] as Dictionary).duplicate(true),
			"stolen_deficit": (row.get("stolen_deficit", {}) as Dictionary).duplicate(true),
			"treasury": maxi(0, int(row["treasury"])),
			"security": clampi(int(row.get("security", 100)), 0, 100),
		})
	return rows

func restore_state(raw) -> bool:
	if not raw is Array:
		return false
	var seen: Dictionary = {}
	var staged: Dictionary = {}
	for entry in raw:
		if not entry is Dictionary:
			return false
		var id := String((entry as Dictionary).get("id", ""))
		if not settlements.has(id) or seen.has(id):
			return false
		var treasury_value := int((entry as Dictionary).get("treasury", -1))
		var inventory_raw = (entry as Dictionary).get("inventory", {})
		if treasury_value < 0 or not inventory_raw is Dictionary:
			return false
		var security_value := int((entry as Dictionary).get("security", 100))
		if security_value < 0 or security_value > 100:
			return false
		staged[id] = {"inventory": _clean_counts(inventory_raw), "treasury": treasury_value, "stolen_deficit": _clean_counts(entry.get("stolen_deficit", {})), "security": security_value}
		seen[id] = true
	if seen.size() != settlements.size():
		return false
	for id in staged.keys():
		var row: Dictionary = settlements[id]
		var values: Dictionary = staged[id]
		row["inventory"] = (values["inventory"] as Dictionary).duplicate(true)
		row["treasury"] = int(values["treasury"])
		row["stolen_deficit"] = values["stolen_deficit"]
		row["security"] = int(values.get("security", 100))
		settlements[id] = row
	return true

func restore_generation3_state(raw) -> bool:
	if not raw is Array or raw.size() != 1:
		return false
	var entry = raw[0]
	if not entry is Dictionary or String(entry.get("id", "")) != "verdant_mossbridge":
		return false
	var treasury_value := int(entry.get("treasury", -1))
	var inventory_raw = entry.get("inventory", {})
	if treasury_value < 0 or not inventory_raw is Dictionary or not settlements.has("verdant_mossbridge"):
		return false
	var row: Dictionary = settlements["verdant_mossbridge"]
	row["inventory"] = _clean_counts(inventory_raw)
	row["treasury"] = treasury_value
	settlements["verdant_mossbridge"] = row
	return true

func security(settlement_id: String) -> int:
	return clampi(int((settlements.get(settlement_id, {}) as Dictionary).get("security", 100)), 0, 100)

func recover_security(settlement_id: String, amount: int) -> int:
	if not settlements.has(settlement_id) or amount <= 0:
		return security(settlement_id)
	var row: Dictionary = settlements[settlement_id]
	row["security"] = mini(100, security(settlement_id) + amount)
	settlements[settlement_id] = row
	return int(row["security"])

func apply_raid_pressure(settlement_id: String, pressure: int, attacker_faction: String) -> Dictionary:
	if not settlements.has(settlement_id) or pressure <= 0:
		return {"ok": false}
	var row: Dictionary = settlements[settlement_id]
	var before := security(settlement_id)
	row["security"] = maxi(0, before - pressure)
	var inventory: Dictionary = row["inventory"]
	var deficit: Dictionary = row.get("stolen_deficit", {})
	var lost: Dictionary = {}
	var budget := maxi(1, int(ceil(float(pressure) / 10.0)))
	var goods := inventory.keys()
	goods.sort()
	for raw_id in goods:
		if budget <= 0:
			break
		var item_id := String(raw_id)
		var available := maxi(0, int(inventory.get(item_id, 0)))
		if available <= 0:
			continue
		var amount := mini(available, budget)
		inventory[item_id] = available - amount
		deficit[item_id] = int(deficit.get(item_id, 0)) + amount
		lost[item_id] = amount
		budget -= amount
	row["inventory"] = inventory
	row["stolen_deficit"] = deficit
	var treasury_loss := mini(maxi(0, int(row["treasury"])), maxi(1, pressure / 2))
	row["treasury"] = maxi(0, int(row["treasury"]) - treasury_loss)
	settlements[settlement_id] = row
	return {"ok": true, "attacker": attacker_faction, "security_before": before, "security_after": int(row["security"]), "treasury_loss": treasury_loss, "items_lost": lost}

func settlement_for_faction(faction_id: String) -> String:
	for settlement_id in ids():
		if String((settlements[settlement_id] as Dictionary).get("founding_faction", "")) == faction_id:
			return settlement_id
	return ""

func apply_annexation_taxes() -> Array:
	var events: Array = []
	if world.faction_authority == null:
		return events
	for subject_id in ids():
		var row: Dictionary = settlements[subject_id]
		var founding := String(row.get("founding_faction", ""))
		var controller: String = world.faction_authority.controller_id(founding)
		if controller.is_empty() or controller == founding:
			continue
		var controller_settlement := settlement_for_faction(controller)
		if controller_settlement.is_empty() or controller_settlement == subject_id:
			continue
		var tax := mini(6, maxi(0, int(row.get("treasury", 0))))
		if tax <= 0:
			continue
		row["treasury"] = int(row["treasury"]) - tax
		settlements[subject_id] = row
		var controller_row: Dictionary = settlements[controller_settlement]
		controller_row["treasury"] = int(controller_row.get("treasury", 0)) + tax
		settlements[controller_settlement] = controller_row
		events.append({"kind": "occupation_tax", "subject_settlement": subject_id, "controller_settlement": controller_settlement, "amount": tax})
	return events

func _clean_counts(raw) -> Dictionary:
	var clean: Dictionary = {}
	if not raw is Dictionary:
		return clean
	for key in raw.keys():
		clean[String(key)] = maxi(0, int(raw[key]))
	return clean

func _decode_cell(raw) -> Vector2i:
	if raw is Array and raw.size() >= 2:
		return Vector2i(int(raw[0]), int(raw[1]))
	return Vector2i(99999, 99999)

func market_closed_to_player(settlement_id: String) -> bool:
	return world.faction_authority != null and world.faction_authority.hostile_to_player(world.faction_authority.controller_for_settlement(settlement_id))

func warehouse_key_id(settlement_id: String) -> String:
	return "warehouse_key:" + settlement_id

func warehouse_door(settlement_id: String) -> Vector2i:
	if not has(settlement_id):
		return Vector2i(99999, 99999)
	return ((settlements[settlement_id] as Dictionary)["anchor_cell"] as Vector2i) + Vector2i(-4, 0)

func warehouse_locked(settlement_id: String) -> bool:
	var door := warehouse_door(settlement_id)
	return world.has_cell(door) or world.has_cell(door + Vector2i.UP)

func at_warehouse(player, settlement_id: String) -> bool:
	return player != null and has(settlement_id) and player.global_position.distance_to(world.cell_center(warehouse_door(settlement_id))) <= 112.0

func unlock_warehouse(player, settlement_id: String) -> Dictionary:
	if not at_warehouse(player, settlement_id):
		return {"ok": false, "reason": "not_at_warehouse"}
	if not warehouse_locked(settlement_id):
		return {"ok": true}
	if player.item_count(warehouse_key_id(settlement_id)) <= 0:
		return {"ok": false, "reason": "key_required"}
	var door := warehouse_door(settlement_id)
	for cell in [door, door + Vector2i.UP]:
		if world.has_cell(cell):
			world.mine_at(cell, 100.0, "system:warehouse_unlock")
	# No duplicate lock flag: the physical door cells and their saved deltas are authoritative.
	return {"ok": not warehouse_locked(settlement_id)}

func loot_warehouse(player, settlement_id: String, item_id: String, quantity: int) -> Dictionary:
	if not at_warehouse(player, settlement_id):
		return {"ok": false, "reason": "not_at_warehouse"}
	if warehouse_locked(settlement_id):
		return {"ok": false, "reason": "locked"}
	if quantity not in [1, 5] or item_id not in accepted_goods(settlement_id) or item_count(settlement_id, item_id) < quantity:
		return {"ok": false, "reason": "stock_short"}
	if not player.can_carry(item_id, quantity):
		return {"ok": false, "reason": "overburdened"}
	var row: Dictionary = settlements[settlement_id]
	var inventory: Dictionary = row["inventory"]
	inventory[item_id] = int(inventory[item_id]) - quantity
	var deficit: Dictionary = row.get("stolen_deficit", {})
	deficit[item_id] = int(deficit.get(item_id, 0)) + quantity
	row["stolen_deficit"] = deficit
	row["inventory"] = inventory
	settlements[settlement_id] = row
	player.add_item(item_id, quantity)
	world.faction_authority.record_player_crime(world.faction_authority.controller_for_settlement(settlement_id), quantity * 25)
	return {"ok": true, "quantity": quantity}

func _relieve_stolen_deficit(settlement_id: String, item_id: String, amount: int) -> void:
	var row: Dictionary = settlements[settlement_id]
	var deficit: Dictionary = row.get("stolen_deficit", {})
	deficit[item_id] = maxi(0, int(deficit.get(item_id, 0)) - amount)
	row["stolen_deficit"] = deficit
	settlements[settlement_id] = row

# Purchase is paid into the same settlement treasury as ordinary retail.
func pay_for_pack_beast(player, settlement_id: String) -> bool:
	if not settlements.has(settlement_id) or nearby_market(player.global_position) != settlement_id or market_closed_to_player(settlement_id) or player.forge_marks < 240:
		return false
	player.forge_marks -= 240
	var row: Dictionary = settlements[settlement_id]
	row["treasury"] = int(row.get("treasury", 0)) + 240
	return true
