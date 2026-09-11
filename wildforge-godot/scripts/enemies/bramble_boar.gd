extends CharacterBody2D
class_name SliceBrambleBoar

const GRAVITY := 1450.0
const STALK_SPEED := 106.0
const CHARGE_TRIGGER_MIN := 82.0
const CHARGE_TRIGGER_MAX := 220.0
const CHARGE_HIT_RANGE := 43.0
const CHARGE_TELL := 0.30
const CHARGE_TIME := 0.34
const CHARGE_RECOVERY := 0.52
const CHARGE_SPEED := 338.0
const DAMAGE := 11.0
const KNOCKBACK_RESIST := 0.28

var player: SlicePlayer
var hp := 72.0
var attack_state := 0 # 0 stalk, 1 tell, 2 committed charge, 3 recovery
var attack_timer := 0.0
var attack_dir := 1.0
var attack_connected := false
var hit_flash := 0.0
var stun := 0.0
var loot_item_id := "raw_meat"
var loot_min := 1
var loot_max := 2

func _ready() -> void:
	collision_layer = 4
	collision_mask = 1
	add_to_group("enemies")
	add_to_group("hunt_targets")
	var shape := CapsuleShape2D.new()
	shape.radius = 15.0
	shape.height = 29.0
	var collider := CollisionShape2D.new()
	collider.shape = shape
	add_child(collider)
	queue_redraw()

func _physics_process(delta: float) -> void:
	if player == null or not is_instance_valid(player):
		return
	hit_flash = maxf(0.0, hit_flash - delta)
	stun = maxf(0.0, stun - delta)
	velocity.y = minf(840.0, velocity.y + GRAVITY * delta)
	var dx := player.global_position.x - global_position.x
	if stun > 0.0:
		velocity.x = move_toward(velocity.x, 0.0, 640.0 * delta)
	elif attack_state > 0:
		_update_attack(delta)
	else:
		_update_stalk(delta, dx)
	move_and_slide()
	queue_redraw()

func _update_stalk(delta: float, dx: float) -> void:
	if absf(dx) < 560.0:
		velocity.x = move_toward(velocity.x, signf(dx) * STALK_SPEED, 350.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 300.0 * delta)
	var aligned := absf(player.global_position.y - global_position.y) < 52.0
	if is_on_floor() and aligned and absf(dx) >= CHARGE_TRIGGER_MIN and absf(dx) <= CHARGE_TRIGGER_MAX:
		_start_charge(dx)

func _start_charge(dx: float) -> void:
	attack_state = 1
	attack_timer = CHARGE_TELL
	attack_dir = signf(dx) if absf(dx) > 2.0 else 1.0
	attack_connected = false
	velocity.x *= 0.15

func _update_attack(delta: float) -> void:
	attack_timer = maxf(0.0, attack_timer - delta)
	match attack_state:
		1:
			velocity.x = move_toward(velocity.x, 0.0, 1100.0 * delta)
			if attack_timer <= 0.0:
				attack_state = 2
				attack_timer = CHARGE_TIME
				velocity.x = attack_dir * CHARGE_SPEED
		2:
			velocity.x = attack_dir * CHARGE_SPEED
			if not attack_connected and global_position.distance_to(player.global_position) <= CHARGE_HIT_RANGE:
				attack_connected = true
				player.take_damage(DAMAGE, Vector2(attack_dir * 275.0, -118.0))
			if attack_timer <= 0.0:
				attack_state = 3
				attack_timer = CHARGE_RECOVERY
				velocity.x *= 0.22
		3:
			velocity.x = move_toward(velocity.x, 0.0, 760.0 * delta)
			if attack_timer <= 0.0:
				attack_state = 0

func apply_hit(damage: float, force: Vector2) -> void:
	hp -= damage
	hit_flash = 0.14
	var was_telling := attack_state == 1
	var committed := attack_state == 2
	if committed:
		velocity += force * (1.0 - KNOCKBACK_RESIST) * 0.35
		stun = 0.04
	else:
		velocity += force * (1.0 - KNOCKBACK_RESIST)
		stun = 0.15
	if was_telling:
		attack_state = 0
		attack_timer = 0.0
		attack_connected = false
	if hp <= 0.0:
		var main := get_parent()
		if main != null and main.has_method("enemy_defeated"):
			var count := randi_range(loot_min, maxi(loot_min, loot_max))
			main.enemy_defeated(global_position, loot_item_id, count)
		queue_free()

func _draw() -> void:
	var body := Color("9a7554") if hit_flash <= 0.0 else Color("e38a72")
	if attack_state == 1:
		body = body.lerp(Color("d59a54"), 0.55)
	elif attack_state == 2:
		body = body.lerp(Color("cf694e"), 0.48)
	_draw_body_ellipse(Vector2.ZERO, Vector2(22, 14), body)
	draw_circle(Vector2(17 * attack_dir, -2), 9.0, body.darkened(0.05))
	draw_line(Vector2(-11, -10), Vector2(-3, -20), Color("66503d"), 4.0)
	draw_line(Vector2(-2, -11), Vector2(5, -22), Color("66503d"), 4.0)
	if attack_state == 1:
		var p := 1.0 - attack_timer / CHARGE_TELL
		draw_arc(Vector2.ZERO, 27.0 + p * 7.0, -2.75, -0.38, 20, Color(1.0, 0.67, 0.28, 0.76), 2.5)
	elif attack_state == 3:
		draw_line(Vector2(-20 * attack_dir, 13), Vector2(-38 * attack_dir, 13), Color(0.72, 0.62, 0.48, 0.5), 3.0)

func _draw_body_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	draw_set_transform(center, 0.0, radii)
	draw_circle(Vector2.ZERO, 1.0, color)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
