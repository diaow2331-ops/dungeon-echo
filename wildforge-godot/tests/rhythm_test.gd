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
	var player := main.get_node("Player") as SlicePlayer
	var enemy := main.get_tree().get_nodes_in_group("enemies")[0] as SliceCrawler

	_check(SlicePlayer.TURN_ACCEL_MULT > 1.0, "direction reversal accelerates faster than ordinary movement")
	_check(SlicePlayer.APEX_GRAVITY_SCALE < 1.0, "held jump gets a bounded apex-control window")
	_check(SlicePlayer.ATTACK_BUFFER >= 0.08 and SlicePlayer.ATTACK_BUFFER <= 0.14, "melee tap buffering is forgiving but bounded")
	_check(SlicePlayer.MINE_STICK_GRACE > 0.0 and SlicePlayer.MINE_STICK_GRACE <= 0.12, "touch mining keeps brief aim stickiness")
	_check(SlicePlayer.MELEE_ACQUIRE_RANGE > SlicePlayer.MELEE_HIT_RANGE, "melee acquisition allows a small attack step instead of magnet hits")
	_check(SlicePlayer.ATTACK_STEP_SPEED > 100.0 and SlicePlayer.ATTACK_STEP_SPEED < SlicePlayer.SPEED, "grounded melee step is material but below run speed")

	player.health = player.max_health
	enemy.contact_cd = 0.0
	enemy.attack_state = 0
	var hp_before_roam := player.health
	enemy._update_roam(1.0 / 60.0, 150.0)
	_check(player.health == hp_before_roam, "ordinary chase logic never deals passive contact damage")
	_check(SliceCrawler.ATTACK_TRIGGER_RANGE > SliceCrawler.ATTACK_HIT_RANGE, "enemy commits from a readable trigger band before hit range")
	_check(SliceCrawler.ATTACK_TELL >= 0.16 and SliceCrawler.ATTACK_TELL <= 0.28, "enemy telegraph is readable without feeling slow")

	enemy._start_attack(-70.0)
	_check(enemy.attack_state == 1 and enemy.attack_timer > 0.0, "enemy attack always begins with telegraph state")
	_check(player.health == hp_before_roam, "telegraph itself deals no damage")
	enemy._update_attack(SliceCrawler.ATTACK_TELL + 0.01)
	_check(enemy.attack_state == 2, "telegraph transitions into a discrete lunge")
	_check(absf(enemy.velocity.x) >= 200.0, "enemy lunge has a clear committed velocity")
	enemy.global_position = player.global_position + Vector2(18, 0)
	enemy._update_attack(0.01)
	_check(player.health < player.max_health, "damage occurs during the committed attack window")
	enemy._update_attack(SliceCrawler.ATTACK_LUNGE + 0.01)
	_check(enemy.attack_state == 3, "enemy attack enters recovery after lunge")

	enemy._start_attack(-20.0)
	enemy.apply_hit(1.0, Vector2(80, -20))
	_check(enemy.attack_state == 0 and enemy.stun > 0.0, "player hit interrupts enemy windup or lunge")

	print("wildforge_godot_rhythm=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
