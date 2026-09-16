class_name SliceFactionAuthority
extends RefCounted

const MAX_FACTIONS := 3
const VALID_STATUS := ["active", "weakened", "collapsing", "annexed"]
const VALID_STANCE := ["neutral", "trade", "war"]
const RAID_MAX_STRENGTH := 3
const RAID_STRIKE_INTERVAL_HOURS := 6
const RAID_SPAWN_INTERVAL_HOURS := 12
const RAID_DECISIVE_POWER_GAP := 24
const RAID_CONTESTED_POWER_GAP := 12
const RAID_STALEMATE_STRIKES := 2
const DIPLOMACY_INTERVAL_HOURS := 48
const RELATION_TRADE_ENTER := 30
const RELATION_TRADE_EXIT := 10
const RELATION_WAR_ENTER := -60
const RELATION_WAR_EXIT := -20
const STALEMATE_RELIEF := 6
const PLAYER_CRIME_CATALYST_BOUNTY := 500
const NPC_BOUNTY_GUARD_REWARD := 72
const NPC_BOUNTY_MERCHANT_REWARD := 48
const NPC_BOUNTY_TREASURY_RESERVE := 24
const VALID_BOUNTY_STATUS := ["posted", "accepted", "fulfilled", "claimed", "cancelled"]
const BASELINE := [
	{"id": "verdant", "biome": "verdant"},
	{"id": "ember", "biome": "ember"},
	{"id": "frost", "biome": "frost"},
]

var world
var factions: Dictionary = {}
var relations: Dictionary = {}
var raids: Dictionary = {}
var npc_bounties: Dictionary = {}
var bounty_serial := 0

func _init(owner_world) -> void:
	world = owner_world
	reset_baseline()

func reset_baseline() -> void:
	factions.clear()
	relations.clear()
	raids.clear()
	npc_bounties.clear()
	bounty_serial = 0
	for raw in BASELINE:
		var id := String(raw["id"])
		factions[id] = {
			"id": id,
			"biome": String(raw["biome"]),
			"status": "active",
			"owner_faction_id": "",
			"player_bounty": 0,
			"pursuit_due_hour": 0,
		}
	for i in range(BASELINE.size()):
		for j in range(i + 1, BASELINE.size()):
			var a := String(BASELINE[i]["id"])
			var b := String(BASELINE[j]["id"])
			relations[_relation_key(a, b)] = {"score": 0, "stance": "neutral"}

func ids() -> Array[String]:
	var result: Array[String] = []
	for raw_id in factions.keys():
		result.append(String(raw_id))
	result.sort()
	return result

func has(faction_id: String) -> bool:
	return factions.has(faction_id)

func state(faction_id: String) -> Dictionary:
	return (factions.get(faction_id, {}) as Dictionary).duplicate(true)

func controller_id(faction_id: String) -> String:
	if not factions.has(faction_id):
		return faction_id
	var current := faction_id
	var seen: Dictionary = {}
	for _step in range(MAX_FACTIONS):
		if seen.has(current) or not factions.has(current):
			break
		seen[current] = true
		var row: Dictionary = factions[current]
		if String(row.get("status", "active")) != "annexed":
			break
		var owner := String(row.get("owner_faction_id", ""))
		if owner.is_empty() or owner == current:
			break
		current = owner
	return current

func relation(a: String, b: String) -> Dictionary:
	var ca := controller_id(a)
	var cb := controller_id(b)
	if ca == cb:
		return {"score": 100, "stance": "self"}
	if not factions.has(ca) or not factions.has(cb):
		return {"score": 0, "stance": "neutral"}
	return (relations.get(_relation_key(ca, cb), {"score": 0, "stance": "neutral"}) as Dictionary).duplicate(true)

func set_relation(a: String, b: String, score: int, stance: String) -> bool:
	if not factions.has(a) or not factions.has(b) or stance not in VALID_STANCE:
		return false
	if world != null and world.progression_authority != null:
		if stance == "war" and not world.progression_authority.allows_war():
			return false
		if stance == "trade" and not world.progression_authority.allows_autonomous_caravans():
			stance = "neutral"
		if not world.progression_authority.allows_tension():
			score = maxi(score, -34)
		elif not world.progression_authority.allows_war():
			score = maxi(score, RELATION_WAR_ENTER + 1)
	var ca := controller_id(a)
	var cb := controller_id(b)
	if ca == cb:
		return false
	var key := _relation_key(ca, cb)
	if not relations.has(key):
		return false
	relations[key] = {"score": clampi(score, -100, 100), "stance": stance}
	if stance != "war":
		_remove_raids_for_pair(ca, cb)
	return true

func set_status(faction_id: String, status: String, owner_faction_id := "") -> bool:
	if not factions.has(faction_id) or status not in VALID_STATUS:
		return false
	if status == "annexed" and world != null and world.progression_authority != null and not world.progression_authority.allows_annexation():
		return false
	if status == "annexed":
		if owner_faction_id == faction_id or not factions.has(owner_faction_id):
			return false
		if controller_id(owner_faction_id) == faction_id:
			return false
	else:
		owner_faction_id = ""
	var row: Dictionary = factions[faction_id]
	row["status"] = status
	row["owner_faction_id"] = owner_faction_id
	factions[faction_id] = row
	return true

