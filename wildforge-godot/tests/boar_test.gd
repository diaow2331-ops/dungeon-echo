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
	var boars := main.get_tree().get_nodes_in_group("hunt_targets")
	_check(boars.size() == 1, "early slice has one sparse dedicated hunt target")
	var boar := boars[0] as SliceBrambleBoar if not boars.is_empty() else null
	_check(boar != null, "raw-meat hunt target is a distinct bramble boar entity")
	if boar == null:
		print("wildforge_godot_boar=FAIL")
		quit(1)
		return

	_check(boar.loot_item_id == "raw_meat" and boar.loot_min == 1 and boar.loot_max == 2, "bramble boar preserves canonical one-to-two raw meat reward")
	_check(SliceBrambleBoar.KNOCKBACK_RESIST > 0.20, "boar has materially higher commitment than light crawler")
	_check(SliceBrambleBoar.CHARGE_TELL >= 0.28, "boar charge has a readable tell")
	_check(SliceBrambleBoar.CHARGE_RECOVERY > SliceBrambleBoar.CHARGE_TIME, "boar leaves a punishable recovery window")

	player.health = 100.0
	boar.attack_state = 0
	boar._update_stalk(0.016, 32.0)
	_check(boar.attack_state == 0 and absf(player.health - 100.0) < 0.001, "close contact alone never deals boar damage")
	boar._start_charge(150.0)
	_check(boar.attack_state == 1, "boar attack always begins with charge tell")
	_check(absf(player.health - 100.0) < 0.001, "charge tell itself deals no damage")

	boar.apply_hit(1.0, Vector2.ZERO)
	_check(boar.attack_state == 0, "player hit interrupts boar charge tell")
	boar.stun = 0.0
	boar._start_charge(150.0)
	boar._update_attack(SliceBrambleBoar.CHARGE_TELL + 0.01)
	_check(boar.attack_state == 2, "charge tell transitions into committed charge")
	_check(absf(boar.velocity.x) >= SliceBrambleBoar.CHARGE_SPEED * 0.95, "committed charge has meaningful forward speed")
	boar.apply_hit(1.0, Vector2(-100, 0))
	_check(boar.attack_state == 2, "light hit does not cancel an already committed boar charge")

	boar.attack_timer = 0.01
	boar._update_attack(0.02)
	_check(boar.attack_state == 3, "boar charge always enters explicit recovery")
	var pickup_before := main.get_tree().get_nodes_in_group("pickups").size()
	boar.apply_hit(999.0, Vector2.ZERO)
	await process_frame
	var raw_stacks := 0
	for node in main.get_tree().get_nodes_in_group("pickups"):
		if node is SliceItemPickup and node.item_id == "raw_meat":
			raw_stacks += 1
	_check(main.get_tree().get_nodes_in_group("pickups").size() > pickup_before and raw_stacks >= 1, "boar defeat produces physical raw-meat pickup")

	print("wildforge_godot_boar=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
