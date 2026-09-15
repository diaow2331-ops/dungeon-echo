class_name SliceRouteHazard
extends Node2D

signal dialogue_requested(payload: Dictionary)

var authority: SliceWorldActorAuthority
var pair_key := ""

func setup(owner: SliceWorldActorAuthority, key: String) -> void:
	authority = owner
	pair_key = key
	queue_redraw()

func _draw() -> void:
	# Projection only: the authoritative hazard lifetime is the logistics route cooldown.
	draw_rect(Rect2(-30, -8, 60, 8), Color("493d32"))
	draw_line(Vector2(-24, -8), Vector2(20, -31), Color("765d42"), 6.0)
	draw_line(Vector2(-11, -8), Vector2(28, -22), Color("765d42"), 5.0)
	draw_circle(Vector2(-23, -5), 7.0, Color("2d2924"))
	draw_circle(Vector2(22, -5), 7.0, Color("2d2924"))
	draw_rect(Rect2(-37, -57, 74, 20), Color(0.06, 0.07, 0.07, 0.86))
	draw_string(ThemeDB.fallback_font, Vector2(-31, -42), "商路受阻", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("e9c59a"))

func _ready() -> void:
	var area := Area2D.new()
	area.collision_layer = 16
	area.collision_mask = 0
	var collider := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(80, 64)
	collider.shape = shape
	collider.position.y = -20
	area.add_child(collider)
	area.input_event.connect(_interact)
	add_child(area)

func _interact(viewport: Node, event: InputEvent, _shape: int) -> void:
	var pressed: bool = (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) or (event is InputEventScreenTouch and event.pressed)
	if not pressed or authority.player.global_position.distance_to(global_position) > 112:
		return
	viewport.set_input_as_handled()
	dialogue_requested.emit({"npc_kind": "route_hazard", "actor_id": pair_key, "display_name": "受阻商路", "role": "现场抢修", "dialogue": ["清理残骸、加固道路，让运输更早恢复。"]})
