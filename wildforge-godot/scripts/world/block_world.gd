extends Node2D
class_name SliceWorld

signal chunk_activated(key: Vector2i)
signal chunk_deactivated(key: Vector2i)

const BurstScript = preload("res://scripts/fx/feedback_burst.gd")
const PickupScript = preload("res://scripts/items/item_pickup.gd")
const WorkbenchScript = preload("res://scripts/world/workbench.gd")
const CampfireScript = preload("res://scripts/world/campfire.gd")
const ChunkViewScript = preload("res://scripts/world/block_chunk_view.gd")
const BlockRegistryScript = preload("res://scripts/world/block_registry.gd")
const WorldEditAuthorityScript = preload("res://scripts/world/authority/world_edit_authority.gd")
const OwnershipAuthorityScript = preload("res://scripts/world/authority/world_ownership_authority.gd")
const ChunkStreamerScript = preload("res://scripts/world/streaming/chunk_streamer.gd")
const TILE_SIZE := 32.0
const CHUNK_SIZE := 16
const WORLD_GENERATION_VERSION := 1
const MIN_X := -128
const MAX_X := 128
const MAX_Y := 47
const AIR := 0
const DIRT := 1
const GRASS := 2
const STONE := 3
const COAL := 4
const COPPER := 5
const RUIN_BRICK := 6
const SEALED_RUIN := 7
const NO_CELL := Vector2i(99999, 99999)

var block_registry := BlockRegistryScript.new() as SliceBlockRegistry
var ownership_authority := OwnershipAuthorityScript.new() as SliceWorldOwnershipAuthority
var edit_authority := WorldEditAuthorityScript.new(block_registry) as SliceWorldEditAuthority
var chunk_streamer: SliceChunkStreamer
var cells: Dictionary = {}
var baseline_cells: Dictionary = {}
var cell_overrides: Dictionary = {}
var remote_vein_cells: Array[Vector2i] = []
var collision_root: Node2D
var collision_chunks: Dictionary = {}
var render_chunks: Dictionary = {}
var dirty_collision_chunks: Dictionary = {}
var collision_flush_scheduled := false
var last_collision_chunks_rebuilt := 0
var last_collision_cells_scanned := 0
var total_collision_rebuilds := 0
var mining_cell := NO_CELL
var mining_progress := 0.0
var place_flash_cell := NO_CELL
var place_flash := 0.0
var exploration_sites: Array = []
var deep_sites: Array = []

func _ready() -> void:
	collision_root = Node2D.new()
	collision_root.name = "TerrainCollisionChunks"
	add_child(collision_root)
	_generate()
	chunk_streamer = ChunkStreamerScript.new(self) as SliceChunkStreamer
	chunk_streamer.refresh_at_cell(Vector2i(0, surface_y_at(0)), true)
	queue_redraw()

func _process(delta: float) -> void:
	if chunk_streamer != null:
		chunk_streamer.refresh()
	if place_flash > 0.0:
		place_flash = maxf(0.0, place_flash - delta)
		queue_redraw()

func _generate() -> void:
	cells.clear()
	exploration_sites.clear()
	deep_sites.clear()
	for x in range(MIN_X, MAX_X + 1):
		var surface := surface_y_at(x)
		for y in range(surface, MAX_Y + 1):
			var depth := y - surface
			cells[Vector2i(x, y)] = GRASS if depth == 0 else (DIRT if depth < 4 else STONE)
	for x in range(9, 14):
		cells[Vector2i(x, surface_y_at(x) - 1)] = STONE
	for y in range(surface_y_at(13) - 4, surface_y_at(13) - 1):
		cells[Vector2i(13, y)] = STONE
	_carve_ruin_pocket(-1)
	_carve_ruin_pocket(1)
	_seed_remote_veins()
	baseline_cells = cells.duplicate(true)
	cell_overrides.clear()

func _seed_remote_veins() -> void:
	remote_vein_cells.clear()
	for anchor_x in [-112, -88, -64, 64, 88, 112]:
		var surface := surface_y_at(anchor_x)
		var depth := 9 + (absi(anchor_x) / 24) % 4
		var ore := COPPER if absi(anchor_x) in [64, 112] else COAL
		for dx in range(-1, 2):
			for dy in range(0, 2):
				var cell := Vector2i(anchor_x + dx, surface + depth + dy)
				if cell.x >= MIN_X and cell.x <= MAX_X and cell.y <= MAX_Y:
					cells[cell] = ore
					remote_vein_cells.append(cell)

