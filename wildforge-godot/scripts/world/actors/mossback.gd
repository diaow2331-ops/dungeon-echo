class_name SliceMossback
extends CharacterBody2D

signal dialogue_requested(payload: Dictionary)
var actor_id := ""
var authority: SliceWorldActorAuthority
var player: SlicePlayer
var hazard_cooldown := 0.0
var step_time := 0.0

func _ready() -> void:
	collision_layer = 8
	collision_mask = 1
	var collider := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(46, 30)
	collider.shape = shape
	collider.position.y = -16
	add_child(collider)
	var area := Area2D.new()
	area.collision_layer = 16
	area.collision_mask = 0
	var touch_shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(68, 64)
	touch_shape.shape = rect
	touch_shape.position.y = -24
	area.add_child(touch_shape)
	area.input_event.connect(_interact)
	add_child(area)

func _physics_process(delta: float) -> void:
	var state := authority.beast_state()
	if state.is_empty():
		return
	var alive := float(state["health"]) > 0.0
	if not alive:
		velocity = Vector2.ZERO
		queue_redraw()
		return
	var dx := player.global_position.x - global_position.x
	velocity.y = minf(800.0, velocity.y + 1450.0 * delta)
	var moving := alive and bool(state["following"]) and float(state["food"]) > 0.0 and not player.interaction_locked and absf(dx) > 86.0 and absf(dx) < 1100.0
	var speed := 150.0 * (1.0 - authority.storage_weight(actor_id) / 1600.0)
	velocity.x = move_toward(velocity.x, signf(dx) * speed if moving else 0.0, 500.0 * delta)
	# Stops at deep drops. Walls require a physically possible short jump.
	if moving and is_on_floor():
		var ahead := player.world.world_to_cell(global_position + Vector2(signf(dx) * 42, 12))
		var supported := false
		for depth in range(3):
			if player.world.has_cell(ahead + Vector2i(0, depth)):
				supported = true
		if not supported:
			velocity.x = 0.0
		elif is_on_wall():
			velocity.y = -340.0
	var before := global_position
	var fall_speed := velocity.y
	move_and_slide()
	authority.move_beast(global_position, before.distance_to(global_position) if alive else 0.0)
	if alive and is_on_floor() and fall_speed > 620.0:
		authority.hurt_beast((fall_speed - 600.0) * 0.16)
	hazard_cooldown = maxf(0.0, hazard_cooldown - delta)
	if alive and hazard_cooldown <= 0.0:
		for enemy in get_tree().get_nodes_in_group("enemies"):
			if not is_instance_valid(enemy) or global_position.distance_to(enemy.global_position) > 52.0:
				continue
			var ray := PhysicsRayQueryParameters2D.create(global_position + Vector2(0, -16), enemy.global_position, 1)
			if get_world_2d().direct_space_state.intersect_ray(ray).is_empty():
				authority.hurt_beast(12.0)
				hazard_cooldown = 1.5
				break
	step_time += delta * absf(velocity.x) * 0.08
	queue_redraw()

func _interact(viewport: Node, event: InputEvent, _shape: int) -> void:
	var pressed: bool = (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) or (event is InputEventScreenTouch and event.pressed)
	if not pressed or player.global_position.distance_to(global_position) > 112:
		return
	viewport.set_input_as_handled()
	dialogue_requested.emit({"actor_id": actor_id, "npc_kind": "player_storage", "display_name": "苔背驮兽", "role": "旅途伙伴 · 载重320", "dialogue": ["装载后让它跟随；陡坡和沟壑需要先修路。旅行口粮可恢复体力与伤势。"]})

func _draw() -> void:
	if authority == null:
		return
	var state := authority.beast_state()
	var alive := float(state.get("health", 0)) > 0
	var tint := Color("71915c") if alive else Color("655d50")
	draw_ellipse_body(tint)
	for x in [-16, 14]:
		var swing := sin(step_time + float(x)) * 3.0 if alive else 0.0
		draw_rect(Rect2(x, -10, 7, 10 + swing), Color("526846"))
	draw_circle(Vector2(26, -22), 11, tint)
	draw_circle(Vector2(30, -25), 2, Color("182b24"))
	draw_rect(Rect2(-15, -39, 30, 17), Color("997343"))
	draw_line(Vector2(-11, -39), Vector2(-11, -15), Color("d2bc87"), 3)
	draw_line(Vector2(11, -39), Vector2(11, -15), Color("d2bc87"), 3)
	var label := "苔背驮兽" if alive else "驮兽遗物"
	if alive and float(state.get("food", 0)) <= 0:
		label = "饥饿 · 等待喂食"
	draw_string(ThemeDB.fallback_font, Vector2(-36, -51), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("e1d8b0"))

func draw_ellipse_body(tint: Color) -> void:
	draw_rect(Rect2(-24, -30, 48, 23), tint)
	draw_circle(Vector2(-20, -19), 11, tint)
