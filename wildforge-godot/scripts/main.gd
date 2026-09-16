extends Node2D

const WorldScript = preload("res://scripts/world/block_world.gd")
const PlayerScript = preload("res://scripts/player/player.gd")
const EnemyScript = preload("res://scripts/enemies/crawler.gd")
const BoarScript = preload("res://scripts/enemies/bramble_boar.gd")
const TouchScript = preload("res://scripts/ui/mobile_controls.gd")
const WorldActorAuthorityScript = preload("res://scripts/world/actors/world_actor_authority.gd")
const SaveScript = preload("res://scripts/save/slice_save_system.gd")
const DialogueScript = preload("res://scripts/ui/dialogue_overlay.gd")
const PauseScript = preload("res://scripts/ui/pause_overlay.gd")
const InventoryScript = preload("res://scripts/ui/inventory_overlay.gd")

var world: SliceWorld
var player: SlicePlayer
var actor_authority: SliceWorldActorAuthority
var dialogue_overlay: SliceDialogueOverlay
var touch_controls: SliceTouchControls
var pause_overlay: SlicePauseOverlay
var inventory_overlay: SliceInventoryOverlay
var defeats := 0
var active_merchant_settlement := ""
var active_interaction_kind := ""
var active_actor_id := ""
var dialogue_health := 0.0
var warehouse_transfer: Dictionary = {}
var autosave_elapsed := 0.0
const AUTOSAVE_INTERVAL := 20.0
const START_SAFE_RADIUS_CELLS := 20
const STARTER_CRAWLER_CELLS := [-34, 32]
const STARTER_BOAR_CELL := -24

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
	_spawn_starting_threats()
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
	inventory_overlay = InventoryScript.new() as SliceInventoryOverlay
	inventory_overlay.name = "InventoryOverlay"
	inventory_overlay.player = player
	inventory_overlay.open_requested.connect(_open_inventory)
	inventory_overlay.close_requested.connect(_close_inventory)
	ui_layer.add_child(inventory_overlay)
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
	pause_overlay = PauseScript.new() as SlicePauseOverlay
	pause_overlay.name = "PauseOverlay"
	pause_overlay.resume_requested.connect(_resume_from_pause)
	pause_overlay.save_requested.connect(_save_from_pause)
	pause_overlay.quit_requested.connect(_save_and_quit)
	ui_layer.add_child(pause_overlay)
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
	_spawn_starting_threats()
	return true

