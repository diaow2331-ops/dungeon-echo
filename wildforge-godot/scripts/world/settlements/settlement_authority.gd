class_name SliceSettlementAuthority
extends RefCounted

var world
var settlements: Dictionary = {}
var caravans: Dictionary = {}
var caravan_serial := 0
var caravan_incident_cooldowns: Dictionary = {}
var displacements: Dictionary = {}
var displacement_serial := 0

const LOCAL_CONSUMPTION_INTERVAL_HOURS := 4
const LOCAL_MEAT_REVENUE := 2
const CARAVAN_DISPATCH_INTERVAL_HOURS := 12
const CARAVAN_MAX_ACTIVE := 2
const CARAVAN_MAX_LOAD := 4
const CARAVAN_EXPORT_FLOOR_RATIO := 0.55
const CARAVAN_MIN_TRAVEL_HOURS := 4
const CARAVAN_CELLS_PER_HOUR := 80.0
const SHORTAGE_STRAINED_RATIO := 0.50
const SHORTAGE_CRITICAL_RATIO := 0.25
const SHORTAGE_LOGISTICS_SCORE := 420
const ROUTE_REPAIR_INTERVAL_HOURS := 4
const ROUTE_REPAIR_ACCEL_HOURS := 4
const PLAYER_ROUTE_REPAIR_ACCEL_HOURS := 6
const PLAYER_ROUTE_REPAIR_RADIUS := 132.0
const PLAYER_RELIEF_SECURITY_CRITICAL := 2
const PLAYER_RELIEF_SECURITY_STRAINED := 1
const ROUTE_REPAIR_TREASURY_COST := 2
const ROUTE_REPAIR_MATERIALS := ["wood", "sandstone", "basalt"]
const RETURN_MIGRATION_INTERVAL_HOURS := 24
const RETURN_MIGRATION_SECURITY := 85
const MERCHANT_REPLACEMENT_TREASURY_COST := 8
const GUARD_REPLACEMENT_TREASURY_COST := 12
const CARAVAN_INCIDENT_COOLDOWN_HOURS := 24
const CARAVAN_INCIDENT_TENSION_SCORE := -35
const CARAVAN_INCIDENT_SECURITY_THRESHOLD := 65
const DISPLACEMENT_MAX_ACTIVE := 2
const DISPLACEMENT_GROUP_SIZE := 3
const DISPLACEMENT_TRIGGER_SECURITY := 35
const DISPLACEMENT_COOLDOWN_HOURS := 24
const DISPLACEMENT_MIN_POPULATION := 6
const DISPLACEMENT_CELLS_PER_HOUR := 72.0

func _init(owner_world) -> void:
	world = owner_world

func register_baseline(raw_settlements: Array) -> int:
	settlements.clear()
	caravans.clear()
	caravan_serial = 0
	caravan_incident_cooldowns.clear()
	displacements.clear()
	displacement_serial = 0
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
			"jail_cell": _decode_cell(spec.get("jail_cell", [])),
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
			"population": maxi(1, int(spec.get("initial_population", 24))),
			"population_baseline": maxi(1, int(spec.get("initial_population", 24))),
			"next_displacement_hour": 0,
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

func jail_cell(settlement_id: String) -> Vector2i:
	if not settlements.has(settlement_id):
		return Vector2i(99999, 99999)
	return (settlements[settlement_id] as Dictionary)["jail_cell"]

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

func population(settlement_id: String) -> int:
	return maxi(0, int((settlements.get(settlement_id, {}) as Dictionary).get("population", 0)))

func population_baseline(settlement_id: String) -> int:
	return maxi(1, int((settlements.get(settlement_id, {}) as Dictionary).get("population_baseline", 1)))

func effective_target(settlement_id: String, item_id: String) -> int:
	if not settlements.has(settlement_id):
		return 0
	var row: Dictionary = settlements[settlement_id]
	var base := maxi(0, int((row.get("targets", {}) as Dictionary).get(item_id, 0)))
	if base <= 0 or not (row.get("local_consumption", {}) as Dictionary).has(item_id):
		return base
	var baseline := population_baseline(settlement_id)
	var people := population(settlement_id)
	return maxi(1, int(ceil(float(base) * float(maxi(1, people)) / float(baseline))))

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

func shortage_pressure(settlement_id: String, item_id: String) -> float:
	var target := effective_target(settlement_id, item_id)
	if target <= 0:
		return 0.0
	return clampf(float(maxi(0, target - item_count(settlement_id, item_id))) / float(target), 0.0, 1.0)

func shortage_severity(settlement_id: String, item_id: String) -> String:
	var target := effective_target(settlement_id, item_id)
	if target <= 0:
		return "stable"
	var stock_ratio := float(item_count(settlement_id, item_id)) / float(target)
	if stock_ratio <= SHORTAGE_CRITICAL_RATIO:
		return "critical"
	if stock_ratio <= SHORTAGE_STRAINED_RATIO:
		return "strained"
	return "stable"

func shortage_state(settlement_id: String) -> Dictionary:
	if not settlements.has(settlement_id):
		return {}
	var goods: Array = []
	var highest := 0.0
	for item_id in accepted_goods(settlement_id):
		var target := effective_target(settlement_id, item_id)
		if target <= 0:
			continue
		var stock := item_count(settlement_id, item_id)
		var pressure := shortage_pressure(settlement_id, item_id)
		if pressure < (1.0 - SHORTAGE_STRAINED_RATIO):
			continue
		var severity := shortage_severity(settlement_id, item_id)
		goods.append({"item_id": item_id, "stock": stock, "target": target, "deficit": maxi(0, target - stock), "pressure": pressure, "severity": severity, "unit_price": buy_price(settlement_id, item_id)})
		highest = maxf(highest, pressure)
	goods.sort_custom(func(a, b):
		var ap := float((a as Dictionary).get("pressure", 0.0))
		var bp := float((b as Dictionary).get("pressure", 0.0))
		if not is_equal_approx(ap, bp):
			return ap > bp
		return String((a as Dictionary).get("item_id", "")) < String((b as Dictionary).get("item_id", ""))
	)
	var overall := "stable"
	if not goods.is_empty():
		overall = "critical" if String((goods[0] as Dictionary).get("severity", "")) == "critical" else "strained"
	return {"settlement_id": settlement_id, "severity": overall, "pressure": highest, "goods": goods, "population": population(settlement_id), "security": security(settlement_id), "conflict": world.faction_authority.conflict_status(settlement_id) if world.faction_authority != null else "peace"}

