class_name SliceStructureAuthority
extends RefCounted

const MIXED_OWNER := "mixed"

var world: SliceWorld
var structures: Dictionary = {}
var ids_by_cell: Dictionary = {}

func _init(owner_world: SliceWorld) -> void:
	world = owner_world

func register_baseline(raw_structures: Array) -> int:
	var added := 0
	for raw in raw_structures:
		if not raw is Dictionary:
			continue
		var row: Dictionary = raw
		if register_structure(String(row.get("id", "")), String(row.get("kind", "structure")), row.get("blueprint", []), "baseline"):
			added += 1
	return added

func register_structure(structure_id: String, kind: String, blueprint_rows, source := "runtime") -> bool:
	if structure_id.is_empty() or structures.has(structure_id) or not blueprint_rows is Array or blueprint_rows.is_empty():
		return false
	var blueprint: Dictionary = {}
	for raw in blueprint_rows:
		if not raw is Array or raw.size() < 3:
			return false
		var cell := Vector2i(int(raw[0]), int(raw[1]))
		var tile := int(raw[2])
		if tile <= SliceWorld.AIR or not world.block_registry.has(tile) or blueprint.has(cell):
			return false
		blueprint[cell] = tile
	structures[structure_id] = {
		"id": structure_id,
		"kind": kind,
		"source": source,
		"blueprint": blueprint,
	}
	for raw_cell in blueprint.keys():
		var cell: Vector2i = raw_cell
		if not ids_by_cell.has(cell):
			ids_by_cell[cell] = []
		(ids_by_cell[cell] as Array).append(structure_id)
	return true

func has(structure_id: String) -> bool:
	return structures.has(structure_id)

func structure_ids() -> Array[String]:
	var ids: Array[String] = []
	for raw_id in structures.keys():
		ids.append(String(raw_id))
	ids.sort()
	return ids

func ids_at(cell: Vector2i) -> Array:
	return (ids_by_cell.get(cell, []) as Array).duplicate()

func cells_for(structure_id: String) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	if not structures.has(structure_id):
		return result
	var blueprint: Dictionary = (structures[structure_id] as Dictionary)["blueprint"]
	for raw_cell in blueprint.keys():
		result.append(raw_cell as Vector2i)
	result.sort_custom(func(a: Vector2i, b: Vector2i): return a.x < b.x or (a.x == b.x and a.y < b.y))
	return result

func expected_tile(structure_id: String, cell: Vector2i) -> int:
	if not structures.has(structure_id):
		return SliceWorld.AIR
	var blueprint: Dictionary = (structures[structure_id] as Dictionary)["blueprint"]
	return int(blueprint.get(cell, SliceWorld.AIR))

func integrity(structure_id: String) -> float:
	var report := damage_report(structure_id)
	return float(report.get("integrity", 0.0))

func damage_report(structure_id: String) -> Dictionary:
	if not structures.has(structure_id):
		return {"total": 0, "intact": 0, "damaged": 0, "integrity": 0.0, "status": "missing", "repairs": []}
	var repairs: Array = []
	var intact := 0
	for cell in cells_for(structure_id):
		var expected := expected_tile(structure_id, cell)
		var current := world.tile_at(cell)
		if current == expected:
			intact += 1
		else:
			repairs.append([cell.x, cell.y, expected, current])
	var total := intact + repairs.size()
	var ratio := float(intact) / float(total) if total > 0 else 0.0
	var status := "intact" if ratio >= 0.999 else ("ruined" if ratio <= 0.001 else "damaged")
	return {"total": total, "intact": intact, "damaged": repairs.size(), "integrity": ratio, "status": status, "repairs": repairs}

func repair_requirements(structure_id: String) -> Dictionary:
	var needs: Dictionary = {}
	var report := damage_report(structure_id)
	for row in report.get("repairs", []):
		var expected := int(row[2])
		var item_id := world.block_registry.drop_item(expected)
		if item_id.is_empty():
			item_id = world.block_registry.key(expected)
		needs[item_id] = int(needs.get(item_id, 0)) + 1
	return needs

func claim_structure(structure_id: String, owner_id: String, zone_type := "protected_structure") -> int:
	if not structures.has(structure_id):
		return 0
	return world.claim_cells(owner_id, cells_for(structure_id), zone_type, structure_id)

func owner_id(structure_id: String) -> String:
	if not structures.has(structure_id):
		return SliceWorldOwnershipAuthority.WILDERNESS
	var resolved := ""
	for cell in cells_for(structure_id):
		var owner := world.owner_at(cell)
		if resolved.is_empty():
			resolved = owner
		elif resolved != owner:
			return MIXED_OWNER
	return resolved if not resolved.is_empty() else SliceWorldOwnershipAuthority.WILDERNESS

func repair_cell(structure_id: String, cell: Vector2i, actor_id := "system_repair", actor_faction := "") -> Dictionary:
	var tile := expected_tile(structure_id, cell)
	if tile == SliceWorld.AIR:
		return {"allowed": false, "changed": false, "reason": "not_structure_cell"}
	return world.request_world_edit({
		"action": SliceWorldEditAuthority.ACTION_REPAIR,
		"cell": cell,
		"tile": tile,
		"structure_id": structure_id,
		"actor_id": actor_id,
		"actor_faction": actor_faction,
	})
