# Dungeon Echo v1.2.12

Dungeon Echo v1.2.12 is the art-closeout hot update on public runtime cache generation **166**. It packages the complete presentation pass together rather than shipping only the new hero-facing sprites. Gameplay rules, saves, RNG ownership, equipment identity, economy and progression remain on the existing v1.2 contracts.

## What changed

- Unified entity art is shipped as one presentation owner, removing the former duplicate overlay path while keeping the authoritative core canvas as fallback.
- Nine ten-floor guardians and the Floor 100 final boss use dedicated high-detail runtime art.
- Deep-floor monster variants, loot/equipment presentation and dungeon interaction props are included in the immutable release payload.
- All 21 `classic-100` terrain bands receive deterministic material, wall-relief and depth-atmosphere treatment without changing map tiles, FOV or collision.
- Echo Town keeps its bounded workspace but now carries tier-aware landmarks and detailed NPC presentation instead of simplified silhouettes.
- Warrior, Ranger, Arcanist and Assassin receive directional combat effects that read the existing facing/attack/skill state without invoking gameplay actions.
- All four classes now have explicit Down / Up / Left / Right hero presentation wired to the existing `player.facing` state.
- The experimental dynamic equipment-on-body overlay is intentionally removed. Equipment continues to communicate through the existing equipment UI rather than cluttering the character silhouette.
- Public release cache generation advances to **166** so the complete art graph is fetched as one hot update on both fixed Chinese and English routes.

## Compatibility

No progress reset is required. Existing `de-run-v6`, `de-greedy-meta-v1`, Return Scroll state, town state, stable item identifiers and fixed Chinese/English route continuity are preserved. This patch does not change combat balance, item rolls, save schemas, extraction rules or progression ownership.

## Release payload

The immutable Dungeon bundle explicitly admits and validates the complete art closeout, including:

- `game/ui/art-runtime-v2.js`
- `game/ui/art-runtime-v4.js`
- `game/ui/town-art-v160.js`
- `game/ui/class-combat-fx-v163.js`
- `game/ui/hero-directional-art-v165.js`
- `art/runtime/monster-deep-atlas-v2.svg`
- `art/runtime/dungeon-props-atlas-v1.svg`
- `art/runtime/boss-guardian-atlas-v3.png`
- `art/runtime/final-boss-v3.png`
- `art/runtime/hero-directional-atlas-v1.png`

The current loot/equipment artwork and existing production art assets remain in the same manifest.

## Validation provenance

The release freeze is gated by the existing deterministic v1.2 release contract plus focused art contracts for the unified boss/entity runtime, terrain v4, town art v160, four-class combat FX v163 and hero directional art v165. The immutable bundle builder and deploy/healthcheck scripts also require the full art payload before activation. Full long-run gameplay rebalancing is intentionally deferred until after this visual hot update, when player-facing work returns to the question of whether the game is fun.
