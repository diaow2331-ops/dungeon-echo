extends CharacterBody2D
class_name SlicePlayer

const SPEED := 285.0
const GROUND_ACCEL := 2500.0
const AIR_ACCEL := 1280.0
const FRICTION := 2850.0
const GRAVITY := 1450.0
const JUMP_SPEED := 505.0
const COYOTE_TIME := 0.11
const JUMP_BUFFER := 0.12
const REACH := 132.0
const ATTACK_WINDUP := 0.055
const ATTACK_ACTIVE := 0.075
const ATTACK_RECOVERY := 0.17
const ATTACK_TOTAL := ATTACK_WINDUP + ATTACK_ACTIVE + ATTACK_RECOVERY

var world: SliceWorld
var health := 100.0
var max_health := 100.0
var facing := 1.0
var touch_move := Vector2.ZERO
var touch_aim := Vector2.RIGHT
var touch_primary := false
var touch_jump_latched := false
var coyote := 0.0
var jump_buffer := 0.0
var invuln := 0.0
var mine_cell := Vector2i(99999, 99999)
var mine_progress := 0.0
var hurt_flash := 0.0
var camera_trauma := 0.0
var attack_timer := 0.0
var attack_connected := false
var attack_target: Node2D
var attack_aim := Vector2.RIGHT
var hitstop := 0.0
var landing_squash := 0.0
var landing_strength := 0.0
var was_on_floor := false
var previous_fall_speed := 0.0

func _ready() -> void:
	collision_layer = 2
	collision_mask = 1
	var shape := CapsuleShape2D.new()
	shape.radius = 10.0
	shape.height = 38.0
	var collider := CollisionShape2D.new()
	collider.shape = shape
	collider.position = Vector2(0, -3)
	add_child(collider)
	queue_redraw()

func set_touch_move(v: Vector2) -> void:
	touch_move = v

func set_touch_aim(v: Vector2, active: bool) -> void:
	if v.length_squared() > 0.05:
		touch_aim = v.normalized()
	touch_primary = active

func _physics_process(delta: float) -> void:
	invuln = maxf(0.0, invuln - delta)
	hurt_flash = maxf(0.0, hurt_flash - delta)
	camera_trauma = maxf(0.0, camera_trauma - delta * 4.2)
	landing_squash = maxf(0.0, landing_squash - delta * 5.5)
	hitstop = maxf(0.0, hitstop - delta)
	_update_camera()
	_update_attack(delta)
	if hitstop > 0.0:
		velocity.x = move_toward(velocity.x, 0.0, 2800.0 * delta)
		queue_redraw()
		return

	if is_on_floor():
		coyote = COYOTE_TIME
	else:
		coyote = maxf(0.0, coyote - delta)

	var keyboard := Input.get_axis("move_left", "move_right")
	var axis := touch_move.x if absf(touch_move.x) > 0.06 else keyboard
	var target := axis * SPEED
	var accel := GROUND_ACCEL if is_on_floor() else AIR_ACCEL
	if absf(axis) > 0.04:
		velocity.x = move_toward(velocity.x, target, accel * delta)
		facing = signf(axis)
	else:
		velocity.x = move_toward(velocity.x, 0.0, (FRICTION if is_on_floor() else AIR_ACCEL * 0.28) * delta)

	var touch_jump := touch_move.y < -0.57
	if touch_move.y > -0.25:
		touch_jump_latched = false
	if Input.is_action_just_pressed("jump") or (touch_jump and not touch_jump_latched):
		jump_buffer = JUMP_BUFFER
		touch_jump_latched = touch_jump
	else:
		jump_buffer = maxf(0.0, jump_buffer - delta)
	if jump_buffer > 0.0 and coyote > 0.0:
		velocity.y = -JUMP_SPEED
		jump_buffer = 0.0
		coyote = 0.0
		camera_trauma = maxf(camera_trauma, 0.06)

	var jump_held := Input.is_action_pressed("jump") or touch_jump
	if not is_on_floor():
		velocity.y += GRAVITY * delta
		if velocity.y < -180.0 and not jump_held:
			velocity.y += GRAVITY * 1.65 * delta
	velocity.y = minf(velocity.y, 850.0)
	previous_fall_speed = maxf(0.0, velocity.y)
	move_and_slide()
	_handle_landing()

	var primary := Input.is_action_pressed("primary") or touch_primary
	if primary:
		_primary_action(delta)
	else:
		_reset_mining()
	if Input.is_action_just_pressed("place"):
		place_once()
	queue_redraw()

