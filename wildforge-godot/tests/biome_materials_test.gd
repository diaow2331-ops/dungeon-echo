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
	var registry := world.block_registry as SliceBlockRegistry
	var biome_ids := [SliceWorld.ASH, SliceWorld.SANDSTONE, SliceWorld.BASALT, SliceWorld.SNOW, SliceWorld.ICE]
	_check(registry.schema_version == 3 and biome_ids.all(func(tile: int): return registry.has(tile)), "block registry formally owns all five biome materials")
	_check(registry.drop_item(SliceWorld.BASALT) == "basalt" and registry.is_placeable(SliceWorld.BASALT), "biome material registry owns drops and placement legality")

	var frost_x := -450
	var verdant_x := 0
	var ember_x := 450
	var frost_surface := world.surface_y_at(frost_x)
	var verdant_surface := world.surface_y_at(verdant_x)
	var ember_surface := world.surface_y_at(ember_x)
	_check(world.biome_at(frost_x) == "frostglass" and world.biome_at(verdant_x) == "verdant_reach" and world.biome_at(ember_x) == "ember_wastes", "macro biome positions remain deterministic")
	_check(world.generator.base_tile_at(Vector2i(frost_x, frost_surface)) == SliceWorld.SNOW, "Frostglass surface is authoritative snow")
	_check(world.generator.base_tile_at(Vector2i(frost_x, frost_surface + 1)) == SliceWorld.ICE, "Frostglass shallow substrate is authoritative ice")
	_check(world.generator.base_tile_at(Vector2i(verdant_x, verdant_surface)) == SliceWorld.GRASS and world.generator.base_tile_at(Vector2i(verdant_x, verdant_surface + 1)) == SliceWorld.DIRT, "Verdant Reach keeps grass and dirt authority")
	_check(world.generator.base_tile_at(Vector2i(ember_x, ember_surface)) == SliceWorld.ASH, "Ember Wastes surface is authoritative ash")
	_check(world.generator.base_tile_at(Vector2i(ember_x, ember_surface + 1)) == SliceWorld.SANDSTONE, "Ember Wastes shallow substrate is authoritative sandstone")
	_check(world.generator.base_tile_at(Vector2i(ember_x, ember_surface + 4)) == SliceWorld.BASALT, "Ember Wastes deep substrate is authoritative basalt")
	var basalt_cell := Vector2i(ember_x, ember_surface + 4)
	var mined := world.request_world_edit({"action":"mine", "cell":basalt_cell, "tool_power":1.0, "actor_id":"biome_test"})
	_check(bool(mined.get("changed", false)) and String(mined.get("drop_item", "")) == "basalt", "mining biome substrate uses the unified world edit authority and registry drop")
	var restored := world.request_world_edit({"action":"place", "cell":basalt_cell, "tile":SliceWorld.BASALT, "actor_id":"biome_test"})
	_check(bool(restored.get("changed", false)) and world.tile_at(basalt_cell) == SliceWorld.BASALT, "placing biome material returns through the same world authority")

	var placed_cell := Vector2i(ember_x, ember_surface - 1)
	var placed := world.request_world_edit({"action":"place", "cell":placed_cell, "tile":SliceWorld.ASH, "actor_id":"biome_test"})
	_check(bool(placed.get("changed", false)), "new biome block ids can exist as player-authored world deltas")
	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == 23 and int(snap.get("world_generation", 0)) == 5, "biome-material baseline is bound to schema 23 generation 5")
	_check(SliceSaveSystem.validate_snapshot(snap), "schema 23 validates new biome block ids")
	var legacy22 := snap.duplicate(true)
	legacy22["version"] = SliceSaveSystem.LEGACY_THREE_SETTLEMENT_SAVE_VERSION
	legacy22["world_generation"] = SliceWorld.THREE_SETTLEMENT_WORLD_GENERATION_VERSION
	_check(not SliceSaveSystem.validate_legacy_three_settlement_snapshot(legacy22), "schema 22 validator rejects block ids that did not exist in generation 4")
	var fresh := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(fresh, snap), "schema 23 biome-material snapshot restores into a fresh runtime")
	var fresh_world := fresh.get_node("World") as SliceWorld
	_check(fresh_world.tile_at(placed_cell) == SliceWorld.ASH, "player-authored biome material survives save round-trip")

	main.free()
	fresh.free()
	print("wildforge_biome_materials=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
