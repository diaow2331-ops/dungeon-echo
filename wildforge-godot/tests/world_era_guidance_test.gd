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
	var world := main.world as SliceWorld
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	var start_milestones := progression.milestones.duplicate(true)
	var start_guide := progression.guidance_snapshot()
	_check(String(start_guide.get("kind", "")) == "survival", "new-world guidance starts with survival rather than macro politics")
	_check(progression.milestones == start_milestones, "reading guidance cannot advance or mutate progression")

	progression.record_milestone("survival_ready")
	progression.record_settlement_contact("verdant_mossbridge")
	var foothold := progression.simulate_hour_end(1, [])
	_check(int(foothold.get("to", -1)) == SliceWorldProgressionAuthority.ERA_FOOTHOLD, "fixture enters Foothold through canonical milestones")
	var second_region := progression.guidance_snapshot()
	_check(String(second_region.get("kind", "")) == "discover_second_region", "Foothold points toward another region before logistics complexity")
	_check((second_region.get("unknown_settlements", []) as Array).size() == 2, "guidance derives undiscovered regions from contact milestones")

	main._open_dialogue({"npc_kind": "merchant", "actor_id": "frost_frostmirror:merchant", "settlement_id": "frost_frostmirror", "display_name": "伊芙", "role": "霜镜站商人", "dialogue": ["路上小心。"]})
	_check(progression.has_milestone("settlement:frost_frostmirror"), "speaking to a new merchant records the canonical regional contact")
	_check(not main.dialogue_overlay.lines.is_empty() and "倒手不算商路" in String(main.dialogue_overlay.lines[-1]), "merchant immediately explains the next real logistics proof after contact")
	main.dialogue_overlay.close_dialogue()
	var logistics := progression.guidance_snapshot()
	_check(String(logistics.get("kind", "")) == "prove_logistics", "two-region Foothold asks for real logistics proof")
	progression.record_milestone("pack_beast_acquired")
	var maturing := progression.guidance_snapshot()
	_check(String(maturing.get("kind", "")) == "foothold_maturing", "having capability does not turn guidance into an instant unlock checklist")

	var roads := progression.simulate_hour_end(25, [])
	_check(int(roads.get("to", -1)) == SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "mature Foothold enters Open Roads")
	var third_region := progression.guidance_snapshot()
	_check(String(third_region.get("kind", "")) == "discover_all_regions", "Open Roads asks the player to discover the remaining regional power")
	var fracture_fixture := {
		"era": SliceWorldProgressionAuthority.ERA_FRACTURE,
		"era_entered_hour": world.absolute_world_hour(),
		"milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "settlement:ember_cinder_ridge", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst"],
		"last_transition": {"from": SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "to": SliceWorldProgressionAuthority.ERA_FRACTURE, "cause": "first_fracture", "hour": world.absolute_world_hour()},
	}
	_check(progression.restore_state(fracture_fixture), "guidance fixture enters a valid Fracture world")
	_check(world.faction_authority.set_relation("verdant", "ember", -59, "neutral"), "canonical diplomacy can expose a tense border without declaring war")
	var before_seen := progression.milestones.duplicate(true)
	var tension_guide := progression.guidance_snapshot()
	_check(String(tension_guide.get("kind", "")) == "observe_tension", "Fracture guidance asks the player to witness existing tension")
	_check(not (tension_guide.get("target_settlements", []) as Array).is_empty(), "guidance points only at settlements whose canonical conflict state is actually tense")
	_check(progression.milestones == before_seen and not progression.has_milestone("tension_seen"), "reading a warning never fabricates player observation")
	var ui_hint: String = main.touch_controls._progression_hint()
	_check("不太平" in ui_hint or "亲自确认" in ui_hint, "mobile journey hint translates canonical tension into an in-world travel lead")
	main._open_dialogue({"npc_kind": "guard", "actor_id": "verdant_mossbridge:guard", "settlement_id": "verdant_mossbridge", "display_name": "洛恩", "role": "苔桥守卫", "dialogue": ["边境有风声。"]})
	_check(progression.has_milestone("tension_seen"), "speaking inside a truly tense settlement converts rumor into lived observation")
	_check(not main.dialogue_overlay.lines.is_empty() and "裂痕" in String(main.dialogue_overlay.lines[-1]), "guard guidance updates from canonical observation instead of a fixed quest script")
	_check(String(world.faction_authority.relation("verdant", "ember").get("stance", "")) == "neutral", "guidance and observation still do not fabricate formal war")

	main.free()
	print("wildforge_world_era_guidance=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
