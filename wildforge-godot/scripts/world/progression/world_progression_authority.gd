extends RefCounted
class_name SliceWorldProgressionAuthority

const ERA_WANDERER := 0
const ERA_FOOTHOLD := 1
const ERA_OPEN_ROADS := 2
const ERA_FRACTURE := 3
const ERA_WARFRONT := 4
const ERA_REFORGING := 5
const MAX_ERA := ERA_REFORGING

const MILESTONE_ALLOWLIST := [
	"survival_ready",
	"settlement:verdant_mossbridge",
	"settlement:frost_frostmirror",
	"settlement:ember_cinder_ridge",
	"cross_region_delivery",
	"pack_beast_acquired",
	"cross_faction_exchange",
	"tension_catalyst",
	"tension_seen",
	"war_ready_pressure",
	"war_resolved",
	"regional_balance",
]

var world
var era := ERA_WANDERER
var era_entered_hour := 0
var milestones: Dictionary = {}
var last_transition: Dictionary = {}
func _init(owner_world) -> void:
	world = owner_world
	reset_new_world()

func reset_new_world() -> void:
	era = ERA_WANDERER
	era_entered_hour = 0
	milestones.clear()
	last_transition.clear()

func era_name(value := -1) -> String:
	var current := era if value < 0 else value
	return {
		ERA_WANDERER: "漂泊",
		ERA_FOOTHOLD: "立足",
		ERA_OPEN_ROADS: "商路开启",
		ERA_FRACTURE: "边境生变",
		ERA_WARFRONT: "战火蔓延",
		ERA_REFORGING: "格局重构",
	}.get(current, "未知")

func allows_local_market() -> bool:
	return era >= ERA_FOOTHOLD

func allows_autonomous_caravans() -> bool:
	return era >= ERA_OPEN_ROADS

func allows_tension() -> bool:
	return era >= ERA_FRACTURE

func allows_route_incidents() -> bool:
	return era >= ERA_FRACTURE
func allows_war() -> bool:
	return era >= ERA_WARFRONT

func allows_raids() -> bool:
	return era >= ERA_WARFRONT

func allows_displacement() -> bool:
	return era >= ERA_WARFRONT

func allows_annexation() -> bool:
	return era >= ERA_REFORGING

func record_milestone(id: String) -> bool:
	if id not in MILESTONE_ALLOWLIST or milestones.has(id):
		return false
	milestones[id] = true
	return true

func has_milestone(id: String) -> bool:
	return bool(milestones.get(id, false))

func record_settlement_contact(settlement_id: String) -> bool:
	return record_milestone("settlement:" + settlement_id)

func settlement_contact_count() -> int:
	var count := 0
	for id in ["verdant_mossbridge", "frost_frostmirror", "ember_cinder_ridge"]:
		if has_milestone("settlement:" + id):
			count += 1
	return count

func observe_settlement_tension(settlement_id: String) -> bool:
	# Observation is a player-facing fact, not a synonym for background political pressure.
	if era < ERA_FRACTURE or world == null or world.faction_authority == null or settlement_id.is_empty():
		return false
	var status := String(world.faction_authority.conflict_status(settlement_id))
	if status not in ["tense", "war", "raid", "occupied"]:
		return false
	return record_milestone("tension_seen")

func observe_route_hazard(pair_key: String) -> bool:
	if era < ERA_FRACTURE or world == null or world.settlement_authority == null or pair_key.is_empty():
		return false
	for raw_hazard in world.settlement_authority.active_route_hazards():
		if raw_hazard is Dictionary and String((raw_hazard as Dictionary).get("pair_key", "")) == pair_key:
			return record_milestone("tension_seen")
	return false

func export_state() -> Dictionary:
	var ids := milestones.keys()
	ids.sort()
	return {"era": era, "era_entered_hour": era_entered_hour, "milestones": ids, "last_transition": last_transition.duplicate(true)}
func restore_state(raw) -> bool:
	if not raw is Dictionary:
		return false
	var restored_era := int(raw.get("era", -1))
	var restored_hour := int(raw.get("era_entered_hour", -1))
	var restored_milestones = raw.get("milestones", null)
	var transition = raw.get("last_transition", {})
	if restored_era < ERA_WANDERER or restored_era > MAX_ERA or restored_hour < 0 or not restored_milestones is Array or not transition is Dictionary:
		return false
	var staged: Dictionary = {}
	for raw_id in restored_milestones:
		var id := String(raw_id)
		if id not in MILESTONE_ALLOWLIST or staged.has(id):
			return false
		staged[id] = true
	if not _valid_transition(transition, restored_era):
		return false
	era = restored_era
	era_entered_hour = restored_hour
	milestones = staged
	last_transition = (transition as Dictionary).duplicate(true)
	return true

