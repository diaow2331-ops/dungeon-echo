extends SceneTree

var failed := false

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, message: String) -> void:
	if not condition:
		failed = true
		push_error(message)
	else:
		print("PASS: ", message)

func _run() -> void:
	var main := (load("res://scenes/main/main.tscn") as PackedScene).instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var player := main.get_node("Player") as SlicePlayer
	var world := main.get_node("World") as SliceWorld
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())
	var economy := world.settlement_authority as SliceSettlementAuthority
	var overlay := main.dialogue_overlay as SliceDialogueOverlay
	_check(overlay.market_item_picker.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "goods selector is thumb-sized")
	for town in economy.ids():
		player.global_position = world.cell_center(economy.market_cell(town))
		main._open_dialogue({"npc_kind": "merchant", "settlement_id": town, "dialogue": ["欢迎交易"]})
		_check(overlay.market_item_picker.item_count == economy.accepted_goods(town).size(), "merchant exposes exactly its authority goods: " + town)
		for good in economy.accepted_goods(town):
			player.add_item(good, 2)
			for index in range(overlay.market_item_picker.item_count):
				if String(overlay.market_item_picker.get_item_metadata(index)) == good:
					overlay.market_item_picker.select(index)
					overlay.market_item_picker.item_selected.emit(index)
					break
			_check(String(overlay.active_market.get("item_id", "")) == good, "selector routes " + good)
			var stock := economy.item_count(town, good)
			var count := player.item_count(good)
			var marks := player.forge_marks
			var treasury := economy.treasury(town)
			var price := int(economy.sale_quote(town, good).get("total", 0))
			overlay.market_sell_button.emit_signal("pressed")
			_check(player.item_count(good) == count - 1 and economy.item_count(town, good) == stock + 1, "real goods conserved: " + town + "/" + good)
			_check(player.forge_marks == marks + price and economy.treasury(town) == treasury - price, "real money conserved: " + town + "/" + good)
			_check(String(overlay.active_market.get("item_id", "")) == good and int(overlay.active_market.get("stock", -1)) == stock + 1, "selection retained and quote refreshed")
		overlay.close_dialogue()
	var town := "verdant_mossbridge"
	player.global_position = world.cell_center(economy.market_cell(town))
	main._open_dialogue({"npc_kind": "merchant", "settlement_id": town})
	main._select_market_item("ice")
	var before := economy.export_state()
	var marks := player.forge_marks
	main._sell_to_active_merchant(town, "ancient_core", 1)
	main._sell_to_active_merchant("ember_cinder_ridge", "ice", 1)
	main._sell_to_active_merchant(town, "ice", 2)
	_check(economy.export_state() == before and player.forge_marks == marks, "unsupported item, wrong merchant and forged quantity are no-ops")
	main._select_market_item("ice")
	player.global_position = Vector2(99999, -99999)
	overlay.market_sell_button.emit_signal("pressed")
	_check(economy.export_state() == before and player.forge_marks == marks and "靠近" in overlay.market_feedback.text, "open panel cannot bypass physical range")
	player.global_position = world.cell_center(economy.market_cell(town))
	main._select_market_item("ice")
	player.spend_item("ice", player.item_count("ice"))
	overlay.market_sell_button.emit_signal("pressed")
	_check(economy.export_state() == before and overlay.market_sell_button.disabled, "stale player stock rejected and refreshed")
	player.add_item("ice", 1)
	main._select_market_item("ice")
	var rows := economy.export_state()
	for row in rows:
		if String(row["id"]) == town:
			row["treasury"] = 0
	economy.restore_state(rows)
	before = economy.export_state()
	overlay.market_sell_button.emit_signal("pressed")
	_check(economy.export_state() == before and player.item_count("ice") == 1 and overlay.market_sell_button.disabled, "stale treasury rejected without goods loss")
	overlay.close_dialogue()
	main._open_dialogue({"npc_kind": "guard", "settlement_id": town})
	_check(not overlay.market_box.visible, "guard still has no market")
	main.free()
	print("wildforge_multi_good_market=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
