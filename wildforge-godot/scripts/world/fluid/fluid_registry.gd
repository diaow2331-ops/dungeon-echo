class_name SliceFluidRegistry
extends RefCounted

const DATA_PATH := "res://data/fluids.json"
var schema_version := 0
var fluids: Dictionary = {}

func _init() -> void:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("Missing fluid registry: " + DATA_PATH)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Invalid fluid registry JSON")
		return
	schema_version = int(parsed.get("schema_version", 0))
	var raw = parsed.get("fluids", {})
	if raw is Dictionary:
		for key in raw.keys():
			fluids[String(key)] = (raw[key] as Dictionary).duplicate(true)

func has(kind: String) -> bool:
	return fluids.has(kind)

func color(kind: String) -> Color:
	return Color(String((fluids.get(kind, {}) as Dictionary).get("color", "ffffff")))

func light_absorption(kind: String) -> float:
	return clampf(float((fluids.get(kind, {}) as Dictionary).get("light_absorption", 0.0)), 0.0, 1.0)

func light_emission(kind: String) -> float:
	return clampf(float((fluids.get(kind, {}) as Dictionary).get("light_emission", 0.0)), 0.0, 1.0)
