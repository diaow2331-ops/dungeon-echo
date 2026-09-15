extends SceneTree
var failed := false
func _initialize() -> void:
	call_deferred("_run")
func check(ok: bool, message: String) -> void:
	if not ok:
		failed = true
		push_error(message)
	else:
		print("PASS: ", message)
func _run() -> void:
	var main = (load("res://scenes/main/main.tscn") as PackedScene).instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	main.process_mode = Node.PROCESS_MODE_DISABLED
	var p: SlicePlayer = main.player
	var w: SliceWorld = main.world
	var a: SliceWorldActorAuthority = main.actor_authority
	p.stock.clear()
	p.add_item("storage_box", 1)
	var cell := Vector2i.ZERO
	var found := false
	for x in range(-20, 20):
		cell = Vector2i(x, w.surface_y_at(x) - 1)
		p.global_position = w.cell_center(cell)
		w.refresh_streaming(true)
		if a.can_place_storage(cell):
			found = true
			break
	check(found and a.place_storage(cell), "place one real box")
	var id := "player_storage:0"
	check(p.item_count("storage_box") == 0 and a.is_projected(id), "placing consumes the carried box")
	p.add_item("wood", 40)
	check(bool(a.deposit_cargo(id, "wood", 20).get("ok")), "bulk deposit succeeds nearby")
	check(p.item_count("wood") == 20 and a.storage_weight(id) == 20, "deposit conserves goods")
	check(not a.pack_storage(id), "loaded box cannot turn into portable free cargo")
	p.global_position += Vector2(500, 0)
	check(not bool(a.recover_cargo(id, "wood", 20).get("ok")), "remote withdrawal rejected")
	p.global_position = w.cell_center(cell)
	main._open_dialogue({"npc_kind": "player_storage", "actor_id": id})
	main._start_warehouse_transfer("ancient_core", 20)
	check(main.warehouse_transfer.is_empty(), "invalid cargo rejected before handling timer")
	main._start_warehouse_transfer("wood", 20)
	main.dialogue_overlay.close_dialogue()
	check(a.storage_weight(id) == 20 and p.item_count("wood") == 20, "cancelled handling changes neither ledger")
	check(bool(a.recover_cargo(id, "wood", 20).get("ok")), "withdraw goods")
	check(a.pack_storage(id) and not a.pack_storage(id), "empty box packs exactly once")
	var town := "verdant_mossbridge"
	p.stock.clear()
	p.forge_marks = 1000
	p.global_position = w.cell_center(w.settlement_authority.market_cell(town))
	w.refresh_streaming(true)
	var treasury := w.settlement_authority.treasury(town)
	check(a.buy_beast(town), "merchant supplies one mossback")
	check(p.forge_marks == 760 and w.settlement_authority.treasury(town) == treasury + 240, "purchase money reaches real treasury")
	check(not a.buy_beast(town) and p.forge_marks == 760, "duplicate companion purchase rejected")
	var beast := SliceWorldActorAuthority.BEAST_ID
	if not a.is_projected(beast):
		check(false, "beast must project")
		main.free()
		quit(1)
		return
	p.global_position = a.projection_for(beast).global_position
	p.add_item("wood", 40)
	check(bool(a.deposit_cargo(beast, "wood", 20).get("ok")), "load mossback")
	var snapshot := SliceSaveSystem.snapshot(main)
	check(SliceSaveSystem.validate_snapshot(snapshot), "current cargo snapshot validates")
	check(SliceSaveSystem.apply_snapshot(main, snapshot), "cargo snapshot restores")
	check(a.storage_weight(beast) == 20 and p.item_count("wood") == 20, "save roundtrip conserves carried and loaded goods")
	p.global_position = a.projection_for(beast).global_position
	a.hurt_beast(20)
	p.add_item("trail_ration", 1)
	check(a.tend_beast(true) and p.item_count("trail_ration") == 0, "care consumes real ration")
	a.hurt_beast(1000)
	check(a.storage_weight(beast) == 15, "death destroys one quarter once")
	a.hurt_beast(1000)
	check(a.storage_weight(beast) == 15 and not bool(a.deposit_cargo(beast, "wood", 1).get("ok")), "dead companion cannot duplicate loss or accept deposits")
	check(not a.bury_beast(), "loaded corpse cannot be discarded by burial")
	check(bool(a.recover_cargo(beast, "wood", 5).get("ok")), "corpse remains recoverable")
	check(bool(a.recover_cargo(beast, "wood", 5).get("ok")), "recover second corpse batch")
	check(bool(a.recover_cargo(beast, "wood", 5).get("ok")), "recover final corpse batch")
	check(a.bury_beast() and not a.bury_beast(), "burial is idempotent")
	check(p.item_count("wood") == 35, "end-to-end cargo equals original less actual loss")
	main.free()
	print("wildforge_player_logistics=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
