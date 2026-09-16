extends RefCounted
class_name SliceArtCatalog

const ITEM_ICON_DIR := "res://assets/production/ui/items/"
const PLAYER_DIR := "res://assets/production/player/"
const TERRAIN_DIR := "res://assets/production/terrain/"

const ITEM_FILES := {
	"soil":"soil.png", "stone":"stone.png", "ash":"ash.png", "sandstone":"sandstone.png", "basalt":"basalt.png",
	"snow":"snow.png", "ice":"ice.png", "wood":"wood.png", "plank":"plank.png", "workbench":"workbench.png",
	"campfire":"campfire.png", "storage_box":"storage_box.png", "raw_meat":"raw_meat.png", "trail_ration":"trail_ration.png",
	"coal":"coal.png", "copper_ore":"copper_ore.png", "copper_bar":"copper_bar.png", "ancient_core":"ancient_core.png",
	"wood_pick":"wood_pick.png", "stone_pick":"stone_pick.png", "copper_pick":"copper_pick.png", "delver_pick":"delver_pick.png",
	"stone_blade":"stone_blade.png", "starter_blade":"starter_blade.png"
}

static var _cache: Dictionary = {}

static func item_icon(item_id: String) -> Texture2D:
	return _texture(ITEM_ICON_DIR + String(ITEM_FILES.get(item_id, item_id + ".png")))

static func player_texture(state: String) -> Texture2D:
	return _texture(PLAYER_DIR + state + ".png")

static func terrain_texture(tile_name: String) -> Texture2D:
	return _texture(TERRAIN_DIR + tile_name + ".png")

static func _texture(path: String) -> Texture2D:
	if path.is_empty():
		return null
	if _cache.has(path):
		return _cache[path] as Texture2D
	if not ResourceLoader.exists(path, "Texture2D"):
		_cache[path] = null
		return null
	var texture := load(path) as Texture2D
	_cache[path] = texture
	return texture

static func apply_button_icon(button: Button, item_id: String) -> bool:
	if button == null:
		return false
	button.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var texture := item_icon(item_id)
	button.icon = texture
	button.expand_icon = true
	button.add_theme_constant_override("icon_max_width", 42)
	return texture != null

static func has_any_production_art() -> bool:
	for item_id in ITEM_FILES.keys():
		if item_icon(String(item_id)) != null:
			return true
	return player_texture("idle") != null or terrain_texture("soil") != null

static func clear_cache() -> void:
	_cache.clear()
