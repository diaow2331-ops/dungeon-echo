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

	var stone_cell := Vector2i(0, world.surface_y_at(0) + 4)
	var base_time := world.mine_time(stone_cell)
	_check(absf(player.effective_mine_time(stone_cell) - base_time) < 0.001, "starter pick keeps baseline mining time")
	player.add_item("stone", 8)
	player.add_item("wood", 2)
	_check(not player.can_craft("stone_pick"), "stone pick recipe is blocked away from workbench")

	var bench_cell := Vector2i(5, world.surface_y_at(5) - 1)
	var bench := world.spawn_workbench(bench_cell)
	_check(bench != null, "progression test creates one supported workbench")
	player.global_position = world.cell_center(bench_cell) + Vector2(0, -26)
	_check(world.near_workbench(player.global_position), "workbench uses a bounded local station range")
	_check(player.can_craft("stone_pick"), "canonical eight stone plus two wood unlocks stone pick near workbench")
	_check(player.context_label() == "镐", "compact context action exposes pick upgrade when available")
	_check(player.craft("stone_pick"), "stone pick craft succeeds")
	_check(player.equipped_pick_id == "stone_pick", "crafted stone pick auto-equips in the proof slice")
	_check(absf(player.pick_power() - 1.75) < 0.001, "stone pick uses canonical 1.75 mining power")
	_check(absf(player.effective_mine_time(stone_cell) - base_time / 1.75) < 0.001, "stone pick materially shortens mining time")
	_check(not player.can_craft("stone_pick"), "unique proof equipment cannot be duplicated")

	player.add_item("stone", 6)
	player.add_item("wood", 2)
	_check(player.can_craft("stone_blade"), "canonical six stone plus two wood unlocks stone blade near workbench")
	_check(player.context_label() == "刃", "compact context action exposes blade upgrade after pick")
	var damage_before := player.melee_damage()
	var force_before := player.melee_force()
	_check(player.craft("stone_blade"), "stone blade craft succeeds")
	_check(player.equipped_weapon_id == "stone_blade", "crafted stone blade auto-equips in the proof slice")
	_check(absf(player.melee_damage() / damage_before - 7.0 / 5.0) < 0.001, "stone blade preserves canonical 5-to-7 damage growth ratio")
	_check(absf(player.melee_force() / force_before - 4.8 / 4.2) < 0.001, "stone blade preserves canonical 4.2-to-4.8 knockback growth ratio")

	var enemy := main.get_tree().get_nodes_in_group("enemies")[0] as SliceCrawler
	enemy.global_position = player.global_position + Vector2(60, 0)
	var hp_before := enemy.hp
	player._start_attack(enemy, Vector2.RIGHT)
	player._connect_attack()
	_check(absf((hp_before - enemy.hp) - player.melee_damage()) < 0.001, "equipped blade changes real melee damage, not only UI state")
	_check(absf(enemy.velocity.x) > force_before, "equipped blade increases real knockback impulse")

	print("wildforge_godot_progression=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