func _open_dialogue(payload: Dictionary) -> void:
	if dialogue_overlay == null or player == null:
		return
	if inventory_overlay != null and inventory_overlay.is_open():
		return
	var presented := payload.duplicate(true)
	active_merchant_settlement = ""
	active_interaction_kind = String(payload.get("npc_kind", ""))
	active_actor_id = String(payload.get("actor_id", ""))
	var contacted_settlement := String(payload.get("settlement_id", ""))
	if world != null and world.progression_authority != null and not contacted_settlement.is_empty():
		world.progression_authority.record_settlement_contact(contacted_settlement)
		if active_interaction_kind in ["merchant", "guard"]:
			world.progression_authority.observe_settlement_tension(contacted_settlement)
			var guidance_line := _progression_dialogue_line(active_interaction_kind, world.progression_authority.guidance_snapshot())
			if not guidance_line.is_empty():
				var guidance_lines: Array = (presented.get("dialogue", []) as Array).duplicate()
				guidance_lines.append(guidance_line)
				presented["dialogue"] = guidance_lines
	dialogue_health = player.health
	warehouse_transfer.clear()
	if active_interaction_kind in ["merchant", "warehouse", "lost_cargo", "player_storage"]:
		active_merchant_settlement = active_actor_id if active_interaction_kind in ["lost_cargo", "player_storage"] else String(payload.get("settlement_id", ""))
		presented["market"] = _market_view(active_merchant_settlement)
		if active_interaction_kind == "merchant" and world.settlement_authority.market_closed_to_player(active_merchant_settlement):
			presented["dialogue"] = ["你的名字在通缉令上。这里不会与你交易。"]
	if active_interaction_kind == "bounty_board":
		active_merchant_settlement = contacted_settlement
		var bounty := world.faction_authority.bounty_for_settlement(contacted_settlement)
		if bounty.is_empty():
			presented["dialogue"] = ["目前没有对外发布的人物悬赏。战争并不意味着财政能无限开价。"]
		else:
			var status := String(bounty.get("status", ""))
			presented["dialogue"] = ["目标：%s · %s。赏金 %d◆。这份悬赏绑定此人的身份，继任者不是同一个目标。" % [String(bounty.get("target_name", "未知")), String(bounty.get("target_role", "敌对人员")), int(bounty.get("reward", 0))]]
			presented["bounty_id"] = String(bounty.get("id", ""))
			presented["security_action"] = "领取赏金 · %d◆" % int(bounty.get("reward", 0)) if status == "fulfilled" else ("接受人物悬赏" if status == "posted" else "已接受 · 追踪该目标")
	if active_interaction_kind == "guard":
		var player_bounty := int(payload.get("bounty", 0))
		presented["security_action"] = "搜取仓库钥匙" if bool(payload.get("guard_dead", false)) else ("缴纳悬赏 · %d◆" % player_bounty if player_bounty > 0 else "拔刀挑战守卫（将被通缉）")
	elif active_interaction_kind == "warehouse":
		presented["security_action"] = "用钥匙开锁" if world.settlement_authority.warehouse_locked(active_merchant_settlement) else ""
	if active_interaction_kind == "player_storage":
		presented["security_action"] = "收起空箱"
	elif active_interaction_kind == "workbench":
		presented["security_action"] = "制作储物箱 · 8木板 + 2石块"
	if active_interaction_kind == "merchant" and actor_authority.beast_state().is_empty() and not world.settlement_authority.market_closed_to_player(active_merchant_settlement) and (world.progression_authority == null or world.progression_authority.allows_local_market()):
		presented["security_action"] = "购置苔背驮兽 · 240◆"
	if active_actor_id == SliceWorldActorAuthority.BEAST_ID:
		presented["security_action"] = _beast_action_label()
		presented["beast_care"] = float(actor_authority.beast_state().get("health", 0)) > 0
	presented["storage_routes"] = actor_authority.storage_destinations()
	player.interaction_locked = true
	if touch_controls != null:
		touch_controls.set_interaction_blocked(true)
	dialogue_overlay.open_dialogue(presented)

