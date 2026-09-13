class_name SliceSettlementNpc
extends Area2D

signal dialogue_requested(payload: Dictionary)

var actor_id := ""
var npc_kind := "merchant"
var payload: Dictionary = {}
var player: SlicePlayer
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
	shape.size = Vector2(28, 46)
	var collider := CollisionShape2D.new()
	collider.shape = shape
	collider.position = Vector2(0, -23)
	add_child(collider)
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
