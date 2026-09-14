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
	dialogue_requested.emit(request)

func _draw() -> void:
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
		var label := "交易" if npc_kind == "merchant" else "交谈"
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
	var targets: Dictionary = row.get("targets", {})
	var stock := 0
	var target := 0
	for good in economy.accepted_goods(town):
		stock += int(inventory.get(good, 0))
		target += int(targets.get(good, 0))
	# The stall's crates are a bounded stock projection, never loot containers.
	var crates := clampi(int(ceil(float(stock) / float(maxi(1, target)) * 3.0)), 0, 3)
	for index in range(crates):
		var x := 18.0 + float(index % 2) * 14.0
		var y := -8.0 - floorf(float(index) / 2.0) * 13.0
		draw_rect(Rect2(x, y, 12, 12), Color("97764f"))
		draw_rect(Rect2(x, y, 12, 12), Color("c2a16d"), false, 1.0)
	var meat_target := int(targets.get("raw_meat", 0))
	if int(inventory.get("raw_meat", 0)) < meat_target:
		draw_line(Vector2(-19, -31), Vector2(-19, -22), Color("e2b45d"), 2.5)
		draw_circle(Vector2(-19, -18), 1.5, Color("e2b45d"))
