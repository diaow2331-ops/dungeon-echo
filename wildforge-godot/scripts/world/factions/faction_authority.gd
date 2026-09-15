class_name SliceFactionAuthority
extends RefCounted

const MAX_FACTIONS := 3
const VALID_STATUS := ["active", "weakened", "collapsing", "annexed"]
const VALID_STANCE := ["neutral", "trade", "war"]
const RAID_MAX_STRENGTH := 3
const RAID_STRIKE_INTERVAL_HOURS := 6
const RAID_SPAWN_INTERVAL_HOURS := 12
const BASELINE := [
	{"id": "verdant", "biome": "verdant"},
	{"id": "ember", "biome": "ember"},
	{"id": "frost", "biome": "frost"},
]

var world
var factions: Dictionary = {}
var relations: Dictionary = {}
var raids: Dictionary = {}

func _init(owner_world) -> void:
	world = owner_world
	reset_baseline()

func reset_baseline() -> void:
	factions.clear()
	relations.clear()
	raids.clear()
	for raw in BASELINE:
		var id := String(raw["id"])
		factions[id] = {
			"id": id,
			"biome": String(raw["biome"]),
			"status": "active",
			"owner_faction_id": "",
			"player_bounty": 0,
			"pursuit_due_hour": 0,
		}
	for i in range(BASELINE.size()):
		for j in range(i + 1, BASELINE.size()):
			var a := String(BASELINE[i]["id"])
			var b := String(BASELINE[j]["id"])
			relations[_relation_key(a, b)] = {"score": 0, "stance": "neutral"}

func ids() -> Array[String]:
	var result: Array[String] = []
	for raw_id in factions.keys():
		result.append(String(raw_id))
	result.sort()
	return result

func has(faction_id: String) -> bool:
	return factions.has(faction_id)

func state(faction_id: String) -> Dictionary:
	return (factions.get(faction_id, {}) as Dictionary).duplicate(true)

func controller_id(faction_id: String) -> String:
	if not factions.has(faction_id):
		return faction_id
	var current := faction_id
	var seen: Dictionary = {}
	for _step in range(MAX_FACTIONS):
		if seen.has(current) or not factions.has(current):
			break
		seen[current] = true
		var row: Dictionary = factions[current]
		if String(row.get("status", "active")) != "annexed":
			break
		var owner := String(row.get("owner_faction_id", ""))
		if owner.is_empty() or owner == current:
			break
		current = owner
	return current

func relation(a: String, b: String) -> Dictionary:
	var ca := controller_id(a)
	var cb := controller_id(b)
	if ca == cb:
		return {"score": 100, "stance": "self"}
	if not factions.has(ca) or not factions.has(cb):
		return {"score": 0, "stance": "neutral"}
	return (relations.get(_relation_key(ca, cb), {"score": 0, "stance": "neutral"}) as Dictionary).duplicate(true)

func set_relation(a: String, b: String, score: int, stance: String) -> bool:
	if not factions.has(a) or not factions.has(b) or stance not in VALID_STANCE:
		return false
	var ca := controller_id(a)
	var cb := controller_id(b)
	if ca == cb:
		return false
	var key := _relation_key(ca, cb)
	if not relations.has(key):
		return false
	relations[key] = {"score": clampi(score, -100, 100), "stance": stance}
	if stance != "war":
		_remove_raids_for_pair(ca, cb)
	return true

func set_status(faction_id: String, status: String, owner_faction_id := "") -> bool:
	if not factions.has(faction_id) or status not in VALID_STATUS:
		return false
	if status == "annexed":
		if owner_faction_id == faction_id or not factions.has(owner_faction_id):
			return false
		if controller_id(owner_faction_id) == faction_id:
			return false
	else:
		owner_faction_id = ""
	var row: Dictionary = factions[faction_id]
	row["status"] = status
	row["owner_faction_id"] = owner_faction_id
	factions[faction_id] = row
	return true

func founding_faction_for_settlement(settlement_id: String) -> String:
	if world == null or world.settlement_authority == null:
		return ""
	var row: Dictionary = world.settlement_authority.state(settlement_id)
	var faction_id := String(row.get("founding_faction", ""))
	return faction_id if factions.has(faction_id) else ""

func controller_for_settlement(settlement_id: String) -> String:
	if world == null or world.settlement_authority == null:
		return ""
	var physical_owner: String = world.settlement_authority.owner_id(settlement_id)
	return controller_id(physical_owner) if factions.has(physical_owner) else physical_owner

