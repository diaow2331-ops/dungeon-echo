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
	var merchant_ids := authority.actor_ids(SliceWorldActorAuthority.KIND_MERCHANT)
	var guard_ids := authority.actor_ids(SliceWorldActorAuthority.KIND_SETTLEMENT_GUARD)
	_check(merchant_ids.size() == 1 and guard_ids.size() == 1, "Mossbridge registers exactly one merchant and one settlement guard")
	var merchant_id := merchant_ids[0] if not merchant_ids.is_empty() else ""
	var guard_id := guard_ids[0] if not guard_ids.is_empty() else ""
	_check(authority.is_present(merchant_id) and authority.is_present(guard_id), "settlement NPC identities live in world actor authority")

	var merchant_cell := _actor_cell(authority, merchant_id)
	player.global_position = world.cell_center(merchant_cell) + Vector2(0, -42)
	world.refresh_streaming(true)
	await process_frame
	_check(authority.is_projected(merchant_id), "approaching Mossbridge projects the merchant")
	var merchant := authority.projection_for(merchant_id) as SliceSettlementNpc
	_check(merchant != null and merchant.is_in_group("settlement_merchant"), "merchant projection uses the shared settlement NPC actor")

	main.touch_controls.move_id = 7
	main.touch_controls.aim_id = 8
	player.set_touch_move(Vector2(0.8, 0.0))
	var click := InputEventMouseButton.new()
	click.button_index = MOUSE_BUTTON_LEFT
	click.pressed = true
	merchant._input_event(root, click, 0)
	await process_frame
	var overlay := main.dialogue_overlay as SliceDialogueOverlay
	_check(overlay.visible, "mouse click on merchant opens the dialogue overlay")
	_check(overlay.speaker_label.text == "米菈" and "商人" in overlay.role_label.text, "merchant dialogue renders descriptor identity")
	_check(player.interaction_locked, "opening dialogue locks player world controls")
	_check(main.touch_controls.interaction_blocked and main.touch_controls.move_id == -1 and main.touch_controls.aim_id == -1 and player.touch_move == Vector2.ZERO, "dialogue opening clears active mobile sticks instead of leaving stale touch ids")
	var first_line := overlay.body_label.text
	overlay.next_button.emit_signal("pressed")
	_check(overlay.visible and overlay.body_label.text != first_line, "dialogue button advances to the next test line")
	overlay.next_button.emit_signal("pressed")
	await process_frame
	_check(not overlay.visible and not player.interaction_locked, "final dialogue line closes and restores player control")
	_check(not main.touch_controls.interaction_blocked, "dialogue close restores mobile interaction")

	var guard_cell := _actor_cell(authority, guard_id)
	player.global_position = world.cell_center(guard_cell) + Vector2(0, -42)
	world.refresh_streaming(true)
	await process_frame
	var guard := authority.projection_for(guard_id) as SliceSettlementNpc
	_check(guard != null and guard.is_in_group("settlement_guard"), "approaching the gate projects the settlement guard")
	var touch := InputEventScreenTouch.new()
	touch.index = 0
	touch.pressed = true
	guard._input_event(root, touch, 0)
	await process_frame
	_check(overlay.visible, "touching the guard opens the same dialogue overlay")
	_check(overlay.speaker_label.text == "洛恩" and "守卫" in overlay.role_label.text, "guard dialogue renders its own descriptor identity")
	overlay.close_dialogue()
	await process_frame
	var far_cell: Vector2i = world.remote_vein_cells[-1]
	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	await process_frame
	_check(not authority.is_projected(merchant_id) and not authority.is_projected(guard_id), "leaving Mossbridge unloads NPC scene projections")
	_check(authority.is_present(merchant_id) and authority.is_present(guard_id), "NPC authority survives chunk unload")

	player.global_position = world.cell_center(merchant_cell) + Vector2(0, -42)
	world.refresh_streaming(true)
	await process_frame
	_check(authority.projected_count(SliceWorldActorAuthority.KIND_MERCHANT) == 1, "returning to Mossbridge reprojects exactly one merchant")
	_check(authority.projected_count(SliceWorldActorAuthority.KIND_SETTLEMENT_GUARD) == 1, "returning to Mossbridge reprojects exactly one guard")

	main.free()
	print("wildforge_npc_dialogue=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
