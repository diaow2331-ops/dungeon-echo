extends Node2D
class_name SliceWorld

const TILE_SIZE := 32.0
const MIN_X := -42
const MAX_X := 42
const MAX_Y := 27
const AIR := 0
const DIRT := 1
const GRASS := 2
const STONE := 3

var cells: Dictionary = {}
var collision_root: StaticBody2D

func _ready() -> void:
	collision_root = StaticBody2D.new()
	collision_root.name = "TerrainCollision"
	collision_root.collision_layer = 1
	collision_root.collision_mask = 0
	add_child(collision_root)
	_generate()
	_rebuild_collision()
	queue_redraw()

func _generate() -> void:
	cells.clear()
	for x in range(MIN_X, MAX_X + 1):
		var surface := surface_y_at(x)
		for y in range(surface, MAX_Y + 1):
			var depth := y - surface
			cells[Vector2i(x, y)] = GRASS if depth == 0 else (DIRT if depth < 4 else STONE)
	# Small stepped ruin: useful for jump/camera testing without adding another system.
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

func mine_at(cell: Vector2i) -> bool:
	if not cells.has(cell):
		return false
	cells.erase(cell)
	_rebuild_collision()
	queue_redraw()
	return true

func place_at(cell: Vector2i, tile: int = DIRT) -> bool:
	if cells.has(cell) or cell.x < MIN_X or cell.x > MAX_X or cell.y > MAX_Y:
		return false
	var attached := false
	for d in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		if cells.has(cell + d):
			attached = true
			break
	if not attached:
		return false
	cells[cell] = tile
	_rebuild_collision()
	queue_redraw()
	return true

func _is_exposed(cell: Vector2i) -> bool:
	for d in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		if not cells.has(cell + d):
			return true
	return false

func _rebuild_collision() -> void:
	if collision_root == null:
		return
	for child in collision_root.get_children():
		child.queue_free()
	for cell in cells.keys():
		if not _is_exposed(cell):
			continue
		var shape := RectangleShape2D.new()
		shape.size = Vector2(TILE_SIZE, TILE_SIZE)
		var collider := CollisionShape2D.new()
		collider.shape = shape
		collider.position = cell_center(cell)
		collision_root.add_child(collider)

func _draw() -> void:
	# Deliberately simple prototype art: gameplay feel first, final atlas later.
	draw_rect(Rect2(-1500, -900, 3000, 1800), Color("10252e"))
	for i in range(6):
		var y := 160.0 + i * 42.0
		draw_circle(Vector2(-900 + i * 360, y), 150.0, Color(0.15, 0.27, 0.29, 0.16))
	for key in cells.keys():
		var cell: Vector2i = key
		var tile := int(cells[cell])
		var color := Color("6d4c37")
		if tile == GRASS:
			color = Color("5e7841")
		elif tile == STONE:
			color = Color("59636b")
		var pos := Vector2(cell) * TILE_SIZE
		draw_rect(Rect2(pos + Vector2.ONE, Vector2(TILE_SIZE - 2, TILE_SIZE - 2)), color)
		if tile == GRASS:
			draw_rect(Rect2(pos + Vector2(1, 1), Vector2(TILE_SIZE - 2, 6)), Color("9aad5b"))
		elif tile == STONE:
			draw_line(pos + Vector2(7, 9), pos + Vector2(20, 15), Color(0.72, 0.76, 0.78, 0.28), 2.0)
