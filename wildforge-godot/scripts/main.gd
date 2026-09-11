extends Node2D

const WorldScript = preload("res://scripts/world/block_world.gd")
const PlayerScript = preload("res://scripts/player/player.gd")
const EnemyScript = preload("res://scripts/enemies/crawler.gd")
const BoarScript = preload("res://scripts/enemies/bramble_boar.gd")
const TouchScript = preload("res://scripts/ui/mobile_controls.gd")
const TreeScript = preload("res://scripts/world/tree_resource.gd")

var world: SliceWorld
var player: SlicePlayer
var defeats := 0

func _ready() -> void:
	RenderingServer.set_default_clear_color(Color("0b171d"))
	_configure_input()
	world = WorldScript.new()
	world.name = "World"
	add_child(world)
	player = PlayerScript.new()
	player.name = "Player"
	player.world = world
	player.global_position = Vector2(0, world.surface_y_at(0) * SliceWorld.TILE_SIZE - 62.0)
	add_child(player)
	var camera := Camera2D.new()
	camera.name = "Camera2D"
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 10.5
	camera.limit_left = int((SliceWorld.MIN_X - 2) * SliceWorld.TILE_SIZE)
	camera.limit_right = int((SliceWorld.MAX_X + 2) * SliceWorld.TILE_SIZE)
	camera.limit_top = -800
	camera.limit_bottom = int((SliceWorld.MAX_Y + 2) * SliceWorld.TILE_SIZE)
	player.add_child(camera)
	_spawn_tree(-5)
	_spawn_tree(3)
	_spawn_tree(14)
	_spawn_enemy(-10)
	_spawn_enemy(8)
	_spawn_boar(17)
	var ui_layer := CanvasLayer.new()
	ui_layer.name = "UI"
	ui_layer.layer = 10
	add_child(ui_layer)
	var touch := TouchScript.new()
	touch.name = "TouchControls"
	touch.player = player
	ui_layer.add_child(touch)

func _spawn_tree(x: int) -> void:
	var tree := TreeScript.new() as SliceTreeResource
	tree.name = "Tree_%d" % x
	tree.world = world
	tree.player = player
	tree.global_position = Vector2(x * SliceWorld.TILE_SIZE + SliceWorld.TILE_SIZE * 0.5, world.surface_y_at(x) * SliceWorld.TILE_SIZE)
	tree.z_index = 5
	add_child(tree)

func _spawn_enemy(x: int, loot_item_id := "", loot_min := 0, loot_max := 0) -> void:
	var enemy := EnemyScript.new()
	enemy.name = "Crawler_%d_%d" % [x, Time.get_ticks_msec()]
	enemy.player = player
	enemy.loot_item_id = loot_item_id
	enemy.loot_min = loot_min
	enemy.loot_max = loot_max
	enemy.global_position = Vector2(x * SliceWorld.TILE_SIZE, world.surface_y_at(x) * SliceWorld.TILE_SIZE - 28.0)
	add_child(enemy)

func _spawn_boar(x: int) -> void:
	var boar := BoarScript.new() as SliceBrambleBoar
	boar.name = "BrambleBoar_%d_%d" % [x, Time.get_ticks_msec()]
	boar.player = player
	boar.global_position = Vector2(x * SliceWorld.TILE_SIZE, world.surface_y_at(x) * SliceWorld.TILE_SIZE - 30.0)
	add_child(boar)

func enemy_defeated(at: Vector2, loot_item_id := "", loot_count := 0) -> void:
	defeats += 1
	if world != null:
		world.feedback_burst(at, Color("9fd98b"), 12, 155.0)
		if not loot_item_id.is_empty() and loot_count > 0:
			world.spawn_item_pickup(at, loot_item_id, player, loot_count)

func _configure_input() -> void:
	_add_keys("move_left", [KEY_A, KEY_LEFT])
	_add_keys("move_right", [KEY_D, KEY_RIGHT])
	_add_keys("jump", [KEY_SPACE, KEY_W, KEY_UP])
	_add_mouse("primary", MOUSE_BUTTON_LEFT)
	_add_mouse("place", MOUSE_BUTTON_RIGHT)

func _add_keys(action: StringName, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for code in keys:
		var found := false
		for existing in InputMap.action_get_events(action):
			if existing is InputEventKey and existing.keycode == code:
				found = true
				break
		if found:
			continue
		var event := InputEventKey.new()
		event.keycode = code
		InputMap.action_add_event(action, event)

func _add_mouse(action: StringName, button: MouseButton) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for existing in InputMap.action_get_events(action):
		if existing is InputEventMouseButton and existing.button_index == button:
			return
	var event := InputEventMouseButton.new()
	event.button_index = button
	InputMap.action_add_event(action, event)
