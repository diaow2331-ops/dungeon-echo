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

func _fill_markets(economy: SliceSettlementAuthority) -> void:
	for town in economy.ids():
		var row: Dictionary = economy.settlements[town]
		var inventory: Dictionary = row["inventory"]
		for item_id in economy.accepted_goods(town):
			inventory[item_id] = economy.effective_target(town, item_id)
		row["inventory"] = inventory
		economy.settlements[town] = row

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var economy := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	_fill_markets(economy)
	var open_roads := {
		"era": SliceWorldProgressionAuthority.ERA_OPEN_ROADS,
		"era_entered_hour": 0,
		"milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "settlement:ember_cinder_ridge", "cross_region_delivery", "cross_faction_exchange"],
		"last_transition": {"from": SliceWorldProgressionAuthority.ERA_FOOTHOLD, "to": SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "cause": "open_roads", "hour": 0},
	}
	_check(progression.restore_state(open_roads), "fixture enters mature Open Roads without a fracture catalyst")
	var relation_before: Dictionary = factions.relation("verdant", "frost")
	factions.record_player_crime("verdant", SliceFactionAuthority.PLAYER_CRIME_CATALYST_BOUNTY - 1)
	progression.simulate_hour_end(20, [])
	_check(not progression.has_milestone("tension_catalyst"), "ordinary bounty below the high-impact threshold cannot catalyze regional fracture")
	_check(progression.era == SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "ordinary crime cannot skip the Open Roads pacing floor")

	factions.record_player_crime("verdant", 1)
	progression.simulate_hour_end(21, [])
	_check(progression.has_milestone("tension_catalyst"), "high-impact player crime becomes a real fracture catalyst once regional trade exists")
	_check(progression.era == SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "crime catalyst still cannot bypass the era dwell floor")
	_check(factions.relation("verdant", "frost") == relation_before, "player crime does not fabricate inter-faction relation damage")
	_check(not factions.at_war("verdant"), "high-impact crime never declares war directly")

	var transition: Dictionary = progression.simulate_hour_end(SliceWorldProgressionAuthority.OPEN_ROADS_MIN_DWELL_HOURS, [])
	_check(int(transition.get("to", -1)) == SliceWorldProgressionAuthority.ERA_FRACTURE, "after every other prerequisite matures, crime can be the catalyst for Fracture")
	_check(not factions.at_war("verdant"), "entering Fracture through crime still leaves formal war locked")

	main.free()
	print("wildforge_player_crime_progression=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
