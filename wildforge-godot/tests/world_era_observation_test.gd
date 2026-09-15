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

func _fracture_state() -> Dictionary:
	return {"era": 3, "era_entered_hour": 30, "milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst"], "last_transition": {"from": 2, "to": 3, "cause": "first_fracture", "hour": 30}}
func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	_check(progression.restore_state(_fracture_state()), "fixture enters Fracture without pretending the player saw tension")
	for _i in range(8):
		factions.adjust_relation("verdant", "ember", -20, "unseen_pressure")
	_check(progression.has_milestone("war_ready_pressure"), "background pressure can become war-ready")
	_check(not progression.has_milestone("tension_seen"), "background pressure alone is not player observation")
	var warfront_floor := 30 + SliceWorldProgressionAuthority.FRACTURE_MIN_DWELL_HOURS
	var unseen := progression.simulate_hour_end(warfront_floor, [{"kind": "caravan_attacked", "origin": "verdant_mossbridge", "destination": "ember_cinder_ridge"}])
	_check(unseen.is_empty(), "distant incident cannot unlock Warfront by itself")
	_check(not progression.has_milestone("tension_seen"), "background caravan attack remains unseen until the player encounters evidence")
	main._open_dialogue({"npc_kind": "merchant", "actor_id": "verdant_mossbridge:merchant", "settlement_id": "verdant_mossbridge", "dialogue": ["路上不太平。"]})
	_check(progression.has_milestone("tension_seen"), "speaking inside a genuinely tense settlement records player observation")
	main.dialogue_overlay.close_dialogue()
	var seen := progression.simulate_hour_end(warfront_floor + 1, [])
	_check(int(seen.get("to", -1)) == SliceWorldProgressionAuthority.ERA_WARFRONT, "observed sustained tension can finally unlock Warfront")
	main.free()
	await process_frame
	var hazard_main := _new_main()
	await process_frame
	await process_frame
	var hazard_world := hazard_main.get_node("World") as SliceWorld
	var hazard_progression := hazard_world.progression_authority as SliceWorldProgressionAuthority
	var settlement := hazard_world.settlement_authority as SliceSettlementAuthority
	var actors := hazard_main.actor_authority as SliceWorldActorAuthority
	_check(hazard_progression.restore_state(_fracture_state()), "route-observation fixture uses the same Fracture contract")
	var pair_key := "ember_cinder_ridge|verdant_mossbridge"
	settlement.caravan_incident_cooldowns[pair_key] = hazard_world.absolute_world_hour() + 24
	actors.sync_route_hazards(true)
	await process_frame
	_check(not hazard_progression.has_milestone("tension_seen"), "a distant route hazard does not count as observed")
	var hazard_rows := settlement.active_route_hazards()
	_check(hazard_rows.size() == 1, "fixture creates one authoritative route hazard")
	if not hazard_rows.is_empty():
		var cell: Vector2i = (hazard_rows[0] as Dictionary).get("cell", Vector2i.ZERO)
		hazard_main.player.global_position = hazard_world.cell_center(cell) + Vector2(0, -40)
		hazard_world.refresh_streaming(true)
		actors.sync_route_hazards(true)
		await process_frame
		await process_frame
		_check(hazard_progression.has_milestone("tension_seen"), "physically approaching route debris records real observation")
	hazard_main.free()
	print("wildforge_world_era_observation=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
