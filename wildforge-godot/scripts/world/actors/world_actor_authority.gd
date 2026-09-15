class_name SliceWorldActorAuthority
extends RefCounted

signal dialogue_requested(payload: Dictionary)

const CrawlerScript = preload("res://scripts/enemies/crawler.gd")
const RelicCacheScript = preload("res://scripts/world/relic_cache.gd")
const TreeScript = preload("res://scripts/world/tree_resource.gd")
const GuardScript = preload("res://scripts/world/actors/settlement_guard.gd")
const BeastScript = preload("res://scripts/world/actors/mossback.gd")
const BannerScript = preload("res://scripts/world/actors/settlement_banner.gd")
const BEAST_ID := "player_storage:mossback"
const KIND_PLAYER_STORAGE := "player_storage"
const STORAGE_CAPACITY := 480.0
const KIND_LOST_CARGO := "lost_cargo"
const KIND_WAREHOUSE := "warehouse"
const KIND_BOUNTY_HUNTER := "bounty_hunter"
const KIND_RAIDER := "war_raider"
const SettlementNpcScript = preload("res://scripts/world/actors/settlement_npc.gd")
const VegetationRegistryScript = preload("res://scripts/world/vegetation/vegetation_registry.gd")

const KIND_RUIN_GUARD := "ruin_guard"
const KIND_RELIC_CACHE := "relic_cache"
const KIND_TREE := "tree"
const KIND_MERCHANT := "merchant"
const KIND_SETTLEMENT_GUARD := "settlement_guard"
const KIND_SETTLEMENT_BANNER := "settlement_banner"

var host: Node
var world: SliceWorld
var player: SlicePlayer
var descriptors: Dictionary = {}
var ids_by_chunk: Dictionary = {}
var projections: Dictionary = {}
var activation_count := 0
var deactivation_count := 0
var vegetation_registry := VegetationRegistryScript.new() as SliceVegetationRegistry
var war_raid_signature := ""

func _init(owner_host: Node, owner_world: SliceWorld, owner_player: SlicePlayer) -> void:
	host = owner_host
	world = owner_world
	player = owner_player
	world.chunk_activated.connect(_on_chunk_activated)
	world.chunk_deactivated.connect(_on_chunk_deactivated)

func clear_world_baseline() -> void:
	for raw_id in projections.keys():
		var node: Node = projections[raw_id]
		if is_instance_valid(node):
			node.free()
	projections.clear()
	war_raid_signature = ""
	descriptors.clear()
	ids_by_chunk.clear()

func register_exploration_sites(sites: Array) -> void:
	for site in sites:
		var guard_cell: Vector2i = site.get("guard_cell", Vector2i.ZERO)
		var cache_cell: Vector2i = site.get("cache_cell", Vector2i.ZERO)
		var guard_id := "ruin_guard:%d:%d" % [guard_cell.x, guard_cell.y]
		var cache_id := "relic_cache:%d:%d" % [cache_cell.x, cache_cell.y]
		_register_actor(guard_id, KIND_RUIN_GUARD, guard_cell, {})
		_register_actor(cache_id, KIND_RELIC_CACHE, cache_cell, {"guard_id": guard_id})

func register_settlement_npcs(raw_settlements: Array) -> void:
	for raw_settlement in raw_settlements:
		if not raw_settlement is Dictionary:
			continue
		var settlement: Dictionary = raw_settlement
		var settlement_id := String(settlement.get("id", ""))
		var faction_id := String(settlement.get("founding_faction", ""))
		var anchor_data = settlement.get("anchor_cell", [])
		if anchor_data is Array and anchor_data.size() >= 2:
			var banner_cell := Vector2i(int(anchor_data[0]) - 10, int(anchor_data[1]))
			_register_actor(settlement_id + ":banner", KIND_SETTLEMENT_BANNER, banner_cell, {"settlement_id": settlement_id, "faction_id": faction_id})
		var hunter_id := settlement_id + ":hunter"
		_register_actor(hunter_id, KIND_BOUNTY_HUNTER, world.settlement_authority.market_cell(settlement_id), {"settlement_id": settlement_id, "faction_id": faction_id, "hunter": true, "display_name": "悬赏追捕者", "role": "势力追捕队"})
		if not (descriptors[hunter_id] as Dictionary).has("security_initialized"):
			(descriptors[hunter_id] as Dictionary)["present"] = false
			(descriptors[hunter_id] as Dictionary)["security_initialized"] = true
		var warehouse_cell: Vector2i = world.settlement_authority.warehouse_door(settlement_id)
		_register_actor(settlement_id + ":warehouse_access", KIND_WAREHOUSE, warehouse_cell, {"settlement_id": settlement_id, "faction_id": faction_id, "display_name": "势力仓库", "role": "受卫兵保护的物资库", "dialogue": ["这座仓库供应当地集市和居民。"]})
		var raw_npcs = settlement.get("npcs", [])
		if not raw_npcs is Array:
			continue
		for raw_npc in raw_npcs:
			if not raw_npc is Dictionary:
				continue
			var npc: Dictionary = raw_npc
			var actor_id := String(npc.get("id", ""))
			var declared_kind := String(npc.get("kind", ""))
			var raw_cell = npc.get("cell", [])
			if actor_id.is_empty() or not raw_cell is Array or raw_cell.size() < 2:
				continue
			var kind := KIND_MERCHANT if declared_kind == "merchant" else KIND_SETTLEMENT_GUARD if declared_kind == "guard" else ""
			if kind.is_empty():
				continue
			_register_actor(actor_id, kind, Vector2i(int(raw_cell[0]), int(raw_cell[1])), {
				"settlement_id": settlement_id,
				"faction_id": faction_id,
				"display_name": String(npc.get("display_name", actor_id)),
				"role": String(npc.get("role", "")),
				"dialogue": (npc.get("dialogue", []) as Array).duplicate(),
			})

func register_vegetation_baseline(sites: Array) -> void:
	for raw_site in sites:
		if not raw_site is Dictionary:
			continue
		var site: Dictionary = raw_site
		var cell = site.get("cell", Vector2i(99999, 99999))
		var species_id := String(site.get("species", "wild_tree"))
		if not cell is Vector2i or not vegetation_registry.has(species_id):
			continue
		var actor_id := _tree_actor_id(cell)
		_register_actor(actor_id, KIND_TREE, cell, {
			"species": species_id,
			"baseline": true,
			"source": String(site.get("source", "wild")),
			"owner_override": "",
		})

