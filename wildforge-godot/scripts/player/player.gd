extends CharacterBody2D
class_name SlicePlayer

const CraftingScript = preload("res://scripts/crafting/slice_crafting.gd")

const SPEED := 285.0
const GROUND_ACCEL := 2500.0
const AIR_ACCEL := 1280.0
const FRICTION := 2850.0
const GRAVITY := 1450.0
const JUMP_SPEED := 505.0
const COYOTE_TIME := 0.11
const JUMP_BUFFER := 0.12
const REACH := 132.0
const ATTACK_WINDUP := 0.055
const ATTACK_ACTIVE := 0.075
const ATTACK_RECOVERY := 0.17
const ATTACK_TOTAL := ATTACK_WINDUP + ATTACK_ACTIVE + ATTACK_RECOVERY
const ATTACK_BUFFER := 0.11
const ATTACK_STEP_SPEED := 135.0
const TURN_ACCEL_MULT := 1.35
const APEX_GRAVITY_SCALE := 0.72
const MINE_STICK_GRACE := 0.09
const MELEE_ACQUIRE_RANGE := 108.0
const MELEE_HIT_RANGE := 94.0
const HUNGER_MAX := 100.0
const HUNGER_START := 82.0
const HUNGER_DRAIN_PER_SEC := HUNGER_MAX / 1800.0
const STARVATION_DAMAGE_INTERVAL := 4.0
const STARVATION_DAMAGE := 2.0
const CAMP_REST_HEAL_PER_SEC := 0.4
const CAMP_REST_MAX_SPEED := 8.0
const CAMP_REST_MIN_HUNGER := 20.0
const RAW_MEAT_NOURISH := 9.0
const TRAIL_RATION_NOURISH := 38.0
const STONE_PICK_POWER := 1.75
const COPPER_PICK_POWER := 2.30
const DELVER_PICK_POWER := 2.70
const STARTER_BLADE_REFERENCE_DAMAGE := 5.0
const STONE_BLADE_REFERENCE_DAMAGE := 7.0
const STARTER_BLADE_REFERENCE_KNOCKBACK := 4.2
const STONE_BLADE_REFERENCE_KNOCKBACK := 4.8
const SLICE_BASE_MELEE_DAMAGE := 24.0
const SLICE_BASE_MELEE_FORCE := 320.0

var world: SliceWorld
var health := 100.0
var max_health := 100.0
var facing := 1.0
var touch_move := Vector2.ZERO
var touch_aim := Vector2.RIGHT
var touch_primary := false
var touch_jump_latched := false
var coyote := 0.0
var jump_buffer := 0.0
var invuln := 0.0
var mine_cell := Vector2i(99999, 99999)
var mine_progress := 0.0
var hurt_flash := 0.0
var camera_trauma := 0.0
var attack_timer := 0.0
var attack_connected := false
var attack_target: Node2D
var attack_aim := Vector2.RIGHT
var hitstop := 0.0
var landing_squash := 0.0
var landing_strength := 0.0
var was_on_floor := false
var previous_fall_speed := 0.0
var primary_prev := false
var attack_buffer := 0.0
var mine_grace := 0.0
var stock: Dictionary = {}
var hunger := HUNGER_START
var starvation_tick := 0.0
var equipped_pick_id := ""
var equipped_axe_id := ""
var equipped_weapon_id := "starter_blade"

func _ready() -> void:
	stock = {"soil": 0, "stone": 0, "wood": 0, "plank": 0, "workbench": 0, "campfire": 0, "raw_meat": 0, "trail_ration": 0, "stone_pick": 0, "stone_blade": 0, "coal": 0, "copper_ore": 0, "ancient_core": 0, "copper_bar": 0, "copper_pick": 0, "delver_pick": 0}
	collision_layer = 2
	collision_mask = 1
	var shape := CapsuleShape2D.new()
	shape.radius = 10.0
	shape.height = 38.0
	var collider := CollisionShape2D.new()
	collider.shape = shape
	collider.position = Vector2(0, -3)
	add_child(collider)
	queue_redraw()

func set_touch_move(v: Vector2) -> void:
	touch_move = v

func set_touch_aim(v: Vector2, active: bool) -> void:
	if v.length_squared() > 0.05:
		touch_aim = v.normalized()
	touch_primary = active

