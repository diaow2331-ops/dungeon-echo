class_name SliceLightingAuthority
extends RefCounted

const SUNLIGHT := 1.0
const AIR_FALLOFF := 0.08
const SOLID_BASE_FALLOFF := 0.28
const SOLID_ABSORPTION_SCALE := 0.52
const MIN_LIGHT := 0.035
const HALO_CHUNKS := 1
const SKY_SCAN_MIN_Y := -32

var world: Node
var chunk_cache: Dictionary = {}
var emitters: Dictionary = {}
var dirty := true
var rebuild_count := 0
var last_cells_computed := 0
var last_active_chunks := 0

func _init(owner_world: Node) -> void:
	world = owner_world

func mark_streaming_changed() -> void:
	dirty = true

func mark_cell_changed(cell: Vector2i) -> void:
	if world == null or world.chunk_streamer == null:
		dirty = true
		return
	var key: Vector2i = world.chunk_key_for(cell)
	if _near_active(key, world.chunk_streamer.active_keys):
		dirty = true

func set_emitter(source_id: String, cell: Vector2i, strength := 1.0) -> void:
	var next := {"cell": cell, "strength": clampf(strength, 0.0, 1.0)}
	if emitters.get(source_id, {}) == next:
		return
	emitters[source_id] = next
	mark_cell_changed(cell)

func remove_emitter(source_id: String) -> void:
	if not emitters.has(source_id):
		return
	var old: Dictionary = emitters[source_id]
	emitters.erase(source_id)
	mark_cell_changed(old.get("cell", Vector2i.ZERO))

func has_cache(key: Vector2i) -> bool:
	return chunk_cache.has(key)

func cached_chunk_count() -> int:
	return chunk_cache.size()

func light_level(cell: Vector2i) -> float:
	if world == null:
		return 0.0
	var key: Vector2i = world.chunk_key_for(cell)
	if not chunk_cache.has(key):
		return 0.0
	var local: Vector2i = cell - key * world.CHUNK_SIZE
	if local.x < 0 or local.y < 0 or local.x >= world.CHUNK_SIZE or local.y >= world.CHUNK_SIZE:
		return 0.0
	var values: PackedFloat32Array = chunk_cache[key]
	return values[local.y * world.CHUNK_SIZE + local.x]

func sync_active(active_keys: Dictionary) -> bool:
	if not dirty and _same_keys(active_keys, chunk_cache):
		return false
	rebuild_active(active_keys)
	return true

func rebuild_active(active_keys: Dictionary) -> void:
	chunk_cache.clear()
	last_active_chunks = active_keys.size()
	if active_keys.is_empty():
		dirty = false
		last_cells_computed = 0
		return
	var min_key := Vector2i(999999, 999999)
	var max_key := Vector2i(-999999, -999999)
	for raw in active_keys.keys():
		var key: Vector2i = raw
		min_key.x = mini(min_key.x, key.x)
		min_key.y = mini(min_key.y, key.y)
		max_key.x = maxi(max_key.x, key.x)
		max_key.y = maxi(max_key.y, key.y)
	min_key -= Vector2i(HALO_CHUNKS, HALO_CHUNKS)
	max_key += Vector2i(HALO_CHUNKS, HALO_CHUNKS)
	var min_cell: Vector2i = min_key * int(world.CHUNK_SIZE)
	var max_cell: Vector2i = (max_key + Vector2i.ONE) * int(world.CHUNK_SIZE) - Vector2i.ONE
	var width: int = max_cell.x - min_cell.x + 1
	var height: int = max_cell.y - min_cell.y + 1
	var values := PackedFloat32Array()
	values.resize(width * height)
	values.fill(0.0)
	var queue: Array[Vector2i] = []
	_seed_sunlight(values, queue, min_cell, max_cell, width)
	_seed_block_emission(values, queue, min_cell, max_cell, width)
	_seed_runtime_emitters(values, queue, min_cell, max_cell, width)
	_propagate(values, queue, min_cell, max_cell, width)
	_cache_active(active_keys, values, min_cell, width)
	last_cells_computed = width * height
	rebuild_count += 1
	dirty = false

func _seed_sunlight(values: PackedFloat32Array, queue: Array[Vector2i], min_cell: Vector2i, max_cell: Vector2i, width: int) -> void:
	for x in range(min_cell.x, max_cell.x + 1):
		var first_solid := _first_solid_y(x)
		var upper := mini(max_cell.y, first_solid - 1)
		for y in range(min_cell.y, upper + 1):
			var cell := Vector2i(x, y)
			var idx := _index(cell, min_cell, width)
			values[idx] = SUNLIGHT
			queue.append(cell)

