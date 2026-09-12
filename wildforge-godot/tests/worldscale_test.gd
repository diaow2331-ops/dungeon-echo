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

func _new_main() -> Node:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	return main

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	_check(SliceWorld.MAX_X - SliceWorld.MIN_X + 1 >= 257, "world width expands from proof strip to at least 257 columns")
	_check(SliceWorld.MAX_Y >= 47, "world gains materially deeper vertical capacity")
	_check(world.remote_vein_cells.size() >= 30, "expanded frontier contains deterministic remote resource veins")
	_check(world.export_cell_overrides().is_empty(), "fresh deterministic world needs zero persisted cell deltas")

	var changed := Vector2i(0, world.surface_y_at(0) + 5)
	var original := world.tile_at(changed)
	_check(original == SliceWorld.STONE, "delta test begins on deterministic baseline stone")
	_check(world.mine_at(changed), "mining baseline cell creates a world mutation")
	var removed_delta := world.export_cell_overrides()
	_check(removed_delta.size() == 1 and int(removed_delta[0][2]) == SliceWorld.AIR, "one mined cell persists as exactly one AIR delta")
	_check(world.place_at(changed, original), "restoring the baseline tile succeeds")
	_check(world.export_cell_overrides().is_empty(), "returning a cell to baseline removes its persisted delta")

	_check(world.mine_at(changed), "save-size fixture creates one persistent mutation")
	var snapshot := SliceSaveSystem.snapshot(main)
	var overrides = snapshot.get("world_overrides", [])
	_check(overrides is Array and overrides.size() == 1, "expanded world save stores one delta instead of the full map")
	_check(not snapshot.has("world_cells"), "current save schema no longer serializes the full deterministic world")

	var legacy_rows: Array = []
	for row in world.export_cells():
		var x := int(row[0])
		var y := int(row[1])
		if x >= -42 and x <= 42 and y <= 27 and not (x == changed.x and y == changed.y):
			legacy_rows.append(row)
	var legacy_main := _new_main()
	await process_frame
	await process_frame
	var legacy_world := legacy_main.get_node("World") as SliceWorld
	var far_cell: Vector2i = legacy_world.remote_vein_cells[-1]
	var far_tile := legacy_world.tile_at(far_cell)
	_check(abs(far_cell.x) > 42, "migration fixture selects a resource cell outside the v0.13 world bounds")
	_check(legacy_world.restore_legacy_v13_cells(legacy_rows), "v0.13 full-map payload migrates into the delta world")
	_check(not legacy_world.has_cell(changed), "legacy mined cell remains mined after migration")
	_check(legacy_world.tile_at(far_cell) == far_tile and far_tile != SliceWorld.AIR, "legacy migration preserves newly generated frontier outside old bounds")

	main.free()
	legacy_main.free()
	print("wildforge_godot_worldscale=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
