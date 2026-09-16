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
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())
	world.faction_authority.set_relation("verdant", "frost", -80, "war")
	world.faction_authority.simulate_hour(world.absolute_world_hour() + 1)
	var before := world.faction_authority.bounty_for_settlement("verdant_mossbridge")
	world.faction_authority.accept_npc_bounty(String(before.get("id", "")), "verdant_mossbridge")
	var snap := SliceSaveSystem.snapshot(main)
	_check(SliceSaveSystem.validate_snapshot(snap), "snapshot validates an active accepted NPC bounty")
	var restored_main := _new_main()
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(restored_main, snap), "snapshot restores bounty authority into a fresh world")
	var restored_world := restored_main.get_node("World") as SliceWorld
	var restored_player := restored_main.get_node("Player") as SlicePlayer
	var restored_actors := restored_main.actor_authority as SliceWorldActorAuthority
	var restored := restored_world.faction_authority.bounty_for_settlement("verdant_mossbridge")
	_check(String(restored.get("id", "")) == String(before.get("id", "")), "save round-trip preserves bounty id")
	_check(String(restored.get("target_person_id", "")) == String(before.get("target_person_id", "")), "save round-trip preserves exact target identity")
	_check(String(restored.get("status", "")) == "accepted", "save round-trip preserves accepted contract state")
	var marks_before := restored_player.forge_marks
	var target_slot := String(restored.get("target_slot_id", ""))
	restored_actors.damage_guard(target_slot, 9999.0, restored_world.cell_center(Vector2i.ZERO))
	var fulfilled := restored_world.faction_authority.bounty_for_settlement("verdant_mossbridge")
	_check(String(fulfilled.get("status", "")) == "fulfilled", "restored bounty can still be fulfilled by the same named person")
	var claim := restored_world.faction_authority.claim_npc_bounty(restored_player, String(fulfilled.get("id", "")), "verdant_mossbridge")
	_check(bool(claim.get("ok", false)) and restored_player.forge_marks > marks_before, "restored fulfilled bounty still pays its escrowed reward")
	var forged := snap.duplicate(true)
	forged["factions"] = (snap["factions"] as Dictionary).duplicate(true)
	forged["factions"]["npc_bounties"] = (snap["factions"]["npc_bounties"] as Array).duplicate(true)
	(forged["factions"]["npc_bounties"][0] as Dictionary)["reward"] = -10
	_check(not SliceSaveSystem.validate_snapshot(forged), "validator rejects forged negative NPC bounty reward")
	print("wildforge_npc_bounty_save=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
