extends SceneTree

var failed := false

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: ", message)
	else:
		failed = true
		push_error("FAIL: " + message)

func _run() -> void:
	var packed := load("res://scenes/main/main.tscn") as PackedScene
	_check(packed != null, "main scene loads")
	if packed == null:
		quit(1)
		return
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node_or_null("World") as SliceWorld
	var player := main.get_node_or_null("Player") as SlicePlayer
	_check(world != null, "destructible world exists")
	_check(player != null, "CharacterBody2D player exists")
	_check(main.get_tree().get_nodes_in_group("enemies").size() == 3, "one enemy family is locally instantiated")
	if world != null and player != null:
		var surface := Vector2i(0, world.surface_y_at(0))
		_check(world.has_cell(surface), "spawn terrain is solid")
		var before := world.cells.size()
		_check(world.mine_at(surface), "block mining mutates world data")
		_check(world.cells.size() == before - 1, "mining removes exactly one block")
		_check(world.place_at(surface, SliceWorld.DIRT), "block placement restores an empty attached cell")
		_check(world.cells.size() == before, "placement restores world cell count")
		_check(player.collision_mask == 1, "player physics only collides with world layer")
	print("wildforge_godot_smoke=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
