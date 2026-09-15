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
var active_interaction_kind := ""
var active_actor_id := ""
var dialogue_health := 0.0
var warehouse_transfer: Dictionary = {}
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
	world.world_event.connect(_on_world_event)
	actor_authority.sync_active(world.chunk_streamer.active_keys)
	actor_authority.sync_war_raids()
	actor_authority.sync_caravans()
	actor_authority.sync_displacements()
	actor_authority.sync_route_hazards()
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
	dialogue_overlay.market_item_selected.connect(_select_market_item)
	dialogue_overlay.market_quantity_selected.connect(_select_market_quantity)
	dialogue_overlay.market_buy_requested.connect(_buy_from_active_merchant)
	dialogue_overlay.market_route_requested.connect(_mark_market_route)
	dialogue_overlay.security_action_requested.connect(_security_action)
	dialogue_overlay.storage_route_requested.connect(_mark_storage_route)
	dialogue_overlay.beast_feed_requested.connect(_feed_beast)
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
	if touch_controls != null:
		touch_controls.travel_destination_id = ""
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
	active_interaction_kind = String(payload.get("npc_kind", ""))
	active_actor_id = String(payload.get("actor_id", ""))
	dialogue_health = player.health
	warehouse_transfer.clear()
	if active_interaction_kind in ["merchant", "warehouse", "lost_cargo", "player_storage"]:
		active_merchant_settlement = active_actor_id if active_interaction_kind in ["lost_cargo", "player_storage"] else String(payload.get("settlement_id", ""))
		presented["market"] = _market_view(active_merchant_settlement)
		if active_interaction_kind == "merchant" and world.settlement_authority.market_closed_to_player(active_merchant_settlement):
			presented["dialogue"] = ["你的名字在通缉令上。这里不会与你交易。"]
	if active_interaction_kind == "guard":
		presented["security_action"] = "搜取仓库钥匙" if bool(payload.get("guard_dead", false)) else "拔刀挑战守卫（将被通缉）"
	elif active_interaction_kind == "warehouse":
		presented["security_action"] = "用钥匙开锁" if world.settlement_authority.warehouse_locked(active_merchant_settlement) else ""
	if active_interaction_kind == "player_storage":
		presented["security_action"] = "收起空箱"
	elif active_interaction_kind == "workbench":
		presented["security_action"] = "制作储物箱 · 8木板 + 2石块"
	if active_interaction_kind == "merchant" and actor_authority.beast_state().is_empty() and not world.settlement_authority.market_closed_to_player(active_merchant_settlement):
		presented["security_action"] = "购置苔背驮兽 · 240◆"
	if active_actor_id == SliceWorldActorAuthority.BEAST_ID:
		presented["security_action"] = _beast_action_label()
		presented["beast_care"] = float(actor_authority.beast_state().get("health", 0)) > 0
	presented["storage_routes"] = actor_authority.storage_destinations()
	player.interaction_locked = true
	if touch_controls != null:
		touch_controls.set_interaction_blocked(true)
	dialogue_overlay.open_dialogue(presented)

func _close_dialogue() -> void:
	warehouse_transfer.clear()
	active_interaction_kind = ""
	active_actor_id = ""
	active_merchant_settlement = ""
	if player != null:
		player.interaction_locked = false
	if touch_controls != null:
		touch_controls.set_interaction_blocked(false)