func _seed_block_emission(values: PackedFloat32Array, queue: Array[Vector2i], min_cell: Vector2i, max_cell: Vector2i, width: int) -> void:
	for x in range(min_cell.x, max_cell.x + 1):
		for y in range(min_cell.y, max_cell.y + 1):
			var cell := Vector2i(x, y)
			var emission: float = world.block_registry.light_emission(world.tile_at(cell))
			if emission <= MIN_LIGHT:
				continue
			_set_seed(values, queue, cell, emission, min_cell, width)

func _seed_runtime_emitters(values: PackedFloat32Array, queue: Array[Vector2i], min_cell: Vector2i, max_cell: Vector2i, width: int) -> void:
	for raw in emitters.values():
		var source: Dictionary = raw
		var cell: Vector2i = source.get("cell", Vector2i.ZERO)
		if _inside(cell, min_cell, max_cell):
			_set_seed(values, queue, cell, float(source.get("strength", 0.0)), min_cell, width)
	if world.get_tree() == null:
		return
	for node in world.get_tree().get_nodes_in_group("campfires"):
		if not is_instance_valid(node):
			continue
		var cell: Vector2i = node.get("cell")
		if _inside(cell, min_cell, max_cell):
			_set_seed(values, queue, cell, 0.95, min_cell, width)

func _propagate(values: PackedFloat32Array, queue: Array[Vector2i], min_cell: Vector2i, max_cell: Vector2i, width: int) -> void:
	var head := 0
	while head < queue.size():
		var cell := queue[head]
		head += 1
		var current := values[_index(cell, min_cell, width)]
		for direction in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
			var next: Vector2i = cell + direction
			if not _inside(next, min_cell, max_cell):
				continue
			var tile: int = world.tile_at(next)
			var attenuation := AIR_FALLOFF
			if tile != 0:
				attenuation = SOLID_BASE_FALLOFF + world.block_registry.light_absorption(tile) * SOLID_ABSORPTION_SCALE
			var target := current - attenuation
			if target < MIN_LIGHT:
				continue
			var idx := _index(next, min_cell, width)
			if target <= values[idx] + 0.005:
				continue
			values[idx] = target
			queue.append(next)

func _cache_active(active_keys: Dictionary, values: PackedFloat32Array, min_cell: Vector2i, width: int) -> void:
	for raw in active_keys.keys():
		var key: Vector2i = raw
		var cached := PackedFloat32Array()
		cached.resize(world.CHUNK_SIZE * world.CHUNK_SIZE)
		var start: Vector2i = key * int(world.CHUNK_SIZE)
		for lx in range(world.CHUNK_SIZE):
			for ly in range(world.CHUNK_SIZE):
				var cell: Vector2i = start + Vector2i(lx, ly)
				cached[ly * world.CHUNK_SIZE + lx] = values[_index(cell, min_cell, width)]
		chunk_cache[key] = cached

func _set_seed(values: PackedFloat32Array, queue: Array[Vector2i], cell: Vector2i, strength: float, min_cell: Vector2i, width: int) -> void:
	var idx := _index(cell, min_cell, width)
	if strength <= values[idx]:
		return
	values[idx] = strength
	queue.append(cell)

func _first_solid_y(x: int) -> int:
	for y in range(SKY_SCAN_MIN_Y, world.MAX_Y + 1):
		if world.has_cell(Vector2i(x, y)):
			return y
	return world.MAX_Y + 1

func _index(cell: Vector2i, min_cell: Vector2i, width: int) -> int:
	return (cell.y - min_cell.y) * width + (cell.x - min_cell.x)

func _inside(cell: Vector2i, min_cell: Vector2i, max_cell: Vector2i) -> bool:
	return cell.x >= min_cell.x and cell.x <= max_cell.x and cell.y >= min_cell.y and cell.y <= max_cell.y

func _near_active(key: Vector2i, active_keys: Dictionary) -> bool:
	for raw in active_keys.keys():
		var active: Vector2i = raw
		if absi(active.x - key.x) <= HALO_CHUNKS and absi(active.y - key.y) <= HALO_CHUNKS:
			return true
	return false

func _same_keys(left: Dictionary, right: Dictionary) -> bool:
	if left.size() != right.size():
		return false
	for key in left.keys():
		if not right.has(key):
			return false
	return true
