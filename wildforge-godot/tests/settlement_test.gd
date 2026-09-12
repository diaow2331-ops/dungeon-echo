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

func _new_main() -> Node:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	return main

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var authority := world.settlement_authority as SliceSettlementAuthority
	var ids := authority.ids()
	_check(ids.size() == 1, "golden slice generates exactly one formal settlement")
	var settlement_id := ids[0] if not ids.is_empty() else ""
	var state := authority.state(settlement_id)
	var anchor: Vector2i = state.get("anchor_cell", Vector2i.ZERO)
	_check(anchor.x >= -72 and anchor.x <= -48, "first settlement occupies the bounded near-spawn travel band")
	_check(String(state.get("name", "")) == "Mossbridge", "golden settlement has stable identity")
	_check(authority.owner_id(settlement_id) == "verdant", "settlement sovereignty resolves through ownership authority")
	var territory: Array = (world.baseline_settlements[0] as Dictionary).get("territory", [])
	var territory_left := int(territory[0])
	var territory_right := territory_left + int(territory[2])
	var trees_inside := 0
	for tree_site in world.vegetation_baseline():
		var tree_cell: Vector2i = (tree_site as Dictionary).get("cell", Vector2i.ZERO)
		if tree_cell.x >= territory_left and tree_cell.x < territory_right:
			trees_inside += 1
	_check(trees_inside == 0, "natural vegetation never projects through the settlement footprint")
	var stale_veins := 0
	for vein_cell in world.remote_vein_cells:
		if world.tile_at(vein_cell) not in [SliceWorld.COAL, SliceWorld.COPPER]:
			stale_veins += 1
	_check(stale_veins == 0, "remote resource index contains no veins overwritten by settlement construction")
	var structure_ids: Array = state.get("structures", [])
	_check(structure_ids.size() == 4, "settlement baseline contains warehouse market and two gates")
	for raw_id in structure_ids:
		var structure_id := String(raw_id)
		_check(world.structure_authority.has(structure_id), "settlement structure is registered: " + structure_id)
		_check(world.structure_authority.owner_id(structure_id) == "verdant", "structure ownership is delegated to Verdant claims: " + structure_id)
		_check(world.structure_authority.integrity(structure_id) > 0.999, "baseline structure is physically intact: " + structure_id)

	var warehouse_id := settlement_id + ":warehouse"
	var warehouse_cells := world.structure_authority.cells_for(warehouse_id)
	_check(not warehouse_cells.is_empty(), "warehouse blueprint contains real world cells")
	var damage_cell: Vector2i = warehouse_cells[0]
	var expected_tile := world.structure_authority.expected_tile(warehouse_id, damage_cell)
	var damage := world.request_world_edit({"action": "mine", "cell": damage_cell, "tool_power": 99.0, "actor_id": "player"})
	_check(bool(damage.get("changed", false)), "player can physically damage faction structure with sufficient capability")
	_check(String(damage.get("legal_status", "")) == "illegal" and String(damage.get("crime_class", "")) == "major_property_damage", "unauthorized structure damage is classified as a major property crime")
	_check(world.structure_authority.integrity(warehouse_id) < 0.999, "physical block loss lowers derived structure integrity")
	var repairs := world.structure_authority.repair_requirements(warehouse_id)
	_check(not repairs.is_empty(), "damaged warehouse exposes material repair demand")
	var repaired := world.structure_authority.repair_cell(warehouse_id, damage_cell, "verdant_worker", "verdant")
	_check(bool(repaired.get("changed", false)) and String(repaired.get("legal_status", "")) == "legal", "owner workforce repairs through the same edit authority")
	_check(world.tile_at(damage_cell) == expected_tile and world.structure_authority.integrity(warehouse_id) > 0.999, "repair restores the real blueprint cell and full integrity")

	var market_cell := authority.market_cell(settlement_id)
	player.global_position = world.cell_center(market_cell) + Vector2(0, -48)
	player.add_item("raw_meat", 2)
	var price_before := authority.buy_price(settlement_id, "raw_meat")
	var goods_before := player.item_count("raw_meat")
	var marks_before := player.forge_marks
	var stock_before := authority.item_count(settlement_id, "raw_meat")
	var treasury_before := authority.treasury(settlement_id)
	var trade := authority.sell_from_player(player, settlement_id, "raw_meat", 2)
	var total := int(trade.get("total", 0))
	_check(bool(trade.get("ok", false)) and total > 0, "market accepts the first hunting commodity")
	_check(player.item_count("raw_meat") == goods_before - 2, "trade removes exactly the sold goods from player authority")
	_check(player.forge_marks == marks_before + total, "trade credits exactly the paid forge marks to the player")
	_check(authority.item_count(settlement_id, "raw_meat") == stock_before + 2, "trade moves goods into settlement inventory")
	_check(authority.treasury(settlement_id) == treasury_before - total, "trade debits the settlement treasury by the same amount")
	_check(authority.buy_price(settlement_id, "raw_meat") <= price_before, "market price responds downward as the shortage is relieved")

	var snap := SliceSaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == SliceSaveSystem.SAVE_VERSION, "settlement economy uses current schema 20")
	_check(int(snap.get("world_generation", 0)) == SliceWorld.WORLD_GENERATION_VERSION, "schema 20 binds to settlement generation version 3")
	_check((snap.get("settlements", []) as Array).size() == 1, "save stores settlement economic state once")
	main.free()
	await process_frame

	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "schema 20 settlement snapshot restores into a fresh world")
	var world2 := restored.get_node("World") as SliceWorld
	var player2 := restored.get_node("Player") as SlicePlayer
	var authority2 := world2.settlement_authority as SliceSettlementAuthority
	_check(player2.forge_marks == marks_before + total, "player forge marks survive save round-trip")
	_check(authority2.item_count(settlement_id, "raw_meat") == stock_before + 2, "settlement inventory survives save round-trip")
	_check(authority2.treasury(settlement_id) == treasury_before - total, "settlement treasury survives save round-trip")
	_check(world2.structure_authority.integrity(warehouse_id) > 0.999, "repaired physical settlement remains intact after reload")
	var legacy19 := snap.duplicate(true)
	legacy19["version"] = SliceSaveSystem.LEGACY_TRAVELER_SAVE_VERSION
	legacy19["world_generation"] = SliceWorld.SEEDED_WORLD_GENERATION_VERSION
	legacy19.erase("settlements")
	(legacy19["player"] as Dictionary).erase("marks")
	legacy19["ownership_claims"] = {"regions": [], "cells": []}
	legacy19["world_overrides"] = [[damage_cell.x, damage_cell.y, SliceWorld.AIR]]
	_check(SliceSaveSystem.validate_legacy_traveler_snapshot(legacy19), "v19 traveler snapshot remains a recognized generation-2 migration source")
	var migrated := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(migrated, legacy19), "v19 traveler save migrates explicitly into settlement generation 3")
	var world3 := migrated.get_node("World") as SliceWorld
	var player3 := migrated.get_node("Player") as SlicePlayer
	var authority3 := world3.settlement_authority as SliceSettlementAuthority
	_check(world3.tile_at(damage_cell) == expected_tile, "generation-2 terrain delta cannot erase the newly introduced settlement baseline")
	_check(authority3.owner_id(settlement_id) == "verdant", "migration installs deterministic settlement sovereignty")
	_check(authority3.item_count(settlement_id, "raw_meat") == 2 and authority3.treasury(settlement_id) == 120, "migration initializes settlement economy from deterministic baseline")
	_check(player3.forge_marks == 0, "migration never invents player currency")

	restored.free()
	migrated.free()
	print("wildforge_first_settlement=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