func _handle_landing() -> void:
	var grounded := is_on_floor()
	if grounded and not was_on_floor and previous_fall_speed > 240.0:
		landing_strength = clampf((previous_fall_speed - 240.0) / 450.0, 0.15, 1.0)
		landing_squash = 0.16 + landing_strength * 0.08
		camera_trauma = maxf(camera_trauma, 0.08 + landing_strength * 0.14)
		if world != null:
			world.feedback_burst(global_position + Vector2(0, 20), Color("b8a77d"), 4 + int(landing_strength * 4.0), 58.0)
	was_on_floor = grounded

func _aim_direction() -> Vector2:
	if touch_primary or touch_aim != Vector2.RIGHT:
		return touch_aim.normalized()
	var d := get_global_mouse_position() - global_position
	return d.normalized() if d.length_squared() > 4.0 else Vector2(facing, 0)

func _primary_action(delta: float) -> void:
	var aim := _aim_direction()
	if absf(aim.x) > 0.1:
		facing = signf(aim.x)
	var enemy := _enemy_in_aim(aim)
	if enemy != null:
		_reset_mining()
		if attack_timer <= 0.0:
			_start_attack(enemy, aim)
		return
	if attack_timer > 0.0:
		_reset_mining()
		return
	var target_cell := _first_solid_cell(aim)
	if target_cell == Vector2i(99999, 99999):
		_reset_mining()
		return
	if target_cell != mine_cell:
		mine_cell = target_cell
		mine_progress = 0.0
	mine_progress += delta
	var need := world.mine_time(target_cell)
	if need <= 0.0:
		_reset_mining()
		return
	world.set_mining_feedback(target_cell, clampf(mine_progress / need, 0.0, 1.0))
	if mine_progress >= need:
		var center := world.cell_center(target_cell)
		if world.mine_at(target_cell):
			camera_trauma = maxf(camera_trauma, 0.075)
			hitstop = maxf(hitstop, 0.018)
			world.feedback_burst(center, Color("c8b17e"), 7, 92.0)
		mine_progress = 0.0

func _reset_mining() -> void:
	mine_progress = 0.0
	mine_cell = Vector2i(99999, 99999)
	if world != null:
		world.clear_mining_feedback()

func _start_attack(enemy: Node2D, aim: Vector2) -> void:
	attack_timer = ATTACK_TOTAL
	attack_connected = false
	attack_target = enemy
	attack_aim = aim.normalized()

func _update_attack(delta: float) -> void:
	if attack_timer <= 0.0:
		attack_target = null
		return
	var previous := attack_timer
	attack_timer = maxf(0.0, attack_timer - delta)
	var active_start := ATTACK_RECOVERY + ATTACK_ACTIVE
	var active_end := ATTACK_RECOVERY
	if not attack_connected and previous >= active_end and attack_timer <= active_start:
		_connect_attack()

func _connect_attack() -> void:
	if attack_target == null or not is_instance_valid(attack_target):
		return
	var offset := attack_target.global_position - global_position
	if offset.length() > 92.0 or offset.normalized().dot(attack_aim) < 0.20:
		return
	attack_connected = true
	var force := offset.normalized() * 320.0 + Vector2.UP * 125.0
	attack_target.apply_hit(24.0, force)
	hitstop = 0.042
	camera_trauma = maxf(camera_trauma, 0.19)
	if world != null:
		world.feedback_burst(attack_target.global_position, Color("f0d68f"), 8, 125.0)