func urgent_shortages() -> Array:
	var rows: Array = []
	for settlement_id in ids():
		var shortage := shortage_state(settlement_id)
		if String(shortage.get("severity", "stable")) != "stable":
			rows.append(shortage)
	rows.sort_custom(func(a, b):
		var ap := float((a as Dictionary).get("pressure", 0.0))
		var bp := float((b as Dictionary).get("pressure", 0.0))
		if not is_equal_approx(ap, bp):
			return ap > bp
		return String((a as Dictionary).get("settlement_id", "")) < String((b as Dictionary).get("settlement_id", ""))
	)
	return rows

func relief_opportunities() -> Array:
	# Read-only crisis leads derived from real shortages and local geography.
	var rows: Array = []
	for shortage_raw in urgent_shortages():
		var shortage: Dictionary = shortage_raw
		var settlement_id := String(shortage.get("settlement_id", ""))
		var production := production_profile(settlement_id)
		for good_raw in shortage.get("goods", []):
			var good: Dictionary = good_raw
			var item_id := String(good.get("item_id", ""))
			if item_id.is_empty() or int(production.get(item_id, 0)) > 0:
				continue
			rows.append({
				"settlement_id": settlement_id,
				"item_id": item_id,
				"severity": String(good.get("severity", "strained")),
				"pressure": float(good.get("pressure", 0.0)),
				"deficit": int(good.get("deficit", 0)),
				"security": security(settlement_id),
			})
	rows.sort_custom(func(a, b):
		var ad: Dictionary = a
		var bd: Dictionary = b
		var ac := 1 if String(ad.get("severity", "")) == "critical" else 0
		var bc := 1 if String(bd.get("severity", "")) == "critical" else 0
		if ac != bc:
			return ac > bc
		var ap := float(ad.get("pressure", 0.0))
		var bp := float(bd.get("pressure", 0.0))
		if not is_equal_approx(ap, bp):
			return ap > bp
		var at := String(ad.get("settlement_id", "")) + ":" + String(ad.get("item_id", ""))
		var bt := String(bd.get("settlement_id", "")) + ":" + String(bd.get("item_id", ""))
		return at < bt
	)
	return rows

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
	var target := maxi(1, effective_target(settlement_id, item_id))
	var ratio := float(maxi(0, stock)) / float(target)
	var shortage := clampf(1.0 - ratio, 0.0, 1.0)
	var loss := int((row.get("stolen_deficit", {}) as Dictionary).get(item_id, 0))
	# Ordinary demand moves gently; physical supply destruction drives crises.
	var crisis := clampf(float(loss) / float(target), 0.0, 1.0) * shortage
	# A severe real shortage creates a bounded transport premium; replenishment removes it automatically.
	var emergency := maxf(0.0, shortage - 0.5) * 0.8
	var security_factor := (1.0 - float(security(settlement_id)) / 100.0) * 0.35
	var factor := 1.0 + shortage * 0.08 + emergency + crisis * 1.5 + security_factor
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
	var target := maxi(0, effective_target(settlement_id, item_id))
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
		"shortage_pressure": shortage_pressure(settlement_id, item_id),
		"shortage_severity": shortage_severity(settlement_id, item_id),
		"crisis": int((row.get("stolen_deficit", {}) as Dictionary).get(item_id, 0)) > 0,
	}

func sell_from_player(player, settlement_id: String, item_id: String, quantity := 1) -> Dictionary:
	if world.progression_authority != null and not world.progression_authority.allows_local_market():
		return {"ok": false, "reason": "era_locked"}
	if player == null or not settlements.has(settlement_id) or quantity <= 0:
		return {"ok": false, "reason": "invalid_trade"}
	if nearby_market(player.global_position) != settlement_id:
		return {"ok": false, "reason": "not_at_market"}
	if market_closed_to_player(settlement_id):
		return {"ok": false, "reason": "wanted"}
	if player.item_count(item_id) < quantity:
		return {"ok": false, "reason": "insufficient_goods"}
	var local_stolen := int(((settlements[settlement_id] as Dictionary).get("stolen_deficit", {}) as Dictionary).get(item_id, 0))
	if local_stolen > 0:
		return {"ok": false, "reason": "stolen_goods", "stolen_quantity": local_stolen}
	var shortage_before: String = shortage_severity(settlement_id, item_id)
	var external_need: bool = int(production_profile(settlement_id).get(item_id, 0)) <= 0
	var conflict_before: String = String(world.faction_authority.conflict_status(settlement_id)) if world.faction_authority != null else "peace"
	var quote: Dictionary = sale_quote(settlement_id, item_id, quantity)
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
	var security_recovered: int = 0
	if conflict_before in ["war", "raid"]:
		security_recovered = mini(quantity, 3)
	elif world.progression_authority != null and world.progression_authority.allows_tension() and external_need:
		if shortage_before == "critical":
			security_recovered = mini(quantity, PLAYER_RELIEF_SECURITY_CRITICAL)
		elif shortage_before == "strained":
			security_recovered = mini(quantity, PLAYER_RELIEF_SECURITY_STRAINED)
	if security_recovered > 0:
		var before_security: int = security(settlement_id)
		recover_security(settlement_id, security_recovered)
		security_recovered = security(settlement_id) - before_security
	return {"ok": true, "item_id": item_id, "quantity": quantity, "unit_price": unit_price, "total": total, "shortage_before": shortage_before, "external_need": external_need, "security_recovered": security_recovered}

# Retail is priced after each withdrawal. Buying then selling to the same
# stock level therefore always loses the spread, including bulk trades.
func purchase_quote(settlement_id: String, item_id: String, quantity := 1) -> Dictionary:
	if not settlements.has(settlement_id) or quantity <= 0 or quantity > 99:
		return {"ok": false, "reason": "invalid_trade"}
	if item_id not in accepted_goods(settlement_id):
		return {"ok": false, "reason": "not_sold_here"}
	var stock := item_count(settlement_id, item_id)
	var row: Dictionary = settlements[settlement_id]
	var target := effective_target(settlement_id, item_id)
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
	if world.progression_authority != null and not world.progression_authority.allows_local_market():
		return {"ok": false, "reason": "era_locked"}
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
	if absolute_hour < 0:
		return {"hour": absolute_hour, "events": events}
	_prune_route_hazards(absolute_hour)
	events.append_array(_advance_displacements(absolute_hour))
	events.append_array(_advance_caravans(absolute_hour))
	if absolute_hour % LOCAL_CONSUMPTION_INTERVAL_HOURS != 0:
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
			var target := maxi(current, effective_target(settlement_id, item_id))
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
			var before_security: int = security(settlement_id)
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
	if absolute_hour % RETURN_MIGRATION_INTERVAL_HOURS == 0:
		events.append_array(_maybe_start_return_migrations(absolute_hour))
	events.append_array(_maintain_route_hazards(absolute_hour))
	if absolute_hour % 24 == 0:
		events.append_array(apply_annexation_taxes())
	if absolute_hour % CARAVAN_DISPATCH_INTERVAL_HOURS == 0:
		events.append_array(_dispatch_caravans(absolute_hour))
	return {"hour": absolute_hour, "events": events}

