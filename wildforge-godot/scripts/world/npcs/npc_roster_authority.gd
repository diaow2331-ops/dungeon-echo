extends RefCounted
class_name SliceNpcRosterAuthority

const ROLE_MERCHANT := "merchant"
const ROLE_GUARD := "guard"
const VALID_ROLES := [ROLE_MERCHANT, ROLE_GUARD]
const PERSONALITIES := ["cautious", "warm", "blunt", "greedy", "stern", "fatalistic"]
const MERCHANT_MAX_HEALTH := 180.0
const GUARD_MAX_HEALTH := 420.0
const MERCHANT_REPLACEMENT_HOURS := 72
const GUARD_REPLACEMENT_HOURS := 48
const REPLACEMENT_SECURITY_FLOOR := 20
const REPLACEMENT_POPULATION_FLOOR := 6

const REGION_NAMES := {
	"verdant": {
		"given": ["米菈", "洛恩", "塔文", "薇岚", "塞洛", "诺菈", "伊森", "芙琳"],
		"family": ["苔森", "河枝", "桥歌", "叶庭", "林渡"],
	},
	"frost": {
		"given": ["伊芙", "哈尔", "维娅", "瑟恩", "诺克", "艾莎", "罗恩", "米娅"],
		"family": ["霜镜", "白槐", "冰河", "冷杉", "雪鸦"],
	},
	"ember": {
		"given": ["萨恩", "凯娅", "雷克", "泽拉", "摩恩", "塔什", "维克", "娅娜"],
		"family": ["烬岭", "赤沙", "黑岩", "灰炬", "炽脊"],
	},
}

var world
var slots: Dictionary = {}

func _init(owner_world) -> void:
	world = owner_world

func register_baseline(raw_settlements: Array) -> int:
	slots.clear()
	var count := 0
	for raw_settlement in raw_settlements:
		if not raw_settlement is Dictionary:
			continue
		var settlement: Dictionary = raw_settlement
		var settlement_id := String(settlement.get("id", ""))
		var faction_id := String(settlement.get("founding_faction", ""))
		for raw_npc in settlement.get("npcs", []):
			if not raw_npc is Dictionary:
				continue
			var spec: Dictionary = raw_npc
			var role_kind := String(spec.get("kind", ""))
			var slot_id := String(spec.get("id", ""))
			if slot_id.is_empty() or role_kind not in VALID_ROLES:
				continue
			slots[slot_id] = _new_person(slot_id, settlement_id, faction_id, role_kind, String(spec.get("role", "")), 0)
			count += 1
	return count

func _new_person(slot_id: String, settlement_id: String, faction_id: String, role_kind: String, role_title: String, generation: int) -> Dictionary:
	var person_id := "%s:person:%d" % [slot_id, generation]
	return {
		"slot_id": slot_id,
		"person_id": person_id,
		"settlement_id": settlement_id,
		"faction_id": faction_id,
		"role_kind": role_kind,
		"role_title": role_title,
		"generation": generation,
		"display_name": _name_for(faction_id, slot_id, generation),
		"personality": _personality_for(slot_id, generation),
		"alive": true,
		"health": GUARD_MAX_HEALTH if role_kind == ROLE_GUARD else MERCHANT_MAX_HEALTH,
		"death_hour": -1,
		"replacement_due_hour": -1,
	}

func has_slot(slot_id: String) -> bool:
	return slots.has(slot_id)

func person(slot_id: String) -> Dictionary:
	return (slots.get(slot_id, {}) as Dictionary).duplicate(true)

func all_slots() -> Array[String]:
	var result: Array[String] = []
	for raw_id in slots.keys():
		result.append(String(raw_id))
	result.sort()
	return result