func _progression_dialogue_line(speaker_kind: String, guide: Dictionary) -> String:
	var kind := String(guide.get("kind", ""))
	var merchant := speaker_kind == "merchant"
	match kind:
		"survival": return "钱以后再赚。先让自己有工具、有吃的、天黑后还能活着回来。" if merchant else "先把荒野活明白。连自己都护不住时，远方的纷争与你没有关系。"
		"first_foothold": return "先认清这里卖什么、缺什么，也认清哪条路能把你安全带回来。" if merchant else "先让镇里的人认得你。站稳脚跟之后，外面的路才值得走。"
		"discover_second_region", "discover_all_regions": return "只盯着一个集市，看不出货物真正的价值。去别的地区看看它们出什么、又缺什么。" if merchant else "别把一个聚落当成整个世界。远处还有别的旗帜、别的守卫，也有不同的规矩。"
		"prove_logistics": return "同一个摊位上倒手不算商路。把一地真正出产的货送到另一地真正缺货的地方，才算跑通。" if merchant else "能走到第二个地方只是远行；能把物资安全送过去，才算真正有了长途能力。"
		"foothold_maturing": return "货路刚有雏形，别急着把一次远行当成常态。多准备补给，让它经得住来回。" if merchant else "远行的本事有了，但路还没变成秩序。先把来回都走稳。"
		"establish_exchange": return "三地都见过还不够。真正的跨势力商队得完整走完一程，关系才会被货物改变。" if merchant else "道路已经连上，但还要看不同旗帜之间能不能让商队真正通过。"
		"watch_supply_pressure": return "不用刻意制造麻烦。盯着库存和缺货，哪里的供需绷紧，哪里的商路自然会先承压。" if merchant else "别为了看战争去挑战争。先看商队减少、仓库吃紧和道路异常，这些都会留下痕迹。"
		"roads_maturing": return "让货再多走几轮。稳定商路靠持续供需，不靠一次暴利。" if merchant else "现在最重要的是看这些道路能不能长期维持，而不是催着世界往下走。"
		"observe_tension": return "听说不等于看见。去警戒最重的聚落或受阻商路亲眼看看，再决定货还要不要往那里送。" if merchant else "边境有传闻，但传闻不是军情。去守卫加倍、道路受阻的地方亲自确认。"
		"watch_border_pressure": return "你已经看到裂痕了。接下来每一次断货、绕路和补给都会让局势往不同方向走。" if merchant else "裂痕已经摆在眼前。是否继续恶化，要看之后的补给、贸易和冲突。"
		"fracture_maturing": return "现在不必追着战争跑。你可以补给弱的一方，也可以让贸易把关系重新拉回来。" if merchant else "局势紧张，但还没有谁规定一定要开战。你做的每件事都可能改变下一步。"
		"maintain_balance": return "三边还能做生意，就是一种力量。继续维持货路，和平本身也能把世界推向成熟。" if merchant else "没有战争不代表没有进展。能把三边稳住，同样是在改变格局。"
		"active_conflict": return "前线最缺的不是口号，是能真正送到的补给。运货、断货、撤走，都有实际后果。" if merchant else "战事已经发生。参战、护送补给、撤离或者袖手旁观，都会留下真实结果。"
		"postwar_recovery": return "先看人回不回来、路修不修得通、仓库能不能补满。战争结束不等于世界立刻复原。" if merchant else "仗停了，善后才刚开始。人口、道路和补给恢复之前，别把安静当成痊愈。"
		"shape_region": return "现在没有一条唯一正确的路。做商人、做掠夺者、扶持一方，或者维持平衡，都由你。" if merchant else "世界已经容得下大战，但没有谁逼你拔剑。选择哪一边，甚至不选，都是选择。"
		"open_sandbox": return "现在货物、旗帜和财富都可能重新流向别处。你做的不是任务，是在改这个地方的现实。" if merchant else "旧秩序已经可以被改写。守住、夺走、扶植或放弃，后果都由世界自己记住。"
	return ""

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
	var era_allows_market := world.progression_authority == null or world.progression_authority.allows_local_market()
	quote["enabled"] = era_allows_market and (active_interaction_kind == "warehouse" or not world.settlement_authority.market_closed_to_player(settlement_id))
	quote["era_locked"] = not era_allows_market
	quote["world_era"] = world.progression_authority.era_name() if world.progression_authority != null else ""
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
	quote["relief_relevant"] = world.progression_authority != null and world.progression_authority.allows_tension() and String(quote.get("shortage_severity", "stable")) != "stable" and int(world.settlement_authority.production_profile(settlement_id).get(item_id, 0)) <= 0
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
		var messages := {"wanted": "你已被本势力通缉，商人拒绝交易。", "demand_filled": "当前不需要这么多货物，请减少数量。", "overburdened": "负重已满，先卸下或出售部分货物。", "not_at_market": "请靠近商人后再交易。", "stock_short": "这批货已不足，请减少数量或稍后再来。", "marks_short": "钱币不足，可以先出售手头的货物。", "era_locked": "你刚刚抵达这里。先在聚落中站稳脚跟，市场会很快向你开放。"}
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
		if world.progression_authority != null:
			world.progression_authority.record_player_delivery(settlement_id, item_id)
		var feedback := "成交：+%d◆" % int(trade.get("total", 0))
		var security_recovered := int(trade.get("security_recovered", 0))
		if security_recovered > 0:
			feedback += " · 补给使当地安全 +%d" % security_recovered
		dialogue_overlay.update_market(_market_view(settlement_id, item_id, quantity), feedback)
	else:
		var messages := {"wanted": "你已被本势力通缉，商人拒绝交易。", "stolen_goods": "这里认得这批失窃物资。先把赃物带离本地，或等待失窃缺口被真实补回。", "demand_filled": "当前不需要这么多货物，请减少数量。", "overburdened": "负重已满，先卸下或出售部分货物。", "not_at_market": "请靠近商人后再交易。", "insufficient_goods": "携带的货物不足。", "treasury_short": "城库暂不足，请稍后再来。", "not_bought_here": "这里不收购这种货物。", "era_locked": "你刚刚抵达这里。先在聚落中站稳脚跟，市场会很快向你开放。"}
		dialogue_overlay.update_market(_market_view(settlement_id, item_id, quantity), String(messages.get(String(trade.get("reason", "")), "交易未完成，请重试。")))

