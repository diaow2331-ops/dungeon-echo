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

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())
	var player := main.get_node("Player") as SlicePlayer
	var economy := world.settlement_authority as SliceSettlementAuthority
	var ember := "ember_cinder_ridge"
	var frost := "frost_frostmirror"
	var verdant := "verdant_mossbridge"
	var item_id := "wood"
	var target := economy.effective_target(ember, item_id)

	var ember_row: Dictionary = economy.settlements[ember]
	var ember_inventory: Dictionary = ember_row["inventory"]
	for good in economy.accepted_goods(ember):
		ember_inventory[good] = economy.effective_target(ember, good)
	ember_row["inventory"] = ember_inventory
	economy.settlements[ember] = ember_row
	var stable_price := economy.buy_price(ember, item_id)
	_check(String(economy.shortage_state(ember).get("severity", "")) == "stable", "fully supplied settlement exposes no synthetic shortage event")

	ember_row = economy.settlements[ember]
	ember_inventory = ember_row["inventory"]
	ember_inventory[item_id] = 0
	ember_row["inventory"] = ember_inventory
	economy.settlements[ember] = ember_row
	var shortage := economy.shortage_state(ember)
	var critical_price := economy.buy_price(ember, item_id)
	_check(String(shortage.get("severity", "")) == "critical", "real empty inventory derives a critical shortage from the same settlement authority")
	_check(float(shortage.get("pressure", 0.0)) >= 0.99, "empty target stock produces maximum bounded shortage pressure")
	_check(critical_price > stable_price, "critical shortage creates a bounded real transport premium")
	var quote := economy.sale_quote(ember, item_id, 1)
	_check(String(quote.get("shortage_severity", "")) == "critical" and float(quote.get("shortage_pressure", 0.0)) >= 0.99, "market quote exposes the same derived shortage state")
	_check(economy.shortage_severity(ember, "ash") == "stable", "item shortage severity does not inherit another good's crisis state")
	_check((economy.urgent_shortages() as Array).any(func(row): return String((row as Dictionary).get("settlement_id", "")) == ember), "critical shortage enters the read-only world opportunity feed")

	var verdant_row: Dictionary = economy.settlements[verdant]
	var verdant_inventory: Dictionary = verdant_row["inventory"]
	verdant_inventory[item_id] = 20
	verdant_row["inventory"] = verdant_inventory
	economy.settlements[verdant] = verdant_row
	var frost_row: Dictionary = economy.settlements[frost]
	var frost_inventory: Dictionary = frost_row["inventory"]
	var frost_target := economy.effective_target(frost, item_id)
	frost_inventory[item_id] = maxi(1, frost_target / 2)
	frost_row["inventory"] = frost_inventory
	economy.settlements[frost] = frost_row
	economy.caravans.clear()
	var candidate := economy._best_caravan_candidate(12)
	_check(String(candidate.get("origin", "")) == verdant and String(candidate.get("destination", "")) == ember and String(candidate.get("item_id", "")) == item_id, "autonomous logistics prioritizes the deepest real shortage instead of a separate task table")

	player.global_position = world.cell_center(economy.market_cell(ember)) + Vector2(0, -16)
	player.add_item(item_id, target)
	var delivered := economy.sell_from_player(player, ember, item_id, target)
	_check(bool(delivered.get("ok", false)), "player can answer the shortage through the ordinary real market transaction")
	_check(economy.item_count(ember, item_id) == target, "player delivery replenishes authoritative settlement inventory")
	_check(String(economy.shortage_state(ember).get("severity", "")) == "stable", "shortage disappears automatically when its real inventory cause is resolved")
	_check(economy.buy_price(ember, item_id) < critical_price, "replenishment removes the emergency premium and closes the temporary arbitrage window")

	main.free()
	print("wildforge_shortage_response=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
