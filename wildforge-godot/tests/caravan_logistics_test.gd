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
	world.advance_world_time(SliceWorldClock.DAY_SECONDS * float(hours) / 24.0 + 0.01)

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var settlement := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority

	var legacy27 := SliceSaveSystem.snapshot(main)
	legacy27["version"] = SliceSaveSystem.LEGACY_WAR_SAVE_VERSION
	legacy27.erase("caravans")
	_check(SliceSaveSystem.validate_snapshot(legacy27), "schema 27 remains a valid pre-caravan migration source")

	var start_hour := world.absolute_world_hour()
	_advance_hours(world, 24 - start_hour)
	var active := settlement.active_caravans()
	_check(not active.is_empty(), "regional production creates at least one autonomous physical shipment")
	_check(active.size() <= SliceSettlementAuthority.CARAVAN_MAX_ACTIVE, "global caravan traffic stays bounded")
	var caravan: Dictionary = active[0]
	for raw in active:
		if int((raw as Dictionary).get("arrival_hour", 999999)) < int(caravan.get("arrival_hour", 999999)):
			caravan = raw
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	var item_id := String(caravan.get("item_id", ""))
	var quantity := int(caravan.get("quantity", 0))
	var payment := int(caravan.get("payment", 0))
	_check(quantity > 0 and bool(settlement.production_profile(origin).has(item_id)), "caravan cargo comes from the origin's real geography-derived production")
	_check(settlement.item_count(origin, item_id) >= 0, "dispatch removes cargo from the same settlement inventory authority")
	_check(payment > 0, "destination commits real treasury value to the in-transit shipment")
	var route_cell := settlement.caravan_cell(String(caravan.get("id", "")), int(caravan.get("depart_hour", 0)) + 1)
	_check(route_cell.x > SliceWorld.MIN_X and route_cell.x < SliceWorld.MAX_X, "caravan has a deterministic physical route position in the world")

	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == SliceSaveSystem.SAVE_VERSION and SliceSaveSystem.validate_snapshot(snap), "schema 28 validates in-transit caravan authority")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "active caravans restore through the normal save authority")
	var world2 := restored.get_node("World") as SliceWorld
	var settlement2 := world2.settlement_authority as SliceSettlementAuthority
	var factions2 := world2.faction_authority as SliceFactionAuthority
	_check(settlement2.active_caravans() == active, "save round-trip preserves each shipment exactly once")

	var destination_stock_before := settlement2.item_count(destination, item_id)
	var origin_treasury_before := settlement2.treasury(origin)
	var destination_treasury_before := settlement2.treasury(destination)
	var arrival_hour := int(caravan.get("arrival_hour", 0))
	var arrival := settlement2.simulate_hour(arrival_hour)
	_check((arrival.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "caravan_arrived" and String((e as Dictionary).get("caravan_id", "")) == String(caravan.get("id", ""))), "shipment arrival is one authoritative world event")
	_check(settlement2.item_count(destination, item_id) == destination_stock_before + quantity, "arrival moves the exact cargo into destination inventory")
	_check(settlement2.treasury(origin) == origin_treasury_before + payment, "arrival releases the exact escrowed payment to the origin treasury")
	_check(settlement2.treasury(destination) == destination_treasury_before, "arrival cannot charge destination treasury twice")

	# Advance the remaining traffic and create another route to verify war interruption conservation.
	for hour in range(arrival_hour + 1, 37):
		settlement2.simulate_hour(hour)
	var later := settlement2.active_caravans()
	_check(not later.is_empty(), "world continues scheduling logistics after earlier shipments resolve")
	if not later.is_empty():
		var interrupted: Dictionary = later[0]
		var io := String(interrupted.get("origin", ""))
		var idest := String(interrupted.get("destination", ""))
		var ii := String(interrupted.get("item_id", ""))
		var iq := int(interrupted.get("quantity", 0))
		var ip := int(interrupted.get("payment", 0))
		var stock_before_return := settlement2.item_count(io, ii)
		var treasury_before_refund := settlement2.treasury(idest)
		var fa := factions2.controller_for_settlement(io)
		var fb := factions2.controller_for_settlement(idest)
		_check(factions2.set_relation(fa, fb, -80, "war"), "route interruption uses the canonical diplomacy authority")
		var returned := settlement2.simulate_hour(37)
		_check((returned.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "caravan_returned"), "war turns an existing shipment back instead of deleting it")
		_check(settlement2.item_count(io, ii) == stock_before_return + iq, "returned caravan restores its exact physical cargo to origin inventory")
		_check(settlement2.treasury(idest) == treasury_before_refund + ip, "returned caravan refunds the exact escrow to destination treasury")

	var legacy_main := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy_main, legacy27), "schema 27 migrates forward without inventing caravans")
	var legacy_world := legacy_main.get_node("World") as SliceWorld
	_check(legacy_world.settlement_authority.active_caravans().is_empty(), "pre-caravan saves start with no synthetic shipments")

	legacy_main.free()
	restored.free()
	print("wildforge_caravan_logistics=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