func _market_view(settlement_id: String, selected_item := "raw_meat", quantity := 1) -> Dictionary:
	if active_interaction_kind in ["lost_cargo", "player_storage"]:
		return actor_authority.cargo_view(active_actor_id, selected_item, quantity)
	if settlement_id.is_empty() or world == null or player == null or world.settlement_authority == null:
		return {}
	var goods: Array[String] = world.settlement_authority.accepted_goods(settlement_id)
	if goods.is_empty():
		return {}
	var item_id: String = selected_item if selected_item in goods else goods[0]
	var quote: Dictionary = world.settlement_authority.sale_quote(settlement_id, item_id, quantity)
	quote["enabled"] = active_interaction_kind == "warehouse" or not world.settlement_authority.market_closed_to_player(settlement_id)
	quote["warehouse"] = active_interaction_kind == "warehouse"
	quote["locked"] = world.settlement_authority.warehouse_locked(settlement_id)
	quote["can_carry"] = player.can_carry(item_id, quantity)
	quote["weight"] = player.carried_weight()
	quote["goods"] = goods
	quote["player_count"] = player.item_count(item_id)
	quote["player_marks"] = player.forge_marks
	quote["purchase"] = world.settlement_authority.purchase_quote(settlement_id, item_id, quantity)
	quote["opportunity"] = world.settlement_authority.export_opportunity(settlement_id, item_id, quantity)
	quote["conflict_status"] = world.faction_authority.conflict_status(settlement_id) if world.faction_authority != null else "peace"
	quote["security"] = world.settlement_authority.security(settlement_id)
	quote["controller"] = world.faction_authority.controller_for_settlement(settlement_id) if world.faction_authority != null else world.settlement_authority.owner_id(settlement_id)
	return quote

func _select_market_item(item_id: String) -> void:
	if dialogue_overlay == null or not dialogue_overlay.visible or active_merchant_settlement.is_empty():
		return
	dialogue_overlay.update_market(_market_view(active_merchant_settlement, item_id, int(dialogue_overlay.active_market.get("quantity", 1))))

func _mark_market_route() -> void:
	if dialogue_overlay == null or not dialogue_overlay.visible or active_merchant_settlement.is_empty() or touch_controls == null:
		return
	var item_id := String(dialogue_overlay.active_market.get("item_id", ""))
	var quantity := int(dialogue_overlay.active_market.get("quantity", 1))
	var lead: Dictionary = world.settlement_authority.export_opportunity(active_merchant_settlement, item_id, quantity)
	if lead.is_empty():
		dialogue_overlay.update_market(_market_view(active_merchant_settlement, item_id, quantity), "行情已变化，请重新查看。")
		return
	touch_controls.travel_destination_id = String(lead["destination_id"])
	dialogue_overlay.update_market(_market_view(active_merchant_settlement, item_id, quantity), "目的地已标记，离开集市后可查看方向。")

func _select_market_quantity(quantity: int) -> void:
	if quantity not in ([1, 5, 20] if active_interaction_kind == "player_storage" else [1, 5]) or dialogue_overlay == null or not dialogue_overlay.visible or active_merchant_settlement.is_empty():
		return
	var item_id := String(dialogue_overlay.active_market.get("item_id", "raw_meat"))
	dialogue_overlay.update_market(_market_view(active_merchant_settlement, item_id, quantity))

func _buy_from_active_merchant(settlement_id: String, item_id: String, quantity: int) -> void:
	if active_interaction_kind == "player_storage" and dialogue_overlay != null and dialogue_overlay.visible:
		_start_warehouse_transfer(item_id, quantity, true)
		return
	if active_interaction_kind != "merchant":
		return
	if dialogue_overlay == null or not dialogue_overlay.visible or player == null or world == null:
		return
	if settlement_id.is_empty() or settlement_id != active_merchant_settlement or item_id not in world.settlement_authority.accepted_goods(settlement_id) or quantity not in [1, 5]:
		dialogue_overlay.update_market(_market_view(active_merchant_settlement), "这笔交易无效。")
		return
	var trade: Dictionary = world.settlement_authority.buy_to_player(player, settlement_id, item_id, quantity)
	var feedback := ""
	if bool(trade.get("ok", false)):
		world.feedback_burst(player.global_position + Vector2(0, -24), Color("dfc36f"), 6, 55.0)
		feedback = "购入 %d 份 · -%d◆" % [quantity, int(trade.get("total", 0))]
	else:
		var messages := {"wanted": "你已被本势力通缉，商人拒绝交易。", "demand_filled": "当前不需要这么多货物，请减少数量。", "overburdened": "负重已满，先卸下或出售部分货物。", "not_at_market": "请靠近商人后再交易。", "stock_short": "这批货已不足，请减少数量或稍后再来。", "marks_short": "钱币不足，可以先出售手头的货物。"}
		feedback = String(messages.get(String(trade.get("reason", "")), "交易未完成，请重试。"))
	dialogue_overlay.update_market(_market_view(settlement_id, item_id, quantity), feedback)

