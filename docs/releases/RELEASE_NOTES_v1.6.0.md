# Dungeon Echo v1.6.0

## Scope

This is a modular-authority maintenance release. The v1.5 player-facing gameplay and feedback remain intact; the change reduces future maintenance risk by completing two atomic rule transfers.

## Architecture

- `game/domain/town/town-rules-v130.js` is now the sole production authority for checkpoint unlock policy and expedition-readiness thresholds.
- `game/domain/economy/economy-rules-v130.js` is now the sole deterministic authority for forge/sell, town supply, tavern, quick-dive and wheel pricing/stock calculations.
- `game/core/game.js` continues to own every live state mutation, transaction commit, RNG use, persistence write, Canvas render and gameplay input path.
- No wrapper, overlay, duplicate storage writer or second event owner was introduced.

## Release boundary

- Semantic version: `1.6.0`
- Cache generation: `180`
- Storage epoch: `v130` (unchanged)
- Public route: `/dungeon-echo/`
- English route: `/dungeon-echo/en/`
- Immutable builder: `ops/release/build-site-bundle.sh`

## Verification

Run focused domain/authority tests during iteration, then `bash ops/check-authority-local.sh`, `bash ops/repo/check-game-boundaries.sh` and `node test/current-suite.cjs` once immediately before release packaging.
