extends Control
class_name SliceTouchControls

const MobileLayoutScript = preload("res://scripts/ui/mobile_layout.gd")

const TOWN_LABELS := {"verdant_mossbridge": "苔桥镇", "frost_frostmirror": "霜镜站", "ember_cinder_ridge": "烬脊营"}

# One optional UI waypoint; never a delivery quest or durable world fact.
var travel_destination_id := ""
var player: SlicePlayer
var move_id := -1
var aim_id := -1
var move_origin := Vector2.ZERO
var aim_origin := Vector2.ZERO
var move_pos := Vector2.ZERO
var aim_pos := Vector2.ZERO
var touch_capable := false
var interaction_blocked := false
var status_label: Label
var hint_label: Label
const STICK_RADIUS := 58.0
const MOVE_DEADZONE := 0.16
const AIM_DEADZONE_PX := 14.0
const PLACE_RADIUS := 24.0

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
	hint_label.text = "左侧移动/上推跳跃 · 右侧瞄准战斗 · 中央键按情境互动"
	hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_label.set_anchors_preset(Control.PRESET_TOP_WIDE)
	hint_label.position = Vector2(0, 10)
	hint_label.add_theme_font_size_override("font_size", 13)
	hint_label.modulate = Color(0.88, 0.91, 0.88, 0.52)
	add_child(hint_label)
	_apply_safe_layout()
	queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and status_label != null:
		_apply_safe_layout()

func _safe_content_rect() -> Rect2:
	return SliceMobileLayout.content_rect(get_viewport_rect().size)

func _context_center() -> Vector2:
	var rect := _safe_content_rect()
	return Vector2(rect.position.x + rect.size.x * 0.5, rect.end.y - PLACE_RADIUS - 4.0)

func _apply_safe_layout() -> void:
	var rect := _safe_content_rect()
	if status_label != null:
		status_label.position = rect.position
	if hint_label != null:
		hint_label.anchor_left = 0.0
		hint_label.anchor_right = 0.0
		hint_label.position = Vector2(rect.position.x, rect.position.y + 28.0)
		hint_label.size = Vector2(rect.size.x, 28.0)

func _process(_delta: float) -> void:
	if player != null and is_instance_valid(player):
		var relic := " · 芯%d 铜%d" % [player.item_count("ancient_core"), player.item_count("copper_ore")] if player.item_count("ancient_core") + player.item_count("copper_ore") > 0 else ""
		var pick_label := "无" if player.equipped_pick_id.is_empty() else ("遗" if player.equipped_pick_id == "delver_pick" else ("Ⅲ" if player.equipped_pick_id == "copper_pick" else ("Ⅱ" if player.equipped_pick_id == "stone_pick" else "Ⅰ")))
		var day := player.world.clock.day_index + 1 if player.world != null else 1
		var hour := int(floor(player.world.clock.hour_24())) if player.world != null else 0
		var market := player.nearby_market_id()
		var market_note := " · 市场" if not market.is_empty() else ""
		status_label.text = "D%d %02d:00 · HP %d · 饱食 %d · ◆%d · 镐%s 刃%s%s%s · v0.27" % [day, hour, int(ceil(player.health)), int(ceil(player.hunger)), player.forge_marks, pick_label, "Ⅱ" if player.equipped_weapon_id == "stone_blade" else "Ⅰ", relic, market_note]
		hint_label.text = _journey_hint()
	queue_redraw()

func _journey_hint() -> String:
	if player == null or player.world == null:
		return "左侧移动/上推跳跃 · 右侧瞄准战斗"
	var wanted: Array[String] = []
	for faction in player.world.faction_authority.ids():
		var bounty: int = player.world.faction_authority.player_bounty(faction)
		if bounty > 0 and player.world.faction_authority.controller_id(faction) == faction:
			var names := {"verdant": "翠野", "frost": "霜原", "ember": "烬土"}
			wanted.append("%s悬赏%d◆" % [String(names.get(faction, faction)), bounty])
	if not wanted.is_empty():
		return "通缉 · " + " / ".join(wanted) + " · 负重 %d/160 · 卫兵会追捕，商人拒绝交易" % int(player.carried_weight())
	if player.hunger <= 25.0:
		return "先补充食物，再赶路 · 中央互动键可进食" if not player.preferred_food_id().is_empty() else "饥饿了：猎取食物，带回营火烹饪"
	var economy := player.world.settlement_authority as SliceSettlementAuthority
	if not travel_destination_id.is_empty() and economy != null and economy.has(travel_destination_id):
		if player.nearby_market_id() == travel_destination_id:
			travel_destination_id = ""
			return "已到集市 · 靠近商人，出售货物前查看最新报价"
		return _destination_hint(economy, travel_destination_id)
	if player.equipped_pick_id.is_empty():
		if player.world.near_workbench(player.global_position):
			return "在工作台旁制作木镐 · 中央互动键"
		if player.item_count("workbench") > 0:
			return "找一块平地放下工作台 · 中央互动键"
		return "砍树取得木材 → 制作木板和工作台 · 中央互动键"
	if not player.world.has_campfire():
		return "先建营火：采集 6 块石头和 2 份木材 · 中央互动键制作与放置"
	if not player.nearby_market_id().is_empty():
		return "靠近商人交易 · 买当地货物，查看远方短缺与商路线索"
	if economy != null:
		var nearest := ""
		var distance := INF
		for town in economy.ids():
			var candidate: float = player.global_position.distance_squared_to(player.world.cell_center(economy.market_cell(town)))
			if candidate < distance:
				distance = candidate
				nearest = town
		if not nearest.is_empty():
			return _destination_hint(economy, nearest)
	return "出发前准备食物 · 探索不同地区的资源和集市"

