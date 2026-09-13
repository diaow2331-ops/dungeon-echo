class_name SliceDialogueOverlay
extends Control

const MobileLayoutScript = preload("res://scripts/ui/mobile_layout.gd")

signal closed
signal market_sell_requested(settlement_id: String, item_id: String, quantity: int)

var speaker_label: Label
var role_label: Label
var body_label: Label
var next_button: Button
var dialogue_panel: PanelContainer
var market_box: VBoxContainer
var market_label: Label
var market_feedback: Label
var market_sell_button: Button
var active_market: Dictionary = {}
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
	market_box = VBoxContainer.new()
	market_box.add_theme_constant_override("separation", 5)
	market_box.visible = false
	box.add_child(market_box)
	market_label = Label.new()
	market_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	market_label.add_theme_font_size_override("font_size", 16)
	market_box.add_child(market_label)
	market_feedback = Label.new()
	market_feedback.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	market_feedback.modulate = Color(0.88, 0.82, 0.58, 0.92)
	market_box.add_child(market_feedback)
	market_sell_button = Button.new()
	market_sell_button.custom_minimum_size = Vector2(220, SliceMobileLayout.MIN_TOUCH_TARGET)
	market_sell_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	market_sell_button.pressed.connect(_sell_market_item)
	market_box.add_child(market_sell_button)
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
	update_market(payload.get("market", {}) if payload.get("market", {}) is Dictionary else {})
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
func update_market(market: Dictionary, feedback := "") -> void:
	active_market = market.duplicate(true)
	if market_box == null:
		return
	var enabled := bool(active_market.get("enabled", false))
	market_box.visible = enabled
	if not enabled:
		return
	var player_count := maxi(0, int(active_market.get("player_count", 0)))
	var stock := maxi(0, int(active_market.get("stock", 0)))
	var target := maxi(0, int(active_market.get("target", 0)))
	var unit_price := maxi(0, int(active_market.get("unit_price", 0)))
	var total := maxi(0, int(active_market.get("total", 0)))
	var treasury := maxi(0, int(active_market.get("treasury", 0)))
	market_label.text = "鲜肉：你有 %d · 仓库 %d/%d · 当前收购 %d◆ · 城库 %d◆" % [player_count, stock, target, unit_price, treasury]
	market_feedback.text = feedback
	var can_sell := bool(active_market.get("ok", false)) and bool(active_market.get("affordable", false)) and player_count > 0 and total > 0
	market_sell_button.disabled = not can_sell
	market_sell_button.text = "出售 1 份鲜肉 · +%d◆" % total if can_sell else ("暂无鲜肉可售" if player_count <= 0 else "城库暂不足")

func _sell_market_item() -> void:
	if not bool(active_market.get("enabled", false)) or market_sell_button.disabled:
		return
	market_sell_requested.emit(
		String(active_market.get("settlement_id", "")),
		String(active_market.get("item_id", "")),
		maxi(1, int(active_market.get("quantity", 1)))
	)
