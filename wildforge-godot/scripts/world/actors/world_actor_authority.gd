class_name SliceWorldActorAuthority
extends RefCounted

signal dialogue_requested(payload: Dictionary)

const CrawlerScript = preload("res://scripts/enemies/crawler.gd")
const RelicCacheScript = preload("res://scripts/world/relic_cache.gd")
const TreeScript = preload("res://scripts/world/tree_resource.gd")
const SettlementNpcScript = preload("res://scripts/world/actors/settlement_npc.gd")
const VegetationRegistryScript = preload("res://scripts/world/vegetation/vegetation_registry.gd")

const KIND_RUIN_GUARD := "ruin_guard"
const KIND_RELIC_CACHE := "relic_cache"
const KIND_TREE := "tree"
const KIND_MERCHANT := "merchant"
const KIND_SETTLEMENT_GUARD := "settlement_guard"

var host: Node
var world: SliceWorld
var player: SlicePlayer
var descriptors: Dictionary = {}
var ids_by_chunk: Dictionary = {}
var projections: Dictionary = {}
var activation_count := 0
var deactivation_count := 0
var vegetation_registry := VegetationRegistryScript.new() as SliceVegetationRegistry

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
	elif kind in [KIND_MERCHANT, KIND_SETTLEMENT_GUARD]:
		var npc := SettlementNpcScript.new() as SliceSettlementNpc
		var meta: Dictionary = descriptor.get("meta", {})
		npc.name = _node_name("SettlementNpc", actor_id)
		npc.player = player
		npc.setup(actor_id, "merchant" if kind == KIND_MERCHANT else "guard", {
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
