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
	var guard_ids := authority.actor_ids(SliceWorldActorAuthority.KIND_RUIN_GUARD)
	var cache_ids := authority.actor_ids(SliceWorldActorAuthority.KIND_RELIC_CACHE)

	_check(authority.descriptor_count() == 4, "two ruin sites create four persistent world actor descriptors")
	_check(guard_ids.size() == 2 and cache_ids.size() == 2, "guard/cache identities live in one actor authority")
	_check(authority.projected_count() == 4, "spawn streams nearby ruin actors as local projections")
	_check(main.get_tree().get_nodes_in_group("ruin_guards").size() == 2, "nearby guard projections exist exactly once")
	_check(main.get_tree().get_nodes_in_group("relic_caches").size() == 2, "nearby cache projections exist exactly once")

	var baseline := SliceSaveSystem.snapshot(main)
	_check((baseline["guards"] as Array).size() == 2 and (baseline["caches"] as Array).size() == 2, "save reads persistent actor authority while projections are loaded")

	var far_cell: Vector2i = world.remote_vein_cells[-1]
	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	await process_frame
	_check(authority.projected_count() == 0, "leaving ruin chunks unloads local actor projections")
	_check(main.get_tree().get_nodes_in_group("ruin_guards").is_empty() and main.get_tree().get_nodes_in_group("relic_caches").is_empty(), "unloaded actors leave no hidden scene nodes")
	for actor_id in guard_ids + cache_ids:
		_check(authority.is_present(actor_id), "unloading projection preserves persistent actor " + actor_id)
	var sleeping_snapshot := SliceSaveSystem.snapshot(main)
	_check((sleeping_snapshot["guards"] as Array).size() == 2 and (sleeping_snapshot["caches"] as Array).size() == 2, "saving while actors are unloaded never mistakes streaming for death")

	player.global_position = world.cell_center(Vector2i(0, world.surface_y_at(0) - 2))
	world.refresh_streaming(true)
	await process_frame
	_check(authority.projected_count() == 4, "returning to active chunks reprojects persistent actors")
	_check(main.get_tree().get_nodes_in_group("ruin_guards").size() == 2 and main.get_tree().get_nodes_in_group("relic_caches").size() == 2, "reprojection creates no duplicate local actors")

	var guard_id := guard_ids[0]
	var cache_id := cache_ids[0]
	var cache := authority.projection_for(cache_id) as SliceRelicCache
	if cache.guard_actor_id != guard_id:
		guard_id = cache.guard_actor_id
	var guard := authority.projection_for(guard_id) as SliceCrawler
	_check(cache != null and guard != null and cache.guard_alive(), "cache lock resolves the persistent guard identity")
	guard.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	_check(not authority.is_present(guard_id), "defeating a streamed guard removes its persistent actor authority")
	_check(not cache.guard_alive(), "cache unlock reads guard authority rather than node presence")
	cache.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	_check(not authority.is_present(cache_id), "opening a streamed cache removes its persistent actor authority")

	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	await process_frame
	var after_remove := SliceSaveSystem.snapshot(main)
	_check((after_remove["guards"] as Array).size() == 1 and (after_remove["caches"] as Array).size() == 1, "removed actors persist as absent even while every projection is unloaded")
	player.global_position = world.cell_center(Vector2i(0, world.surface_y_at(0) - 2))
	world.refresh_streaming(true)
	await process_frame
	_check(not authority.is_projected(guard_id) and not authority.is_projected(cache_id), "removed actors do not resurrect when their chunk streams back in")
	_check(authority.projected_count() == 2, "only the surviving ruin pair is reprojected after return")

	print("wildforge_actor_streaming=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