func attack_phase() -> float:
	return 0.0 if ATTACK_TOTAL <= 0.0 else 1.0 - attack_timer / ATTACK_TOTAL

func _enemy_in_aim(aim: Vector2) -> Node2D:
	var best: Node2D = null
	var best_d := 88.0
	for node in get_tree().get_nodes_in_group("enemies"):
		if not is_instance_valid(node):
			continue
		var offset: Vector2 = node.global_position - global_position
		var dist := offset.length()
		if dist > best_d or dist < 0.01:
			continue
		if offset.normalized().dot(aim) < 0.34:
			continue
		best = node
		best_d = dist
	return best

func _first_solid_cell(aim: Vector2) -> Vector2i:
	if world == null:
		return Vector2i(99999, 99999)
	for i in range(2, 10):
		var p := global_position + Vector2(0, -8) + aim * (float(i) * REACH / 9.0)
		var cell := world.world_to_cell(p)
		if world.has_cell(cell):
			return cell
	return Vector2i(99999, 99999)

func place_once() -> void:
	if world == null:
		return
	var aim := _aim_direction()
	var last_empty := world.world_to_cell(global_position + aim * 30.0)
	for i in range(2, 10):
		var p := global_position + aim * (float(i) * REACH / 9.0)
		var cell := world.world_to_cell(p)
		if world.has_cell(cell):
			break
		last_empty = cell
	var center := world.cell_center(last_empty)
	if center.distance_to(global_position) < 34.0:
		return
	if world.place_at(last_empty, SliceWorld.DIRT):
		camera_trauma = maxf(camera_trauma, 0.04)
		world.feedback_burst(center, Color("96b677"), 5, 70.0)

func take_damage(amount: float, knockback := Vector2.ZERO) -> void:
	if invuln > 0.0:
		return
	health = maxf(0.0, health - amount)
	invuln = 0.48
	hurt_flash = 0.16
	hitstop = 0.055
	velocity += knockback
	camera_trauma = maxf(camera_trauma, 0.34)
	if world != null:
		world.feedback_burst(global_position, Color("ef8b73"), 9, 135.0)
	if health <= 0.0:
		health = max_health
		global_position = Vector2(0, world.surface_y_at(0) * SliceWorld.TILE_SIZE - 60.0)
		velocity = Vector2.ZERO

func _update_camera() -> void:
	var cam := get_node_or_null("Camera2D") as Camera2D
	if cam == null:
		return
	var lead_x := clampf(velocity.x * 0.11, -38.0, 38.0) + facing * 12.0
	var lead_y := clampf(velocity.y * 0.035, -18.0, 22.0) - 16.0
	cam.position = cam.position.lerp(Vector2(lead_x, lead_y), 0.075)
	if camera_trauma <= 0.001:
		cam.offset = cam.offset.lerp(Vector2.ZERO, 0.30)
		return
	var power := camera_trauma * camera_trauma
	cam.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * 9.0 * power

func _draw() -> void:
	var squash := clampf(landing_squash * 3.6, 0.0, 0.22)
	var sx := 1.0 + squash
	var sy := 1.0 - squash * 0.72
	var body_color := Color("d8c08a") if hurt_flash <= 0.0 else Color("ef8b73")
	draw_set_transform(Vector2(0, 18.0 * (1.0 - sy)), 0.0, Vector2(sx, sy))
	draw_rect(Rect2(-10, -27, 20, 31), body_color)
	draw_rect(Rect2(-8, -35, 16, 11), Color("c7b07c"))
	draw_rect(Rect2(-12, 3, 9, 19), Color("4f6672"))
	draw_rect(Rect2(3, 3, 9, 19), Color("4f6672"))
	var hand := Vector2(facing * 10.0, -12.0)
	var phase := attack_phase()
	var swing := 0.0
	if attack_timer > 0.0:
		swing = sin(clampf(phase, 0.0, 1.0) * PI) * 18.0
	var blade_end := hand + Vector2(facing * (22.0 + swing), 4.0 - swing * 0.42)
	draw_line(hand, blade_end, Color("d8e2df"), 4.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
