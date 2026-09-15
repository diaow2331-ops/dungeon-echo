class_name SliceDisplacedTraveler
extends Node2D

var authority: SliceWorldActorAuthority
var displacement_id := ""

func setup(owner: SliceWorldActorAuthority, id: String) -> void:
	authority = owner
	displacement_id = id
	queue_redraw()

func state() -> Dictionary:
	if authority == null or authority.world == null or authority.world.settlement_authority == null:
		return {}
	for raw in authority.world.settlement_authority.active_displacements():
		if String((raw as Dictionary).get("id", "")) == displacement_id:
			return (raw as Dictionary).duplicate(true)
	return {}

func label_text() -> String:
	var row := state()
	var people := clampi(int(row.get("people", 1)), 1, 3)
	return ("返乡者" if String(row.get("cause", "")) == "return_migration" else "撤离者") + " ×%d" % people

func _draw() -> void:
	var row := state()
	var people := clampi(int(row.get("people", 1)), 1, 3)
	for index in range(people):
		var x := float(index - 1) * 13.0
		draw_circle(Vector2(x, -28), 5.0, Color("d4b98d"))
		draw_rect(Rect2(x - 5, -22, 10, 17), Color("7f735f"))
		draw_line(Vector2(x - 3, -5), Vector2(x - 5, 5), Color("554f45"), 2.0)
		draw_line(Vector2(x + 3, -5), Vector2(x + 5, 5), Color("554f45"), 2.0)
	draw_rect(Rect2(-31, -52, 62, 17), Color(0.05, 0.07, 0.08, 0.82))
	draw_string(ThemeDB.fallback_font, Vector2(-27, -39), label_text(), HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color("e7ddc8"))
