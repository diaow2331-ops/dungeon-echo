extends Node2D
class_name SliceCampfire

var cell := Vector2i.ZERO
var t := 0.0

func _ready() -> void:
	add_to_group("campfires")
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
