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
	var enemies := main.get_tree().get_nodes_in_group("enemies")
	_check(SlicePlayer.ATTACK_WINDUP > 0.0 and SlicePlayer.ATTACK_ACTIVE > 0.0 and SlicePlayer.ATTACK_RECOVERY > 0.0, "melee has explicit windup/active/recovery phases")
	_check(SlicePlayer.ATTACK_TOTAL < 0.40, "starter melee cadence stays responsive")
	var cell := Vector2i(0, world.surface_y_at(0))
	world.set_mining_feedback(cell, 0.63)
	_check(world.mining_cell == cell and absf(world.mining_progress - 0.63) < 0.001, "mining exposes progressive crack feedback")
	world.clear_mining_feedback()
	_check(world.mining_cell == SliceWorld.NO_CELL and world.mining_progress == 0.0, "mining feedback clears when aim is released")
	var children_before := world.get_child_count()
	world.feedback_burst(world.cell_center(cell), Color.WHITE, 6, 80.0)
	_check(world.get_child_count() == children_before + 1, "procedural impact burst spawns without art assets")
	var enemy := enemies[0] as SliceCrawler
	var hp_before := enemy.hp
	enemy.apply_hit(7.0, Vector2(120, -40))
	_check(enemy.hp == hp_before - 7.0, "enemy receives melee damage")
	_check(enemy.stun > 0.0 and enemy.hit_flash > 0.0, "enemy hit creates stun and flash feedback")
	player.touch_aim = Vector2.RIGHT
	player.set_touch_aim(Vector2.ZERO, false)
	_check(not player.touch_primary, "neutral right touch does not attack")
	player.set_touch_aim(Vector2(1, 0), true)
	_check(player.touch_primary and player.touch_aim == Vector2.RIGHT, "intentional right-stick aim arms primary action")
	player.hitstop = 0.042
	_check(player.hitstop > 0.0 and player.hitstop < 0.06, "micro hitstop remains brief")
	_check(player.get_node_or_null("Camera2D") != null, "feel slice keeps smoothed camera")
	print("wildforge_godot_feel=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
