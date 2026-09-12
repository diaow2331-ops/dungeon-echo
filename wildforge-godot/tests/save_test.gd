extends SceneTree

var failed := false
const TEMP_PATH := "user://wildforge-godot-v018-test.json"

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
	for suffix in ["", ".tmp", ".bak"]:
		var cleanup_path: String = TEMP_PATH + String(suffix)
		if FileAccess.file_exists(cleanup_path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(cleanup_path))
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer

	var mined_cell := Vector2i(0, world.surface_y_at(0) + 4)
	_check(world.mine_at(mined_cell), "save fixture mutates authoritative world data")
	player.global_position = Vector2(123.0, 321.0)
	player.health = 73.0
	player.hunger = 47.0
	player.stock["copper_bar"] = 3
	player.stock["ancient_core"] = 1
	player.equipped_pick_id = "delver_pick"
	player.equipped_weapon_id = "stone_blade"
	var bench_cell := Vector2i(6, world.surface_y_at(6) - 1)
	var fire_cell := Vector2i(7, world.surface_y_at(7) - 1)
	_check(world.spawn_workbench(bench_cell) != null, "save fixture places Craft Table")
	_check(world.spawn_campfire(fire_cell) != null, "save fixture places Ember Pit")

	var trees := main.get_tree().get_nodes_in_group("resource_trees")
	_check(trees.size() == 3, "save fixture starts with three resource trees")
	var felled_tree := trees[0] as SliceTreeResource
	for _hit in range(3):
		felled_tree.apply_hit(24.0, Vector2.ZERO)
	await process_frame
	var caches := main.get_tree().get_nodes_in_group("relic_caches")
	var cache := caches[0] as SliceRelicCache
	var opened_x := world.world_to_cell(cache.global_position).x
	var guard := cache.guard as SliceCrawler
	guard.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	cache.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	for node in main.get_tree().get_nodes_in_group("pickups"):
		if node is SliceItemPickup:
			node.collect_now()
	await process_frame

	var fluid_cell := Vector2i(4, world.surface_y_at(4) - 2)
	_check(world.set_fluid(fluid_cell, "water", 0.73), "save fixture adds authoritative fluid state")
	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap["version"]) == SliceSaveSystem.SAVE_VERSION, "snapshot carries explicit save schema version")
	_check(int(snap["world_seed"]) == world.world_seed, "snapshot binds terrain deltas to the authoritative world seed")
	_check((snap["vegetation"]["removed"] as Array).size() == 1 and (snap["vegetation"]["planted"] as Array).is_empty(), "current save stores one felled baseline tree as vegetation delta")
	_check(SliceSaveSystem.save_to_path(main, TEMP_PATH), "save snapshot writes to disk")
	main.free()
	await process_frame

	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "in-memory save snapshot restores into a fresh scene")
	var world2 := restored.get_node("World") as SliceWorld
	var player2 := restored.get_node("Player") as SlicePlayer
	_check(not world2.has_cell(mined_cell), "mined world cell stays mined after restore")
	var saved_fluid_total := 0.0
	for row in snap["fluid_cells"]:
		saved_fluid_total += float(row[3])
	_check(absf(world2.fluid_authority.total_amount() - saved_fluid_total) < 0.001, "fluid authority round-trips through the current save schema")
	var saved_pos := Vector2(float(snap["player"]["x"]), float(snap["player"]["y"]))
	_check(player2.global_position.distance_to(saved_pos) < 0.01, "player position persists at the exact snapshot transform")
	var saved_health := float(snap["player"]["health"])
	var saved_hunger := float(snap["player"]["hunger"])
	_check(absf(player2.health - saved_health) < 0.01 and absf(player2.hunger - saved_hunger) < 0.01, "health and hunger persist from the actual snapshot")
	_check(player2.item_count("copper_bar") == 3 and player2.item_count("ancient_core") >= 1, "single stock authority persists")
	_check(player2.equipped_pick_id == "delver_pick" and player2.equipped_weapon_id == "stone_blade", "equipment selection persists")
	_check(restored.get_tree().get_nodes_in_group("workbenches").size() == 1 and restored.get_tree().get_nodes_in_group("campfires").size() == 1, "placed stations persist exactly once")
	_check(restored.get_tree().get_nodes_in_group("resource_trees").size() == 2, "felled resource tree does not respawn on load")
	_check(restored.get_tree().get_nodes_in_group("relic_caches").size() == 1, "opened relic cache stays opened")
	var opened_present := false
	for node in restored.get_tree().get_nodes_in_group("relic_caches"):
		if world2.world_to_cell((node as Node2D).global_position).x == opened_x:
			opened_present = true
	_check(not opened_present, "the exact opened relic site remains consumed")
	_check(restored.get_tree().get_nodes_in_group("ruin_guards").size() == 1, "defeated relic guard stays defeated")
	await process_frame
	_check(player2.global_position.y >= saved_pos.y, "physics resumes normally after exact restore point is applied")

	restored.free()
	await process_frame
	var disk_restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.load_from_path(disk_restored, TEMP_PATH), "disk save loads into a fresh scene")
	await process_frame
	var disk_player := disk_restored.get_node("Player") as SlicePlayer
	_check(disk_player.equipped_pick_id == "delver_pick" and disk_player.item_count("copper_bar") == 3, "disk round-trip preserves progression state")

	# A second successful write rotates the previous valid primary into a recovery backup.
	_check(SliceSaveSystem.save_to_path(disk_restored, TEMP_PATH), "atomic rewrite succeeds with an existing primary")
	_check(FileAccess.file_exists(TEMP_PATH + ".bak"), "atomic rewrite retains one previous valid backup")
	_check(not FileAccess.file_exists(TEMP_PATH + ".tmp"), "atomic rewrite never leaves a temporary save behind")
	var broken := FileAccess.open(TEMP_PATH, FileAccess.WRITE)
	broken.store_string("{broken-json")
	broken.flush()
	broken = null
	var recovered := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.load_from_path(recovered, TEMP_PATH), "corrupt primary automatically falls back to the previous valid backup")
	var recovered_player := recovered.get_node("Player") as SlicePlayer
	_check(recovered_player.equipped_pick_id == "delver_pick" and recovered_player.item_count("ancient_core") >= 1, "backup recovery preserves real progression authority")
	var legacy_v17 := snap.duplicate(true)
	legacy_v17["version"] = SliceSaveSystem.LEGACY_VEGETATION_SAVE_VERSION
	legacy_v17["world_generation"] = SliceWorld.LEGACY_WORLD_GENERATION_VERSION
	legacy_v17.erase("world_seed")
	_check(SliceSaveSystem.validate_legacy_vegetation_snapshot(legacy_v17), "v17 vegetation snapshot remains a recognized implicit-seed migration source")
	var legacy17_restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy17_restored, legacy_v17), "v17 snapshot migrates explicitly into the v18 seeded runtime")
	var legacy17_world := legacy17_restored.get_node("World") as SliceWorld
	var legacy17_authority := legacy17_restored.actor_authority as SliceWorldActorAuthority
	_check(legacy17_world.world_seed == SliceWorld.DEFAULT_WORLD_SEED, "v17 migration assigns only the historical default seed")
	_check((legacy17_authority.vegetation_delta()["removed"] as Array).size() == 1, "v17 vegetation removal migrates by stable x-column intent")
	legacy17_restored.free()

	var legacy_v16 := legacy_v17.duplicate(true)
	legacy_v16["version"] = SliceSaveSystem.LEGACY_FLUID_SAVE_VERSION
	legacy_v16.erase("vegetation")
	legacy_v16["trees"] = [-5, 14]
	_check(SliceSaveSystem.validate_legacy_fluid_snapshot(legacy_v16), "v16 fluid snapshot remains a recognized migration source")
	var legacy16_restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy16_restored, legacy_v16), "v16 snapshot migrates into the v18 runtime")
	var legacy16_authority := legacy16_restored.actor_authority as SliceWorldActorAuthority
	_check((legacy16_authority.vegetation_delta()["removed"] as Array).size() == 1, "v16 migration applies only the historical three-tree presence contract")
	_check(legacy16_authority.descriptor_count(SliceWorldActorAuthority.KIND_TREE) > 3, "v16 migration preserves newly generated distant forest baseline")
	legacy16_restored.free()

	var legacy_snap := legacy_v16.duplicate(true)
	legacy_snap["version"] = SliceSaveSystem.LEGACY_OWNERSHIP_SAVE_VERSION
	legacy_snap.erase("fluid_cells")
	_check(SliceSaveSystem.validate_legacy_ownership_snapshot(legacy_snap), "v15 ownership snapshot remains a recognized migration source")
	var legacy_restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy_restored, legacy_snap), "v15 snapshot migrates into the v18 runtime")
	var legacy_world := legacy_restored.get_node("World") as SliceWorld
	_check(legacy_world.fluid_authority.cells.is_empty(), "v15 migration initializes fluid authority without inventing persisted liquid")
	legacy_restored.free()

	recovered.free()
	disk_restored.free()
	await process_frame
	for suffix in ["", ".tmp", ".bak"]:
		var cleanup_path: String = TEMP_PATH + String(suffix)
		if FileAccess.file_exists(cleanup_path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(cleanup_path))

	print("wildforge_godot_save=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