func _destination_hint(economy: SliceSettlementAuthority, town: String) -> String:
	var center: Vector2 = player.world.cell_center(economy.market_cell(town))
	var dx := center.x - player.global_position.x
	var cells := int(ceil(absf(dx) / float(SliceWorld.TILE_SIZE)))
	if cells <= 3:
		return "%s就在附近 · 找到集市商人" % String(TOWN_LABELS.get(town, "集市"))
	return "%s %s · 约 %d 格 · 留足返程食物" % ["→" if dx > 0 else "←", String(TOWN_LABELS.get(town, "集市")), cells]

func set_interaction_blocked(blocked: bool) -> void:
	interaction_blocked = blocked
	if blocked:
		move_id = -1
		aim_id = -1
		if player != null:
			player.set_touch_move(Vector2.ZERO)
			player.set_touch_aim(Vector2.ZERO, false)
	queue_redraw()

func _input(event: InputEvent) -> void:
	if interaction_blocked:
		return
	if not event is InputEventScreenTouch and not event is InputEventScreenDrag:
		return
	var size := get_viewport_rect().size
	var place_center := _context_center()
	if event is InputEventScreenTouch:
		var t := event as InputEventScreenTouch
		if t.pressed:
			if t.position.distance_to(place_center) <= PLACE_RADIUS * 1.35:
				if player != null:
					player.context_action()
				return
			if t.position.y < size.y * 0.30:
				return
			if t.position.x < size.x * 0.46 and move_id < 0:
				move_id = t.index
				move_origin = t.position
				move_pos = t.position
				_apply_move()
			elif t.position.x > size.x * 0.54 and aim_id < 0:
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
	var delta := (move_pos - move_origin).limit_length(STICK_RADIUS) / STICK_RADIUS
	if delta.length() < MOVE_DEADZONE:
		delta = Vector2.ZERO
	else:
		var scaled := (delta.length() - MOVE_DEADZONE) / (1.0 - MOVE_DEADZONE)
		delta = delta.normalized() * clampf(scaled, 0.0, 1.0)
	player.set_touch_move(delta)

func _apply_aim() -> void:
	if player == null:
		return
	var delta := aim_pos - aim_origin
	if delta.length() < AIM_DEADZONE_PX:
		player.set_touch_aim(Vector2.ZERO, false)
		return
	player.set_touch_aim(delta.normalized(), true)

func _draw() -> void:
	if not touch_capable:
		return
	var size := get_viewport_rect().size
	var place_center := _context_center()
	draw_circle(place_center, PLACE_RADIUS, Color(0.08, 0.14, 0.15, 0.28))
	draw_arc(place_center, PLACE_RADIUS, 0.0, TAU, 32, Color(0.68, 0.75, 0.66, 0.35), 2.0)
	var label := player.context_label() if player != null and is_instance_valid(player) else "置"
	draw_string(ThemeDB.fallback_font, place_center + Vector2(-8, 5), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.9, 0.93, 0.82, 0.65))
	if move_id >= 0:
		_draw_stick(move_origin, move_pos, Color(0.66, 0.80, 0.75, 0.46))
	if aim_id >= 0:
		_draw_stick(aim_origin, aim_pos, Color(0.90, 0.65, 0.48, 0.48))

func _draw_stick(origin: Vector2, pos: Vector2, tint: Color) -> void:
	var knob := origin + (pos - origin).limit_length(STICK_RADIUS)
	draw_circle(origin, STICK_RADIUS, Color(0.03, 0.07, 0.08, 0.16))
	draw_arc(origin, STICK_RADIUS, 0.0, TAU, 40, tint, 2.0)
	draw_circle(knob, 19.0, Color(tint.r, tint.g, tint.b, 0.34))
