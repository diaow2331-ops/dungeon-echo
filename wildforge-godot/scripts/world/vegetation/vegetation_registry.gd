class_name SliceVegetationRegistry
extends RefCounted

const DATA_PATH := "res://data/vegetation.json"
var schema_version := 0
var species: Dictionary = {}

func _init() -> void:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("Missing vegetation registry: " + DATA_PATH)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Invalid vegetation registry JSON")
		return
	schema_version = int(parsed.get("schema_version", 0))
	var raw = parsed.get("species", {})
	if raw is Dictionary:
		for key in raw.keys():
			if raw[key] is Dictionary:
				species[String(key)] = (raw[key] as Dictionary).duplicate(true)

func has(species_id: String) -> bool:
	return species.has(species_id)

func harvest_hits(species_id: String) -> int:
	return maxi(1, int((species.get(species_id, {}) as Dictionary).get("harvest_hits", 3)))

func drop_item(species_id: String) -> String:
	return String((species.get(species_id, {}) as Dictionary).get("drop_item", "wood"))

func drop_count(species_id: String) -> int:
	return maxi(0, int((species.get(species_id, {}) as Dictionary).get("drop_count", 0)))