func active_caravans() -> Array:
	var rows: Array = []
	var keys := caravans.keys()
	keys.sort()
	for raw_id in keys:
		rows.append((caravans[raw_id] as Dictionary).duplicate(true))
	return rows

func caravan_cell(caravan_id: String, absolute_hour := -1) -> Vector2i:
	if not caravans.has(caravan_id):
		return Vector2i(99999, 99999)
	var caravan: Dictionary = caravans[caravan_id]
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	if not has(origin) or not has(destination):
		return Vector2i(99999, 99999)
	var hour: int = world.absolute_world_hour() if absolute_hour < 0 else absolute_hour
	var depart := int(caravan.get("depart_hour", hour))
	var arrival := maxi(depart + 1, int(caravan.get("arrival_hour", depart + 1)))
	var progress := clampf(float(hour - depart) / float(arrival - depart), 0.0, 1.0)
	var ox := market_cell(origin).x
	var dx := market_cell(destination).x
	var x := clampi(roundi(lerpf(float(ox), float(dx), progress)), SliceWorld.MIN_X + 2, SliceWorld.MAX_X - 2)
	return Vector2i(x, world.surface_y_at(x) - 1)

func export_caravans() -> Dictionary:
	return {"serial": caravan_serial, "active": active_caravans(), "incident_cooldowns": caravan_incident_cooldowns.duplicate(true)}

func restore_caravans(raw) -> bool:
	caravans.clear()
	caravan_serial = 0
	caravan_incident_cooldowns.clear()
	if raw == null or (raw is Dictionary and raw.is_empty()):
		return true
	if not raw is Dictionary:
		return false
	var serial := int(raw.get("serial", 0))
	var active = raw.get("active", [])
	var incident_cooldowns = raw.get("incident_cooldowns", {})
	if serial < 0 or not active is Array or active.size() > CARAVAN_MAX_ACTIVE or not incident_cooldowns is Dictionary:
		return false
	var staged: Dictionary = {}
	var max_active_serial := -1
	for entry in active:
		if not entry is Dictionary:
			return false
		var row: Dictionary = (entry as Dictionary).duplicate(true)
		var id := String(row.get("id", ""))
		if not id.begins_with("caravan:"):
			return false
		var id_suffix := id.trim_prefix("caravan:")
		if not id_suffix.is_valid_int():
			return false
		max_active_serial = maxi(max_active_serial, int(id_suffix))
		var origin := String(row.get("origin", ""))
		var destination := String(row.get("destination", ""))
		var item_id := String(row.get("item_id", ""))
		var quantity := int(row.get("quantity", 0))
		var depart := int(row.get("depart_hour", -1))
		var arrival := int(row.get("arrival_hour", -1))
		if id.is_empty() or staged.has(id) or not has(origin) or not has(destination) or origin == destination:
			return false
		if item_id not in accepted_goods(origin) or item_id not in accepted_goods(destination) or quantity <= 0 or quantity > CARAVAN_MAX_LOAD:
			return false
		if depart < 0 or arrival <= depart or int(row.get("payment", -1)) < 0:
			return false
		staged[id] = row
	if serial <= max_active_serial:
		return false
	var staged_cooldowns: Dictionary = {}
	for raw_key in incident_cooldowns.keys():
		var key := String(raw_key)
		var until_hour := int(incident_cooldowns[raw_key])
		if not _valid_route_pair_key(key) or until_hour < 0:
			return false
		staged_cooldowns[key] = until_hour
	caravans = staged
	caravan_serial = serial
	caravan_incident_cooldowns = staged_cooldowns
	return true

func _advance_caravans(absolute_hour: int) -> Array:
	var events: Array = []
	var keys := caravans.keys()
	keys.sort()
	for raw_id in keys:
		var caravan_id := String(raw_id)
		if not caravans.has(caravan_id):
			continue
		var caravan: Dictionary = caravans[caravan_id]
		var origin := String(caravan.get("origin", ""))
		var destination := String(caravan.get("destination", ""))
		if _route_blocked(origin, destination):
			_return_caravan(caravan)
			caravans.erase(caravan_id)
			events.append({"kind": "caravan_returned", "caravan_id": caravan_id, "origin": origin, "destination": destination, "reason": "war"})
			continue
		if not bool(caravan.get("incident_checked", false)) and absolute_hour >= _caravan_midpoint_hour(caravan):
			caravan["incident_checked"] = true
			caravans[caravan_id] = caravan
			if _caravan_incident_due(caravan, absolute_hour):
				var incident := _apply_caravan_incident(caravan_id, absolute_hour)
				if not incident.is_empty():
					events.append(incident)
				if not caravans.has(caravan_id):
					continue
				caravan = caravans[caravan_id]
		if absolute_hour < int(caravan.get("arrival_hour", 0)):
			continue
		var item_id := String(caravan.get("item_id", ""))
		var quantity := maxi(0, int(caravan.get("quantity", 0)))
		var payment := maxi(0, int(caravan.get("payment", 0)))
		var destination_row: Dictionary = settlements[destination]
		var destination_inventory: Dictionary = destination_row["inventory"]
		destination_inventory[item_id] = maxi(0, int(destination_inventory.get(item_id, 0))) + quantity
		destination_row["inventory"] = destination_inventory
		settlements[destination] = destination_row
		_relieve_stolen_deficit(destination, item_id, quantity)
		var origin_row: Dictionary = settlements[origin]
		origin_row["treasury"] = maxi(0, int(origin_row.get("treasury", 0))) + payment
		settlements[origin] = origin_row
		var diplomacy: Dictionary = {}
		if world.faction_authority != null:
			diplomacy = world.faction_authority.record_caravan_arrival(origin, destination, payment)
		caravans.erase(caravan_id)
		events.append({"kind": "caravan_arrived", "caravan_id": caravan_id, "origin": origin, "destination": destination, "item_id": item_id, "quantity": quantity, "payment": payment, "diplomacy": diplomacy})
	return events

