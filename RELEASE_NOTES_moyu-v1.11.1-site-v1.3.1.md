# Clock Out Alive v1.11.1 + 91hwl site v1.3.1

This is a presentation-focused follow-up to the accepted v1.11.0 / site v1.3.0 release. Dungeon Echo remains frozen at v1.2.6.

## Clock Out Alive v1.11.1

- Removes the active player focus halo while keeping the grounded shadow.
- Emits takeoff dust only on a true ground jump; the second jump no longer creates dust at floor level.
- Removes the drifting translucent coworker layer from the active draw path.
- Makes game-over headings short and stable; run distance and statistics move into body copy.
- Adds a small release-specific typography stylesheet instead of rewriting the base layout CSS.
- Keeps DAY_END_DISTANCE, PLAYER_HIT, obstacle geometry, difficulty, endings and local-save behavior unchanged.

The accepted v1.11.0 runtime remains the 15-part base source. v1.11.1 is produced by a deterministic build-time patch whose base and final SHA-256 values are pinned. This is not a browser/runtime monkeypatch.

## 91hwl site v1.3.1

- Replaces the governance/development-log presentation with a product-first game home.
- Removes the artificial office-character illustration from the homepage.
- Presents Dungeon Echo with shipped game art and Clock Out Alive with its 14:00 → 18:00 product identity.
- Rebuilds both detail pages into the same dark product system.
- Uses the actually deployed site v1.3.0 commit as the protected previous-homepage boundary for deployment rollback checks.

## Release policy

GitHub Actions are not required for this release. Validation uses deterministic release contracts, bundle checksums, rollback-capable server deployers and final human browser verification.
