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
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())
	var settlement := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	var origin := "verdant_mossbridge"
	var refuge := "frost_frostmirror"
	var attacker := "ember"

	var legacy29 := SliceSaveSystem.snapshot(main)
	legacy29["version"] = SliceSaveSystem.LEGACY_TRAVEL_EVENT_SAVE_VERSION
	legacy29.erase("displacements")
	for raw in legacy29.get("settlements", []):
		(raw as Dictionary).erase("population")
		(raw as Dictionary).erase("next_displacement_hour")
	_check(SliceSaveSystem.validate_snapshot(legacy29), "schema 29 remains a valid pre-population migration source")

	var origin_population := settlement.population(origin)
	var refuge_population := settlement.population(refuge)
	var origin_food_target := settlement.effective_target(origin, "raw_meat")
	var refuge_food_target := settlement.effective_target(refuge, "raw_meat")
	_check(origin_population == 30 and refuge_population == 24, "canonical settlements begin with coarse real population facts")
	_check(factions.set_relation("verdant", attacker, -80, "war"), "displacement fixture uses the canonical war relation")
	var damage := settlement.apply_raid_pressure(origin, 70, attacker)
	var displaced: Dictionary = damage.get("displacement", {})
	_check(not displaced.is_empty(), "severe real settlement damage creates one bounded displacement group")
	_check(String(displaced.get("origin", "")) == origin and String(displaced.get("destination", "")) == refuge, "civilians flee toward the safest non-attacking settlement")
	var people := int(displaced.get("people", 0))
	_check(people > 0 and people <= SliceSettlementAuthority.DISPLACEMENT_GROUP_SIZE, "macro displacement is represented by a small bounded group")
	_check(settlement.population(origin) == origin_population - people, "departing civilians leave the origin population immediately")
	_check(settlement.effective_target(origin, "raw_meat") < origin_food_target, "population loss lowers the origin's real food demand")
	_check(settlement.active_displacements().size() == 1, "population movement owns one authoritative in-transit record")

	var displacement_id := String(displaced.get("id", ""))
	var travel_cell := settlement.displacement_cell(displacement_id)
	var player := main.get_node("Player") as SlicePlayer
	player.global_position = world.cell_center(travel_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_displacements(true)
	await process_frame
	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_DISPLACEMENT) == 1, "one local displacement projection derives from the macro population movement")
	_check(actors.projected_count(SliceWorldActorAuthority.KIND_DISPLACEMENT) <= 1, "refugee presentation remains intentionally sparse")
	_check(actors.projection_for("world:" + displacement_id) != null, "nearby displaced civilians are visible in the physical world")

	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == SliceSaveSystem.SAVE_VERSION and SliceSaveSystem.validate_snapshot(snap), "current schema persists population and in-transit displacement authority")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "population movement restores through the normal save path")
	var world2 := restored.get_node("World") as SliceWorld
	world2.progression_authority.restore_legacy_unlocked(world2.absolute_world_hour())
	var settlement2 := world2.settlement_authority as SliceSettlementAuthority
	var actors2 := restored.actor_authority as SliceWorldActorAuthority
	_check(settlement2.population(origin) == origin_population - people, "origin population survives save round-trip")
	_check(settlement2.active_displacements().size() == 1, "in-transit displacement survives save round-trip exactly once")

	var arrival_hour := int(displaced.get("arrival_hour", 0))
	var arrival := settlement2.simulate_hour(arrival_hour)
	_check((arrival.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "displacement_arrived" and String((e as Dictionary).get("displacement_id", "")) == displacement_id), "displaced civilians arrive as one authoritative world event")
	_check(settlement2.population(refuge) == refuge_population + people, "arrival transfers people into the destination population without duplication")
	_check(settlement2.effective_target(refuge, "raw_meat") > refuge_food_target, "refugee arrival raises the destination's real food demand")
	_check(settlement2.active_displacements().is_empty(), "completed population movement leaves no zombie transit record")
	actors2.sync_displacements(true)
	_check(actors2.descriptor_count(SliceWorldActorAuthority.KIND_DISPLACEMENT) == 0, "completed displacement removes its local projection")

	var legacy_main := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy_main, legacy29), "schema 29 migrates forward without inventing population movement")
	var legacy_settlement := (legacy_main.get_node("World") as SliceWorld).settlement_authority as SliceSettlementAuthority
	_check(legacy_settlement.population(origin) == 30 and legacy_settlement.population(refuge) == 24, "legacy migration derives deterministic baseline populations")
	_check(legacy_settlement.active_displacements().is_empty(), "legacy migration starts with no synthetic refugees")

	legacy_main.free()
	restored.free()
	print("wildforge_displacement=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
