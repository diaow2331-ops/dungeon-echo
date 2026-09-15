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
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	progression.record_milestone("survival_ready")
	progression.record_settlement_contact("verdant_mossbridge")
	var t1 := progression.simulate_hour_end(1, [])
	_check(int(t1.get("to", -1)) == SliceWorldProgressionAuthority.ERA_FOOTHOLD, "first foothold advances one era")
	progression.record_settlement_contact("frost_frostmirror")
	progression.record_milestone("cross_region_delivery")
	var same_hour := progression.simulate_hour_end(1, [])
	_check(same_hour.is_empty() and progression.era == SliceWorldProgressionAuthority.ERA_FOOTHOLD, "same world hour cannot chain into a second era")
	var too_early := progression.simulate_hour_end(4, [])
	_check(too_early.is_empty(), "Foothold minimum stay prevents immediate road unlock")
	var t2 := progression.simulate_hour_end(5, [])
	_check(int(t2.get("to", -1)) == SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "real second-region participation opens the roads")
	_check(progression.allows_autonomous_caravans() and not progression.allows_tension(), "Open Roads enables logistics before political fracture")

	progression.record_milestone("cross_faction_exchange")
	progression.record_milestone("tension_catalyst")
	var t3 := progression.simulate_hour_end(29, [])
	_check(int(t3.get("to", -1)) == SliceWorldProgressionAuthority.ERA_FRACTURE, "trade plus a real catalyst opens the Fracture era")
	_check(progression.allows_tension() and progression.allows_route_incidents(), "Fracture enables warning-layer conflict")
	_check(not progression.allows_war(), "Fracture still forbids formal war")
	progression.record_milestone("tension_seen")
	progression.record_milestone("war_ready_pressure")
	var t4 := progression.simulate_hour_end(53, [])
	_check(int(t4.get("to", -1)) == SliceWorldProgressionAuthority.ERA_WARFRONT, "visible sustained tension opens Warfront")
	_check(progression.allows_war() and progression.allows_raids() and progression.allows_displacement(), "Warfront unlocks destructive conflict together")
	_check(not progression.allows_annexation(), "Warfront still protects sovereignty from instant collapse")
	_check(not world.faction_authority.set_status("verdant", "annexed", "ember"), "direct annexation remains blocked in Warfront")

	progression.record_milestone("war_resolved")
	var t5 := progression.simulate_hour_end(77, [])
	_check(int(t5.get("to", -1)) == SliceWorldProgressionAuthority.ERA_REFORGING, "resolved mature conflict opens Reforging")
	_check(progression.allows_annexation(), "Reforging finally permits sovereignty changes")
	_check(world.faction_authority.set_status("verdant", "annexed", "ember"), "annexation becomes legal only after Reforging")

	main.free()
	print("wildforge_world_era_transition=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