func _sell_to_active_merchant(settlement_id: String, item_id: String, quantity: int) -> void:
	if active_interaction_kind in ["lost_cargo", "player_storage"] and dialogue_overlay != null and dialogue_overlay.visible:
		_start_warehouse_transfer(item_id, quantity)
		return
	if dialogue_overlay == null or not dialogue_overlay.visible or player == null or world == null:
		return
	if settlement_id.is_empty() or settlement_id != active_merchant_settlement or item_id not in world.settlement_authority.accepted_goods(settlement_id) or quantity not in [1, 5]:
		dialogue_overlay.update_market(_market_view(active_merchant_settlement), "这笔交易无效。")
		return
	if active_interaction_kind == "warehouse":
		_start_warehouse_transfer(item_id, quantity)
		return
	if active_interaction_kind != "merchant":
		return
	var trade: Dictionary = world.settlement_authority.sell_from_player(player, settlement_id, item_id, quantity)
	if bool(trade.get("ok", false)):
		world.feedback_burst(player.global_position + Vector2(0, -24), Color("dfc36f"), 6, 55.0)
		dialogue_overlay.update_market(_market_view(settlement_id, item_id, quantity), "成交：+%d◆" % int(trade.get("total", 0)))
	else:
		var messages := {"wanted": "你已被本势力通缉，商人拒绝交易。", "demand_filled": "当前不需要这么多货物，请减少数量。", "overburdened": "负重已满，先卸下或出售部分货物。", "not_at_market": "请靠近商人后再交易。", "insufficient_goods": "携带的货物不足。", "treasury_short": "城库暂不足，请稍后再来。", "not_bought_here": "这里不收购这种货物。"}
		dialogue_overlay.update_market(_market_view(settlement_id, item_id, quantity), String(messages.get(String(trade.get("reason", "")), "交易未完成，请重试。")))

func _on_world_event(event: Dictionary) -> void:
	if actor_authority == null:
		return
	if String(event.get("kind", "")) == "caravan_attacked":
		var cell = event.get("spill_cell", Vector2i(99999, 99999))
		var lost = event.get("lost_items", {})
		if cell is Vector2i and lost is Dictionary:
			actor_authority.spawn_lost_cargo(lost, cell, "商队残骸", "受袭商队遗落的真实货物", ["这批货物来自一支刚刚遇袭的商队。", "取走后可自用，也可以运往真正缺货的聚落。"], "incident:" + String(event.get("caravan_id", "")))
		actor_authority.sync_caravans(true)

func _process(delta: float) -> void:
	_update_warehouse_transfer(delta)
	if actor_authority != null:
		actor_authority.sync_war_raids()
		actor_authority.sync_caravans()
		actor_authority.sync_displacements()
		actor_authority.sync_route_hazards()
		if not SaveScript.is_test_run():
			actor_authority.update_pursuit()
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