func vegetation_delta() -> Dictionary:
	var removed: Array = []
	var planted: Array = []
	for actor_id in actor_ids(KIND_TREE):
		var descriptor: Dictionary = descriptors[actor_id]
		var cell: Vector2i = descriptor["cell"]
		var meta: Dictionary = descriptor.get("meta", {})
		var baseline := bool(meta.get("baseline", false))
		var present := bool(descriptor.get("present", false))
		if baseline and not present:
			removed.append([cell.x, cell.y])
		elif not baseline and present:
			planted.append([cell.x, cell.y, String(meta.get("species", "wild_tree")), String(meta.get("owner_override", ""))])
	removed.sort_custom(func(a, b): return int(a[0]) < int(b[0]) or (int(a[0]) == int(b[0]) and int(a[1]) < int(b[1])))
	planted.sort_custom(func(a, b): return int(a[0]) < int(b[0]) or (int(a[0]) == int(b[0]) and int(a[1]) < int(b[1])))
	return {"removed": removed, "planted": planted}

func restore_vegetation_delta(raw) -> bool:
	if not raw is Dictionary:
		return false
	var removed = raw.get("removed", [])
	var planted = raw.get("planted", [])
	if not removed is Array or not planted is Array:
		return false
	# Reset deterministic baseline and discard previous planted descriptors.
	for actor_id in actor_ids(KIND_TREE):
		var descriptor: Dictionary = descriptors[actor_id]
		var meta: Dictionary = descriptor.get("meta", {})
		if bool(meta.get("baseline", false)):
			descriptor["present"] = true
			descriptors[actor_id] = descriptor
		else:
			if projections.has(actor_id):
				_unload_projection(actor_id)
			_remove_descriptor(actor_id)
	for row in removed:
		if not row is Array or row.size() < 2:
			return false
		var id := _tree_actor_id(Vector2i(int(row[0]), int(row[1])))
		if descriptors.has(id):
			var descriptor: Dictionary = descriptors[id]
			descriptor["present"] = false
			descriptors[id] = descriptor
	for row in planted:
		if not row is Array or row.size() < 4:
			return false
		var cell := Vector2i(int(row[0]), int(row[1]))
		var species_id := String(row[2])
		if not vegetation_registry.has(species_id):
			return false
		_register_actor(_planted_tree_actor_id(cell), KIND_TREE, cell, {
			"species": species_id,
			"baseline": false,
			"source": "planted",
			"owner_override": String(row[3]),
		})
	_reconcile_current_stream()
	return true

func restore_legacy_tree_xs(raw_xs, historical_xs: Array[int]) -> bool:
	if not raw_xs is Array:
		return false
	var allowed: Dictionary = {}
	for value in raw_xs:
		allowed[int(value)] = true
	for x in historical_xs:
		for actor_id in actor_ids(KIND_TREE):
			var descriptor: Dictionary = descriptors[actor_id]
			var cell: Vector2i = descriptor["cell"]
			if cell.x != x:
				continue
			descriptor["present"] = allowed.has(x)
			descriptors[actor_id] = descriptor
	_reconcile_current_stream()
	return true

func plant_tree(cell: Vector2i, species_id := "wild_tree", owner_override := "") -> String:
	if not vegetation_registry.has(species_id) or world.has_cell(cell) or not world.has_cell(cell + Vector2i.DOWN):
		return ""
	var baseline_id := _tree_actor_id(cell)
	if descriptors.has(baseline_id):
		var descriptor: Dictionary = descriptors[baseline_id]
		if bool(descriptor.get("present", false)):
			return ""
		descriptor["present"] = true
		descriptors[baseline_id] = descriptor
		_reconcile_current_stream()
		return baseline_id
	for actor_id in actor_ids(KIND_TREE):
		var descriptor: Dictionary = descriptors[actor_id]
		if bool(descriptor.get("present", false)) and (descriptor["cell"] as Vector2i) == cell:
			return ""
	var actor_id := _planted_tree_actor_id(cell)
	_register_actor(actor_id, KIND_TREE, cell, {
		"species": species_id,
		"baseline": false,
		"source": "planted",
		"owner_override": owner_override,
	})
	_reconcile_current_stream()
	return actor_id

func ownership_for(actor_id: String) -> Dictionary:
	if not descriptors.has(actor_id):
		return {}
	var descriptor: Dictionary = descriptors[actor_id]
	var meta: Dictionary = descriptor.get("meta", {})
	var owner_override := String(meta.get("owner_override", ""))
	if not owner_override.is_empty():
		return {"owner_id": owner_override, "zone_type": "vegetation", "structure_id": actor_id}
	var cell: Vector2i = descriptor["cell"]
	return world.ownership_at(cell)

func restore_legacy_v17_vegetation_delta(raw) -> bool:
	if not raw is Dictionary:
		return false
	var removed = raw.get("removed", [])
	var planted = raw.get("planted", [])
	if not removed is Array or not planted is Array:
		return false
	# v17 vegetation cells were generated against world-generation v1. Preserve intent by x-column.
	for actor_id in actor_ids(KIND_TREE):
		var descriptor: Dictionary = descriptors[actor_id]
		var meta: Dictionary = descriptor.get("meta", {})
		if bool(meta.get("baseline", false)):
			descriptor["present"] = true
			descriptors[actor_id] = descriptor
		else:
			_remove_descriptor(actor_id)
	for row in removed:
		if not row is Array or row.size() < 2:
			return false
		var old_x := int(row[0])
		for actor_id in actor_ids(KIND_TREE):
			var descriptor: Dictionary = descriptors[actor_id]
			var cell: Vector2i = descriptor["cell"]
			var meta: Dictionary = descriptor.get("meta", {})
			if cell.x == old_x and bool(meta.get("baseline", false)):
				descriptor["present"] = false
				descriptors[actor_id] = descriptor
				break
	for row in planted:
		if not row is Array or row.size() < 4:
			return false
		var old_cell := Vector2i(int(row[0]), int(row[1]))
		var species_id := String(row[2])
		if not vegetation_registry.has(species_id):
			return false
		var target := old_cell
		if world.has_cell(target) or not world.has_cell(target + Vector2i.DOWN):
			target = Vector2i(old_cell.x, world.surface_y_at(old_cell.x) - 1)
		if plant_tree(target, species_id, String(row[3])).is_empty():
			return false
	_reconcile_current_stream()
	return true

