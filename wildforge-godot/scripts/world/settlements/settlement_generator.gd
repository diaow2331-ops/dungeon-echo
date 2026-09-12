class_name SliceSettlementGenerator
extends RefCounted

const SETTLEMENT_ID := "verdant_mossbridge"
const FACTION_ID := "verdant"
const DISPLAY_NAME := "Mossbridge"
const SEARCH_MIN_X := -72
const SEARCH_MAX_X := -48
const HALF_WIDTH := 15

func generate(world) -> Dictionary:
	var anchor_x := _find_anchor(world)
	var ground_y: int = int(world.surface_y_at(anchor_x))
	var settlement_stone := int(world.SETTLEMENT_STONE)
	var timber := int(world.SETTLEMENT_TIMBER)
	_flatten_foundation(world, anchor_x, ground_y, settlement_stone)

	var structures: Array = []
	structures.append(_warehouse(world, anchor_x, ground_y, timber, settlement_stone))
	structures.append(_market(world, anchor_x, ground_y, timber, settlement_stone))
	structures.append(_west_gate(world, anchor_x, ground_y, timber, settlement_stone))
	structures.append(_east_gate(world, anchor_x, ground_y, timber, settlement_stone))
	for row in structures:
		world.baseline_structures.append(row)

	return {
		"id": SETTLEMENT_ID,
		"name": DISPLAY_NAME,
		"founding_faction": FACTION_ID,
		"anchor_cell": [anchor_x, ground_y - 1],
		"market_cell": [anchor_x + 5, ground_y - 1],
		"territory": [anchor_x - HALF_WIDTH - 1, ground_y - 9, HALF_WIDTH * 2 + 3, 18],
		"structures": structures.map(func(s): return String((s as Dictionary)["id"])),
		"initial_inventory": {"raw_meat": 2},
		"targets": {"raw_meat": 12},
		"base_prices": {"raw_meat": 4},
		"initial_treasury": 120,
	}

func _find_anchor(world) -> int:
	var best_x := SEARCH_MIN_X
	var best_score := INF
	for x in range(SEARCH_MIN_X, SEARCH_MAX_X + 1):
		var center: int = int(world.surface_y_at(x))
		var roughness := 0.0
		for dx in range(-HALF_WIDTH, HALF_WIDTH + 1):
			roughness += absf(float(world.surface_y_at(x + dx) - center))
		var distance_bias := absf(float(x + 60)) * 0.08
		var score := roughness + distance_bias
		if score < best_score:
			best_score = score
			best_x = x
	return best_x

func _flatten_foundation(world, anchor_x: int, ground_y: int, tile: int) -> void:
	for x in range(anchor_x - HALF_WIDTH, anchor_x + HALF_WIDTH + 1):
		for y in range(ground_y - 8, ground_y):
			world.baseline_erase_cell(Vector2i(x, y))
		var natural_surface: int = int(world.surface_y_at(x))
		if natural_surface < ground_y:
			for y in range(natural_surface, ground_y):
				world.baseline_erase_cell(Vector2i(x, y))
		elif natural_surface > ground_y:
			for y in range(ground_y + 1, natural_surface + 1):
				world.baseline_set_cell(Vector2i(x, y), tile)
		world.baseline_set_cell(Vector2i(x, ground_y), tile)

func _warehouse(world, anchor_x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	var rows: Array = []
	var left := anchor_x - 11
	var right := anchor_x - 4
	var roof_y := ground_y - 5
	for x in range(left, right + 1):
		_place(world, rows, Vector2i(x, roof_y), timber)
		_place(world, rows, Vector2i(x, ground_y), stone)
	for y in range(roof_y + 1, ground_y):
		_place(world, rows, Vector2i(left, y), timber)
		_place(world, rows, Vector2i(right, y), timber)
	return {"id": SETTLEMENT_ID + ":warehouse", "kind": "warehouse", "blueprint": rows}

func _market(world, anchor_x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	var rows: Array = []
	var left := anchor_x + 2
	var right := anchor_x + 8
	var roof_y := ground_y - 4
	for x in range(left, right + 1):
		_place(world, rows, Vector2i(x, roof_y), timber)
		_place(world, rows, Vector2i(x, ground_y), stone)
	for y in range(roof_y + 1, ground_y):
		_place(world, rows, Vector2i(left, y), timber)
		_place(world, rows, Vector2i(right, y), timber)
	_place(world, rows, Vector2i(anchor_x + 4, ground_y - 1), timber)
	_place(world, rows, Vector2i(anchor_x + 5, ground_y - 1), timber)
	_place(world, rows, Vector2i(anchor_x + 6, ground_y - 1), timber)
	return {"id": SETTLEMENT_ID + ":market", "kind": "market", "blueprint": rows}

func _west_gate(world, anchor_x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	return _gate(world, SETTLEMENT_ID + ":west_gate", anchor_x - HALF_WIDTH, ground_y, timber, stone)

func _east_gate(world, anchor_x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	return _gate(world, SETTLEMENT_ID + ":east_gate", anchor_x + HALF_WIDTH, ground_y, timber, stone)

func _gate(world, id: String, x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	var rows: Array = []
	for y in range(ground_y - 4, ground_y):
		_place(world, rows, Vector2i(x, y), timber)
	_place(world, rows, Vector2i(x, ground_y), stone)
	return {"id": id, "kind": "gate", "blueprint": rows}

func _place(world, rows: Array, cell: Vector2i, tile: int) -> void:
	world.baseline_set_cell(cell, tile)
	rows.append([cell.x, cell.y, tile])
