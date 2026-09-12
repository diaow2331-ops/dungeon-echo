extends CharacterBody2D
class_name SliceItemPickup

const GRAVITY := 980.0
const MAGNET_RANGE := 138.0
const COLLECT_RANGE := 24.0
const MAGNET_SPEED := 310.0

var item_id := "soil"
var count := 1
var player: SlicePlayer
var age := 0.0
var collected := false

func _ready() -> void:
	collision_layer = 8
	collision_mask = 1
	add_to_group("pickups")
	var shape := CircleShape2D.new()
	shape.radius = 5.0
	var collider := CollisionShape2D.new()
	collider.shape = shape
	add_child(collider)
	queue_redraw()

func setup(id: String, amount: int, collector: SlicePlayer, impulse := Vector2.ZERO) -> void:
	item_id = id
	count = maxi(1, amount)
	player = collector
	velocity = impulse
	queue_redraw()

func _physics_process(delta: float) -> void:
	age += delta
	if player != null and is_instance_valid(player) and age > 0.12:
		var to_player := player.global_position - global_position
		var distance := to_player.length()
		if distance <= COLLECT_RANGE:
			collect_now()
			return
		if distance <= MAGNET_RANGE and distance > 0.01:
			var target_velocity := to_player.normalized() * MAGNET_SPEED
			velocity = velocity.lerp(target_velocity, clampf(delta * 9.0, 0.0, 1.0))
		else:
			velocity.y = minf(620.0, velocity.y + GRAVITY * delta)
	else:
		velocity.y = minf(620.0, velocity.y + GRAVITY * delta)
	move_and_slide()
	queue_redraw()

func collect_now() -> void:
	if collected or player == null or not is_instance_valid(player):
		return
	collected = true
	player.add_item(item_id, count)
	if player.world != null:
		player.world.feedback_burst(global_position, _material_color(), 4, 58.0)
	queue_free()

func _material_color() -> Color:
	match item_id:
		"stone": return Color("9aa4aa")
		"wood": return Color("9a6b45")
		"plank": return Color("c18a55")
		"workbench": return Color("d1aa6f")
		"coal": return Color("30363a")
		"copper_ore": return Color("b86d50")
		"ancient_core": return Color("e1c36f")
		"campfire": return Color("e69a55")
		"raw_meat": return Color("c96862")
		"trail_ration": return Color("d8a45d")
		"stone_pick": return Color("aeb8bd")
		"stone_blade": return Color("c7d0d3")
		_: return Color("a97c58")

func _draw() -> void:
	var bob := sin(age * 8.0) * 1.5
	var c := _material_color()
	draw_rect(Rect2(-5, -5 + bob, 10, 10), c)
	draw_rect(Rect2(-3, -3 + bob, 6, 2), c.lightened(0.24))