func _carve_ruin_pocket(side: int) -> void:
	var direction := -1 if side < 0 else 1
	var entry_abs := 17
	var anchor_abs := 31
	# A walkable stepped tunnel forces a short expedition without requiring ropes.
	for i in range(anchor_abs - entry_abs + 1):
		var x := direction * (entry_abs + i)
		var floor_y := surface_y_at(x) + 1 + i / 2
		for y in range(floor_y - 3, floor_y):
			cells.erase(Vector2i(x, y))
	# Compact chamber: cache in the center, ore in the surrounding stone.
	var anchor_x := direction * anchor_abs
	var chamber_floor := surface_y_at(anchor_x) + 8
	for x in range(anchor_x - 3, anchor_x + 4):
		for y in range(chamber_floor - 4, chamber_floor):
			cells.erase(Vector2i(x, y))
		for y in range(chamber_floor, chamber_floor + 2):
			cells[Vector2i(x, y)] = RUIN_BRICK
	var ore_x := anchor_x - direction * 3
	cells[Vector2i(ore_x, chamber_floor - 1)] = COPPER
	cells[Vector2i(ore_x, chamber_floor - 2)] = COPPER
	cells[Vector2i(ore_x - direction, chamber_floor - 1)] = COAL
	cells[Vector2i(ore_x - direction, chamber_floor - 2)] = COAL
	exploration_sites.append({
		"cache_cell": Vector2i(anchor_x, chamber_floor - 1),
		"guard_cell": Vector2i(anchor_x + direction * 2, chamber_floor - 1),
		"side": direction,
	})
	if direction > 0:
		_carve_deep_annex(anchor_x, chamber_floor)

func _carve_deep_annex(anchor_x: int, chamber_floor: int) -> void:
	var gate_cells: Array[Vector2i] = []
	for i in range(4, 10):
		var x := anchor_x + i
		var floor_y := chamber_floor + 1 + (i - 4) / 2
		for y in range(floor_y - 3, floor_y):
			cells.erase(Vector2i(x, y))
		if i == 4:
			gate_cells = [Vector2i(x, floor_y - 1), Vector2i(x, floor_y - 2)]
			for gate_cell in gate_cells:
				cells[gate_cell] = SEALED_RUIN
	var deep_x := anchor_x + 8
	var deep_floor := chamber_floor + 4
	for x in range(deep_x - 2, deep_x + 3):
		for y in range(deep_floor - 4, deep_floor):
			cells.erase(Vector2i(x, y))
	var copper_cells: Array[Vector2i] = []
	var coal_cells: Array[Vector2i] = []
	for dx in range(-2, 1):
		for dy in range(0, 2):
			var c := Vector2i(deep_x + dx, deep_floor + dy)
			cells[c] = COPPER
			copper_cells.append(c)
	for dx in range(1, 4):
		var c := Vector2i(deep_x + dx, deep_floor + 1)
		cells[c] = COAL
		coal_cells.append(c)
	deep_sites.append({
		"gate_cells": gate_cells,
		"copper_cells": copper_cells,
		"coal_cells": coal_cells,
		"depth": deep_floor - surface_y_at(deep_x),
	})

func deep_site_count() -> int:
	return deep_sites.size()

func required_pick_power(cell: Vector2i) -> float:
	return block_registry.required_pick_power(tile_at(cell))

func exploration_site_count() -> int:
	return exploration_sites.size()

func depth_at(cell: Vector2i) -> int:
	return cell.y - surface_y_at(cell.x)

func surface_y_at(x: int) -> int:
	return 13 + int(round(sin(float(x) * 0.19) * 1.4 + sin(float(x) * 0.057) * 1.1))

func export_cells() -> Array:
	var rows: Array = []
	for raw in cells.keys():
		var cell: Vector2i = raw
		rows.append([cell.x, cell.y, int(cells[cell])])
	rows.sort_custom(func(a, b): return int(a[0]) < int(b[0]) or (int(a[0]) == int(b[0]) and int(a[1]) < int(b[1])))
	return rows

func export_cell_overrides() -> Array:
	var rows: Array = []
	for raw in cell_overrides.keys():
		var cell: Vector2i = raw
		rows.append([cell.x, cell.y, int(cell_overrides[cell])])
	rows.sort_custom(func(a, b): return int(a[0]) < int(b[0]) or (int(a[0]) == int(b[0]) and int(a[1]) < int(b[1])))
	return rows

