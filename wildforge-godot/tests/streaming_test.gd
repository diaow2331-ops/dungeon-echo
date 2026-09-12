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
	var streamer := world.chunk_streamer as SliceChunkStreamer
	var spawn_key := world.chunk_key_for(world.world_to_cell(player.global_position))
	var full_data_chunks := world.data_chunk_count()

	_check(streamer != null and streamer.has_focus(), "world streaming follows the live player")
	_check(world.render_chunks.size() < full_data_chunks, "spawn does not instantiate presentation for the whole world")
	_check(world.render_chunks.size() <= streamer.max_retained_chunks(), "active render chunks stay inside the bounded streaming budget")
	_check(world.collision_chunks.size() <= streamer.max_retained_chunks(), "active collision chunks stay inside the bounded streaming budget")

	var far_cell: Vector2i = world.remote_vein_cells[-1]
	var far_key := world.chunk_key_for(far_cell)
	var original_tile := world.tile_at(far_cell)
	var overrides_before := world.export_cell_overrides().size()
	_check(original_tile != SliceWorld.AIR, "remote streaming fixture selects authoritative terrain data")
	_check(not world.render_chunks.has(far_key) and not world.collision_chunks.has(far_key), "remote terrain begins outside the active presentation window")

	var remote_edit := world.request_world_edit({
		"action": "mine",
		"cell": far_cell,
		"tool_power": 99.0,
		"actor_id": "system_remote_sim"
	})
	_check(bool(remote_edit["changed"]), "off-screen simulation can mutate authoritative terrain")
	_check(not world.has_cell(far_cell), "off-screen mutation changes the single world authority")
	_check(world.export_cell_overrides().size() == overrides_before + 1, "off-screen mutation enters the same delta journal")
	_check(not world.render_chunks.has(far_key) and not world.collision_chunks.has(far_key), "off-screen mutation does not wake render or collision chunks")

	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	_check(world.render_chunks.has(far_key) and world.collision_chunks.has(far_key), "approaching streamed terrain activates presentation and collision")
	_check(not world.render_chunks.has(spawn_key), "distant spawn presentation unloads after crossing the hysteresis margin")

	_check(not world.has_cell(far_cell), "newly activated chunk reads the latest off-screen world mutation")
	_check(world.render_chunks.size() <= streamer.max_retained_chunks(), "far travel keeps render allocation bounded")
	_check(world.collision_chunks.size() <= streamer.max_retained_chunks(), "far travel keeps collision allocation bounded")
	_check(streamer.activation_count > 0 and streamer.deactivation_count > 0, "streamer records real activation and unload transitions")

	player.global_position = world.cell_center(Vector2i(0, world.surface_y_at(0) - 2))
	world.refresh_streaming(true)
	_check(not world.render_chunks.has(far_key), "returning home unloads distant presentation again")
	_check(not world.has_cell(far_cell), "unloading a chunk never rolls back authoritative off-screen mutations")
	_check(world.export_cell_overrides().size() == overrides_before + 1, "streaming never duplicates or discards delta persistence")

	print("wildforge_chunk_streaming=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