func _dispatch_caravans(absolute_hour: int) -> Array:
	var events: Array = []
	if world.progression_authority != null and not world.progression_authority.allows_autonomous_caravans():
		return events
	while caravans.size() < CARAVAN_MAX_ACTIVE:
		var candidate := _best_caravan_candidate(absolute_hour)
		if candidate.is_empty():
			break
		var dispatched := _dispatch_caravan(candidate, absolute_hour)
		if dispatched.is_empty():
			break
		events.append(dispatched)
	return events

func _best_caravan_candidate(absolute_hour: int) -> Dictionary:
	var best: Dictionary = {}
	var best_score := -1
	for origin in ids():
		var origin_row: Dictionary = settlements[origin]
		var production: Dictionary = origin_row.get("local_production", {})
		var goods := production.keys()
		goods.sort()
		for raw_item in goods:
			var item_id := String(raw_item)
			var target := maxi(1, effective_target(origin, item_id))
			var export_floor := int(ceil(float(target) * CARAVAN_EXPORT_FLOOR_RATIO))
			var surplus := maxi(0, item_count(origin, item_id) - export_floor)
			if surplus <= 0:
				continue
			for destination in ids():
				if destination == origin or _route_blocked(origin, destination) or _route_hazard_active(origin, destination, absolute_hour) or _has_caravan_for_item(origin, destination, item_id):
					continue
				if item_id not in accepted_goods(destination):
					continue
				var destination_row: Dictionary = settlements[destination]
				var destination_target := maxi(0, effective_target(destination, item_id))
				var need := maxi(0, destination_target - item_count(destination, item_id))
				if need <= 0:
					continue
				var cap := CARAVAN_MAX_LOAD
				if world.faction_authority != null:
					var origin_conflict: String = world.faction_authority.conflict_status(origin)
					var destination_conflict: String = world.faction_authority.conflict_status(destination)
					if "raid" in [origin_conflict, destination_conflict]:
						continue
					if "war" in [origin_conflict, destination_conflict]:
						cap = 1
					elif "tense" in [origin_conflict, destination_conflict]:
						cap = 2
				var quantity := mini(cap, mini(surplus, need))
				var quote := sale_quote(destination, item_id, quantity)
				if quantity <= 0 or not bool(quote.get("ok", false)) or not bool(quote.get("affordable", false)) or not bool(quote.get("demand_met", false)):
					continue
				var distance := absi(market_cell(destination).x - market_cell(origin).x)
				var urgency := int(round(shortage_pressure(destination, item_id) * SHORTAGE_LOGISTICS_SCORE))
				var score := need * 100 + urgency + int(quote.get("total", 0)) * 4 - distance / 20
				var tie := "%s|%s|%s" % [origin, destination, item_id]
				var best_tie := "%s|%s|%s" % [String(best.get("origin", "~")), String(best.get("destination", "~")), String(best.get("item_id", "~"))]
				if score > best_score or (score == best_score and tie < best_tie):
					best_score = score
					best = {"origin": origin, "destination": destination, "item_id": item_id, "quantity": quantity, "payment": int(quote.get("total", 0)), "distance": distance, "hour": absolute_hour}
	return best

func _dispatch_caravan(candidate: Dictionary, absolute_hour: int) -> Dictionary:
	var origin := String(candidate.get("origin", ""))
	var destination := String(candidate.get("destination", ""))
	var item_id := String(candidate.get("item_id", ""))
	var quantity := int(candidate.get("quantity", 0))
	var payment := int(candidate.get("payment", 0))
	if not has(origin) or not has(destination) or quantity <= 0 or _route_blocked(origin, destination) or _route_hazard_active(origin, destination, absolute_hour):
		return {}
	if item_count(origin, item_id) < quantity or treasury(destination) < payment:
		return {}
	var origin_row: Dictionary = settlements[origin]
	var origin_inventory: Dictionary = origin_row["inventory"]
	origin_inventory[item_id] = int(origin_inventory.get(item_id, 0)) - quantity
	origin_row["inventory"] = origin_inventory
	settlements[origin] = origin_row
	var destination_row: Dictionary = settlements[destination]
	destination_row["treasury"] = int(destination_row.get("treasury", 0)) - payment
	settlements[destination] = destination_row
	var distance := absi(market_cell(destination).x - market_cell(origin).x)
	var travel_hours := maxi(CARAVAN_MIN_TRAVEL_HOURS, int(ceil(float(distance) / CARAVAN_CELLS_PER_HOUR)))
	var caravan_id := "caravan:%d" % caravan_serial
	caravan_serial += 1
	caravans[caravan_id] = {"id": caravan_id, "origin": origin, "destination": destination, "item_id": item_id, "quantity": quantity, "payment": payment, "depart_hour": absolute_hour, "arrival_hour": absolute_hour + travel_hours, "incident_checked": false}
	return {"kind": "caravan_departed", "caravan_id": caravan_id, "origin": origin, "destination": destination, "item_id": item_id, "quantity": quantity, "payment": payment, "arrival_hour": absolute_hour + travel_hours}

func _caravan_midpoint_hour(caravan: Dictionary) -> int:
	var depart := int(caravan.get("depart_hour", 0))
	var arrival := maxi(depart + 1, int(caravan.get("arrival_hour", depart + 1)))
	return depart + maxi(1, int(ceil(float(arrival - depart) * 0.5)))

func _route_pair_key(origin: String, destination: String) -> String:
	return origin + "|" + destination if origin < destination else destination + "|" + origin

func _valid_route_pair_key(key: String) -> bool:
	var pair := key.split("|")
	return pair.size() == 2 and has(String(pair[0])) and has(String(pair[1])) and String(pair[0]) != String(pair[1])

func _caravan_incident_due(caravan: Dictionary, absolute_hour: int) -> bool:
	if world.progression_authority != null and not world.progression_authority.allows_route_incidents():
		return false
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	if not has(origin) or not has(destination) or world.faction_authority == null:
		return false
	var key := _route_pair_key(origin, destination)
	if absolute_hour < int(caravan_incident_cooldowns.get(key, 0)):
		return false
	var a: String = world.faction_authority.controller_for_settlement(origin)
	var b: String = world.faction_authority.controller_for_settlement(destination)
	if a == b:
		return false
	var relation_score := int(world.faction_authority.relation(a, b).get("score", 0))
	var unsafe_endpoint := mini(security(origin), security(destination)) <= CARAVAN_INCIDENT_SECURITY_THRESHOLD
	return relation_score <= CARAVAN_INCIDENT_TENSION_SCORE or unsafe_endpoint

