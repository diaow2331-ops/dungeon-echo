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

func _flat_fixture(world: SliceWorld) -> Vector2i:
	for x in range(-12, 12):
		var surface := world.surface_y_at(x)
		if world.surface_y_at(x - 1) >= surface and world.surface_y_at(x + 1) >= surface:
			return Vector2i(x, surface - 1)
	return Vector2i(0, world.surface_y_at(0) - 1)

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var fluid := world.fluid_authority as SliceFluidAuthority
	var registry := world.fluid_registry as SliceFluidRegistry

	_check(registry.schema_version >= 1 and registry.has("water") and registry.has("lava"), "fluid types come from the data registry")
	_check(not world.set_fluid(Vector2i(0, world.surface_y_at(0)), "water", 1.0), "fluid authority rejects occupied terrain cells")
	_check(not world.set_fluid(Vector2i(0, world.surface_y_at(0) - 2), "unknown", 1.0), "fluid authority rejects unknown fluid kinds")

	var fall_source := Vector2i(2, world.surface_y_at(2) - 3)
	var fall_target := fall_source + Vector2i.DOWN
	_check(world.set_fluid(fall_source, "water", 1.0), "water fixture enters authoritative fluid state")
	var mass_before := fluid.total_amount("water")
	world.step_fluids_now(1)
	_check(fluid.amount_at(fall_target) > 0.95 and fluid.amount_at(fall_source) < SliceFluidAuthority.MIN_AMOUNT, "unobstructed fluid falls before spreading sideways")
	_check(absf(fluid.total_amount("water") - mass_before) < 0.001, "ordinary flow conserves fluid amount")

	fluid.clear_all()
	var shelf := _flat_fixture(world)
	_check(world.set_fluid(shelf, "water", 1.0), "blocked-flow fixture is valid")
	world.step_fluids_now(1)
	var side_amount := fluid.amount_at(shelf + Vector2i.LEFT) + fluid.amount_at(shelf + Vector2i.RIGHT)
	_check(side_amount > 0.20, "blocked water spreads laterally instead of penetrating solid ground")
	_check(absf(fluid.total_amount("water") - 1.0) < 0.001, "lateral equalization also conserves amount")

	fluid.clear_all()
	var boundary_source := Vector2i(15, world.surface_y_at(15) - 1)
	var boundary_target := Vector2i(16, boundary_source.y)
	_check(world.chunk_key_for(boundary_source) != world.chunk_key_for(boundary_target), "fluid boundary fixture straddles two chunks")
	_check(world.set_fluid(boundary_source, "water", 1.0), "cross-chunk fluid fixture is valid")
	world.step_fluids_now(1)
	_check(fluid.amount_at(boundary_target) > 0.20, "fluid propagation crosses chunk boundaries through the same authority")

	fluid.clear_all()
	var far_x := 112
	var far_source := Vector2i(far_x, world.surface_y_at(far_x) - 3)
	var far_target := far_source + Vector2i.DOWN
	_check(world.set_fluid(far_source, "water", 1.0), "remote fluid exists in persistent world state")
	world.step_fluids_now(2)
	_check(fluid.amount_at(far_source) > 0.99 and fluid.amount_at(far_target) < 0.01, "fluid outside active and halo chunks remains asleep")
	_check(fluid.last_sources_considered == 0, "sleeping remote fluid is not scanned as a simulation source")
	player.global_position = world.cell_center(far_source)
	world.refresh_streaming(true)
	world.step_fluids_now(1)
	_check(fluid.amount_at(far_target) > 0.95, "approaching a remote chunk wakes its fluid simulation")
	_check(fluid.last_sources_considered > 0 and fluid.last_chunks_considered <= world.chunk_streamer.max_retained_chunks(), "fluid work is bounded to indexed active-near chunks")

	player.global_position = world.cell_center(Vector2i(0, world.surface_y_at(0) - 2))
	world.refresh_streaming(true)
	fluid.clear_all()
	var reaction_cell := _flat_fixture(world)
	var lava_cell := reaction_cell + Vector2i.RIGHT
	_check(world.set_fluid(reaction_cell, "water", 1.0) and world.set_fluid(lava_cell, "lava", 1.0), "water and lava can coexist in adjacent authoritative cells")
	var mixed_before := fluid.total_amount()
	world.step_fluids_now(1)
	var consumed := 0.0
	for event in fluid.reaction_events:
		consumed += float(event.get("consumed_each", 0.0))
	_check(not fluid.reaction_events.is_empty() and consumed > 0.0, "water-lava contact is routed through the explicit reaction entry point")
	_check(absf(fluid.total_amount() - (mixed_before - consumed * 2.0)) < 0.001, "reaction mass loss is explicit and exactly accounted for")

	fluid.clear_all()
	var dark_cell := Vector2i(7, world.surface_y_at(7) + 6)
	if world.has_cell(dark_cell):
		world.request_world_edit({"action": "mine", "cell": dark_cell, "tool_power": 99.0, "actor_id": "system_fluid_test"})
	world.rebuild_lighting_now()
	var dark_before := world.light_level(dark_cell)
	_check(world.set_fluid(dark_cell, "lava", 1.0), "lava can occupy a mined underground cavity")
	world.rebuild_lighting_now()
	_check(world.light_level(dark_cell) > dark_before + 0.35, "lava emission participates in the same derived lighting authority")

	var snapshot := SliceSaveSystem.snapshot(main)
	_check(snapshot.has("fluid_cells") and (snapshot["fluid_cells"] as Array).size() == fluid.cells.size(), "fluid state is part of authoritative save data")
	fluid.clear_all()
	_check(fluid.cells.is_empty() and fluid.indexed_chunk_count() == 0, "clearing fluid also clears the chunk index")

	print("wildforge_chunk_fluid=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