func restore_cell_overrides(rows: Array) -> bool:
	var restored_overrides: Dictionary = {}
	for row in rows:
		if not row is Array or row.size() < 3:
			return false
		var cell := Vector2i(int(row[0]), int(row[1]))
		var tile := int(row[2])
		if cell.x < MIN_X or cell.x > MAX_X or cell.y > MAX_Y or tile < AIR or tile > SEALED_RUIN:
			return false
		var base_tile := int(baseline_cells.get(cell, AIR))
		if tile != base_tile:
			restored_overrides[cell] = tile
	_apply_overrides(restored_overrides)
	return true

func restore_legacy_v13_cells(rows: Array, legacy_min_x := -42, legacy_max_x := 42, legacy_max_y := 27) -> bool:
	if rows.is_empty():
		return false
	var legacy: Dictionary = {}
	for row in rows:
		if not row is Array or row.size() < 3:
			return false
		var cell := Vector2i(int(row[0]), int(row[1]))
		var tile := int(row[2])
		if tile > AIR:
			legacy[cell] = tile
	var migrated: Dictionary = {}
	for raw in baseline_cells.keys():
		var cell: Vector2i = raw
		if cell.x < legacy_min_x or cell.x > legacy_max_x or cell.y > legacy_max_y:
			continue
		var saved_tile := int(legacy.get(cell, AIR))
		var base_tile := int(baseline_cells.get(cell, AIR))
		if saved_tile != base_tile:
			migrated[cell] = saved_tile
	for raw in legacy.keys():
		var cell: Vector2i = raw
		if cell.x < legacy_min_x or cell.x > legacy_max_x or cell.y > legacy_max_y:
			continue
		var saved_tile := int(legacy[cell])
		var base_tile := int(baseline_cells.get(cell, AIR))
		if saved_tile != base_tile:
			migrated[cell] = saved_tile
	_apply_overrides(migrated)
	return true

func restore_cells(rows: Array) -> bool:
	if rows.is_empty():
		return false
	var restored: Dictionary = {}
	for row in rows:
		if not row is Array or row.size() < 3:
			return false
		var cell := Vector2i(int(row[0]), int(row[1]))
		var tile := int(row[2])
		if tile > AIR:
			restored[cell] = tile
	if restored.is_empty():
		return false
	cells = restored
	_rebuild_overrides_from_current()
	_rebuild_world_views()
	return true

func _record_override(cell: Vector2i) -> void:
	var current_tile := int(cells.get(cell, AIR))
	var base_tile := int(baseline_cells.get(cell, AIR))
	if current_tile == base_tile:
		cell_overrides.erase(cell)
	else:
		cell_overrides[cell] = current_tile

func _rebuild_overrides_from_current() -> void:
	cell_overrides.clear()
	var candidates: Dictionary = {}
	for cell in baseline_cells.keys():
		candidates[cell] = true
	for cell in cells.keys():
		candidates[cell] = true
	for raw in candidates.keys():
		_record_override(raw)

func _apply_overrides(overrides: Dictionary) -> void:
	cells = baseline_cells.duplicate(true)
	cell_overrides.clear()
	for raw in overrides.keys():
		var cell: Vector2i = raw
		var tile := int(overrides[cell])
		if tile == AIR:
			cells.erase(cell)
		else:
			cells[cell] = tile
		_record_override(cell)
	_rebuild_world_views()

func _rebuild_world_views() -> void:
	for view in render_chunks.values():
		if is_instance_valid(view):
			view.free()
	for body in collision_chunks.values():
		if is_instance_valid(body):
			body.free()
	render_chunks.clear()
	collision_chunks.clear()
	dirty_collision_chunks.clear()
	collision_flush_scheduled = false
	var anchor := Vector2i(0, surface_y_at(0))
	if chunk_streamer != null:
		if chunk_streamer.has_focus():
			anchor = world_to_cell(chunk_streamer.focus.global_position)
		chunk_streamer.clear_tracking()
		chunk_streamer.refresh_at_cell(anchor, true)
	queue_redraw()

func world_to_cell(p: Vector2) -> Vector2i:
	return Vector2i(floori(p.x / TILE_SIZE), floori(p.y / TILE_SIZE))