func _on_world_event(event: Dictionary) -> void:
	var kind := String(event.get("kind", ""))
	if kind == "world_era_changed":
		if touch_controls != null:
			touch_controls.show_world_notice(_era_transition_notice(event))
		return
	if kind == "npc_succeeded":
		if actor_authority != null:
			actor_authority.sync_npc_roster(true)
		return
	if actor_authority == null:
		return
	if kind == "caravan_attacked":
		var cell = event.get("spill_cell", Vector2i(99999, 99999))
		var lost = event.get("lost_items", {})
		if cell is Vector2i and lost is Dictionary:
			actor_authority.spawn_lost_cargo(lost, cell, "商队残骸", "受袭商队遗落的真实货物", ["这批货物来自一支刚刚遇袭的商队。", "取走后可自用，也可以运往真正缺货的聚落。"], "incident:" + String(event.get("caravan_id", "")))
		actor_authority.sync_caravans(true)

func _era_transition_notice(event: Dictionary) -> String:
	var to_era := int(event.get("to", -1))
	var cause := String(event.get("cause", ""))
	match to_era:
		SliceWorldProgressionAuthority.ERA_FOOTHOLD: return "你终于在一个聚落站住了脚。这里的买卖开始真正向你敞开。"
		SliceWorldProgressionAuthority.ERA_OPEN_ROADS: return "远方的货路开始连成网络。不同地区的富余与短缺第一次真正彼此影响。"
		SliceWorldProgressionAuthority.ERA_FRACTURE: return "商路仍在运转，但边境已经露出裂痕。接下来的异常会在道路和聚落里留下痕迹。"
		SliceWorldProgressionAuthority.ERA_WARFRONT:
			return "三地已经成熟到足以承受战争，但和平仍然可以被维持。" if cause == "peaceful_maturity" else "你见过的紧张已经不再只是征兆。战争现在成为这个世界的真实可能。"
		SliceWorldProgressionAuthority.ERA_REFORGING:
			return "长期维持的平衡让地区进入新的成熟阶段。旧主权不再是唯一可能的未来。" if cause == "regional_balance" else "战争与恢复已经改变了旧秩序。接下来连主权和势力版图都可能被真实改写。"
	return ""

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
	if what == NOTIFICATION_APPLICATION_PAUSED:
		if not SaveScript.is_test_run() and world != null and player != null:
			SaveScript.save_to_path(self)
		return
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		_handle_back_request()
		return
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		if not SaveScript.is_test_run() and world != null and player != null:
			SaveScript.save_to_path(self)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("inventory") and (pause_overlay == null or not pause_overlay.visible):
		if inventory_overlay != null and inventory_overlay.is_open():
			_close_inventory()
		else:
			_open_inventory()
		get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("ui_cancel") and (pause_overlay == null or not pause_overlay.visible):
		_handle_back_request()
		get_viewport().set_input_as_handled()

func _handle_back_request() -> void:
	if dialogue_overlay != null and dialogue_overlay.visible:
		dialogue_overlay.close_dialogue()
		return
	if inventory_overlay != null and inventory_overlay.is_open():
		_close_inventory()
		return
	if pause_overlay != null and pause_overlay.visible:
		_resume_from_pause()
		return
	_show_pause_menu()

func _open_inventory() -> void:
	if inventory_overlay == null or inventory_overlay.is_open() or player == null:
		return
	if (dialogue_overlay != null and dialogue_overlay.visible) or (pause_overlay != null and pause_overlay.visible):
		return
	player.interaction_locked = true
	if touch_controls != null:
		touch_controls.set_interaction_blocked(true)
	inventory_overlay.open_for(player)

func _close_inventory() -> void:
	if inventory_overlay == null or not inventory_overlay.is_open():
		return
	inventory_overlay.close()
	if player != null:
		player.interaction_locked = false
	if touch_controls != null:
		touch_controls.set_interaction_blocked(false)

