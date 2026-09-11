extends RefCounted
class_name SliceCrafting

const RECIPES := {
	"plank": {"out_id": "plank", "out_n": 4, "need": {"wood": 1}},
	"workbench": {"out_id": "workbench", "out_n": 1, "need": {"plank": 8}},
	"stone_pick": {"out_id": "stone_pick", "out_n": 1, "need": {"stone": 8, "wood": 2}, "station": "workbench", "unique": true},
	"stone_blade": {"out_id": "stone_blade", "out_n": 1, "need": {"stone": 6, "wood": 2}, "station": "workbench", "unique": true},
	"campfire": {"out_id": "campfire", "out_n": 1, "need": {"stone": 6, "wood": 2}},
	"trail_ration": {"out_id": "trail_ration", "out_n": 1, "need": {"raw_meat": 2, "wood": 1}, "station": "campfire"},
}

static func can_craft(player: SlicePlayer, recipe_id: String) -> bool:
	if player == null or not RECIPES.has(recipe_id):
		return false
	var recipe: Dictionary = RECIPES[recipe_id]
	if recipe.has("station"):
		var station := String(recipe["station"])
		if station == "campfire" and (player.world == null or not player.world.near_campfire(player.global_position)):
			return false
		if station == "workbench" and (player.world == null or not player.world.near_workbench(player.global_position)):
			return false
	if bool(recipe.get("unique", false)) and player.item_count(String(recipe["out_id"])) > 0:
		return false
	var need: Dictionary = recipe["need"]
	for item_id in need.keys():
		if player.item_count(String(item_id)) < int(need[item_id]):
			return false
	return true

static func craft(player: SlicePlayer, recipe_id: String) -> bool:
	if not can_craft(player, recipe_id):
		return false
	var recipe: Dictionary = RECIPES[recipe_id]
	var need: Dictionary = recipe["need"]
	for item_id in need.keys():
		player.spend_item(String(item_id), int(need[item_id]))
	player.add_item(String(recipe["out_id"]), int(recipe["out_n"]))
	return true
