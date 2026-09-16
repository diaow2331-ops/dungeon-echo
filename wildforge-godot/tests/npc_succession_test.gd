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
	return (authority.descriptors.get(actor_id, {}) as Dictionary).get("cell", Vector2i(99999, 99999))

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var authority := main.actor_authority as SliceWorldActorAuthority
	var roster := world.npc_roster_authority as SliceNpcRosterAuthority
	var merchant_id := "verdant_mossbridge:merchant"
	var merchant_before := roster.person(merchant_id)
	var old_name := String(merchant_before.get("display_name", ""))
	var old_person_id := String(merchant_before.get("person_id", ""))
	var old_personality := String(merchant_before.get("personality", ""))
	var settlement_id := String(merchant_before.get("settlement_id", ""))
	var security_before := world.settlement_authority.security(settlement_id)
	var treasury_before := world.settlement_authority.treasury(settlement_id)
	player.global_position = world.cell_center(_actor_cell(authority, merchant_id)) + Vector2(0, -42)
	world.refresh_streaming(true)
	await process_frame
	var merchant := authority.projection_for(merchant_id) as SliceSettlementNpc
	_check(merchant != null and merchant.is_in_group("damageable_npcs"), "merchant is a deliberate melee target instead of an immortal service object")
	merchant.apply_hit(999.0, Vector2.ZERO)
	_check(not roster.is_alive(merchant_id) and roster.health(merchant_id) == 0.0, "killing merchant permanently kills the current person identity")
	_check(world.settlement_authority.security(settlement_id) < security_before, "merchant murder damages the same canonical local security")
	_check(world.faction_authority.player_bounty(String(merchant_before.get("faction_id", ""))) >= 500, "merchant murder enters the existing serious-crime bounty path")
	var click := InputEventMouseButton.new()
	click.button_index = MOUSE_BUTTON_LEFT
	click.pressed = true
	merchant._input_event(root, click, 0)
	await process_frame
	_check(not main.dialogue_overlay.visible, "dead merchant no longer provides market dialogue")
	var dead_state := roster.person(merchant_id)
	var due := int(dead_state.get("replacement_due_hour", -1))
	_check(due > int(dead_state.get("death_hour", -1)), "death opens a timed vacancy instead of respawning the same NPC")
	var early_events := roster.simulate_hour(due - 1)
	_check(early_events.is_empty() and not roster.is_alive(merchant_id), "role remains vacant before the replacement delay matures")
	var succession_events := roster.simulate_hour(due)
	_check(succession_events.size() == 1 and String((succession_events[0] as Dictionary).get("kind", "")) == "npc_succeeded", "mature funded vacancy produces one succession event")
	var successor := roster.person(merchant_id)
	_check(String(successor.get("person_id", "")) != old_person_id and int(successor.get("generation", 0)) == 1, "successor is a new person generation, never the dead NPC revived")
	_check(String(successor.get("display_name", "")) != old_name, "immediate successor receives a visibly different generated name")
	_check(String(successor.get("personality", "")) != old_personality, "immediate successor receives a different generated speaking temperament")
	_check(world.settlement_authority.treasury(settlement_id) == treasury_before - SliceSettlementAuthority.MERCHANT_REPLACEMENT_TREASURY_COST, "replacement consumes real settlement treasury rather than spawning for free")
	authority.sync_npc_roster(true)
	await process_frame
	var replacement := authority.projection_for(merchant_id) as SliceSettlementNpc
	_check(replacement != null and replacement.alive(), "same role slot is physically occupied again after succession")
	_check(String(replacement.payload.get("display_name", "")) == String(successor.get("display_name", "")), "new physical merchant projects the successor identity")
	_check(String(replacement.payload.get("person_id", "")) == String(successor.get("person_id", "")), "projection no longer carries the deceased person's id")
	main.queue_free()
	await process_frame
	print("wildforge_npc_succession=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