func _show_pause_menu() -> void:
	if pause_overlay == null or pause_overlay.visible:
		return
	if touch_controls != null:
		touch_controls.set_interaction_blocked(true)
	pause_overlay.open("当前进度已受自动保存保护。")
	get_tree().paused = true

func _resume_from_pause() -> void:
	get_tree().paused = false
	if pause_overlay != null:
		pause_overlay.close()
	if touch_controls != null:
		touch_controls.set_interaction_blocked(false)

func _save_from_pause() -> void:
	if pause_overlay != null:
		pause_overlay.show_save_result(save_now())

func _save_and_quit() -> void:
	if not SaveScript.is_test_run():
		save_now()
	get_tree().paused = false
	get_tree().quit()

func _spawn_starting_threats() -> void:
	for x in STARTER_CRAWLER_CELLS:
		_spawn_enemy(int(x))
	_spawn_boar(STARTER_BOAR_CELL)

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
	_add_keys("inventory", [KEY_I, KEY_TAB])
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
	if active_interaction_kind == "bounty_board":
		var bounty := world.faction_authority.bounty_for_settlement(active_merchant_settlement)
		if bounty.is_empty():
			dialogue_overlay.body_label.text = "榜上暂时没有有效悬赏。"
			dialogue_overlay.security_button.visible = false
			return
		var bounty_id := String(bounty.get("id", ""))
		var status := String(bounty.get("status", ""))
		if status == "posted":
			var accepted := world.faction_authority.accept_npc_bounty(bounty_id, active_merchant_settlement)
			dialogue_overlay.body_label.text = "悬赏已接下。要找的是这个具体的人，不是他的职位。" if bool(accepted.get("ok", false)) else "悬赏状态已经变化。"
			dialogue_overlay.security_button.text = "已接受 · 追踪该目标"
			dialogue_overlay.security_button.disabled = true
		elif status == "fulfilled":
			var claim := world.faction_authority.claim_npc_bounty(player, bounty_id, active_merchant_settlement)
			dialogue_overlay.body_label.text = "确认目标死亡，领取 %d◆。" % int(claim.get("reward", 0)) if bool(claim.get("ok", false)) else "无法领取这份赏金。"
			dialogue_overlay.security_button.visible = false
		else:
			dialogue_overlay.body_label.text = "这份悬赏已经在你手上。找到并击杀目标本人。"
			dialogue_overlay.security_button.disabled = true
		return
	if active_interaction_kind == "merchant":
		var bought := actor_authority.buy_beast(active_merchant_settlement)
		if bought and world != null and world.progression_authority != null:
			world.progression_authority.record_milestone("pack_beast_acquired")
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
		elif guard.hostile():
			var settlement_id := String(guard.payload.get("settlement_id", ""))
			var bounty := world.faction_authority.player_bounty(world.faction_authority.controller_for_settlement(settlement_id))
			var payment := mini(bounty, player.forge_marks)
			var result: Dictionary = world.settlement_authority.pay_player_bounty(player, settlement_id, payment)
			if bool(result.get("ok", false)):
				var remaining := int(result.get("remaining", 0))
				if remaining <= 0:
					dialogue_overlay.body_label.text = "已缴纳 %d◆。本势力悬赏已清除。" % int(result.get("paid", 0))
					dialogue_overlay.security_button.visible = false
				else:
					dialogue_overlay.body_label.text = "已缴纳 %d◆，尚欠悬赏 %d◆。拒捕仍可能导致监禁。" % [int(result.get("paid", 0)), remaining]
					dialogue_overlay.security_button.text = "继续缴纳 · %d◆" % remaining
					dialogue_overlay.security_button.disabled = player.forge_marks <= 0
			else:
				dialogue_overlay.body_label.text = "你身上没有可缴纳的钱币。当前悬赏 %d◆；拒捕后被击倒会被收监。" % bounty
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
	var security_loss := int(result.get("security_loss", 0))
	var theft_text := "取得 %d 份物资 · 治安 -%d · 悬赏上升，尽快撤离！" % [quantity, security_loss] if security_loss > 0 else "取得 %d 份物资 · 悬赏上升，尽快撤离！" % quantity
	var success_text := "存入 %d 份物资。" % quantity if deposit else ("取回 %d 份物资。" % quantity if recovery else theft_text)
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
