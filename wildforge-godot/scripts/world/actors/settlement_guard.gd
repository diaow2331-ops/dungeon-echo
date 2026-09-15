class_name SliceSettlementGuard
extends CharacterBody2D

signal dialogue_requested(payload: Dictionary)
const MAX_HEALTH := 420.0
const DAMAGE := 32.0
const ARMOR_FACTOR := 0.45
var player: SlicePlayer
var authority: SliceWorldActorAuthority
var actor_id := ""
var payload: Dictionary = {}
var home := Vector2.ZERO
var attack_phase := 0
var attack_time := 0.0
var attack_dir := 1.0
var hit_flash := 0.0
var jump_cooldown := 0.0
var attack_hit := false

func _ready() -> void:
	home = global_position
	collision_layer = 4
	collision_mask = 1
	add_to_group("settlement_guard")
	if not bool(payload.get("hunter", false)):
		add_to_group("damageable_npcs")
	var shape := CapsuleShape2D.new()
	shape.radius = 12.0
	shape.height = 46.0
	var collider := CollisionShape2D.new()
	collider.shape = shape
	collider.position = Vector2(0, -23)
	add_child(collider)
	var area := Area2D.new()
	area.collision_layer = 16
	area.collision_mask = 0
	area.input_pickable = true
	var target := RectangleShape2D.new()
	target.size = Vector2(56, 64)
	var click_shape := CollisionShape2D.new()
	click_shape.shape = target
	click_shape.position = Vector2(0, -23)
	area.add_child(click_shape)
	area.input_event.connect(_input_event)
	add_child(area)

func health() -> float:
	return authority.guard_health(actor_id) if authority != null else MAX_HEALTH

func hostile() -> bool:
	return player != null and player.world != null and player.world.faction_authority.hostile_to_player(player.world.faction_authority.controller_for_settlement(String(payload.get("settlement_id", ""))))