func _security_action() -> void:
	if dialogue_overlay == null or not dialogue_overlay.visible:
		return
	if active_interaction_kind == "merchant":
		var bought := actor_authority.buy_beast(active_merchant_settlement)
		dialogue_overlay.body_label.text = "驮兽在附近等你。点击它装货、喂食或让它跟随。" if bought else "需要240枚钱币，且附近要有可供驮兽站立的地面。"
		dialogue_overlay.security_button.visible = not bought
		dialogue_overlay.update_market(_market_view(active_merchant_settlement))
		return
	if active_actor_id == SliceWorldActorAuthority.BEAST_ID:
		if float(actor_authority.beast_state().get("health", 0)) <= 0:
			if actor_authority.bury_beast():
				dialogue_overlay.close_dialogue()
			else:
				dialogue_overlay.market_feedback.text = "请先取回剩余物资，再安葬驮兽。"
		else:
			actor_authority.tend_beast(false)
			dialogue_overlay.security_button.text = _beast_action_label()
		return
	if active_interaction_kind == "workbench":
		if SliceCrafting.craft(player, "storage_box"):
			dialogue_overlay.close_dialogue()
		else:
			dialogue_overlay.body_label.text = "需要靠近工作台，备好8块木板和2块石头。"
		return
	if active_interaction_kind == "player_storage":
		if actor_authority.pack_storage(active_actor_id):
			dialogue_overlay.close_dialogue()
		else:
			dialogue_overlay.market_feedback.text = "先取空箱内物资，并留出携带空箱的负重。"
		return
	if active_interaction_kind == "guard":
		var guard := actor_authority.projection_for(active_actor_id) as SliceSettlementGuard
		if guard == null or player.global_position.distance_to(guard.global_position) > 118.0:
			dialogue_overlay.close_dialogue()
			return
		if guard.health() <= 0.0:
			var taken := actor_authority.claim_guard_key(active_actor_id)
			dialogue_overlay.body_label.text = "取得仓库钥匙。通缉不会因离开城镇而解除。" if taken else "钥匙已经被取走了。"
			dialogue_overlay.security_button.disabled = true
		else:
			guard.provoke()
			dialogue_overlay.close_dialogue()
	elif active_interaction_kind == "warehouse":
		var result: Dictionary = world.settlement_authority.unlock_warehouse(player, active_merchant_settlement)
		var ok := bool(result.get("ok", false))
		dialogue_overlay.security_button.visible = not ok
		dialogue_overlay.update_market(_market_view(active_merchant_settlement), "门锁已打开，搬走物资将触发通缉。" if ok else "需要本仓库的钥匙，且必须靠近门锁。")

func _start_warehouse_transfer(item_id: String, quantity: int, deposit := false) -> void:
	if not warehouse_transfer.is_empty() or quantity not in ([1, 5, 20] if active_interaction_kind == "player_storage" else [1, 5]):
		return
	if not _at_storage(active_merchant_settlement) or (active_interaction_kind == "warehouse" and world.settlement_authority.warehouse_locked(active_merchant_settlement)):
		return
	# Reject impossible handling before starting the timer; authority rechecks on completion.
	if active_interaction_kind in ["player_storage", "lost_cargo"]:
		var view := actor_authority.cargo_view(active_actor_id, item_id, quantity)
		var permitted := actor_authority.can_deposit(active_actor_id, item_id, quantity) if deposit else (String(view.get("item_id", "")) == item_id and int(view.get("stock", 0)) >= quantity and player.can_carry(item_id, quantity))
		if not permitted:
			dialogue_overlay.update_market(view, "物资不足、载重已满或该物品不能存入，请调整数量。")
			return
	warehouse_transfer = {"beast_health": float(actor_authority.beast_state().get("health", 0)), "deposit": deposit, "town": active_merchant_settlement, "item": item_id, "quantity": quantity, "remaining": 1.4 + quantity * 0.35, "position": player.global_position}
	dialogue_overlay.market_buy_button.disabled = true
	dialogue_overlay.market_sell_button.disabled = true
	dialogue_overlay.market_item_picker.disabled = true
	dialogue_overlay.market_quantity_picker.disabled = true