func _apply_caravan_incident(caravan_id: String, absolute_hour: int) -> Dictionary:
	if not caravans.has(caravan_id):
		return {}
	var caravan: Dictionary = caravans[caravan_id]
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	var item_id := String(caravan.get("item_id", ""))
	var quantity := maxi(0, int(caravan.get("quantity", 0)))
	var payment := maxi(0, int(caravan.get("payment", 0)))
	if quantity <= 0 or item_id.is_empty():
		return {}
	var spill_cell := caravan_cell(caravan_id, absolute_hour)
	var lost_quantity := maxi(1, int(ceil(float(quantity) * 0.5)))
	lost_quantity = mini(lost_quantity, quantity)
	var refund := mini(payment, int(round(float(payment) * float(lost_quantity) / float(quantity))))
	var remaining := quantity - lost_quantity
	if has(destination) and refund > 0:
		var destination_row: Dictionary = settlements[destination]
		destination_row["treasury"] = maxi(0, int(destination_row.get("treasury", 0))) + refund
		settlements[destination] = destination_row
	var relation_shift: Dictionary = {}
	if world.faction_authority != null:
		relation_shift = world.faction_authority.record_caravan_attack(origin, destination, lost_quantity)
	caravan_incident_cooldowns[_route_pair_key(origin, destination)] = absolute_hour + CARAVAN_INCIDENT_COOLDOWN_HOURS
	if remaining <= 0:
		caravans.erase(caravan_id)
	else:
		caravan["quantity"] = remaining
		caravan["payment"] = maxi(0, payment - refund)
		caravan["incident_checked"] = true
		caravans[caravan_id] = caravan
	return {"kind": "caravan_attacked", "hour": absolute_hour, "caravan_id": caravan_id, "origin": origin, "destination": destination, "item_id": item_id, "lost_items": {item_id: lost_quantity}, "spill_cell": spill_cell, "destroyed": remaining <= 0, "remaining": remaining, "refund": refund, "relation": relation_shift}

func _return_caravan(caravan: Dictionary) -> void:
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	var item_id := String(caravan.get("item_id", ""))
	var quantity := maxi(0, int(caravan.get("quantity", 0)))
	var payment := maxi(0, int(caravan.get("payment", 0)))
	if has(origin):
		var origin_row: Dictionary = settlements[origin]
		var inventory: Dictionary = origin_row["inventory"]
		inventory[item_id] = maxi(0, int(inventory.get(item_id, 0))) + quantity
		origin_row["inventory"] = inventory
		settlements[origin] = origin_row
	if has(destination):
		var destination_row: Dictionary = settlements[destination]
		destination_row["treasury"] = maxi(0, int(destination_row.get("treasury", 0))) + payment
		settlements[destination] = destination_row

func _route_hazard_active(origin: String, destination: String, absolute_hour := -1) -> bool:
	if not has(origin) or not has(destination) or origin == destination:
		return false
	var hour: int = world.absolute_world_hour() if absolute_hour < 0 else absolute_hour
	return hour < int(caravan_incident_cooldowns.get(_route_pair_key(origin, destination), 0))

func active_route_hazards(absolute_hour := -1) -> Array:
	var hour: int = world.absolute_world_hour() if absolute_hour < 0 else absolute_hour
	var rows: Array = []
	var keys := caravan_incident_cooldowns.keys()
	keys.sort()
	for raw_key in keys:
		var key := String(raw_key)
		var until_hour := int(caravan_incident_cooldowns.get(key, 0))
		if until_hour <= hour or not _valid_route_pair_key(key):
			continue
		var pair := key.split("|")
		var a := String(pair[0])
		var b := String(pair[1])
		rows.append({"id": "route_hazard:" + key, "pair_key": key, "origin": a, "destination": b, "until_hour": until_hour, "cell": route_hazard_cell(key)})
	return rows

func route_hazard_cell(pair_key: String) -> Vector2i:
	if not _valid_route_pair_key(pair_key):
		return Vector2i(99999, 99999)
	var pair := pair_key.split("|")
	var ax := market_cell(String(pair[0])).x
	var bx := market_cell(String(pair[1])).x
	var x := clampi(roundi((float(ax) + float(bx)) * 0.5), SliceWorld.MIN_X + 2, SliceWorld.MAX_X - 2)
	return Vector2i(x, world.surface_y_at(x) - 1)

func nearby_route_hazard(at: Vector2, radius := PLAYER_ROUTE_REPAIR_RADIUS) -> Dictionary:
	var best: Dictionary = {}
	var best_distance := radius
	for raw_hazard in active_route_hazards():
		var hazard: Dictionary = raw_hazard
		var cell: Vector2i = hazard.get("cell", Vector2i(99999, 99999))
		var distance := at.distance_to(world.cell_center(cell))
		if distance <= best_distance:
			best_distance = distance
			best = hazard.duplicate(true)
	if not best.is_empty():
		best["distance"] = best_distance
	return best

func player_route_repair(player, pair_key: String) -> Dictionary:
	if world.progression_authority != null and not world.progression_authority.allows_route_incidents():
		return {"ok": false, "reason": "era_locked"}
	if player == null or not _valid_route_pair_key(pair_key):
		return {"ok": false, "reason": "invalid_route"}
	var now: int = int(world.absolute_world_hour())
	var until_hour := int(caravan_incident_cooldowns.get(pair_key, 0))
	if until_hour <= now:
		return {"ok": false, "reason": "route_clear"}
	var hazard_cell: Vector2i = route_hazard_cell(pair_key)
	if player.global_position.distance_to(world.cell_center(hazard_cell)) > PLAYER_ROUTE_REPAIR_RADIUS:
		return {"ok": false, "reason": "too_far"}
	var material: String = ""
	for item_id in ROUTE_REPAIR_MATERIALS:
		if player.item_count(item_id) > 0:
			material = item_id
			break
	if material.is_empty():
		return {"ok": false, "reason": "material_short"}
	if not player.spend_item(material, 1):
		return {"ok": false, "reason": "material_short"}
	var reduced: int = mini(PLAYER_ROUTE_REPAIR_ACCEL_HOURS, maxi(0, until_hour - now))
	var after_until: int = maxi(now, until_hour - reduced)
	if after_until <= now:
		caravan_incident_cooldowns.erase(pair_key)
	else:
		caravan_incident_cooldowns[pair_key] = after_until
	return {"ok": true, "pair_key": pair_key, "material": material, "hours_reduced": reduced, "until_hour": after_until, "cleared": after_until <= now}

