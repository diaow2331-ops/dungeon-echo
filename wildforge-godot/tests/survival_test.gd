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

	_check(absf(SlicePlayer.HUNGER_MAX - 100.0) < 0.001, "hunger max preserves canonical 100")
	_check(absf(SlicePlayer.HUNGER_START - 82.0) < 0.001, "spawn hunger preserves canonical 82")
	_check(absf(SlicePlayer.HUNGER_DRAIN_PER_SEC - 100.0 / 720.0) < 0.0001, "hunger drain preserves canonical four-cycle rate")
	_check(player.hunger <= 82.0 and player.hunger > 81.9, "new slice player starts at canonical hunger before normal frame drain")
	player.hunger = 50.0
	player._update_survival(7.2)
	_check(absf(player.hunger - 49.0) < 0.01, "survival tick drains hunger continuously")
	player.hunger = 19.0
	_check(absf(player.movement_speed_multiplier() - 0.88) < 0.001, "low hunger applies canonical movement penalty")
	player.hunger = 0.0
	_check(absf(player.movement_speed_multiplier() - 0.78) < 0.001, "empty hunger applies canonical severe movement penalty")
	player.health = 100.0
	player.starvation_tick = 3.9
	player._update_survival(0.2)
	_check(absf(player.health - 98.0) < 0.001, "starvation deals canonical two damage after four-second interval")

	player.hunger = 50.0
	player.add_item("raw_meat", 1)
	_check(player.eat_item("raw_meat"), "raw meat can be eaten when hungry")
	_check(absf(player.hunger - 59.0) < 0.001, "raw meat restores canonical nine hunger")

	var meat_enemy: Node = null
	for node in main.get_tree().get_nodes_in_group("hunt_targets"):
		if is_instance_valid(node) and node.get("loot_item_id") == "raw_meat":
			meat_enemy = node
			break
	_check(meat_enemy != null, "one sparse hunt target carries the canonical raw-meat drop")
	var pickup_before := main.get_tree().get_nodes_in_group("pickups").size()
	if meat_enemy != null:
		meat_enemy.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	var meat_pickups := 0
	for node in main.get_tree().get_nodes_in_group("pickups"):
		if node is SliceItemPickup and node.item_id == "raw_meat":
			meat_pickups += 1
	_check(main.get_tree().get_nodes_in_group("pickups").size() > pickup_before and meat_pickups == 1, "hunt kill creates one physical raw-meat pickup stack")

	player.add_item("stone", 6)
	player.add_item("wood", 2)
	_check(player.can_craft("campfire"), "six stone plus two wood unlocks canonical campfire craft")
	_check(player.craft("campfire"), "campfire craft succeeds")
	_check(player.item_count("stone") == 0 and player.item_count("campfire") == 1, "campfire craft conserves canonical inputs and output")
	var fire_cell := Vector2i(5, world.surface_y_at(5) - 1)
	_check(player.place_campfire_at(fire_cell), "crafted campfire can be placed on supported empty ground")
	_check(world.has_campfire(), "world owns the placed campfire station")
	player.global_position = world.cell_center(fire_cell) + Vector2(0, -26)
	_check(world.near_campfire(player.global_position), "campfire station exposes bounded local cooking range")

	player.add_item("raw_meat", 2)
	player.add_item("wood", 1)
	_check(player.can_craft("trail_ration"), "two meat plus one wood cooks only near campfire")
	_check(player.craft("trail_ration"), "trail ration craft succeeds")
	_check(player.item_count("trail_ration") == 1, "cooking creates exactly one trail ration")
	player.hunger = 40.0
	_check(player.eat_item("trail_ration"), "trail ration can be eaten")
	_check(absf(player.hunger - 78.0) < 0.001, "trail ration restores canonical thirty-eight hunger")

	player.health = 80.0
	player.hunger = 50.0
	player.invuln = 0.0
	player._update_survival(1.0)
	_check(player.health > 82.3 and player.health < 82.5, "campfire rest gives bounded canonical daytime healing")

	print("wildforge_godot_survival=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
