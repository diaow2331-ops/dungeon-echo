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
	var staged := {"era": 3, "era_entered_hour": 50, "milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst"], "last_transition": {"from": 2, "to": 3, "cause": "first_fracture", "hour": 50}}
	_check(progression.restore_state(staged), "valid progression state can be staged for save round-trip")
	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == SliceSaveSystem.SAVE_VERSION, "world era introduces the current save schema")
	_check(SliceSaveSystem.validate_snapshot(snap), "current save validates explicit world progression authority")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "current progression snapshot restores through the normal save path")
	var restored_world := restored.get_node("World") as SliceWorld
	var restored_progression := restored_world.progression_authority as SliceWorldProgressionAuthority
	var restored_state := restored_progression.export_state()
	_check(int(restored_state.get("era", -1)) == 3 and int(restored_state.get("era_entered_hour", -1)) == 50, "era and entered hour survive exactly")
	var restored_ids: Array = restored_state.get("milestones", [])
	var staged_ids: Array = staged["milestones"]
	restored_ids.sort()
	staged_ids.sort()
	_check(restored_ids == staged_ids and restored_state.get("last_transition", {}) == staged["last_transition"], "milestones and last transition survive exactly")

	var legacy30 := snap.duplicate(true)
	legacy30["version"] = SliceSaveSystem.LEGACY_POPULATION_SAVE_VERSION
	legacy30.erase("world_progression")
	_check(SliceSaveSystem.validate_snapshot(legacy30), "schema 30 remains a valid migration source without progression state")
	restored.free()
	await process_frame
	var migrated := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(migrated, legacy30), "schema 30 migrates into the era-aware runtime")
	var migrated_world := migrated.get_node("World") as SliceWorld
	_check(migrated_world.progression_authority.era == SliceWorldProgressionAuthority.ERA_REFORGING, "legacy worlds migrate fully unlocked instead of losing existing macro facts")
	_check(migrated_world.progression_authority.allows_annexation(), "legacy migration preserves the old unrestricted world semantics")

	migrated.free()
	print("wildforge_world_era_save=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
