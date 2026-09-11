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
	var trees := main.get_tree().get_nodes_in_group("harvestables")

	var plank_recipe: Dictionary = SliceCrafting.RECIPES["plank"]
	var bench_recipe: Dictionary = SliceCrafting.RECIPES["workbench"]
	_check(int(plank_recipe["out_n"]) == 4 and int(plank_recipe["need"]["wood"]) == 1, "Godot plank recipe preserves canonical 1 wood -> 4 plank ratio")
	_check(int(bench_recipe["out_n"]) == 1 and int(bench_recipe["need"]["plank"]) == 8, "Godot workbench recipe preserves canonical 8 plank -> 1 workbench ratio")
	_check(trees.size() == 3, "slice spawns a sparse local tree set")
	_check(not trees[0] is PhysicsBody2D, "resource trees stay pass-through instead of becoming movement obstacles")

	var tree := trees[0] as SliceTreeResource
	var pickups_before := main.get_tree().get_nodes_in_group("pickups").size()
	tree.apply_hit(24.0, Vector2.ZERO)
	tree.apply_hit(24.0, Vector2.ZERO)
	_check(tree.hp == 1, "tree harvest requires repeated committed hits")
	tree.apply_hit(24.0, Vector2.ZERO)
	var pickups := main.get_tree().get_nodes_in_group("pickups")
	_check(pickups.size() == pickups_before + 1, "felled tree produces one physical wood pickup")
	var wood_pickup := pickups[-1] as SliceItemPickup
	_check(wood_pickup.item_id == "wood" and wood_pickup.count == 2, "tree pickup yields the bounded two-wood onboarding amount")
	wood_pickup.collect_now()
	_check(player.item_count("wood") == 2, "wood pickup enters the same single slice stock authority")
	_check(player.context_label() == "制", "context button exposes crafting only when a canonical recipe is available")

	_check(player.craft("plank"), "first plank craft succeeds")
	_check(player.item_count("wood") == 1 and player.item_count("plank") == 4, "first plank craft conserves inputs and outputs")
	_check(player.craft("plank"), "second plank craft succeeds")
	_check(player.item_count("wood") == 0 and player.item_count("plank") == 8, "two wood reaches the exact workbench threshold")
	_check(player.can_craft("workbench"), "eight planks unlock workbench crafting")
	_check(player.craft("workbench"), "workbench craft succeeds")
	_check(player.item_count("plank") == 0 and player.item_count("workbench") == 1, "workbench craft consumes all eight planks exactly once")
	_check(player.context_label() == "台", "context button switches from craft to workbench placement")

	var surface := Vector2i(5, world.surface_y_at(5))
	var bench_cell := surface + Vector2i.UP
	_check(player.place_workbench_at(bench_cell), "crafted workbench can be placed on supported empty ground")
	_check(player.item_count("workbench") == 0 and world.has_workbench(), "workbench placement consumes item and creates one world station")
	_check(main.get_tree().get_nodes_in_group("workbenches").size() == 1, "world contains one authoritative workbench node")
	_check(player.context_label() == "置", "after onboarding station exists the compact context button returns to block placement")

	player.add_item("workbench", 1)
	var before_failed := player.item_count("workbench")
	_check(not player.place_workbench_at(bench_cell), "duplicate station placement into the same cell is rejected")
	_check(player.item_count("workbench") == before_failed, "failed workbench placement never consumes the item")

	print("wildforge_godot_crafting=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
