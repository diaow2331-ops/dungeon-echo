extends Control
class_name SliceInventoryOverlay

signal open_requested
signal close_requested

const MobileLayoutScript = preload("res://scripts/ui/mobile_layout.gd")
const CraftingScript = preload("res://scripts/crafting/slice_crafting.gd")
const SLOT_COUNT := 6
const ITEM_NAMES := {
	"soil":"土块", "stone":"石块", "ash":"灰烬", "sandstone":"砂岩", "basalt":"玄武岩",
	"snow":"积雪", "ice":"冰块", "wood":"木材", "plank":"木板", "workbench":"工作台",
	"campfire":"营火", "storage_box":"储物箱", "raw_meat":"鲜肉", "trail_ration":"旅行口粮",
	"coal":"煤", "copper_ore":"铜矿", "copper_bar":"铜锭", "ancient_core":"远古核心",
	"wood_pick":"木镐", "stone_pick":"石镐", "copper_pick":"铜镐", "delver_pick":"遗迹镐",
	"stone_blade":"石刃"
}

var player: SlicePlayer
var open_button: Button
var panel: PanelContainer
var hotbar: HBoxContainer
var hotbar_buttons: Array[Button] = []
var hotbar_items: Array[String] = ["soil", "stone", "raw_meat", "trail_ration", "workbench", "campfire"]
var selected_slot := 0
var equipment_label: Label
var inventory_grid: GridContainer
var crafting_list: VBoxContainer
var detail_label: Label
var _last_signature := ""

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	open_button = Button.new()
	open_button.text = "背包"
	open_button.custom_minimum_size = Vector2(76, SliceMobileLayout.MIN_TOUCH_TARGET)
	open_button.mouse_filter = Control.MOUSE_FILTER_STOP
	open_button.pressed.connect(func(): open_requested.emit())
	add_child(open_button)
	_build_hotbar()
	_build_panel()
	_apply_safe_layout()
	queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and open_button != null:
		_apply_safe_layout()

func _build_hotbar() -> void:
	hotbar = HBoxContainer.new()
	hotbar.add_theme_constant_override("separation", 6)
	hotbar.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(hotbar)
	for i in range(SLOT_COUNT):
		var button := Button.new()
		button.custom_minimum_size = Vector2(68, SliceMobileLayout.MIN_TOUCH_TARGET)
		button.pressed.connect(_select_hotbar_slot.bind(i))
		hotbar.add_child(button)
		hotbar_buttons.append(button)

func _build_panel() -> void:
	panel = PanelContainer.new()
	panel.visible = false
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(panel)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 10)
	panel.add_child(root)
	var header := HBoxContainer.new()
	root.add_child(header)
	var title := Label.new()
	title.text = "背包 · 制造"
	title.add_theme_font_size_override("font_size", 22)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)
	var close_button := Button.new()
	close_button.text = "关闭"
	close_button.custom_minimum_size = Vector2(86, SliceMobileLayout.MIN_TOUCH_TARGET)
	close_button.pressed.connect(func(): close_requested.emit())
	header.add_child(close_button)
	equipment_label = Label.new()
	equipment_label.add_theme_font_size_override("font_size", 16)
	root.add_child(equipment_label)
	var columns := HBoxContainer.new()
	columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_theme_constant_override("separation", 14)
	root.add_child(columns)
	var inventory_scroll := ScrollContainer.new()
	inventory_scroll.custom_minimum_size = Vector2(420, 290)
	inventory_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	inventory_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_child(inventory_scroll)
	inventory_grid = GridContainer.new()
	inventory_grid.columns = 3
	inventory_grid.add_theme_constant_override("h_separation", 6)
	inventory_grid.add_theme_constant_override("v_separation", 6)
	inventory_scroll.add_child(inventory_grid)
	var craft_scroll := ScrollContainer.new()
	craft_scroll.custom_minimum_size = Vector2(330, 290)
	craft_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	craft_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_child(craft_scroll)
	crafting_list = VBoxContainer.new()
	crafting_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	craft_scroll.add_child(crafting_list)
	detail_label = Label.new()
	detail_label.text = "点背包物品可放入当前快捷格；工具会直接装备。"
	detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	root.add_child(detail_label)
func _apply_safe_layout() -> void:
	var rect := SliceMobileLayout.content_rect(get_viewport_rect().size)
	open_button.position = Vector2(rect.end.x - open_button.custom_minimum_size.x, rect.position.y)
	open_button.size = open_button.custom_minimum_size
	var hotbar_width := float(SLOT_COUNT * 68 + (SLOT_COUNT - 1) * 6)
	hotbar.position = Vector2(rect.position.x + (rect.size.x - hotbar_width) * 0.5, rect.end.y - 126.0)
	hotbar.size = Vector2(hotbar_width, SliceMobileLayout.MIN_TOUCH_TARGET)
	var panel_size := Vector2(minf(900.0, rect.size.x - 44.0), minf(530.0, rect.size.y - 64.0))
	panel.position = rect.position + (rect.size - panel_size) * 0.5
	panel.size = panel_size

func open_for(active_player: SlicePlayer) -> void:
	player = active_player
	panel.visible = true
	open_button.visible = false
	_last_signature = ""
	refresh_now()

func close() -> void:
	panel.visible = false
	open_button.visible = true

func is_open() -> bool:
	return panel != null and panel.visible

func _process(_delta: float) -> void:
	if player == null or not is_instance_valid(player):
		return
	var signature := _state_signature()
	if signature != _last_signature:
		refresh_now()
