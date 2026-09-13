extends Node2D

const WorldScript = preload("res://scripts/world/block_world.gd")
const PlayerScript = preload("res://scripts/player/player.gd")
const EnemyScript = preload("res://scripts/enemies/crawler.gd")
const BoarScript = preload("res://scripts/enemies/bramble_boar.gd")
const TouchScript = preload("res://scripts/ui/mobile_controls.gd")
const WorldActorAuthorityScript = preload("res://scripts/world/actors/world_actor_authority.gd")
const SaveScript = preload("res://scripts/save/slice_save_system.gd")
const DialogueScript = preload("res://scripts/ui/dialogue_overlay.gd")

var world: SliceWorld
var player: SlicePlayer
var actor_authority: SliceWorldActorAuthority
var dialogue_overlay: SliceDialogueOverlay
var touch_controls: SliceTouchControls
var defeats := 0
var active_merchant_settlement := ""
var autosave_elapsed := 0.0
const AUTOSAVE_INTERVAL := 20.0

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
	world.set_streaming_focus(player)
	var camera := Camera2D.new()
	camera.name = "Camera2D"
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 10.5
	camera.limit_left = int((SliceWorld.MIN_X - 2) * SliceWorld.TILE_SIZE)
	camera.limit_right = int((SliceWorld.MAX_X + 2) * SliceWorld.TILE_SIZE)
	camera.limit_top = -800
	camera.limit_bottom = int((SliceWorld.MAX_Y + 2) * SliceWorld.TILE_SIZE)
	player.add_child(camera)
	_spawn_enemy(-10)
	_spawn_enemy(8)
	_spawn_boar(-18)
	actor_authority = WorldActorAuthorityScript.new(self, world, player) as SliceWorldActorAuthority
	actor_authority.register_exploration_sites(world.exploration_sites)
	actor_authority.register_vegetation_baseline(world.vegetation_baseline())
	actor_authority.register_settlement_npcs(world.baseline_settlements)
	actor_authority.dialogue_requested.connect(_open_dialogue)
	actor_authority.sync_active(world.chunk_streamer.active_keys)
	var ui_layer := CanvasLayer.new()
	ui_layer.name = "UI"
	ui_layer.layer = 10
	add_child(ui_layer)
	touch_controls = TouchScript.new() as SliceTouchControls
	touch_controls.name = "TouchControls"
	touch_controls.player = player
	ui_layer.add_child(touch_controls)
	dialogue_overlay = DialogueScript.new() as SliceDialogueOverlay
	dialogue_overlay.name = "DialogueOverlay"
	dialogue_overlay.closed.connect(_close_dialogue)
	dialogue_overlay.market_sell_requested.connect(_sell_to_active_merchant)
	ui_layer.add_child(dialogue_overlay)
	if not SaveScript.is_test_run():
		call_deferred("_load_persistent_state")

func reconfigure_world_seed(new_seed: int) -> bool:
	if world == null or player == null or actor_authority == null:
		return false
	if dialogue_overlay != null and dialogue_overlay.visible:
		dialogue_overlay.close_dialogue()
	if world.world_seed == new_seed:
		return true
	actor_authority.clear_world_baseline()
	for group_name in ["enemies", "workbenches", "campfires", "pickups"]:
		for node in get_tree().get_nodes_in_group(group_name):
			if is_instance_valid(node):
				node.free()
	if not world.rebuild_for_seed(new_seed):
		return false
	actor_authority.register_exploration_sites(world.exploration_sites)
	actor_authority.register_vegetation_baseline(world.vegetation_baseline())
	actor_authority.register_settlement_npcs(world.baseline_settlements)
	actor_authority.sync_active(world.chunk_streamer.active_keys)
	_spawn_enemy(-10)
	_spawn_enemy(8)
	_spawn_boar(-18)
	return true

func _open_dialogue(payload: Dictionary) -> void:
	if dialogue_overlay == null or player == null:
		return
	var presented := payload.duplicate(true)
	active_merchant_settlement = ""
	if String(payload.get("npc_kind", "")) == "merchant":
		active_merchant_settlement = String(payload.get("settlement_id", ""))
		presented["market"] = _market_view(active_merchant_settlement)
	player.interaction_locked = true
	if touch_controls != null:
		touch_controls.set_interaction_blocked(true)
	dialogue_overlay.open_dialogue(presented)

func _close_dialogue() -> void:
	active_merchant_settlement = ""
	if player != null:
		player.interaction_locked = false
	if touch_controls != null:
		touch_controls.set_interaction_blocked(false)

func _market_view(settlement_id: String) -> Dictionary:
	if settlement_id.is_empty() or world == null or player == null or world.settlement_authority == null:
		return {}
	var quote: Dictionary = world.settlement_authority.sale_quote(settlement_id, "raw_meat", 1)
	quote["enabled"] = true
	quote["player_count"] = player.item_count("raw_meat")
	return quote

func _sell_to_active_merchant(settlement_id: String, item_id: String, quantity: int) -> void:
	if dialogue_overlay == null or not dialogue_overlay.visible or player == null or world == null:
		return
	if settlement_id.is_empty() or settlement_id != active_merchant_settlement or item_id != "raw_meat" or quantity != 1:
		dialogue_overlay.update_market(_market_view(active_merchant_settlement), "这笔交易无效。")
		return
	var trade: Dictionary = world.settlement_authority.sell_from_player(player, settlement_id, item_id, quantity)
	if bool(trade.get("ok", false)):
		world.feedback_burst(player.global_position + Vector2(0, -24), Color("dfc36f"), 6, 55.0)
		dialogue_overlay.update_market(_market_view(settlement_id), "成交：+%d◆" % int(trade.get("total", 0)))
	else:
		dialogue_overlay.update_market(_market_view(settlement_id), "交易未完成：%s" % String(trade.get("reason", "unknown")))

func _process(delta: float) -> void:
	if SaveScript.is_test_run() or world == null or player == null:
		return
	autosave_elapsed += delta
	if autosave_elapsed >= AUTOSAVE_INTERVAL:
		autosave_elapsed = 0.0
		SaveScript.save_to_path(self)

func _load_persistent_state() -> void:
	SaveScript.load_from_path(self)
	autosave_elapsed = 0.0

func save_now() -> bool:
	if world == null or player == null:
		return false
	autosave_elapsed = 0.0
	return SaveScript.save_to_path(self)

func _notification(what: int) -> void:
	if what in [NOTIFICATION_APPLICATION_PAUSED, NOTIFICATION_WM_CLOSE_REQUEST]:
		if not SaveScript.is_test_run() and world != null and player != null:
			SaveScript.save_to_path(self)

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
