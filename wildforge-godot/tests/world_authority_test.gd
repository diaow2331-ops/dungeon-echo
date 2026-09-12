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
	var registry := world.block_registry as SliceBlockRegistry
	_check(registry.schema_version == 1 and registry.blocks.size() == 8, "block registry is data-driven and complete")
	_check(absf(registry.hardness(SliceWorld.COPPER) - 0.72) < 0.001, "registry owns canonical copper hardness")
	_check(registry.drop_item(SliceWorld.COAL) == "coal", "registry owns block drop identity")
	_check(not registry.is_placeable(SliceWorld.COPPER), "registry distinguishes resources from player-placeable terrain")
	var cell := Vector2i(0, world.surface_y_at(0) + 5)
	_check(world.tile_at(cell) == SliceWorld.STONE, "authority fixture begins on baseline stone")
	var denied := world.request_world_edit({"action": "mine", "cell": cell, "tool_power": 0.5, "actor_id": "traveler_test"})
	_check(not bool(denied["allowed"]) and denied["reason"] == "tool_too_weak", "authority rejects insufficient tool power")
	_check(world.tile_at(cell) == SliceWorld.STONE, "denied edit never mutates world authority")
	var mined := world.request_world_edit({"action": "mine", "cell": cell, "tool_power": 1.0, "actor_id": "traveler_test"})
	_check(bool(mined["changed"]), "authorized mining mutates the world once")
	_check(mined["drop_item"] == "stone", "authorized decision carries registry-derived drop metadata")
	_check(mined["owner_id"] == "wilderness" and mined["legal_status"] == "allowed", "authority already carries ownership/legal metadata")
	_check(mined["actor_id"] == "traveler_test", "authority records the editing actor")

	var bad_place := world.request_world_edit({"action": "place", "cell": cell, "tile": SliceWorld.GRASS, "actor_id": "traveler_test"})
	_check(not bool(bad_place["allowed"]) and bad_place["reason"] == "block_not_placeable", "non-placeable registry blocks are rejected")
	var restored := world.request_world_edit({"action": "place", "cell": cell, "tile": SliceWorld.STONE, "actor_id": "traveler_test"})
	_check(bool(restored["changed"]) and world.tile_at(cell) == SliceWorld.STONE, "authorized placement restores the same world authority")
	var gate: Vector2i = (world.deep_sites[0] as Dictionary)["gate_cells"][0]
	var gate_denied := world.request_world_edit({"action": "mine", "cell": gate, "tool_power": 1.75, "actor_id": "traveler_test"})
	_check(not bool(gate_denied["allowed"]) and gate_denied["reason"] == "tool_too_weak", "sealed structure remains protected by registry tool threshold")
	_check(world.tile_at(gate) == SliceWorld.SEALED_RUIN, "denied sealed-structure edit leaves the tile intact")
	var gate_allowed := world.request_world_edit({"action": "mine", "cell": gate, "tool_power": 2.30, "actor_id": "traveler_test"})
	_check(bool(gate_allowed["changed"]), "sufficient tool power passes the same edit authority")

	var bench_cell := Vector2i(7, world.surface_y_at(7) - 1)
	var before := world.edit_authority.decisions
	_check(world.spawn_workbench(bench_cell, "traveler_test") != null, "station placement also passes through world edit authority")
	_check(world.edit_authority.decisions == before + 1, "station placement records exactly one authority decision")
	_check(world.edit_authority.last_decision["actor_id"] == "traveler_test", "station authority preserves actor identity")

	print("wildforge_world_authority=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
