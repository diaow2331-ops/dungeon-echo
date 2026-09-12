class_name SliceWorldActorAuthority
extends RefCounted

const CrawlerScript = preload("res://scripts/enemies/crawler.gd")
const RelicCacheScript = preload("res://scripts/world/relic_cache.gd")

const KIND_RUIN_GUARD := "ruin_guard"
const KIND_RELIC_CACHE := "relic_cache"

var host: Node
var world: SliceWorld
var player: SlicePlayer
var descriptors: Dictionary = {}
var ids_by_chunk: Dictionary = {}
var projections: Dictionary = {}
var activation_count := 0
var deactivation_count := 0

func _init(owner_host: Node, owner_world: SliceWorld, owner_player: SlicePlayer) -> void:
	host = owner_host
	world = owner_world
	player = owner_player
	world.chunk_activated.connect(_on_chunk_activated)
	world.chunk_deactivated.connect(_on_chunk_deactivated)

func register_exploration_sites(sites: Array) -> void:
	for site in sites:
		var guard_cell: Vector2i = site.get("guard_cell", Vector2i.ZERO)
		var cache_cell: Vector2i = site.get("cache_cell", Vector2i.ZERO)
		var guard_id := "ruin_guard:%d:%d" % [guard_cell.x, guard_cell.y]
		var cache_id := "relic_cache:%d:%d" % [cache_cell.x, cache_cell.y]
		_register_actor(guard_id, KIND_RUIN_GUARD, guard_cell, {})
		_register_actor(cache_id, KIND_RELIC_CACHE, cache_cell, {"guard_id": guard_id})

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

func descriptor_count() -> int:
	return descriptors.size()

func projected_count() -> int:
	_prune_invalid_projections()
	return projections.size()

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

func _node_name(prefix: String, actor_id: String) -> String:
	return "%s_%s" % [prefix, actor_id.replace(":", "_")]
