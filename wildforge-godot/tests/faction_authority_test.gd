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
	var authority := world.faction_authority as SliceFactionAuthority
	_check(authority.ids() == ["ember", "frost", "verdant"], "world political authority is hard-capped to the three canonical factions")
	var exported := authority.export_state()
	_check((exported["factions"] as Array).size() == 3 and (exported["relations"] as Array).size() == 3, "one authority owns exactly three factions and three pair relations")
	var verdant_state := authority.state("verdant")
	_check(not verdant_state.has("inventory") and not verdant_state.has("treasury"), "faction authority cannot duplicate settlement economy state")
	var settlement_id := String((world.baseline_settlements[0] as Dictionary).get("id", ""))
	_check(authority.founding_faction_for_settlement(settlement_id) == "verdant", "Mossbridge founding faction is read from settlement authority")
	_check(authority.controller_for_settlement(settlement_id) == "verdant", "Mossbridge controller begins from physical ownership authority")

	_check(authority.set_relation("verdant", "ember", -54, "war"), "canonical relation can be mutated once through faction authority")
	_check(authority.relation("ember", "verdant")["stance"] == "war", "relations are symmetric projections of one stored pair")
	_check(authority.set_status("frost", "annexed", "ember"), "one faction can become a controlled political dependency")
	_check(authority.controller_id("frost") == "ember", "annexed faction resolves through the controller chain")
	_check(authority.relation("frost", "verdant") == authority.relation("ember", "verdant"), "annexed diplomacy resolves through sovereign controller")
	_check(authority.set_relation("frost", "verdant", 24, "trade"), "diplomacy written through a dependency redirects to its sovereign pair")
	_check(authority.relation("ember", "verdant")["stance"] == "trade" and int(authority.relation("ember", "verdant")["score"]) == 24, "no shadow relation can diverge behind an annexed faction")
	_check(not authority.set_status("ember", "annexed", "frost"), "controller cycles are rejected at mutation time")

	_check(authority.set_status("verdant", "annexed", "ember"), "Verdant can be politically annexed without rewriting Mossbridge blocks")
	_check(world.settlement_authority.owner_id(settlement_id) == "verdant", "political annexation does not duplicate or rewrite physical ownership state")
	_check(authority.controller_for_settlement(settlement_id) == "ember", "settlement political controller derives from faction control chain")

	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap["version"]) == 21 and snap.has("factions"), "schema 21 persists political facts explicitly")
	_check(SliceSaveSystem.validate_snapshot(snap), "schema 21 faction payload validates before disk persistence")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "schema 21 restores faction state into a fresh world")
	var authority2 := (restored.get_node("World") as SliceWorld).faction_authority as SliceFactionAuthority
	_check(authority2.controller_id("verdant") == "ember" and authority2.controller_id("frost") == "ember", "political controller chains survive save round-trip")
	_check(authority2.relation("verdant", "ember")["stance"] == "self", "annexed controller relation resolves to self after restore")

	var malformed := snap.duplicate(true)
	var faction_rows: Array = malformed["factions"]["factions"]
	for row in faction_rows:
		if String(row.get("id", "")) == "verdant":
			row["status"] = "annexed"
			row["owner_faction_id"] = "ember"
		elif String(row.get("id", "")) == "ember":
			row["status"] = "annexed"
			row["owner_faction_id"] = "verdant"
	_check(not SliceSaveSystem.validate_snapshot(malformed), "schema validator rejects cyclic annexation payloads")

	restored.free()
	print("wildforge_faction_authority=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