func sync_active(active_keys: Dictionary) -> void:
	for raw_id in descriptors.keys():
		var actor_id := String(raw_id)
		var descriptor: Dictionary = descriptors[actor_id]
		var key: Vector2i = descriptor["chunk"]
		var should_project := bool(descriptor.get("present", true)) and active_keys.has(key)
		if should_project:
			_ensure_projection(actor_id)
		elif projections.has(actor_id):
			_unload_projection(actor_id)
	_refresh_links()

func is_present(actor_id: String) -> bool:
	return descriptors.has(actor_id) and bool((descriptors[actor_id] as Dictionary).get("present", false))

func is_projected(actor_id: String) -> bool:
	return projections.has(actor_id) and is_instance_valid(projections[actor_id])

func projection_for(actor_id: String) -> Node2D:
	return projections.get(actor_id, null) as Node2D

func descriptor_count(kind := "") -> int:
	return descriptors.size() if String(kind).is_empty() else actor_ids(String(kind)).size()

func projected_count(kind := "") -> int:
	_prune_invalid_projections()
	if String(kind).is_empty():
		return projections.size()
	var count := 0
	for raw_id in projections.keys():
		var actor_id := String(raw_id)
		if descriptors.has(actor_id) and String((descriptors[actor_id] as Dictionary).get("kind", "")) == String(kind):
			count += 1
	return count

func actor_ids(kind := "") -> Array[String]:
	var ids: Array[String] = []
	for raw_id in descriptors.keys():
		var actor_id := String(raw_id)
		var descriptor: Dictionary = descriptors[actor_id]
		if kind.is_empty() or String(descriptor.get("kind", "")) == kind:
			ids.append(actor_id)
	ids.sort()
	return ids

func present_xs(kind: String) -> Array:
	var xs: Array = []
	for actor_id in actor_ids(kind):
		var descriptor: Dictionary = descriptors[actor_id]
		if bool(descriptor.get("present", false)):
			var cell: Vector2i = descriptor["cell"]
			xs.append(cell.x)
	xs.sort()
	return xs

func restore_presence_xs(kind: String, raw_xs) -> bool:
	if not raw_xs is Array:
		return false
	var allowed: Dictionary = {}
	for value in raw_xs:
		allowed[int(value)] = true
	for actor_id in actor_ids(kind):
		var descriptor: Dictionary = descriptors[actor_id]
		var cell: Vector2i = descriptor["cell"]
		descriptor["present"] = allowed.has(cell.x)
		descriptors[actor_id] = descriptor
	_reconcile_current_stream()
	return true

func mark_removed(actor_id: String) -> bool:
	if not descriptors.has(actor_id):
		return false
	var descriptor: Dictionary = descriptors[actor_id]
	if not bool(descriptor.get("present", false)):
		return false
	var meta: Dictionary = descriptor.get("meta", {})
	if String(descriptor.get("kind", "")) == KIND_RAIDER and world.faction_authority != null:
		world.faction_authority.record_raid_defeat(String(meta.get("raid_id", "")), int(meta.get("slot", -1)))
	if String(descriptor.get("kind", "")) == KIND_TREE and not bool(meta.get("baseline", false)):
		_remove_descriptor(actor_id)
	else:
		descriptor["present"] = false
		descriptors[actor_id] = descriptor
		projections.erase(actor_id)
	_refresh_links()
	return true

func _register_actor(actor_id: String, kind: String, cell: Vector2i, metadata: Dictionary) -> void:
	if actor_id.is_empty() or descriptors.has(actor_id):
		return
	if kind in [KIND_SETTLEMENT_GUARD, KIND_BOUNTY_HUNTER]:
		metadata["home_cell"] = [cell.x, cell.y]
	var key := world.chunk_key_for(cell)
	descriptors[actor_id] = {
		"id": actor_id,
		"kind": kind,
		"cell": cell,
		"chunk": key,
		"present": true,
		"meta": metadata.duplicate(true),
	}
	if not ids_by_chunk.has(key):
		ids_by_chunk[key] = {}
	(ids_by_chunk[key] as Dictionary)[actor_id] = true

func _on_chunk_activated(key: Vector2i) -> void:
	if not ids_by_chunk.has(key):
		return
	for raw_id in (ids_by_chunk[key] as Dictionary).keys():
		var actor_id := String(raw_id)
		if is_present(actor_id):
			_ensure_projection(actor_id)
	_refresh_links()

func _on_chunk_deactivated(key: Vector2i) -> void:
	if not ids_by_chunk.has(key):
		return
	for raw_id in (ids_by_chunk[key] as Dictionary).keys():
		var actor_id := String(raw_id)
		if projections.has(actor_id):
			_unload_projection(actor_id)
	_refresh_links()

