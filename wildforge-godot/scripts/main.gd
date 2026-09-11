extends Node2D

const WorldScript = preload("res://scripts/world/block_world.gd")
const PlayerScript = preload("res://scripts/player/player.gd")
const EnemyScript = preload("res://scripts/enemies/crawler.gd")
const TouchScript = preload("res://scripts/ui/mobile_controls.gd")

var world: SliceWorld
var player: SlicePlayer

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
	camera.position_smoothing_speed = 9.5
	camera.limit_left = int((SliceWorld.MIN_X - 2) * SliceWorld.TILE_SIZE)
	camera.limit_right = int((SliceWorld.MAX_X + 2) * SliceWorld.TILE_SIZE)
	camera.limit_top = -800
	camera.limit_bottom = int((SliceWorld.MAX_Y + 2) * SliceWorld.TILE_SIZE)
	player.add_child(camera)
	_spawn_enemy(-10)
	_spawn_enemy(8)
	_spawn_enemy(17)
	var ui_layer := CanvasLayer.new()
	ui_layer.name = "UI"
	ui_layer.layer = 10
	add_child(ui_layer)
	var touch := TouchScript.new()
	touch.name = "TouchControls"
	touch.player = player
	ui_layer.add_child(touch)

func _spawn_enemy(x: int) -> void:
	var enemy := EnemyScript.new()
	enemy.name = "Crawler_%d" % x
	enemy.player = player
	enemy.global_position = Vector2(x * SliceWorld.TILE_SIZE, world.surface_y_at(x) * SliceWorld.TILE_SIZE - 28.0)
	add_child(enemy)

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
