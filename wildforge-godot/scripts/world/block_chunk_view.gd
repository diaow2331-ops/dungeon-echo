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
				var air_pos := Vector2(lx, ly) * SliceWorld.TILE_SIZE
				var air_darkness := clampf(1.0 - world.light_level(cell), 0.0, 1.0) * 0.82
				if air_darkness > 0.01:
					draw_rect(Rect2(air_pos, Vector2(SliceWorld.TILE_SIZE, SliceWorld.TILE_SIZE)), Color(0.015, 0.025, 0.035, air_darkness))
				continue
			var color := Color("6d4c37")
			if tile == SliceWorld.GRASS:
				color = Color("5e7841")
			elif tile == SliceWorld.STONE:
				color = Color("59636b")
			elif tile == SliceWorld.COAL:
				color = Color("333a3e")
			elif tile == SliceWorld.COPPER:
				color = Color("9f6047")
			elif tile == SliceWorld.RUIN_BRICK:
				color = Color("655c70")
			elif tile == SliceWorld.SEALED_RUIN:
				color = Color("4b405d")
			var pos := Vector2(lx, ly) * SliceWorld.TILE_SIZE
			draw_rect(Rect2(pos + Vector2.ONE, Vector2(SliceWorld.TILE_SIZE - 2, SliceWorld.TILE_SIZE - 2)), color)
			if tile == SliceWorld.GRASS:
				draw_rect(Rect2(pos + Vector2(1, 1), Vector2(SliceWorld.TILE_SIZE - 2, 6)), Color("9aad5b"))
			elif tile == SliceWorld.STONE:
				draw_line(pos + Vector2(7, 9), pos + Vector2(20, 15), Color(0.72, 0.76, 0.78, 0.28), 2.0)
			elif tile == SliceWorld.COAL:
				draw_circle(pos + Vector2(11, 12), 4.0, Color("171b1e"))
				draw_circle(pos + Vector2(23, 21), 3.0, Color("1d2225"))
			elif tile == SliceWorld.COPPER:
				draw_line(pos + Vector2(7, 22), pos + Vector2(24, 8), Color("d18661"), 4.0)
			elif tile == SliceWorld.RUIN_BRICK:
				draw_line(pos + Vector2(2, 16), pos + Vector2(30, 16), Color(0.78, 0.72, 0.84, 0.25), 2.0)
			elif tile == SliceWorld.SEALED_RUIN:
				draw_rect(Rect2(pos + Vector2(6, 6), Vector2(20, 20)), Color(0.73, 0.62, 0.88, 0.16), false, 2.0)
				draw_line(pos + Vector2(8, 23), pos + Vector2(24, 8), Color(0.75, 0.65, 0.92, 0.32), 2.0)
			var darkness := clampf(1.0 - world.light_level(cell), 0.0, 1.0) * 0.82
			if darkness > 0.01:
				draw_rect(Rect2(pos, Vector2(SliceWorld.TILE_SIZE, SliceWorld.TILE_SIZE)), Color(0.015, 0.025, 0.035, darkness))
