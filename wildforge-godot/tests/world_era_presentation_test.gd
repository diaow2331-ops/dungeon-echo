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

func _actor_cell(authority: SliceWorldActorAuthority, actor_id: String) -> Vector2i:
	var descriptor: Dictionary = authority.descriptors.get(actor_id, {})
	return descriptor.get("cell", Vector2i(99999, 99999))

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var authority := main.actor_authority as SliceWorldActorAuthority
	var merchant_id := "verdant_mossbridge:merchant"
	var guard_id := "verdant_mossbridge:guard"
	var merchant_cell := _actor_cell(authority, merchant_id)
	player.global_position = world.cell_center(merchant_cell) + Vector2(0, -42)
	world.refresh_streaming(true)
	await process_frame
	var merchant := authority.projection_for(merchant_id) as SliceSettlementNpc
	_check(merchant != null, "nearby merchant projection remains available in Wanderer era")
	_check("安顿" in merchant.era_context_line(), "early merchant presents social foothold rather than a system-unlock label")

	var guard_cell := _actor_cell(authority, guard_id)
	player.global_position = world.cell_center(guard_cell) + Vector2(0, -42)
	world.refresh_streaming(true)
	await process_frame
	var guard := authority.projection_for(guard_id) as SliceSettlementGuard
	var early_guard: Array = guard._guard_dialogue()
	_check(not early_guard.is_empty() and "荒野" in String(early_guard[0]), "early guard frames the world around survival instead of politics")
	var era3 := {"era": 3, "era_entered_hour": 60, "milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst"], "last_transition": {"from": 2, "to": 3, "cause": "first_fracture", "hour": 60}}
	_check(world.progression_authority.restore_state(era3), "presentation fixture can enter Fracture without changing political truth")
	_check("气氛不对" in merchant.era_context_line(), "merchant language evolves when the road network enters a fragile era")
	var fracture_guard: Array = guard._guard_dialogue()
	_check(not fracture_guard.is_empty() and "边境" in String(fracture_guard[0]), "guard language exposes political warning before formal war exists")
	_check(String(world.faction_authority.relation("verdant", "ember").get("stance", "")) == "neutral", "presentation never fabricates a war state")

	var era5 := {"era": 5, "era_entered_hour": 200, "milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "settlement:ember_cinder_ridge", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst", "tension_seen", "war_ready_pressure", "war_resolved"], "last_transition": {"from": 4, "to": 5, "cause": "war_resolved", "hour": 200}}
	_check(world.progression_authority.restore_state(era5), "presentation fixture can enter fully open Reforging")
	_check("旗帜" in merchant.era_context_line(), "late merchant describes sovereignty as a lived world condition")

	main.free()
	print("wildforge_world_era_presentation=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
