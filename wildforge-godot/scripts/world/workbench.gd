extends Node2D
class_name SliceWorkbench

var cell := Vector2i.ZERO

func _ready() -> void:
	add_to_group("workbenches")
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

func _draw() -> void:
	draw_rect(Rect2(-20, -12, 40, 12), Color("9d7048"))
	draw_rect(Rect2(-17, 0, 6, 20), Color("735036"))
	draw_rect(Rect2(11, 0, 6, 20), Color("735036"))
	draw_rect(Rect2(-13, -20, 26, 8), Color("c39a61"))

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
	main._open_dialogue({"npc_kind": "workbench", "display_name": "工作台", "role": "营地建设", "dialogue": ["储物箱：8块木板 + 2块石头。制作后瞄准空地，使用中央互动键放置。"]})
