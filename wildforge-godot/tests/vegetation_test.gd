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
	var authority := main.actor_authority as SliceWorldActorAuthority
	var tree_ids := authority.actor_ids(SliceWorldActorAuthority.KIND_TREE)

	_check(authority.vegetation_registry.schema_version >= 1 and authority.vegetation_registry.has("wild_tree"), "tree species comes from the vegetation registry")
	_check(tree_ids.size() > SliceWorld.LEGACY_TREE_XS.size(), "deterministic world baseline contains real distant forest beyond the legacy three trees")
	_check(authority.projected_count(SliceWorldActorAuthority.KIND_TREE) == 3, "spawn chunk projects only the three nearby onboarding trees")
	var fresh_delta := authority.vegetation_delta()
	_check((fresh_delta["removed"] as Array).is_empty() and (fresh_delta["planted"] as Array).is_empty(), "fresh deterministic forest costs zero vegetation save deltas")

	var far_id := ""
	var far_cell := Vector2i.ZERO
	for actor_id in tree_ids:
		var descriptor: Dictionary = authority.descriptors[actor_id]
		var cell: Vector2i = descriptor["cell"]
		if absi(cell.x) >= 66:
			far_id = actor_id
			far_cell = cell
			break
	_check(not far_id.is_empty() and not authority.is_projected(far_id), "distant forest exists as authority without allocating scene nodes")

	var claim_rect := Rect2i(far_cell.x - 1, far_cell.y - 1, 3, 3)
	_check(world.ownership_authority.claim_region("ember", claim_rect, "forest_concession"), "faction can claim the land containing an existing wild tree")
	_check(String(authority.ownership_for(far_id).get("owner_id", "")) == "ember", "wild-tree ownership resolves dynamically from current territorial authority")
	_check(world.ownership_authority.transfer_owner("ember", "frost") >= 1, "forest territory can transfer during annexation without rewriting vegetation")
	_check(String(authority.ownership_for(far_id).get("owner_id", "")) == "frost", "annexation immediately changes existing tree ownership through the same claim authority")

	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	await process_frame
	_check(authority.is_projected(far_id), "approaching distant forest projects its authoritative tree")
	var far_tree := authority.projection_for(far_id) as SliceTreeResource
	_check(far_tree != null and far_tree.hp == authority.vegetation_registry.harvest_hits("wild_tree"), "tree projection uses registry-defined harvest durability")
	for _hit in range(authority.vegetation_registry.harvest_hits("wild_tree")):
		far_tree.apply_hit(24.0, Vector2.ZERO)
	await process_frame
	var cut_delta := authority.vegetation_delta()
	_check(not authority.is_present(far_id) and (cut_delta["removed"] as Array).size() == 1, "felling a baseline tree records one removal delta instead of rewriting the forest")

	var plant_x := far_cell.x + 2
	var plant_cell := Vector2i(plant_x, world.surface_y_at(plant_x) - 1)
	var planted_id := authority.plant_tree(plant_cell, "wild_tree", "frost")
	_check(not planted_id.is_empty() and authority.is_present(planted_id), "forestry authority can plant a persistent tree on supported empty ground")
	_check(String(authority.ownership_for(planted_id).get("owner_id", "")) == "frost", "planted tree may retain an explicit forestry owner")
	var planted_delta := authority.vegetation_delta()
	_check((planted_delta["removed"] as Array).size() == 1 and (planted_delta["planted"] as Array).size() == 1, "save delta distinguishes baseline removal from planted vegetation")

	var planted_tree := authority.projection_for(planted_id) as SliceTreeResource
	if planted_tree != null:
		for _hit in range(authority.vegetation_registry.harvest_hits("wild_tree")):
			planted_tree.apply_hit(24.0, Vector2.ZERO)
		await process_frame
	var after_planted_cut := authority.vegetation_delta()
	_check((after_planted_cut["planted"] as Array).is_empty(), "felling a planted tree removes its planted delta instead of creating a second tombstone")

	var restored_id := authority.plant_tree(far_cell, "wild_tree")
	_check(restored_id == far_id and authority.is_present(far_id), "replanting a felled deterministic site restores the same stable baseline tree identity")
	var restored_delta := authority.vegetation_delta()
	_check((restored_delta["removed"] as Array).is_empty() and (restored_delta["planted"] as Array).is_empty(), "restoring baseline vegetation collapses save delta back to zero")
	var snap := SliceSaveSystem.snapshot(main)
	_check((snap["vegetation"]["removed"] as Array).is_empty() and (snap["vegetation"]["planted"] as Array).is_empty(), "current snapshot stores only vegetation deviations, never the deterministic forest baseline")

	print("wildforge_vegetation_authority=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
