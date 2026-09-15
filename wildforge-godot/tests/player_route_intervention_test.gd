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
	var player := main.get_node("Player") as SlicePlayer
	var economy := world.settlement_authority as SliceSettlementAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())

	var key := economy._route_pair_key("verdant_mossbridge", "frost_frostmirror")
	var now := world.absolute_world_hour()
	economy.caravan_incident_cooldowns[key] = now + 12
	var hazard_cell := economy.route_hazard_cell(key)
	player.global_position = world.cell_center(hazard_cell) + Vector2(0, -48)
	player.add_item("wood", 2)
	world.refresh_streaming(true)
	actors.sync_route_hazards(true)
	await process_frame
	var wood_before := player.item_count("wood")
	_check(player.context_label() == "修", "nearby blocked road exposes repair as the contextual action")
	_check("中央键投入1份木材修复" in main.touch_controls._journey_hint(), "mobile guidance explains the physical repair choice")
	_check(player.context_action(), "player can spend one carried construction material to repair the live route")
	_check(player.item_count("wood") == wood_before - 1, "player repair consumes real carried material")
	_check(int(economy.caravan_incident_cooldowns.get(key, 0)) == now + 6, "player repair shortens the same authoritative hazard cooldown")
	_check(world.progression_authority.has_milestone("tension_seen"), "working on the damaged route counts as physically witnessing tension")
	_check(economy._route_hazard_active("verdant_mossbridge", "frost_frostmirror", now), "one repair does not cosmetically erase a route that is still blocked")

	_check(player.context_action(), "a second real material contribution can finish the repair")
	_check(player.item_count("wood") == wood_before - 2, "finishing the repair conserves the second donated material")
	_check(not economy._route_hazard_active("verdant_mossbridge", "frost_frostmirror", now), "enough physical repair reopens the canonical route immediately")
	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_ROUTE_HAZARD) == 0, "cleared route removes its debris projection instead of leaving fake presentation state")

	economy.caravan_incident_cooldowns[key] = now + 12
	player.stock["wood"] = 0
	player.global_position = world.cell_center(hazard_cell) + Vector2(0, -48)
	_check(player.context_label() == "修", "blocked road keeps the contextual action even when repair material is missing")
	_check(not player.context_action(), "repair without construction material changes nothing")
	_check(int(economy.caravan_incident_cooldowns.get(key, 0)) == now + 12, "material shortage cannot advance route recovery")
	player.global_position += Vector2(900, 0)
	var stock_before_far := player.item_count("wood")
	_check(not bool(economy.player_route_repair(player, key).get("ok", false)), "route repair cannot be performed remotely")
	_check(player.item_count("wood") == stock_before_far, "failed remote repair cannot consume inventory")

	main.free()
	print("wildforge_player_route_intervention=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
