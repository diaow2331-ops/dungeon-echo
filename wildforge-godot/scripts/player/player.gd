extends CharacterBody2D
class_name SlicePlayer

const SPEED := 285.0
const GROUND_ACCEL := 2300.0
const AIR_ACCEL := 1250.0
const FRICTION := 2600.0
const GRAVITY := 1450.0
const JUMP_SPEED := 505.0
const COYOTE_TIME := 0.11
const JUMP_BUFFER := 0.12
const REACH := 132.0

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
var attack_cd := 0.0
var invuln := 0.0
var mine_cell := Vector2i(99999, 99999)
var mine_progress := 0.0
var attack_flash := 0.0
var hurt_flash := 0.0
var camera_trauma := 0.0

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
	else:
		touch_primary = false

func _physics_process(delta: float) -> void:
	attack_cd = maxf(0.0, attack_cd - delta)
	invuln = maxf(0.0, invuln - delta)
	attack_flash = maxf(0.0, attack_flash - delta)
	hurt_flash = maxf(0.0, hurt_flash - delta)
	camera_trauma = maxf(0.0, camera_trauma - delta * 3.8)
	_update_camera_shake()

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
		camera_trauma = maxf(camera_trauma, 0.08)

	var jump_held := Input.is_action_pressed("jump") or touch_jump
	if not is_on_floor():
		velocity.y += GRAVITY * delta
		if velocity.y < -180.0 and not jump_held:
			velocity.y += GRAVITY * 1.65 * delta
	velocity.y = minf(velocity.y, 850.0)
	move_and_slide()

	var primary := Input.is_action_pressed("primary") or touch_primary
	if primary:
		_primary_action(delta)
	else:
		mine_progress = 0.0
		mine_cell = Vector2i(99999, 99999)
	if Input.is_action_just_pressed("place"):
		place_once()
	queue_redraw()

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
		mine_progress = 0.0
		if attack_cd <= 0.0:
			attack_cd = 0.24
			attack_flash = 0.12
			camera_trauma = maxf(camera_trauma, 0.16)
			enemy.apply_hit(24.0, (enemy.global_position - global_position).normalized() * 285.0 + Vector2.UP * 115.0)
		return
	var target_cell := _first_solid_cell(aim)
	if target_cell == Vector2i(99999, 99999):
		mine_progress = 0.0
		return
	if target_cell != mine_cell:
		mine_cell = target_cell
		mine_progress = 0.0
	mine_progress += delta
	var need := world.mine_time(target_cell)
	if need > 0.0 and mine_progress >= need:
		if world.mine_at(target_cell):
			camera_trauma = maxf(camera_trauma, 0.075)
		mine_progress = 0.0

func _enemy_in_aim(aim: Vector2) -> Node2D:
	var best: Node2D = null
	var best_d := 82.0
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
		camera_trauma = maxf(camera_trauma, 0.05)

func take_damage(amount: float, knockback := Vector2.ZERO) -> void:
	if invuln > 0.0:
		return
	health = maxf(0.0, health - amount)
	invuln = 0.48
	hurt_flash = 0.16
	velocity += knockback
	camera_trauma = maxf(camera_trauma, 0.34)
	if health <= 0.0:
		health = max_health
		global_position = Vector2(0, world.surface_y_at(0) * SliceWorld.TILE_SIZE - 60.0)
		velocity = Vector2.ZERO

func _update_camera_shake() -> void:
	var cam := get_node_or_null("Camera2D") as Camera2D
	if cam == null:
		return
	if camera_trauma <= 0.001:
		cam.offset = cam.offset.lerp(Vector2.ZERO, 0.28)
		return
	var power := camera_trauma * camera_trauma
	cam.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * 8.0 * power

func _draw() -> void:
	var body_color := Color("d8c08a") if hurt_flash <= 0.0 else Color("ef8b73")
	draw_rect(Rect2(-10, -27, 20, 31), body_color)
	draw_rect(Rect2(-8, -35, 16, 11), Color("c7b07c"))
	draw_rect(Rect2(-12, 3, 9, 19), Color("4f6672"))
	draw_rect(Rect2(3, 3, 9, 19), Color("4f6672"))
	var hand := Vector2(facing * 10.0, -12.0)
	var blade_end := hand + Vector2(facing * (30.0 if attack_flash > 0.0 else 20.0), -6.0 if attack_flash > 0.0 else 4.0)
	draw_line(hand, blade_end, Color("d8e2df"), 4.0)
