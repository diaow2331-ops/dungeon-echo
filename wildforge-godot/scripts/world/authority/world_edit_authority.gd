class_name SliceWorldEditAuthority
extends RefCounted

const ACTION_MINE := "mine"
const ACTION_PLACE := "place"
const ACTION_STATION := "station"

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
	var owner_id := String(world.owner_at(cell)) if world.has_method("owner_at") else "wilderness"
	var result := _base(action, cell, owner_id, request)
	match action:
		ACTION_MINE:
			return _evaluate_mine(world, result, request)
		ACTION_PLACE:
			return _evaluate_place(world, result, request)
		ACTION_STATION:
			return _evaluate_station(world, result, request)
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

func _base(action: String, cell: Vector2i, owner_id: String, request: Dictionary) -> Dictionary:
	return {
		"allowed": false,
		"changed": false,
		"action": action,
		"cell": cell,
		"actor_id": String(request.get("actor_id", "system")),
		"owner_id": owner_id,
		"legal_status": "allowed" if owner_id == "wilderness" else "unresolved",
		"reason": "",
	}

func _deny(action: String, cell: Vector2i, reason: String) -> Dictionary:
	return _deny_result(_base(action, cell, "wilderness", {}), reason)
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
