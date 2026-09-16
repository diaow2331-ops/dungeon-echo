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
	var player := main.get_node("Player") as SlicePlayer
	var jail := world.settlement_authority.jail_cell("verdant_mossbridge")
	_check(jail != Vector2i(99999, 99999), "Mossbridge owns a physical jail cell")
	_check(world.tile_at(jail + Vector2i(-2, 0)) != SliceWorld.AIR and world.tile_at(jail + Vector2i(2, 0)) != SliceWorld.AIR, "jail cell is bounded by real settlement structure walls")
	player.forge_marks = 100
	player.add_item("wood", 3)
	player.add_item("warehouse_key:verdant_mossbridge", 1)
	var lost_before: int = main.actor_authority.actor_ids(SliceWorldActorAuthority.KIND_LOST_CARGO).size()
	world.faction_authority.record_player_crime("verdant", 1000)
	var treasury_before := world.settlement_authority.treasury("verdant_mossbridge")
	player.take_damage(9999.0, Vector2.ZERO, "verdant")
	_check(player.is_imprisoned(), "wanted player defeated by faction law is arrested instead of wilderness-respawned")
	_check(player.imprisoned_settlement_id == "verdant_mossbridge", "arrest sends player to the arresting faction prison")
	_check(player.global_position.distance_to(world.cell_center(jail) + Vector2(0, -28)) < 2.0, "arrest physically places player inside the jail cell")
	_check(world.faction_authority.player_bounty("verdant") == 0, "custody clears the served faction bounty")
	_check(player.forge_marks < 100 and world.settlement_authority.treasury("verdant_mossbridge") > treasury_before, "fine transfers real player money into real settlement treasury")
	_check(player.item_count("warehouse_key:verdant_mossbridge") == 0, "arrest confiscates stolen warehouse keys")
	_check(player.item_count("wood") == 3 and main.actor_authority.actor_ids(SliceWorldActorAuthority.KIND_LOST_CARGO).size() == lost_before, "arrest does not execute the ordinary death cargo-drop path")
	_check(player.imprisoned_until_hour > world.absolute_world_hour(), "serious crime creates a nonzero sentence instead of instant release")
	var snap := SliceSaveSystem.snapshot(main)
	_check(SliceSaveSystem.validate_snapshot(snap), "current save schema accepts an active prison sentence")
	var escape_release_hour := player.imprisoned_until_hour
	player.global_position = world.cell_center(jail + Vector2i(4, 0))
	var escaped_position := player.global_position
	player._update_imprisonment()
	_check(not player.is_imprisoned(), "leaving the physical jail before sentence maturity ends custody instead of leaving a ghost prison state")
	_check(world.faction_authority.player_bounty("verdant") >= SliceFactionAuthority.PLAYER_CRIME_CATALYST_BOUNTY, "jailbreak becomes a serious crime on the existing canonical faction bounty")
	_check(player.global_position == escaped_position, "jailbreak keeps the player at the escaped physical position")
	var escape_day := escape_release_hour / 24
	var escape_tod := (float(escape_release_hour % 24) + 0.1) / 24.0
	world.clock.restore({"day": escape_day, "time": escape_tod})
	player._update_imprisonment()
	_check(player.global_position == escaped_position, "former prisoner is not teleported back when the abandoned sentence later matures")
	var restored_main := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored_main, snap), "active prison sentence survives save round-trip")
	var restored_world := restored_main.get_node("World") as SliceWorld
	var restored_player := restored_main.get_node("Player") as SlicePlayer
	_check(restored_player.is_imprisoned() and restored_player.imprisoned_settlement_id == "verdant_mossbridge", "restored prisoner remains in custody")
	var release_hour := restored_player.imprisoned_until_hour
	var release_day := release_hour / 24
	var release_tod := (float(release_hour % 24) + 0.1) / 24.0
	restored_world.clock.restore({"day": release_day, "time": release_tod})
	restored_player._update_imprisonment()
	_check(not restored_player.is_imprisoned(), "sentence releases player when authoritative world time matures")
	_check(restored_player.global_position.distance_to(restored_world.cell_center(restored_world.settlement_authority.market_cell("verdant_mossbridge")) + Vector2(0, -52)) < 2.0, "release returns player outside the prison into the settlement")
	print("wildforge_player_prison=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
