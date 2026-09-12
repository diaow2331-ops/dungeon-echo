extends SceneTree

var failed := false
const ALT_SEED := 918273

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

func _fingerprint(generator: SliceWorldGenerator) -> Array:
	var rows: Array = []
	for x in [-377, -211, -71, 0, 83, 247, 401]:
		var surface := generator.surface_y_at(x)
		rows.append([x, surface, generator.biome_at(x), generator.base_tile_at(Vector2i(x, surface + 12))])
	return rows

func _run() -> void:
	var a := SliceWorldGenerator.new(SliceWorld.DEFAULT_WORLD_SEED)
	var b := SliceWorldGenerator.new(SliceWorld.DEFAULT_WORLD_SEED)
	var c := SliceWorldGenerator.new(ALT_SEED)
	_check(_fingerprint(a) == _fingerprint(b), "same world seed produces the same deterministic terrain channels")
	_check(_fingerprint(a) != _fingerprint(c), "different world seed materially changes deterministic terrain channels")

	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var default_surface := world.surface_y_at(247)
	_check(world.world_seed == SliceWorld.DEFAULT_WORLD_SEED, "new worlds begin from the explicit default seed")
	_check(main.reconfigure_world_seed(ALT_SEED), "runtime world authority can rebuild from a different seed")
	world = main.get_node("World") as SliceWorld
	_check(world.world_seed == ALT_SEED and world.surface_y_at(247) != default_surface, "seed rebuild replaces the deterministic terrain baseline")
	_check(world.export_cell_overrides().is_empty(), "seed rebuild starts with zero player terrain deltas")
	_check(world.structure_authority.structure_ids().size() >= 3, "structure blueprints rebuild above the regenerated terrain")
	_check(main.actor_authority.descriptor_count(SliceWorldActorAuthority.KIND_TREE) > 3, "vegetation actor baseline rebuilds from the regenerated world")
	_check(main.get_tree().get_nodes_in_group("enemies").size() >= 3, "regenerative local enemies are reconstructed after seed rebuild")

	var changed := Vector2i(0, world.surface_y_at(0) + 4)
	_check(world.mine_at(changed), "seeded world mutation still routes through the ordinary edit authority")
	var snapshot := SliceSaveSystem.snapshot(main)
	_check(int(snapshot["world_seed"]) == ALT_SEED and int(snapshot["world_generation"]) == SliceWorld.WORLD_GENERATION_VERSION, "v18 snapshot binds deltas to seed and generation")

	var fresh := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(fresh, snapshot), "v18 snapshot can reconfigure a fresh runtime to its saved seed")
	var restored := fresh.get_node("World") as SliceWorld
	_check(restored.world_seed == ALT_SEED, "restored world uses the saved non-default seed")
	_check(restored.surface_y_at(247) == world.surface_y_at(247), "restored seed reconstructs the same deterministic terrain")
	_check(not restored.has_cell(changed), "saved terrain delta applies only after the correct seed baseline is rebuilt")
	_check(fresh.actor_authority.descriptor_count(SliceWorldActorAuthority.KIND_TREE) == main.actor_authority.descriptor_count(SliceWorldActorAuthority.KIND_TREE), "actor baseline is regenerated from the restored seed without duplication")

	var missing_seed := snapshot.duplicate(true)
	missing_seed.erase("world_seed")
	_check(not SliceSaveSystem.validate_snapshot(missing_seed), "v18 validation rejects a delta save with no seed")
	var wrong_generation := snapshot.duplicate(true)
	wrong_generation["world_generation"] = SliceWorld.LEGACY_WORLD_GENERATION_VERSION
	_check(not SliceSaveSystem.validate_snapshot(wrong_generation), "v18 validation rejects a mismatched generation contract")
	var forged_v17 := snapshot.duplicate(true)
	forged_v17["version"] = SliceSaveSystem.LEGACY_VEGETATION_SAVE_VERSION
	forged_v17["world_generation"] = SliceWorld.LEGACY_WORLD_GENERATION_VERSION
	forged_v17["world_seed"] = ALT_SEED
	_check(not SliceSaveSystem.validate_legacy_vegetation_snapshot(forged_v17), "v17 migration refuses a seed that never existed in the legacy schema")

	main.free()
	fresh.free()
	print("wildforge_world_generator=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
