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

func _collect_item(main: Node, item_id: String) -> int:
	var collected := 0
	for node in main.get_tree().get_nodes_in_group("pickups"):
		if is_instance_valid(node) and node is SliceItemPickup and not bool(node.collected) and String(node.item_id) == item_id:
			collected += int(node.count)
			node.collect_now()
	return collected

func _fell_tree(main: Node, player: SlicePlayer, tree: SliceTreeResource) -> int:
	if not player.can_harvest_target(tree):
		return 0
	for _hit in range(3):
		tree.apply_hit(player.melee_damage(), Vector2.ZERO)
	return _collect_item(main, "wood")

func _mine_stone(main: Node, world: SliceWorld, player: SlicePlayer, wanted: int) -> int:
	var mined := 0
	for x in range(-12, 13):
		for depth in range(1, 11):
			if mined >= wanted:
				return mined
			var cell := Vector2i(x, world.surface_y_at(x) + depth)
			var tile := world.tile_at(cell)
			if world.block_registry.drop_item(tile) != "stone" or world.required_pick_power(cell) > player.pick_power() + 0.001:
				continue
			if player.harvest_cell(cell):
				mined += _collect_item(main, "stone")
	return mined

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	_check(player.item_count("wood") == 0 and player.item_count("stone") == 0 and player.item_count("plank") == 0, "fresh traveler begins with zero injected building resources")
	_check(player.equipped_axe_id == "traveler_hatchet" and player.equipped_pick_id.is_empty(), "fresh traveler has a travel hatchet but no mining tool")
	var nearest_threat_cells := 9999.0
	for threat in main.get_tree().get_nodes_in_group("enemies"):
		if threat is Node2D:
			nearest_threat_cells = minf(nearest_threat_cells, absf((threat as Node2D).global_position.x - player.global_position.x) / SliceWorld.TILE_SIZE)
	_check(nearest_threat_cells >= float(main.START_SAFE_RADIUS_CELLS), "starter gathering space keeps hostile actors outside the opening safe radius")

	var trees: Array = main.get_tree().get_nodes_in_group("resource_trees")
	trees.sort_custom(func(a, b): return (a as Node2D).global_position.x < (b as Node2D).global_position.x)
	_check(trees.size() >= 3, "starter region exposes at least three deterministic real trees")
	if trees.size() < 3:
		print("wildforge_first30_start_loop=FAIL")
		quit(1)
		return
	_check(_fell_tree(main, player, trees[0] as SliceTreeResource) == 2, "travel hatchet turns the first real tree into two physical wood")
	_check(player.craft("plank") and player.craft("plank"), "first two wood become exactly eight planks")
	_check(player.item_count("plank") == 8 and player.item_count("wood") == 0, "starter crafting conserves first-tree inputs")
	_check(player.craft("workbench"), "eight planks create the first real workbench")
	var bench_cell := Vector2i(5, world.surface_y_at(5) - 1)
	_check(player.place_workbench_at(bench_cell), "traveler places the first workbench into the authoritative world")

	_check(_fell_tree(main, player, trees[1] as SliceTreeResource) == 2, "second real tree supplies wood for the first mining tool")
	_check(player.craft("plank"), "one second-tree wood becomes four planks")
	player.global_position = world.cell_center(bench_cell) + Vector2(0, -26)
	_check(world.near_workbench(player.global_position) and player.can_craft("wood_pick"), "four planks at the real workbench unlock the wood pick")
	_check(player.context_label() == "镐" and player.context_action(), "mobile context path crafts the first mining tool instead of requiring a hidden menu")
	_check(player.equipped_pick_id == "wood_pick" and absf(player.pick_power() - 1.0) < 0.001, "crafted wood pick grants exactly baseline 1.0 mining power")

	_check(_fell_tree(main, player, trees[2] as SliceTreeResource) == 2, "third real tree supplies campfire wood without free stock")
	var stone_gained := _mine_stone(main, world, player, 6)
	_check(stone_gained >= 6 and player.item_count("stone") >= 6, "wood pick mines six real stone through world edit authority")
	_check(player.can_craft("campfire") and player.craft("campfire"), "real mined stone plus harvested wood craft the first campfire")
	var fire_cell := Vector2i(8, world.surface_y_at(8) - 1)
	_check(player.place_campfire_at(fire_cell) and world.has_campfire(), "crafted campfire becomes a physical world station")

	var boars: Array = main.get_tree().get_nodes_in_group("hunt_targets")
	_check(not boars.is_empty(), "starter region exposes one real food animal")
	if not boars.is_empty():
		var hunt_distance_cells := absf(((boars[0] as Node2D).global_position.x - player.global_position.x) / SliceWorld.TILE_SIZE)
		_check(hunt_distance_cells <= 30.0, "first food animal remains within a short deliberate hunt from the safe starter area")
	if not boars.is_empty():
		var boar := boars[0] as SliceBrambleBoar
		boar.loot_min = 1
		boar.loot_max = 1
		while is_instance_valid(boar) and boar.hp > 0.0:
			boar.apply_hit(player.melee_damage(), Vector2.ZERO)
		_collect_item(main, "raw_meat")
		player.hunger = 50.0
		var hunger_before := player.hunger
		_check(player.item_count("raw_meat") >= 1 and player.eat_item("raw_meat"), "hunted food enters the same inventory and can be eaten")
		_check(player.hunger > hunger_before, "first food solves a real survival need")

	print("wildforge_first30_start_loop=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