func _physics_process(delta: float) -> void:
	_update_survival(delta)
	invuln = maxf(0.0, invuln - delta)
	hurt_flash = maxf(0.0, hurt_flash - delta)
	camera_trauma = maxf(0.0, camera_trauma - delta * 4.2)
	landing_squash = maxf(0.0, landing_squash - delta * 5.5)
	hitstop = maxf(0.0, hitstop - delta)
	attack_buffer = maxf(0.0, attack_buffer - delta)
	_update_camera()
	_update_attack(delta)
	if hitstop > 0.0:
		velocity.x = move_toward(velocity.x, 0.0, 2800.0 * delta)
		queue_redraw()
		return

	if is_on_floor():
		coyote = COYOTE_TIME
	else:
		coyote = maxf(0.0, coyote - delta)

	var keyboard := Input.get_axis("move_left", "move_right")
	var axis := touch_move.x if absf(touch_move.x) > 0.06 else keyboard
	var target := axis * SPEED * movement_speed_multiplier()
	var accel := GROUND_ACCEL if is_on_floor() else AIR_ACCEL
	if absf(axis) > 0.04:
		if absf(velocity.x) > 22.0 and signf(axis) != signf(velocity.x):
			accel *= TURN_ACCEL_MULT
		velocity.x = move_toward(velocity.x, target, accel * delta)
		facing = signf(axis)
	else:
		velocity.x = move_toward(velocity.x, 0.0, (FRICTION if is_on_floor() else AIR_ACCEL * 0.28) * delta)

	var touch_jump := touch_move.y < -0.57
	if touch_move.y > -0.25:
		touch_jump_latched = false
	if Input.is_action_just_pressed("jump") or (touch_jump and not touch_jump_latched):
		jump_buffer = JUMP_BUFFER
		touch_jump_latched = touch_jump
	else:
		jump_buffer = maxf(0.0, jump_buffer - delta)
	if jump_buffer > 0.0 and coyote > 0.0:
		velocity.y = -JUMP_SPEED
		jump_buffer = 0.0
		coyote = 0.0
		camera_trauma = maxf(camera_trauma, 0.06)

	var jump_held := Input.is_action_pressed("jump") or touch_jump
	if not is_on_floor():
		var gravity_scale := APEX_GRAVITY_SCALE if jump_held and absf(velocity.y) < 95.0 else 1.0
		velocity.y += GRAVITY * gravity_scale * delta
		if velocity.y < -180.0 and not jump_held:
			velocity.y += GRAVITY * 1.65 * delta
	velocity.y = minf(velocity.y, 850.0)
	previous_fall_speed = maxf(0.0, velocity.y)
	move_and_slide()
	_handle_landing()

	var primary := Input.is_action_pressed("primary") or touch_primary
	var primary_pressed := primary and not primary_prev
	if primary_pressed:
		attack_buffer = ATTACK_BUFFER
	if primary or attack_buffer > 0.0:
		_primary_action(delta, primary)
	else:
		_reset_mining()
	primary_prev = primary
	if Input.is_action_just_pressed("place"):
		context_action()
	queue_redraw()

func _handle_landing() -> void:
	var grounded := is_on_floor()
	if grounded and not was_on_floor and previous_fall_speed > 240.0:
		landing_strength = clampf((previous_fall_speed - 240.0) / 450.0, 0.15, 1.0)
		landing_squash = 0.16 + landing_strength * 0.08
		camera_trauma = maxf(camera_trauma, 0.08 + landing_strength * 0.14)
		if world != null:
			world.feedback_burst(global_position + Vector2(0, 20), Color("b8a77d"), 4 + int(landing_strength * 4.0), 58.0)
	was_on_floor = grounded

func _aim_direction() -> Vector2:
	if touch_primary or touch_aim != Vector2.RIGHT:
		return touch_aim.normalized()
	var d := get_global_mouse_position() - global_position
	return d.normalized() if d.length_squared() > 4.0 else Vector2(facing, 0)

