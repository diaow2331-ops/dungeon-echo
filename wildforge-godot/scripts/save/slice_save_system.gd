extends RefCounted
class_name SliceSaveSystem

const SAVE_VERSION := 15
const SAVE_PATH := "user://wildforge-godot-v015.json"
const LEGACY_DELTA_SAVE_VERSION := 14
const LEGACY_DELTA_SAVE_PATH := "user://wildforge-godot-v014.json"
const LEGACY_FULL_SAVE_VERSION := 13
const LEGACY_FULL_SAVE_PATH := "user://wildforge-godot-v013.json"

static func is_test_run() -> bool:
	for arg in OS.get_cmdline_args():
		if "/tests/" in String(arg) or String(arg).ends_with("_test.gd"):
			return true
	return false

static func snapshot(main: Node) -> Dictionary:
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer
	return {
		"version": SAVE_VERSION,
		"world_generation": SliceWorld.WORLD_GENERATION_VERSION,
		"world_overrides": world.export_cell_overrides(),
		"ownership_claims": world.ownership_authority.export_claims(),
		"player": {
			"x": player.global_position.x,
			"y": player.global_position.y,
			"health": player.health,
			"hunger": player.hunger,
			"stock": player.stock.duplicate(true),
			"pick": player.equipped_pick_id,
			"weapon": player.equipped_weapon_id,
		},
		"workbenches": _station_cells(main, "workbenches"),
		"campfires": _station_cells(main, "campfires"),
		"trees": _group_xs(main, world, "resource_trees"),
		"caches": _group_xs(main, world, "relic_caches"),
		"guards": _group_xs(main, world, "ruin_guards"),
	}

static func apply_snapshot(main: Node, data: Dictionary) -> bool:
	var version := int(data.get("version", 0))
	if version not in [SAVE_VERSION, LEGACY_DELTA_SAVE_VERSION, LEGACY_FULL_SAVE_VERSION]:
		return false
	var world := main.get_node_or_null("World") as SliceWorld
	var player := main.get_node_or_null("Player") as SlicePlayer
	if world == null or player == null:
		return false
	if version in [SAVE_VERSION, LEGACY_DELTA_SAVE_VERSION]:
		if int(data.get("world_generation", 0)) != SliceWorld.WORLD_GENERATION_VERSION:
			return false
		var overrides = data.get("world_overrides", [])
		if not overrides is Array or not world.restore_cell_overrides(overrides):
			return false
	else:
		var legacy_rows = data.get("world_cells", [])
		if not legacy_rows is Array or not world.restore_legacy_v13_cells(legacy_rows):
			return false
	if version == SAVE_VERSION:
		var claims = data.get("ownership_claims", {})
		if not claims is Dictionary or not world.ownership_authority.restore_claims(claims):
			return false
	else:
		world.ownership_authority.clear()
	var p = data.get("player", {})
	if not p is Dictionary:
		return false
	player.global_position = Vector2(float(p.get("x", 0.0)), float(p.get("y", 0.0)))
	# A save resumes from authoritative persistent state, never from transient input/physics momentum.
	player.velocity = Vector2.ZERO
	player.touch_move = Vector2.ZERO
	player.touch_aim = Vector2.RIGHT
	player.touch_primary = false
	player.touch_jump_latched = false
	player.coyote = 0.0
	player.jump_buffer = 0.0
	player.attack_buffer = 0.0
	player.attack_timer = 0.0
	player.attack_target = null
	player.mine_progress = 0.0
	player.mine_grace = 0.0
	player.health = clampf(float(p.get("health", player.max_health)), 1.0, player.max_health)
	player.hunger = clampf(float(p.get("hunger", SlicePlayer.HUNGER_START)), 0.0, SlicePlayer.HUNGER_MAX)
	player.stock = _sanitized_stock(p.get("stock", {}))
	player.equipped_pick_id = _valid_pick(String(p.get("pick", "starter_pick")))
	player.equipped_weapon_id = _valid_weapon(String(p.get("weapon", "starter_blade")))

	_clear_group(main, "workbenches")
	_clear_group(main, "campfires")
	for raw in data.get("workbenches", []):
		world.spawn_workbench(_decode_cell(raw))
	for raw in data.get("campfires", []):
		world.spawn_campfire(_decode_cell(raw))
	_restore_presence(main, world, "resource_trees", data.get("trees", []))
	_restore_presence(main, world, "relic_caches", data.get("caches", []))
	_restore_presence(main, world, "ruin_guards", data.get("guards", []))
	return true