func _prune_route_hazards(absolute_hour: int) -> void:
	for raw_key in caravan_incident_cooldowns.keys().duplicate():
		if int(caravan_incident_cooldowns.get(raw_key, 0)) <= absolute_hour:
			caravan_incident_cooldowns.erase(raw_key)

func _route_repair_material(settlement_id: String) -> String:
	if not has(settlement_id) or treasury(settlement_id) < ROUTE_REPAIR_TREASURY_COST:
		return ""
	var production := production_profile(settlement_id)
	for item_id in ROUTE_REPAIR_MATERIALS:
		if not production.has(item_id):
			continue
		var target := maxi(1, effective_target(settlement_id, item_id))
		var reserve := int(ceil(float(target) * 0.40))
		if item_count(settlement_id, item_id) > reserve:
			return item_id
	return ""

func _spend_route_repair(settlement_id: String, item_id: String) -> bool:
	if item_id.is_empty() or not has(settlement_id) or treasury(settlement_id) < ROUTE_REPAIR_TREASURY_COST or item_count(settlement_id, item_id) <= 0:
		return false
	var row: Dictionary = settlements[settlement_id]
	var inventory: Dictionary = row["inventory"]
	inventory[item_id] = maxi(0, int(inventory.get(item_id, 0)) - 1)
	row["inventory"] = inventory
	row["treasury"] = maxi(0, int(row.get("treasury", 0)) - ROUTE_REPAIR_TREASURY_COST)
	settlements[settlement_id] = row
	return true

func _maintain_route_hazards(absolute_hour: int) -> Array:
	var events: Array = []
	if absolute_hour <= 0 or absolute_hour % ROUTE_REPAIR_INTERVAL_HOURS != 0:
		return events
	for hazard in active_route_hazards(absolute_hour):
		var row: Dictionary = hazard
		var key := String(row.get("pair_key", ""))
		var origin := String(row.get("origin", ""))
		var destination := String(row.get("destination", ""))
		var contributors: Array = []
		var materials: Dictionary = {}
		for settlement_id in [origin, destination]:
			var material := _route_repair_material(settlement_id)
			if material.is_empty() or not _spend_route_repair(settlement_id, material):
				continue
			contributors.append(settlement_id)
			materials[settlement_id] = material
		if contributors.is_empty():
			continue
		var before_until := int(caravan_incident_cooldowns.get(key, absolute_hour))
		var reduced := ROUTE_REPAIR_ACCEL_HOURS * contributors.size()
		var after_until := maxi(absolute_hour, before_until - reduced)
		if after_until <= absolute_hour:
			caravan_incident_cooldowns.erase(key)
		else:
			caravan_incident_cooldowns[key] = after_until
		events.append({"kind": "route_repair", "pair_key": key, "origin": origin, "destination": destination, "contributors": contributors, "materials": materials, "treasury_cost_each": ROUTE_REPAIR_TREASURY_COST, "hours_reduced": mini(reduced, maxi(0, before_until - absolute_hour)), "until_hour": after_until, "cleared": after_until <= absolute_hour})
	return events

func _route_blocked(origin: String, destination: String) -> bool:
	if not has(origin) or not has(destination):
		return true
	if world.faction_authority == null:
		return false
	var a: String = world.faction_authority.controller_for_settlement(origin)
	var b: String = world.faction_authority.controller_for_settlement(destination)
	if a == b:
		return false
	return String(world.faction_authority.relation(a, b).get("stance", "neutral")) == "war"

func has_caravan_route(origin: String, destination: String, item_id: String) -> bool:
	return _has_caravan_for_item(origin, destination, item_id)

func _has_caravan_for_item(origin: String, destination: String, item_id: String) -> bool:
	for raw in caravans.values():
		var caravan: Dictionary = raw
		if String(caravan.get("origin", "")) == origin and String(caravan.get("destination", "")) == destination and String(caravan.get("item_id", "")) == item_id:
			return true
	return false

func active_displacements() -> Array:
	var rows: Array = []
	var keys := displacements.keys()
	keys.sort()
	for raw_id in keys:
		rows.append((displacements[raw_id] as Dictionary).duplicate(true))
	return rows

func displacement_cell(displacement_id: String, absolute_hour := -1) -> Vector2i:
	if not displacements.has(displacement_id):
		return Vector2i(99999, 99999)
	var row: Dictionary = displacements[displacement_id]
	var origin := String(row.get("origin", ""))
	var destination := String(row.get("destination", ""))
	if not has(origin) or not has(destination):
		return Vector2i(99999, 99999)
	var hour: int = world.absolute_world_hour() if absolute_hour < 0 else absolute_hour
	var depart := int(row.get("depart_hour", hour))
	var arrival := maxi(depart + 1, int(row.get("arrival_hour", depart + 1)))
	var progress := clampf(float(hour - depart) / float(arrival - depart), 0.0, 1.0)
	var ox := market_cell(origin).x
	var dx := market_cell(destination).x
	var x := clampi(roundi(lerpf(float(ox), float(dx), progress)), SliceWorld.MIN_X + 2, SliceWorld.MAX_X - 2)
	return Vector2i(x, world.surface_y_at(x) - 1)

func export_displacements() -> Dictionary:
	return {"serial": displacement_serial, "active": active_displacements()}

func restore_displacements(raw) -> bool:
	displacements.clear()
	displacement_serial = 0
	if raw == null or (raw is Dictionary and raw.is_empty()):
		return true
	if not raw is Dictionary:
		return false
	var serial := int(raw.get("serial", 0))
	var active = raw.get("active", [])
	if serial < 0 or not active is Array or active.size() > DISPLACEMENT_MAX_ACTIVE:
		return false
	var staged: Dictionary = {}
	var max_serial := -1
	for entry in active:
		if not entry is Dictionary:
			return false
		var row: Dictionary = (entry as Dictionary).duplicate(true)
		var id := String(row.get("id", ""))
		if not id.begins_with("displacement:") or not id.trim_prefix("displacement:").is_valid_int():
			return false
		max_serial = maxi(max_serial, int(id.trim_prefix("displacement:")))
		var origin := String(row.get("origin", ""))
		var destination := String(row.get("destination", ""))
		var people := int(row.get("people", 0))
		var depart := int(row.get("depart_hour", -1))
		var arrival := int(row.get("arrival_hour", -1))
		if staged.has(id) or not has(origin) or not has(destination) or origin == destination or people <= 0 or people > DISPLACEMENT_GROUP_SIZE or depart < 0 or arrival <= depart:
			return false
		staged[id] = row
	if serial <= max_serial:
		return false
	displacements = staged
	displacement_serial = serial
	return true

