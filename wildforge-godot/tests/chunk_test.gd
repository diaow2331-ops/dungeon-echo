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

func _settle_collision() -> void:
	await process_frame
	await process_frame

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld

	_check(SliceWorld.CHUNK_SIZE == 16, "world uses a fixed 16x16 block chunk contract")
	_check(world.render_chunks.size() > 1 and world.collision_chunks.size() > 1, "initial world is split across multiple render/collision chunks")
	_check(world.chunk_key_for(Vector2i(-1, 10)).x == -1, "negative world coordinates floor into negative chunks")
	_check(world.chunk_key_for(Vector2i(16, 10)).x == 1, "positive boundary enters the next chunk")

	var cell := Vector2i(3, world.surface_y_at(3) + 4)
	var key := world.chunk_key_for(cell)
	var original_view: SliceBlockChunkView = world.render_chunks[key] as SliceBlockChunkView
	_check(world.has_cell(cell), "non-boundary chunk test cell starts solid")
	var rebuilds_before := world.total_collision_rebuilds
	_check(world.mine_at(cell), "non-boundary edit succeeds")
	await _settle_collision()
	_check(world.last_collision_chunks_rebuilt == 1, "ordinary edit rebuilds exactly one collision chunk")
	_check(world.last_collision_cells_scanned == SliceWorld.CHUNK_SIZE * SliceWorld.CHUNK_SIZE, "ordinary edit scans only one chunk worth of cells")
	_check(world.total_collision_rebuilds == rebuilds_before + 1, "ordinary edit performs one collision rebuild")
	_check(world.render_chunks[key] == original_view, "tile edit redraws an existing chunk view instead of recreating world presentation")
	_check(world.place_at(cell, SliceWorld.STONE), "non-boundary cell can be restored")
	await _settle_collision()
	_check(world.last_collision_chunks_rebuilt == 1, "ordinary placement also rebuilds one collision chunk")

	var boundary := Vector2i(0, world.surface_y_at(0) + 4)
	_check(world.has_cell(boundary), "chunk-boundary test cell starts solid")
	_check(world.mine_at(boundary), "chunk-boundary edit succeeds")
	await _settle_collision()
	_check(world.last_collision_chunks_rebuilt >= 1 and world.last_collision_chunks_rebuilt <= 2, "x-boundary edit touches only own and cardinal neighbor chunk")
	_check(world.last_collision_cells_scanned <= 2 * SliceWorld.CHUNK_SIZE * SliceWorld.CHUNK_SIZE, "boundary edit stays bounded to at most two chunk scans")

	_check(world.collision_root.get_child_count() < world.cells.size(), "collision hierarchy scales by chunks, not one body per world tile")
	print("wildforge_godot_chunks=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
