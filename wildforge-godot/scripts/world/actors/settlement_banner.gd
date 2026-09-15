class_name SliceSettlementBanner
extends Node2D

var world: SliceWorld
var settlement_id := ""
var cached_status := ""
var cached_controller := ""

func setup(owner_world: SliceWorld, id: String) -> void:
	world = owner_world
	settlement_id = id
	_refresh_state(true)

func _process(_delta: float) -> void:
	_refresh_state(false)

func current_status() -> String:
	if world == null or world.faction_authority == null:
		return "peace"
	return world.faction_authority.conflict_status(settlement_id)

func current_controller() -> String:
	if world == null or world.faction_authority == null:
		return ""
	return world.faction_authority.controller_for_settlement(settlement_id)

func _refresh_state(force: bool) -> void:
	var status := current_status()
	var controller := current_controller()
	if force or status != cached_status or controller != cached_controller:
		cached_status = status
		cached_controller = controller
		queue_redraw()

func _controller_color(controller: String) -> Color:
	match controller:
		"verdant": return Color("5f9468")
		"frost": return Color("7fa9c7")
		"ember": return Color("b86c4e")
		_: return Color("858585")

func _status_label(status: String) -> String:
	return String({"peace":"安", "tense":"警", "war":"战", "raid":"袭", "occupied":"占"}.get(status, "?"))

func _draw() -> void:
	var status := current_status()
	var controller := current_controller()
	var flag_color := _controller_color(controller)
	if status == "tense":
		flag_color = flag_color.lerp(Color("d6aa5f"), 0.35)
	elif status in ["war", "raid"]:
		flag_color = flag_color.lerp(Color("c94f45"), 0.48 if status == "war" else 0.68)
	elif status == "occupied":
		flag_color = flag_color.darkened(0.14)
	draw_line(Vector2(0, 4), Vector2(0, -62), Color("5c5143"), 4.0)
	draw_rect(Rect2(2, -60, 38, 24), flag_color)
	draw_rect(Rect2(2, -60, 38, 24), Color(0.1, 0.1, 0.1, 0.35), false, 2.0)
	draw_string(ThemeDB.fallback_font, Vector2(13, -42), _status_label(status), HORIZONTAL_ALIGNMENT_LEFT, -1, 17, Color("f3ead7"))
	if status == "raid":
		draw_arc(Vector2(21, -48), 23.0, -PI, 0.0, 12, Color("e96a57"), 2.0)