func cell_center(cell: Vector2i) -> Vector2:
	return (Vector2(cell) + Vector2(0.5, 0.5)) * TILE_SIZE

func has_cell(cell: Vector2i) -> bool:
	return cells.has(cell)

func tile_at(cell: Vector2i) -> int:
	return int(cells.get(cell, AIR))

func is_cell_in_bounds(cell: Vector2i) -> bool:
	return cell.x >= MIN_X and cell.x <= MAX_X and cell.y <= MAX_Y

func has_support_neighbor(cell: Vector2i) -> bool:
	for direction in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		if has_cell(cell + direction):
			return true
	return false

func ownership_at(cell: Vector2i) -> Dictionary:
	return ownership_authority.resolve(cell)

func owner_at(cell: Vector2i) -> String:
	return ownership_authority.owner_at(cell)

func claim_region(owner_id: String, rect: Rect2i, zone_type := "territory", structure_id := "") -> bool:
	return ownership_authority.claim_region(owner_id, rect, zone_type, structure_id)

func claim_cells(owner_id: String, claimed_cells: Array, zone_type := "structure", structure_id := "") -> int:
	return ownership_authority.claim_cells(owner_id, claimed_cells, zone_type, structure_id)

func mine_time(cell: Vector2i) -> float:
	return block_registry.hardness(tile_at(cell))

func set_mining_feedback(cell: Vector2i, progress: float) -> void:
	mining_cell = cell
	mining_progress = clampf(progress, 0.0, 1.0)
	queue_redraw()

func clear_mining_feedback() -> void:
	if mining_cell == NO_CELL and mining_progress <= 0.0:
		return
	mining_cell = NO_CELL
	mining_progress = 0.0
	queue_redraw()

func request_world_edit(request: Dictionary) -> Dictionary:
	var decision := edit_authority.evaluate(self, request)
	if not bool(decision.get("allowed", false)):
		return decision
	var action := String(decision.get("action", ""))
	var cell: Vector2i = decision.get("cell", NO_CELL)
	if action == SliceWorldEditAuthority.ACTION_MINE:
		cells.erase(cell)
		_record_override(cell)
		if mining_cell == cell:
			clear_mining_feedback()
		_mark_cell_changed(cell)
	elif action == SliceWorldEditAuthority.ACTION_PLACE:
		var tile := int(decision.get("tile", AIR))
		cells[cell] = tile
		_record_override(cell)
		place_flash_cell = cell
		place_flash = 0.16
		_mark_cell_changed(cell)
	decision["changed"] = true
	queue_redraw()
	return decision

func mine_at(cell: Vector2i, tool_power := 1.0, actor_id := "system") -> bool:
	var decision := request_world_edit({"action": "mine", "cell": cell, "tool_power": tool_power, "actor_id": actor_id})
	return bool(decision.get("changed", false))

func place_at(cell: Vector2i, tile: int = DIRT, actor_id := "system") -> bool:
	var decision := request_world_edit({"action": "place", "cell": cell, "tile": tile, "actor_id": actor_id})
	return bool(decision.get("changed", false))

func spawn_item_pickup(at: Vector2, item_id: String, collector: SlicePlayer, amount := 1) -> SliceItemPickup:
	var pickup := PickupScript.new() as SliceItemPickup
	pickup.global_position = at
	pickup.z_index = 35
	add_child(pickup)
	var impulse := Vector2(randf_range(-72.0, 72.0), randf_range(-175.0, -118.0))
	pickup.setup(item_id, amount, collector, impulse)
	return pickup

func spawn_material_pickup(at: Vector2, tile: int, collector: SlicePlayer, amount := 1) -> SliceItemPickup:
	var item_id := block_registry.drop_item(tile)
	if item_id.is_empty():
		return null
	return spawn_item_pickup(at, item_id, collector, amount)


func station_cell_occupied(cell: Vector2i) -> bool:
	for group_name in ["workbenches", "campfires"]:
		for node in get_tree().get_nodes_in_group(group_name):
			if is_instance_valid(node) and node.get("cell") == cell:
				return true
	return false

func has_campfire() -> bool:
	return not get_tree().get_nodes_in_group("campfires").is_empty()

func near_campfire(at: Vector2, radius := TILE_SIZE * 4.1) -> bool:
	for node in get_tree().get_nodes_in_group("campfires"):
		if is_instance_valid(node) and node is Node2D and (node as Node2D).global_position.distance_to(at) <= radius:
			return true
	return false