func _maybe_start_displacement(origin: String, attacker_faction: String, absolute_hour: int) -> Dictionary:
	if world.progression_authority != null and not world.progression_authority.allows_displacement():
		return {}
	if not has(origin) or displacements.size() >= DISPLACEMENT_MAX_ACTIVE:
		return {}
	var origin_row: Dictionary = settlements[origin]
	if absolute_hour < int(origin_row.get("next_displacement_hour", 0)):
		return {}
	var available_people := population(origin) - DISPLACEMENT_MIN_POPULATION
	if available_people <= 0:
		return {}
	var destination := _safest_displacement_destination(origin, attacker_faction)
	if destination.is_empty():
		return {}
	var people := mini(DISPLACEMENT_GROUP_SIZE, available_people)
	origin_row["population"] = population(origin) - people
	origin_row["next_displacement_hour"] = absolute_hour + DISPLACEMENT_COOLDOWN_HOURS
	settlements[origin] = origin_row
	var distance := absi(market_cell(destination).x - market_cell(origin).x)
	var travel_hours := maxi(2, int(ceil(float(distance) / DISPLACEMENT_CELLS_PER_HOUR)))
	var id := "displacement:%d" % displacement_serial
	displacement_serial += 1
	displacements[id] = {"id": id, "origin": origin, "destination": destination, "people": people, "depart_hour": absolute_hour, "arrival_hour": absolute_hour + travel_hours, "cause": "war_displacement"}
	return (displacements[id] as Dictionary).duplicate(true)

func _maybe_start_return_migrations(absolute_hour: int) -> Array:
	var events: Array = []
	if world.progression_authority != null and not world.progression_authority.allows_displacement():
		return events
	if absolute_hour <= 0 or absolute_hour % RETURN_MIGRATION_INTERVAL_HOURS != 0 or world.faction_authority == null:
		return events
	for home in ids():
		if displacements.size() >= DISPLACEMENT_MAX_ACTIVE:
			break
		var home_row: Dictionary = settlements[home]
		var deficit := population_baseline(home) - population(home)
		if deficit <= 0 or security(home) < RETURN_MIGRATION_SECURITY or absolute_hour < int(home_row.get("next_displacement_hour", 0)):
			continue
		if String(world.faction_authority.conflict_status(home)) != "peace":
			continue
		var already_returning := false
		for raw in displacements.values():
			var moving: Dictionary = raw
			if String(moving.get("destination", "")) == home:
				already_returning = true
				break
		if already_returning:
			continue
		var source := _return_migration_source(home)
		if source.is_empty():
			continue
		var surplus := population(source) - population_baseline(source)
		var people := mini(DISPLACEMENT_GROUP_SIZE, mini(deficit, surplus))
		if people <= 0:
			continue
		var source_row: Dictionary = settlements[source]
		source_row["population"] = population(source) - people
		settlements[source] = source_row
		home_row["next_displacement_hour"] = absolute_hour + DISPLACEMENT_COOLDOWN_HOURS
		settlements[home] = home_row
		var distance := absi(market_cell(home).x - market_cell(source).x)
		var travel_hours := maxi(2, int(ceil(float(distance) / DISPLACEMENT_CELLS_PER_HOUR)))
		var id := "displacement:%d" % displacement_serial
		displacement_serial += 1
		displacements[id] = {"id": id, "origin": source, "destination": home, "people": people, "depart_hour": absolute_hour, "arrival_hour": absolute_hour + travel_hours, "cause": "return_migration"}
		events.append({"kind": "return_migration_departed", "displacement_id": id, "origin": source, "destination": home, "people": people, "arrival_hour": absolute_hour + travel_hours})
	return events

func _return_migration_source(home: String) -> String:
	var home_controller: String = world.faction_authority.controller_for_settlement(home)
	var best := ""
	var best_surplus := 0
	var best_security := -1
	for candidate in ids():
		if candidate == home:
			continue
		var surplus := population(candidate) - population_baseline(candidate)
		if surplus <= 0 or security(candidate) < 60:
			continue
		var conflict := String(world.faction_authority.conflict_status(candidate))
		if conflict in ["war", "raid"]:
			continue
		var controller: String = world.faction_authority.controller_for_settlement(candidate)
		if controller != home_controller and String(world.faction_authority.relation(home_controller, controller).get("stance", "neutral")) == "war":
			continue
		var candidate_security := security(candidate)
		if surplus > best_surplus or (surplus == best_surplus and (candidate_security > best_security or (candidate_security == best_security and (best.is_empty() or candidate < best)))):
			best = candidate
			best_surplus = surplus
			best_security = candidate_security
	return best

func _safest_displacement_destination(origin: String, attacker_faction: String) -> String:
	if world.faction_authority == null:
		return ""
	var origin_controller: String = world.faction_authority.controller_for_settlement(origin)
	var best := ""
	var best_security := -1
	for candidate in ids():
		if candidate == origin:
			continue
		var controller: String = world.faction_authority.controller_for_settlement(candidate)
		if controller == attacker_faction:
			continue
		if controller != origin_controller and String(world.faction_authority.relation(origin_controller, controller).get("stance", "neutral")) == "war":
			continue
		var candidate_security := security(candidate)
		if candidate_security > best_security or (candidate_security == best_security and candidate < best):
			best = candidate
			best_security = candidate_security
	return best

