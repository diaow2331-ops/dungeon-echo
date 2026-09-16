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
	var actors := main.actor_authority as SliceWorldActorAuthority
	world.progression_authority.restore_legacy_unlocked(world.absolute_world_hour())
	_check(actors.actor_ids(SliceWorldActorAuthority.KIND_BOUNTY_BOARD).size() == 3, "each settlement has one physical bounty board")
	var issuer_town := "verdant_mossbridge"
	var treasury_before := world.settlement_authority.treasury(issuer_town)
	_check(world.faction_authority.set_relation("verdant", "frost", -80, "war"), "fixture enters a real formal war")
	var sim := world.faction_authority.simulate_hour(world.absolute_world_hour() + 1)
	var bounty := world.faction_authority.bounty_for_settlement(issuer_town)
	_check(not bounty.is_empty(), "war posts a concrete enemy-person bounty")
	_check(String(bounty.get("target_person_id", "")).ends_with(":person:0"), "bounty binds a specific current person identity")
	_check(String(bounty.get("target_slot_id", "")).ends_with(":guard"), "first strategic target prefers an enemy guard role")
	var reward := int(bounty.get("reward", 0))
	_check(reward > 0 and world.settlement_authority.treasury(issuer_town) == treasury_before - reward, "posting reserves reward from real settlement treasury")
	var target_slot := String(bounty.get("target_slot_id", ""))
	var target_person := String(bounty.get("target_person_id", ""))
	var accepted := world.faction_authority.accept_npc_bounty(String(bounty.get("id", "")), issuer_town)
	_check(bool(accepted.get("ok", false)), "player can accept the posted named-person contract")
	var marks_before := player.forge_marks
	actors.damage_guard(target_slot, 9999.0, world.cell_center(Vector2i.ZERO))
	var fulfilled := world.faction_authority.bounty_for_settlement(issuer_town)
	_check(String(fulfilled.get("status", "")) == "fulfilled", "killing the exact named target fulfills the contract")
	_check(String(fulfilled.get("target_person_id", "")) == target_person, "fulfilled bounty keeps the dead person's immutable identity")
	var claim := world.faction_authority.claim_npc_bounty(player, String(fulfilled.get("id", "")), issuer_town)
	_check(bool(claim.get("ok", false)) and player.forge_marks == marks_before + reward, "claim pays the escrowed reward exactly once")
	var second_claim := world.faction_authority.claim_npc_bounty(player, String(fulfilled.get("id", "")), issuer_town)
	_check(not bool(second_claim.get("ok", false)) and player.forge_marks == marks_before + reward, "claimed bounty cannot be paid twice")
	var dead_person := world.npc_roster_authority.person(target_slot)
	_check(not bool(dead_person.get("alive", true)), "target person's death remains in NPC roster authority")
	var due := int(dead_person.get("replacement_due_hour", 0))
	world.npc_roster_authority.simulate_hour(due)
	var successor := world.npc_roster_authority.person(target_slot)
	_check(String(successor.get("person_id", "")) != target_person, "later role successor is not retroactively the old bounty target")
	_check(String((world.faction_authority.npc_bounties[String(fulfilled.get("id", ""))] as Dictionary).get("status", "")) == "claimed", "successor does not reopen an already completed identity contract")
	_check((sim.get("events", []) as Array).any(func(e): return e is Dictionary and String(e.get("kind", "")) == "npc_bounty_posted"), "bounty posting is emitted as a world event")
	print("wildforge_npc_bounty=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
