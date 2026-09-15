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
	var factions := world.faction_authority as SliceFactionAuthority
	var era3 := {"era": 3, "era_entered_hour": 100, "milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "settlement:ember_cinder_ridge", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst"], "last_transition": {"from": 2, "to": 3, "cause": "first_fracture", "hour": 100}}
	_check(progression.restore_state(era3), "peaceful-path fixture begins in a valid Fracture world")
	_check(factions.set_relation("verdant", "ember", 35, "trade"), "peaceful route can establish one mature trade relation")
	_check(factions.set_relation("verdant", "frost", 35, "trade"), "peaceful route can establish a second mature trade relation")
	_check(not factions.at_war("verdant") and not factions.at_war("ember") and not factions.at_war("frost"), "regional maturity fixture contains no war")
	var before_dwell := progression.simulate_hour_end(123, [])
	_check(before_dwell.is_empty(), "peaceful maturity still respects the Fracture dwell time")
	var war_capable := progression.simulate_hour_end(124, [])
	_check(int(war_capable.get("to", -1)) == SliceWorldProgressionAuthority.ERA_WARFRONT, "stable three-region trade can enter the war-capable era without causing war")
	_check(String(war_capable.get("cause", "")) == "peaceful_maturity", "peaceful route records its real maturity cause")
	_check(not factions.at_war("verdant") and factions.active_raids().is_empty(), "unlocking Warfront does not punish peaceful play with a scripted conflict")

	var too_soon := progression.simulate_hour_end(171, [])
	_check(too_soon.is_empty(), "peaceful late game cannot skip the Warfront maturity window")
	var reforging := progression.simulate_hour_end(172, [])
	_check(int(reforging.get("to", -1)) == SliceWorldProgressionAuthority.ERA_REFORGING, "sustained regional balance can reach Reforging without a mandatory war")
	_check(String(reforging.get("cause", "")) == "regional_balance", "late peaceful route is explained by canonical regional balance")
	_check(progression.allows_annexation(), "peaceful players still reach the fully open sandbox rules")

	main.free()
	print("wildforge_world_era_paths=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
