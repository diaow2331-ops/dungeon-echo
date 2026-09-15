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

func _fill_markets(economy: SliceSettlementAuthority) -> void:
	for town in economy.ids():
		var row: Dictionary = economy.settlements[town]
		var inventory: Dictionary = row["inventory"]
		for item_id in economy.accepted_goods(town):
			inventory[item_id] = economy.effective_target(town, item_id)
		row["inventory"] = inventory
		economy.settlements[town] = row

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	var economy := world.settlement_authority as SliceSettlementAuthority
	var progression := world.progression_authority as SliceWorldProgressionAuthority
	var era3 := {
		"era": SliceWorldProgressionAuthority.ERA_FRACTURE,
		"era_entered_hour": 0,
		"milestones": ["survival_ready", "settlement:verdant_mossbridge", "settlement:frost_frostmirror", "settlement:ember_cinder_ridge", "cross_region_delivery", "cross_faction_exchange", "tension_catalyst", "tension_seen"],
		"last_transition": {"from": SliceWorldProgressionAuthority.ERA_OPEN_ROADS, "to": SliceWorldProgressionAuthority.ERA_FRACTURE, "cause": "first_fracture", "hour": 0},
	}
	_check(progression.restore_state(era3), "fixture enters Fracture for live intervention guidance")
	var route_key := economy._route_pair_key("verdant_mossbridge", "frost_frostmirror")
	var now := world.absolute_world_hour()
	economy.caravan_incident_cooldowns[route_key] = now + 12
	var route_guide: Dictionary = progression.guidance_snapshot()
	var route_intervention: Dictionary = route_guide.get("intervention", {})
	_check(String(route_intervention.get("kind", "")) == "route_repair", "active physical route damage becomes the highest-priority Fracture intervention")
	var route_hint: String = main.touch_controls._progression_hint()
	_check("商路受阻" in route_hint and "抢修" in route_hint, "journey guidance converts the live blockage into an actionable roadwork rumor")
	_check(not progression.has_milestone("war_ready_pressure"), "reading intervention guidance does not manufacture political escalation")

	economy.caravan_incident_cooldowns.clear()
	_fill_markets(economy)
	var town := "verdant_mossbridge"
	var row: Dictionary = economy.settlements[town]
	var inventory: Dictionary = row["inventory"]
	inventory["ice"] = 0
	row["inventory"] = inventory
	economy.settlements[town] = row
	var reliefs: Array = economy.relief_opportunities()
	_check(reliefs.size() == 1 and String((reliefs[0] as Dictionary).get("item_id", "")) == "ice", "relief lead is derived from the one real external shortage")
	var relief_guide: Dictionary = progression.guidance_snapshot()
	var relief_intervention: Dictionary = relief_guide.get("intervention", {})
	_check(String(relief_intervention.get("kind", "")) == "relief_delivery", "when roads are clear, real external shortage becomes the next peaceful intervention")
	_check(String(relief_intervention.get("settlement_id", "")) == town, "relief guidance points to the canonical settlement holding the shortage")
	var relief_hint: String = main.touch_controls._progression_hint()
	_check("苔桥镇" in relief_hint and "冰块" in relief_hint and "稳定局势" in relief_hint, "player sees what to carry, where to take it, and why it matters")

	main.free()
	print("wildforge_world_intervention_guidance=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
