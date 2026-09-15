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

func _new_main() -> Node:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	return main

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	_check(progression.era == SliceWorldProgressionAuthority.ERA_WANDERER, "new world begins in Wanderer era")
	_check(not progression.allows_local_market(), "Wanderer era does not immediately expose the full market loop")
	_check(not progression.allows_autonomous_caravans(), "Wanderer era blocks autonomous cross-region caravans")
	_check(not progression.allows_war(), "Wanderer era blocks formal war")
	_check(not progression.allows_annexation(), "Wanderer era blocks sovereignty rewrite")
	player.forge_marks = 999999
	main.defeats = 999
	for hour in [24, 48, 96, 240]:
		world.settlement_authority.simulate_hour(hour)
		world.faction_authority.simulate_hour(hour)
		progression.simulate_hour_end(hour, [])
	_check(progression.era == SliceWorldProgressionAuthority.ERA_WANDERER, "time, wealth and kill count alone cannot advance the world")
	_check(world.settlement_authority.active_caravans().is_empty(), "long idle simulation cannot invent early caravans")
	_check(String(world.faction_authority.relation("verdant", "ember").get("stance", "")) == "neutral", "early world cannot drift into autonomous war")
	_check(not world.faction_authority.set_relation("verdant", "ember", -80, "war"), "formal war mutation is rejected before Warfront")
	_check(not world.faction_authority.set_status("verdant", "annexed", "ember"), "annexation mutation is rejected before Reforging")

	var market_cell := world.settlement_authority.market_cell("verdant_mossbridge")
	player.global_position = world.cell_center(market_cell)
	player.stock["raw_meat"] = 2
	var locked_trade := world.settlement_authority.sell_from_player(player, "verdant_mossbridge", "raw_meat", 1)
	_check(String(locked_trade.get("reason", "")) == "era_locked", "ordinary market transaction is gated until the player establishes a foothold")
	progression.record_milestone("survival_ready")
	progression.record_settlement_contact("verdant_mossbridge")
	var first_transition := progression.simulate_hour_end(241, [])
	_check(int(first_transition.get("to", -1)) == SliceWorldProgressionAuthority.ERA_FOOTHOLD, "survival plus first settlement advances exactly to Foothold")
	_check(progression.allows_local_market(), "Foothold opens the real local market")
	_check(not progression.allows_autonomous_caravans(), "Foothold still keeps the macro world quiet")

	main.free()
	print("wildforge_world_era_baseline=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
