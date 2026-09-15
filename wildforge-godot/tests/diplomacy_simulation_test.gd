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
	var factions := world.faction_authority as SliceFactionAuthority
	var settlements := world.settlement_authority as SliceSettlementAuthority

	var before_pressure := factions.relation("verdant", "ember")
	var pressure_tick := factions.simulate_hour(SliceFactionAuthority.DIPLOMACY_INTERVAL_HOURS)
	var after_pressure := factions.relation("verdant", "ember")
	_check((pressure_tick.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "diplomacy_shift"), "persistent unmet regional needs create a real diplomacy event")
	_check(int(after_pressure.get("score", 0)) < int(before_pressure.get("score", 0)), "resource pressure mutates the one canonical relation score")
	_check(String(after_pressure.get("stance", "")) == "neutral", "one shortage pulse creates tension gradually instead of instant war")

	var hour := SliceFactionAuthority.DIPLOMACY_INTERVAL_HOURS * 2
	while String(factions.relation("verdant", "ember").get("stance", "")) != "war" and hour <= SliceFactionAuthority.DIPLOMACY_INTERVAL_HOURS * 20:
		factions.simulate_hour(hour)
		hour += SliceFactionAuthority.DIPLOMACY_INTERVAL_HOURS
	_check(String(factions.relation("verdant", "ember").get("stance", "")) == "war", "sustained unserved dependency can deterministically escalate into canonical war")
	_check(int(factions.relation("verdant", "ember").get("score", 0)) <= SliceFactionAuthority.RELATION_WAR_ENTER, "war entry is tied to the explicit relation threshold")

	var relief := factions.adjust_relation("verdant", "ember", 45, "test_relief")
	_check(not relief.is_empty() and String(factions.relation("verdant", "ember").get("stance", "")) == "neutral", "sufficient real relief can exit war through the same relation authority")
	_check(factions.active_raids().is_empty(), "leaving war clears obsolete raid operations instead of preserving a shadow conflict")

	main.free()
	await process_frame
	var trade_main := _new_main()
	await process_frame
	await process_frame
	var trade_world := trade_main.get_node("World") as SliceWorld
	var trade_factions := trade_world.faction_authority as SliceFactionAuthority
	var trade_settlements := trade_world.settlement_authority as SliceSettlementAuthority
	var initial_hour := trade_world.absolute_world_hour()
	trade_world.advance_world_time(SliceWorldClock.DAY_SECONDS * float(24 - initial_hour) / 24.0 + 0.01)
	var caravans := trade_settlements.active_caravans()
	_check(not caravans.is_empty(), "diplomacy trade fixture uses a real autonomous caravan")
	if not caravans.is_empty():
		var caravan: Dictionary = caravans[0]
		var origin := String(caravan.get("origin", ""))
		var destination := String(caravan.get("destination", ""))
		var a := trade_factions.controller_for_settlement(origin)
		var b := trade_factions.controller_for_settlement(destination)
		var relation_before := int(trade_factions.relation(a, b).get("score", 0))
		var arrival := int(caravan.get("arrival_hour", 0))
		trade_settlements.simulate_hour(arrival)
		var relation_after := int(trade_factions.relation(a, b).get("score", 0))
		_check(relation_after == relation_before + 1, "successful physical caravan delivery improves that exact inter-faction relation once")

	for _i in range(SliceFactionAuthority.RELATION_TRADE_ENTER + 2):
		trade_factions.record_caravan_arrival("verdant_mossbridge", "ember_cinder_ridge", 5)
	_check(String(trade_factions.relation("verdant", "ember").get("stance", "")) == "trade", "repeated successful exchange can mature neutral relations into trade")

	trade_main.free()
	print("wildforge_diplomacy_simulation=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