func _ensure_projection(actor_id: String) -> Node2D:
	if is_projected(actor_id):
		return projections[actor_id] as Node2D
	if not is_present(actor_id):
		return null
	var descriptor: Dictionary = descriptors[actor_id]
	var kind := String(descriptor.get("kind", ""))
	var cell: Vector2i = descriptor["cell"]
	var node: Node2D
	if kind == KIND_RUIN_GUARD:
		var guard := CrawlerScript.new() as SliceCrawler
		guard.name = _node_name("RuinGuard", actor_id)
		guard.player = player
		guard.hp = 78.0
		guard.world_actor_id = actor_id
		guard.world_actor_authority = self
		guard.global_position = world.cell_center(cell) + Vector2(0, -16)
		guard.add_to_group("ruin_guards")
		node = guard
	elif kind == KIND_RAIDER:
		var raider := CrawlerScript.new() as SliceCrawler
		raider.name = _node_name("WarRaider", actor_id)
		raider.player = player
		raider.hp = 72.0
		raider.world_actor_id = actor_id
		raider.world_actor_authority = self
		raider.global_position = world.cell_center(cell) + Vector2(0, -16)
		raider.add_to_group("war_raiders")
		node = raider
	elif kind == KIND_TREE:
		var tree := TreeScript.new() as SliceTreeResource
		var meta: Dictionary = descriptor.get("meta", {})
		var species_id := String(meta.get("species", "wild_tree"))
		tree.name = _node_name("Tree", actor_id)
		tree.world = world
		tree.player = player
		tree.species_id = species_id
		tree.hp = vegetation_registry.harvest_hits(species_id)
		tree.drop_item_id = vegetation_registry.drop_item(species_id)
		tree.drop_count = vegetation_registry.drop_count(species_id)
		tree.world_actor_id = actor_id
		tree.world_actor_authority = self
		tree.global_position = Vector2(cell.x * SliceWorld.TILE_SIZE + SliceWorld.TILE_SIZE * 0.5, (cell.y + 1) * SliceWorld.TILE_SIZE)
		tree.z_index = 5
		node = tree
	elif kind == KIND_SETTLEMENT_BANNER:
		var banner := BannerScript.new() as SliceSettlementBanner
		var banner_meta: Dictionary = descriptor.get("meta", {})
		banner.name = _node_name("SettlementBanner", actor_id)
		banner.setup(world, String(banner_meta.get("settlement_id", "")))
		banner.global_position = Vector2(cell.x * SliceWorld.TILE_SIZE + SliceWorld.TILE_SIZE * 0.5, (cell.y + 1) * SliceWorld.TILE_SIZE - 2.0)
		banner.z_index = 17
		node = banner
	elif kind in [KIND_SETTLEMENT_GUARD, KIND_BOUNTY_HUNTER]:
		var guard := GuardScript.new() as SliceSettlementGuard
		var meta: Dictionary = descriptor.get("meta", {})
		guard.name = _node_name("SettlementGuard", actor_id)
		guard.actor_id = actor_id
		guard.authority = self
		guard.player = player
		guard.payload = meta.duplicate(true)
		guard.global_position = Vector2(cell.x * SliceWorld.TILE_SIZE + SliceWorld.TILE_SIZE * 0.5, (cell.y + 1) * SliceWorld.TILE_SIZE - 2.0)
		guard.z_index = 18
		guard.dialogue_requested.connect(_forward_dialogue)
		node = guard
	elif actor_id == BEAST_ID:
		var beast := BeastScript.new() as SliceMossback
		beast.actor_id = actor_id
		beast.authority = self
		beast.player = player
		beast.global_position = Vector2(cell.x * SliceWorld.TILE_SIZE + SliceWorld.TILE_SIZE * 0.5, (cell.y + 1) * SliceWorld.TILE_SIZE - 2.0)
		beast.dialogue_requested.connect(_forward_dialogue)
		beast.z_index = 18
		node = beast
	elif kind in [KIND_MERCHANT, KIND_WAREHOUSE, KIND_LOST_CARGO, KIND_PLAYER_STORAGE]:
		var npc := SettlementNpcScript.new() as SliceSettlementNpc
		var meta: Dictionary = descriptor.get("meta", {})
		npc.name = _node_name("SettlementNpc", actor_id)
		npc.player = player
		npc.setup(actor_id, "merchant" if kind == KIND_MERCHANT else ("lost_cargo" if kind == KIND_LOST_CARGO else ("player_storage" if kind == KIND_PLAYER_STORAGE else "warehouse")), {
			"actor_id": actor_id,
			"settlement_id": String(meta.get("settlement_id", "")),
			"faction_id": String(meta.get("faction_id", "")),
			"display_name": String(meta.get("display_name", actor_id)),
			"role": String(meta.get("role", "")),
			"dialogue": (meta.get("dialogue", []) as Array).duplicate(),
		})
		npc.global_position = Vector2(cell.x * SliceWorld.TILE_SIZE + SliceWorld.TILE_SIZE * 0.5, (cell.y + 1) * SliceWorld.TILE_SIZE - 2.0)
		npc.z_index = 18
		npc.dialogue_requested.connect(_forward_dialogue)
		node = npc
	elif kind == KIND_RELIC_CACHE:
		var cache := RelicCacheScript.new() as SliceRelicCache
		cache.name = _node_name("RelicCache", actor_id)
		cache.world = world
		cache.player = player
		cache.world_actor_id = actor_id
		cache.world_actor_authority = self
		cache.guard_actor_id = String((descriptor.get("meta", {}) as Dictionary).get("guard_id", ""))
		cache.global_position = world.cell_center(cell) + Vector2(0, 8)
		cache.z_index = 15
		node = cache
	else:
		return null
	host.add_child(node)
	projections[actor_id] = node
	activation_count += 1
	return node

func _forward_dialogue(payload: Dictionary) -> void:
	dialogue_requested.emit(payload)

func _unload_projection(actor_id: String) -> void:
	if not projections.has(actor_id):
		return
	var node: Node = projections[actor_id]
	projections.erase(actor_id)
	if is_instance_valid(node):
		node.free()
	deactivation_count += 1

func _refresh_links() -> void:
	_prune_invalid_projections()
	for actor_id in actor_ids(KIND_RELIC_CACHE):
		if not is_projected(actor_id):
			continue
		var cache := projections[actor_id] as SliceRelicCache
		cache.guard = projection_for(cache.guard_actor_id)

func _reconcile_current_stream() -> void:
	if world.chunk_streamer != null:
		sync_active(world.chunk_streamer.active_keys)

func _prune_invalid_projections() -> void:
	for raw_id in projections.keys():
		if not is_instance_valid(projections[raw_id]):
			projections.erase(raw_id)

func _remove_descriptor(actor_id: String) -> void:
	if not descriptors.has(actor_id):
		return
	var descriptor: Dictionary = descriptors[actor_id]
	var key: Vector2i = descriptor["chunk"]
	descriptors.erase(actor_id)
	projections.erase(actor_id)
	if ids_by_chunk.has(key):
		(ids_by_chunk[key] as Dictionary).erase(actor_id)
		if (ids_by_chunk[key] as Dictionary).is_empty():
			ids_by_chunk.erase(key)