func founding_faction_for_settlement(settlement_id: String) -> String:
	if world == null or world.settlement_authority == null:
		return ""
	var row: Dictionary = world.settlement_authority.state(settlement_id)
	var faction_id := String(row.get("founding_faction", ""))
	return faction_id if factions.has(faction_id) else ""

func controller_for_settlement(settlement_id: String) -> String:
	if world == null or world.settlement_authority == null:
		return ""
	var physical_owner: String = world.settlement_authority.owner_id(settlement_id)
	return controller_id(physical_owner) if factions.has(physical_owner) else physical_owner

func export_state() -> Dictionary:
	var faction_rows: Array = []
	for faction_id in ids():
		var row: Dictionary = factions[faction_id]
		faction_rows.append({
			"id": faction_id,
			"status": String(row.get("status", "active")),
			"owner_faction_id": String(row.get("owner_faction_id", "")),
			"player_bounty": int(row.get("player_bounty", 0)),
			"pursuit_due_hour": int(row.get("pursuit_due_hour", 0)),
		})
	var relation_rows: Array = []
	var keys := relations.keys()
	keys.sort()
	for raw_key in keys:
		var key := String(raw_key)
		var row: Dictionary = relations[key]
		relation_rows.append([key, int(row.get("score", 0)), String(row.get("stance", "neutral"))])
	var raid_rows: Array = []
	var raid_ids := raids.keys()
	raid_ids.sort()
	for raw_id in raid_ids:
		var raid: Dictionary = raids[raw_id]
		raid_rows.append({
			"id": String(raid.get("id", "")),
			"attacker": String(raid.get("attacker", "")),
			"defender": String(raid.get("defender", "")),
			"target_settlement": String(raid.get("target_settlement", "")),
			"strength": int(raid.get("strength", 0)),
			"max_strength": int(raid.get("max_strength", RAID_MAX_STRENGTH)),
			"strikes": int(raid.get("strikes", 0)),
			"next_strike_hour": int(raid.get("next_strike_hour", 0)),
			"started_hour": int(raid.get("started_hour", 0)),
			"power_gap": int(raid.get("power_gap", 0)),
			"decisive": bool(raid.get("decisive", false)),
			"defeated_slots": (raid.get("defeated_slots", []) as Array).duplicate(),
		})
	var bounty_rows: Array = []
	var bounty_ids := npc_bounties.keys()
	bounty_ids.sort()
	for raw_id in bounty_ids:
		bounty_rows.append((npc_bounties[raw_id] as Dictionary).duplicate(true))
	return {"factions": faction_rows, "relations": relation_rows, "raids": raid_rows, "npc_bounties": bounty_rows, "bounty_serial": bounty_serial}

