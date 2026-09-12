extends SceneTree

var failed := false

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: ", message)
	else:
		failed = true
		push_error("FAIL: " + message)

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var light := world.lighting_authority as SliceLightingAuthority
	var registry := world.block_registry as SliceBlockRegistry

	_check(registry.schema_version >= 2, "block registry versions optical properties explicitly")
	_check(registry.light_absorption(SliceWorld.AIR) == 0.0, "air does not absorb block light")
	_check(registry.light_absorption(SliceWorld.STONE) > 0.9, "stone strongly attenuates propagated light")
	_check(light.cached_chunk_count() == world.chunk_streamer.active_keys.size(), "lighting cache exists only for streamed active chunks")
	_check(light.last_cells_computed < 40000, "lighting computation remains bounded to active chunks plus one halo")

	var shaft_x := 6
	var surface := world.surface_y_at(shaft_x)
	var sky_cell := Vector2i(shaft_x, surface - 2)
	var deep_cell := Vector2i(shaft_x, surface + 6)
	var closed_level := light.light_level(deep_cell)
	_check(light.light_level(sky_cell) > 0.95, "open sky remains fully sunlit")
	_check(closed_level < 0.25, "sealed underground terrain stays materially dark")

	for y in range(surface, deep_cell.y + 1):
		world.request_world_edit({
			"action": "mine",
			"cell": Vector2i(shaft_x, y),
			"tool_power": 99.0,
			"actor_id": "system_lighting_test"
		})
	world.rebuild_lighting_now()
	var open_level := light.light_level(deep_cell)
	_check(open_level > 0.90, "opening a vertical shaft admits direct sunlight deep underground")
	_check(open_level > closed_level + 0.60, "terrain mutation materially changes derived lighting")

	world.request_world_edit({
		"action": "place",
		"cell": Vector2i(shaft_x, surface),
		"tile": SliceWorld.DIRT,
		"actor_id": "system_lighting_test"
	})
	world.rebuild_lighting_now()
	var resealed_level := light.light_level(deep_cell)
	_check(resealed_level < open_level - 0.45, "resealing the surface removes direct shaft sunlight")

	var boundary_y := maxi(world.surface_y_at(15), world.surface_y_at(16)) + 7
	var source_cell := Vector2i(15, boundary_y)
	var neighbor_cell := Vector2i(16, boundary_y)
	for cell in [source_cell, neighbor_cell]:
		if world.has_cell(cell):
			world.request_world_edit({
				"action": "mine",
				"cell": cell,
				"tool_power": 99.0,
				"actor_id": "system_lighting_test"
			})
	world.rebuild_lighting_now()
	var neighbor_before := light.light_level(neighbor_cell)
	light.set_emitter("boundary_probe", source_cell, 1.0)
	world.rebuild_lighting_now()
	_check(world.chunk_key_for(source_cell) != world.chunk_key_for(neighbor_cell), "lighting probe straddles a real chunk boundary")
	_check(light.light_level(source_cell) > 0.95, "local emitter owns full source intensity")
	_check(light.light_level(neighbor_cell) > neighbor_before + 0.40, "local light propagates across chunk boundaries")
	light.remove_emitter("boundary_probe")
	world.rebuild_lighting_now()
	_check(light.light_level(neighbor_cell) <= neighbor_before + 0.05, "removing an emitter invalidates derived chunk light")

	var far_cell: Vector2i = world.remote_vein_cells[-1]
	var far_key := world.chunk_key_for(far_cell)
	_check(not light.has_cache(far_key), "off-screen chunk begins without a lighting cache")
	light.set_emitter("far_probe", far_cell, 1.0)
	light.sync_active(world.chunk_streamer.active_keys)
	_check(not light.has_cache(far_key), "off-screen emitter does not allocate an unloaded lighting cache")

	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	_check(light.has_cache(far_key), "approaching a chunk builds its derived lighting cache")
	_check(light.light_level(far_cell) > 0.95, "newly streamed chunk includes current local emitters")
	_check(light.cached_chunk_count() <= world.chunk_streamer.max_retained_chunks(), "lighting cache stays bounded by streaming retention")

	player.global_position = world.cell_center(Vector2i(0, world.surface_y_at(0) - 2))
	world.refresh_streaming(true)
	_check(not light.has_cache(far_key), "unloaded chunks release lighting cache with presentation")
	_check(not SliceSaveSystem.snapshot(main).has("lighting"), "derived lighting never enters authoritative save data")

	print("wildforge_chunk_lighting=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