func _tree_actor_id(cell: Vector2i) -> String:
	return "tree:baseline:%d:%d" % [cell.x, cell.y]

func _planted_tree_actor_id(cell: Vector2i) -> String:
	return "tree:planted:%d:%d" % [cell.x, cell.y]

func _node_name(prefix: String, actor_id: String) -> String:
	return "%s_%s" % [prefix, actor_id.replace(":", "_")]

func guard_health(actor_id: String) -> float:
	return float(((descriptors.get(actor_id, {}) as Dictionary).get("meta", {}) as Dictionary).get("health", 420.0))

func damage_guard(actor_id: String, damage: float, at: Vector2) -> void:
	if not descriptors.has(actor_id) or guard_health(actor_id) <= 0.0:
		return
	var row: Dictionary = descriptors[actor_id]
	var meta: Dictionary = row["meta"]
	meta["health"] = maxf(0.0, guard_health(actor_id) - damage)
	row["meta"] = meta
	descriptors[actor_id] = row
	if float(meta["health"]) <= 0.0:
		world.faction_authority.record_player_crime(world.faction_authority.controller_for_settlement(String(meta.get("settlement_id", ""))), 1000)
		var old_key: Vector2i = row["chunk"]
		(ids_by_chunk[old_key] as Dictionary).erase(actor_id)
		var cell := world.world_to_cell(at - Vector2(0, 1))
		row["cell"] = cell
		row["chunk"] = world.chunk_key_for(cell)
		descriptors[actor_id] = row
		if not ids_by_chunk.has(row["chunk"]):
			ids_by_chunk[row["chunk"]] = {}
		(ids_by_chunk[row["chunk"]] as Dictionary)[actor_id] = true

func claim_guard_key(actor_id: String) -> bool:
	if not descriptors.has(actor_id) or guard_health(actor_id) > 0.0 or not is_projected(actor_id):
		return false
	if player.global_position.distance_to(projection_for(actor_id).global_position) > 118.0:
		return false
	var row: Dictionary = descriptors[actor_id]
	var meta: Dictionary = row["meta"]
	if bool(meta.get("hunter", false)) or bool(meta.get("key_taken", false)):
		return false
	meta["key_taken"] = true
	row["meta"] = meta
	descriptors[actor_id] = row
	player.add_item(world.settlement_authority.warehouse_key_id(String(meta["settlement_id"])), 1)
	return true

func export_security() -> Array:
	var rows: Array = []
	for actor_id in actor_ids(KIND_SETTLEMENT_GUARD) + actor_ids(KIND_BOUNTY_HUNTER):
		var row: Dictionary = descriptors[actor_id]
		var meta: Dictionary = row["meta"]
		var cell: Vector2i = row["cell"]
		rows.append({"id": actor_id, "health": guard_health(actor_id), "key_taken": bool(meta.get("key_taken", false)), "present": bool(row.get("present", true)), "cell": [cell.x, cell.y]})
	return rows

func restore_security(raw) -> bool:
	if not raw is Array:
		return false
	var seen: Dictionary = {}
	for entry in raw:
		if not entry is Dictionary:
			return false
		var actor_id := String(entry.get("id", ""))
		if actor_id not in actor_ids(KIND_SETTLEMENT_GUARD) + actor_ids(KIND_BOUNTY_HUNTER) or seen.has(actor_id):
			return false
		var hp := float(entry.get("health", -1.0))
		var cell_data = entry.get("cell", [])
		if not is_finite(hp) or hp < 0 or hp > 420 or not cell_data is Array or cell_data.size() != 2:
			return false
		seen[actor_id] = true
	for actor_id in actor_ids(KIND_SETTLEMENT_GUARD) + actor_ids(KIND_BOUNTY_HUNTER):
		if is_projected(actor_id):
			_unload_projection(actor_id)
		var row: Dictionary = descriptors[actor_id]
		var meta: Dictionary = row["meta"]
		meta["health"] = 420.0
		meta["key_taken"] = false
		row["present"] = not bool(meta.get("hunter", false))
		var old_chunk: Vector2i = row["chunk"]
		(ids_by_chunk[old_chunk] as Dictionary).erase(actor_id)
		var home_cell: Array = meta.get("home_cell", [0, 0])
		row["cell"] = Vector2i(int(home_cell[0]), int(home_cell[1]))
		row["chunk"] = world.chunk_key_for(row["cell"])
		if not ids_by_chunk.has(row["chunk"]):
			ids_by_chunk[row["chunk"]] = {}
		(ids_by_chunk[row["chunk"]] as Dictionary)[actor_id] = true
		for entry in raw:
			if String(entry["id"]) == actor_id:
				meta["health"] = float(entry["health"])
				meta["key_taken"] = bool(entry.get("key_taken", false))
				row["present"] = bool(entry.get("present", true))
				var old_key: Vector2i = row["chunk"]
				(ids_by_chunk[old_key] as Dictionary).erase(actor_id)
				row["cell"] = Vector2i(int(entry["cell"][0]), int(entry["cell"][1]))
				row["chunk"] = world.chunk_key_for(row["cell"])
				if not ids_by_chunk.has(row["chunk"]):
					ids_by_chunk[row["chunk"]] = {}
				(ids_by_chunk[row["chunk"]] as Dictionary)[actor_id] = true
		row["meta"] = meta
		descriptors[actor_id] = row
	_reconcile_current_stream()
	return true

