extends SceneTree

var failed := false

func check(ok: bool, message: String) -> void:
	if ok:
		print("PASS: ", message)
	else:
		failed = true
		push_error(message)

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var text := FileAccess.get_file_as_string("res://data/art_manifest.json")
	var manifest = JSON.parse_string(text)
	check(manifest is Dictionary, "production art manifest parses")
	var policy: Dictionary = manifest.get("policy", {}) if manifest is Dictionary else {}
	check(bool(policy.get("runtime_local_only", false)), "runtime art is explicitly local-only")
	check(String(policy.get("texture_filter", "")) == "nearest", "pixel art requires nearest filtering")
	check(String(policy.get("authority", "")) == "presentation_only", "art remains presentation-only")
	check(bool(policy.get("music_deferred", false)), "music is deferred without blocking visual integration")
	check(bool(policy.get("preserve_source_resolution", false)), "source atlas resolution is preserved by default")
	check(not bool(policy.get("downscale_by_default", true)), "production art cannot be downscaled by default")
	check(String(policy.get("runtime_export", "")) == "lossless_png_preferred", "runtime crops prefer lossless PNG")
	check(bool(policy.get("keep_master_sources", false)), "original master art remains retained")
	check(bool(policy.get("performance_downscale_requires_measurement", false)), "any reduced derivative requires measured performance evidence")

	var sources: Array = manifest.get("sources", []) if manifest is Dictionary else []
	var ids: Array[String] = []
	for row in sources:
		ids.append(String((row as Dictionary).get("id", "")))
	check("inventory_icons" in ids and "player_anim" in ids and "terrain_core" in ids and "furniture_core" in ids, "P0 source atlases are registered")

	var provenance_text := FileAccess.get_file_as_string("res://assets/production/manifest_v045.json")
	var provenance = JSON.parse_string(provenance_text)
	check(provenance is Dictionary, "production crop provenance parses")
	var outputs: Array = provenance.get("outputs", []) if provenance is Dictionary else []
	check(outputs.size() >= 25, "first live art batch contains at least twenty-five production assets")
	var all_lossless := true
	var all_unscaled := true
	for row in outputs:
		var record := row as Dictionary
		all_lossless = all_lossless and String(record.get("format", "")) == "PNG"
		all_unscaled = all_unscaled and not bool(record.get("resized", true))
	check(all_lossless, "first production batch exports lossless PNG")
	check(all_unscaled, "first production batch preserves source crop pixels without downscale")

	var button := Button.new()
	check(not SliceArtCatalog.apply_button_icon(button, "__missing_runtime_asset__"), "missing production art falls back without inventing state")
	check(button.icon == null, "missing art leaves the UI on its text fallback")
	check(button.texture_filter == CanvasItem.TEXTURE_FILTER_NEAREST, "runtime UI enforces nearest filtering")
	check(SliceArtCatalog.apply_button_icon(button, "wood"), "live item art resolves through the shared catalog")
	check(button.icon != null and button.icon.get_height() >= 100, "live item icon keeps high-resolution source crop detail")
	check(button.expand_icon, "high-resolution item art scales at presentation time instead of being resampled on disk")
	check(button.get_theme_constant("icon_max_width") == 42, "item art stays bounded inside mobile controls")
	check(int(ProjectSettings.get_setting("rendering/textures/canvas_textures/default_texture_filter", -1)) == 0, "project default texture filter remains nearest")

	var runtime_paths_are_local := true
	for row in sources:
		var target := String((row as Dictionary).get("target", ""))
		if target.begins_with("http") or target.begins_with("gdrive:"):
			runtime_paths_are_local = false
			break
	check(runtime_paths_are_local, "manifest never makes Drive a runtime dependency")

	var player := SlicePlayer.new()
	player.process_mode = Node.PROCESS_MODE_DISABLED
	root.add_child(player)
	await process_frame
	check(player.production_sprite != null, "player owns one optional production visual projection")
	check(player.production_sprite.texture_filter == CanvasItem.TEXTURE_FILTER_NEAREST, "player production sprite keeps pixel filtering")
	check(player.production_sprite.visible and player.production_sprite.texture != null, "player now projects live Art Atlas imagery")
	check(player.production_sprite.texture.get_height() >= 100, "player source crop keeps its master pixel density")
	check(player.production_sprite.scale.y > 0.0 and player.production_sprite.scale.y < 1.0, "player art is scaled only at render time")
	check(player.production_visual_state in ["idle", "run", "jump", "fall", "attack"], "player art derives state from existing movement/combat facts")
	check(SliceArtCatalog.item_icon("workbench") != null and SliceArtCatalog.item_icon("campfire") != null and SliceArtCatalog.item_icon("storage_box") != null, "physical starter facilities have production art")
	player.free()

	button.free()
	print("wildforge_art_runtime=", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
