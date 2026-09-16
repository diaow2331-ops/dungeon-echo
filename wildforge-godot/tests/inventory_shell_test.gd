extends SceneTree

var failed := false

func _check(ok: bool, label: String) -> void:
	if ok:
		print("PASS: ", label)
	else:
		failed = true
		push_error("FAIL: " + label)

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var player := main.player as SlicePlayer
	var overlay := main.inventory_overlay as SliceInventoryOverlay
	var controls := main.touch_controls as SliceTouchControls
	_check(overlay != null, "main owns one product inventory projection")
	_check(overlay.open_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "inventory button meets mobile touch floor")
	_check(overlay.hotbar_buttons.size() == SliceInventoryOverlay.SLOT_COUNT, "hotbar exposes the bounded six-slot product surface")
	_check(overlay.hotbar_buttons.all(func(b): return b.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET), "every hotbar slot is thumb-sized")
	_check(overlay.sort_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "hotbar organize action meets the mobile touch floor")
	_check(overlay.storage_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "nearby storage shortcut meets the mobile touch floor")
	main._open_inventory()
	_check(overlay.is_open(), "inventory button path opens the product inventory")
	_check(player.interaction_locked and controls.interaction_blocked, "inventory opening blocks world movement and live touch sticks")
	player.add_item("wood", 2)
	var wood_before_assign := player.item_count("wood")
	overlay.refresh_now()
	overlay.selected_slot = 0
	overlay._inventory_item_pressed("wood")
	_check(overlay.hotbar_items[0] == "wood", "inventory item can be assigned to the active hotbar slot")
	_check(player.selected_quick_item_id == "wood", "hotbar selection is projected onto the player quick-use preference")
	_check(player.item_count("wood") == wood_before_assign, "hotbar assignment never copies or consumes authoritative stock")
	player.add_item("stone_pick", 1)
	player.add_item("trail_ration", 1)
	var stock_before_sort := player.stock.duplicate(true)
	overlay._auto_arrange_hotbar()
	_check(overlay.hotbar_items.has("stone_pick") and overlay.hotbar_items.has("trail_ration"), "organize promotes owned equipment and food into the bounded hotbar")
	_check(player.stock == stock_before_sort, "organizing hotbar never mutates authoritative item quantities")

	var planks_before := player.item_count("plank")
	var wood_before_craft := player.item_count("wood")
	overlay._craft_recipe("plank")
	_check(player.item_count("wood") == wood_before_craft - 1, "inventory craft consumes the existing player stock")
	_check(player.item_count("plank") == planks_before + 4, "inventory craft produces through the canonical crafting recipe")
	player.add_item("stone_blade", 1)
	var blade_count := player.item_count("stone_blade")
	overlay._inventory_item_pressed("stone_blade")
	_check(player.equipped_weapon_id == "stone_blade", "inventory equipment action writes the existing weapon field")
	_check(player.item_count("stone_blade") == blade_count, "equipping never duplicates or consumes the owned weapon")
	player.add_item("raw_meat", 1)
	player.hunger = 50.0
	overlay._inventory_item_pressed("raw_meat")
	var meat_before := player.item_count("raw_meat")
	var hunger_before := player.hunger
	_check(player.context_action(), "selected hotbar food uses the ordinary context action")
	_check(player.item_count("raw_meat") == meat_before - 1 and player.hunger > hunger_before, "hotbar food consumes the same real inventory item")

	main._close_inventory()
	_check(not overlay.is_open(), "inventory closes without leaving a hidden modal")
	_check(not player.interaction_locked and not controls.interaction_blocked, "closing inventory restores movement and touch controls")
	var world := main.world as SliceWorld
	var actors := main.actor_authority as SliceWorldActorAuthority
	player.add_item("storage_box", 1)
	var storage_cell := Vector2i.ZERO
	var storage_found := false
	for x in range(-12, 13):
		storage_cell = Vector2i(x, world.surface_y_at(x) - 1)
		player.global_position = world.cell_center(storage_cell)
		world.refresh_streaming(true)
		if actors.can_place_storage(storage_cell):
			storage_found = true
			break
	_check(storage_found and actors.place_storage(storage_cell), "fixture places one real personal storage box")
	_check(actors.nearby_personal_storage() == "player_storage:0", "inventory shortcut discovers only a real nearby projected storage box")
	main._open_inventory()
	main._open_nearby_storage()
	_check(not overlay.is_open() and main.dialogue_overlay.visible, "nearby storage shortcut transitions into the existing storage panel")
	_check(main.active_interaction_kind == "player_storage" and main.active_actor_id == "player_storage:0", "shortcut reuses the canonical storage interaction identity")
	main.dialogue_overlay.close_dialogue()
	main._open_inventory()
	main._handle_back_request()
	_check(not overlay.is_open(), "back closes inventory before opening pause")
	_check(not main.pause_overlay.visible, "inventory back navigation cannot accidentally pause or exit")
	main.free()
	print("wildforge_inventory_shell=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
