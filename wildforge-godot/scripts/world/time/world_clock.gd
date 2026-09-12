class_name SliceWorldClock
extends RefCounted

const DAY_SECONDS := 720.0
const DEFAULT_TIME_OF_DAY := 0.18

var day_index := 0
var time_of_day := DEFAULT_TIME_OF_DAY

func advance(delta_seconds: float) -> void:
	if delta_seconds <= 0.0:
		return
	var total := time_of_day + delta_seconds / DAY_SECONDS
	if total >= 1.0:
		var days := floori(total)
		day_index += days
		total -= float(days)
	time_of_day = clampf(total, 0.0, 0.999999)

func reset() -> void:
	day_index = 0
	time_of_day = DEFAULT_TIME_OF_DAY

func snapshot() -> Dictionary:
	return {"day": day_index, "time": time_of_day}

func restore(raw) -> bool:
	if not raw is Dictionary:
		return false
	var day := int(raw.get("day", -1))
	var tod := float(raw.get("time", -1.0))
	if day < 0 or not is_finite(tod) or tod < 0.0 or tod >= 1.0:
		return false
	day_index = day
	time_of_day = tod
	return true

func hour_24() -> float:
	return time_of_day * 24.0