func _primary_action(delta: float, held: bool = true) -> void:
	var aim := _aim_direction()
	if absf(aim.x) > 0.1:
		facing = signf(aim.x)
	var enemy := _enemy_in_aim(aim)
	if enemy != null:
		_reset_mining()
		if attack_timer <= 0.0 and (held or attack_buffer > 0.0):
			_start_attack(enemy, aim)
			attack_buffer = 0.0
		return
	var harvestable := _harvestable_in_aim(aim)
	if harvestable != null and can_harvest_target(harvestable):
		_reset_mining()
		if attack_timer <= 0.0 and (held or attack_buffer > 0.0):
			_start_attack(harvestable, aim)
			attack_buffer = 0.0
		return
	if attack_timer > 0.0 or not held:
		_reset_mining()
		return
	var target_cell := _first_solid_cell(aim)
	if target_cell == Vector2i(99999, 99999):
		if mine_cell != Vector2i(99999, 99999) and mine_grace > 0.0:
			mine_grace = maxf(0.0, mine_grace - delta)
			return
		_reset_mining()
		return
	if target_cell != mine_cell:
		mine_cell = target_cell
		mine_progress = 0.0
	mine_grace = MINE_STICK_GRACE
	mine_progress += delta
	var need := effective_mine_time(target_cell)
	if need <= 0.0:
		_reset_mining()
		return
	world.set_mining_feedback(target_cell, clampf(mine_progress / need, 0.0, 1.0))
	if mine_progress >= need:
		harvest_cell(target_cell)
		mine_progress = 0.0
		mine_cell = Vector2i(99999, 99999)
		mine_grace = 0.0
		world.clear_mining_feedback()

func harvest_cell(cell: Vector2i) -> bool:
	if world == null or not world.has_cell(cell):
		return false
	if pick_power() + 0.001 < world.required_pick_power(cell):
		return false
	var tile := world.tile_at(cell)
	var center := world.cell_center(cell)
	if not world.mine_at(cell, pick_power(), "player"):
		return false
	camera_trauma = maxf(camera_trauma, 0.075)
	hitstop = maxf(hitstop, 0.018)
	world.feedback_burst(center, Color("c8b17e"), 7, 92.0)
	world.spawn_material_pickup(center, tile, self)
	return true

func tile_item_id(tile: int) -> String:
	return "stone" if tile == SliceWorld.STONE else "soil"

func add_item(item_id: String, amount := 1) -> void:
	if amount <= 0:
		return
	stock[item_id] = item_count(item_id) + amount

func item_count(item_id: String) -> int:
	return int(stock.get(item_id, 0))

func spend_item(item_id: String, amount := 1) -> bool:
	if amount <= 0:
		return true
	var have := item_count(item_id)
	if have < amount:
		return false
	stock[item_id] = have - amount
	return true

func add_material(tile: int, amount := 1) -> void:
	add_item(tile_item_id(tile), amount)

func material_count(tile: int) -> int:
	return item_count(tile_item_id(tile))

func spend_material(tile: int, amount := 1) -> bool:
	return spend_item(tile_item_id(tile), amount)

func place_material_at(cell: Vector2i, tile := SliceWorld.DIRT) -> bool:
	var item_id := tile_item_id(tile)
	if world == null or item_count(item_id) <= 0:
		return false
	if not world.place_at(cell, tile, "player"):
		return false
	spend_item(item_id, 1)
	var center := world.cell_center(cell)
	camera_trauma = maxf(camera_trauma, 0.04)
	world.feedback_burst(center, Color("96b677"), 5, 70.0)
	return true

func pick_power() -> float:
	match equipped_pick_id:
		"delver_pick": return DELVER_PICK_POWER
		"copper_pick": return COPPER_PICK_POWER
		"stone_pick": return STONE_PICK_POWER
		"starter_pick": return 1.0 # legacy proof-save compatibility only
		_: return 0.0

func effective_mine_time(cell: Vector2i) -> float:
	if world == null:
		return 0.0
	if pick_power() + 0.001 < world.required_pick_power(cell):
		return 0.0
	var base := world.mine_time(cell)
	return base / maxf(1.0, pick_power())

func melee_damage() -> float:
	var multiplier := STONE_BLADE_REFERENCE_DAMAGE / STARTER_BLADE_REFERENCE_DAMAGE if equipped_weapon_id == "stone_blade" else 1.0
	return SLICE_BASE_MELEE_DAMAGE * multiplier

