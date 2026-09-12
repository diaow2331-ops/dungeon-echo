extends Node2D
class_name SliceTreeResource

var world: SliceWorld
var player: SlicePlayer
var species_id := "wild_tree"
var hp := 3
var felled := false
var drop_item_id := "wood"
var drop_count := 2
var world_actor_id := ""
var world_actor_authority: RefCounted

func _ready() -> void:
	add_to_group("harvestables")
	add_to_group("resource_trees")
	queue_redraw()

func apply_hit(_damage: float, _force := Vector2.ZERO) -> void:
	if felled:
		return
	hp -= 1
	if world != null:
		world.feedback_burst(global_position + Vector2(0, -18), Color("b98757"), 5, 82.0)
	if hp <= 0:
		felled = true
		if not world_actor_id.is_empty() and world_actor_authority != null and world_actor_authority.has_method("mark_removed"):
			world_actor_authority.mark_removed(world_actor_id)
		if world != null and player != null and not drop_item_id.is_empty() and drop_count > 0:
			world.spawn_item_pickup(global_position + Vector2(0, -18), drop_item_id, player, drop_count)
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
