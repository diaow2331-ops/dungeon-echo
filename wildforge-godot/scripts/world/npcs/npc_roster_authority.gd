extends RefCounted
class_name SliceNpcRosterAuthority

const ROLE_MERCHANT := "merchant"
const ROLE_GUARD := "guard"
const VALID_ROLES := [ROLE_MERCHANT, ROLE_GUARD]
const PERSONALITIES := ["cautious", "warm", "blunt", "greedy", "stern", "fatalistic"]

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
	var given_index := _index_for("%s|given|%d" % [slot_id, generation], given.size())
	var family_index := _index_for("%s|family|%d" % [slot_id, generation], family.size())
	return "%s·%s" % [String(given[given_index]), String(family[family_index])]

func _personality_for(slot_id: String, generation: int) -> String:
	return String(PERSONALITIES[_index_for("%s|personality|%d" % [slot_id, generation], PERSONALITIES.size())])

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
