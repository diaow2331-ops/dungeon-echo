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
	var factions := world.faction_authority as SliceFactionAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	var home := "verdant_mossbridge"
	var host := "frost_frostmirror"

	factions.set_relation("verdant", "frost", 0, "neutral")
	factions.set_relation("verdant", "ember", 0, "neutral")
	var home_row: Dictionary = economy.settlements[home]
	home_row["population"] = economy.population_baseline(home) - 3
	home_row["security"] = 92
	home_row["next_displacement_hour"] = 0
	economy.settlements[home] = home_row
	var host_row: Dictionary = economy.settlements[host]
	host_row["population"] = economy.population_baseline(host) + 3
	host_row["security"] = 96
	economy.settlements[host] = host_row
	var host_food_before := economy.effective_target(host, "raw_meat")
	var home_food_before := economy.effective_target(home, "raw_meat")

	var events := economy._maybe_start_return_migrations(24)
	_check(events.size() == 1, "recovered peaceful settlement can draw back one bounded civilian group")
	var departure: Dictionary = events[0] if not events.is_empty() else {}
	var movement_id := String(departure.get("displacement_id", ""))
	var active := economy.active_displacements()
	var movement: Dictionary = active[0] if not active.is_empty() else {}
	_check(String(movement.get("cause", "")) == "return_migration", "returning civilians reuse the same authoritative population-movement system")
	_check(String(movement.get("origin", "")) == host and String(movement.get("destination", "")) == home, "surplus host population returns toward the recovered home settlement")
	_check(economy.population(host) == economy.population_baseline(host), "return departure removes real people from the temporary host immediately")
	_check(economy.effective_target(host, "raw_meat") < host_food_before, "host food demand falls when returning civilians physically leave")
	_check(economy.population(home) == economy.population_baseline(home) - 3 and economy.effective_target(home, "raw_meat") == home_food_before, "home demand does not rise before people actually arrive")

	var travel_cell := economy.displacement_cell(movement_id)
	player.global_position = world.cell_center(travel_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_displacements(true)
	await process_frame
	var projection := actors.projection_for("world:" + movement_id) as SliceDisplacedTraveler
	_check(projection != null, "return migration is visible through the same sparse streamed traveler projection")
	if projection != null:
		_check(projection.label_text().begins_with("返乡者"), "world presentation distinguishes returnees without inventing another actor authority")

	var snap := SliceSaveSystem.snapshot(main)
	_check(SliceSaveSystem.validate_snapshot(snap), "return migration persists through the existing population save authority")
	var arrival_hour := int(movement.get("arrival_hour", 0))
	var arrived := economy._advance_displacements(arrival_hour)
	_check((arrived as Array).any(func(e): return String((e as Dictionary).get("displacement_id", "")) == movement_id), "returnees complete through the ordinary displacement arrival path")
	_check(economy.population(home) == economy.population_baseline(home), "arrival restores the recovered settlement population without creating people")
	_check(economy.effective_target(home, "raw_meat") > home_food_before, "returning population restores real local food demand")
	_check(economy.active_displacements().is_empty(), "completed return migration leaves no parallel demographic state")

	main.free()
	print("wildforge_return_migration=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