func restore_legacy_unlocked(absolute_hour: int) -> void:
	era = ERA_REFORGING
	era_entered_hour = maxi(0, absolute_hour)
	milestones.clear()
	last_transition = {"from": ERA_REFORGING, "to": ERA_REFORGING, "cause": "legacy_world", "hour": era_entered_hour}

func _valid_transition(raw: Dictionary, restored_era: int) -> bool:
	if raw.is_empty():
		return restored_era == ERA_WANDERER
	var from_era := int(raw.get("from", -1))
	var to_era := int(raw.get("to", -1))
	var hour := int(raw.get("hour", -1))
	var cause := String(raw.get("cause", ""))
	return from_era >= ERA_WANDERER and from_era <= MAX_ERA and to_era >= from_era and to_era == restored_era and hour >= 0 and not cause.is_empty()
func simulate_hour_end(absolute_hour: int, events: Array) -> Dictionary:
	for raw_event in events:
		if raw_event is Dictionary:
			_observe_event(raw_event as Dictionary)
	_observe_world_facts()
	var next := _next_transition(absolute_hour)
	if next.is_empty():
		return {}
	var from_era := era
	era = int(next["to"])
	era_entered_hour = absolute_hour
	last_transition = {"from": from_era, "to": era, "cause": String(next["cause"]), "hour": absolute_hour}
	return {"kind": "world_era_changed", "from": from_era, "to": era, "name": era_name(), "cause": String(next["cause"]), "hour": absolute_hour}

func _observe_event(event: Dictionary) -> void:
	var kind := String(event.get("kind", ""))
	if kind == "caravan_arrived":
		var origin := String(event.get("origin", ""))
		var destination := String(event.get("destination", ""))
		if world != null and world.faction_authority != null:
			var a: String = world.faction_authority.controller_for_settlement(origin)
			var b: String = world.faction_authority.controller_for_settlement(destination)
			if not a.is_empty() and not b.is_empty() and a != b:
				record_milestone("cross_faction_exchange")
	elif kind in ["caravan_attacked", "route_repair"]:
		record_milestone("tension_catalyst")

func _observe_world_facts() -> void:
	if world == null or world.settlement_authority == null or world.faction_authority == null:
		return
	if era >= ERA_OPEN_ROADS and not world.settlement_authority.urgent_shortages().is_empty():
		record_milestone("tension_catalyst")
	if era >= ERA_FRACTURE:
		for a in world.faction_authority.ids():
			for b in world.faction_authority.ids():
				if a >= b:
					continue
				var score := int(world.faction_authority.relation(a, b).get("score", 0))
				if score <= SliceFactionAuthority.RELATION_WAR_ENTER + 1:
					record_milestone("war_ready_pressure")

func _next_transition(absolute_hour: int) -> Dictionary:
	var age := maxi(0, absolute_hour - era_entered_hour)
	match era:
		ERA_WANDERER:
			if has_milestone("survival_ready") and settlement_contact_count() >= 1:
				return {"to": ERA_FOOTHOLD, "cause": "first_foothold"}
		ERA_FOOTHOLD:
			if age >= 4 and settlement_contact_count() >= 2 and (has_milestone("cross_region_delivery") or has_milestone("pack_beast_acquired")):
				return {"to": ERA_OPEN_ROADS, "cause": "open_roads"}
		ERA_OPEN_ROADS:
			if age >= 24 and has_milestone("cross_faction_exchange") and has_milestone("tension_catalyst"):
				return {"to": ERA_FRACTURE, "cause": "first_fracture"}
		ERA_FRACTURE:
			if age >= 24 and has_milestone("tension_seen") and has_milestone("war_ready_pressure"):
				return {"to": ERA_WARFRONT, "cause": "war_ready"}
			if age >= 24 and _is_regional_balance():
				return {"to": ERA_WARFRONT, "cause": "peaceful_maturity"}
		ERA_WARFRONT:
			if age >= 24 and has_milestone("war_resolved"):
				return {"to": ERA_REFORGING, "cause": "war_resolved"}
			if age >= 48 and _is_regional_balance():
				return {"to": ERA_REFORGING, "cause": "regional_balance"}
	return {}

func _is_regional_balance() -> bool:
	if settlement_contact_count() < 3 or world == null or world.faction_authority == null:
		return false
	var trade_pairs := 0
	var ids: Array[String] = world.faction_authority.ids()
	for i in range(ids.size()):
		for j in range(i + 1, ids.size()):
			var rel: Dictionary = world.faction_authority.relation(ids[i], ids[j])
			if String(rel.get("stance", "neutral")) == "war":
				return false
			if String(rel.get("stance", "neutral")) == "trade":
				trade_pairs += 1
	return trade_pairs >= 2
