extends Node2D
class_name SliceRelicCache

const CORE_REWARD := 1
const COAL_REWARD := 2
const COPPER_REWARD := 3

var world: SliceWorld
var player: SlicePlayer
var guard: Node2D
var world_actor_id := ""
var guard_actor_id := ""
var world_actor_authority: RefCounted
var opened := false
var denied_flash := 0.0

func _ready() -> void:
	add_to_group("harvestables")
	add_to_group("relic_caches")
	queue_redraw()

func _process(delta: float) -> void:
	denied_flash = maxf(0.0, denied_flash - delta)
	queue_redraw()

func guard_alive() -> bool:
	if not guard_actor_id.is_empty() and world_actor_authority != null and world_actor_authority.has_method("is_present"):
		return bool(world_actor_authority.is_present(guard_actor_id))
	return guard != null and is_instance_valid(guard) and not guard.is_queued_for_deletion()

func apply_hit(_damage: float, _force := Vector2.ZERO) -> void:
	if opened:
		return
	if guard_alive():
		denied_flash = 0.18
		if world != null:
			world.feedback_burst(global_position, Color("b46f72"), 4, 54.0)
		return
	opened = true
	if not world_actor_id.is_empty() and world_actor_authority != null and world_actor_authority.has_method("mark_removed"):
		world_actor_authority.mark_removed(world_actor_id)
	if world != null and player != null:
		world.feedback_burst(global_position, Color("d7b76d"), 12, 118.0)
		world.spawn_item_pickup(global_position + Vector2(-12, -8), "ancient_core", player, CORE_REWARD)
		world.spawn_item_pickup(global_position + Vector2(0, -10), "coal", player, COAL_REWARD)
		world.spawn_item_pickup(global_position + Vector2(12, -8), "copper_ore", player, COPPER_REWARD)
	queue_free()

func _draw() -> void:
	var c := Color("ad8a55") if denied_flash <= 0.0 else Color("d47d72")
	draw_rect(Rect2(-15, -13, 30, 22), Color("514337"))
	draw_rect(Rect2(-13, -11, 26, 18), c)
	draw_rect(Rect2(-3, -9, 6, 16), Color("dac27b"))
	draw_line(Vector2(-13, -2), Vector2(13, -2), Color("6d583f"), 2.0)
