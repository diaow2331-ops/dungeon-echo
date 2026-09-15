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

func _advance_hours(world: SliceWorld, hours: int) -> void:
	if hours > 0:
		world.advance_world_time(SliceWorldClock.DAY_SECONDS * float(hours) / 24.0 + 0.01)

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var settlement := world.settlement_authority as SliceSettlementAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority

	_advance_hours(world, 24 - world.absolute_world_hour())
	var active := settlement.active_caravans()
	_check(not active.is_empty(), "projection fixture has an authoritative caravan to display")
	if active.is_empty():
		main.free()
		print("wildforge_caravan_projection=FAIL")
		quit(1)
		return
	var caravan: Dictionary = active[0]
	var caravan_id := String(caravan.get("id", ""))
	var actor_id := "world:" + caravan_id
	var first_cell := settlement.caravan_cell(caravan_id)
	player.global_position = world.cell_center(first_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_caravans(true)
	await process_frame

	_check(actors.descriptor_count(SliceWorldActorAuthority.KIND_CARAVAN) == active.size(), "one streamed descriptor is derived from each active caravan record")
	_check(actors.projected_count(SliceWorldActorAuthority.KIND_CARAVAN) <= SliceSettlementAuthority.CARAVAN_MAX_ACTIVE, "local caravan presentation obeys the global traffic bound")
	var projection := actors.projection_for(actor_id) as SliceTradeCaravan
	_check(projection != null, "nearby in-transit caravan becomes a local world projection")
	if projection != null:
		var projected_state := projection.caravan_state()
		_check(String(projected_state.get("id", "")) == caravan_id and int(projected_state.get("quantity", 0)) == int(caravan.get("quantity", 0)), "projection reads the exact macro cargo record instead of owning a second inventory")

	var signature_before := actors.caravan_signature
	var activations_before := actors.activation_count
	actors.sync_caravans()
	_check(actors.caravan_signature == signature_before and actors.activation_count == activations_before, "unchanged caravan state does not churn streamed actors every frame")

	_advance_hours(world, 1)
	var second_cell := settlement.caravan_cell(caravan_id)
	_check(second_cell != first_cell, "macro caravan advances deterministically along its route each world hour")
	player.global_position = world.cell_center(second_cell) + Vector2(0, -48)
	world.refresh_streaming(true)
	actors.sync_caravans(true)
	await process_frame
	var moved := actors.projection_for(actor_id) as SliceTradeCaravan
	_check(moved != null and moved.global_position.distance_to(world.cell_center(second_cell) + Vector2(0, -10)) < 1.0, "local projection follows the authoritative route cell after streaming")

	var arrival_hour := int(caravan.get("arrival_hour", 0))
	_advance_hours(world, arrival_hour - world.absolute_world_hour())
	actors.sync_caravans(true)
	_check(actor_id not in actors.actor_ids(SliceWorldActorAuthority.KIND_CARAVAN), "arrived caravan projection disappears when the macro shipment resolves")

	main.free()
	print("wildforge_caravan_projection=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
