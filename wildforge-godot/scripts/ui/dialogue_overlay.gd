class_name SliceDialogueOverlay
extends Control

const MobileLayoutScript = preload("res://scripts/ui/mobile_layout.gd")

signal closed

var speaker_label: Label
var role_label: Label
var body_label: Label
var next_button: Button
var dialogue_panel: PanelContainer
var lines: Array[String] = []
var line_index := 0

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	var shade := ColorRect.new()
	shade.color = Color(0.02, 0.04, 0.05, 0.46)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(shade)
	dialogue_panel = PanelContainer.new()
	dialogue_panel.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	add_child(dialogue_panel)
	var margin := MarginContainer.new()
	for side in ["margin_left", "margin_top", "margin_right", "margin_bottom"]:
		margin.add_theme_constant_override(side, 18)
	dialogue_panel.add_child(margin)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 7)
	margin.add_child(box)
	speaker_label = Label.new()
	speaker_label.add_theme_font_size_override("font_size", 22)
	box.add_child(speaker_label)
	role_label = Label.new()
	role_label.modulate = Color(0.72, 0.80, 0.76, 0.85)
	box.add_child(role_label)
	body_label = Label.new()
	body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body_label.add_theme_font_size_override("font_size", 17)
	box.add_child(body_label)
	next_button = Button.new()
	next_button.custom_minimum_size = Vector2(148, SliceMobileLayout.MIN_TOUCH_TARGET)
	next_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	next_button.pressed.connect(_advance)
	box.add_child(next_button)
	_apply_mobile_layout()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and is_instance_valid(dialogue_panel):
		_apply_mobile_layout()

func _apply_mobile_layout() -> void:
	if dialogue_panel == null:
		return
	var rect := SliceMobileLayout.content_rect(get_viewport_rect().size)
	var target_height := clampf(rect.size.y * 0.44, 230.0, 310.0)
	target_height = minf(target_height, rect.size.y)
	dialogue_panel.position = Vector2(rect.position.x, rect.end.y - target_height)
	dialogue_panel.size = Vector2(rect.size.x, target_height)

func open_dialogue(payload: Dictionary) -> void:
	speaker_label.text = String(payload.get("display_name", "旅人"))
	role_label.text = String(payload.get("role", ""))
	lines.clear()
	var raw_lines = payload.get("dialogue", [])
	if raw_lines is Array:
		for raw in raw_lines:
			var text := String(raw).strip_edges()
			if not text.is_empty():
				lines.append(text)
	if lines.is_empty():
		lines.append("……")
	line_index = 0
	visible = true
	_render_line()
	next_button.grab_focus()

func close_dialogue() -> void:
	if not visible:
		return
	visible = false
	closed.emit()

func _advance() -> void:
	if line_index + 1 >= lines.size():
		close_dialogue()
		return
	line_index += 1
	_render_line()

func _render_line() -> void:
	body_label.text = lines[line_index]
	next_button.text = "关闭" if line_index + 1 >= lines.size() else "继续"