func restore_state(raw) -> bool:
	if not raw is Dictionary:
		return false
	var faction_rows = raw.get("factions", [])
	var relation_rows = raw.get("relations", [])
	if not faction_rows is Array or not relation_rows is Array:
		return false
	if faction_rows.size() != MAX_FACTIONS or relation_rows.size() != 3:
		return false
	var staged_factions := factions.duplicate(true)
	var seen_factions: Dictionary = {}
	for entry in faction_rows:
		if not entry is Dictionary:
			return false
		var id := String(entry.get("id", ""))
		var status := String(entry.get("status", ""))
		var owner := String(entry.get("owner_faction_id", ""))
		if not factions.has(id) or seen_factions.has(id) or status not in VALID_STATUS:
			return false
		if status == "annexed":
			if owner == id or not factions.has(owner):
				return false
		elif not owner.is_empty():
			return false
		var row: Dictionary = staged_factions[id]
		row["status"] = status
		row["owner_faction_id"] = owner
		if int(entry.get("player_bounty", 0)) < 0:
			return false
		row["player_bounty"] = int(entry.get("player_bounty", 0))
		row["pursuit_due_hour"] = maxi(0, int(entry.get("pursuit_due_hour", 0)))
		staged_factions[id] = row
		seen_factions[id] = true
	for faction_id in seen_factions.keys():
		var current := String(faction_id)
		var chain_seen: Dictionary = {}
		for _step in range(MAX_FACTIONS + 1):
			if chain_seen.has(current):
				return false
			chain_seen[current] = true
			var row: Dictionary = staged_factions[current]
			if String(row.get("status", "active")) != "annexed":
				break
			current = String(row.get("owner_faction_id", ""))
			if not staged_factions.has(current):
				return false

	var staged_relations: Dictionary = {}
	for entry in relation_rows:
		if not entry is Array or entry.size() < 3:
			return false
		var key := String(entry[0])
		var score := int(entry[1])
		var stance := String(entry[2])
		if not relations.has(key) or staged_relations.has(key) or score < -100 or score > 100 or stance not in VALID_STANCE:
			return false
		staged_relations[key] = {"score": score, "stance": stance}
	if staged_relations.size() != relations.size():
		return false
	var staged_raids: Dictionary = {}
	var raid_rows = raw.get("raids", [])
	if not raid_rows is Array or raid_rows.size() > 3:
		return false
	for entry in raid_rows:
		if not entry is Dictionary:
			return false
		var raid := (entry as Dictionary).duplicate(true)
		var raid_id := String(raid.get("id", ""))
		var attacker := String(raid.get("attacker", ""))
		var defender := String(raid.get("defender", ""))
		var target := String(raid.get("target_settlement", ""))
		var strength := int(raid.get("strength", 0))
		var max_strength := int(raid.get("max_strength", RAID_MAX_STRENGTH))
		var defeated = raid.get("defeated_slots", [])
		if raid_id.is_empty() or staged_raids.has(raid_id) or not staged_factions.has(attacker) or not staged_factions.has(defender) or attacker == defender:
			return false
		var power_gap := int(raid.get("power_gap", 0))
		if target.is_empty() or strength <= 0 or max_strength < strength or max_strength > RAID_MAX_STRENGTH or int(raid.get("strikes", -1)) < 0 or int(raid.get("next_strike_hour", -1)) < 0 or int(raid.get("started_hour", -1)) < 0:
			return false
		if power_gap < 0 or power_gap > 1000 or bool(raid.get("decisive", false)) != (power_gap >= RAID_DECISIVE_POWER_GAP):
			return false
		if not defeated is Array or defeated.size() != max_strength - strength:
			return false
		var slot_seen: Dictionary = {}
		for slot_raw in defeated:
			var slot := int(slot_raw)
			if slot < 0 or slot >= max_strength or slot_seen.has(slot):
				return false
			slot_seen[slot] = true
		raid["strength"] = strength
		raid["max_strength"] = max_strength
		raid["defeated_slots"] = defeated.duplicate()
		staged_raids[raid_id] = raid
	var staged_bounties: Dictionary = {}
	var raw_bounties = raw.get("npc_bounties", [])
	if not raw_bounties is Array or raw_bounties.size() > 12:
		return false
	var max_serial := -1
	for entry in raw_bounties:
		if not entry is Dictionary:
			return false
		var bounty: Dictionary = (entry as Dictionary).duplicate(true)
		var bounty_id := String(bounty.get("id", ""))
		var issuer := String(bounty.get("issuer_faction", ""))
		var target_faction := String(bounty.get("target_faction", ""))
		var target_person := String(bounty.get("target_person_id", ""))
		var target_slot := String(bounty.get("target_slot_id", ""))
		var status := String(bounty.get("status", ""))
		var reward := int(bounty.get("reward", 0))
		if not bounty_id.begins_with("npc_bounty:") or staged_bounties.has(bounty_id) or not staged_factions.has(issuer) or not staged_factions.has(target_faction) or issuer == target_faction or target_person.is_empty() or target_slot.is_empty() or status not in VALID_BOUNTY_STATUS or reward <= 0:
			return false
		var suffix := bounty_id.trim_prefix("npc_bounty:")
		if not suffix.is_valid_int():
			return false
		max_serial = maxi(max_serial, int(suffix))
		staged_bounties[bounty_id] = bounty
	var restored_serial := int(raw.get("bounty_serial", 0))
	if restored_serial < max_serial + 1:
		return false
	factions = staged_factions
	relations = staged_relations
	raids = staged_raids
	npc_bounties = staged_bounties
	bounty_serial = restored_serial
	_drop_invalid_raids()
	return true

func _relation_key(a: String, b: String) -> String:
	return a + "|" + b if a < b else b + "|" + a

func record_player_crime(faction_id: String, severity: int) -> int:
	var sovereign := controller_id(faction_id)
	if not factions.has(sovereign) or severity <= 0:
		return 0
	var row: Dictionary = factions[sovereign]
	if int(row.get("player_bounty", 0)) == 0:
		row["pursuit_due_hour"] = world.absolute_world_hour() + 3
	row["player_bounty"] = mini(1000000, int(row.get("player_bounty", 0)) + severity)
	factions[sovereign] = row
	return player_bounty(sovereign)

func player_bounty(faction_id: String) -> int:
	var sovereign := controller_id(faction_id)
	var total := 0
	for id in ids():
		if controller_id(id) == sovereign:
			total += int((factions[id] as Dictionary).get("player_bounty", 0))
	return total

func settle_player_bounty(faction_id: String, amount: int) -> Dictionary:
	var sovereign := controller_id(faction_id)
	if not factions.has(sovereign) or amount <= 0:
		return {"ok": false, "reason": "invalid"}
	var outstanding := player_bounty(sovereign)
	if outstanding <= 0:
		return {"ok": false, "reason": "clear"}
	var remaining_payment := mini(amount, outstanding)
	for id in ids():
		if remaining_payment <= 0:
			break
		if controller_id(id) != sovereign:
			continue
		var row: Dictionary = factions[id]
		var local := int(row.get("player_bounty", 0))
		var reduction := mini(local, remaining_payment)
		row["player_bounty"] = local - reduction
		remaining_payment -= reduction
		factions[id] = row
	var remaining := player_bounty(sovereign)
	if remaining == 0:
		(factions[sovereign] as Dictionary)["pursuit_due_hour"] = 0
	return {"ok": true, "paid": mini(amount, outstanding), "remaining": remaining}

