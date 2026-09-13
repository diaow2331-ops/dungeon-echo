class_name SliceSettlementGenerator
extends RefCounted

const HALF_WIDTH := 15
const GEOGRAPHY_SUPPLY := {
	"verdant_reach": {
		"initial_supply": {"wood": 2},
		"local_production": {"wood": 1},
	},
	"frostglass": {
		"initial_supply": {"snow": 4, "ice": 3},
		"local_production": {"snow": 2, "ice": 1},
	},
	"ember_wastes": {
		"initial_supply": {"ash": 4, "sandstone": 3, "basalt": 2},
		"local_production": {"ash": 2, "sandstone": 1, "basalt": 1},
	},
}

const SETTLEMENT_DEMAND := {
	"verdant_mossbridge": {
		"initial_inventory": {"raw_meat": 2},
		"targets": {"raw_meat": 10, "wood": 6, "ice": 3, "basalt": 4},
		"base_prices": {"raw_meat": 4, "wood": 2, "ice": 6, "basalt": 5},
		"local_consumption": {"raw_meat": 1},
	},
	"frost_frostmirror": {
		"initial_inventory": {"raw_meat": 1},
		"targets": {"raw_meat": 14, "wood": 8, "basalt": 4, "snow": 8, "ice": 8},
		"base_prices": {"raw_meat": 6, "wood": 5, "basalt": 5, "snow": 1, "ice": 2},
		"local_consumption": {"raw_meat": 1},
	},
	"ember_cinder_ridge": {
		"initial_inventory": {"raw_meat": 1},
		"targets": {"raw_meat": 14, "wood": 10, "ice": 6, "ash": 8, "sandstone": 6, "basalt": 6},
		"base_prices": {"raw_meat": 6, "wood": 5, "ice": 7, "ash": 1, "sandstone": 2, "basalt": 3},
		"local_consumption": {"raw_meat": 1},
	},
}

const SPECS := [
	{"id":"verdant_mossbridge","faction":"verdant","name":"Mossbridge","biome":"verdant_reach","search_min":-72,"search_max":-48,"target_x":-60,"distance_weight":0.08,"merchant":"米菈","merchant_role":"苔桥集市商人","guard":"洛恩","guard_role":"苔桥守卫"},
	{"id":"frost_frostmirror","faction":"frost","name":"Frostmirror","biome":"frostglass","search_min":-350,"search_max":-290,"target_x":-320,"distance_weight":0.35,"merchant":"伊芙","merchant_role":"霜镜站商人","guard":"哈尔","guard_role":"霜镜站守卫"},
	{"id":"ember_cinder_ridge","faction":"ember","name":"Cinder Ridge","biome":"ember_wastes","search_min":270,"search_max":330,"target_x":300,"distance_weight":0.35,"merchant":"萨恩","merchant_role":"烬脊营商人","guard":"凯娅","guard_role":"烬脊营守卫"},
]

func generate_all(world) -> Array:
	var settlements: Array = []
	for raw in SPECS:
		settlements.append(_generate_spec(world, raw as Dictionary))
	return settlements

func generate(world) -> Dictionary:
	return _generate_spec(world, SPECS[0] as Dictionary)

func _generate_spec(world, spec: Dictionary) -> Dictionary:
	var settlement_id := String(spec["id"])
	var faction_id := String(spec["faction"])
	var anchor_x := _find_anchor(world, spec)
	var ground_y: int = int(world.surface_y_at(anchor_x))
	var stone := int(world.SETTLEMENT_STONE)
	var timber := int(world.SETTLEMENT_TIMBER)
	_flatten_foundation(world, anchor_x, ground_y, stone)
	var structures: Array = []
	structures.append(_warehouse(world, settlement_id, anchor_x, ground_y, timber, stone))
	structures.append(_market(world, settlement_id, anchor_x, ground_y, timber, stone))
	structures.append(_gate(world, settlement_id + ":west_gate", anchor_x - HALF_WIDTH, ground_y, timber, stone))
	structures.append(_gate(world, settlement_id + ":east_gate", anchor_x + HALF_WIDTH, ground_y, timber, stone))
	for row in structures:
		world.baseline_structures.append(row)
	var economy := _economy_for(spec)
	return {
		"id": settlement_id,
		"name": String(spec["name"]),
		"founding_faction": faction_id,
		"biome": String(spec["biome"]),
		"anchor_cell": [anchor_x, ground_y - 1],
		"market_cell": [anchor_x + 5, ground_y - 1],
		"territory": [anchor_x - HALF_WIDTH - 1, ground_y - 9, HALF_WIDTH * 2 + 3, 18],
		"structures": structures.map(func(s): return String((s as Dictionary)["id"])),
		"npcs": _npc_specs(spec, settlement_id, faction_id, anchor_x, ground_y),
		"initial_inventory": (economy.get("initial_inventory", {}) as Dictionary).duplicate(true),
		"targets": (economy.get("targets", {}) as Dictionary).duplicate(true),
		"base_prices": (economy.get("base_prices", {}) as Dictionary).duplicate(true),
		"local_production": (economy.get("local_production", {}) as Dictionary).duplicate(true),
		"local_consumption": (economy.get("local_consumption", {}) as Dictionary).duplicate(true),
		"initial_treasury": 120,
	}

