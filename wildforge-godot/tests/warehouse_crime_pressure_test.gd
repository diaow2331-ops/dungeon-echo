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

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var economy := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	var town := "verdant_mossbridge"
	var door := economy.warehouse_door(town)
	player.global_position = world.cell_center(door)
	player.add_item(economy.warehouse_key_id(town), 1)
	_check(bool(economy.unlock_warehouse(player, town).get("ok", false)), "real warehouse key opens the physical warehouse door")

	var row: Dictionary = economy.settlements[town]
	var inventory: Dictionary = row["inventory"]
	inventory["wood"] = maxi(5, economy.effective_target(town, "wood"))
	row["inventory"] = inventory
	row["security"] = 100
	economy.settlements[town] = row
	var bounty_before := factions.player_bounty("verdant")
	var theft := economy.loot_warehouse(player, town, "wood", 1)
	_check(bool(theft.get("ok", false)), "warehouse theft removes real authoritative stock")
	_check(int(theft.get("security_loss", 0)) == 1, "ordinary theft applies bounded pressure to canonical settlement security")
	_check(economy.security(town) == 99, "crime pressure changes the same security fact used by world simulation")
	_check(factions.player_bounty("verdant") == bounty_before + 25, "theft still raises the existing faction bounty rather than a second crime score")

	row = economy.settlements[town]
	inventory = row["inventory"]
	inventory["basalt"] = 1
	row["inventory"] = inventory
	economy.settlements[town] = row
	var critical_theft := economy.loot_warehouse(player, town, "basalt", 1)
	_check(bool(critical_theft.get("ok", false)), "player can steal genuinely scarce stock when the warehouse is open")
	_check(int(critical_theft.get("security_loss", 0)) == 3, "stealing critical stock hurts local stability more but remains bounded")
	_check(economy.security(town) == 96, "critical theft still mutates only canonical security")

	var stolen_before := int(((economy.settlements[town] as Dictionary).get("stolen_deficit", {}) as Dictionary).get("wood", 0))
	factions.settle_player_bounty("verdant", 1000000)
	world.progression_authority.era = SliceWorldProgressionAuthority.ERA_FOOTHOLD
	player.global_position = world.cell_center(economy.market_cell(town))
	var laundering := economy.sell_from_player(player, town, "wood", 1)
	_check(not bool(laundering.get("ok", false)) and String(laundering.get("reason", "")) == "stolen_goods", "victim market refuses goods still recorded as stolen from its own warehouse")
	_check(int(((economy.settlements[town] as Dictionary).get("stolen_deficit", {}) as Dictionary).get("wood", 0)) == stolen_before, "failed laundering does not erase the real theft deficit")

	main.free()
	print("wildforge_warehouse_crime_pressure=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
