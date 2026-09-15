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
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())
	var settlement := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority

	var start_hour := world.absolute_world_hour()
	_advance_hours(world, 24 - start_hour)
	var active := settlement.active_caravans()
	_check(not active.is_empty(), "travel-event fixture starts from a real autonomous caravan")
	if active.is_empty():
		main.free()
		print("wildforge_travel_event=FAIL")
		quit(1)
		return
	var caravan: Dictionary = active[0]
	var caravan_id := String(caravan.get("id", ""))
	var origin := String(caravan.get("origin", ""))
	var destination := String(caravan.get("destination", ""))
	var item_id := String(caravan.get("item_id", ""))
	var quantity_before := int(caravan.get("quantity", 0))
	var payment_before := int(caravan.get("payment", 0))
	var a := factions.controller_for_settlement(origin)
	var b := factions.controller_for_settlement(destination)

	var legacy28 := SliceSaveSystem.snapshot(main)
	legacy28["version"] = SliceSaveSystem.LEGACY_LOGISTICS_SAVE_VERSION
	var legacy_payload: Dictionary = legacy28.get("caravans", {})
	legacy_payload.erase("incident_cooldowns")
	for raw in legacy_payload.get("active", []):
		(raw as Dictionary).erase("incident_checked")
	legacy28["caravans"] = legacy_payload
	_check(SliceSaveSystem.validate_snapshot(legacy28), "schema 28 remains a valid pre-travel-event migration source")

	_check(factions.set_relation(a, b, -40, "neutral"), "route tension is written through the canonical diplomacy authority")
	var relation_before := int(factions.relation(a, b).get("score", 0))
	var midpoint := settlement._caravan_midpoint_hour(caravan)
	var result := settlement.simulate_hour(midpoint)
	var incident: Dictionary = {}
	for raw in result.get("events", []):
		if String((raw as Dictionary).get("kind", "")) == "caravan_attacked" and String((raw as Dictionary).get("caravan_id", "")) == caravan_id:
			incident = raw
			break
	_check(not incident.is_empty(), "a tense route can produce one causal caravan attack at its physical midpoint")
	if incident.is_empty():
		main.free()
		print("wildforge_travel_event=FAIL")
		quit(1)
		return
	var lost_items: Dictionary = incident.get("lost_items", {})
	var lost_quantity := int(lost_items.get(item_id, 0))
	var remaining := int(incident.get("remaining", -1))
	var refund := int(incident.get("refund", -1))
	_check(lost_quantity > 0 and lost_quantity + remaining == quantity_before, "attack conserves cargo between recoverable spill and surviving shipment")
	var live := settlement.active_caravans()
	var live_payment := 0
	for raw in live:
		if String((raw as Dictionary).get("id", "")) == caravan_id:
			live_payment = int((raw as Dictionary).get("payment", 0))
	_check(refund >= 0 and refund + live_payment == payment_before, "attack conserves escrow between refunded value and surviving shipment")
	_check(int(factions.relation(a, b).get("score", 0)) < relation_before, "physical caravan loss worsens the same canonical faction relation")
	var cooldowns: Dictionary = settlement.export_caravans().get("incident_cooldowns", {})
	_check(not cooldowns.is_empty() and int(cooldowns.values()[0]) > midpoint, "route incident installs a persisted cooldown instead of repeating every tick")

	world.world_event.emit(incident)
	await process_frame
	var lost_rows := actors.export_lost_cargo()
	var wreck: Dictionary = {}
	for raw in lost_rows:
		if String((raw as Dictionary).get("source_id", "")) == "incident:" + caravan_id:
			wreck = raw
			break
	_check(not wreck.is_empty(), "caravan attack materializes a recoverable world-space wreck through actor authority")
	_check((wreck.get("inventory", {}) as Dictionary).get(item_id, 0) == lost_quantity, "wreck contains the exact cargo removed from the macro shipment")
	_check(String(wreck.get("display_name", "")) == "商队残骸", "travel incident is visibly distinct from ordinary player death cargo")
	var wreck_count := actors.actor_ids(SliceWorldActorAuthority.KIND_LOST_CARGO).size()
	world.world_event.emit(incident)
	await process_frame
	_check(actors.actor_ids(SliceWorldActorAuthority.KIND_LOST_CARGO).size() == wreck_count, "replaying the same event cannot duplicate recoverable cargo")

	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == SliceSaveSystem.SAVE_VERSION and SliceSaveSystem.validate_snapshot(snap), "current schema persists travel incidents through existing world authorities")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "travel-event state restores through the normal save path")
	var restored_world := restored.get_node("World") as SliceWorld
	restored_world.progression_authority.restore_legacy_unlocked(restored_world.absolute_world_hour())
	var restored_settlement := restored_world.settlement_authority as SliceSettlementAuthority
	var restored_actors := restored.actor_authority as SliceWorldActorAuthority
	_check(restored_settlement.export_caravans().get("incident_cooldowns", {}) == cooldowns, "route cooldown survives save round-trip")
	var restored_wrecks := restored_actors.export_lost_cargo()
	_check(restored_wrecks.any(func(row): return String((row as Dictionary).get("source_id", "")) == "incident:" + caravan_id and String((row as Dictionary).get("display_name", "")) == "商队残骸"), "recoverable caravan wreck survives save round-trip without losing provenance")

	var legacy_main := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy_main, legacy28), "schema 28 migrates forward without fabricating travel incidents")
	var legacy_world := legacy_main.get_node("World") as SliceWorld
	legacy_world.progression_authority.restore_legacy_unlocked(legacy_world.absolute_world_hour())
	_check((legacy_world.settlement_authority as SliceSettlementAuthority).export_caravans().get("incident_cooldowns", {}).is_empty(), "pre-event saves start with no synthetic route cooldowns")
	_check(legacy_main.actor_authority.export_lost_cargo().is_empty(), "pre-event saves do not invent abandoned cargo")

	legacy_main.free()
	restored.free()
	print("wildforge_travel_event=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