func export_state() -> Dictionary:
	var faction_rows: Array = []
	for faction_id in ids():
		var row: Dictionary = factions[faction_id]
		faction_rows.append({
			"id": faction_id,
			"status": String(row.get("status", "active")),
			"owner_faction_id": String(row.get("owner_faction_id", "")),
			"player_bounty": int(row.get("player_bounty", 0)),
			"pursuit_due_hour": int(row.get("pursuit_due_hour", 0)),
		})
	var relation_rows: Array = []
	var keys := relations.keys()
	keys.sort()
	for raw_key in keys:
		var key := String(raw_key)
		var row: Dictionary = relations[key]
		relation_rows.append([key, int(row.get("score", 0)), String(row.get("stance", "neutral"))])
	var raid_rows: Array = []
	var raid_ids := raids.keys()
	raid_ids.sort()
	for raw_id in raid_ids:
		var raid: Dictionary = raids[raw_id]
		raid_rows.append({
			"id": String(raid.get("id", "")),
			"attacker": String(raid.get("attacker", "")),
			"defender": String(raid.get("defender", "")),
			"target_settlement": String(raid.get("target_settlement", "")),
			"strength": int(raid.get("strength", 0)),
			"max_strength": int(raid.get("max_strength", RAID_MAX_STRENGTH)),
			"strikes": int(raid.get("strikes", 0)),
			"next_strike_hour": int(raid.get("next_strike_hour", 0)),
			"started_hour": int(raid.get("started_hour", 0)),
			"defeated_slots": (raid.get("defeated_slots", []) as Array).duplicate(),
		})
	return {"factions": faction_rows, "relations": relation_rows, "raids": raid_rows}

func restore_state(raw) -> bool:
	if not raw is Dictionary:
		return false
	var faction_rows = raw.get("factions", [])
	var relation_rows = raw.get("relations", [])
	if not faction_rows is Array or not relation_rows is Array:
		return false
	if faction_rows.size() != MAX_FACTIONS or relation_rows.size() != 3:
		return false
	var staged_factions := factions.duplicate(true)
	var seen_factions: Dictionary = {}
	for entry in faction_rows:
		if not entry is Dictionary:
			return false
		var id := String(entry.get("id", ""))
		var status := String(entry.get("status", ""))
		var owner := String(entry.get("owner_faction_id", ""))
		if not factions.has(id) or seen_factions.has(id) or status not in VALID_STATUS:
			return false
		if status == "annexed":
			if owner == id or not factions.has(owner):
				return false
		elif not owner.is_empty():
			return false
		var row: Dictionary = staged_factions[id]
		row["status"] = status
		row["owner_faction_id"] = owner
		if int(entry.get("player_bounty", 0)) < 0:
			return false
		row["player_bounty"] = int(entry.get("player_bounty", 0))
		row["pursuit_due_hour"] = maxi(0, int(entry.get("pursuit_due_hour", 0)))
		staged_factions[id] = row
		seen_factions[id] = true
	for faction_id in seen_factions.keys():
		var current := String(faction_id)
		var chain_seen: Dictionary = {}
		for _step in range(MAX_FACTIONS + 1):
			if chain_seen.has(current):
				return false
			chain_seen[current] = true
			var row: Dictionary = staged_factions[current]
			if String(row.get("status", "active")) != "annexed":
				break
			current = String(row.get("owner_faction_id", ""))
			if not staged_factions.has(current):
				return false

	var staged_relations: Dictionary = {}
	for entry in relation_rows:
		if not entry is Array or entry.size() < 3:
			return false
		var key := String(entry[0])
		var score := int(entry[1])
		var stance := String(entry[2])
		if not relations.has(key) or staged_relations.has(key) or score < -100 or score > 100 or stance not in VALID_STANCE:
			return false
		staged_relations[key] = {"score": score, "stance": stance}
	if staged_relations.size() != relations.size():
		return false
	var staged_raids: Dictionary = {}
	var raid_rows = raw.get("raids", [])
	if not raid_rows is Array or raid_rows.size() > 3:
		return false
	for entry in raid_rows:
		if not entry is Dictionary:
			return false
		var raid := (entry as Dictionary).duplicate(true)
		var raid_id := String(raid.get("id", ""))
		var attacker := String(raid.get("attacker", ""))
		var defender := String(raid.get("defender", ""))
		var target := String(raid.get("target_settlement", ""))
		var strength := int(raid.get("strength", 0))
		var max_strength := int(raid.get("max_strength", RAID_MAX_STRENGTH))
		var defeated = raid.get("defeated_slots", [])
		if raid_id.is_empty() or staged_raids.has(raid_id) or not staged_factions.has(attacker) or not staged_factions.has(defender) or attacker == defender:
			return false
		if target.is_empty() or strength <= 0 or max_strength < strength or max_strength > RAID_MAX_STRENGTH or int(raid.get("strikes", -1)) < 0 or int(raid.get("next_strike_hour", -1)) < 0 or int(raid.get("started_hour", -1)) < 0:
			return false
		if not defeated is Array or defeated.size() != max_strength - strength:
			return false
		var slot_seen: Dictionary = {}
		for slot_raw in defeated:
			var slot := int(slot_raw)
			if slot < 0 or slot >= max_strength or slot_seen.has(slot):
				return false
			slot_seen[slot] = true
		raid["strength"] = strength
		raid["max_strength"] = max_strength
		raid["defeated_slots"] = defeated.duplicate()
		staged_raids[raid_id] = raid
	factions = staged_factions
	relations = staged_relations
	raids = staged_raids
	_drop_invalid_raids()
	return true

