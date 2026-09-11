extends Node2D
class_name SliceWorkbench

var cell := Vector2i.ZERO

func _ready() -> void:
	add_to_group("workbenches")
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(-20, -12, 40, 12), Color("9d7048"))
	draw_rect(Rect2(-17, 0, 6, 20), Color("735036"))
	draw_rect(Rect2(11, 0, 6, 20), Color("735036"))
	draw_rect(Rect2(-13, -20, 26, 8), Color("c39a61"))