func _advance_displacements(absolute_hour: int) -> Array:
	var events: Array = []
	var keys := displacements.keys()
	keys.sort()
	for raw_id in keys:
		var id := String(raw_id)
		if not displacements.has(id):
			continue
		var row: Dictionary = displacements[id]
		if absolute_hour < int(row.get("arrival_hour", 0)):
			continue
		var destination := String(row.get("destination", ""))
		var people := maxi(0, int(row.get("people", 0)))
		if has(destination) and people > 0:
			var destination_row: Dictionary = settlements[destination]
			destination_row["population"] = population(destination) + people
			settlements[destination] = destination_row
		displacements.erase(id)
		events.append({"kind": "displacement_arrived", "displacement_id": id, "origin": String(row.get("origin", "")), "destination": destination, "people": people})
	return events

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
			"population": maxi(0, int(row.get("population", row.get("population_baseline", 1)))),
			"next_displacement_hour": maxi(0, int(row.get("next_displacement_hour", 0))),
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
		var baseline_population := population_baseline(id)
		var population_value := int((entry as Dictionary).get("population", baseline_population))
		var next_displacement := int((entry as Dictionary).get("next_displacement_hour", 0))
		if security_value < 0 or security_value > 100 or population_value < 0 or population_value > 10000 or next_displacement < 0:
			return false
		staged[id] = {"inventory": _clean_counts(inventory_raw), "treasury": treasury_value, "stolen_deficit": _clean_counts(entry.get("stolen_deficit", {})), "security": security_value, "population": population_value, "next_displacement_hour": next_displacement}
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
		row["population"] = int(values.get("population", row.get("population_baseline", 1)))
		row["next_displacement_hour"] = int(values.get("next_displacement_hour", 0))
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

func spend_treasury(settlement_id: String, amount: int) -> bool:
	if not settlements.has(settlement_id) or amount <= 0 or treasury(settlement_id) < amount:
		return false
	var row: Dictionary = settlements[settlement_id]
	row["treasury"] = int(row.get("treasury", 0)) - amount
	settlements[settlement_id] = row
	return true

func credit_treasury(settlement_id: String, amount: int) -> int:
	if not settlements.has(settlement_id) or amount <= 0:
		return treasury(settlement_id)
	var row: Dictionary = settlements[settlement_id]
	row["treasury"] = int(row.get("treasury", 0)) + amount
	settlements[settlement_id] = row
	return int(row["treasury"])

func fund_npc_replacement(settlement_id: String, role_kind: String) -> bool:
	if not settlements.has(settlement_id):
		return false
	var cost := GUARD_REPLACEMENT_TREASURY_COST if role_kind == "guard" else MERCHANT_REPLACEMENT_TREASURY_COST
	var row: Dictionary = settlements[settlement_id]
	if int(row.get("treasury", 0)) < cost:
		return false
	row["treasury"] = int(row.get("treasury", 0)) - cost
	settlements[settlement_id] = row
	return true

func apply_player_crime_pressure(settlement_id: String, amount: int) -> int:
	if not settlements.has(settlement_id) or amount <= 0:
		return 0
	var before: int = security(settlement_id)
	var row: Dictionary = settlements[settlement_id]
	row["security"] = maxi(0, before - amount)
	settlements[settlement_id] = row
	return before - int(row["security"])

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
	var displacement: Dictionary = {}
	if int(row["security"]) <= DISPLACEMENT_TRIGGER_SECURITY:
		displacement = _maybe_start_displacement(settlement_id, attacker_faction, world.absolute_world_hour())
	return {"ok": true, "attacker": attacker_faction, "security_before": before, "security_after": int(row["security"]), "treasury_loss": treasury_loss, "items_lost": lost, "displacement": displacement}

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

func pay_player_bounty(player, settlement_id: String, amount: int) -> Dictionary:
	if player == null or not has(settlement_id) or world.faction_authority == null or amount <= 0:
		return {"ok": false, "reason": "invalid_payment"}
	var faction_id: String = world.faction_authority.controller_for_settlement(settlement_id)
	var outstanding: int = world.faction_authority.player_bounty(faction_id)
	if outstanding <= 0:
		return {"ok": false, "reason": "not_wanted"}
	var paid := mini(amount, mini(outstanding, player.forge_marks))
	if paid <= 0:
		return {"ok": false, "reason": "marks_short", "remaining": outstanding}
	var settled: Dictionary = world.faction_authority.settle_player_bounty(faction_id, paid)
	var applied := int(settled.get("paid", 0))
	if applied <= 0:
		return {"ok": false, "reason": "invalid_payment", "remaining": outstanding}
	player.forge_marks -= applied
	var row: Dictionary = settlements[settlement_id]
	row["treasury"] = int(row.get("treasury", 0)) + applied
	settlements[settlement_id] = row
	settled["ok"] = true
	settled["treasury"] = int(row["treasury"])
	return settled

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
	var shortage_before: String = shortage_severity(settlement_id, item_id)
	var security_before: int = security(settlement_id)
	var row: Dictionary = settlements[settlement_id]
	var inventory: Dictionary = row["inventory"]
	inventory[item_id] = int(inventory[item_id]) - quantity
	var deficit: Dictionary = row.get("stolen_deficit", {})
	deficit[item_id] = int(deficit.get(item_id, 0)) + quantity
	row["stolen_deficit"] = deficit
	row["inventory"] = inventory
	# Theft damages the same local security used by route risk, war pressure and
	# displacement. Critical-stock theft hurts slightly more, but remains bounded.
	var shortage_penalty := 2 if shortage_before == "critical" else (1 if shortage_before == "strained" else 0)
	var requested_security_loss := mini(6, quantity + shortage_penalty)
	settlements[settlement_id] = row
	var security_loss: int = apply_player_crime_pressure(settlement_id, requested_security_loss)
	player.add_item(item_id, quantity)
	var faction_id: String = world.faction_authority.controller_for_settlement(settlement_id)
	var bounty: int = world.faction_authority.record_player_crime(faction_id, quantity * 25)
	return {"ok": true, "quantity": quantity, "security_loss": security_loss, "security": security(settlement_id), "bounty": bounty}

func _relieve_stolen_deficit(settlement_id: String, item_id: String, amount: int) -> void:
	var row: Dictionary = settlements[settlement_id]
	var deficit: Dictionary = row.get("stolen_deficit", {})
	deficit[item_id] = maxi(0, int(deficit.get(item_id, 0)) - amount)
	row["stolen_deficit"] = deficit
	settlements[settlement_id] = row

# Purchase is paid into the same settlement treasury as ordinary retail.
func pay_for_pack_beast(player, settlement_id: String) -> bool:
	if world.progression_authority != null and not world.progression_authority.allows_local_market():
		return false
	if not settlements.has(settlement_id) or nearby_market(player.global_position) != settlement_id or market_closed_to_player(settlement_id) or player.forge_marks < 240:
		return false
	player.forge_marks -= 240
	var row: Dictionary = settlements[settlement_id]
	row["treasury"] = int(row.get("treasury", 0)) + 240
	return true
