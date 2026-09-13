class_name SliceFactionAuthority
extends RefCounted

const MAX_FACTIONS := 3
const VALID_STATUS := ["active", "weakened", "collapsing", "annexed"]
const VALID_STANCE := ["neutral", "trade", "war"]
const BASELINE := [
	{"id": "verdant", "biome": "verdant"},
	{"id": "ember", "biome": "ember"},
	{"id": "frost", "biome": "frost"},
]

var world
var factions: Dictionary = {}
var relations: Dictionary = {}

func _init(owner_world) -> void:
	world = owner_world
	reset_baseline()

func reset_baseline() -> void:
	factions.clear()
	relations.clear()
	for raw in BASELINE:
		var id := String(raw["id"])
		factions[id] = {
			"id": id,
			"biome": String(raw["biome"]),
			"status": "active",
			"owner_faction_id": "",
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
		})
	var relation_rows: Array = []
	var keys := relations.keys()
	keys.sort()
	for raw_key in keys:
		var key := String(raw_key)
		var row: Dictionary = relations[key]
		relation_rows.append([key, int(row.get("score", 0)), String(row.get("stance", "neutral"))])
	return {"factions": faction_rows, "relations": relation_rows}

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
	factions = staged_factions
	relations = staged_relations
	return true

func _relation_key(a: String, b: String) -> String:
	return a + "|" + b if a < b else b + "|" + a
