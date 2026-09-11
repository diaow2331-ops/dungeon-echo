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
	var main := packed.instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	var world := main.get_node("World") as SliceWorld
	var player := main.get_node("Player") as SlicePlayer

	_check(player.material_count(SliceWorld.DIRT) == 4, "slice starts with a bounded placement reserve")
	_check(player.material_count(SliceWorld.STONE) == 0, "stone stock starts empty")

	var pickup_count_before := main.get_tree().get_nodes_in_group("pickups").size()
	var stone_cell := Vector2i(0, world.surface_y_at(0) + 4)
	_check(world.tile_at(stone_cell) == SliceWorld.STONE, "deep test cell is stone")
	_check(player.harvest_cell(stone_cell), "harvesting mutates the world through player authority")
	var pickups := main.get_tree().get_nodes_in_group("pickups")
	_check(pickups.size() == pickup_count_before + 1, "harvest creates one physical material pickup")
	var pickup := pickups[-1] as SliceMaterialPickup
	_check(pickup.material_id == SliceWorld.STONE, "pickup preserves harvested material identity")
	pickup.collect_now()
	_check(player.material_count(SliceWorld.STONE) == 1, "pickup collection increments the player's single material wallet")
	pickup.collect_now()
	_check(player.material_count(SliceWorld.STONE) == 1, "pickup collection is idempotent within the queue-free frame")

	var dirt_before := player.material_count(SliceWorld.DIRT)
	var surface := Vector2i(2, world.surface_y_at(2))
	var place_cell := surface + Vector2i.UP
	_check(not world.has_cell(place_cell), "placement test cell starts empty")
	_check(player.place_material_at(place_cell, SliceWorld.DIRT), "placement succeeds on attached empty cell")
	_check(player.material_count(SliceWorld.DIRT) == dirt_before - 1, "successful placement consumes exactly one material")
	var after_success := player.material_count(SliceWorld.DIRT)
	_check(not player.place_material_at(place_cell, SliceWorld.DIRT), "placing into occupied cell fails")
	_check(player.material_count(SliceWorld.DIRT) == after_success, "failed placement never consumes material")

	player.materials[SliceWorld.DIRT] = 0
	var another_cell := surface + Vector2i(-1, -1)
	var before_zero := world.cells.size()
	_check(not player.place_material_at(another_cell, SliceWorld.DIRT), "zero stock blocks placement")
	_check(world.cells.size() == before_zero, "zero-stock placement cannot mutate world data")

	_check(SliceMaterialPickup.MAGNET_RANGE > SliceMaterialPickup.COLLECT_RANGE, "pickup attraction has a bounded approach band")
	_check(SliceMaterialPickup.MAGNET_SPEED > 0.0, "pickup magnet has explicit movement speed")

	print("wildforge_godot_loop=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
