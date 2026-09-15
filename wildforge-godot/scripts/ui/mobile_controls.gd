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
		status_label.text = "D%d %02d:00 · HP %d · 饱食 %d · ◆%d · 镐%s 刃%s%s%s" % [day, hour, int(ceil(player.health)), int(ceil(player.hunger)), player.forge_marks, pick_label, "Ⅱ" if player.equipped_weapon_id == "stone_blade" else "Ⅰ", relic, market_note]
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
	var actors = player.get_parent().get("actor_authority")
	if travel_destination_id.begins_with("player_storage:") and actors != null:
		var target: Vector2 = actors.storage_position(travel_destination_id)
		var destination_name := "驮兽" if travel_destination_id == SliceWorldActorAuthority.BEAST_ID else "货栈"
		if target == Vector2.INF:
			travel_destination_id = ""
		else:
			var offset := target - player.global_position
			var horizontal := int(ceil(absf(offset.x) / SliceWorld.TILE_SIZE))
			var vertical := int(ceil(absf(offset.y) / SliceWorld.TILE_SIZE))
			if offset.length() <= 112.0:
				return destination_name + "已到 · 靠近后点击，存取物资或照料"
			return "%s %s %d格 · %s %d格 · 负重 %d/160" % [destination_name, "→" if offset.x > 0 else "←", horizontal, "下方" if offset.y > 0 else "上方", vertical, int(player.carried_weight())]
	if actors != null and not actors.beast_state().is_empty():
		var beast: Dictionary = actors.beast_state()
		var at: Vector2 = actors.storage_position(SliceWorldActorAuthority.BEAST_ID)
		var distance := int(ceil(player.global_position.distance_to(at) / SliceWorld.TILE_SIZE))
		if float(beast["health"]) <= 0:
			return "驮兽倒下了 · 剩余货物在原地，距离%d格 · 面板可标记位置" % distance
		if float(beast["food"]) < 15:
			return "驮兽需要补给 · 点击喂食旅行口粮 · 距离%d格" % distance
		if distance > 14:
			return "驮兽落在后面了 · 距离%d格 · 回去接应，陡坡需要修路" % distance
	if player.item_count("storage_box") > 0:
		return "带着储物箱：离开营火/工作台，瞄准平地 · 中央键放置"
	if player.carried_weight() > 80.0 and actors != null and not actors.storage_destinations().is_empty() and travel_destination_id.is_empty():
		return "负重拖慢了脚步 · 在商人或储物箱面板选择返程货栈"
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
	var progression_hint := _progression_hint()
	if not progression_hint.is_empty():
		return progression_hint
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

func _progression_hint() -> String:
	if player == null or player.world == null or player.world.progression_authority == null:
		return ""
	var guide: Dictionary = player.world.progression_authority.guidance_snapshot()
	var kind := String(guide.get("kind", ""))
	var economy := player.world.settlement_authority as SliceSettlementAuthority
	match kind:
		"survival": return "先活下来：做基础工具、备好食物和营火 · 世界不会在你身后提前开战"
		"first_foothold": return "找到最近的聚落并和当地人接触 · 先站稳脚跟，再谈远方"
		"discover_second_region", "discover_all_regions":
			var target := _closest_guidance_target(guide.get("unknown_settlements", []), economy)
			return _rumor_hint(economy, target) if not target.is_empty() else "继续探索尚未接触的区域与聚落"
		"prove_logistics": return "把一地真正出产的货带去另一处缺货集市，或购置驮兽建立长途运输能力"
		"foothold_maturing": return "你已经有了远行能力 · 继续经营补给和货路，商路不会在一夜之间成熟"
		"establish_exchange": return "三地已经在视野里 · 让真实货物流动起来，跨势力商队跑通后关系才会改变"
		"watch_supply_pressure": return "观察各地库存与短缺 · 商路承压会留下真实的价格、货运和道路迹象"
		"roads_maturing": return "商路正在形成稳定网络 · 继续贸易、探索和补给，不必刻意制造冲突"
		"observe_tension":
			var target := _closest_guidance_target(guide.get("target_settlements", []), economy)
			return _conflict_rumor_hint(economy, target) if not target.is_empty() else "边境已有异样 · 去聚落、商路和守卫处亲自确认，而不是只看后台数字"
		"watch_border_pressure": return "你已经见到裂痕 · 接下来观察商路、守卫和库存如何继续变化，战争仍不是必然"
		"fracture_maturing": return "紧张已经被你亲眼确认 · 现在的选择是维持平衡、补给弱方，或任由局势继续恶化"
		"maintain_balance": return "区域仍保持平衡 · 继续维持贸易与补给，也能把世界带入更成熟的阶段"
		"active_conflict":
			var target := _closest_guidance_target(guide.get("target_settlements", []), economy)
			return _conflict_rumor_hint(economy, target) if not target.is_empty() else "战事正在改变库存、人口和道路 · 你可以参战、运补给，也可以远离前线"
		"postwar_recovery": return "战争已经告一段落 · 返乡、修路和补货正在真实恢复地区，不必立刻进入下一轮冲突"
		"shape_region": return "世界已允许战争，但没有强迫你开战 · 经商、结盟、劫掠或维持平衡都能塑造地区"
		"open_sandbox": return "格局已经完全开放 · 贸易、犯罪、战争、吞并与长期建设都由你的行动和世界因果决定"
	return ""

func _closest_guidance_target(raw_ids, economy: SliceSettlementAuthority) -> String:
	if economy == null or not raw_ids is Array:
		return ""
	var best := ""
	var best_distance := INF
	for raw_id in raw_ids:
		var town := String(raw_id)
		if not economy.has(town):
			continue
		var distance := player.global_position.distance_squared_to(player.world.cell_center(economy.market_cell(town)))
		if distance < best_distance:
			best_distance = distance
			best = town
	return best

func _rumor_hint(economy: SliceSettlementAuthority, town: String) -> String:
	if economy == null or town.is_empty():
		return "继续探索尚未接触的地区"
	var center: Vector2 = player.world.cell_center(economy.market_cell(town))
	var dx: float = center.x - player.global_position.x
	var rumor := String({"frost_frostmirror": "西方霜原有人烟", "ember_cinder_ridge": "东方烬土有营地", "verdant_mossbridge": "中部翠野有集市"}.get(town, "远方有人烟"))
	return "%s · 向%s远行，备足食物再出发" % [String(rumor), "东" if dx > 0 else "西"]

func _conflict_rumor_hint(economy: SliceSettlementAuthority, town: String) -> String:
	if economy == null or town.is_empty():
		return "边境出现异常 · 亲自去看商路、守卫和聚落的变化"
	var center: Vector2 = player.world.cell_center(economy.market_cell(town))
	var dx: float = center.x - player.global_position.x
	return "听说%s一带不太平 · 往%s走，亲自确认局势" % [String(TOWN_LABELS.get(town, "边境")), "东" if dx > 0 else "西"]

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
