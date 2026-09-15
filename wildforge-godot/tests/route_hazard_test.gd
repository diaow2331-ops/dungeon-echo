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

func _advance_hours(world: SliceWorld, hours: int) -> void:
	if hours > 0:
		world.advance_world_time(SliceWorldClock.DAY_SECONDS * float(hours) / 24.0 + 0.01)

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var settlement := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	var player := main.get_node("Player") as SlicePlayer

	_advance_hours(world, 24 - world.absolute_world_hour())
	var active := settlement.active_caravans()
	_check(not active.is_empty(), "route-hazard fixture starts from a real autonomous caravan")
	if active.is_empty():
		main.free()
		print("wildforge_route_hazard=FAIL")
		quit(1)
		return
	var caravan: Dictionary = active[0]
	var caravan_id := String(caravan.get("id", ""))
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	var a := factions.controller_for_settlement(origin)
	var b := factions.controller_for_settlement(destination)
	_check(factions.set_relation(a, b, -40, "neutral"), "route hazard is caused by canonical political tension")
	var midpoint := settlement._caravan_midpoint_hour(caravan)
	var incident_result := settlement.simulate_hour(midpoint)
	var attacked := (incident_result.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "caravan_attacked" and String((e as Dictionary).get("caravan_id", "")) == caravan_id)
	_check(attacked, "physical caravan attack creates the route disruption fact")
	var hazards := settlement.active_route_hazards(midpoint)
	_check(hazards.size() == 1, "one attacked route derives one bounded active hazard")
	if hazards.is_empty():
		main.free()
		print("wildforge_route_hazard=FAIL")
		quit(1)
		return
	var hazard: Dictionary = hazards[0]
	var pair_key := String(hazard.get("pair_key", ""))
	var hazard_cell: Vector2i = hazard.get("cell", Vector2i(99999, 99999))
	var until_hour := int(hazard.get("until_hour", 0))
	_check(settlement._route_hazard_active(origin, destination, midpoint + 1), "route cooldown is also the authoritative temporary blockage")

	player.global_position = world.cell_center(hazard_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_route_hazards(true)
	await process_frame
	var actor_id := "world:route_hazard:" + pair_key
	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_ROUTE_HAZARD) == 1, "active route hazard owns exactly one streamed descriptor")
	_check(actors.projection_for(actor_id) != null, "nearby route disruption is visible in the physical world")

	var blocked_dispatch := settlement._dispatch_caravan({"origin": origin, "destination": destination, "item_id": String(caravan.get("item_id", "")), "quantity": 1, "payment": 1}, midpoint + 1)
	_check(blocked_dispatch.is_empty(), "new autonomous shipments cannot depart onto an actively blocked route")

	var snap := SliceSaveSystem.snapshot(main)
	_check(SliceSaveSystem.validate_snapshot(snap), "route hazard persists through the existing logistics cooldown payload")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "active route hazard restores through the normal save path")
	var world2 := restored.get_node("World") as SliceWorld
	var settlement2 := world2.settlement_authority as SliceSettlementAuthority
	_check(settlement2.active_route_hazards(midpoint).size() == 1, "route disruption survives save round-trip exactly once")

	settlement2.simulate_hour(until_hour)
	_check(settlement2.active_route_hazards(until_hour).is_empty(), "temporary route blockage clears when its authoritative cooldown expires")
	var actors2 := restored.actor_authority as SliceWorldActorAuthority
	actors2.sync_route_hazards(true)
	_check(actors2.descriptor_count(SliceWorldActorAuthority.KIND_ROUTE_HAZARD) == 0, "expired route hazard removes its local debris projection")

	restored.free()
	print("wildforge_route_hazard=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
