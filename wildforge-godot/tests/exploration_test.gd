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

	_check(world.exploration_site_count() == 2, "two bounded ruin pockets create left/right exploration goals")
	_check(main.get_tree().get_nodes_in_group("relic_caches").size() == 2, "each ruin pocket owns one relic cache")
	_check(main.get_tree().get_nodes_in_group("ruin_guards").size() == 2, "each relic cache has one sparse local guard")

	for site in world.exploration_sites:
		var cache_cell: Vector2i = site["cache_cell"]
		_check(abs(cache_cell.x) >= 28, "ruin cache is materially outside the spawn neighborhood")
		_check(world.depth_at(cache_cell) >= 6, "ruin cache requires a shallow-underground expedition")
		var side := int(site["side"])
		var ore_probe := cache_cell + Vector2i(-side * 3, 0)
		_check(world.tile_at(ore_probe) == SliceWorld.COPPER, "ruin pocket exposes a canonical copper vein")
		_check(world.tile_at(ore_probe + Vector2i(-side, 0)) == SliceWorld.COAL, "ruin pocket exposes fuel beside copper")

	var caches := main.get_tree().get_nodes_in_group("relic_caches")
	var cache := caches[0] as SliceRelicCache
	var pickup_before := main.get_tree().get_nodes_in_group("pickups").size()
	cache.apply_hit(999.0, Vector2.ZERO)
	_check(not cache.opened, "relic cache cannot be brute-forced while its guard lives")
	_check(main.get_tree().get_nodes_in_group("pickups").size() == pickup_before, "locked cache never leaks rewards")
	var guard := cache.guard as SliceCrawler
	guard.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	_check(not cache.guard_alive(), "defeating the local guard unlocks its cache")
	cache.apply_hit(999.0, Vector2.ZERO)
	_check(cache.opened, "unlocked cache opens from the same committed primary action")
	await process_frame

	var reward_counts := {"ancient_core": 0, "coal": 0, "copper_ore": 0}
	for node in main.get_tree().get_nodes_in_group("pickups"):
		if node is SliceItemPickup and reward_counts.has(node.item_id):
			reward_counts[node.item_id] += node.count
	_check(reward_counts["ancient_core"] == SliceRelicCache.CORE_REWARD, "cache grants exactly one canonical ancient core")
	_check(reward_counts["coal"] == SliceRelicCache.COAL_REWARD, "cache grants bounded shallow-ruin coal")
	_check(reward_counts["copper_ore"] == SliceRelicCache.COPPER_REWARD, "cache grants bounded shallow-ruin copper")

	for node in main.get_tree().get_nodes_in_group("pickups"):
		if node is SliceItemPickup and reward_counts.has(node.item_id):
			node.collect_now()
	_check(player.item_count("ancient_core") == 1 and player.item_count("coal") == 2 and player.item_count("copper_ore") == 3, "exploration rewards feed the same player stock authority")

	print("wildforge_godot_exploration=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
