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
	var era2 := {"era": 2, "era_entered_hour": 10, "milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "cross_region_delivery"], "last_transition": {"from": 1, "to": 2, "cause": "open_roads", "hour": 10}}
	_check(progression.restore_state(era2), "test fixture enters Open Roads through valid progression state")
	for _i in range(8):
		factions.adjust_relation("verdant", "ember", -20, "early_pressure")
	var open_roads_relation := factions.relation("verdant", "ember")
	_check(int(open_roads_relation.get("score", 0)) == -34, "Open Roads clamps negative pressure before visible tension")
	_check(String(open_roads_relation.get("stance", "")) == "neutral", "Open Roads cannot accumulate a hidden war stance")
	_check(not progression.has_milestone("war_ready_pressure"), "pre-Fracture pressure does not bank a future war trigger")

	progression.record_milestone("cross_faction_exchange")
	progression.record_milestone("tension_catalyst")
	var fracture := progression.simulate_hour_end(34, [])
	_check(int(fracture.get("to", -1)) == SliceWorldProgressionAuthority.ERA_FRACTURE, "mature trade and catalyst enter Fracture")
	for _i in range(8):
		factions.adjust_relation("verdant", "ember", -20, "fracture_pressure")
	var fracture_relation := factions.relation("verdant", "ember")
	_check(int(fracture_relation.get("score", 0)) == SliceFactionAuthority.RELATION_WAR_ENTER + 1, "Fracture caps pressure one point before war")
	_check(String(fracture_relation.get("stance", "")) == "neutral", "Fracture exposes tension without silently declaring war")
	_check(progression.has_milestone("war_ready_pressure"), "Fracture records that real pressure has reached war-ready intensity")
	var too_soon := progression.simulate_hour_end(50, [])
	_check(too_soon.is_empty() and progression.era == SliceWorldProgressionAuthority.ERA_FRACTURE, "war-ready pressure cannot skip the Fracture dwell time")
	var warfront := progression.simulate_hour_end(58, [])
	_check(int(warfront.get("to", -1)) == SliceWorldProgressionAuthority.ERA_WARFRONT, "sustained visible tension opens Warfront only after its minimum stay")
	_check(String(factions.relation("verdant", "ember").get("stance", "")) == "neutral", "Warfront transition itself does not retroactively declare war")
	var post_unlock := factions.adjust_relation("verdant", "ember", -2, "post_unlock_pressure")
	_check(not post_unlock.is_empty() and String(factions.relation("verdant", "ember").get("stance", "")) == "war", "only a later canonical mutation can cross the newly legal war boundary")

	main.free()
	print("wildforge_world_era_no_backlog=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
