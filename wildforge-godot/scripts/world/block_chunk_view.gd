extends Node2D
class_name SliceBlockChunkView

var world: SliceWorld
var chunk_key := Vector2i.ZERO

func setup(owner_world: SliceWorld, key: Vector2i) -> void:
	world = owner_world
	chunk_key = key
	position = Vector2(key * SliceWorld.CHUNK_SIZE) * SliceWorld.TILE_SIZE
	queue_redraw()

func _draw() -> void:
	if world == null:
		return
	var start := chunk_key * SliceWorld.CHUNK_SIZE
	for lx in range(SliceWorld.CHUNK_SIZE):
		for ly in range(SliceWorld.CHUNK_SIZE):
			var cell := start + Vector2i(lx, ly)
			var tile := world.tile_at(cell)
			if tile == SliceWorld.AIR:
				continue
			var color := Color("6d4c37")
			if tile == SliceWorld.GRASS:
				color = Color("5e7841")
			elif tile == SliceWorld.STONE:
				color = Color("59636b")
			var pos := Vector2(lx, ly) * SliceWorld.TILE_SIZE
			draw_rect(Rect2(pos + Vector2.ONE, Vector2(SliceWorld.TILE_SIZE - 2, SliceWorld.TILE_SIZE - 2)), color)
			if tile == SliceWorld.GRASS:
				draw_rect(Rect2(pos + Vector2(1, 1), Vector2(SliceWorld.TILE_SIZE - 2, 6)), Color("9aad5b"))
			elif tile == SliceWorld.STONE:
				draw_line(pos + Vector2(7, 9), pos + Vector2(20, 15), Color(0.72, 0.76, 0.78, 0.28), 2.0)