func _input_event(viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	var pressed: bool = (event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT) or (event is InputEventScreenTouch and event.pressed)
	if not pressed or player == null or player.global_position.distance_to(global_position) > 118.0:
		return
	viewport.set_input_as_handled()
	if bool(payload.get("hunter", false)):
		return
	var request := payload.duplicate(true)
	request["npc_kind"] = "guard"
	request["actor_id"] = actor_id
	request["guard_dead"] = health() <= 0.0
	request["display_name"] = "倒下的守卫" if health() <= 0.0 else String(payload.get("display_name", "仓库卫兵"))
	request["dialogue"] = ["搜身或许能找到仓库钥匙。"] if health() <= 0.0 else _guard_dialogue()
	if health() > 0.0 and hostile() and player != null and player.world != null:
		var faction_id: String = player.world.faction_authority.controller_for_settlement(String(payload.get("settlement_id", "")))
		request["bounty"] = player.world.faction_authority.player_bounty(faction_id)
	dialogue_requested.emit(request)

func _guard_dialogue() -> Array:
	var lines: Array = []
	var status := "peace"
	if player != null and player.world != null and player.world.faction_authority != null:
		status = player.world.faction_authority.conflict_status(String(payload.get("settlement_id", "")))
	if status == "peace" and player != null and player.world != null and player.world.progression_authority != null:
		match player.world.progression_authority.era:
			SliceWorldProgressionAuthority.ERA_WANDERER: lines.append("这里暂时平静。你若只是路过，先学会在荒野里活下来，再谈更远的事。")
			SliceWorldProgressionAuthority.ERA_FOOTHOLD: lines.append("镇里认得你了，但外面的路还只是路。三方之间还没到互相牵动的地步。")
			SliceWorldProgressionAuthority.ERA_OPEN_ROADS: lines.append("商路开始把几片地方连在一起。货物走得越远，各地之间的关系也会越难彼此撇清。")
			SliceWorldProgressionAuthority.ERA_FRACTURE: lines.append("边境上已经有人开始多看彼此一眼。现在还没开战，但路上的异常不会是无缘无故。")
			SliceWorldProgressionAuthority.ERA_WARFRONT: lines.append("如今和平只是当前状态，不再是世界的保证。守卫、补给和商路都得为最坏的情况做准备。")
			SliceWorldProgressionAuthority.ERA_REFORGING: lines.append("现在连一面旗帜归谁都不再是永远的。这里的土地没变，控制它的人却可能会变。")
	if hostile() and player != null and player.world != null:
		var faction_id: String = player.world.faction_authority.controller_for_settlement(String(payload.get("settlement_id", "")))
		lines.append("你在本势力的悬赏是 %d◆。缴清后守卫与追捕会停止。" % player.world.faction_authority.player_bounty(faction_id))
	match status:
		"tense": lines.append("边境正在升温。守卫已经加强警戒，长途商路风险也在上升。")
		"war": lines.append("战事已经开始。聚落会优先保留口粮与补给，外运物资受到限制。")
		"raid": lines.append("敌袭就在附近。击退袭击者会直接削弱这一次进攻。")
		"occupied": lines.append("这里已经易主。土地和物产没有改变，但税收与主权已归新的控制者。")
		_: lines.append("仓库重地。拔刀袭击守卫将遭到本势力永久通缉。")
	lines.append("重甲卫兵 · 生命 420 · 长枪重击。前期正面交战极其危险。")
	return lines

func _physics_process(delta: float) -> void:
	if player == null or not is_instance_valid(player):
		return
	hit_flash = maxf(0.0, hit_flash - delta)
	jump_cooldown = maxf(0.0, jump_cooldown - delta)
	if health() <= 0.0:
		if is_in_group("enemies"):
			remove_from_group("enemies")
		velocity = Vector2.ZERO
		queue_redraw()
		return
	var aggressive := hostile()
	if aggressive and not is_in_group("enemies"):
		add_to_group("enemies")
	elif not aggressive and is_in_group("enemies"):
		remove_from_group("enemies")
	velocity.y = minf(820.0, velocity.y + 1450.0 * delta)
	var offset := player.global_position - global_position
	var chase := aggressive and global_position.distance_to(home) < 640.0 and offset.length() < 700.0
	if attack_phase > 0:
		attack_time -= delta
		velocity.x = move_toward(velocity.x, 0.0, 900.0 * delta)
		if attack_phase == 1 and attack_time <= 0.0:
			attack_phase = 2
			attack_time = 0.20
			attack_hit = false
		if attack_phase == 2:
			velocity.x = attack_dir * 290.0
			if not attack_hit and offset.length() < 100.0 and offset.x * attack_dir > -10.0 and _clear_strike():
				attack_hit = true
				player.take_damage(DAMAGE, Vector2(attack_dir * 380.0, -180.0))
			if attack_time <= 0.0:
				attack_phase = 3
				attack_time = 1.05
		elif attack_phase == 3 and attack_time <= 0.0:
			attack_phase = 0
	elif chase and absf(offset.x) < 115.0 and absf(offset.y) < 68.0 and _clear_strike():
		attack_phase = 1
		attack_time = 0.65
		attack_dir = 1.0 if offset.x >= 0.0 else -1.0
	elif chase:
		velocity.x = move_toward(velocity.x, signf(offset.x) * 190.0, 700.0 * delta)
		if is_on_floor() and is_on_wall() and jump_cooldown <= 0.0:
			velocity.y = -470.0
			jump_cooldown = 1.1
	else:
		var dx := home.x - global_position.x
		velocity.x = move_toward(velocity.x, signf(dx) * 115.0 if absf(dx) > 16.0 else 0.0, 600.0 * delta)
	move_and_slide()
	queue_redraw()

func _clear_strike() -> bool:
	var ray := PhysicsRayQueryParameters2D.create(global_position + Vector2(0, -23), player.global_position, 1)
	return get_world_2d().direct_space_state.intersect_ray(ray).is_empty()

func provoke() -> void:
	if health() <= 0.0 or player == null or player.global_position.distance_to(global_position) > 118.0:
		return
	player.world.faction_authority.record_player_crime(player.world.faction_authority.controller_for_settlement(String(payload.get("settlement_id", ""))), 150)
	add_to_group("enemies")

func apply_hit(damage: float, force: Vector2) -> void:
	if health() <= 0.0 or damage <= 0.0 or player == null:
		return
	if not _clear_strike():
		return
	if not hostile():
		provoke()
	authority.damage_guard(actor_id, maxf(1.0, damage * ARMOR_FACTOR), global_position)
	hit_flash = 0.14
	velocity.x += clampf(force.x * 0.12, -45.0, 45.0)
	# Heavy armor resists stun-lock; telegraphed thrusts still leave recovery openings.

func _draw() -> void:
	if health() <= 0.0:
		draw_rect(Rect2(-23, -9, 46, 9), Color("566270"))
		draw_string(ThemeDB.fallback_font, Vector2(-28, -18), "搜身", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color("e3ca80"))
		return
	var color := Color("eb977c") if hit_flash > 0 else (Color("856156") if bool(payload.get("hunter", false)) else Color("657c93"))
	draw_circle(Vector2(0, -42), 10, Color("c7b48e"))
	draw_rect(Rect2(-14, -36, 28, 30), color)
	draw_rect(Rect2(-14, -6, 10, 7), Color("354553"))
	draw_rect(Rect2(4, -6, 10, 7), Color("354553"))
	draw_rect(Rect2(-22, -34, 13, 26), Color("a4adb3"))
	draw_line(Vector2(18, -51), Vector2(18, 0), Color("d0c6a1"), 3)
	if hostile():
		draw_rect(Rect2(-26, -64, 52, 5), Color("302727"))
		draw_rect(Rect2(-26, -64, 52 * health() / MAX_HEALTH, 5), Color("d37565"))
	if player != null and player.world != null and player.world.faction_authority != null:
		var conflict := player.world.faction_authority.conflict_status(String(payload.get("settlement_id", "")))
		if conflict in ["tense", "war", "raid", "occupied"]:
			var indicator := Color("d6aa5f") if conflict == "tense" else (Color("cc6a58") if conflict in ["war", "raid"] else Color("8d83a8"))
			draw_rect(Rect2(-18, -75, 36, 5), indicator)
	if attack_phase == 1:
		draw_line(Vector2(0, -24), Vector2(attack_dir * 100, -24), Color("f0b457"), 3)