func _relation_key(a: String, b: String) -> String:
	return a + "|" + b if a < b else b + "|" + a

func record_player_crime(faction_id: String, severity: int) -> int:
	var sovereign := controller_id(faction_id)
	if not factions.has(sovereign) or severity <= 0:
		return 0
	var row: Dictionary = factions[sovereign]
	if int(row.get("player_bounty", 0)) == 0:
		row["pursuit_due_hour"] = world.absolute_world_hour() + 3
	row["player_bounty"] = mini(1000000, int(row.get("player_bounty", 0)) + severity)
	factions[sovereign] = row
	return player_bounty(sovereign)

func player_bounty(faction_id: String) -> int:
	var sovereign := controller_id(faction_id)
	var total := 0
	for id in ids():
		if controller_id(id) == sovereign:
			total += int((factions[id] as Dictionary).get("player_bounty", 0))
	return total

func hostile_to_player(faction_id: String) -> bool:
	return player_bounty(faction_id) > 0

func pursuit_due(faction_id: String) -> bool:
	var sovereign := controller_id(faction_id)
	return factions.has(sovereign) and player_bounty(sovereign) >= 500 and world.absolute_world_hour() >= int((factions[sovereign] as Dictionary).get("pursuit_due_hour", 0))

func defer_pursuit(faction_id: String) -> void:
	var sovereign := controller_id(faction_id)
	if factions.has(sovereign):
		(factions[sovereign] as Dictionary)["pursuit_due_hour"] = world.absolute_world_hour() + 12


func at_war(faction_id: String) -> bool:
	var sovereign := controller_id(faction_id)
	if not factions.has(sovereign):
		return false
	for other in ids():
		var controller := controller_id(other)
		if controller == sovereign or not factions.has(controller):
			continue
		if String(relation(sovereign, controller).get("stance", "neutral")) == "war":
			return true
	return false

func conflict_status(settlement_id: String) -> String:
	var founding := founding_faction_for_settlement(settlement_id)
	if founding.is_empty():
		return "peace"
	var controller := controller_id(founding)
	if controller != founding:
		return "occupied"
	for raid in active_raids():
		if String(raid.get("target_settlement", "")) == settlement_id:
			return "raid"
	if at_war(controller):
		return "war"
	for other in ids():
		if other == controller:
			continue
		var rel := relation(controller, other)
		if int(rel.get("score", 0)) <= -35:
			return "tense"
	return "peace"

func active_raids() -> Array:
	var rows: Array = []
	var raid_ids := raids.keys()
	raid_ids.sort()
	for raw_id in raid_ids:
		rows.append((raids[raw_id] as Dictionary).duplicate(true))
	return rows