func _state_signature() -> String:
	var parts: Array[String] = []
	var keys: Array = player.stock.keys()
	keys.sort()
	for raw_id in keys:
		var item_id := String(raw_id)
		parts.append("%s:%d" % [item_id, player.item_count(item_id)])
	parts.append("pick=" + player.equipped_pick_id)
	parts.append("weapon=" + player.equipped_weapon_id)
	parts.append("quick=" + player.selected_quick_item_id)
	parts.append("bar=" + ",".join(hotbar_items))
	return "|".join(parts)

func refresh_now() -> void:
	if player == null or not is_instance_valid(player):
		return
	_refresh_hotbar()
	_refresh_equipment()
	if panel.visible:
		_refresh_inventory()
		_refresh_crafting()
	_last_signature = _state_signature()

func _refresh_hotbar() -> void:
	for i in range(hotbar_buttons.size()):
		var item_id := hotbar_items[i]
		var count := player.item_count(item_id)
		var prefix := "▶ " if i == selected_slot else ""
		hotbar_buttons[i].text = "%s%s\n%d" % [prefix, _item_name(item_id), count]
		hotbar_buttons[i].tooltip_text = _item_detail(item_id)
func _refresh_equipment() -> void:
	equipment_label.text = "装备 · 武器 %s · 镐 %s · 斧 旅行斧" % [
		_item_name(player.equipped_weapon_id),
		_item_name(player.equipped_pick_id) if not player.equipped_pick_id.is_empty() else "无"
	]

func _refresh_inventory() -> void:
	_clear_children(inventory_grid)
	var keys: Array = player.stock.keys()
	keys.sort()
	for raw_id in keys:
		var item_id := String(raw_id)
		var count := player.item_count(item_id)
		if count <= 0:
			continue
		var button := Button.new()
		button.custom_minimum_size = Vector2(128, SliceMobileLayout.MIN_TOUCH_TARGET)
		button.text = "%s ×%d" % [_item_name(item_id), count]
		button.tooltip_text = _item_detail(item_id)
		button.pressed.connect(_inventory_item_pressed.bind(item_id))
		inventory_grid.add_child(button)
	if inventory_grid.get_child_count() == 0:
		var empty := Label.new()
		empty.text = "背包为空"
		inventory_grid.add_child(empty)

func _refresh_crafting() -> void:
	_clear_children(crafting_list)
	var recipe_ids: Array = SliceCrafting.RECIPES.keys()
	recipe_ids.sort()
	for raw_id in recipe_ids:
		var recipe_id := String(raw_id)
		var recipe: Dictionary = SliceCrafting.RECIPES[recipe_id]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 6)
		var label := Label.new()
		label.text = _recipe_text(recipe_id, recipe)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(label)
		var button := Button.new()
		button.text = "制造"
		button.custom_minimum_size = Vector2(78, SliceMobileLayout.MIN_TOUCH_TARGET)
		button.disabled = not player.can_craft(recipe_id)
		button.pressed.connect(_craft_recipe.bind(recipe_id))
		row.add_child(button)
		crafting_list.add_child(row)

func _select_hotbar_slot(index: int) -> void:
	if index < 0 or index >= hotbar_items.size() or player == null:
		return
	selected_slot = index
	var item_id := hotbar_items[index]
	player.select_quick_item(item_id)
	detail_label.text = _item_detail(item_id)
	refresh_now()

func _inventory_item_pressed(item_id: String) -> void:
	if player == null or player.item_count(item_id) <= 0:
		return
	hotbar_items[selected_slot] = item_id
	player.select_quick_item(item_id)
	player.equip_item(item_id)
	detail_label.text = _item_detail(item_id)
	refresh_now()
func _craft_recipe(recipe_id: String) -> void:
	if player == null:
		return
	if player.craft(recipe_id):
		detail_label.text = "已制造：" + _item_name(String(SliceCrafting.RECIPES[recipe_id]["out_id"]))
	else:
		detail_label.text = "材料不足，或需要靠近对应制作设施。"
	refresh_now()

func _recipe_text(recipe_id: String, recipe: Dictionary) -> String:
	var needs: Array[String] = []
	var need: Dictionary = recipe.get("need", {})
	var keys: Array = need.keys()
	keys.sort()
	for raw_id in keys:
		var item_id := String(raw_id)
		needs.append("%s×%d" % [_item_name(item_id), int(need[item_id])])
	var station := String(recipe.get("station", ""))
	var station_text := " · %s" % ({"workbench":"工作台", "campfire":"营火"}.get(station, station)) if not station.is_empty() else ""
	return "%s ← %s%s" % [_item_name(String(recipe.get("out_id", recipe_id))), " + ".join(needs), station_text]

func _item_detail(item_id: String) -> String:
	var descriptions := {
		"raw_meat":"应急食物；可直接吃，也可在营火制成旅行口粮。",
		"trail_ration":"高效旅行补给。选中后按中央互动键食用。",
		"wood_pick":"基础采矿工具。", "stone_pick":"更快的采矿工具。", "copper_pick":"可处理更坚硬的矿层。",
		"delver_pick":"遗迹级采矿工具。", "stone_blade":"强化近战武器。",
		"workbench":"放置后解锁工具与装备制造。", "campfire":"提供烹饪与安全休整。", "storage_box":"可放置的个人储物箱。"
	}
	return String(descriptions.get(item_id, _item_name(item_id)))

func _item_name(item_id: String) -> String:
	if item_id == "starter_blade":
		return "旅者短刃"
	return String(ITEM_NAMES.get(item_id, item_id))

func _clear_children(node: Node) -> void:
	for child in node.get_children():
		child.free()
