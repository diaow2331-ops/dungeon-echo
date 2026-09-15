class_name SliceSettlementNpc
extends Area2D

signal dialogue_requested(payload: Dictionary)

var actor_id := ""
var npc_kind := "merchant"
var payload: Dictionary = {}
var player: SlicePlayer
var redraw_elapsed := 0.0
var body_tint := Color("6f9c72")

func setup(id: String, kind: String, data: Dictionary) -> void:
	actor_id = id
	npc_kind = kind
	payload = data.duplicate(true)
	body_tint = Color("ad8059") if kind == "merchant" else Color("66829a")

func _ready() -> void:
	collision_layer = 16
	collision_mask = 0
	input_pickable = true
	add_to_group("settlement_npcs")
	add_to_group("settlement_" + npc_kind)
	var shape := RectangleShape2D.new()
	shape.size = Vector2(56, 64)
	var collider := CollisionShape2D.new()
	collider.shape = shape
	collider.position = Vector2(0, -23)
	add_child(collider)
	queue_redraw()

func _process(delta: float) -> void:
	# Scene-only refresh: economic and political facts stay in world authority.
	redraw_elapsed += delta
	if redraw_elapsed >= 0.5:
		redraw_elapsed = 0.0
		queue_redraw()

func _input_event(viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	var activate := false
	if event is InputEventMouseButton:
		var mouse := event as InputEventMouseButton
		activate = mouse.pressed and mouse.button_index == MOUSE_BUTTON_LEFT
	elif event is InputEventScreenTouch:
		activate = (event as InputEventScreenTouch).pressed
	if not activate:
		return
	if player == null or not is_instance_valid(player) or player.global_position.distance_to(global_position) > 118.0:
		return
	viewport.set_input_as_handled()
	var request := payload.duplicate(true)
	request["npc_kind"] = npc_kind
	var era_line := era_context_line()
	if not era_line.is_empty():
		var lines: Array = (request.get("dialogue", []) as Array).duplicate()
		lines.push_front(era_line)
		request["dialogue"] = lines
	dialogue_requested.emit(request)

func era_context_line() -> String:
	if npc_kind != "merchant" or player == null or not is_instance_valid(player) or player.world == null or player.world.progression_authority == null:
		return ""
	match player.world.progression_authority.era:
		SliceWorldProgressionAuthority.ERA_WANDERER: return "你还是一副刚从荒地里走出来的样子。先安顿下来，镇里的买卖才会真正向你敞开。"
		SliceWorldProgressionAuthority.ERA_FOOTHOLD: return "至少你已经站稳脚跟了。这里能做买卖，但远方的商路还没有真正连起来。"
		SliceWorldProgressionAuthority.ERA_OPEN_ROADS: return "最近外地货开始进镇。路一通，不同地方缺什么、盛产什么，价钱就有了意义。"
		SliceWorldProgressionAuthority.ERA_FRACTURE: return "路还通着，但气氛不对了。商队在变少，越值钱的货越要看清沿途风险。"
		SliceWorldProgressionAuthority.ERA_WARFRONT: return "战事已经能影响货路和库存。现在每一车补给，都可能改变一座聚落能撑多久。"
		SliceWorldProgressionAuthority.ERA_REFORGING: return "旧的格局已经不是铁板一块。货物流向哪里，旗帜最后插在哪里，都可能被人改写。"
	return ""

func _draw() -> void:
	if npc_kind == "player_storage":
		draw_rect(Rect2(-20, -28, 40, 28), Color("8c623f"))
		draw_rect(Rect2(-20, -28, 40, 28), Color("c7a26a"), false, 2)
		draw_line(Vector2(-20, -18), Vector2(20, -18), Color("c7a26a"), 2)
		draw_rect(Rect2(-3, -20, 6, 9), Color("d9c176"))
		draw_string(ThemeDB.fallback_font, Vector2(-30, -38), "储物箱", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("e1c996"))
		return
	if npc_kind == "lost_cargo":
		draw_rect(Rect2(-16, -23, 32, 23), Color("9b8052"))
		draw_line(Vector2(-12, -21), Vector2(12, -3), Color("d7bc82"), 3)
		var cargo_label := String(payload.get("display_name", "遗落行囊"))
		draw_string(ThemeDB.fallback_font, Vector2(-30, -32), cargo_label.substr(0, 6), HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("e1c996"))
		return
	if npc_kind == "warehouse":
		_draw_warehouse()
		return
	draw_circle(Vector2(0, -39), 8.5, Color("d7bf91"))
	draw_rect(Rect2(-10, -31, 20, 25), body_tint)
	draw_rect(Rect2(-9, -6, 7, 13), Color("4d5d61"))
	draw_rect(Rect2(2, -6, 7, 13), Color("4d5d61"))
	if npc_kind == "guard":
		draw_line(Vector2(13, -29), Vector2(13, 5), Color("c5c9c3"), 3.0)
	else:
		draw_rect(Rect2(-12, -22, 5, 12), Color("b48b50"))

	if npc_kind == "merchant":
		_draw_market_stock()
	if player != null and is_instance_valid(player) and player.global_position.distance_to(global_position) <= 118.0:
		var font := ThemeDB.fallback_font
		var market_open := player.world == null or player.world.progression_authority == null or player.world.progression_authority.allows_local_market()
		var label := ("交易" if market_open else "交谈") if npc_kind == "merchant" else "交谈"
		draw_rect(Rect2(-26, -78, 52, 24), Color(0.05, 0.09, 0.08, 0.9))
		draw_string(font, Vector2(-18, -61), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("f2e7c9"))

func _draw_market_stock() -> void:
	if player == null or not is_instance_valid(player) or player.world == null or player.world.settlement_authority == null:
		return
	var economy := player.world.settlement_authority as SliceSettlementAuthority
	var town := String(payload.get("settlement_id", ""))
	var row := economy.state(town)
	if row.is_empty():
		return
	var inventory: Dictionary = row.get("inventory", {})
	var stock := 0
	var target := 0
	for good in economy.accepted_goods(town):
		stock += int(inventory.get(good, 0))
		target += economy.effective_target(town, good)
	# The stall's crates are a bounded stock projection, never loot containers.
	var crates := clampi(int(ceil(float(stock) / float(maxi(1, target)) * 3.0)), 0, 3)
	for index in range(crates):
		var x := 18.0 + float(index % 2) * 14.0
		var y := -8.0 - floorf(float(index) / 2.0) * 13.0
		draw_rect(Rect2(x, y, 12, 12), Color("97764f"))
		draw_rect(Rect2(x, y, 12, 12), Color("c2a16d"), false, 1.0)
	var shortage := economy.shortage_state(town)
	if String(shortage.get("severity", "stable")) != "stable":
		var alert_color := Color("ef765f") if String(shortage.get("severity", "")) == "critical" else Color("e2b45d")
		draw_line(Vector2(-19, -33), Vector2(-19, -22), alert_color, 3.0)
		draw_circle(Vector2(-19, -17), 2.0, alert_color)

func _draw_warehouse() -> void:
	if player == null or player.world == null:
		return
	var economy := player.world.settlement_authority as SliceSettlementAuthority
	var town := String(payload.get("settlement_id", ""))
	var locked := economy.warehouse_locked(town)
	draw_rect(Rect2(-14, -60, 28, 60), Color("765438") if locked else Color(0.13, 0.11, 0.08, 0.4))
	if locked:
		draw_rect(Rect2(-6, -36, 12, 14), Color("c7b16c"))
		draw_arc(Vector2(0, -37), 5, PI, TAU, 8, Color("c7b16c"), 2)
	draw_string(ThemeDB.fallback_font, Vector2(-36, -70), "仓库·锁闭" if locked else "仓库·已开", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color("e1c996"))
