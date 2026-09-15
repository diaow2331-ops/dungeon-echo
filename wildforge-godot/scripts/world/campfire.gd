extends Node2D
class_name SliceCampfire

var cell := Vector2i.ZERO
var t := 0.0

func _ready() -> void:
	add_to_group("campfires")
	var area := Area2D.new()
	area.collision_layer = 16
	area.collision_mask = 0
	var shape := RectangleShape2D.new()
	shape.size = Vector2(56, 56)
	var collider := CollisionShape2D.new()
	collider.shape = shape
	area.add_child(collider)
	area.input_event.connect(_open_crafting)
	add_child(area)
	queue_redraw()

func _process(delta: float) -> void:
	t += delta
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(-13, 7, 26, 6), Color("6d4a35"))
	draw_line(Vector2(-10, 10), Vector2(10, 4), Color("7e563b"), 5.0)
	draw_line(Vector2(-10, 4), Vector2(10, 10), Color("7e563b"), 5.0)
	var flicker := 2.0 + sin(t * 11.0) * 1.4
	draw_circle(Vector2(0, -3), 10.0 + flicker, Color(0.95, 0.43, 0.18, 0.62))
	draw_circle(Vector2(0, -5), 6.0 + flicker * 0.45, Color(1.0, 0.77, 0.30, 0.92))

func _open_crafting(viewport: Node, event: InputEvent, _shape: int) -> void:
	var pressed: bool = (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) or (event is InputEventScreenTouch and event.pressed)
	var main := get_tree().current_scene
	if main == null or not main.has_method("_open_dialogue"):
		main = get_parent().get_parent()
	if not pressed or main == null or main.get("player") == null:
		return
	var player: SlicePlayer = main.get("player")
	if player.global_position.distance_to(global_position) > 118.0:
		return
	viewport.set_input_as_handled()
	main._open_dialogue({"npc_kind": "campfire", "display_name": "营火", "role": "烹饪与冶炼", "dialogue": ["准备旅行口粮或冶炼矿石。"]})