func simulate_hour(absolute_hour: int) -> Dictionary:
	var events: Array = []
	_drop_invalid_raids()
	_ensure_scheduled_raids(absolute_hour, events)
	var raid_ids := raids.keys()
	raid_ids.sort()
	for raw_id in raid_ids:
		var raid_id := String(raw_id)
		if not raids.has(raid_id):
			continue
		var raid: Dictionary = raids[raid_id]
		if absolute_hour < int(raid.get("next_strike_hour", 0)):
			continue
		var attacker := controller_id(String(raid.get("attacker", "")))
		var defender := controller_id(String(raid.get("defender", "")))
		if attacker == defender or String(relation(attacker, defender).get("stance", "neutral")) != "war":
			raids.erase(raid_id)
			continue
		var target := String(raid.get("target_settlement", ""))
		var pressure := 8 + int(raid.get("strength", 1)) * 4
		var damage: Dictionary = world.settlement_authority.apply_raid_pressure(target, pressure, attacker)
		raid["strikes"] = int(raid.get("strikes", 0)) + 1
		raid["next_strike_hour"] = absolute_hour + RAID_STRIKE_INTERVAL_HOURS
		raids[raid_id] = raid
		events.append({"kind": "raid_strike", "raid_id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target, "pressure": pressure, "damage": damage})
		var security: int = world.settlement_authority.security(target)
		if security <= 60 and security > 25:
			set_status(defender, "weakened")
		elif security <= 25 and security > 0:
			set_status(defender, "collapsing")
		if security <= 0:
			if set_status(defender, "annexed", attacker):
				raids.erase(raid_id)
				events.append({"kind": "annexation", "attacker": attacker, "defender": defender, "target_settlement": target})
	_drop_invalid_raids()
	return {"hour": absolute_hour, "events": events}

func record_raid_defeat(raid_id: String, slot: int) -> Dictionary:
	if not raids.has(raid_id):
		return {"ok": false}
	var raid: Dictionary = raids[raid_id]
	var defeated: Array = raid.get("defeated_slots", [])
	if slot in defeated:
		return {"ok": false}
	defeated.append(slot)
	defeated.sort()
	raid["defeated_slots"] = defeated
	raid["strength"] = maxi(0, int(raid.get("strength", 0)) - 1)
	var remaining := int(raid["strength"])
	var target := String(raid.get("target_settlement", ""))
	if remaining <= 0:
		raids.erase(raid_id)
		world.settlement_authority.recover_security(target, 12)
		return {"ok": true, "repelled": true, "remaining": 0, "target_settlement": target}
	raids[raid_id] = raid
	return {"ok": true, "repelled": false, "remaining": remaining, "target_settlement": target}

func _ensure_scheduled_raids(absolute_hour: int, events: Array) -> void:
	var keys := relations.keys()
	keys.sort()
	for index in range(keys.size()):
		var key := String(keys[index])
		var rel: Dictionary = relations[key]
		if String(rel.get("stance", "neutral")) != "war":
			continue
		if absolute_hour % RAID_SPAWN_INTERVAL_HOURS != (index * 4) % RAID_SPAWN_INTERVAL_HOURS:
			continue
		var pair := key.split("|")
		if pair.size() != 2:
			continue
		var a := controller_id(String(pair[0]))
		var b := controller_id(String(pair[1]))
		if a == b or _has_raid_for_pair(a, b):
			continue
		var attacker := _stronger_faction(a, b, absolute_hour)
		var defender := b if attacker == a else a
		var target := _settlement_for_faction(defender)
		if target.is_empty():
			continue
		var raid_id := "raid:%s:%s" % [attacker, defender]
		raids[raid_id] = {"id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target, "strength": RAID_MAX_STRENGTH, "max_strength": RAID_MAX_STRENGTH, "strikes": 0, "next_strike_hour": absolute_hour + 2, "started_hour": absolute_hour, "defeated_slots": []}
		events.append({"kind": "raid_started", "raid_id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target})

func _stronger_faction(a: String, b: String, absolute_hour: int) -> String:
	var power_a := _faction_power(a)
	var power_b := _faction_power(b)
	if power_a == power_b:
		return a if floori(float(absolute_hour) / 24.0) % 2 == 0 else b
	return a if power_a > power_b else b

func _faction_power(faction_id: String) -> int:
	var row := factions.get(faction_id, {}) as Dictionary
	var status := String(row.get("status", "active"))
	var base := {"active": 100, "weakened": 72, "collapsing": 36, "annexed": 0}.get(status, 0) as int
	var settlement_id := _settlement_for_faction(faction_id)
	if settlement_id.is_empty():
		return base
	var state: Dictionary = world.settlement_authority.state(settlement_id)
	var stock_total := 0
	for amount in (state.get("inventory", {}) as Dictionary).values():
		stock_total += int(amount)
	return base + mini(50, int(state.get("treasury", 0)) / 6 + stock_total)

func _settlement_for_faction(faction_id: String) -> String:
	if world == null or world.settlement_authority == null:
		return ""
	for settlement_id in world.settlement_authority.ids():
		if founding_faction_for_settlement(settlement_id) == faction_id:
			return settlement_id
	return ""

func _has_raid_for_pair(a: String, b: String) -> bool:
	for raid in raids.values():
		var attacker := String((raid as Dictionary).get("attacker", ""))
		var defender := String((raid as Dictionary).get("defender", ""))
		if (attacker == a and defender == b) or (attacker == b and defender == a):
			return true
	return false

func _remove_raids_for_pair(a: String, b: String) -> void:
	for raw_id in raids.keys().duplicate():
		var raid: Dictionary = raids[raw_id]
		var attacker := String(raid.get("attacker", ""))
		var defender := String(raid.get("defender", ""))
		if (attacker == a and defender == b) or (attacker == b and defender == a):
			raids.erase(raw_id)

func _drop_invalid_raids() -> void:
	for raw_id in raids.keys().duplicate():
		var raid: Dictionary = raids[raw_id]
		var attacker := controller_id(String(raid.get("attacker", "")))
		var defender := controller_id(String(raid.get("defender", "")))
		if attacker == defender or not factions.has(attacker) or not factions.has(defender) or String(relation(attacker, defender).get("stance", "neutral")) != "war":
			raids.erase(raw_id)