func sync_war_raids(force := false) -> void:
	if world == null or world.faction_authority == null or world.settlement_authority == null:
		return
	var active := world.faction_authority.active_raids()
	var signature_parts: Array[String] = []
	for raw_raid in active:
		var raid: Dictionary = raw_raid
		signature_parts.append("%s:%d:%s" % [String(raid.get("id", "")), int(raid.get("strength", 0)), ",".join((raid.get("defeated_slots", []) as Array).map(func(v): return str(v)))])
	var signature := "|".join(signature_parts)
	if not force and signature == war_raid_signature:
		return
	war_raid_signature = signature
	var desired: Dictionary = {}
	for raw_raid in active:
		var raid: Dictionary = raw_raid
		var raid_id := String(raid.get("id", ""))
		var target_id := String(raid.get("target_settlement", ""))
		var attacker := String(raid.get("attacker", ""))
		if raid_id.is_empty() or not world.settlement_authority.has(target_id):
			continue
		var target_state := world.settlement_authority.state(target_id)
		var target_anchor: Vector2i = target_state.get("anchor_cell", Vector2i.ZERO)
		var source_id := world.settlement_authority.settlement_for_faction(attacker)
		var source_x := target_anchor.x
		if not source_id.is_empty():
			var source_state := world.settlement_authority.state(source_id)
			var source_anchor: Vector2i = source_state.get("anchor_cell", Vector2i.ZERO)
			source_x = source_anchor.x
		var approach_side := -1 if source_x < target_anchor.x else 1
		var defeated: Array = raid.get("defeated_slots", [])
		for slot in range(int(raid.get("max_strength", SliceFactionAuthority.RAID_MAX_STRENGTH))):
			if slot in defeated:
				continue
			var actor_id := "%s:unit:%d" % [raid_id, slot]
			desired[actor_id] = true
			if descriptors.has(actor_id):
				continue
			var x := clampi(target_anchor.x + approach_side * (12 + slot * 2), SliceWorld.MIN_X + 2, SliceWorld.MAX_X - 2)
			var cell := Vector2i(x, world.surface_y_at(x) - 1)
			_register_actor(actor_id, KIND_RAIDER, cell, {"raid_id": raid_id, "slot": slot, "attacker": attacker, "target_settlement": target_id})
	for actor_id in actor_ids(KIND_RAIDER):
		if desired.has(actor_id):
			continue
		if is_projected(actor_id):
			_unload_projection(actor_id)
		_remove_descriptor(actor_id)
	_reconcile_current_stream()

func update_pursuit() -> void:
	if player == null or world == null:
		return
	var active := false
	for actor_id in actor_ids(KIND_BOUNTY_HUNTER):
		if not is_present(actor_id):
			continue
		var node := projection_for(actor_id)
		var row: Dictionary = descriptors[actor_id]
		var at: Vector2 = node.global_position if node != null else world.cell_center(row["cell"])
		if guard_health(actor_id) <= 0 or at.distance_to(player.global_position) > 1400.0:
			row["present"] = false
			descriptors[actor_id] = row
			if is_projected(actor_id):
				_unload_projection(actor_id)
		else:
			active = true
	if active:
		return
	for actor_id in actor_ids(KIND_BOUNTY_HUNTER):
		var row: Dictionary = descriptors[actor_id]
		var meta: Dictionary = row["meta"]
		var faction := world.faction_authority.controller_for_settlement(String(meta["settlement_id"]))
		if not world.faction_authority.pursuit_due(faction):
			continue
		# One patrol at a time, spawned beyond melee range on real surface terrain.
		var player_cell := world.world_to_cell(player.global_position)
		var side := -1 if player_cell.x > 0 else 1
		var x := clampi(player_cell.x + side * 18, SliceWorld.MIN_X + 3, SliceWorld.MAX_X - 3)
		var cell := Vector2i(x, world.surface_y_at(x) - 1)
		if not world.chunk_streamer.active_keys.has(world.chunk_key_for(cell)) or absf(world.cell_center(cell).y - player.global_position.y) > 180.0:
			continue
		(ids_by_chunk[row["chunk"]] as Dictionary).erase(actor_id)
		row["cell"] = cell
		row["chunk"] = world.chunk_key_for(cell)
		row["present"] = true
		if guard_health(actor_id) <= 0.0:
			meta["health"] = 420.0
		row["meta"] = meta
		descriptors[actor_id] = row
		if not ids_by_chunk.has(row["chunk"]):
			ids_by_chunk[row["chunk"]] = {}
		(ids_by_chunk[row["chunk"]] as Dictionary)[actor_id] = true
		world.faction_authority.defer_pursuit(faction)
		_ensure_projection(actor_id)
		break

func drop_player_cargo(at: Vector2) -> void:
	var cargo: Dictionary = {}
	var retained := [player.equipped_pick_id, player.equipped_weapon_id, "workbench", "campfire"]
	for raw_id in player.stock.keys():
		var item_id := String(raw_id)
		var count := player.item_count(item_id)
		if count > 0 and item_id not in retained:
			cargo[item_id] = count
	if cargo.is_empty():
		return
	var serial := 0
	while descriptors.has("lost_cargo:%d" % serial):
		serial += 1
	var actor_id := "lost_cargo:%d" % serial
	var cell := world.world_to_cell(at)
	cell.x = clampi(cell.x, SliceWorld.MIN_X, SliceWorld.MAX_X)
	cell.y = clampi(cell.y, -100, SliceWorld.MAX_Y)
	_register_actor(actor_id, KIND_LOST_CARGO, cell, {"inventory": cargo, "display_name": "遗落的行囊", "role": "死亡时遗落的物资", "dialogue": ["取回物资仍需实际搬运。"]})
	for item_id in cargo.keys():
		player.spend_item(String(item_id), int(cargo[item_id]))
	_reconcile_current_stream()

func cargo_view(actor_id: String, selected_item: String, quantity: int) -> Dictionary:
	if not descriptors.has(actor_id) or String(descriptors[actor_id]["kind"]) not in [KIND_LOST_CARGO, KIND_PLAYER_STORAGE]:
		return {}
	var inventory: Dictionary = descriptors[actor_id]["meta"]["inventory"]
	var goods: Array = []
	for item_id in inventory.keys():
		if int(inventory[item_id]) > 0:
			goods.append(String(item_id))
	var personal := String(descriptors[actor_id]["kind"]) == KIND_PLAYER_STORAGE
	if personal:
		for item_id in player.stock.keys():
			if player.item_count(String(item_id)) > 0 and String(item_id) not in goods:
				goods.append(String(item_id))
	goods.sort()
	if goods.is_empty() and personal:
		goods.append("wood")
	if goods.is_empty():
		return {}
	var item_id: String = selected_item if selected_item in goods else String(goods[0])
	return {"enabled": true, "warehouse": true, "lost_cargo": true, "locked": false, "settlement_id": actor_id,
		"goods": goods, "item_id": item_id, "quantity": quantity, "stock": int(inventory.get(item_id, 0)),
		"personal_storage": personal, "storage_weight": storage_weight(actor_id), "capacity": storage_capacity(actor_id), "beast": actor_id == BEAST_ID, "beast_state": beast_state() if actor_id == BEAST_ID else {},
		"can_deposit": personal and can_deposit(actor_id, item_id, quantity),
		"player_count": player.item_count(item_id), "can_carry": player.can_carry(item_id, quantity), "weight": player.carried_weight()}