func melee_force() -> float:
	var multiplier := STONE_BLADE_REFERENCE_KNOCKBACK / STARTER_BLADE_REFERENCE_KNOCKBACK if equipped_weapon_id == "stone_blade" else 1.0
	return SLICE_BASE_MELEE_FORCE * multiplier

func movement_speed_multiplier() -> float:
	if hunger <= 0.0:
		return 0.78
	if hunger < 20.0:
		return 0.88
	return 1.0

func _update_survival(delta: float) -> void:
	hunger = maxf(0.0, hunger - HUNGER_DRAIN_PER_SEC * delta)
	if hunger <= 0.0:
		starvation_tick += delta
		if starvation_tick >= STARVATION_DAMAGE_INTERVAL:
			starvation_tick = 0.0
			health = maxf(0.0, health - STARVATION_DAMAGE)
			if health <= 0.0:
				_respawn_after_death()
	else:
		starvation_tick = 0.0
	var resting := velocity.length() <= CAMP_REST_MAX_SPEED and attack_timer <= 0.0 and invuln <= 0.0
	if world != null and hunger >= CAMP_REST_MIN_HUNGER and health < max_health and resting and world.near_campfire(global_position):
		health = minf(max_health, health + CAMP_REST_HEAL_PER_SEC * delta)

func food_nourish(item_id: String) -> float:
	match item_id:
		"raw_meat": return RAW_MEAT_NOURISH
		"trail_ration": return TRAIL_RATION_NOURISH
		_: return 0.0

func eat_item(item_id: String) -> bool:
	var nourish := food_nourish(item_id)
	if nourish <= 0.0 or item_count(item_id) <= 0 or hunger >= HUNGER_MAX - 1.0:
		return false
	if not spend_item(item_id, 1):
		return false
	hunger = minf(HUNGER_MAX, hunger + nourish)
	starvation_tick = 0.0
	if world != null:
		world.feedback_burst(global_position + Vector2(0, -22), Color("d8a45d"), 5, 54.0)
	return true

func preferred_food_id() -> String:
	if item_count("trail_ration") > 0:
		return "trail_ration"
	if item_count("raw_meat") > 0:
		return "raw_meat"
	return ""

func can_craft(recipe_id: String) -> bool:
	return CraftingScript.can_craft(self, recipe_id)

func craft(recipe_id: String) -> bool:
	if not CraftingScript.craft(self, recipe_id):
		return false
	if recipe_id == "stone_pick":
		equipped_pick_id = "stone_pick"
	elif recipe_id == "copper_pick":
		equipped_pick_id = "copper_pick"
	elif recipe_id == "delver_pick":
		equipped_pick_id = "delver_pick"
	elif recipe_id == "stone_blade":
		equipped_weapon_id = "stone_blade"
	camera_trauma = maxf(camera_trauma, 0.025)
	if world != null:
		world.feedback_burst(global_position + Vector2(0, -24), Color("d1aa6f"), 6, 62.0)
	return true

func context_label() -> String:
	var food := preferred_food_id()
	if hunger <= 25.0 and not food.is_empty():
		return "食"
	if world != null and not world.has_workbench():
		if item_count("workbench") > 0:
			return "台"
		if can_craft("workbench") or can_craft("plank"):
			return "制"
	if world != null and world.near_workbench(global_position):
		if can_craft("delver_pick"):
			return "遗"
		if can_craft("copper_pick"):
			return "铜"
		if can_craft("stone_pick"):
			return "镐"
		if can_craft("stone_blade"):
			return "刃"
	if world != null and not world.has_campfire():
		if item_count("campfire") > 0:
			return "火"
		if can_craft("campfire"):
			return "制"
	if can_craft("copper_bar"):
		return "炼"
	if can_craft("trail_ration"):
		return "烤"
	if hunger < 65.0 and not food.is_empty():
		return "食"
	return "置"

