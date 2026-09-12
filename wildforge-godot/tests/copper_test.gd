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

	var copper_tiles := 0
	var coal_tiles := 0
	for raw in world.cells.keys():
		var tile := world.tile_at(raw)
		if tile == SliceWorld.COPPER:
			copper_tiles += 1
		elif tile == SliceWorld.COAL:
			coal_tiles += 1
	var cache_copper := world.exploration_site_count() * SliceRelicCache.COPPER_REWARD
	var cache_coal := world.exploration_site_count() * SliceRelicCache.COAL_REWARD
	_check(copper_tiles + cache_copper >= 10, "two ruin expeditions contain enough copper for one canonical copper pick")
	_check(coal_tiles + cache_coal >= 5, "two ruin expeditions contain enough fuel for five copper bars")

	var bar_recipe: Dictionary = SliceCrafting.RECIPES["copper_bar"]
	var pick_recipe: Dictionary = SliceCrafting.RECIPES["copper_pick"]
	_check(int(bar_recipe["need"]["copper_ore"]) == 2 and int(bar_recipe["need"]["coal"]) == 1, "copper bar preserves canonical two-ore one-coal recipe")
	_check(int(pick_recipe["need"]["copper_bar"]) == 5 and int(pick_recipe["need"]["wood"]) == 2, "copper pick preserves canonical five-bar two-wood recipe")

	player.add_item("copper_ore", 10)
	player.add_item("coal", 5)
	_check(not player.can_craft("copper_bar"), "copper cannot be smelted away from an Ember Pit")
	var fire_cell := Vector2i(4, world.surface_y_at(4) - 1)
	var fire := world.spawn_campfire(fire_cell)
	_check(fire != null, "copper progression can create a local smelting station")
	player.global_position = world.cell_center(fire_cell) + Vector2(0, -26)
	for i in range(5):
		_check(player.can_craft("copper_bar"), "available ruin ore remains smeltable at the Ember Pit")
		_check(player.craft("copper_bar"), "copper bar smelting succeeds")
	_check(player.item_count("copper_bar") == 5 and player.item_count("copper_ore") == 0 and player.item_count("coal") == 0, "five smelts conserve the full expedition resource budget")

	_check(not player.can_craft("copper_pick"), "copper pick is blocked away from a Craft Table")
	var bench_cell := Vector2i(7, world.surface_y_at(7) - 1)
	var bench := world.spawn_workbench(bench_cell)
	_check(bench != null, "copper progression can create a local Craft Table")
	player.global_position = world.cell_center(bench_cell) + Vector2(0, -26)
	player.add_item("wood", 2)
	_check(player.can_craft("copper_pick"), "five bars plus two wood unlock the copper pick at a Craft Table")
	var stone_time := world.mine_time(Vector2i(0, world.surface_y_at(0) + 4)) / SlicePlayer.STONE_PICK_POWER
	_check(player.craft("copper_pick"), "copper pick craft succeeds")
	_check(player.equipped_pick_id == "copper_pick", "crafted copper pick immediately becomes the active mining tool")
	_check(absf(player.pick_power() - 2.30) < 0.001, "copper pick preserves canonical 2.3 mining power")
	var copper_time := world.mine_time(Vector2i(0, world.surface_y_at(0) + 4)) / player.pick_power()
	_check(copper_time < stone_time * 0.80, "copper pick creates a clearly perceptible mining-speed upgrade")
	_check(not player.can_craft("copper_pick"), "unique copper pick cannot be duplicated in the proof stock")

	print("wildforge_godot_copper=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