func _name_for(faction_id: String, slot_id: String, generation: int) -> String:
	var region: Dictionary = REGION_NAMES.get(faction_id, REGION_NAMES["verdant"])
	var given: Array = region.get("given", [])
	var family: Array = region.get("family", [])
	if given.is_empty() or family.is_empty():
		return "无名者"
	# Succession must visibly produce a different person, not only a different hidden id.
	var given_base := _index_for("%s|given" % slot_id, given.size())
	var family_base := _index_for("%s|family" % slot_id, family.size())
	var given_index := (given_base + generation) % given.size()
	var family_index := (family_base + generation * 2) % family.size()
	return "%s·%s" % [String(given[given_index]), String(family[family_index])]

func _personality_for(slot_id: String, generation: int) -> String:
	var base := _index_for("%s|personality" % slot_id, PERSONALITIES.size())
	return String(PERSONALITIES[(base + generation) % PERSONALITIES.size()])

func _index_for(label: String, size: int) -> int:
	if size <= 0:
		return 0
	var mixed := "%d|%s" % [int(world.world_seed) if world != null else 0, label]
	return posmod(int(mixed.hash()), size)

func voice_line(slot_id: String) -> String:
	var row := person(slot_id)
	if row.is_empty():
		return ""
	var personality := String(row.get("personality", ""))
	var role_kind := String(row.get("role_kind", ""))
	return _merchant_voice(personality) if role_kind == ROLE_MERCHANT else _guard_voice(personality)

func _merchant_voice(personality: String) -> String:
	match personality:
		"cautious": return "先看清路和库存，再谈价钱。冒险可以，别把命和货一起押上。"
		"warm": return "路远就慢一点走，货没了还能再攒，人平安回来才有下一趟生意。"
		"blunt": return "缺什么就运什么，卖不动就别硬塞。我只认眼前的货和价。"
		"greedy": return "风险越大，差价越香。只要你敢走，我就敢跟你谈。"
		"stern": return "规矩先说清：货要真，钱要足，出了城门就自己承担风险。"
		"fatalistic": return "路会断，旗会换，货总还得流。能赚多少，看天也看胆子。"
	return ""

func _guard_voice(personality: String) -> String:
	match personality:
		"cautious": return "我不怕麻烦，但更不喜欢没必要的麻烦。把武器收好。"
		"warm": return "只要你守规矩，这里愿意给旅人一条安稳的路。"
		"blunt": return "别闹事。闹了，我就抓你。"
		"greedy": return "规矩值多少钱，得看你想做什么。不过有些线最好别碰。"
		"stern": return "这里有这里的法。越线之前，先想清楚能不能承担后果。"
		"fatalistic": return "今天守这面旗，明天也许换一面。但今晚的门，我还是得守。"
	return ""

func is_alive(slot_id: String) -> bool:
	return bool((slots.get(slot_id, {}) as Dictionary).get("alive", false))

func health(slot_id: String) -> float:
	return float((slots.get(slot_id, {}) as Dictionary).get("health", 0.0))

func max_health(slot_id: String) -> float:
	var row: Dictionary = slots.get(slot_id, {})
	return GUARD_MAX_HEALTH if String(row.get("role_kind", "")) == ROLE_GUARD else MERCHANT_MAX_HEALTH

func damage(slot_id: String, amount: float, absolute_hour := -1) -> Dictionary:
	if not slots.has(slot_id) or amount <= 0.0 or not is_alive(slot_id):
		return {"ok": false}
	var row: Dictionary = slots[slot_id]
	var before := float(row.get("health", max_health(slot_id)))
	var after := maxf(0.0, before - amount)
	row["health"] = after
	var died := after <= 0.0
	if died:
		var now: int = absolute_hour if absolute_hour >= 0 else (world.absolute_world_hour() if world != null else 0)
		row["alive"] = false
		row["death_hour"] = now
		row["replacement_due_hour"] = now + _replacement_delay(row)
	slots[slot_id] = row
	return {"ok": true, "died": died, "health_before": before, "health": after, "person_id": String(row.get("person_id", ""))}

