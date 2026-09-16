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
	var roster := world.npc_roster_authority as SliceNpcRosterAuthority
	var actors := main.actor_authority as SliceWorldActorAuthority
	_check(roster != null, "world owns one NPC identity roster authority")
	_check(roster.all_slots().size() == 6, "current three settlements register merchant and guard role slots")

	var slot_id := "verdant_mossbridge:merchant"
	var first: Dictionary = roster.person(slot_id)
	_check(not first.is_empty(), "merchant role resolves to a concrete persistent person identity")
	_check(String(first.get("person_id", "")) == slot_id + ":person:0", "initial person identity is tied to role generation zero")
	_check(String(first.get("display_name", "")).contains("·"), "initial NPC name is procedurally generated from regional name pools")
	_check(String(first.get("personality", "")) in SliceNpcRosterAuthority.PERSONALITIES, "NPC identity owns a deterministic personality tag")
	var meta: Dictionary = (actors.descriptors[slot_id] as Dictionary).get("meta", {})
	_check(String(meta.get("person_id", "")) == String(first.get("person_id", "")), "streaming descriptor projects roster identity instead of inventing another NPC")
	_check(String(meta.get("display_name", "")) == String(first.get("display_name", "")), "visible merchant name comes from roster authority")
	_check((meta.get("dialogue", []) as Array).has(roster.voice_line(slot_id)), "projected dialogue includes the current person's generated speaking style")

	var original_name := String(first.get("display_name", ""))
	_check(main.reconfigure_world_seed(991337), "fixture can rebuild another deterministic world seed")
	await process_frame
	var alternate := (main.get_node("World") as SliceWorld).npc_roster_authority.person(slot_id)
	_check(String(alternate.get("display_name", "")) != original_name or String(alternate.get("personality", "")) != String(first.get("personality", "")), "different world seed changes at least one generated identity trait")
	_check(main.reconfigure_world_seed(SliceWorld.DEFAULT_WORLD_SEED), "fixture can return to original seed")
	await process_frame
	var restored := (main.get_node("World") as SliceWorld).npc_roster_authority.person(slot_id)
	_check(String(restored.get("display_name", "")) == original_name, "same seed and role generation reproduce the same NPC identity")

	main.free()
	print("wildforge_npc_roster_identity=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
