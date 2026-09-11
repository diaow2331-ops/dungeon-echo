extends CharacterBody2D
class_name SliceCrawler

const GRAVITY := 1450.0
const CHASE_SPEED := 88.0
const ATTACK_TRIGGER_RANGE := 96.0
const ATTACK_HIT_RANGE := 37.0
const ATTACK_TELL := 0.20
const ATTACK_LUNGE := 0.14
const ATTACK_RECOVERY := 0.38
const ATTACK_LUNGE_SPEED := 255.0

var player: SlicePlayer
var hp := 52.0
var hop_cd := 0.0
var contact_cd := 0.0
var hit_flash := 0.0
var stun := 0.0
var landing_squash := 0.0
var was_on_floor := false
var previous_fall_speed := 0.0
var attack_state := 0 # 0 roam, 1 tell, 2 lunge, 3 recover
var attack_timer := 0.0
var attack_dir := 1.0
var attack_connected := false

func _ready() -> void:
	collision_layer = 4
	collision_mask = 1
	add_to_group("enemies")
	var shape := CapsuleShape2D.new()
	shape.radius = 11.0
	shape.height = 25.0
	var collider := CollisionShape2D.new()
	collider.shape = shape
	add_child(collider)
	queue_redraw()

func _physics_process(delta: float) -> void:
	if player == null or not is_instance_valid(player):
		return
	hop_cd = maxf(0.0, hop_cd - delta)
	contact_cd = maxf(0.0, contact_cd - delta)
	hit_flash = maxf(0.0, hit_flash - delta)
	stun = maxf(0.0, stun - delta)
	landing_squash = maxf(0.0, landing_squash - delta * 6.5)
	velocity.y = minf(820.0, velocity.y + GRAVITY * delta)
	var dx := player.global_position.x - global_position.x

	if stun > 0.0:
		attack_state = 0
		attack_timer = 0.0
		attack_connected = false
		velocity.x = move_toward(velocity.x, 0.0, 520.0 * delta)
	elif attack_state > 0:
		_update_attack(delta)
	else:
		_update_roam(delta, dx)

	previous_fall_speed = maxf(0.0, velocity.y)
	move_and_slide()
	var grounded := is_on_floor()
	if grounded and not was_on_floor and previous_fall_speed > 180.0:
		landing_squash = 0.16
	was_on_floor = grounded
	queue_redraw()

func _update_roam(delta: float, dx: float) -> void:
	if absf(dx) < 520.0:
		velocity.x = move_toward(velocity.x, signf(dx) * CHASE_SPEED, 430.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 360.0 * delta)
	if is_on_floor() and contact_cd <= 0.0 and absf(dx) <= ATTACK_TRIGGER_RANGE and absf(player.global_position.y - global_position.y) < 54.0:
		_start_attack(dx)
		return
	if is_on_floor() and hop_cd <= 0.0 and absf(dx) < 320.0:
		velocity.y = -275.0
		hop_cd = randf_range(0.82, 1.28)

func _start_attack(dx: float) -> void:
	attack_state = 1
	attack_timer = ATTACK_TELL
	attack_dir = signf(dx) if absf(dx) > 2.0 else 1.0
	attack_connected = false
	velocity.x *= 0.22

func _update_attack(delta: float) -> void:
	attack_timer = maxf(0.0, attack_timer - delta)
	match attack_state:
		1:
			velocity.x = move_toward(velocity.x, 0.0, 900.0 * delta)
			if attack_timer <= 0.0:
				attack_state = 2
				attack_timer = ATTACK_LUNGE
				velocity.x = attack_dir * ATTACK_LUNGE_SPEED
				if is_on_floor():
					velocity.y = -72.0
		2:
			if not attack_connected and global_position.distance_to(player.global_position) <= ATTACK_HIT_RANGE:
				attack_connected = true
				var push := Vector2(attack_dir * 205.0, -125.0)
				player.take_damage(9.0, push)
			if attack_timer <= 0.0:
				attack_state = 3
				attack_timer = ATTACK_RECOVERY
				contact_cd = 0.20
				velocity.x *= 0.28
		3:
			velocity.x = move_toward(velocity.x, 0.0, 620.0 * delta)
			if attack_timer <= 0.0:
				attack_state = 0

func apply_hit(damage: float, force: Vector2) -> void:
	hp -= damage
	velocity += force
	hit_flash = 0.13
	stun = 0.14
	attack_state = 0
	attack_timer = 0.0
	attack_connected = false
	contact_cd = maxf(contact_cd, 0.12)
	if hp <= 0.0:
		var main := get_parent()
		if main != null and main.has_method("enemy_defeated"):
			main.enemy_defeated(global_position)
		queue_free()

func _draw() -> void:
	var squash := clampf(landing_squash * 2.8, 0.0, 0.25)
	var tell_squash := 0.13 if attack_state == 1 else 0.0
	draw_set_transform(Vector2(0, 5.0 * (squash + tell_squash)), 0.0, Vector2(1.0 + squash + tell_squash, 1.0 - squash * 0.7 - tell_squash * 0.6))
	var c := Color("d36f58") if hit_flash > 0.0 else Color("6fa36a")
	if attack_state == 1:
		c = c.lerp(Color("e2a15d"), 0.58)
	elif attack_state == 2:
		c = c.lerp(Color("e16b52"), 0.48)
	draw_circle(Vector2(0, 3), 15.0, c)
	draw_rect(Rect2(-13, 1, 26, 12), c)
	draw_circle(Vector2(-5, -2), 2.0, Color("e9efe6"))
	draw_circle(Vector2(5, -2), 2.0, Color("e9efe6"))
	draw_circle(Vector2(-5, -2), 0.8, Color("1c2927"))
	draw_circle(Vector2(5, -2), 0.8, Color("1c2927"))
	if attack_state == 1:
		var tell_radius := 20.0 + (ATTACK_TELL - attack_timer) / ATTACK_TELL * 7.0
		draw_arc(Vector2.ZERO, tell_radius, -PI * 0.88, -PI * 0.12, 16, Color(1.0, 0.70, 0.35, 0.72), 2.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