func context_action() -> bool:
	var food := preferred_food_id()
	if hunger <= 25.0 and not food.is_empty():
		return eat_item(food)
	if world != null and not world.has_workbench():
		if item_count("workbench") > 0:
			return place_workbench_once()
		if can_craft("workbench"):
			return craft("workbench")
		if can_craft("plank"):
			return craft("plank")
	if world != null and world.near_workbench(global_position):
		if can_craft("delver_pick"):
			return craft("delver_pick")
		if can_craft("copper_pick"):
			return craft("copper_pick")
		if can_craft("stone_pick"):
			return craft("stone_pick")
		if can_craft("stone_blade"):
			return craft("stone_blade")
	if world != null and not world.has_campfire():
		if item_count("campfire") > 0:
			return place_campfire_once()
		if can_craft("campfire"):
			return craft("campfire")
	if can_craft("copper_bar"):
		return craft("copper_bar")
	if can_craft("trail_ration"):
		return craft("trail_ration")
	if hunger < 65.0 and not food.is_empty():
		return eat_item(food)
	place_once()
	return true

func _reset_mining() -> void:
	mine_progress = 0.0
	mine_cell = Vector2i(99999, 99999)
	mine_grace = 0.0
	if world != null:
		world.clear_mining_feedback()

func _start_attack(target: Node2D, aim: Vector2) -> void:
	attack_timer = ATTACK_TOTAL
	attack_connected = false
	attack_target = target
	attack_aim = aim.normalized()
	if is_on_floor() and absf(attack_aim.x) > 0.25:
		velocity.x += attack_aim.x * ATTACK_STEP_SPEED
		velocity.x = clampf(velocity.x, -SPEED * 1.08, SPEED * 1.08)

func _update_attack(delta: float) -> void:
	if attack_timer <= 0.0:
		attack_target = null
		return
	var previous := attack_timer
	attack_timer = maxf(0.0, attack_timer - delta)
	var active_start := ATTACK_RECOVERY + ATTACK_ACTIVE
	var active_end := ATTACK_RECOVERY
	if not attack_connected and previous >= active_end and attack_timer <= active_start:
		_connect_attack()

func _connect_attack() -> void:
	if attack_target == null or not is_instance_valid(attack_target):
		return
	var offset := attack_target.global_position - global_position
	if offset.length() > MELEE_HIT_RANGE or offset.normalized().dot(attack_aim) < 0.20:
		return
	attack_connected = true
	var force := offset.normalized() * melee_force() + Vector2.UP * 125.0
	if not attack_target.has_method("apply_hit"):
		return
	attack_target.apply_hit(melee_damage(), force)
	hitstop = 0.042
	camera_trauma = maxf(camera_trauma, 0.19)
	if world != null:
		world.feedback_burst(attack_target.global_position, Color("f0d68f"), 8, 125.0)

func attack_phase() -> float:
	return 0.0 if ATTACK_TOTAL <= 0.0 else 1.0 - attack_timer / ATTACK_TOTAL

func _enemy_in_aim(aim: Vector2) -> Node2D:
	var best: Node2D = null
	var best_d := MELEE_ACQUIRE_RANGE
	for node in get_tree().get_nodes_in_group("enemies"):
		if not is_instance_valid(node):
			continue
		var offset: Vector2 = node.global_position - global_position
		var dist := offset.length()
		if dist > best_d or dist < 0.01:
			continue
		if offset.normalized().dot(aim) < 0.34:
			continue
		best = node
		best_d = dist
	return best


func can_harvest_target(target: Node) -> bool:
	if target is SliceTreeResource:
		return not equipped_axe_id.is_empty()
	return true

func _harvestable_in_aim(aim: Vector2) -> Node2D:
	var best: Node2D = null
	var best_d := 118.0
	for node in get_tree().get_nodes_in_group("harvestables"):
		if not is_instance_valid(node) or not node is Node2D:
			continue
		var offset: Vector2 = node.global_position + Vector2(0, -28) - global_position
		var dist := offset.length()
		if dist > best_d or dist < 0.01:
			continue
		if offset.normalized().dot(aim) < 0.28:
			continue
		best = node
		best_d = dist
	return best

func _first_solid_cell(aim: Vector2) -> Vector2i:
	if world == null:
		return Vector2i(99999, 99999)
	for i in range(2, 10):
		var p := global_position + Vector2(0, -8) + aim * (float(i) * REACH / 9.0)
		var cell := world.world_to_cell(p)
		if world.has_cell(cell):
			return cell
	return Vector2i(99999, 99999)