func hostile_to_player(faction_id: String) -> bool:
	return player_bounty(faction_id) > 0

func record_prison_escape(faction_id: String) -> int:
	# Escape is another real crime on the same canonical bounty authority.
	# Reuse the existing pursuit threshold instead of inventing an escape meter.
	return record_player_crime(faction_id, PLAYER_CRIME_CATALYST_BOUNTY)

func resolve_player_arrest(player, faction_id: String) -> Dictionary:
	var sovereign := controller_id(faction_id)
	var bounty := player_bounty(sovereign)
	if player == null or bounty <= 0 or world == null or world.settlement_authority == null:
		return {"ok": false}
	var settlement_id := _settlement_for_faction(sovereign)
	if settlement_id.is_empty():
		return {"ok": false}
	var fine_due := maxi(5, ceili(float(bounty) / 12.0))
	var paid := mini(maxi(0, int(player.forge_marks)), fine_due)
	player.forge_marks -= paid
	world.settlement_authority.credit_treasury(settlement_id, paid)
	var confiscated_keys := 0
	for raw_id in player.stock.keys():
		var item_id := String(raw_id)
		if item_id.begins_with("warehouse_key:"):
			confiscated_keys += maxi(0, int(player.stock.get(item_id, 0)))
			player.stock[item_id] = 0
	for id in ids():
		if controller_id(id) == sovereign:
			var row: Dictionary = factions[id]
			row["player_bounty"] = 0
			row["pursuit_due_hour"] = 0
			factions[id] = row
	var sentence_hours := clampi(4 + ceili(float(bounty) / 300.0) + (2 if paid < fine_due else 0), 4, 12)
	return {"ok": true, "faction_id": sovereign, "settlement_id": settlement_id, "jail_cell": world.settlement_authority.jail_cell(settlement_id), "bounty_cleared": bounty, "fine_due": fine_due, "fine_paid": paid, "confiscated_keys": confiscated_keys, "sentence_hours": sentence_hours, "release_hour": world.absolute_world_hour() + sentence_hours}

func pursuit_due(faction_id: String) -> bool:
	var sovereign := controller_id(faction_id)
	return factions.has(sovereign) and player_bounty(sovereign) >= PLAYER_CRIME_CATALYST_BOUNTY and world.absolute_world_hour() >= int((factions[sovereign] as Dictionary).get("pursuit_due_hour", 0))

func defer_pursuit(faction_id: String) -> void:
	var sovereign := controller_id(faction_id)
	if factions.has(sovereign):
		(factions[sovereign] as Dictionary)["pursuit_due_hour"] = world.absolute_world_hour() + 12

func bounty_for_settlement(settlement_id: String) -> Dictionary:
	var issuer := controller_for_settlement(settlement_id)
	for bounty_id in _sorted_bounty_ids():
		var row: Dictionary = npc_bounties[bounty_id]
		if String(row.get("issuer_faction", "")) == issuer and String(row.get("status", "")) in ["posted", "accepted", "fulfilled"]:
			return row.duplicate(true)
	return {}

func accept_npc_bounty(bounty_id: String, issuer_settlement: String) -> Dictionary:
	if not npc_bounties.has(bounty_id) or controller_for_settlement(issuer_settlement) != String((npc_bounties[bounty_id] as Dictionary).get("issuer_faction", "")):
		return {"ok": false}
	var row: Dictionary = npc_bounties[bounty_id]
	if String(row.get("status", "")) != "posted":
		return {"ok": false}
	row["status"] = "accepted"
	row["accepted_hour"] = world.absolute_world_hour()
	npc_bounties[bounty_id] = row
	return {"ok": true, "bounty": row.duplicate(true)}

func record_npc_death(person_id: String, player_caused := false) -> Array:
	var changed: Array = []
	for bounty_id in _sorted_bounty_ids():
		var row: Dictionary = npc_bounties[bounty_id]
		if String(row.get("target_person_id", "")) != person_id or String(row.get("status", "")) not in ["posted", "accepted"]:
			continue
		if player_caused:
			row["status"] = "fulfilled"
			row["fulfilled_hour"] = world.absolute_world_hour()
		else:
			row["status"] = "cancelled"
			_refund_bounty(row)
		npc_bounties[bounty_id] = row
		changed.append(row.duplicate(true))
	return changed

func claim_npc_bounty(player, bounty_id: String, issuer_settlement: String) -> Dictionary:
	if player == null or not npc_bounties.has(bounty_id):
		return {"ok": false}
	var row: Dictionary = npc_bounties[bounty_id]
	if String(row.get("status", "")) != "fulfilled" or controller_for_settlement(issuer_settlement) != String(row.get("issuer_faction", "")):
		return {"ok": false}
	var reward := int(row.get("reward", 0))
	player.forge_marks += reward
	row["status"] = "claimed"
	row["claimed_hour"] = world.absolute_world_hour()
	npc_bounties[bounty_id] = row
	return {"ok": true, "reward": reward, "bounty": row.duplicate(true)}

