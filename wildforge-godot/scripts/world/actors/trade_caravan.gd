class_name SliceTradeCaravan
extends Node2D

var authority: SliceWorldActorAuthority
var caravan_id := ""

func setup(owner_authority: SliceWorldActorAuthority, id: String) -> void:
	authority = owner_authority
	caravan_id = id
	queue_redraw()

func caravan_state() -> Dictionary:
	if authority == null or authority.world == null or authority.world.settlement_authority == null:
		return {}
	for raw in authority.world.settlement_authority.active_caravans():
		var row: Dictionary = raw
		if String(row.get("id", "")) == caravan_id:
			return row.duplicate(true)
	return {}

func _draw() -> void:
	var state := caravan_state()
	if state.is_empty():
		return
	var item_id := String(state.get("item_id", "cargo"))
	var quantity := int(state.get("quantity", 0))
	var body := Color("7f6b4f")
	var cloth := Color("71866b")
	draw_circle(Vector2(-12, -8), 7.0, Color("55493a"))
	draw_circle(Vector2(13, -8), 7.0, Color("55493a"))
	draw_rect(Rect2(-22, -28, 44, 18), body)
	draw_rect(Rect2(-16, -41, 32, 14), cloth)
	draw_line(Vector2(22, -22), Vector2(35, -17), Color("a28d67"), 3.0)
	draw_string(ThemeDB.fallback_font, Vector2(-28, -50), "%s ×%d" % [_item_label(item_id), quantity], HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color("e5ddc5"))

func _item_label(item_id: String) -> String:
	return String({"wood":"木材", "ice":"冰块", "basalt":"玄武岩", "snow":"雪", "ash":"灰烬", "sandstone":"砂岩", "raw_meat":"鲜肉"}.get(item_id, "货物"))