func spawn_campfire(cell: Vector2i, actor_id := "system") -> SliceCampfire:
	var decision := edit_authority.evaluate(self, {"action": "station", "cell": cell, "station_kind": "campfire", "actor_id": actor_id})
	if not bool(decision.get("allowed", false)):
		return null
	var fire := CampfireScript.new() as SliceCampfire
	fire.cell = cell
	fire.global_position = cell_center(cell) + Vector2(0, 8)
	fire.z_index = 21
	add_child(fire)
	feedback_burst(fire.global_position, Color("e69a55"), 10, 92.0)
	return fire

func has_workbench() -> bool:
	return not get_tree().get_nodes_in_group("workbenches").is_empty()

func near_workbench(at: Vector2, radius := TILE_SIZE * 4.1) -> bool:
	for node in get_tree().get_nodes_in_group("workbenches"):
		if is_instance_valid(node) and node is Node2D and (node as Node2D).global_position.distance_to(at) <= radius:
			return true
	return false

func spawn_workbench(cell: Vector2i, actor_id := "system") -> SliceWorkbench:
	var decision := edit_authority.evaluate(self, {"action": "station", "cell": cell, "station_kind": "workbench", "actor_id": actor_id})
	if not bool(decision.get("allowed", false)):
		return null
	for node in get_tree().get_nodes_in_group("workbenches"):
		if is_instance_valid(node) and node is SliceWorkbench and node.cell == cell:
			return null
	var bench := WorkbenchScript.new() as SliceWorkbench
	bench.cell = cell
	bench.global_position = cell_center(cell) + Vector2(0, 10)
	bench.z_index = 20
	add_child(bench)
	feedback_burst(bench.global_position, Color("d4aa6b"), 9, 85.0)
	return bench

func feedback_burst(at: Vector2, color: Color, count: int, speed: float) -> void:
	var burst := BurstScript.new() as SliceFeedbackBurst
	burst.global_position = at
	burst.z_index = 50
	add_child(burst)
	burst.setup(color, count, speed)

func _is_exposed(cell: Vector2i) -> bool:
	for d in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		if not cells.has(cell + d):
			return true
	return false

func chunk_key_for(cell: Vector2i) -> Vector2i:
	return Vector2i(floori(float(cell.x) / float(CHUNK_SIZE)), floori(float(cell.y) / float(CHUNK_SIZE)))

func set_streaming_focus(node: Node2D) -> void:
	if chunk_streamer == null:
		chunk_streamer = ChunkStreamerScript.new(self) as SliceChunkStreamer
	chunk_streamer.set_focus(node)

func refresh_streaming(force := false) -> void:
	if chunk_streamer != null:
		chunk_streamer.refresh(force)

func activate_chunk(key: Vector2i) -> void:
	_ensure_render_chunk(key)
	_rebuild_collision_chunk(key)
	chunk_activated.emit(key)

func deactivate_chunk(key: Vector2i) -> void:
	dirty_collision_chunks.erase(key)
	chunk_deactivated.emit(key)
	if render_chunks.has(key):
		var view: Node = render_chunks[key]
		render_chunks.erase(key)
		if is_instance_valid(view):
			view.queue_free()
	if collision_chunks.has(key):
		var body: Node = collision_chunks[key]
		collision_chunks.erase(key)
		if is_instance_valid(body):
			body.queue_free()

func data_chunk_count() -> int:
	var keys: Dictionary = {}
	for raw in cells.keys():
		keys[chunk_key_for(raw)] = true
	return keys.size()

func _ensure_render_chunk(key: Vector2i) -> SliceBlockChunkView:
	if render_chunks.has(key) and is_instance_valid(render_chunks[key]):
		return render_chunks[key] as SliceBlockChunkView
	var view := ChunkViewScript.new() as SliceBlockChunkView
	view.name = "Chunk_%d_%d" % [key.x, key.y]
	view.z_index = 0
	add_child(view)
	view.setup(self, key)
	render_chunks[key] = view
	return view