func recover_cargo(actor_id: String, item_id: String, quantity: int) -> Dictionary:
	if not is_projected(actor_id) or player.global_position.distance_to(projection_for(actor_id).global_position) > 112.0:
		return {"ok": false, "reason": "not_at_warehouse"}
	if String(descriptors[actor_id]["kind"]) not in [KIND_LOST_CARGO, KIND_PLAYER_STORAGE] or quantity not in ([1, 5, 20] if String(descriptors[actor_id]["kind"]) == KIND_PLAYER_STORAGE else [1, 5]):
		return {"ok": false, "reason": "invalid_trade"}
	var inventory: Dictionary = descriptors[actor_id]["meta"]["inventory"]
	if int(inventory.get(item_id, 0)) < quantity:
		return {"ok": false, "reason": "stock_short"}
	if not player.can_carry(item_id, quantity):
		return {"ok": false, "reason": "overburdened"}
	inventory[item_id] = int(inventory[item_id]) - quantity
	player.add_item(item_id, quantity)
	if String(descriptors[actor_id]["kind"]) == KIND_LOST_CARGO and cargo_view(actor_id, item_id, 1).is_empty():
		_unload_projection(actor_id)
		_remove_descriptor(actor_id)
	return {"ok": true}

func export_lost_cargo() -> Array:
	var rows: Array = []
	for actor_id in actor_ids(KIND_LOST_CARGO):
		var row: Dictionary = descriptors[actor_id]
		var cell: Vector2i = row["cell"]
		rows.append({"id": actor_id, "cell": [cell.x, cell.y], "inventory": (row["meta"]["inventory"] as Dictionary).duplicate(true)})
	return rows

func restore_lost_cargo(raw) -> bool:
	if not raw is Array:
		return false
	for actor_id in actor_ids(KIND_LOST_CARGO):
		if is_projected(actor_id):
			_unload_projection(actor_id)
		_remove_descriptor(actor_id)
	for row in raw:
		var cell := Vector2i(int(row["cell"][0]), int(row["cell"][1]))
		_register_actor(String(row["id"]), KIND_LOST_CARGO, cell, {"inventory": (row["inventory"] as Dictionary).duplicate(true), "display_name": "遗落的行囊", "role": "死亡时遗落的物资", "dialogue": ["取回物资仍需实际搬运。"]})
	_reconcile_current_stream()
	return true

func has_container_at(cell: Vector2i) -> bool:
	for id in actor_ids(KIND_PLAYER_STORAGE):
		if id == BEAST_ID and float(beast_state().get("health", 0)) <= 0:
			continue
		if (descriptors[id]["cell"] as Vector2i) == cell:
			return true
	return false

func can_place_storage(cell: Vector2i) -> bool:
	if player.item_count("storage_box") <= 0 or world.cell_center(cell).distance_to(player.global_position) > SlicePlayer.REACH:
		return false
	if world.owner_at(cell) not in ["wilderness", "player"] or has_container_at(cell):
		return false
	var decision: Dictionary = world.edit_authority.evaluate(world, {"action": "station", "cell": cell, "station_kind": "storage_box", "actor_id": "player"})
	if not bool(decision.get("allowed", false)):
		return false
	return true

func place_storage(cell: Vector2i) -> bool:
	if not can_place_storage(cell):
		return false
	var serial := 0
	while descriptors.has("player_storage:%d" % serial):
		serial += 1
	if not player.spend_item("storage_box", 1):
		return false
	_register_actor("player_storage:%d" % serial, KIND_PLAYER_STORAGE, cell, {"inventory": {}, "display_name": "个人储物箱", "role": "营地仓储 · 容量480", "dialogue": ["把暂时不用的物资留在这里，轻装出发。", "只能在箱子旁存取。空箱可以收起搬走。"]})
	_reconcile_current_stream()
	return true

func storage_weight(actor_id: String) -> float:
	if not descriptors.has(actor_id):
		return 0.0
	var inventory: Dictionary = descriptors[actor_id]["meta"].get("inventory", {})
	var total := 0.0
	for item_id in inventory.keys():
		total += player.cargo_unit_weight(String(item_id)) * int(inventory[item_id])
	return total

func can_deposit(actor_id: String, item_id: String, quantity: int) -> bool:
	if not descriptors.has(actor_id) or String(descriptors[actor_id]["kind"]) != KIND_PLAYER_STORAGE or quantity not in [1, 5, 20]:
		return false
	if actor_id == BEAST_ID and float(beast_state().get("health", 0)) <= 0:
		return false
	# Equipped gear remains a player-owned capability; unequipped spares are storable.
	var reserve := 1 if item_id in [player.equipped_pick_id, player.equipped_weapon_id, player.equipped_axe_id] else 0
	return player.item_count(item_id) - reserve >= quantity and storage_weight(actor_id) + player.cargo_unit_weight(item_id) * quantity <= storage_capacity(actor_id)

func deposit_cargo(actor_id: String, item_id: String, quantity: int) -> Dictionary:
	if not is_projected(actor_id) or player.global_position.distance_to(projection_for(actor_id).global_position) > 112.0:
		return {"ok": false, "reason": "not_at_warehouse"}
	if not can_deposit(actor_id, item_id, quantity):
		return {"ok": false, "reason": "storage_full"}
	if not player.spend_item(item_id, quantity):
		return {"ok": false, "reason": "stock_short"}
	var inventory: Dictionary = descriptors[actor_id]["meta"]["inventory"]
	inventory[item_id] = int(inventory.get(item_id, 0)) + quantity
	return {"ok": true}

