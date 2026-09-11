extends Node2D
class_name SliceTreeResource

var world: SliceWorld
var player: SlicePlayer
var hp := 3
var felled := false

func _ready() -> void:
	add_to_group("harvestables")
	queue_redraw()

func apply_hit(_damage: float, _force := Vector2.ZERO) -> void:
	if felled:
		return
	hp -= 1
	if world != null:
		world.feedback_burst(global_position + Vector2(0, -18), Color("b98757"), 5, 82.0)
	if hp <= 0:
		felled = true
		if world != null and player != null:
			world.spawn_item_pickup(global_position + Vector2(0, -18), "wood", player, 2)
		queue_free()
	else:
		queue_redraw()

func _draw() -> void:
	var lean := float(3 - hp) * 0.035
	draw_set_transform(Vector2.ZERO, lean, Vector2.ONE)
	draw_rect(Rect2(-6, -54, 12, 58), Color("805a3c"))
	draw_rect(Rect2(-3, -50, 4, 45), Color("a4774d"))
	draw_circle(Vector2(-10, -58), 18.0, Color("547b4d"))
	draw_circle(Vector2(9, -61), 21.0, Color("5f8754"))
	draw_circle(Vector2(0, -76), 17.0, Color("668f58"))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
