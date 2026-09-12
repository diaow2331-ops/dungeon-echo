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
	var structures := world.structure_authority as SliceStructureAuthority

	var baseline_ids := structures.structure_ids()
	_check("ruin_chamber_west" in baseline_ids and "ruin_chamber_east" in baseline_ids and "ruin_deep_gate_east" in baseline_ids, "deterministic world retains both ruin chambers and the deep gate alongside settlement structures")
	_check(absf(structures.integrity("ruin_chamber_west") - 1.0) < 0.001, "structure integrity derives from real baseline tiles")
	var ruin_cells := structures.cells_for("ruin_chamber_west")
	var damaged_cell: Vector2i = ruin_cells[0]
	_check(world.mine_at(damaged_cell, 1.0, "system_damage"), "real structure tile can be damaged through world edit authority")
	var damaged := structures.damage_report("ruin_chamber_west")
	_check(int(damaged["damaged"]) == 1 and float(damaged["integrity"]) < 1.0, "structure damage is derived from missing world tile rather than a parallel hp value")
	var needs := structures.repair_requirements("ruin_chamber_west")
	_check(int(needs.get("stone", 0)) == 1, "repair demand derives material requirement from expected block registry data")
	var repaired := structures.repair_cell("ruin_chamber_west", damaged_cell)
	_check(bool(repaired.get("changed", false)), "structure repair routes through the unified world edit authority")
	_check(world.tile_at(damaged_cell) == SliceWorld.RUIN_BRICK and absf(structures.integrity("ruin_chamber_west") - 1.0) < 0.001, "repair restores the actual structure block and therefore restores integrity")

	var bx := 70
	var by := world.surface_y_at(bx) - 1
	var blueprint: Array = []
	for dx in range(3):
		blueprint.append([bx + dx, by, SliceWorld.STONE])
		blueprint.append([bx + dx, by - 1, SliceWorld.STONE])
	for row in blueprint:
		_check(world.place_at(Vector2i(int(row[0]), int(row[1])), SliceWorld.STONE, "system_builder"), "faction test structure is physically built from real world blocks")
	_check(structures.register_structure("ember_storehouse", "storehouse", blueprint), "runtime structure registers a blueprint over real blocks")
	_check(structures.claim_structure("ember_storehouse", "ember") == blueprint.size(), "structure ownership is delegated to the existing ownership authority")
	_check(structures.owner_id("ember_storehouse") == "ember", "structure owner resolves from world claims rather than duplicated structure state")
	_check(absf(structures.integrity("ember_storehouse") - 1.0) < 0.001, "completed faction structure reads as intact from real blocks")

	var breach := Vector2i(bx + 1, by - 1)
	var attack := world.request_world_edit({"action": "mine", "cell": breach, "tool_power": 1.0, "actor_id": "frost_sapper", "actor_faction": "frost", "war_targets": ["ember"]})
	_check(bool(attack.get("changed", false)) and String(attack.get("legal_status", "")) == "wartime", "wartime damage affects the same real structure tiles")
	_check(int(structures.damage_report("ember_storehouse")["damaged"]) == 1, "wartime breach immediately becomes a structure repair deficit")
	var ownership_changes := world.ownership_authority.transfer_owner("ember", "frost")
	_check(ownership_changes >= blueprint.size(), "annexation transfers structure cell claims through ownership authority")
	_check(structures.owner_id("ember_storehouse") == "frost", "structure ownership changes after annexation without rewriting structure blueprint")
	var fixed := structures.repair_cell("ember_storehouse", breach, "frost_mason", "frost")
	_check(bool(fixed.get("changed", false)) and absf(structures.integrity("ember_storehouse") - 1.0) < 0.001, "new owner can repair the existing captured structure through the same authority path")

	# Baseline structures need no separate save state: terrain deltas + claims reconstruct their condition.
	world.mine_at(damaged_cell, 1.0, "system_damage_again")
	structures.claim_structure("ruin_chamber_west", "ember")
	var snap := SliceSaveSystem.snapshot(main)
	var fresh := packed.instantiate()
	root.add_child(fresh)
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(fresh, snap), "existing save schema restores structure-relevant world and ownership authority")
	var fresh_world := fresh.get_node("World") as SliceWorld
	var fresh_structures := fresh_world.structure_authority as SliceStructureAuthority
	_check(int(fresh_structures.damage_report("ruin_chamber_west")["damaged"]) == 1, "structure damage reconstructs from persisted terrain delta without structure hp save data")
	_check(fresh_structures.owner_id("ruin_chamber_west") == "ember", "structure owner reconstructs from persisted ownership claims without duplicate owner save data")

	print("wildforge_structure_authority=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