func pack_storage(actor_id: String) -> bool:
	if actor_id == BEAST_ID:
		return false
	if not is_projected(actor_id) or String(descriptors[actor_id]["kind"]) != KIND_PLAYER_STORAGE or player.global_position.distance_to(projection_for(actor_id).global_position) > 112.0:
		return false
	var inventory: Dictionary = descriptors[actor_id]["meta"]["inventory"]
	for count in inventory.values():
		if int(count) > 0:
			return false
	if not player.can_carry("storage_box", 1):
		return false
	player.add_item("storage_box", 1)
	_unload_projection(actor_id)
	_remove_descriptor(actor_id)
	return true

func export_storage() -> Array:
	var rows: Array = []
	for actor_id in actor_ids(KIND_PLAYER_STORAGE):
		var row: Dictionary = descriptors[actor_id]
		var cell: Vector2i = row["cell"]
		rows.append({"beast": beast_state().duplicate(true) if actor_id == BEAST_ID else {}, "id": actor_id, "cell": [cell.x, cell.y], "inventory": (row["meta"]["inventory"] as Dictionary).duplicate(true)})
	return rows

func restore_storage(raw: Array) -> void:
	for actor_id in actor_ids(KIND_PLAYER_STORAGE):
		if is_projected(actor_id):
			_unload_projection(actor_id)
		_remove_descriptor(actor_id)
	for row in raw:
		_register_actor(String(row["id"]), KIND_PLAYER_STORAGE, Vector2i(int(row["cell"][0]), int(row["cell"][1])), {"inventory": (row["inventory"] as Dictionary).duplicate(true), "display_name": "个人储物箱", "role": "营地仓储 · 容量480", "dialogue": ["存放补给、整理货物，再继续远行。"]})
		if String(row["id"]) == BEAST_ID:
			descriptors[BEAST_ID]["meta"]["beast"] = (row.get("beast", {}) as Dictionary).duplicate(true)
	_reconcile_current_stream()

# Navigation reads durable container positions; it does not maintain a second registry.
func storage_destinations() -> Array:
	var entries: Array = []
	for id in actor_ids(KIND_PLAYER_STORAGE):
		var cell: Vector2i = descriptors[id]["cell"]
		entries.append({"id": id, "label": "%s (%d, %d) · %d/%d" % ["驮兽" if id == BEAST_ID else "货栈", cell.x, cell.y, int(storage_weight(id)), int(storage_capacity(id))]})
	return entries

func storage_position(id: String) -> Vector2:
	return world.cell_center(descriptors[id]["cell"]) if descriptors.has(id) and String(descriptors[id]["kind"]) == KIND_PLAYER_STORAGE else Vector2.INF

func storage_capacity(id: String) -> float:
	return 320.0 if id == BEAST_ID else STORAGE_CAPACITY

func beast_state() -> Dictionary:
	return descriptors[BEAST_ID]["meta"].get("beast", {}) if descriptors.has(BEAST_ID) else {}

func buy_beast(town: String) -> bool:
	if descriptors.has(BEAST_ID) or player.nearby_market_id() != town or world.settlement_authority.market_closed_to_player(town) or player.forge_marks < 240:
		return false
	var cell := world.world_to_cell(player.global_position)
	cell.x += 2
	cell.y = world.surface_y_at(cell.x) - 1
	if world.has_cell(cell) or world.has_cell(cell + Vector2i.UP):
		return false
	if not world.settlement_authority.pay_for_pack_beast(player, town):
		return false
	_register_actor(BEAST_ID, KIND_PLAYER_STORAGE, cell, {"inventory": {}, "beast": {"health": 180.0, "food": 100.0, "following": true}})
	_reconcile_current_stream()
	return true

func move_beast(at: Vector2, distance: float) -> void:
	if not descriptors.has(BEAST_ID):
		return
	var row: Dictionary = descriptors[BEAST_ID]
	var cell := world.world_to_cell(at - Vector2(0, 4))
	cell.x = clampi(cell.x, SliceWorld.MIN_X, SliceWorld.MAX_X)
	cell.y = clampi(cell.y, -100, SliceWorld.MAX_Y)
	var chunk := world.chunk_key_for(cell)
	if chunk != row["chunk"]:
		(ids_by_chunk[row["chunk"]] as Dictionary).erase(BEAST_ID)
		if not ids_by_chunk.has(chunk):
			ids_by_chunk[chunk] = {}
		(ids_by_chunk[chunk] as Dictionary)[BEAST_ID] = true
		row["chunk"] = chunk
	row["cell"] = cell
	var state := beast_state()
	state["food"] = maxf(0.0, float(state.get("food", 0)) - distance / 900.0)

func hurt_beast(amount: float) -> void:
	var state := beast_state()
	if state.is_empty() or float(state["health"]) <= 0:
		return
	state["health"] = maxf(0.0, float(state["health"]) - maxf(0.0, amount))
	if float(state["health"]) <= 0:
		state["following"] = false
		var inventory: Dictionary = descriptors[BEAST_ID]["meta"]["inventory"]
		# Destruction occurs once on the alive -> dead transition, in the original ledger.
		for item in inventory.keys():
			if not String(item).begins_with("warehouse_key:"):
				inventory[item] = int(floor(int(inventory[item]) * 0.75))

func tend_beast(feed: bool) -> bool:
	if not is_projected(BEAST_ID) or player.global_position.distance_to(projection_for(BEAST_ID).global_position) > 112:
		return false
	var state := beast_state()
	if float(state["health"]) <= 0:
		return false
	if feed:
		if float(state["food"]) >= 100.0 and float(state["health"]) >= 180.0:
			return false
		if not player.spend_item("trail_ration", 1):
			return false
		state["food"] = minf(100, float(state["food"]) + 35)
		state["health"] = minf(180, float(state["health"]) + 30)
	else:
		state["following"] = not bool(state["following"])
	return true

func bury_beast() -> bool:
	if beast_state().is_empty() or float(beast_state()["health"]) > 0 or not is_projected(BEAST_ID) or player.global_position.distance_to(projection_for(BEAST_ID).global_position) > 112:
		return false
	for count in (descriptors[BEAST_ID]["meta"]["inventory"] as Dictionary).values():
		if int(count) > 0:
			return false
	_unload_projection(BEAST_ID)
	_remove_descriptor(BEAST_ID)
	return true