static func save_to_path(main: Node, path := SAVE_PATH) -> bool:
	var data := snapshot(main)
	if not validate_snapshot(data):
		return false
	var temp_path := path + ".tmp"
	var backup_path := path + ".bak"
	if FileAccess.file_exists(temp_path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
	var file := FileAccess.open(temp_path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(data))
	file.flush()
	file = null
	var candidate := _read_snapshot(temp_path)
	if not candidate.is_empty() and validate_snapshot(candidate):
		if FileAccess.file_exists(path):
			if FileAccess.file_exists(backup_path):
				DirAccess.remove_absolute(ProjectSettings.globalize_path(backup_path))
			if DirAccess.rename_absolute(ProjectSettings.globalize_path(path), ProjectSettings.globalize_path(backup_path)) != OK:
				DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
				return false
		if DirAccess.rename_absolute(ProjectSettings.globalize_path(temp_path), ProjectSettings.globalize_path(path)) == OK:
			return true
		# Best-effort rollback if the final atomic rename fails.
		if FileAccess.file_exists(backup_path) and not FileAccess.file_exists(path):
			DirAccess.rename_absolute(ProjectSettings.globalize_path(backup_path), ProjectSettings.globalize_path(path))
	DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
	return false

static func load_from_path(main: Node, path := SAVE_PATH) -> bool:
	for candidate_path in [path, path + ".bak"]:
		var candidate := _read_snapshot(String(candidate_path))
		if _is_supported_snapshot(candidate) and apply_snapshot(main, candidate):
			return true
	if path == SAVE_PATH:
		for legacy_path in [LEGACY_DELTA_SAVE_PATH, LEGACY_DELTA_SAVE_PATH + ".bak", LEGACY_FULL_SAVE_PATH, LEGACY_FULL_SAVE_PATH + ".bak"]:
			var legacy := _read_snapshot(String(legacy_path))
			if _is_supported_snapshot(legacy) and apply_snapshot(main, legacy):
				# Promote any supported legacy save into the current ownership-aware schema.
				save_to_path(main, SAVE_PATH)
				return true
	return false

static func validate_snapshot(data: Dictionary) -> bool:
	if int(data.get("version", 0)) != SAVE_VERSION:
		return false
	if int(data.get("world_generation", 0)) != SliceWorld.WORLD_GENERATION_VERSION:
		return false
	var rows = data.get("world_overrides", [])
	if not rows is Array or rows.size() > 250000:
		return false
	for row in rows:
		if not _valid_world_row(row, true):
			return false
	if not _valid_claim_payload(data.get("ownership_claims", {})):
		return false
	return _validate_common(data)

static func validate_legacy_delta_snapshot(data: Dictionary) -> bool:
	if int(data.get("version", 0)) != LEGACY_DELTA_SAVE_VERSION:
		return false
	if int(data.get("world_generation", 0)) != SliceWorld.WORLD_GENERATION_VERSION:
		return false
	var rows = data.get("world_overrides", [])
	if not rows is Array or rows.size() > 250000:
		return false
	for row in rows:
		if not _valid_world_row(row, true):
			return false
	return _validate_common(data)

static func validate_legacy_full_snapshot(data: Dictionary) -> bool:
	if int(data.get("version", 0)) != LEGACY_FULL_SAVE_VERSION:
		return false
	var rows = data.get("world_cells", [])
	if not rows is Array or rows.is_empty() or rows.size() > 1000000:
		return false
	for row in rows:
		if not _valid_world_row(row, false):
			return false
	return _validate_common(data)

static func _validate_common(data: Dictionary) -> bool:
	var player = data.get("player", {})
	if not player is Dictionary:
		return false
	for key in ["x", "y", "health", "hunger"]:
		if not player.has(key) or not is_finite(float(player[key])):
			return false
	if not player.get("stock", {}) is Dictionary:
		return false
	for key in ["workbenches", "campfires", "trees", "caches", "guards"]:
		if not data.get(key, []) is Array:
			return false
	return true

static func _valid_world_row(row, allow_air: bool) -> bool:
	if not row is Array or row.size() < 3:
		return false
	var tile := int(row[2])
	if allow_air:
		return tile >= SliceWorld.AIR and tile <= SliceWorld.SEALED_RUIN
	return tile > SliceWorld.AIR and tile <= SliceWorld.SEALED_RUIN

static func _is_supported_snapshot(data: Dictionary) -> bool:
	var version := int(data.get("version", 0))
	match version:
		SAVE_VERSION: return validate_snapshot(data)
		LEGACY_DELTA_SAVE_VERSION: return validate_legacy_delta_snapshot(data)
		LEGACY_FULL_SAVE_VERSION: return validate_legacy_full_snapshot(data)
		_: return false

static func _valid_claim_payload(raw) -> bool:
	if not raw is Dictionary:
		return false
	var regions = raw.get("regions", [])
	var cells = raw.get("cells", [])
	if not regions is Array or not cells is Array or regions.size() > 10000 or cells.size() > 250000:
		return false
	for row in regions:
		if not row is Array or row.size() < 7 or String(row[0]).is_empty() or int(row[3]) <= 0 or int(row[4]) <= 0:
			return false
	for row in cells:
		if not row is Array or row.size() < 5 or String(row[2]).is_empty():
			return false
	return true

static func _read_snapshot(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var parser := JSON.new()
	if parser.parse(file.get_as_text()) != OK:
		return {}
	var parsed = parser.data
	return parsed if parsed is Dictionary else {}

static func _sanitized_stock(raw) -> Dictionary:
	var clean: Dictionary = {}
	if not raw is Dictionary:
		return clean
	for key in raw.keys():
		clean[String(key)] = maxi(0, int(raw[key]))
	return clean

static func _valid_pick(value: String) -> String:
	return value if value in ["starter_pick", "stone_pick", "copper_pick", "delver_pick"] else "starter_pick"

static func _valid_weapon(value: String) -> String:
	return value if value in ["starter_blade", "stone_blade"] else "starter_blade"

static func _station_cells(main: Node, group_name: String) -> Array:
	var rows: Array = []
	for node in main.get_tree().get_nodes_in_group(group_name):
		if is_instance_valid(node):
			var cell: Vector2i = node.get("cell")
			rows.append([cell.x, cell.y])
	return rows

static func _group_xs(main: Node, world: SliceWorld, group_name: String) -> Array:
	var xs: Array = []
	for node in main.get_tree().get_nodes_in_group(group_name):
		if is_instance_valid(node) and node is Node2D:
			xs.append(world.world_to_cell((node as Node2D).global_position).x)
	xs.sort()
	return xs

static func _decode_cell(raw) -> Vector2i:
	if raw is Array and raw.size() >= 2:
		return Vector2i(int(raw[0]), int(raw[1]))
	return Vector2i(99999, 99999)

static func _clear_group(main: Node, group_name: String) -> void:
	for node in main.get_tree().get_nodes_in_group(group_name):
		if is_instance_valid(node):
			node.free()

static func _restore_presence(main: Node, world: SliceWorld, group_name: String, raw_xs) -> void:
	var allowed: Dictionary = {}
	if raw_xs is Array:
		for value in raw_xs:
			allowed[int(value)] = true
	for node in main.get_tree().get_nodes_in_group(group_name):
		if not is_instance_valid(node) or not node is Node2D:
			continue
		var x := world.world_to_cell((node as Node2D).global_position).x
		if not allowed.has(x):
			node.free()