func _update_warehouse_transfer(delta: float) -> void:
	if dialogue_overlay == null or not dialogue_overlay.visible or player == null:
		return
	# A menu is no refuge: being hit returns control and cancels uncompleted hauling.
	if player.health < dialogue_health:
		dialogue_overlay.close_dialogue()
		return
	dialogue_health = player.health
	if warehouse_transfer.is_empty():
		return
	if active_actor_id == SliceWorldActorAuthority.BEAST_ID and float(actor_authority.beast_state().get("health", 0)) < float(warehouse_transfer.get("beast_health", 0)):
		dialogue_overlay.close_dialogue()
		return
	var town := String(warehouse_transfer["town"])
	if not _at_storage(town) or player.global_position.distance_to(warehouse_transfer["position"]) > 28.0:
		dialogue_overlay.close_dialogue()
		return
	warehouse_transfer["remaining"] = float(warehouse_transfer["remaining"]) - delta
	dialogue_overlay.market_feedback.text = "搬运中 %.1f 秒 · 关闭或受伤会中断" % maxf(0.0, float(warehouse_transfer["remaining"]))
	if float(warehouse_transfer["remaining"]) > 0.0:
		return
	var item_id := String(warehouse_transfer["item"])
	var quantity := int(warehouse_transfer["quantity"])
	var deposit := bool(warehouse_transfer.get("deposit", false))
	warehouse_transfer.clear()
	var recovery := active_interaction_kind in ["lost_cargo", "player_storage"]
	var result: Dictionary = actor_authority.deposit_cargo(active_actor_id, item_id, quantity) if deposit else (actor_authority.recover_cargo(active_actor_id, item_id, quantity) if recovery else world.settlement_authority.loot_warehouse(player, town, item_id, quantity))
	var messages := {"storage_full": "箱子已满或可存物资不足，装备中的工具会保留。", "overburdened": "背不动了，先运走一批。", "stock_short": "库存不足，减少搬运数量。", "locked": "门锁未打开。"}
	var success_text := "存入 %d 份物资。" % quantity if deposit else ("取回 %d 份物资。" % quantity if recovery else "取得 %d 份物资 · 悬赏上升，尽快撤离！" % quantity)
	var feedback := success_text if bool(result.get("ok", false)) else String(messages.get(String(result.get("reason", "")), "搬运中断。"))
	if recovery and not actor_authority.is_projected(active_actor_id):
		dialogue_overlay.close_dialogue()
	else:
		dialogue_overlay.update_market(_market_view(town, item_id, quantity), feedback)

func _at_storage(id: String) -> bool:
	if active_interaction_kind in ["lost_cargo", "player_storage"]:
		var bag := actor_authority.projection_for(id)
		return bag != null and player.global_position.distance_to(bag.global_position) <= 112.0
	return world.settlement_authority.at_warehouse(player, id)

func drop_death_cargo(at: Vector2) -> void:
	if dialogue_overlay != null and dialogue_overlay.visible:
		dialogue_overlay.close_dialogue()
	if actor_authority != null:
		actor_authority.drop_player_cargo(at)


func _mark_storage_route(actor_id: String) -> void:
	if touch_controls == null or actor_authority.storage_position(actor_id) == Vector2.INF:
		return
	touch_controls.travel_destination_id = actor_id
	dialogue_overlay.close_dialogue()


func _beast_action_label() -> String:
	var state := actor_authority.beast_state()
	if float(state.get("health", 0)) <= 0:
		return "取空遗物后安葬"
	return "留在原地" if bool(state.get("following", false)) else "跟随我"

func _feed_beast() -> void:
	if active_actor_id != SliceWorldActorAuthority.BEAST_ID or dialogue_overlay == null or not dialogue_overlay.visible:
		return
	var fed := actor_authority.tend_beast(true)
	dialogue_overlay.update_market(_market_view(active_merchant_settlement), "喂食后恢复了体力与伤势。" if fed else "需要1份旅行口粮，且驮兽仍活着并需要照料。")
