extends SceneTree

const FactionAuthority = preload("res://scripts/world/factions/faction_authority.gd")

class FakeWorld:
	var hour := 100
	func absolute_world_hour() -> int:
		return hour

var failed := false
func _check(ok: bool, label: String) -> void:
	if not ok:
		failed = true
		push_error(label)

func _init() -> void:
	var world := FakeWorld.new()
	var factions := FactionAuthority.new(world)
	factions.record_player_crime("verdant", 650)
	_check(factions.player_bounty("verdant") == 650, "crime creates real sovereign bounty")
	var partial := factions.settle_player_bounty("verdant", 200)
	_check(bool(partial.get("ok", false)) and int(partial.get("remaining", -1)) == 450, "partial settlement reduces existing bounty")
	_check(factions.hostile_to_player("verdant"), "partial settlement keeps faction hostile")
	var cleared := factions.settle_player_bounty("verdant", 9999)
	_check(bool(cleared.get("ok", false)) and int(cleared.get("remaining", -1)) == 0, "full settlement clears bounty")
	_check(not factions.hostile_to_player("verdant") and not factions.pursuit_due("verdant"), "cleared debt ends hostility and pursuit")
	print("wildforge_bounty_resolution=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
