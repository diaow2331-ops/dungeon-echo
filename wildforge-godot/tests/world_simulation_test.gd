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
	var settlement := world.settlement_authority as SliceSettlementAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	var settlement_id := settlement.ids()[0]
	var market_cell := settlement.market_cell(settlement_id)
	player.global_position = world.cell_center(market_cell) + Vector2(0, -48)
	player.add_item("raw_meat", 1)
	var sale := settlement.sell_from_player(player, settlement_id, "raw_meat", 1)
	_check(bool(sale.get("ok", false)), "heartbeat fixture completes one real market sale")
	var stock_after_sale := settlement.item_count(settlement_id, "raw_meat")
	var treasury_after_sale := settlement.treasury(settlement_id)
	var price_after_sale := settlement.buy_price(settlement_id, "raw_meat")
	var events_before := world.simulation_event_count

	var far_cell: Vector2i = world.remote_vein_cells[-1]
	player.global_position = world.cell_center(far_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	await process_frame
	_check(actors.projected_count(SliceWorldActorAuthority.KIND_MERCHANT) == 0, "settlement merchant is unloaded before the macro heartbeat runs")

	var four_game_hours := SliceWorldClock.DAY_SECONDS / 6.0
	var emitted := world.advance_world_time(four_game_hours)
	_check(emitted == 1, "crossing four world hours emits one bounded settlement simulation event")
	_check(world.simulation_event_count == events_before + 1, "world owns one monotonic simulation event count")
	_check(settlement.item_count(settlement_id, "raw_meat") == stock_after_sale - 1, "unloaded settlement consumes real authoritative food stock")
	_check(settlement.treasury(settlement_id) == mini(120, treasury_after_sale + SliceSettlementAuthority.LOCAL_MEAT_REVENUE), "local food consumption returns bounded revenue to the same treasury")
	_check(settlement.buy_price(settlement_id, "raw_meat") >= price_after_sale, "background consumption restores shortage pressure instead of owning a second price")
	_check(actors.projected_count(SliceWorldActorAuthority.KIND_MERCHANT) == 0, "macro simulation never instantiates an off-screen merchant")

	var snap := SliceSaveSystem.snapshot(main)
	var saved_stock := settlement.item_count(settlement_id, "raw_meat")
	main.free()
	await process_frame
	var restored := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored, snap), "heartbeat economy state restores through the existing save authority")
	var world2 := restored.get_node("World") as SliceWorld
	var settlement2 := world2.settlement_authority as SliceSettlementAuthority
	_check(settlement2.item_count(settlement_id, "raw_meat") == saved_stock, "restoring a save does not replay already-consumed settlement stock")
	var cursor_after_restore := world2.simulation_hour_cursor
	var half_game_hour := SliceWorldClock.DAY_SECONDS / 48.0
	_check(world2.advance_world_time(half_game_hour) == 0, "sub-hour restore continuation does not fabricate a heartbeat")
	_check(world2.simulation_hour_cursor >= cursor_after_restore, "heartbeat cursor is derived forward from the restored world clock")
	_check(settlement2.item_count(settlement_id, "raw_meat") == saved_stock, "sub-hour continuation leaves settlement stock unchanged")

	restored.free()
	print("wildforge_world_simulation=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
