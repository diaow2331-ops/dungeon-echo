class_name SliceDialogueOverlay
extends Control

const MobileLayoutScript = preload("res://scripts/ui/mobile_layout.gd")

const GOODS_LABELS := {"storage_box": "储物箱", "raw_meat": "鲜肉", "wood": "木材", "ice": "冰块", "snow": "积雪", "ash": "灰烬", "sandstone": "砂岩", "basalt": "玄武岩", "stone": "石块", "soil": "泥土", "plank": "木板", "coal": "煤炭", "copper_ore": "铜矿", "copper_bar": "铜锭", "ancient_core": "远古核心", "trail_ration": "旅行口粮", "wood_pick": "木镐", "stone_pick": "石镐", "stone_blade": "石刃", "copper_pick": "铜镐", "delver_pick": "遗迹镐"}

const TOWN_LABELS := {"verdant_mossbridge": "苔桥镇", "frost_frostmirror": "霜镜站", "ember_cinder_ridge": "烬脊营"}

signal beast_feed_requested
signal storage_route_requested(actor_id: String)
signal security_action_requested
signal market_route_requested
signal market_buy_requested(settlement_id: String, item_id: String, quantity: int)
signal market_quantity_selected(quantity: int)
signal market_item_selected(item_id: String)
signal closed
signal market_sell_requested(settlement_id: String, item_id: String, quantity: int)

var beast_feed_button: Button
var storage_route_picker: OptionButton
var security_button: Button
var speaker_label: Label
var role_label: Label
var body_label: Label
var next_button: Button
var dialogue_panel: PanelContainer
var market_box: VBoxContainer
var market_label: Label
var market_feedback: Label
var market_item_picker: OptionButton
var market_quantity_picker: OptionButton
var market_buy_button: Button
var market_route_button: Button
var market_route_label: Label
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
	dialogue_panel.minimum_size_changed.connect(_apply_mobile_layout)
	var margin := MarginContainer.new()
	for side in ["margin_left", "margin_top", "margin_right", "margin_bottom"]:
		margin.add_theme_constant_override(side, 18)
	dialogue_panel.add_child(margin)
	var layout := VBoxContainer.new()
	margin.add_child(layout)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(scroll)
	var box := VBoxContainer.new()
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_theme_constant_override("separation", 7)
	scroll.add_child(box)
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
	market_route_label = Label.new()
	market_route_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	market_route_label.add_theme_font_size_override("font_size", 15)
	market_route_label.modulate = Color("9cb6a5")
	var route_row := HBoxContainer.new()
	market_box.add_child(route_row)
	market_route_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	route_row.add_child(market_route_label)
	market_route_button = Button.new()
	market_route_button.custom_minimum_size = Vector2(156, SliceMobileLayout.MIN_TOUCH_TARGET)
	market_route_button.text = "标记目的地"
	market_route_button.pressed.connect(func(): market_route_requested.emit())
	route_row.add_child(market_route_button)
	market_feedback = Label.new()
	market_feedback.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	market_feedback.modulate = Color(0.88, 0.82, 0.58, 0.92)
	market_box.add_child(market_feedback)
	var trade_row := HBoxContainer.new()
	trade_row.add_theme_constant_override("separation", 12)
	market_box.add_child(trade_row)
	market_item_picker = OptionButton.new()
	market_item_picker.custom_minimum_size = Vector2(160, SliceMobileLayout.MIN_TOUCH_TARGET)
	market_item_picker.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	market_item_picker.get_popup().add_theme_constant_override("v_separation", 36)
	market_item_picker.item_selected.connect(_select_market_good)
	trade_row.add_child(market_item_picker)
	market_quantity_picker = OptionButton.new()
	market_quantity_picker.custom_minimum_size = Vector2(92, SliceMobileLayout.MIN_TOUCH_TARGET)
	market_quantity_picker.add_item("1 份", 1)
	market_quantity_picker.add_item("5 份", 5)
	market_quantity_picker.get_popup().add_theme_constant_override("v_separation", 36)
	market_quantity_picker.item_selected.connect(func(index: int): market_quantity_selected.emit(market_quantity_picker.get_item_id(index)))
	trade_row.add_child(market_quantity_picker)
	market_buy_button = Button.new()
	market_buy_button.custom_minimum_size = Vector2(200, SliceMobileLayout.MIN_TOUCH_TARGET)
	market_buy_button.pressed.connect(_buy_market_item)
	trade_row.add_child(market_buy_button)
	market_sell_button = Button.new()
	market_sell_button.custom_minimum_size = Vector2(220, SliceMobileLayout.MIN_TOUCH_TARGET)
	market_sell_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	market_sell_button.pressed.connect(_sell_market_item)
	trade_row.add_child(market_sell_button)
	security_button = Button.new()
	security_button.custom_minimum_size = Vector2(260, SliceMobileLayout.MIN_TOUCH_TARGET)
	security_button.visible = false
	security_button.pressed.connect(func(): security_action_requested.emit())
	box.add_child(security_button)
	beast_feed_button = Button.new()
	beast_feed_button.text = "喂食 · 1份旅行口粮"
	beast_feed_button.custom_minimum_size.y = SliceMobileLayout.MIN_TOUCH_TARGET
	beast_feed_button.pressed.connect(func(): beast_feed_requested.emit())
	box.add_child(beast_feed_button)
	storage_route_picker = OptionButton.new()
	storage_route_picker.custom_minimum_size = Vector2(240, SliceMobileLayout.MIN_TOUCH_TARGET)
	storage_route_picker.get_popup().add_theme_constant_override("v_separation", 36)
	storage_route_picker.item_selected.connect(func(index: int):
		if index > 0:
			storage_route_requested.emit(String(storage_route_picker.get_item_metadata(index))))
	box.add_child(storage_route_picker)
	next_button = Button.new()
	next_button.custom_minimum_size = Vector2(148, SliceMobileLayout.MIN_TOUCH_TARGET)
	next_button.size_flags_horizontal = Control.SIZE_SHRINK_END
	next_button.pressed.connect(_advance)
	layout.add_child(next_button)
	_apply_mobile_layout()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and is_instance_valid(dialogue_panel):
		_apply_mobile_layout()

