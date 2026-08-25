# Dungeon Echo v1.1.0 — Art & Town Remaster

This patch keeps the existing `de-run-v6` version-2 run save and `de-greedy-meta-v1` town save intact. No migration or progress reset is required.

## Art remaster

- Four production hero sprites now appear in the dungeon instead of sharing the small procedural presentation.
- Equipped weapon, armor, helmet and jewelry visibly change the hero's combat accents and rarity aura.
- Sixteen common monster archetypes receive a consistent high-detail atlas while uncovered archetypes retain a safe procedural fallback.
- All nine ten-floor guardians use bespoke silhouettes; the floor-100 End-Abyss Sovereign has its own final-boss art.
- Every external image path has a runtime fallback so a failed or slow asset request cannot block play.

## Town remaster

- The town uses a new painted refuge backdrop with animated fire and progression overlays.
- Town stages 1–10 now visibly add lanterns, residents, banners and deep-echo effects as conquered depth increases.
- A compact growth panel explains the next expansion threshold, current supply readiness and the core town facilities.
- The fortune wheel is presented as optional entertainment rather than a progression pillar; stash, market, forge and conquered checkpoints remain the main preparation loop.

## Compatibility and release

- Public URLs and the existing shared `/srv/91hwl-play` overlay deployment model are unchanged.
- The upload package is `91hwl-play-dungeon-echo-v1.1.0.zip`; the homepage version card is updated by the separate `91hwl-home-dungeon-echo-v1.1.0.zip` package.
- Production-entry, historical save/gameplay, 100-floor descent and release-contract suites must all pass before packaging.