func _sorted_bounty_ids() -> Array[String]:
	var result: Array[String] = []
	for raw_id in npc_bounties.keys():
		result.append(String(raw_id))
	result.sort()
	return result

func _ensure_npc_bounties(absolute_hour: int, events: Array) -> void:
	if world == null or world.progression_authority == null or not world.progression_authority.allows_war() or world.npc_roster_authority == null or world.settlement_authority == null:
		return
	_cancel_peace_bounties(events)
	for issuer in ids():
		var sovereign: String = controller_id(issuer)
		if sovereign != issuer or not at_war(issuer) or _has_live_bounty_for_issuer(issuer):
			continue
		var target_faction: String = _war_enemy(issuer)
		if target_faction.is_empty():
			continue
		var target: Dictionary = _pick_bounty_target(target_faction)
		if target.is_empty():
			continue
		var issuer_settlement: String = world.settlement_authority.settlement_for_faction(issuer)
		var role_kind := String(target.get("role_kind", ""))
		var requested: int = NPC_BOUNTY_GUARD_REWARD if role_kind == "guard" else NPC_BOUNTY_MERCHANT_REWARD
		var reward: int = mini(requested, maxi(0, world.settlement_authority.treasury(issuer_settlement) - NPC_BOUNTY_TREASURY_RESERVE))
		if reward < 24 or not world.settlement_authority.spend_treasury(issuer_settlement, reward):
			continue
		var bounty_id := "npc_bounty:%d" % bounty_serial
		bounty_serial += 1
		var row := {"id": bounty_id, "issuer_faction": issuer, "issuer_settlement": issuer_settlement, "target_faction": target_faction, "target_slot_id": String(target.get("slot_id", "")), "target_person_id": String(target.get("person_id", "")), "target_name": String(target.get("display_name", "")), "target_role": String(target.get("role_title", "")), "reward": reward, "status": "posted", "posted_hour": absolute_hour, "accepted_hour": -1, "fulfilled_hour": -1, "claimed_hour": -1}
		npc_bounties[bounty_id] = row
		events.append({"kind": "npc_bounty_posted", "bounty": row.duplicate(true)})

func _cancel_peace_bounties(events: Array) -> void:
	for bounty_id in _sorted_bounty_ids():
		var row: Dictionary = npc_bounties[bounty_id]
		if String(row.get("status", "")) not in ["posted", "accepted"]:
			continue
		if String(relation(String(row.get("issuer_faction", "")), String(row.get("target_faction", ""))).get("stance", "neutral")) == "war":
			continue
		row["status"] = "cancelled"
		_refund_bounty(row)
		npc_bounties[bounty_id] = row
		events.append({"kind": "npc_bounty_cancelled", "bounty_id": bounty_id})

func _refund_bounty(row: Dictionary) -> void:
	if world != null and world.settlement_authority != null:
		world.settlement_authority.credit_treasury(String(row.get("issuer_settlement", "")), int(row.get("reward", 0)))

func _has_live_bounty_for_issuer(issuer: String) -> bool:
	for row in npc_bounties.values():
		if row is Dictionary and String(row.get("issuer_faction", "")) == issuer and String(row.get("status", "")) in ["posted", "accepted", "fulfilled"]:
			return true
	return false

func _war_enemy(issuer: String) -> String:
	for other in ids():
		if other != issuer and controller_id(other) == other and String(relation(issuer, other).get("stance", "neutral")) == "war":
			return other
	return ""

func _pick_bounty_target(target_faction: String) -> Dictionary:
	var fallback: Dictionary = {}
	for slot_id in world.npc_roster_authority.all_slots():
		var row: Dictionary = world.npc_roster_authority.person(slot_id)
		if String(row.get("faction_id", "")) != target_faction or not bool(row.get("alive", false)):
			continue
		if String(row.get("role_kind", "")) == "guard":
			return row
		if fallback.is_empty():
			fallback = row
	return fallback

