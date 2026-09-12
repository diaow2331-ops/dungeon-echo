class_name SliceFluidAuthority
extends RefCounted

const MAX_AMOUNT := 1.0
const MIN_AMOUNT := 0.01
const SIDE_FLOW_FRACTION := 0.5
const SIM_HALO_CHUNKS := 1

var world: Node
var registry: SliceFluidRegistry
var cells: Dictionary = {}
var chunk_cells: Dictionary = {}
var tick_index := 0
var last_sources_considered := 0
var last_chunks_considered := 0
var last_changed_cells := 0
var reaction_events: Array[Dictionary] = []

func _init(owner_world: Node, fluid_registry: SliceFluidRegistry) -> void:
	world = owner_world
	registry = fluid_registry

func amount_at(cell: Vector2i) -> float:
	return float((cells.get(cell, {}) as Dictionary).get("amount", 0.0))

func kind_at(cell: Vector2i) -> String:
	return String((cells.get(cell, {}) as Dictionary).get("kind", ""))

func fluid_at(cell: Vector2i) -> Dictionary:
	return (cells.get(cell, {}) as Dictionary).duplicate(true)

func set_fluid(cell: Vector2i, kind: String, amount: float) -> bool:
	if not registry.has(kind) or world.has_cell(cell) or not world.is_cell_in_bounds(cell):
		return false
	var clamped := clampf(amount, 0.0, MAX_AMOUNT)
	if clamped < MIN_AMOUNT:
		return clear_cell(cell)
	cells[cell] = {"kind": kind, "amount": clamped}
	_index_add(cell)
	_mark_changed(cell)
	return true

func clear_cell(cell: Vector2i) -> bool:
	if not cells.has(cell):
		return false
	cells.erase(cell)
	_index_remove(cell)
	_mark_changed(cell)
	return true

func clear_all() -> void:
	cells.clear()
	chunk_cells.clear()
	reaction_events.clear()
	_mark_all_visible()

func total_amount(kind := "") -> float:
	var total := 0.0
	for raw in cells.values():
		var data: Dictionary = raw
		if kind.is_empty() or String(data.get("kind", "")) == kind:
			total += float(data.get("amount", 0.0))
	return total

func indexed_chunk_count() -> int:
	return chunk_cells.size()

func step(active_keys: Dictionary) -> void:
	tick_index += 1
	last_sources_considered = 0
	last_chunks_considered = 0
	last_changed_cells = 0
	reaction_events.clear()
	var sources: Array[Vector2i] = _active_sources(active_keys)
	var changes: Dictionary = {}
	for cell in sources:
		if not cells.has(cell):
			continue
		last_sources_considered += 1
		var data: Dictionary = cells[cell]
		var kind := String(data.get("kind", ""))
		var remaining := float(data.get("amount", 0.0)) + float(changes.get(cell, 0.0))
		if remaining < MIN_AMOUNT:
			continue
		remaining = _flow_to(cell, cell + Vector2i.DOWN, kind, remaining, changes, true, active_keys)
		if remaining < MIN_AMOUNT:
			continue
		var first := Vector2i.LEFT if tick_index % 2 == 0 else Vector2i.RIGHT
		remaining = _flow_to(cell, cell + first, kind, remaining, changes, false, active_keys)
		if remaining >= MIN_AMOUNT:
			_flow_to(cell, cell - first, kind, remaining, changes, false, active_keys)
	_apply_changes(changes)

func _active_sources(active_keys: Dictionary) -> Array[Vector2i]:
	var sources: Array[Vector2i] = []
	var seen: Dictionary = {}
	for raw_active in active_keys.keys():
		var active: Vector2i = raw_active
		for dx in range(-SIM_HALO_CHUNKS, SIM_HALO_CHUNKS + 1):
			for dy in range(-SIM_HALO_CHUNKS, SIM_HALO_CHUNKS + 1):
				var key := active + Vector2i(dx, dy)
				if seen.has(key):
					continue
				seen[key] = true
				if not chunk_cells.has(key):
					continue
				last_chunks_considered += 1
				for raw_cell in (chunk_cells[key] as Dictionary).keys():
					sources.append(raw_cell)
	sources.sort_custom(func(a: Vector2i, b: Vector2i):
		return a.y > b.y if a.y != b.y else a.x < b.x)
	return sources

