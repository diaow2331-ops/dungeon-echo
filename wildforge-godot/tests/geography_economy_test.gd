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
	var economy := world.settlement_authority as SliceSettlementAuthority
	var politics := world.faction_authority as SliceFactionAuthority
	var verdant := "verdant_mossbridge"
	var frost := "frost_frostmirror"
	var ember := "ember_cinder_ridge"

	_check(economy.production_profile(verdant) == {"wood": 1}, "Verdant Reach geography supplies forest-derived wood")
	_check(economy.production_profile(frost) == {"snow": 2, "ice": 1}, "Frostglass geography supplies snow and ice")
	_check(economy.production_profile(ember) == {"ash": 2, "sandstone": 1, "basalt": 1}, "Ember Wastes geography supplies ash sandstone and basalt")
	_check("ice" in economy.accepted_goods(verdant) and "basalt" in economy.accepted_goods(verdant), "Verdant market has explicit remote-material demand")
	_check("wood" in economy.accepted_goods(frost) and "basalt" in economy.accepted_goods(frost), "Frost market has explicit imported wood and basalt demand")
	_check("wood" in economy.accepted_goods(ember) and "ice" in economy.accepted_goods(ember), "Ember market has explicit imported wood and ice demand")
	var ember_supply_before := economy.production_profile(ember)
	_check(politics.set_status("ember", "annexed", "frost"), "political authority can annex Ember under Frost for geography decoupling proof")
	_check(politics.controller_id("ember") == "frost", "annexation changes sovereign political control")
	_check(economy.production_profile(ember) == ember_supply_before, "annexation never changes geography-derived Ember Wastes production")

	var frost_food_price := economy.buy_price(frost, "raw_meat")
	var verdant_food_price := economy.buy_price(verdant, "raw_meat")
	_check(frost_food_price > verdant_food_price, "settlement demand makes Frostmirror food shortage stronger than Mossbridge")
	var wood_before := economy.item_count(verdant, "wood")
	var ice_before := economy.item_count(frost, "ice")
	var basalt_before := economy.item_count(ember, "basalt")
	var imported_ice_before := economy.item_count(ember, "ice")
	var result := economy.simulate_hour(4)
	_check((result.get("events", []) as Array).size() == 6, "one bounded geography-economy tick emits consumption plus production per settlement")
	_check(economy.item_count(verdant, "wood") == wood_before + 1, "Verdant heartbeat produces real wood inventory")
	_check(economy.item_count(frost, "ice") == ice_before + 1, "Frost heartbeat produces real ice inventory")
	_check(economy.item_count(ember, "basalt") == basalt_before + 1, "Ember heartbeat produces real basalt inventory")
	_check(economy.item_count(ember, "ice") == imported_ice_before, "Ember cannot fabricate imported Frost ice")
	for hour in range(8, 64, 4):
		economy.simulate_hour(hour)
	_check(economy.item_count(verdant, "wood") <= 6, "Verdant local production never overfills target stock while autonomous logistics may export surplus")
	_check(economy.item_count(frost, "ice") <= 8 and economy.item_count(frost, "snow") <= 8, "Frost local production never overfills deterministic target stock")
	_check(economy.item_count(ember, "ash") <= 8 and economy.item_count(ember, "sandstone") <= 6 and economy.item_count(ember, "basalt") <= 6, "Ember local production never overfills target stock while shipments can draw real inventory down")

	var persisted := economy.export_state()
	var rules_leaked := false
	for row in persisted:
		if (row as Dictionary).has("local_production") or (row as Dictionary).has("local_consumption") or (row as Dictionary).has("targets") or (row as Dictionary).has("base_prices"):
			rules_leaked = true
	_check(not rules_leaked, "save authority persists economic facts only, never a second copy of geography or demand rules")
	var snap := SliceSaveSystem.snapshot(main)
	var fresh := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(fresh, snap), "geography-economy facts round-trip through unchanged schema 23")
	var economy2 := (fresh.get_node("World") as SliceWorld).settlement_authority as SliceSettlementAuthority
	_check(economy2.production_profile(frost) == {"snow": 2, "ice": 1}, "geography-derived production rules are re-derived from baseline after restore")
	_check(economy2.item_count(ember, "basalt") == economy.item_count(ember, "basalt"), "settlement inventory facts survive save restore exactly")

	main.free()
	fresh.free()
	print("wildforge_geography_economy=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
