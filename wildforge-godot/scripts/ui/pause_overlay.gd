class_name SlicePauseOverlay
extends Control

const MobileLayoutScript = preload("res://scripts/ui/mobile_layout.gd")

signal resume_requested
signal save_requested
signal quit_requested

var panel: PanelContainer
var status_label: Label
var resume_button: Button
var save_button: Button
var quit_button: Button

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_WHEN_PAUSED
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	var shade := ColorRect.new()
	shade.color = Color(0.015, 0.025, 0.03, 0.74)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(shade)
	panel = PanelContainer.new()
	add_child(panel)
	var margin := MarginContainer.new()
	for side in ["margin_left", "margin_top", "margin_right", "margin_bottom"]:
		margin.add_theme_constant_override(side, 22)
	panel.add_child(margin)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	margin.add_child(box)
	var title := Label.new()
	title.text = "Wildforge"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 28)
	box.add_child(title)
	var subtitle := Label.new()
	subtitle.text = "游戏已暂停"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.modulate = Color(0.72, 0.80, 0.76, 0.9)
	box.add_child(subtitle)
	status_label = Label.new()
	status_label.text = "当前进度会自动保存。"
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(status_label)
	resume_button = _button("继续游戏")
	resume_button.pressed.connect(func(): resume_requested.emit())
	box.add_child(resume_button)
	save_button = _button("保存进度")
	save_button.pressed.connect(func(): save_requested.emit())
	box.add_child(save_button)
	quit_button = _button("保存并退出")
	quit_button.pressed.connect(func(): quit_requested.emit())
	box.add_child(quit_button)
	_apply_layout()

func _button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(300, SliceMobileLayout.MIN_TOUCH_TARGET)
	return button

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and panel != null:
		_apply_layout()

func _apply_layout() -> void:
	if panel == null:
		return
	var rect := SliceMobileLayout.content_rect(get_viewport_rect().size)
	var width := minf(520.0, rect.size.x)
	var height := minf(390.0, rect.size.y)
	panel.position = rect.position + (rect.size - Vector2(width, height)) * 0.5
	panel.size = Vector2(width, height)
func open(message := "") -> void:
	status_label.text = message if not message.is_empty() else "当前进度会自动保存。"
	visible = true
	resume_button.grab_focus()

func close() -> void:
	visible = false

func show_save_result(ok: bool) -> void:
	status_label.text = "进度已保存。" if ok else "保存失败，请继续游戏后重试。"
func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		resume_requested.emit()
		get_viewport().set_input_as_handled()