func _placement_cell() -> Vector2i:
	if world == null:
		return Vector2i(99999, 99999)
	var aim := _aim_direction()
	var last_empty := world.world_to_cell(global_position + aim * 30.0)
	for i in range(2, 10):
		var p := global_position + aim * (float(i) * REACH / 9.0)
		var cell := world.world_to_cell(p)
		if world.has_cell(cell):
			break
		last_empty = cell
	var center := world.cell_center(last_empty)
	if center.distance_to(global_position) < 34.0:
		return Vector2i(99999, 99999)
	return last_empty

func place_once() -> void:
	var cell := _placement_cell()
	if cell != Vector2i(99999, 99999):
		place_material_at(cell, SliceWorld.DIRT)

func place_workbench_at(cell: Vector2i) -> bool:
	if world == null or item_count("workbench") <= 0:
		return false
	var bench := world.spawn_workbench(cell, "player")
	if bench == null:
		return false
	spend_item("workbench", 1)
	camera_trauma = maxf(camera_trauma, 0.06)
	return true

func place_workbench_once() -> bool:
	var cell := _placement_cell()
	if cell == Vector2i(99999, 99999):
		return false
	return place_workbench_at(cell)

func place_campfire_at(cell: Vector2i) -> bool:
	if world == null or item_count("campfire") <= 0:
		return false
	var fire := world.spawn_campfire(cell, "player")
	if fire == null:
		return false
	spend_item("campfire", 1)
	camera_trauma = maxf(camera_trauma, 0.07)
	return true

func place_campfire_once() -> bool:
	var cell := _placement_cell()
	if cell == Vector2i(99999, 99999):
		return false
	return place_campfire_at(cell)

func take_damage(amount: float, knockback := Vector2.ZERO) -> void:
	if invuln > 0.0:
		return
	health = maxf(0.0, health - amount)
	invuln = 0.48
	hurt_flash = 0.16
	hitstop = 0.055
	velocity += knockback
	camera_trauma = maxf(camera_trauma, 0.34)
	if world != null:
		world.feedback_burst(global_position, Color("ef8b73"), 9, 135.0)
	if health <= 0.0:
		_respawn_after_death()

func _respawn_after_death() -> void:
	health = max_health
	hunger = maxf(35.0, hunger)
	starvation_tick = 0.0
	if world != null:
		global_position = Vector2(0, world.surface_y_at(0) * SliceWorld.TILE_SIZE - 60.0)
	velocity = Vector2.ZERO

func _update_camera() -> void:
	var cam := get_node_or_null("Camera2D") as Camera2D
	if cam == null:
		return
	var lead_x := clampf(velocity.x * 0.11, -38.0, 38.0) + facing * 12.0
	var lead_y := clampf(velocity.y * 0.035, -18.0, 22.0) - 16.0
	cam.position = cam.position.lerp(Vector2(lead_x, lead_y), 0.075)
	if camera_trauma <= 0.001:
		cam.offset = cam.offset.lerp(Vector2.ZERO, 0.30)
		return
	var power := camera_trauma * camera_trauma
	cam.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * 9.0 * power

func _draw() -> void:
	var squash := clampf(landing_squash * 3.6, 0.0, 0.22)
	var sx := 1.0 + squash
	var sy := 1.0 - squash * 0.72
	var body_color := Color("d8c08a") if hurt_flash <= 0.0 else Color("ef8b73")
	draw_set_transform(Vector2(0, 18.0 * (1.0 - sy)), 0.0, Vector2(sx, sy))
	draw_rect(Rect2(-10, -27, 20, 31), body_color)
	draw_rect(Rect2(-8, -35, 16, 11), Color("c7b07c"))
	draw_rect(Rect2(-12, 3, 9, 19), Color("4f6672"))
	draw_rect(Rect2(3, 3, 9, 19), Color("4f6672"))
	var hand := Vector2(facing * 10.0, -12.0)
	var phase := attack_phase()
	var swing := 0.0
	if attack_timer > 0.0:
		swing = sin(clampf(phase, 0.0, 1.0) * PI) * 18.0
	var blade_end := hand + Vector2(facing * (22.0 + swing), 4.0 - swing * 0.42)
	draw_line(hand, blade_end, Color("d8e2df"), 4.0)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
