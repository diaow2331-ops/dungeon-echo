class_name SliceWorldGenerator
extends RefCounted

const DEFAULT_SEED := 730241
const SURFACE_BASE := 17
const SURFACE_AMPLITUDE := 5
const CAVE_MIN_DEPTH := 11

var seed: int
var surface_noise := FastNoiseLite.new()
var ridge_noise := FastNoiseLite.new()
var biome_noise := FastNoiseLite.new()
var cave_noise := FastNoiseLite.new()
var coal_noise := FastNoiseLite.new()
var copper_noise := FastNoiseLite.new()
var vegetation_noise := FastNoiseLite.new()
var vegetation_detail := FastNoiseLite.new()

func _init(world_seed := DEFAULT_SEED) -> void:
	seed = int(world_seed)
	_configure(surface_noise, seed + 11, 0.010, 4, 2.0, 0.52)
	_configure(ridge_noise, seed + 23, 0.028, 3, 2.1, 0.48)
	_configure(biome_noise, seed + 37, 0.0045, 3, 2.0, 0.50)
	_configure(cave_noise, seed + 53, 0.052, 3, 2.0, 0.53)
	_configure(coal_noise, seed + 71, 0.075, 2, 2.0, 0.50)
	_configure(copper_noise, seed + 89, 0.064, 2, 2.0, 0.50)
	_configure(vegetation_noise, seed + 107, 0.012, 3, 2.0, 0.52)
	_configure(vegetation_detail, seed + 131, 0.19, 1, 2.0, 0.50)

func surface_y_at(x: int) -> int:
	var broad := surface_noise.get_noise_1d(float(x))
	var ridge := ridge_noise.get_noise_1d(float(x))
	return SURFACE_BASE + roundi(broad * float(SURFACE_AMPLITUDE) + ridge * 1.6)

func biome_at(x: int) -> String:
	var value := biome_noise.get_noise_1d(float(x))
	if value < -0.24:
		return "frostglass"
	if value > 0.28:
		return "ember_wastes"
	return "verdant_reach"

func base_tile_at(cell: Vector2i) -> int:
	var surface := surface_y_at(cell.x)
	if cell.y < surface:
		return SliceWorld.AIR
	var depth := cell.y - surface
	if depth == 0:
		return SliceWorld.GRASS
	if depth < 4:
		return SliceWorld.DIRT
	if depth >= CAVE_MIN_DEPTH and _is_cave(cell, depth):
		return SliceWorld.AIR
	if depth >= 8 and copper_noise.get_noise_2d(float(cell.x), float(cell.y)) > 0.56:
		return SliceWorld.COPPER
	if depth >= 5 and coal_noise.get_noise_2d(float(cell.x), float(cell.y)) > 0.50:
		return SliceWorld.COAL
	return SliceWorld.STONE

func should_spawn_tree(x: int) -> bool:
	var biome := biome_at(x)
	var moisture := vegetation_noise.get_noise_1d(float(x))
	var detail := vegetation_detail.get_noise_1d(float(x))
	var threshold := 0.06 if biome == "verdant_reach" else (0.28 if biome == "frostglass" else 0.38)
	return moisture > threshold and detail > 0.34

func _is_cave(cell: Vector2i, depth: int) -> bool:
	var value := cave_noise.get_noise_2d(float(cell.x), float(cell.y))
	var threshold := 0.62 - minf(0.10, float(depth - CAVE_MIN_DEPTH) * 0.003)
	return value > threshold

func _configure(noise: FastNoiseLite, noise_seed: int, frequency: float, octaves: int, lacunarity: float, gain: float) -> void:
	noise.seed = noise_seed
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.frequency = frequency
	noise.fractal_type = FastNoiseLite.FRACTAL_FBM
	noise.fractal_octaves = octaves
	noise.fractal_lacunarity = lacunarity
	noise.fractal_gain = gain