func adjust_relation(a: String, b: String, delta: int, reason := "world_pressure") -> Dictionary:
	var ca := controller_id(a)
	var cb := controller_id(b)
	if ca == cb or not factions.has(ca) or not factions.has(cb) or delta == 0:
		return {}
	var key := _relation_key(ca, cb)
	if not relations.has(key):
		return {}
	var row: Dictionary = relations[key]
	var before_score := int(row.get("score", 0))
	var before_stance := String(row.get("stance", "neutral"))
	var requested_score := clampi(before_score + delta, -100, 100)
	var after_score := requested_score
	if world != null and world.progression_authority != null:
		if delta < 0 and requested_score <= -35:
			world.progression_authority.record_milestone("tension_catalyst")
		if delta < 0 and requested_score <= RELATION_WAR_ENTER and world.progression_authority.allows_tension():
			world.progression_authority.record_milestone("war_ready_pressure")
		if not world.progression_authority.allows_tension():
			after_score = maxi(after_score, -34)
		elif not world.progression_authority.allows_war():
			after_score = maxi(after_score, RELATION_WAR_ENTER + 1)
	var after_stance := _stance_for_score(before_stance, after_score)
	if world != null and world.progression_authority != null:
		if after_stance == "trade" and not world.progression_authority.allows_autonomous_caravans():
			after_stance = "neutral"
		if after_stance == "war" and not world.progression_authority.allows_war():
			after_stance = "neutral"
	row["score"] = after_score
	row["stance"] = after_stance
	relations[key] = row
	if after_stance != "war":
		_remove_raids_for_pair(ca, cb)
	if before_stance == "war" and after_stance != "war" and world != null and world.progression_authority != null:
		world.progression_authority.record_milestone("war_resolved")
	return {"a": ca, "b": cb, "reason": reason, "before_score": before_score, "score": after_score, "before_stance": before_stance, "stance": after_stance, "delta": after_score - before_score}

func record_caravan_arrival(origin_settlement: String, destination_settlement: String, payment: int) -> Dictionary:
	if world == null or world.settlement_authority == null or payment <= 0:
		return {}
	var a := controller_for_settlement(origin_settlement)
	var b := controller_for_settlement(destination_settlement)
	if a == b or String(relation(a, b).get("stance", "neutral")) == "war":
		return {}
	return adjust_relation(a, b, 1, "caravan_arrival")

func record_caravan_attack(origin_settlement: String, destination_settlement: String, lost_quantity: int) -> Dictionary:
	if world == null or world.settlement_authority == null or lost_quantity <= 0:
		return {}
	var a := controller_for_settlement(origin_settlement)
	var b := controller_for_settlement(destination_settlement)
	if a == b:
		return {}
	return adjust_relation(a, b, -mini(8, 2 + lost_quantity * 2), "caravan_attacked")

func _stance_for_score(current: String, score: int) -> String:
	if current == "war":
		return "neutral" if score >= RELATION_WAR_EXIT else "war"
	if score <= RELATION_WAR_ENTER:
		return "war"
	if current == "trade":
		return "trade" if score >= RELATION_TRADE_EXIT else "neutral"
	return "trade" if score >= RELATION_TRADE_ENTER else "neutral"

func _simulate_diplomacy(absolute_hour: int) -> Array:
	var events: Array = []
	if world != null and world.progression_authority != null and not world.progression_authority.allows_tension():
		return events
	if absolute_hour <= 0 or absolute_hour % DIPLOMACY_INTERVAL_HOURS != 0 or world == null or world.settlement_authority == null:
		return events
	var keys := relations.keys()
	keys.sort()
	for raw_key in keys:
		var key := String(raw_key)
		var pair := key.split("|")
		if pair.size() != 2:
			continue
		var a := controller_id(String(pair[0]))
		var b := controller_id(String(pair[1]))
		if a == b or String(relation(a, b).get("stance", "neutral")) == "war":
			continue
		var pressure := _resource_pressure(a, b)
		if pressure <= 0:
			continue
		var shift := adjust_relation(a, b, -pressure, "unserved_resource_pressure")
		if not shift.is_empty():
			events.append({"kind": "diplomacy_shift", "hour": absolute_hour, "pressure": pressure, "relation": shift})
	return events

func _resource_pressure(a: String, b: String) -> int:
	var settlement_a := _settlement_for_faction(a)
	var settlement_b := _settlement_for_faction(b)
	if settlement_a.is_empty() or settlement_b.is_empty():
		return 0
	var sa: Dictionary = world.settlement_authority.state(settlement_a)
	var sb: Dictionary = world.settlement_authority.state(settlement_b)
	var targets_a: Dictionary = sa.get("targets", {})
	var targets_b: Dictionary = sb.get("targets", {})
	var production_a: Dictionary = sa.get("local_production", {})
	var production_b: Dictionary = sb.get("local_production", {})
	var inventory_a: Dictionary = sa.get("inventory", {})
	var inventory_b: Dictionary = sb.get("inventory", {})
	var goods: Dictionary = {}
	for item in targets_a.keys():
		goods[String(item)] = true
	for item in targets_b.keys():
		goods[String(item)] = true
	var pressure := 0
	for raw_item in goods.keys():
		var item_id := String(raw_item)
		var target_a := maxi(0, int(targets_a.get(item_id, 0)))
		var target_b := maxi(0, int(targets_b.get(item_id, 0)))
		var critical_a := target_a > 0 and int(inventory_a.get(item_id, 0)) * 4 <= target_a
		var critical_b := target_b > 0 and int(inventory_b.get(item_id, 0)) * 4 <= target_b
		var produces_a := int(production_a.get(item_id, 0)) > 0
		var produces_b := int(production_b.get(item_id, 0)) > 0
		if critical_a and critical_b and not produces_a and not produces_b:
			pressure += 2
		elif critical_a and produces_b and not world.settlement_authority.has_caravan_route(settlement_b, settlement_a, item_id):
			pressure += 1
		elif critical_b and produces_a and not world.settlement_authority.has_caravan_route(settlement_a, settlement_b, item_id):
			pressure += 1
	return mini(6, pressure)