func _apply_mobile_layout() -> void:
	if dialogue_panel == null:
		return
	var rect := SliceMobileLayout.content_rect(get_viewport_rect().size)
	var target_height := clampf(rect.size.y * 0.65, 250.0, 460.0)
	target_height = minf(maxf(target_height, dialogue_panel.get_combined_minimum_size().y), rect.size.y)
	dialogue_panel.position = Vector2(rect.position.x, rect.end.y - target_height)
	dialogue_panel.size = Vector2(rect.size.x, target_height)

func open_dialogue(payload: Dictionary) -> void:
	beast_feed_button.visible = bool(payload.get("beast_care", false))
	storage_route_picker.clear()
	storage_route_picker.add_item("返回货栈 · 选择目的地")
	for route in payload.get("storage_routes", []):
		var index := storage_route_picker.item_count
		storage_route_picker.add_item(String(route["label"]))
		storage_route_picker.set_item_metadata(index, String(route["id"]))
	storage_route_picker.visible = storage_route_picker.item_count > 1
	security_button.text = String(payload.get("security_action", ""))
	security_button.visible = not security_button.text.is_empty()
	security_button.disabled = false
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
	market_item_picker.disabled = false
	market_quantity_picker.disabled = false
	var item_id := String(active_market.get("item_id", ""))
	var item_label := "仓库钥匙" if item_id.begins_with("warehouse_key:") else String(GOODS_LABELS.get(item_id, "货物"))
	market_item_picker.clear()
	for good in active_market.get("goods", [item_id]):
		var index := market_item_picker.item_count
		market_item_picker.add_item("仓库钥匙" if String(good).begins_with("warehouse_key:") else String(GOODS_LABELS.get(String(good), "货物")))
		market_item_picker.set_item_metadata(index, String(good))
		if String(good) == item_id:
			market_item_picker.select(index)
	var quantity := maxi(1, int(active_market.get("quantity", 1)))
	market_quantity_picker.clear()
	for batch in ([1, 5, 20] if bool(active_market.get("personal_storage", false)) else [1, 5]):
		market_quantity_picker.add_item("%d 份" % int(batch), int(batch))
		if int(batch) == quantity:
			market_quantity_picker.select(market_quantity_picker.item_count - 1)
	var player_count := maxi(0, int(active_market.get("player_count", 0)))
	var stock := maxi(0, int(active_market.get("stock", 0)))
	var target := maxi(0, int(active_market.get("target", 0)))
	var unit_price := maxi(0, int(active_market.get("unit_price", 0)))
	var total := maxi(0, int(active_market.get("total", 0)))
	var treasury := maxi(0, int(active_market.get("treasury", 0)))
	market_label.text = "%s：你有 %d · %s · 收购 %d◆ · 城库 %d◆" % [item_label, player_count, "短缺（%d/%d）" % [stock, target] if stock < target else "库存充足", unit_price, treasury]
	var conflict_status := String(active_market.get("conflict_status", "peace"))
	if conflict_status != "peace":
		var conflict_label := String({"tense":"边境紧张", "war":"战争中", "raid":"正在遭袭", "occupied":"已被占领"}.get(conflict_status, "局势异常"))
		market_label.text += " · %s · 安全 %d/100" % [conflict_label, int(active_market.get("security", 100))]
	market_feedback.text = feedback
	var can_sell := bool(active_market.get("ok", false)) and bool(active_market.get("affordable", false)) and player_count >= quantity and total > 0 and bool(active_market.get("demand_met", true))
	market_sell_button.disabled = not can_sell
	market_sell_button.text = "出售 %d 份 · +%d◆" % [quantity, total] if can_sell else ("%s数量不足" % item_label if player_count < quantity else ("需求已满足" if not bool(active_market.get("demand_met", true)) else "城库暂不足"))
	var purchase: Dictionary = active_market.get("purchase", {})
	var cost := int(purchase.get("total", 0))
	var can_buy := bool(purchase.get("ok", false)) and bool(purchase.get("available", false)) and int(active_market.get("player_marks", 0)) >= cost and bool(active_market.get("can_carry", true))
	market_buy_button.disabled = not can_buy
	market_buy_button.text = "购入 %d 份 · %d◆" % [quantity, cost] if can_buy else ("现货不足/保留口粮" if not bool(purchase.get("available", false)) else ("负重已满" if not bool(active_market.get("can_carry", true)) else "需 %d◆" % cost))
	var warehouse := bool(active_market.get("warehouse", false))
	market_buy_button.visible = not warehouse
	if warehouse:
		market_label.text = "%s · 仓库剩余 %d · 携带 %d · 负重 %d/160" % [item_label, stock, player_count, int(active_market.get("weight", 0))]
		market_sell_button.disabled = bool(active_market.get("locked", true)) or stock < quantity or not bool(active_market.get("can_carry", false))
		market_sell_button.text = ("取回 %d 份" % quantity if bool(active_market.get("lost_cargo", false)) else "搬走 %d 份（犯罪）" % quantity) if not market_sell_button.disabled else ("先打开门锁" if bool(active_market.get("locked", true)) else "库存不足或背不动")
		if bool(active_market.get("personal_storage", false)):
			market_label.text += " · 箱内负重 %d/%d" % [int(active_market.get("storage_weight", 0)), int(active_market.get("capacity", 480))]
			market_buy_button.visible = true
			market_buy_button.disabled = not bool(active_market.get("can_deposit", false))
			market_buy_button.text = "存入 %d 份" % quantity if not market_buy_button.disabled else "箱满/物资不足/装备保留"
	elif bool(active_market.get("crisis", false)):
		market_label.text += " · 仓库遭劫，急需补给"
	if bool(active_market.get("beast", false)):
		var state: Dictionary = active_market.get("beast_state", {})
		var alive := float(state.get("health", 0)) > 0
		market_label.text = "驮兽载重 %d/320 · 生命 %d/180 · 体力 %d/100\n%s：驮兽携带 %d · 你有 %d" % [int(active_market.get("storage_weight", 0)), int(state.get("health", 0)), int(state.get("food", 0)), item_label, stock, player_count]
		beast_feed_button.visible = alive
		security_button.text = ("留在原地" if bool(state.get("following", false)) else "跟随我") if alive else "取空遗物后安葬"
		if not alive:
			market_feedback.text = "驮兽死亡，部分货物已损毁。剩余物资可取回。" + feedback
	var opportunity: Dictionary = {} if warehouse else active_market.get("opportunity", {})
	market_route_label.get_parent().visible = not opportunity.is_empty()
	if not opportunity.is_empty():
		var destination := String(TOWN_LABELS.get(String(opportunity.get("destination_id", "")), "远方集市"))
		var route_risk := String(opportunity.get("risk", "peace"))
		var risk_text := "" if route_risk == "peace" else (" · 风险：%s" % String({"tense":"边境紧张", "war":"交战区", "raid":"袭击中", "occupied":"占领区"}.get(route_risk, "局势异常")))
		market_route_label.text = "%s需要这批物资 · 向%s约 %d 格%s · 抵达后按当地需求收购" % [destination, "东" if bool(opportunity.get("east", false)) else "西", int(opportunity.get("distance_cells", 0)), risk_text]

func _buy_market_item() -> void:
	if not bool(active_market.get("enabled", false)) or market_buy_button.disabled:
		return
	market_buy_requested.emit(String(active_market.get("settlement_id", "")), String(active_market.get("item_id", "")), maxi(1, int(active_market.get("quantity", 1))))

func _sell_market_item() -> void:
	if not bool(active_market.get("enabled", false)) or market_sell_button.disabled:
		return
	market_sell_requested.emit(
		String(active_market.get("settlement_id", "")),
		String(active_market.get("item_id", "")),
		maxi(1, int(active_market.get("quantity", 1)))
	)

func _select_market_good(index: int) -> void:
	if index >= 0 and index < market_item_picker.item_count:
		market_item_selected.emit(String(market_item_picker.get_item_metadata(index)))
