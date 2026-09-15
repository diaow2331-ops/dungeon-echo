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
	_check(int(ProjectSettings.get_setting("display/window/handheld/orientation")) == 4, "Android handheld orientation is sensor-landscape")
	_check(String(ProjectSettings.get_setting("display/window/stretch/aspect")) == "expand", "landscape viewport expands across modern phone aspect ratios")
	_check(int(ProjectSettings.get_setting("display/window/size/viewport_width")) == 1280 and int(ProjectSettings.get_setting("display/window/size/viewport_height")) == 720, "mobile layout keeps the 16:9 landscape design baseline")

	var viewport_size := Vector2(1280, 720)
	var physical_size := Vector2i(2400, 1080)
	var safe_area := Rect2i(100, 0, 2200, 1030)
	var insets := SliceMobileLayout.safe_insets_for(viewport_size, physical_size, safe_area)
	_check(absf(insets.x - 53.3333) < 0.1 and absf(insets.z - 53.3333) < 0.1, "display cutout insets scale into the virtual landscape viewport")
	_check(absf(insets.w - 33.3333) < 0.1, "gesture-navigation bottom inset scales into the virtual viewport")
	var overlay := SliceDialogueOverlay.new()
	overlay.name = "DialogueOverlayTest"
	root.add_child(overlay)
	await process_frame
	_check(overlay.next_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "dialogue advance/close button meets the mobile touch target floor")
	_check(overlay.market_sell_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "merchant sale button meets the same mobile touch target floor")
	var content_rect := SliceMobileLayout.content_rect(overlay.get_viewport_rect().size)
	var panel_rect := Rect2(overlay.dialogue_panel.position, overlay.dialogue_panel.size)
	_check(content_rect.encloses(panel_rect), "dialogue panel stays inside the safe interactive content rect")
	_check(overlay.body_label.autowrap_mode != TextServer.AUTOWRAP_OFF, "dialogue body wraps on narrow landscape screens")

	overlay.open_dialogue({"display_name": "米菈", "role": "苔桥镇 · 商人", "dialogue": ["远方的货物在这里很受欢迎。"], "market": {"enabled": true, "ok": true, "affordable": true, "item_id": "basalt", "goods": ["basalt", "ice", "raw_meat", "wood"], "player_count": 4, "stock": 1, "target": 6, "total": 5}})
	overlay.update_market(overlay.active_market, "成交：+5◆")
	await process_frame
	await process_frame
	content_rect = SliceMobileLayout.content_rect(overlay.get_viewport_rect().size)
	_check(content_rect.encloses(overlay.dialogue_panel.get_global_rect()), "populated market and feedback stay inside safe area")
	_check(overlay.dialogue_panel.get_global_rect().encloses(overlay.next_button.get_global_rect()), "close action stays inside market panel")
	_check(overlay.market_item_picker.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "goods selector meets mobile touch floor")

	var controls := SliceTouchControls.new()
	controls.name = "TouchControlsTest"
	root.add_child(controls)
	await process_frame
	var context_center := controls._context_center()
	var controls_rect := controls._safe_content_rect()
	_check(controls_rect.has_point(context_center), "bottom context action stays inside the mobile safe area")
	_check(SliceTouchControls.PLACE_RADIUS * 2.0 * 1.35 >= SliceMobileLayout.MIN_TOUCH_TARGET, "context action hit target is thumb-sized even if the drawn circle is smaller")

	overlay.free()
	controls.free()
	print("wildforge_mobile_ui=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