func _flow_to(source: Vector2i, target: Vector2i, kind: String, available: float, changes: Dictionary, downward: bool, active_keys: Dictionary) -> float:
	if available < MIN_AMOUNT or not world.is_cell_in_bounds(target) or world.has_cell(target):
		return available
	if not _near_active(world.chunk_key_for(target), active_keys):
		return available
	var target_kind := kind_at(target)
	if not target_kind.is_empty() and target_kind != kind:
		return available - _react(source, target, kind, target_kind, available, changes)
	var target_amount := amount_at(target) + float(changes.get(target, 0.0))
	var capacity := MAX_AMOUNT - target_amount
	if capacity <= MIN_AMOUNT:
		return available
	var flow := minf(available, capacity) if downward else minf(available * SIDE_FLOW_FRACTION, capacity)
	if flow < MIN_AMOUNT:
		return available
	changes[source] = float(changes.get(source, 0.0)) - flow
	changes[target] = float(changes.get(target, 0.0)) + flow
	if not cells.has(target):
		cells[target] = {"kind": kind, "amount": 0.0}
		_index_add(target)
	return available - flow

func _react(source: Vector2i, target: Vector2i, source_kind: String, target_kind: String, available: float, changes: Dictionary) -> float:
	if not ((source_kind == "water" and target_kind == "lava") or (source_kind == "lava" and target_kind == "water")):
		return 0.0
	var target_available := amount_at(target) + float(changes.get(target, 0.0))
	var consumed := minf(0.25, minf(available, target_available))
	if consumed < MIN_AMOUNT:
		return 0.0
	changes[source] = float(changes.get(source, 0.0)) - consumed
	changes[target] = float(changes.get(target, 0.0)) - consumed
	reaction_events.append({"cell": target, "a": source_kind, "b": target_kind, "consumed_each": consumed})
	return consumed

func _apply_changes(changes: Dictionary) -> void:
	for raw_cell in changes.keys():
		var cell: Vector2i = raw_cell
		var data: Dictionary = cells.get(cell, {})
		var next := clampf(float(data.get("amount", 0.0)) + float(changes[cell]), 0.0, MAX_AMOUNT)
		if next < MIN_AMOUNT:
			cells.erase(cell)
			_index_remove(cell)
		else:
			data["amount"] = next
			cells[cell] = data
			_index_add(cell)
		_mark_changed(cell)
		last_changed_cells += 1

func export_state() -> Array:
	var rows: Array = []
	var coords: Array[Vector2i] = []
	for raw in cells.keys():
		coords.append(raw)
	coords.sort_custom(func(a: Vector2i, b: Vector2i): return a.x < b.x if a.x != b.x else a.y < b.y)
	for cell in coords:
		var data: Dictionary = cells[cell]
		rows.append([cell.x, cell.y, String(data.get("kind", "")), float(data.get("amount", 0.0))])
	return rows

func restore_state(rows: Array) -> bool:
	var restored: Dictionary = {}
	for row in rows:
		if not row is Array or row.size() < 4:
			return false
		var cell := Vector2i(int(row[0]), int(row[1]))
		var kind := String(row[2])
		var amount := float(row[3])
		if not registry.has(kind) or not is_finite(amount) or amount < MIN_AMOUNT or amount > MAX_AMOUNT or world.has_cell(cell) or not world.is_cell_in_bounds(cell):
			return false
		restored[cell] = {"kind": kind, "amount": amount}
	cells = restored
	_rebuild_index()
	_mark_all_visible()
	return true

func _near_active(key: Vector2i, active_keys: Dictionary) -> bool:
	for raw in active_keys.keys():
		var active: Vector2i = raw
		if absi(active.x - key.x) <= SIM_HALO_CHUNKS and absi(active.y - key.y) <= SIM_HALO_CHUNKS:
			return true
	return false

func _index_add(cell: Vector2i) -> void:
	var key: Vector2i = world.chunk_key_for(cell)
	if not chunk_cells.has(key):
		chunk_cells[key] = {}
	(chunk_cells[key] as Dictionary)[cell] = true

func _index_remove(cell: Vector2i) -> void:
	var key: Vector2i = world.chunk_key_for(cell)
	if not chunk_cells.has(key):
		return
	var indexed: Dictionary = chunk_cells[key]
	indexed.erase(cell)
	if indexed.is_empty():
		chunk_cells.erase(key)

func _rebuild_index() -> void:
	chunk_cells.clear()
	for raw in cells.keys():
		_index_add(raw)

func _mark_changed(cell: Vector2i) -> void:
	if world.has_method("mark_fluid_changed"):
		world.mark_fluid_changed(cell)

func _mark_all_visible() -> void:
	if world.has_method("mark_all_visible_fluid_changed"):
		world.mark_all_visible_fluid_changed()
