class_name SliceChunkStreamer
extends RefCounted

const LOAD_RADIUS_X := 3
const LOAD_RADIUS_Y := 2
const UNLOAD_MARGIN := 1
const NO_CHUNK := Vector2i(999999, 999999)

var world: Node
var focus: Node2D
var active_keys: Dictionary = {}
var center_key := NO_CHUNK
var activation_count := 0
var deactivation_count := 0

func _init(owner_world: Node) -> void:
	world = owner_world

func set_focus(node: Node2D) -> void:
	focus = node
	refresh(true)

func has_focus() -> bool:
	return focus != null and is_instance_valid(focus)

func refresh(force := false) -> void:
	if not has_focus():
		return
	var cell: Vector2i = world.world_to_cell(focus.global_position)
	refresh_at_cell(cell, force)

func refresh_at_cell(cell: Vector2i, force := false) -> void:
	var next_center: Vector2i = world.chunk_key_for(cell)
	if not force and next_center == center_key:
		return
	_apply_center(next_center)

func clear_tracking() -> void:
	active_keys.clear()
	center_key = NO_CHUNK

func is_active(key: Vector2i) -> bool:
	return active_keys.has(key)

func max_retained_chunks() -> int:
	var rx := LOAD_RADIUS_X + UNLOAD_MARGIN
	var ry := LOAD_RADIUS_Y + UNLOAD_MARGIN
	return (rx * 2 + 1) * (ry * 2 + 1)

func _apply_center(next_center: Vector2i) -> void:
	var desired := _key_window(next_center, LOAD_RADIUS_X, LOAD_RADIUS_Y)
	var retained := _key_window(next_center, LOAD_RADIUS_X + UNLOAD_MARGIN, LOAD_RADIUS_Y + UNLOAD_MARGIN)
	for raw in active_keys.keys():
		var key: Vector2i = raw
		if not retained.has(key):
			world.deactivate_chunk(key)
			active_keys.erase(key)
			deactivation_count += 1
	for raw in desired.keys():
		var key: Vector2i = raw
		if active_keys.has(key):
			continue
		world.activate_chunk(key)
		active_keys[key] = true
		activation_count += 1
	center_key = next_center

func _key_window(center: Vector2i, radius_x: int, radius_y: int) -> Dictionary:
	var keys: Dictionary = {}
	for x in range(center.x - radius_x, center.x + radius_x + 1):
		for y in range(center.y - radius_y, center.y + radius_y + 1):
			keys[Vector2i(x, y)] = true
	return keys
