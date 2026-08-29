# Dungeon Echo v1.3.0

Dungeon Echo v1.3.0 is a runtime-authority reset on public cache generation **168**. It removes the layered presentation and save-compatibility structure that accumulated across the v1.2 line and returns production to one explicit source of truth.

## Single production authority

- `game/core/game.js` is the only dungeon/town Canvas renderer.
- Historical entity/terrain/town overlays are removed from the active tree and immutable artifact.
- Canvas interception and cleanup shims are removed rather than patched again.
- The pixel-direction hero overlay and programmatic line combat FX remain retired.
- Production entries no longer preload or execute `art/runtime/*` presentation assets.
- Canonical v11 hero, monster, guardian, final-boss and town assets are rendered directly by core.

## Clean storage epoch

v1.3.0 intentionally starts a new local storage epoch: `v130`.

On the first v1.3.0 visit, prior Dungeon Echo `de-*` storage is removed. Historical save-integrity and item-migration shims are not executed or shipped. **New Adventure** performs a full Dungeon Echo reset, including Greedy Expedition meta, then starts a fresh run. This is intentionally not backward-compatible with v1.2 browser progress.

## Why this reset exists

The v1.2 art closeout exposed a structural problem: several independent presentation owners could draw or intercept the same Canvas surface. A black radial mask could remain visible even after the most obvious hero overlay was retired because another entity runtime still owned a masking pass. v1.3.0 fixes the ownership model rather than adding another compensating layer.

## Release boundary

The immutable artifact explicitly rejects the retired runtime graph. It must not contain the old save-integrity/migration files, visual polish Canvas, entity/terrain/town overlay runtimes, character cleanup interceptor, ground-loot overlay, directional hero runtime, class line FX or transitional New Run patch.

The focused CI contract builds the final ZIP and verifies:

- semantic version `1.3.0`;
- cache generation `168`;
- one declared Canvas render owner: `game/core/game.js`;
- storage epoch `v130` with historical migration disabled;
- canonical core art assets present;
- retired runtime files and `art/runtime/` absent from the artifact;
- retained expedition-pressure and combat-control contracts still pass.

## Compatibility

This release deliberately resets previous Dungeon Echo browser progress. It does not attempt to import or preserve v1.2 run, Greedy meta, item-migration or compatibility state. Gameplay balance is otherwise not intentionally retuned by this authority cleanup.
