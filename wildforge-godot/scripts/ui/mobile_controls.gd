extends Control
class_name SliceTouchControls

var player: SlicePlayer
var move_id := -1
var aim_id := -1
var move_origin := Vector2.ZERO
var aim_origin := Vector2.ZERO
var move_pos := Vector2.ZERO
var aim_pos := Vector2.ZERO
var touch_capable := false
var status_label: Label
var hint_label: Label
const STICK_RADIUS := 58.0
const PLACE_RADIUS := 26.0

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	touch_capable = DisplayServer.is_touchscreen_available()
	status_label = Label.new()
	status_label.position = Vector2(14, 10)
	status_label.add_theme_font_size_override("font_size", 15)
	status_label.modulate = Color(0.92, 0.96, 0.94, 0.88)
	add_child(status_label)
	hint_label = Label.new()
	hint_label.text = "A/D 移动 · Space 跳跃 · 左键采/战 · 右键放置"
	hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_label.set_anchors_preset(Control.PRESET_TOP_WIDE)
	hint_label.position = Vector2(0, 10)
	hint_label.add_theme_font_size_override("font_size", 13)
	hint_label.modulate = Color(0.88, 0.91, 0.88, 0.58)
	add_child(hint_label)
	queue_redraw()

func _process(_delta: float) -> void:
	if player != null and is_instance_valid(player):
		status_label.text = "HP %d/%d   ·   GODOT SLICE" % [int(ceil(player.health)), int(player.max_health)]
	queue_redraw()

func _input(event: InputEvent) -> void:
	if not event is InputEventScreenTouch and not event is InputEventScreenDrag:
		return
	var size := get_viewport_rect().size
	var place_center := Vector2(size.x * 0.5, size.y - 44.0)
	if event is InputEventScreenTouch:
		var t := event as InputEventScreenTouch
		if t.pressed:
			if t.position.distance_to(place_center) <= PLACE_RADIUS * 1.35:
				if player != null:
					player.place_once()
				return
			if t.position.y < size.y * 0.34:
				return
			if t.position.x < size.x * 0.44 and move_id < 0:
				move_id = t.index
				move_origin = t.position
				move_pos = t.position
				_apply_move()
			elif t.position.x > size.x * 0.56 and aim_id < 0:
				aim_id = t.index
				aim_origin = t.position
				aim_pos = t.position
				_apply_aim()
		else:
			if t.index == move_id:
				move_id = -1
				if player != null:
					player.set_touch_move(Vector2.ZERO)
			if t.index == aim_id:
				aim_id = -1
				if player != null:
					player.set_touch_aim(Vector2.ZERO, false)
		queue_redraw()
	elif event is InputEventScreenDrag:
		var d := event as InputEventScreenDrag
		if d.index == move_id:
			move_pos = d.position
			_apply_move()
		elif d.index == aim_id:
			aim_pos = d.position
			_apply_aim()
		queue_redraw()

func _apply_move() -> void:
	if player == null:
		return
	var delta := move_pos - move_origin
	player.set_touch_move(delta.limit_length(STICK_RADIUS) / STICK_RADIUS)

func _apply_aim() -> void:
	if player == null:
		return
	var delta := aim_pos - aim_origin
	if delta.length() < 7.0:
		delta = Vector2.RIGHT
	player.set_touch_aim(delta.normalized(), true)

func _draw() -> void:
	if not touch_capable:
		return
	var size := get_viewport_rect().size
	var place_center := Vector2(size.x * 0.5, size.y - 44.0)
	draw_circle(place_center, PLACE_RADIUS, Color(0.08, 0.14, 0.15, 0.36))
	draw_arc(place_center, PLACE_RADIUS, 0.0, TAU, 32, Color(0.68, 0.75, 0.66, 0.42), 2.0)
	draw_string(ThemeDB.fallback_font, place_center + Vector2(-8, 5), "置", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.9, 0.93, 0.82, 0.72))
	if move_id >= 0:
		_draw_stick(move_origin, move_pos, Color(0.66, 0.80, 0.75, 0.5))
	if aim_id >= 0:
		_draw_stick(aim_origin, aim_pos, Color(0.90, 0.65, 0.48, 0.52))

func _draw_stick(origin: Vector2, pos: Vector2, tint: Color) -> void:
	var knob := origin + (pos - origin).limit_length(STICK_RADIUS)
	draw_circle(origin, STICK_RADIUS, Color(0.03, 0.07, 0.08, 0.22))
	draw_arc(origin, STICK_RADIUS, 0.0, TAU, 40, tint, 2.0)
	draw_circle(knob, 21.0, Color(tint.r, tint.g, tint.b, 0.38))
