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

	_check(world.deep_site_count() == 1, "one bounded deep annex extends the early exploration loop")
	var site: Dictionary = world.deep_sites[0]
	var gates: Array = site["gate_cells"]
	var copper_cells: Array = site["copper_cells"]
	var coal_cells: Array = site["coal_cells"]
	_check(int(site["depth"]) >= 10, "deep annex is materially deeper than the shallow cache pocket")
	_check(gates.size() == 2, "deep annex entrance is sealed by a two-block relic barrier")
	for cell in gates:
		_check(world.tile_at(cell) == SliceWorld.SEALED_RUIN, "deep barrier remains authoritative world tile data")
		_check(absf(world.required_pick_power(cell) - 2.30) < 0.001, "sealed relic barrier requires canonical copper-pick power")
	_check(copper_cells.size() == 6 and copper_cells.all(func(c): return world.tile_at(c) == SliceWorld.COPPER), "deep annex contains exactly six copper ore tiles")
	_check(coal_cells.size() == 3 and coal_cells.all(func(c): return world.tile_at(c) == SliceWorld.COAL), "deep annex contains exactly three coal tiles")
	_check(coal_cells.all(func(c): return c.x <= SliceWorld.MAX_X), "deep-annex rewards stay inside the world boundary")

	var gate: Vector2i = gates[0]
	player.equipped_pick_id = "stone_pick"
	_check(player.effective_mine_time(gate) == 0.0, "stone pick cannot progress the sealed deep barrier")
	_check(not player.harvest_cell(gate), "direct harvest path also rejects under-tier tools")
	_check(world.tile_at(gate) == SliceWorld.SEALED_RUIN, "failed under-tier mining never mutates the gate")
	player.equipped_pick_id = "copper_pick"
	_check(player.effective_mine_time(gate) > 0.0, "copper pick unlocks measurable progress on the deep barrier")
	_check(player.harvest_cell(gate), "copper pick can break the deep barrier through normal harvest authority")
	_check(not world.has_cell(gate), "successful gate mining mutates the same world cell authority")

	var bench_cell := Vector2i(7, world.surface_y_at(7) - 1)
	var bench := world.spawn_workbench(bench_cell)
	_check(bench != null, "deep progression can reuse the existing Craft Table")
	player.global_position = world.cell_center(bench_cell) + Vector2(0, -26)
	player.add_item("ancient_core", 1)
	player.add_item("copper_bar", 3)
	player.add_item("wood", 2)
	_check(player.can_craft("delver_pick"), "ancient core plus three copper bars unlocks the canonical Relic Delver Pick")
	_check(player.craft("delver_pick"), "Relic Delver Pick craft succeeds")
	_check(player.item_count("ancient_core") == 0 and player.item_count("copper_bar") == 0, "delver craft consumes the recovered core and copper exactly once")
	_check(player.equipped_pick_id == "delver_pick", "Relic Delver Pick auto-equips after crafting")
	_check(absf(player.pick_power() - 2.70) < 0.001, "Relic Delver Pick preserves canonical 2.7 mining power")
	_check(player.pick_power() > SlicePlayer.COPPER_PICK_POWER, "ancient-core progression is materially stronger than copper tier")
	_check(not player.can_craft("delver_pick"), "rare delver pick remains unique in the proof inventory")

	print("wildforge_godot_deepgate=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
