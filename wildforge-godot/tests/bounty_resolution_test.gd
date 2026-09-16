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
	var economy := world.settlement_authority as SliceSettlementAuthority
	var factions := world.faction_authority as SliceFactionAuthority
	var town := "verdant_mossbridge"
	var treasury_before := economy.treasury(town)
	factions.record_player_crime("verdant", 650)
	_check(factions.player_bounty("verdant") == 650, "crime creates real sovereign bounty")
	player.forge_marks = 200
	var partial := economy.pay_player_bounty(player, town, 650)
	_check(bool(partial.get("ok", false)) and int(partial.get("paid", -1)) == 200, "guard-side settlement consumes only money the player actually owns")
	_check(int(partial.get("remaining", -1)) == 450, "partial settlement reduces the existing bounty")
	_check(player.forge_marks == 0, "partial settlement removes the exact paid Forge Marks")
	_check(economy.treasury(town) == treasury_before + 200, "bounty payment reaches the real settlement treasury")
	_check(factions.hostile_to_player("verdant"), "partial settlement keeps faction law hostile")

	player.forge_marks = 999
	var cleared := economy.pay_player_bounty(player, town, 999)
	_check(bool(cleared.get("ok", false)) and int(cleared.get("paid", -1)) == 450, "final payment cannot overpay the outstanding bounty")
	_check(int(cleared.get("remaining", -1)) == 0, "full settlement clears bounty")
	_check(player.forge_marks == 549, "excess carried money remains with the player")
	_check(economy.treasury(town) == treasury_before + 650, "all paid bounty value is conserved in the treasury")
	_check(not factions.hostile_to_player("verdant") and not factions.pursuit_due("verdant"), "cleared debt ends hostility and pursuit")

	main.free()
	print("wildforge_bounty_resolution=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