func at_war(faction_id: String) -> bool:
	var sovereign := controller_id(faction_id)
	if not factions.has(sovereign):
		return false
	for other in ids():
		var controller := controller_id(other)
		if controller == sovereign or not factions.has(controller):
			continue
		if String(relation(sovereign, controller).get("stance", "neutral")) == "war":
			return true
	return false

func conflict_status(settlement_id: String) -> String:
	var founding := founding_faction_for_settlement(settlement_id)
	if founding.is_empty():
		return "peace"
	var controller := controller_id(founding)
	if controller != founding:
		return "occupied"
	for raid in active_raids():
		if String(raid.get("target_settlement", "")) == settlement_id:
			return "raid"
	if at_war(controller):
		return "war"
	for other in ids():
		if other == controller:
			continue
		var rel := relation(controller, other)
		if int(rel.get("score", 0)) <= -35:
			return "tense"
	return "peace"

func active_raids() -> Array:
	var rows: Array = []
	var raid_ids := raids.keys()
	raid_ids.sort()
	for raw_id in raid_ids:
		rows.append((raids[raw_id] as Dictionary).duplicate(true))
	return rows

func simulate_hour(absolute_hour: int) -> Dictionary:
	var events: Array = []
	_drop_invalid_raids()
	_ensure_scheduled_raids(absolute_hour, events)
	_ensure_npc_bounties(absolute_hour, events)
	events.append_array(_simulate_diplomacy(absolute_hour))
	var raid_ids := raids.keys()
	raid_ids.sort()
	for raw_id in raid_ids:
		var raid_id := String(raw_id)
		if not raids.has(raid_id):
			continue
		var raid: Dictionary = raids[raid_id]
		if absolute_hour < int(raid.get("next_strike_hour", 0)):
			continue
		var attacker := controller_id(String(raid.get("attacker", "")))
		var defender := controller_id(String(raid.get("defender", "")))
		if attacker == defender or String(relation(attacker, defender).get("stance", "neutral")) != "war":
			raids.erase(raid_id)
			continue
		var target := String(raid.get("target_settlement", ""))
		var pressure := (8 + int(raid.get("strength", 1)) * 4) if bool(raid.get("decisive", false)) else (5 + int(raid.get("strength", 1)) * 3)
		var damage: Dictionary = world.settlement_authority.apply_raid_pressure(target, pressure, attacker)
		raid["strikes"] = int(raid.get("strikes", 0)) + 1
		raid["next_strike_hour"] = absolute_hour + RAID_STRIKE_INTERVAL_HOURS
		raids[raid_id] = raid
		events.append({"kind": "raid_strike", "raid_id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target, "pressure": pressure, "damage": damage})
		var security: int = world.settlement_authority.security(target)
		if security <= 60 and security > 25:
			set_status(defender, "weakened")
		elif security <= 25 and security > 0:
			set_status(defender, "collapsing")
		var decisive := bool(raid.get("decisive", false))
		if security <= 0 and decisive:
			if world.progression_authority != null and not world.progression_authority.allows_annexation():
				set_status(defender, "collapsing")
				raids.erase(raid_id)
				world.settlement_authority.recover_security(target, 12)
				events.append({"kind": "annexation_deferred", "attacker": attacker, "defender": defender, "target_settlement": target})
			elif set_status(defender, "annexed", attacker):
				raids.erase(raid_id)
				events.append({"kind": "annexation", "attacker": attacker, "defender": defender, "target_settlement": target})
		elif not decisive and int(raid.get("strikes", 0)) >= RAID_STALEMATE_STRIKES:
			raids.erase(raid_id)
			world.settlement_authority.recover_security(target, 18)
			var relief := adjust_relation(attacker, defender, STALEMATE_RELIEF, "war_exhaustion")
			events.append({"kind": "raid_stalemate", "raid_id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target, "diplomacy": relief})
	_drop_invalid_raids()
	return {"hour": absolute_hour, "events": events}

func record_raid_defeat(raid_id: String, slot: int) -> Dictionary:
	if not raids.has(raid_id):
		return {"ok": false}
	var raid: Dictionary = raids[raid_id]
	var defeated: Array = raid.get("defeated_slots", [])
	if slot in defeated:
		return {"ok": false}
	defeated.append(slot)
	defeated.sort()
	raid["defeated_slots"] = defeated
	raid["strength"] = maxi(0, int(raid.get("strength", 0)) - 1)
	var remaining := int(raid["strength"])
	var target := String(raid.get("target_settlement", ""))
	if remaining <= 0:
		raids.erase(raid_id)
		world.settlement_authority.recover_security(target, 12)
		return {"ok": true, "repelled": true, "remaining": 0, "target_settlement": target}
	raids[raid_id] = raid
	return {"ok": true, "repelled": false, "remaining": remaining, "target_settlement": target}

func _ensure_scheduled_raids(absolute_hour: int, events: Array) -> void:
	if world != null and world.progression_authority != null and not world.progression_authority.allows_raids():
		return
	var keys := relations.keys()
	keys.sort()
	for index in range(keys.size()):
		var key := String(keys[index])
		var rel: Dictionary = relations[key]
		if String(rel.get("stance", "neutral")) != "war":
			continue
		if absolute_hour % RAID_SPAWN_INTERVAL_HOURS != (index * 4) % RAID_SPAWN_INTERVAL_HOURS:
			continue
		var pair := key.split("|")
		if pair.size() != 2:
			continue
		var a := controller_id(String(pair[0]))
		var b := controller_id(String(pair[1]))
		if a == b or _has_raid_for_pair(a, b):
			continue
		var power_a := _faction_power(a)
		var power_b := _faction_power(b)
		var attacker := _stronger_faction(a, b, absolute_hour)
		var defender := b if attacker == a else a
		var power_gap := absi(power_a - power_b)
		var decisive := power_gap >= RAID_DECISIVE_POWER_GAP
		var raid_strength := RAID_MAX_STRENGTH if decisive else (2 if power_gap >= RAID_CONTESTED_POWER_GAP else 1)
		var target := _settlement_for_faction(defender)
		if target.is_empty():
			continue
		var raid_id := "raid:%s:%s" % [attacker, defender]
		raids[raid_id] = {"id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target, "strength": raid_strength, "max_strength": raid_strength, "strikes": 0, "next_strike_hour": absolute_hour + 2, "started_hour": absolute_hour, "power_gap": power_gap, "decisive": decisive, "defeated_slots": []}
		events.append({"kind": "raid_started", "raid_id": raid_id, "attacker": attacker, "defender": defender, "target_settlement": target, "strength": raid_strength, "decisive": decisive, "power_gap": power_gap})

func _stronger_faction(a: String, b: String, absolute_hour: int) -> String:
	var power_a := _faction_power(a)
	var power_b := _faction_power(b)
	if absi(power_a - power_b) < RAID_CONTESTED_POWER_GAP:
		return a if floori(float(absolute_hour) / float(RAID_SPAWN_INTERVAL_HOURS)) % 2 == 0 else b
	return a if power_a > power_b else b

func _faction_power(faction_id: String) -> int:
	var row := factions.get(faction_id, {}) as Dictionary
	var status := String(row.get("status", "active"))
	var base := {"active": 100, "weakened": 72, "collapsing": 36, "annexed": 0}.get(status, 0) as int
	var settlement_id := _settlement_for_faction(faction_id)
	if settlement_id.is_empty():
		return base
	var state: Dictionary = world.settlement_authority.state(settlement_id)
	var stock_total := 0
	for amount in (state.get("inventory", {}) as Dictionary).values():
		stock_total += int(amount)
	return base + mini(50, int(state.get("treasury", 0)) / 6 + stock_total)

func power_rating(faction_id: String) -> int:
	return _faction_power(controller_id(faction_id))

func has_raid_targeting(settlement_id: String) -> bool:
	for raid in raids.values():
		if String((raid as Dictionary).get("target_settlement", "")) == settlement_id:
			return true
	return false

func recover_status(faction_id: String) -> String:
	var sovereign := controller_id(faction_id)
	if not factions.has(sovereign):
		return ""
	var row: Dictionary = factions[sovereign]
	var status := String(row.get("status", "active"))
	if status == "collapsing":
		row["status"] = "weakened"
	elif status == "weakened":
		row["status"] = "active"
	factions[sovereign] = row
	return String(row.get("status", "active"))

func _settlement_for_faction(faction_id: String) -> String:
	if world == null or world.settlement_authority == null:
		return ""
	for settlement_id in world.settlement_authority.ids():
		if founding_faction_for_settlement(settlement_id) == faction_id:
			return settlement_id
	return ""

func _has_raid_for_pair(a: String, b: String) -> bool:
	for raid in raids.values():
		var attacker := String((raid as Dictionary).get("attacker", ""))
		var defender := String((raid as Dictionary).get("defender", ""))
		if (attacker == a and defender == b) or (attacker == b and defender == a):
			return true
	return false

func _remove_raids_for_pair(a: String, b: String) -> void:
	for raw_id in raids.keys().duplicate():
		var raid: Dictionary = raids[raw_id]
		var attacker := String(raid.get("attacker", ""))
		var defender := String(raid.get("defender", ""))
		if (attacker == a and defender == b) or (attacker == b and defender == a):
			raids.erase(raw_id)

func _drop_invalid_raids() -> void:
	for raw_id in raids.keys().duplicate():
		var raid: Dictionary = raids[raw_id]
		var attacker := controller_id(String(raid.get("attacker", "")))
		var defender := controller_id(String(raid.get("defender", "")))
		if attacker == defender or not factions.has(attacker) or not factions.has(defender) or String(relation(attacker, defender).get("stance", "neutral")) != "war":
			raids.erase(raw_id)
