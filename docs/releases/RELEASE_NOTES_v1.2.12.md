# Dungeon Echo v1.2.12

Dungeon Echo v1.2.12 now ships the corrected art-closeout hotfix on public runtime cache generation **167**. The guardian/boss, terrain, monster/prop and town presentation pass remains intact, while two experimental hero overlays that regressed the live presentation are retired. Gameplay rules, saves, RNG ownership, equipment identity, economy and progression remain on the existing v1.2 contracts.

## What changed

- Unified entity art remains the production owner for the established high-detail four-class hero/action artwork, loot, deep monsters, guardians and the Floor 100 final boss.
- Nine ten-floor guardians and the Floor 100 final boss retain their dedicated high-detail runtime art.
- Deep-floor monster variants, loot/equipment presentation and dungeon interaction props remain in the immutable release payload.
- All 21 `classic-100` terrain bands keep deterministic material, wall-relief and depth-atmosphere treatment without changing map tiles, FOV or collision.
- Echo Town keeps its bounded workspace, tier-aware landmarks and detailed NPC presentation.
- The experimental `hero-directional-art-v165` pixel overlay is retired from production after it could obscure the established hero with a dark mask when the directional atlas did not cover correctly.
- The experimental `class-combat-fx-v163` programmatic line FX is retired from production to remove simplified arc/line effects that did not match the game's art direction.
- The earlier dynamic equipment-on-body overlay remains retired. Equipment continues to communicate through the existing equipment UI.
- Choosing **New Run** now removes only the active `de-run-v6` expedition save before class selection. Greedy Expedition meta/town progression remains persistent by design.
- Without an explicit `?seed=`, New Run prepares a fresh seed so a new adventure does not silently reproduce the previous map. Explicit seed URLs remain deterministic.
- Public release cache generation advances to **167** so both fixed Chinese and English routes fetch the corrected production graph rather than cached generation-166 scripts.

## Compatibility

No forced progress reset is required. Existing `de-greedy-meta-v1`, Return Scroll meta state, town progression, stable item identifiers and fixed Chinese/English route continuity are preserved. Choosing New Run intentionally clears only the active run save. This hotfix does not change combat balance, item rolls, save schemas, extraction rules or progression ownership.

## Release payload

The corrected immutable Dungeon bundle explicitly admits and validates:

- `game/ui/art-runtime-v2.js`
- `game/ui/art-runtime-v4.js`
- `game/ui/town-art-v160.js`
- `game/ui/new-run-reset-v167.js`
- `art/runtime/hero-action-atlas-v2.svg`
- `art/runtime/monster-deep-atlas-v2.svg`
- `art/runtime/dungeon-props-atlas-v1.svg`
- `art/runtime/boss-guardian-atlas-v3.png`
- `art/runtime/final-boss-v3.png`

The release manifest explicitly excludes `game/ui/hero-directional-art-v165.js`, `game/ui/class-combat-fx-v163.js`, `art/runtime/hero-directional-atlas-v1.png` and the already-retired equipment-on-body overlay.

## Validation provenance

The release freeze is gated by the existing deterministic v1.2 release contract plus focused boss/entity, terrain and town-art contracts and a generation-167 artifact contract. The immutable bundle is built in GitHub Actions, checksums are verified before activation, and deploy/healthcheck scripts require the corrected presentation graph plus the New Run reset owner. After deployment, public-page verification is part of the release acceptance rather than relying only on repository tests.
