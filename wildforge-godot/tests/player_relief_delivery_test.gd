extends SceneTree

var failed := false

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: ", message)
	else:
		failed = true
		push_error("FAIL: " + message)

func _set_market_stock(economy: SliceSettlementAuthority, town: String, item_id: String, amount: int, security_value: int) -> void:
	var row: Dictionary = economy.settlements[town]
	var inventory: Dictionary = row["inventory"]
	inventory[item_id] = amount
	row["inventory"] = inventory
	row["security"] = security_value
	row["treasury"] = 200
	economy.settlements[town] = row

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var economy := world.settlement_authority as SliceSettlementAuthority
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	var town := "verdant_mossbridge"
	player.global_position = world.cell_center(economy.market_cell(town))
	player.add_item("ice", 4)
	var era2 := {
		"era": SliceWorldProgressionAuthority.ERA_OPEN_ROADS,
		"era_entered_hour": 0,
		"milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "pack_beast_acquired"],
		"last_transition": {"from": SliceWorldProgressionAuthority.ERA_FOOTHOLD, "to": SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "cause": "open_roads", "hour": 0},
	}
	_check(progression.restore_state(era2), "fixture enters Open Roads without tension capability")
	_set_market_stock(economy, town, "ice", 0, 50)
	var early_trade := economy.sell_from_player(player, town, "ice", 1)
	_check(bool(early_trade.get("ok", false)), "ordinary Open Roads trade still succeeds")
	_check(int(early_trade.get("security_recovered", 0)) == 0 and economy.security(town) == 50, "pre-Fracture trade cannot silently become a stability mechanic")

	var era3 := {
		"era": SliceWorldProgressionAuthority.ERA_FRACTURE,
		"era_entered_hour": 0,
		"milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "settlement:ember_cinder_ridge", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst"],
		"last_transition": {"from": SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "to": SliceWorldProgressionAuthority.ERA_FRACTURE, "cause": "first_fracture", "hour": 0},
	}
	_check(progression.restore_state(era3), "fixture enters Fracture through canonical state")
	_set_market_stock(economy, town, "ice", 0, 50)
	main.active_interaction_kind = "merchant"
	main.active_merchant_settlement = town
	var relief_view: Dictionary = main._market_view(town, "ice", 1)
	_check(bool(relief_view.get("relief_relevant", false)), "market UI exposes that scarce external goods can stabilize the settlement")
	var relief := economy.sell_from_player(player, town, "ice", 2)
	_check(bool(relief.get("ok", false)), "player can deliver a genuinely scarce external good during Fracture")
	_check(int(relief.get("security_recovered", 0)) == 2, "critical external relief converts real goods into bounded local stability")
	_check(economy.security(town) == 52, "relief changes canonical settlement security rather than a quest counter")

	player.add_item("wood", 1)
	_set_market_stock(economy, town, "wood", 0, 52)
	var local_trade := economy.sell_from_player(player, town, "wood", 1)
	_check(bool(local_trade.get("ok", false)), "locally produced shortage can still be traded normally")
	_check(int(local_trade.get("security_recovered", 0)) == 0 and economy.security(town) == 52, "locally produced goods do not masquerade as cross-regional relief")

	main.free()
	print("wildforge_player_relief_delivery=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
