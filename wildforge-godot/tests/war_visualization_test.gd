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
	var factions := world.faction_authority as SliceFactionAuthority
	var settlements := world.settlement_authority as SliceSettlementAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	var settlement_id := "verdant_mossbridge"
	var market_cell := settlements.market_cell(settlement_id)
	player.global_position = world.cell_center(market_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_active(world.chunk_streamer.active_keys)
	await process_frame

	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_SETTLEMENT_BANNER) == 3, "one deterministic live banner exists for each canonical settlement")
	var banner_id := settlement_id + ":banner"
	var banner := actors.projection_for(banner_id) as SliceSettlementBanner
	_check(banner != null, "nearby settlement projects its live political banner")
	_check(banner.current_status() == "peace" and banner.current_controller() == "verdant", "banner reads peaceful founding sovereignty from live authorities")

	_check(factions.set_relation("verdant", "ember", -70, "war"), "visual fixture enters canonical war")
	_check(banner.current_status() == "war", "same banner reflects war without rebuilding settlement state")
	factions.simulate_hour(4)
	actors.sync_war_raids()
	_check(banner.current_status() == "raid", "same banner escalates to raid while the macro raid is active")

	var guard := actors.projection_for(settlement_id + ":guard") as SliceSettlementGuard
	_check(guard != null, "settlement guard remains the same local authority projection during war")
	var raid_dialogue: Array = guard._guard_dialogue()
	_check(not raid_dialogue.is_empty() and "敌袭" in String(raid_dialogue[0]), "guard explains the visible raid through live conflict state")

	_check(factions.set_status("verdant", "annexed", "ember"), "visual fixture applies political annexation")
	_check(banner.current_status() == "occupied" and banner.current_controller() == "ember", "banner changes controller and occupation state without changing regional geometry")
	var occupied_dialogue: Array = guard._guard_dialogue()
	_check(not occupied_dialogue.is_empty() and "易主" in String(occupied_dialogue[0]), "guard dialogue exposes sovereignty change without a debug panel")
	_check(settlements.owner_id(settlement_id) == "verdant", "visual occupation does not rewrite physical ownership authority")

	main.free()
	print("wildforge_war_visualization=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
