class_name SliceBlockRegistry
extends RefCounted

const DATA_PATH := "res://data/blocks.json"

var blocks: Dictionary = {}
var schema_version := 0

func _init() -> void:
	_load()

func _load() -> void:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("SliceBlockRegistry: missing %s" % DATA_PATH)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("SliceBlockRegistry: invalid JSON")
		return
	schema_version = int(parsed.get("schema_version", 0))
	var raw_blocks = parsed.get("blocks", {})
	if not raw_blocks is Dictionary:
		push_error("SliceBlockRegistry: blocks must be a dictionary")
		return
	for raw_id in raw_blocks.keys():
		blocks[int(raw_id)] = (raw_blocks[raw_id] as Dictionary).duplicate(true)
func has(tile: int) -> bool:
	return blocks.has(tile)

func definition(tile: int) -> Dictionary:
	return (blocks.get(tile, {}) as Dictionary).duplicate(true)

func hardness(tile: int) -> float:
	return float((blocks.get(tile, {}) as Dictionary).get("hardness", 0.0))

func required_pick_power(tile: int) -> float:
	return float((blocks.get(tile, {}) as Dictionary).get("required_pick_power", 9999.0))

func drop_item(tile: int) -> String:
	return String((blocks.get(tile, {}) as Dictionary).get("drop_item", ""))

func is_placeable(tile: int) -> bool:
	return bool((blocks.get(tile, {}) as Dictionary).get("placeable", false))

func is_solid(tile: int) -> bool:
	return bool((blocks.get(tile, {}) as Dictionary).get("solid", false))

func resource_class(tile: int) -> String:
	return String((blocks.get(tile, {}) as Dictionary).get("resource_class", "unknown"))

func light_absorption(tile: int) -> float:
	return clampf(float((blocks.get(tile, {}) as Dictionary).get("light_absorption", 1.0)), 0.0, 1.0)

func light_emission(tile: int) -> float:
	return clampf(float((blocks.get(tile, {}) as Dictionary).get("light_emission", 0.0)), 0.0, 1.0)
