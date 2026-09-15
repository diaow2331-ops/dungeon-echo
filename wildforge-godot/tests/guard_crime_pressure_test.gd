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
	var factions := world.faction_authority as SliceFactionAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	var town := "verdant_mossbridge"
	var guard_id := ""
	for actor_id in actors.actor_ids(SliceWorldActorAuthority.KIND_SETTLEMENT_GUARD):
		var row: Dictionary = actors.descriptors[actor_id]
		var meta: Dictionary = row["meta"]
		if String(meta.get("settlement_id", "")) == town:
			guard_id = actor_id
			break
	_check(not guard_id.is_empty(), "fixture finds the real settlement guard authority record")
	if guard_id.is_empty():
		main.free()
		print("wildforge_guard_crime_pressure=FAIL")
		quit(1)
		return
	var relation_before: Dictionary = factions.relation("verdant", "frost")
	var security_before := economy.security(town)
	var bounty_before := factions.player_bounty("verdant")
	var at := world.cell_center(economy.market_cell(town))
	actors.damage_guard(guard_id, 9999.0, at)
	_check(actors.guard_health(guard_id) <= 0.0, "killing a guard changes the existing persistent guard record")
	_check(economy.security(town) == security_before - 8, "guard killing damages canonical settlement security")
	_check(factions.player_bounty("verdant") == bounty_before + 1000, "guard killing raises the existing faction bounty")
	_check(factions.relation("verdant", "frost") == relation_before, "guard killing does not fabricate inter-faction hostility")
	_check(not factions.at_war("verdant"), "guard killing cannot declare war directly")

	var security_after := economy.security(town)
	var bounty_after := factions.player_bounty("verdant")
	actors.damage_guard(guard_id, 9999.0, at)
	_check(economy.security(town) == security_after, "dead guard cannot repeatedly damage local security")
	_check(factions.player_bounty("verdant") == bounty_after, "dead guard cannot repeatedly increase bounty")

	main.free()
	print("wildforge_guard_crime_pressure=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
