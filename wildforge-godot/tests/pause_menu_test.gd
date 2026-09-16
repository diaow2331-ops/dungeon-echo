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
	_check(not bool(ProjectSettings.get_setting("application/config/quit_on_go_back", true)), "Android back is owned by the game instead of immediate process exit")
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var pause := main.pause_overlay as SlicePauseOverlay
	_check(pause != null and not pause.visible, "pause surface exists but does not cover normal play")
	_check(pause.resume_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "resume action meets the mobile touch target floor")
	_check(pause.save_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "save action meets the mobile touch target floor")
	_check(pause.quit_button.custom_minimum_size.y >= SliceMobileLayout.MIN_TOUCH_TARGET, "save-and-exit action meets the mobile touch target floor")
	main._show_pause_menu()
	_check(paused and pause.visible, "back request can enter a real paused state")
	_check(main.touch_controls.interaction_blocked, "pausing clears and blocks live touch controls")
	main._resume_from_pause()
	_check(not paused and not pause.visible, "resume returns to live world simulation")
	_check(not main.touch_controls.interaction_blocked, "resume restores touch controls")

	main.dialogue_overlay.open_dialogue({"display_name": "旅人", "role": "", "dialogue": ["测试"]})
	_check(main.dialogue_overlay.visible, "dialogue fixture opens")
	main._handle_back_request()
	_check(not main.dialogue_overlay.visible and not paused, "back closes dialogue before pausing the world")
	main._handle_back_request()
	_check(paused and pause.visible, "second back from world opens pause instead of exiting")
	main._handle_back_request()
	_check(not paused and not pause.visible, "back while paused resumes instead of leaving a stuck tree")

	main.free()
	print("wildforge_pause_menu=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
