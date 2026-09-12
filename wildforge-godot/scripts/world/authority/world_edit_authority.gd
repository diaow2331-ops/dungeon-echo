class_name SliceWorldEditAuthority
extends RefCounted

const ACTION_MINE := "mine"
const ACTION_PLACE := "place"
const ACTION_STATION := "station"
const ACTION_REPAIR := "repair"

var registry: SliceBlockRegistry
var decisions := 0
var allowed_decisions := 0
var denied_decisions := 0
var last_decision: Dictionary = {}

func _init(block_registry: SliceBlockRegistry) -> void:
	registry = block_registry

func evaluate(world: Node, request: Dictionary) -> Dictionary:
	decisions += 1
	var action := String(request.get("action", ""))
	var cell = request.get("cell", Vector2i(99999, 99999))
	if not cell is Vector2i:
		return _deny(action, Vector2i(99999, 99999), "invalid_cell")
	var ownership: Dictionary = world.ownership_at(cell) if world.has_method("ownership_at") else {"owner_id": "wilderness", "zone_type": "wilderness", "structure_id": ""}
	var result := _base(action, cell, ownership, request)
	match action:
		ACTION_MINE:
			return _evaluate_mine(world, result, request)
		ACTION_PLACE:
			return _evaluate_place(world, result, request)
		ACTION_STATION:
			return _evaluate_station(world, result, request)
		ACTION_REPAIR:
			return _evaluate_repair(world, result, request)
		_:
			return _deny_result(result, "unknown_action")
func _evaluate_mine(world: Node, result: Dictionary, request: Dictionary) -> Dictionary:
	var cell: Vector2i = result["cell"]
	if not world.is_cell_in_bounds(cell):
		return _deny_result(result, "out_of_bounds")
	if not world.has_cell(cell):
		return _deny_result(result, "empty_cell")
	var tile := int(world.tile_at(cell))
	if not registry.has(tile) or tile == 0:
		return _deny_result(result, "unknown_block")
	var required := registry.required_pick_power(tile)
	var tool_power := float(request.get("tool_power", 0.0))
	result["tile"] = tile
	result["required_tool_power"] = required
	result["drop_item"] = registry.drop_item(tile)
	if tool_power + 0.001 < required:
		return _deny_result(result, "tool_too_weak")
	return _allow_result(result)

func _evaluate_place(world: Node, result: Dictionary, request: Dictionary) -> Dictionary:
	var cell: Vector2i = result["cell"]
	var tile := int(request.get("tile", -1))
	result["tile"] = tile
	if not world.is_cell_in_bounds(cell):
		return _deny_result(result, "out_of_bounds")
	if not registry.has(tile):
		return _deny_result(result, "unknown_block")
	if not registry.is_placeable(tile):
		return _deny_result(result, "block_not_placeable")
	if world.has_cell(cell) or world.station_cell_occupied(cell):
		return _deny_result(result, "occupied")
	if not world.has_support_neighbor(cell):
		return _deny_result(result, "unsupported")
	return _allow_result(result)
func _evaluate_station(world: Node, result: Dictionary, request: Dictionary) -> Dictionary:
	var cell: Vector2i = result["cell"]
	var station_kind := String(request.get("station_kind", ""))
	result["station_kind"] = station_kind
	if station_kind not in ["workbench", "campfire"]:
		return _deny_result(result, "unknown_station")
	if not world.is_cell_in_bounds(cell):
		return _deny_result(result, "out_of_bounds")
	if world.has_cell(cell) or world.station_cell_occupied(cell):
		return _deny_result(result, "occupied")
	if not world.has_cell(cell + Vector2i.DOWN):
		return _deny_result(result, "unsupported")
	return _allow_result(result)

func _evaluate_repair(world: Node, result: Dictionary, request: Dictionary) -> Dictionary:
	var cell: Vector2i = result["cell"]
	var tile := int(request.get("tile", -1))
	var structure_id := String(request.get("structure_id", ""))
	result["tile"] = tile
	result["structure_id"] = structure_id
	if structure_id.is_empty() or world.structure_authority == null or not world.structure_authority.has(structure_id):
		return _deny_result(result, "unknown_structure")
	if world.structure_authority.expected_tile(structure_id, cell) != tile:
		return _deny_result(result, "blueprint_mismatch")
	if world.has_cell(cell) or world.station_cell_occupied(cell):
		return _deny_result(result, "occupied")
	if not world.has_support_neighbor(cell):
		return _deny_result(result, "unsupported")
	return _allow_result(result)

func _base(action: String, cell: Vector2i, ownership: Dictionary, request: Dictionary) -> Dictionary:
	var owner_id := String(ownership.get("owner_id", "wilderness"))
	var zone_type := String(ownership.get("zone_type", "wilderness"))
	var actor_id := String(request.get("actor_id", "system"))
	var legal := _classify_legality(action, actor_id, owner_id, zone_type, request)
	return {
		"allowed": false,
		"changed": false,
		"action": action,
		"cell": cell,
		"actor_id": actor_id,
		"owner_id": owner_id,
		"zone_type": zone_type,
		"structure_id": String(ownership.get("structure_id", "")),
		"legal_status": legal["status"],
		"violation": legal["violation"],
		"crime_class": legal["crime_class"],
		"reason": "",
	}

func _deny(action: String, cell: Vector2i, reason: String) -> Dictionary:
	return _deny_result(_base(action, cell, {"owner_id": "wilderness", "zone_type": "wilderness", "structure_id": ""}, {}), reason)
func _allow_result(result: Dictionary) -> Dictionary:
	result["allowed"] = true
	result["reason"] = "ok"
	allowed_decisions += 1
	last_decision = result.duplicate(true)
	return result

func _deny_result(result: Dictionary, reason: String) -> Dictionary:
	result["allowed"] = false
	result["reason"] = reason
	denied_decisions += 1
	last_decision = result.duplicate(true)
	return result

func _classify_legality(action: String, actor_id: String, owner_id: String, zone_type: String, request: Dictionary) -> Dictionary:
	if owner_id == "wilderness" or actor_id.begins_with("system"):
		return {"status": "legal", "violation": false, "crime_class": "none"}
	var actor_faction := String(request.get("actor_faction", ""))
	if actor_faction == owner_id:
		return {"status": "legal", "violation": false, "crime_class": "none"}
	var permits := _string_values(request.get("permits", []))
	if "*" in permits or "edit:%s" % owner_id in permits or "%s:%s" % [action, owner_id] in permits:
		return {"status": "legal", "violation": false, "crime_class": "none"}
	var war_targets := _string_values(request.get("war_targets", []))
	if owner_id in war_targets:
		return {"status": "wartime", "violation": false, "crime_class": "wartime_action"}
	var crime := "major_property_damage" if zone_type in ["structure", "protected_structure"] else ("unlicensed_extraction" if action == ACTION_MINE else "unauthorized_construction")
	return {"status": "illegal", "violation": true, "crime_class": crime}

func _string_values(raw) -> Array[String]:
	var values: Array[String] = []
	if raw is Array:
		for value in raw:
			values.append(String(value))
	return values
