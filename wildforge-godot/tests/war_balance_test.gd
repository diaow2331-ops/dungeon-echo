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
	var initial_gap := absi(factions.power_rating("verdant") - factions.power_rating("ember"))
	_check(initial_gap < SliceFactionAuthority.RAID_CONTESTED_POWER_GAP, "fresh Verdant/Ember war begins as a balanced power matchup")
	var peace_reserve := int(settlements.purchase_quote("verdant_mossbridge", "raw_meat", 1).get("reserve", 0))
	_check(factions.set_relation("verdant", "ember", -70, "war"), "balanced fixture enters canonical war state")

	var start := factions.simulate_hour(4)
	_check((start.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "raid_started"), "balanced war still creates a visible physical raid")
	var raids := factions.active_raids()
	_check(raids.size() == 1, "balanced war owns one raid record")
	var raid: Dictionary = raids[0]
	_check(not bool(raid.get("decisive", true)) and int(raid.get("max_strength", 0)) == 1, "small power gap produces a bounded non-decisive raid")
	var target := String(raid.get("target_settlement", ""))
	var defender := String(raid.get("defender", ""))
	var war_quote := settlements.purchase_quote(target, "raw_meat", 1)
	_check(float(war_quote.get("reserve_ratio", 0.0)) >= 0.75, "active raid raises local reserve protection instead of exporting essential stock")
	_check(int(war_quote.get("reserve", 0)) >= peace_reserve, "war reserve is never looser than the peacetime reserve")

	var first_strike := int(raid.get("next_strike_hour", 0))
	var strike1 := factions.simulate_hour(first_strike)
	_check((strike1.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "raid_strike"), "balanced raid still causes real first-strike losses")
	var raid_after_first: Dictionary = factions.active_raids()[0]
	var second_strike := int(raid_after_first.get("next_strike_hour", 0))
	var strike2 := factions.simulate_hour(second_strike)
	_check((strike2.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "raid_stalemate"), "non-decisive raid resolves as a stalemate after bounded pressure")
	_check(factions.active_raids().is_empty(), "stalemate clears the completed raid instead of leaving a zombie battle")
	_check(factions.controller_id(defender) == defender, "balanced raid cannot directly annex its defender")
	_check(settlements.security(target) >= 90, "stalemate recovery prevents rapid security snowball in a balanced war")

	# A second scheduled raid alternates initiative while the matchup remains close.
	var second_start := factions.simulate_hour(16)
	_check((second_start.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "raid_started"), "balanced war can continue with another bounded raid")
	var raid2: Dictionary = factions.active_raids()[0]
	_check(String(raid2.get("attacker", "")) != String(raid.get("attacker", "")), "near-equal war alternates initiative instead of deterministic one-sided snowball")

	# Finish the second stalemate and verify both founding sovereigns remain intact.
	factions.simulate_hour(int(raid2.get("next_strike_hour", 0)))
	var live := factions.active_raids()
	if not live.is_empty():
		factions.simulate_hour(int((live[0] as Dictionary).get("next_strike_hour", 0)))
	_check(factions.controller_id("verdant") == "verdant" and factions.controller_id("ember") == "ember", "two balanced raid cycles do not randomly annex either side")

	# Recovery is owned by the settlement/faction authorities after a raid ends.
	factions.set_status(defender, "weakened")
	settlements.recover_security(target, 100)
	var recovery := settlements.simulate_hour(24)
	_check((recovery.get("events", []) as Array).any(func(e): return String((e as Dictionary).get("kind", "")) == "faction_recovery"), "stable settlement recovery promotes degraded faction readiness")
	_check(String(factions.state(defender).get("status", "")) == "active", "recovered balanced defender returns to active status")

	main.free()
	print("wildforge_war_balance=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
