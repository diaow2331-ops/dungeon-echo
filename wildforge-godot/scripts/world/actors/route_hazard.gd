class_name SliceRouteHazard
extends Node2D

var authority: SliceWorldActorAuthority
var pair_key := ""
var observed := false

func setup(owner: SliceWorldActorAuthority, key: String) -> void:
	authority = owner
	pair_key = key
	queue_redraw()

func _process(_delta: float) -> void:
	if observed or authority == null or authority.player == null or authority.world == null or authority.world.progression_authority == null:
		return
	if authority.player.global_position.distance_to(global_position) > 180.0:
		return
	if authority.world.progression_authority.observe_route_hazard(pair_key):
		observed = true

func _draw() -> void:
	# Projection only: the authoritative hazard lifetime is the logistics route cooldown.
	draw_rect(Rect2(-30, -8, 60, 8), Color("493d32"))
	draw_line(Vector2(-24, -8), Vector2(20, -31), Color("765d42"), 6.0)
	draw_line(Vector2(-11, -8), Vector2(28, -22), Color("765d42"), 5.0)
	draw_circle(Vector2(-23, -5), 7.0, Color("2d2924"))
	draw_circle(Vector2(22, -5), 7.0, Color("2d2924"))
	draw_rect(Rect2(-37, -57, 74, 20), Color(0.06, 0.07, 0.07, 0.86))
	draw_string(ThemeDB.fallback_font, Vector2(-31, -42), "商路受阻", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("e9c59a"))