func _ensure_collision_chunk(key: Vector2i) -> StaticBody2D:
	if collision_chunks.has(key) and is_instance_valid(collision_chunks[key]):
		return collision_chunks[key] as StaticBody2D
	var body := StaticBody2D.new()
	body.name = "Collision_%d_%d" % [key.x, key.y]
	body.collision_layer = 1
	body.collision_mask = 0
	body.position = Vector2(key * CHUNK_SIZE) * TILE_SIZE
	collision_root.add_child(body)
	collision_chunks[key] = body
	return body

func _mark_cell_changed(cell: Vector2i) -> void:
	var own := chunk_key_for(cell)
	if render_chunks.has(own) and is_instance_valid(render_chunks[own]):
		(render_chunks[own] as SliceBlockChunkView).queue_redraw()
	_mark_collision_chunk(own)
	var local := cell - own * CHUNK_SIZE
	if local.x == 0:
		_mark_collision_chunk(own + Vector2i.LEFT)
	elif local.x == CHUNK_SIZE - 1:
		_mark_collision_chunk(own + Vector2i.RIGHT)
	if local.y == 0:
		_mark_collision_chunk(own + Vector2i.UP)
	elif local.y == CHUNK_SIZE - 1:
		_mark_collision_chunk(own + Vector2i.DOWN)
	if not dirty_collision_chunks.is_empty() and not collision_flush_scheduled:
		collision_flush_scheduled = true
		call_deferred("_flush_collision_rebuilds")

func _mark_collision_chunk(key: Vector2i) -> void:
	# Off-screen mutations change authoritative data only. Collision is rebuilt when streamed in.
	if collision_chunks.has(key):
		dirty_collision_chunks[key] = true

func _flush_collision_rebuilds() -> void:
	collision_flush_scheduled = false
	var keys := dirty_collision_chunks.keys()
	dirty_collision_chunks.clear()
	last_collision_chunks_rebuilt = 0
	last_collision_cells_scanned = 0
	for raw in keys:
		var key: Vector2i = raw
		if not collision_chunks.has(key):
			continue
		_rebuild_collision_chunk(key)
		last_collision_chunks_rebuilt += 1
		last_collision_cells_scanned += CHUNK_SIZE * CHUNK_SIZE

func _rebuild_collision_chunk(key: Vector2i) -> void:
	var body := _ensure_collision_chunk(key)
	for child in body.get_children():
		child.free()
	var start := key * CHUNK_SIZE
	for lx in range(CHUNK_SIZE):
		for ly in range(CHUNK_SIZE):
			var cell := start + Vector2i(lx, ly)
			if not cells.has(cell) or not _is_exposed(cell):
				continue
			var shape := RectangleShape2D.new()
			shape.size = Vector2(TILE_SIZE, TILE_SIZE)
			var collider := CollisionShape2D.new()
			collider.shape = shape
			collider.position = (Vector2(lx, ly) + Vector2(0.5, 0.5)) * TILE_SIZE
			body.add_child(collider)
	total_collision_rebuilds += 1

func _draw() -> void:
	draw_rect(Rect2(-1500, -900, 3000, 1800), Color("10252e"))
	for i in range(6):
		var y := 160.0 + i * 42.0
		draw_circle(Vector2(-900 + i * 360, y), 150.0, Color(0.15, 0.27, 0.29, 0.16))
	if mining_cell != NO_CELL and cells.has(mining_cell):
		_draw_mining_cracks(mining_cell, mining_progress)
	if place_flash > 0.0 and place_flash_cell != NO_CELL:
		var alpha := place_flash / 0.16
		var rect := Rect2(Vector2(place_flash_cell) * TILE_SIZE + Vector2(2, 2), Vector2(TILE_SIZE - 4, TILE_SIZE - 4))
		draw_rect(rect, Color(0.72, 0.90, 0.62, alpha * 0.32), false, 3.0)

func _draw_mining_cracks(cell: Vector2i, progress: float) -> void:
	var c := cell_center(cell)
	var alpha := 0.28 + progress * 0.65
	var extent := 4.0 + progress * 10.0
	var color := Color(0.08, 0.08, 0.07, alpha)
	draw_line(c, c + Vector2(-extent, -extent * 0.45), color, 2.0)
	draw_line(c, c + Vector2(extent * 0.75, -extent), color, 2.0)
	if progress > 0.35:
		draw_line(c + Vector2(-4, -2), c + Vector2(-extent * 0.8, extent * 0.75), color, 2.0)
	if progress > 0.68:
		draw_line(c + Vector2(3, 1), c + Vector2(extent, extent * 0.72), color, 2.0)
