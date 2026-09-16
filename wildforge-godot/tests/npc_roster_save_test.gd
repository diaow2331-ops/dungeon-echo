extends SceneTree

var failed := false
const SaveSystem = preload("res://scripts/save/slice_save_system.gd")

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

func _actor_position(main: Node, actor_id: String) -> Vector2:
	var authority := main.actor_authority as SliceWorldActorAuthority
	var row: Dictionary = authority.descriptors.get(actor_id, {})
	var cell: Vector2i = row.get("cell", Vector2i.ZERO)
	return (main.get_node("World") as SliceWorld).cell_center(cell)

func _run() -> void:
	var main := _new_main()
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var actors := main.actor_authority as SliceWorldActorAuthority
	var merchant_id := "verdant_mossbridge:merchant"
	var guard_id := "verdant_mossbridge:guard"
	actors.damage_settlement_npc(merchant_id, 999.0, _actor_position(main, merchant_id))
	actors.damage_guard(guard_id, 999.0, _actor_position(main, guard_id))
	var merchant_dead := world.npc_roster_authority.person(merchant_id)
	var guard_dead := world.npc_roster_authority.person(guard_id)
	var snap := SaveSystem.snapshot(main)
	_check(int(snap.get("version", 0)) == SaveSystem.SAVE_VERSION and snap.has("npc_roster"), "current schema persists the NPC roster authority explicitly")
	_check(SaveSystem.validate_snapshot(snap), "current NPC roster snapshot passes authoritative validation")
	var forged := snap.duplicate(true)
	for row in forged["settlement_security"]:
		if row is Dictionary and String(row.get("id", "")) == guard_id:
			row["health"] = 420.0
	_check(not SaveSystem.validate_snapshot(forged), "current schema rejects contradictory guard health across roster and physical security state")
	var restored_main := _new_main()
	await process_frame
	await process_frame
	_check(SaveSystem.apply_snapshot(restored_main, snap), "current NPC roster snapshot restores into a fresh world")
	var restored_world := restored_main.get_node("World") as SliceWorld
	var restored_merchant := restored_world.npc_roster_authority.person(merchant_id)
	var restored_guard := restored_world.npc_roster_authority.person(guard_id)
	_check(not bool(restored_merchant.get("alive", true)) and float(restored_merchant.get("health", 1.0)) == 0.0, "merchant death survives save round-trip")
	_check(String(restored_merchant.get("person_id", "")) == String(merchant_dead.get("person_id", "")), "save round-trip preserves the exact deceased merchant identity")
	_check(int(restored_merchant.get("replacement_due_hour", -1)) == int(merchant_dead.get("replacement_due_hour", -2)), "merchant vacancy timer survives save round-trip")
	_check(not bool(restored_guard.get("alive", true)) and String(restored_guard.get("person_id", "")) == String(guard_dead.get("person_id", "")), "guard death and exact identity survive save round-trip")
	var legacy31 := snap.duplicate(true)
	legacy31["version"] = SaveSystem.LEGACY_WORLD_ERA_SAVE_VERSION
	legacy31.erase("npc_roster")
	_check(SaveSystem.validate_snapshot(legacy31), "v0.31 world-era save remains a supported legacy schema")
	var legacy_main := _new_main()
	await process_frame
	await process_frame
	_check(SaveSystem.apply_snapshot(legacy_main, legacy31), "v0.31 save migrates into the NPC roster world")
	var legacy_world := legacy_main.get_node("World") as SliceWorld
	_check(not legacy_world.npc_roster_authority.is_alive(guard_id), "legacy dead guard is migrated into roster death instead of being resurrected")
	_check(legacy_world.npc_roster_authority.is_alive(merchant_id), "legacy schema invents no merchant death it never stored")
	main.queue_free()
	restored_main.queue_free()
	legacy_main.queue_free()
	await process_frame
	print("wildforge_npc_roster_save=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
