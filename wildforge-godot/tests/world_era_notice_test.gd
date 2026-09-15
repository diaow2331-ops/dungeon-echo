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
	var controls := main.touch_controls as SliceTouchControls
	main._on_world_event({"kind": "world_era_changed", "from": 1, "to": 2, "cause": "open_roads", "hour": 25})
	_check("货路" in controls.world_notice, "era transition is surfaced as an in-world change rather than an unlock banner")
	_check(controls.world_notice_remaining > 0.0, "world notice is transient presentation state only")
	main._on_world_event({"kind": "world_era_changed", "from": 3, "to": 4, "cause": "peaceful_maturity", "hour": 300})
	_check("和平" in controls.world_notice, "peaceful Warfront transition does not falsely announce a scripted war")
	main._on_world_event({"kind": "world_era_changed", "from": 4, "to": 5, "cause": "war_resolved", "hour": 900})
	_check("主权" in controls.world_notice or "旧秩序" in controls.world_notice, "late transition describes changed world possibilities rather than a level-up")
	controls._process(8.0)
	_check(controls.world_notice.is_empty() and controls.world_notice_remaining <= 0.0, "era notice expires without becoming a persistent quest or second state")

	main.free()
	print("wildforge_world_era_notice=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
