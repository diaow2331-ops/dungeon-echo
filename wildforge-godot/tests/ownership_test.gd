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

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var ownership := world.ownership_authority as SliceWorldOwnershipAuthority
	var stone := Vector2i(0, world.surface_y_at(0) + 5)
	_check(world.owner_at(stone) == "wilderness", "unclaimed deterministic world resolves to wilderness")
	_check(world.claim_region("ember", Rect2i(-8, 0, 17, SliceWorld.MAX_Y + 1), "resource_concession", "ember_quarry"), "faction can claim a bounded world region")
	var claim := world.ownership_at(stone)
	_check(claim["owner_id"] == "ember" and claim["zone_type"] == "resource_concession", "claimed cell resolves owner and zone metadata")
	var illegal := world.request_world_edit({"action": "mine", "cell": stone, "tool_power": 1.0, "actor_id": "traveler"})
	_check(bool(illegal["changed"]), "ownership does not create magical indestructible faction terrain")
	_check(illegal["legal_status"] == "illegal" and bool(illegal["violation"]), "unlicensed extraction is classified as illegal")
	_check(illegal["crime_class"] == "unlicensed_extraction", "illegal extraction carries a stable consequence class")
	_check(illegal["owner_id"] == "ember", "illegal edit still records harmed owner")
	world.request_world_edit({"action": "place", "cell": stone, "tile": SliceWorld.STONE, "actor_id": "system_restore"})

	var permitted_cell := Vector2i(1, world.surface_y_at(1) + 5)
	var permitted := world.request_world_edit({"action": "mine", "cell": permitted_cell, "tool_power": 1.0, "actor_id": "licensed_worker", "permits": ["mine:ember"]})
	_check(bool(permitted["changed"]) and permitted["legal_status"] == "legal", "action-specific faction permit legalizes resource extraction")

	var faction_cell := Vector2i(2, world.surface_y_at(2) + 5)
	var faction_edit := world.request_world_edit({"action": "mine", "cell": faction_cell, "tool_power": 1.0, "actor_id": "ember_worker_2", "actor_faction": "ember"})
	_check(bool(faction_edit["changed"]) and faction_edit["legal_status"] == "legal", "owner faction workforce can edit its own claim")
	var war_cell := Vector2i(3, world.surface_y_at(3) + 5)
	var wartime := world.request_world_edit({"action": "mine", "cell": war_cell, "tool_power": 1.0, "actor_id": "frost_sapper", "actor_faction": "frost", "war_targets": ["ember"]})
	_check(bool(wartime["changed"]) and wartime["legal_status"] == "wartime", "declared enemy action is classified as wartime rather than civilian crime")
	_check(not bool(wartime["violation"]) and wartime["crime_class"] == "wartime_action", "wartime edit remains consequence-distinct from theft")

	var structure_cell := Vector2i(4, world.surface_y_at(4) + 5)
	_check(world.claim_cells("frost", [structure_cell], "protected_structure", "frost_gate") == 1, "cell claim can override a broader territorial claim")
	var structure_claim := world.ownership_at(structure_cell)
	_check(structure_claim["owner_id"] == "frost" and structure_claim["structure_id"] == "frost_gate", "structure ownership has priority over regional territory")
	var crime_probe := world.edit_authority.evaluate(world, {"action": "mine", "cell": structure_cell, "tool_power": 1.0, "actor_id": "traveler"})
	_check(crime_probe["legal_status"] == "illegal" and crime_probe["crime_class"] == "major_property_damage", "protected structure damage is classified more severely")
	var exported := ownership.export_claims()
	var restored := SliceWorldOwnershipAuthority.new()
	_check(restored.restore_claims(exported), "ownership claims round-trip through a serializable payload")
	_check(restored.resolve(structure_cell)["structure_id"] == "frost_gate", "serialized cell ownership preserves structure identity")
	_check(restored.owner_at(stone) == "ember", "serialized regional ownership preserves faction identity")
	var transferred := restored.transfer_owner("ember", "verdant")
	_check(transferred >= 1 and restored.owner_at(stone) == "verdant", "territorial ownership can transfer without rewriting world tiles")

	var snapshot := SliceSaveSystem.snapshot(main)
	_check(int(snapshot["version"]) == SliceSaveSystem.SAVE_VERSION and snapshot.has("ownership_claims"), "current save schema carries ownership authority")
	var fresh := packed.instantiate()
	root.add_child(fresh)
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(fresh, snapshot), "ownership-aware snapshot restores into a fresh world")
	var fresh_world := fresh.get_node("World") as SliceWorld
	_check(fresh_world.owner_at(stone) == "ember", "regional claim survives save round-trip")
	_check(fresh_world.ownership_at(structure_cell)["structure_id"] == "frost_gate", "structure claim survives save round-trip")

	var legacy14 := snapshot.duplicate(true)
	legacy14["version"] = SliceSaveSystem.LEGACY_DELTA_SAVE_VERSION
	legacy14["world_generation"] = SliceWorld.LEGACY_WORLD_GENERATION_VERSION
	legacy14.erase("world_seed")
	legacy14.erase("ownership_claims")
	legacy14.erase("fluid_cells")
	legacy14.erase("vegetation")
	legacy14["trees"] = [-5, 3, 14]
	var legacy_fresh := packed.instantiate()
	root.add_child(legacy_fresh)
	await process_frame
	await process_frame
	_check(SliceSaveSystem.apply_snapshot(legacy_fresh, legacy14), "v0.14 delta save remains loadable after ownership schema upgrade")
	var legacy_world := legacy_fresh.get_node("World") as SliceWorld
	_check(legacy_world.owner_at(stone) == "wilderness", "legacy save migration starts with neutral ownership instead of inventing claims")

	print("wildforge_ownership_authority=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
