extends CharacterBody2D
class_name SliceCrawler

const GRAVITY := 1450.0
var player: SlicePlayer
var hp := 52.0
var hop_cd := 0.0
var contact_cd := 0.0
var hit_flash := 0.0

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
	velocity.y = minf(820.0, velocity.y + GRAVITY * delta)
	var dx := player.global_position.x - global_position.x
	if absf(dx) < 520.0:
		velocity.x = move_toward(velocity.x, signf(dx) * 92.0, 450.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 360.0 * delta)
	if is_on_floor() and hop_cd <= 0.0 and absf(dx) < 320.0:
		velocity.y = -285.0
		hop_cd = randf_range(0.75, 1.25)
	move_and_slide()
	if global_position.distance_to(player.global_position) < 31.0 and contact_cd <= 0.0:
		contact_cd = 0.65
		var push := (player.global_position - global_position).normalized() * 185.0 + Vector2.UP * 115.0
		player.take_damage(9.0, push)
	queue_redraw()

func apply_hit(damage: float, force: Vector2) -> void:
	hp -= damage
	velocity += force
	hit_flash = 0.12
	if hp <= 0.0:
		queue_free()

func _draw() -> void:
	var c := Color("d36f58") if hit_flash > 0.0 else Color("6fa36a")
	draw_circle(Vector2(0, 3), 15.0, c)
	draw_rect(Rect2(-13, 1, 26, 12), c)
	draw_circle(Vector2(-5, -2), 2.0, Color("e9efe6"))
	draw_circle(Vector2(5, -2), 2.0, Color("e9efe6"))
	draw_circle(Vector2(-5, -2), 0.8, Color("1c2927"))
	draw_circle(Vector2(5, -2), 0.8, Color("1c2927"))
