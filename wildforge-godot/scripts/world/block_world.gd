extends Node2D
class_name SliceWorld

const BurstScript = preload("res://scripts/fx/feedback_burst.gd")
const PickupScript = preload("res://scripts/items/item_pickup.gd")
const WorkbenchScript = preload("res://scripts/world/workbench.gd")
const CampfireScript = preload("res://scripts/world/campfire.gd")
const ChunkViewScript = preload("res://scripts/world/block_chunk_view.gd")
const TILE_SIZE := 32.0
const CHUNK_SIZE := 16
const MIN_X := -42
const MAX_X := 42
const MAX_Y := 27
const AIR := 0
const DIRT := 1
const GRASS := 2
const STONE := 3
const NO_CELL := Vector2i(99999, 99999)

var cells: Dictionary = {}
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

func _ready() -> void:
	collision_root = Node2D.new()
	collision_root.name = "TerrainCollisionChunks"
	add_child(collision_root)
	_generate()
	_build_initial_chunks()
	queue_redraw()

func _process(delta: float) -> void:
	if place_flash > 0.0:
		place_flash = maxf(0.0, place_flash - delta)
		queue_redraw()

func _generate() -> void:
	cells.clear()
	for x in range(MIN_X, MAX_X + 1):
		var surface := surface_y_at(x)
		for y in range(surface, MAX_Y + 1):
			var depth := y - surface
			cells[Vector2i(x, y)] = GRASS if depth == 0 else (DIRT if depth < 4 else STONE)
	for x in range(9, 14):
		cells[Vector2i(x, surface_y_at(x) - 1)] = STONE
	for y in range(surface_y_at(13) - 4, surface_y_at(13) - 1):
		cells[Vector2i(13, y)] = STONE

func surface_y_at(x: int) -> int:
	return 13 + int(round(sin(float(x) * 0.19) * 1.4 + sin(float(x) * 0.057) * 1.1))

func world_to_cell(p: Vector2) -> Vector2i:
	return Vector2i(floori(p.x / TILE_SIZE), floori(p.y / TILE_SIZE))

func cell_center(cell: Vector2i) -> Vector2:
	return (Vector2(cell) + Vector2(0.5, 0.5)) * TILE_SIZE

func has_cell(cell: Vector2i) -> bool:
	return cells.has(cell)

func tile_at(cell: Vector2i) -> int:
	return int(cells.get(cell, AIR))

func mine_time(cell: Vector2i) -> float:
	match tile_at(cell):
		GRASS: return 0.16
		DIRT: return 0.20
		STONE: return 0.42
		_: return 0.0

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

func mine_at(cell: Vector2i) -> bool:
	if not cells.has(cell):
		return false
	cells.erase(cell)
	if mining_cell == cell:
		clear_mining_feedback()
	_mark_cell_changed(cell)
	queue_redraw()
	return true

func place_at(cell: Vector2i, tile: int = DIRT) -> bool:
	if cells.has(cell) or station_cell_occupied(cell) or cell.x < MIN_X or cell.x > MAX_X or cell.y > MAX_Y:
		return false
	var attached := false
	for d in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		if cells.has(cell + d):
			attached = true
			break
	if not attached:
		return false
	cells[cell] = tile
	place_flash_cell = cell
	place_flash = 0.16
	_mark_cell_changed(cell)
	queue_redraw()
	return true

func spawn_item_pickup(at: Vector2, item_id: String, collector: SlicePlayer, amount := 1) -> SliceItemPickup:
	var pickup := PickupScript.new() as SliceItemPickup
	pickup.global_position = at
	pickup.z_index = 35
	add_child(pickup)
	var impulse := Vector2(randf_range(-72.0, 72.0), randf_range(-175.0, -118.0))
	pickup.setup(item_id, amount, collector, impulse)
	return pickup

func spawn_material_pickup(at: Vector2, tile: int, collector: SlicePlayer, amount := 1) -> SliceItemPickup:
	var item_id := "stone" if tile == STONE else "soil"
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

func spawn_campfire(cell: Vector2i) -> SliceCampfire:
	if cells.has(cell) or station_cell_occupied(cell) or not cells.has(cell + Vector2i.DOWN):
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

func spawn_workbench(cell: Vector2i) -> SliceWorkbench:
	if cells.has(cell) or station_cell_occupied(cell) or not cells.has(cell + Vector2i.DOWN):
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

func _build_initial_chunks() -> void:
	var keys: Dictionary = {}
	for raw in cells.keys():
		var cell: Vector2i = raw
		keys[chunk_key_for(cell)] = true
	for key in keys.keys():
		_ensure_render_chunk(key)
		_rebuild_collision_chunk(key)
	last_collision_chunks_rebuilt = keys.size()
	last_collision_cells_scanned = keys.size() * CHUNK_SIZE * CHUNK_SIZE

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
	_ensure_render_chunk(own).queue_redraw()
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
	if not collision_flush_scheduled:
		collision_flush_scheduled = true
		call_deferred("_flush_collision_rebuilds")

func _mark_collision_chunk(key: Vector2i) -> void:
	dirty_collision_chunks[key] = true

func _flush_collision_rebuilds() -> void:
	collision_flush_scheduled = false
	var keys := dirty_collision_chunks.keys()
	dirty_collision_chunks.clear()
	last_collision_chunks_rebuilt = 0
	last_collision_cells_scanned = 0
	for raw in keys:
		var key: Vector2i = raw
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
