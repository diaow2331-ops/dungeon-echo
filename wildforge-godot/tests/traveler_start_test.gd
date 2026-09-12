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

	_check(player.equipped_weapon_id == "starter_blade", "traveler starts with one ordinary blade")
	_check(player.equipped_pick_id.is_empty() and absf(player.pick_power()) < 0.001, "traveler starts without mining capability")
	_check(player.equipped_axe_id.is_empty(), "traveler starts without an axe")
	_check(player.item_count("soil") == 0 and player.item_count("stone") == 0 and player.item_count("wood") == 0, "traveler starts without free building resources")
	var stone := Vector2i(0, world.surface_y_at(0) + 5)
	var before := world.tile_at(stone)
	_check(not player.harvest_cell(stone) and world.tile_at(stone) == before, "bare-handed traveler cannot mine the world foundation")
	var trees := main.get_tree().get_nodes_in_group("resource_trees")
	_check(not trees.is_empty() and not player.can_harvest_target(trees[0]), "ordinary blade cannot substitute for an axe")
	_check(absf(SliceWorldClock.DAY_SECONDS - 720.0) < 0.001, "one game day equals twelve real minutes")
	var day_before := world.clock.day_index
	var time_before := world.clock.time_of_day
	world.clock.advance(SliceWorldClock.DAY_SECONDS)
	_check(world.clock.day_index == day_before + 1 and absf(world.clock.time_of_day - time_before) < 0.001, "clock advances exactly one day per 720 seconds")
	player.health = 80.0
	player.hunger = 50.0
	player.velocity = Vector2.ZERO
	player.global_position = world.cell_center(Vector2i(0, world.surface_y_at(0) - 2))
	player._update_survival(3.0)
	_check(absf(player.health - 80.0) < 0.001, "ordinary standing and travel never passively regenerate health")

	print("wildforge_traveler_start=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