func simulate_hour(absolute_hour: int) -> Array:
	var events: Array = []
	for slot_id in all_slots():
		var row: Dictionary = slots[slot_id]
		if bool(row.get("alive", true)):
			continue
		if absolute_hour < int(row.get("replacement_due_hour", 0)):
			continue
		var settlement_id := String(row.get("settlement_id", ""))
		if not _replacement_possible(settlement_id, String(row.get("role_kind", ""))):
			continue
		var generation := int(row.get("generation", 0)) + 1
		var successor := _new_person(slot_id, settlement_id, String(row.get("faction_id", "")), String(row.get("role_kind", "")), String(row.get("role_title", "")), generation)
		slots[slot_id] = successor
		events.append({"kind": "npc_succeeded", "slot_id": slot_id, "settlement_id": settlement_id, "role_kind": String(successor["role_kind"]), "person_id": String(successor["person_id"]), "display_name": String(successor["display_name"]), "generation": generation})
	return events

func _replacement_possible(settlement_id: String, role_kind: String) -> bool:
	if world == null or world.settlement_authority == null:
		return false
	if world.settlement_authority.population(settlement_id) < REPLACEMENT_POPULATION_FLOOR:
		return false
	if world.settlement_authority.security(settlement_id) < REPLACEMENT_SECURITY_FLOOR:
		return false
	return world.settlement_authority.fund_npc_replacement(settlement_id, role_kind)

func _replacement_delay(row: Dictionary) -> int:
	var role_kind := String(row.get("role_kind", ""))
	var delay := GUARD_REPLACEMENT_HOURS if role_kind == ROLE_GUARD else MERCHANT_REPLACEMENT_HOURS
	if world != null and world.settlement_authority != null:
		var security: int = world.settlement_authority.security(String(row.get("settlement_id", "")))
		if security < 50:
			delay += 24
	return delay

func export_state() -> Array:
	var rows: Array = []
	for slot_id in all_slots():
		var row: Dictionary = slots[slot_id]
		rows.append({
			"slot_id": slot_id,
			"generation": int(row.get("generation", 0)),
			"alive": bool(row.get("alive", true)),
			"health": float(row.get("health", max_health(slot_id))),
			"death_hour": int(row.get("death_hour", -1)),
			"replacement_due_hour": int(row.get("replacement_due_hour", -1)),
		})
	return rows

func restore_state(raw) -> bool:
	if not raw is Array or raw.size() != slots.size():
		return false
	var staged: Dictionary = {}
	for entry in raw:
		if not entry is Dictionary:
			return false
		var slot_id := String(entry.get("slot_id", ""))
		if not slots.has(slot_id) or staged.has(slot_id):
			return false
		var baseline: Dictionary = slots[slot_id]
		var generation := int(entry.get("generation", -1))
		var alive_value = entry.get("alive", null)
		var hp := float(entry.get("health", -1.0))
		var death_hour := int(entry.get("death_hour", -2))
		var due_hour := int(entry.get("replacement_due_hour", -2))
		if generation < 0 or not alive_value is bool or not is_finite(hp) or hp < 0.0 or hp > max_health(slot_id):
			return false
		if bool(alive_value) and (hp <= 0.0 or death_hour != -1 or due_hour != -1):
			return false
		if not bool(alive_value) and (hp != 0.0 or death_hour < 0 or due_hour <= death_hour):
			return false
		var restored := _new_person(slot_id, String(baseline.get("settlement_id", "")), String(baseline.get("faction_id", "")), String(baseline.get("role_kind", "")), String(baseline.get("role_title", "")), generation)
		restored["alive"] = bool(alive_value)
		restored["health"] = hp
		restored["death_hour"] = death_hour
		restored["replacement_due_hour"] = due_hour
		staged[slot_id] = restored
	slots = staged
	return true

func restore_legacy_health(slot_id: String, hp: float, absolute_hour: int) -> bool:
	if not slots.has(slot_id) or hp < 0.0 or hp > max_health(slot_id):
		return false
	var row: Dictionary = slots[slot_id]
	row["health"] = hp
	if hp <= 0.0:
		row["alive"] = false
		row["death_hour"] = maxi(0, absolute_hour)
		row["replacement_due_hour"] = maxi(0, absolute_hour) + _replacement_delay(row)
	slots[slot_id] = row
	return true
