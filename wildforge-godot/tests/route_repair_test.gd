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
	var economy := world.settlement_authority as SliceSettlementAuthority
	var verdant := "verdant_mossbridge"
	var frost := "frost_frostmirror"
	var key := economy._route_pair_key(verdant, frost)

	var verdant_row: Dictionary = economy.settlements[verdant]
	var inventory: Dictionary = verdant_row["inventory"]
	var wood_target := economy.effective_target(verdant, "wood")
	inventory["wood"] = wood_target + 4
	verdant_row["inventory"] = inventory
	verdant_row["treasury"] = 40
	economy.settlements[verdant] = verdant_row
	economy.caravan_incident_cooldowns[key] = 16
	var wood_before := economy.item_count(verdant, "wood")
	var treasury_before := economy.treasury(verdant)

	var repair_events := economy._maintain_route_hazards(4)
	_check(repair_events.size() == 1, "active route disruption can trigger one bounded autonomous repair event")
	_check(economy.item_count(verdant, "wood") == wood_before - 1, "route repair consumes one real locally produced construction material")
	_check(economy.treasury(verdant) == treasury_before - SliceSettlementAuthority.ROUTE_REPAIR_TREASURY_COST, "route repair spends real settlement treasury instead of a cosmetic timer")
	_check(int(economy.caravan_incident_cooldowns.get(key, 0)) == 12, "material repair shortens the same authoritative route-hazard cooldown")
	_check(economy._route_hazard_active(verdant, frost, 4), "partially repaired route remains physically blocked until its shared cooldown clears")

	var second := economy._maintain_route_hazards(8)
	_check((second as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "route_repair" and bool((e as Dictionary).get("cleared", false))), "continued real maintenance can clear the route early")
	_check(not economy._route_hazard_active(verdant, frost, 8), "cleared maintenance removes the same route blockage used by autonomous logistics")

	verdant_row = economy.settlements[verdant]
	inventory = verdant_row["inventory"]
	var reserve := int(ceil(float(economy.effective_target(verdant, "wood")) * 0.40))
	inventory["wood"] = reserve
	verdant_row["inventory"] = inventory
	economy.settlements[verdant] = verdant_row
	economy.caravan_incident_cooldowns[key] = 24
	var stalled := economy._maintain_route_hazards(12)
	_check(stalled.is_empty(), "settlement refuses road maintenance when doing so would invade its real material reserve")
	_check(int(economy.caravan_incident_cooldowns.get(key, 0)) == 24, "unfunded repair cannot silently advance the route state")
	_check(economy.item_count(verdant, "wood") == reserve, "failed repair conserves settlement inventory")

	main.free()
	print("wildforge_route_repair=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