func _economy_for(spec: Dictionary) -> Dictionary:
	var settlement_id := String(spec.get("id", ""))
	var biome_id := String(spec.get("biome", ""))
	var demand: Dictionary = (SETTLEMENT_DEMAND.get(settlement_id, {}) as Dictionary).duplicate(true)
	var supply: Dictionary = (GEOGRAPHY_SUPPLY.get(biome_id, {}) as Dictionary).duplicate(true)
	var inventory: Dictionary = (demand.get("initial_inventory", {}) as Dictionary).duplicate(true)
	for raw_id in (supply.get("initial_supply", {}) as Dictionary).keys():
		var item_id := String(raw_id)
		inventory[item_id] = maxi(0, int(inventory.get(item_id, 0))) + maxi(0, int((supply["initial_supply"] as Dictionary)[raw_id]))
	return {
		"initial_inventory": inventory,
		"targets": (demand.get("targets", {}) as Dictionary).duplicate(true),
		"base_prices": (demand.get("base_prices", {}) as Dictionary).duplicate(true),
		"local_production": (supply.get("local_production", {}) as Dictionary).duplicate(true),
		"local_consumption": (demand.get("local_consumption", {}) as Dictionary).duplicate(true),
	}

func _npc_specs(spec: Dictionary, settlement_id: String, faction_id: String, anchor_x: int, ground_y: int) -> Array:
	return [
		{"id":settlement_id+":merchant","kind":"merchant","cell":[anchor_x+7,ground_y-1],"display_name":String(spec["merchant"]),"role":String(spec["merchant_role"]),"dialogue":["旅人，集市只认真实库存和现货。缺货时，价钱自然会上去。","货物进仓以后就属于这座聚落的库存，不会凭空消失。"]},
		{"id":settlement_id+":guard","kind":"guard","cell":[anchor_x-HALF_WIDTH+2,ground_y-1],"display_name":String(spec["guard"]),"role":String(spec["guard_role"]),"dialogue":["这里是%s的领地。交易欢迎，破坏受保护设施会被记作违法。" % faction_id,"城外发生什么，城内的库存和财政也会继续变化。"]},
	]

func _find_anchor(world, spec: Dictionary) -> int:
	var best_x := int(spec["target_x"])
	var best_score := INF
	var found_biome := false
	for x in range(int(spec["search_min"]), int(spec["search_max"]) + 1):
		var biome_match: bool = String(world.biome_at(x)) == String(spec["biome"])
		if found_biome and not biome_match:
			continue
		var center: int = int(world.surface_y_at(x))
		var roughness := 0.0
		for dx in range(-HALF_WIDTH, HALF_WIDTH + 1):
			roughness += absf(float(world.surface_y_at(x + dx) - center))
		var score := roughness + absf(float(x - int(spec["target_x"]))) * float(spec.get("distance_weight", 0.08))
		if biome_match and not found_biome:
			found_biome = true
			best_score = INF
		if score < best_score:
			best_score = score
			best_x = x
	return best_x

func _flatten_foundation(world, anchor_x: int, ground_y: int, tile: int) -> void:
	for x in range(anchor_x - HALF_WIDTH, anchor_x + HALF_WIDTH + 1):
		for y in range(ground_y - 8, ground_y): world.baseline_erase_cell(Vector2i(x, y))
		var natural_surface: int = int(world.surface_y_at(x))
		if natural_surface < ground_y:
			for y in range(natural_surface, ground_y): world.baseline_erase_cell(Vector2i(x, y))
		elif natural_surface > ground_y:
			for y in range(ground_y + 1, natural_surface + 1): world.baseline_set_cell(Vector2i(x, y), tile)
		world.baseline_set_cell(Vector2i(x, ground_y), tile)

func _warehouse(world, settlement_id: String, anchor_x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	var rows: Array = []
	var left := anchor_x - 11; var right := anchor_x - 4; var roof_y := ground_y - 5
	for x in range(left, right + 1): _place(world, rows, Vector2i(x, roof_y), timber); _place(world, rows, Vector2i(x, ground_y), stone)
	for y in range(roof_y + 1, ground_y): _place(world, rows, Vector2i(left, y), timber); _place(world, rows, Vector2i(right, y), timber)
	return {"id":settlement_id+":warehouse","kind":"warehouse","blueprint":rows}

func _market(world, settlement_id: String, anchor_x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	var rows: Array = []
	var left := anchor_x + 2; var right := anchor_x + 8; var roof_y := ground_y - 4
	for x in range(left, right + 1): _place(world, rows, Vector2i(x, roof_y), timber); _place(world, rows, Vector2i(x, ground_y), stone)
	for y in range(roof_y + 1, ground_y): _place(world, rows, Vector2i(left, y), timber); _place(world, rows, Vector2i(right, y), timber)
	for x in range(anchor_x + 4, anchor_x + 7): _place(world, rows, Vector2i(x, ground_y - 1), timber)
	return {"id":settlement_id+":market","kind":"market","blueprint":rows}

func _gate(world, id: String, x: int, ground_y: int, timber: int, stone: int) -> Dictionary:
	var rows: Array = []
	for y in range(ground_y - 4, ground_y): _place(world, rows, Vector2i(x, y), timber)
	_place(world, rows, Vector2i(x, ground_y), stone)
	return {"id":id,"kind":"gate","blueprint":rows}

func _place(world, rows: Array, cell: Vector2i, tile: int) -> void:
	world.baseline_set_cell(cell, tile)
	rows.append([cell.x, cell.y, tile])
