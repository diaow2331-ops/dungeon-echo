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
	var factions := world.faction_authority as SliceFactionAuthority
	var settlements := world.settlement_authority as SliceSettlementAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority

	_check(factions.conflict_status("verdant_mossbridge") == "peace", "fresh settlement begins in visible peace state")
	_check(factions.set_status("verdant", "weakened"), "decisive fixture weakens one faction before war")
	_check(factions.set_relation("verdant", "ember", -80, "war"), "one political authority can declare a canonical war")
	var started := factions.simulate_hour(4)
	_check((started.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "raid_started"), "war heartbeat creates one authoritative raid")
	var raids := factions.active_raids()
	_check(raids.size() == 1, "war pair owns exactly one macro raid")
	var raid: Dictionary = raids[0]
	var raid_id := String(raid["id"])
	var target_id := String(raid["target_settlement"])
	var attacker := String(raid["attacker"])
	var defender := String(raid["defender"])
	_check(factions.conflict_status(target_id) == "raid", "target settlement exposes raid state without a debug panel")

	var target_cell: Vector2i = settlements.state(target_id).get("anchor_cell", Vector2i.ZERO)
	player.global_position = world.cell_center(target_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_war_raids()
	await process_frame
	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_RAIDER) == 3, "macro raid instantiates at most three local attackers")
	_check(actors.projected_count(SliceWorldActorAuthority.KIND_RAIDER) <= 3, "local war visualization stays bounded")

	var raider_ids := actors.actor_ids(SliceWorldActorAuthority.KIND_RAIDER)
	_check(not raider_ids.is_empty() and actors.mark_removed(raider_ids[0]), "defeating one local attacker mutates the shared raid")
	actors.sync_war_raids()
	raids = factions.active_raids()
	_check(raids.size() == 1 and int((raids[0] as Dictionary).get("strength", 0)) == 2, "local victory weakens the same macro raid instead of a shadow battle")
	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_RAIDER) == 2, "local projections reconcile to remaining macro strength")

	raid = raids[0]
	var security_before := settlements.security(target_id)
	var treasury_before := settlements.treasury(target_id)
	var strike_hour := int(raid["next_strike_hour"])
	var strike := factions.simulate_hour(strike_hour)
	_check((strike.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "raid_strike"), "unrepelled raid damages the real settlement on its macro heartbeat")
	_check(settlements.security(target_id) < security_before, "raid lowers authoritative settlement security")
	_check(settlements.treasury(target_id) < treasury_before, "raid removes real settlement wealth rather than a cosmetic war score")

	var snap := SliceSaveSystem.snapshot(main)
	_check(SliceSaveSystem.validate_snapshot(snap), "current save validator accepts active war and raid state")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "active war restores through the normal save authority")
	var world2 := restored.get_node("World") as SliceWorld
	var factions2 := world2.faction_authority as SliceFactionAuthority
	var settlements2 := world2.settlement_authority as SliceSettlementAuthority
	var actors2 := restored.actor_authority as SliceWorldActorAuthority
	_check(factions2.active_raids().size() == 1, "raid survives save round-trip exactly once")
	_check(settlements2.security(target_id) == settlements.security(target_id), "settlement security survives save round-trip")

	var guard := 0
	while factions2.controller_id(defender) == defender and guard < 12:
		var active := factions2.active_raids()
		if active.is_empty():
			break
		var next_hour := int((active[0] as Dictionary)["next_strike_hour"])
		factions2.simulate_hour(next_hour)
		guard += 1
	_check(factions2.controller_id(defender) == attacker, "decisive unresolved raid can annex the collapsing defender")
	_check(factions2.conflict_status(target_id) == "occupied", "annexed settlement exposes occupied political state")
	_check(settlements2.owner_id(target_id) == defender, "annexation preserves regional physical identity and resources")
	_check(factions2.controller_for_settlement(target_id) == attacker, "annexation changes political sovereignty without rewriting geography")
	actors2.sync_war_raids()
	_check(actors2.descriptor_count(SliceWorldActorAuthority.KIND_RAIDER) == 0, "completed annexation removes obsolete raid projections")

	var controller_settlement := settlements2.settlement_for_faction(attacker)
	var subject_before := settlements2.treasury(target_id)
	var controller_before := settlements2.treasury(controller_settlement)
	var taxes := settlements2.apply_annexation_taxes()
	var expected_tax := mini(6, subject_before)
	_check(not taxes.is_empty() and settlements2.treasury(target_id) == subject_before - expected_tax, "occupied settlement pays from its real treasury")
	_check(settlements2.treasury(controller_settlement) == controller_before + expected_tax, "occupation tax reaches the controller settlement treasury")

	restored.free()
	print("wildforge_war_annexation=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
