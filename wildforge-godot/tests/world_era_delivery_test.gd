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
	var state := {"era": 1, "era_entered_hour": 1, "milestones": ["survival_ready", "settlement:frost_frostmirror"], "last_transition": {"from": 0, "to": 1, "cause": "first_foothold", "hour": 1}}
	_check(progression.restore_state(state), "fixture starts in Foothold with only Frostmirror known")
	var town := "frost_frostmirror"
	player.global_position = world.cell_center(world.settlement_authority.market_cell(town))
	world.refresh_streaming(true)
	main._open_dialogue({"npc_kind": "merchant", "actor_id": town + ":merchant", "settlement_id": town, "dialogue": ["货物要看来源。"]})
	player.add_item("wood", 2)
	main._sell_to_active_merchant(town, "wood", 1)
	_check(not progression.has_milestone("cross_region_delivery"), "selling an imported-type good without knowing its source region is not enough")
	progression.record_settlement_contact("verdant_mossbridge")
	player.add_item("snow", 1)
	main._sell_to_active_merchant(town, "snow", 1)
	_check(not progression.has_milestone("cross_region_delivery"), "selling Frostmirror's own produced good is not cross-region circulation")
	main._sell_to_active_merchant(town, "wood", 1)
	_check(progression.has_milestone("cross_region_delivery"), "delivering a known Mossbridge-produced good into Frostmirror records regional circulation")
	var transition := progression.simulate_hour_end(1 + SliceWorldProgressionAuthority.FOOTHOLD_MIN_DWELL_HOURS, [])
	_check(int(transition.get("to", -1)) == SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "real regional delivery can open the roads after the Foothold dwell time")
	main.dialogue_overlay.close_dialogue()
	main.free()
	print("wildforge_world_era_delivery=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
