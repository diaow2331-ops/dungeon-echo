# Dungeon Echo v1.8 — Permanent Progression Closure Audit

Date: 2026-09-01  
Branch: `feature/dungeon-v180-town-relic-sets`

## Defect found during the 1→100 closure audit

The repository still carried the pure Level-50 policy in `game/domain/progression/progression-rules-v130.js`, and historical v1.2.7 notes explicitly described permanent-growth capping. However, the old action-driven `progression-guard-system.js` owner had later been quarantined and the canonical core never adopted the pure cap calculation.

That left the live level-up loop effectively unbounded.

A deterministic 1→100 kill-stream probe before correction produced:

| Floor | Player level |
| ---: | ---: |
| 10 | 13 |
| 20 | 33 |
| 30 | 57 |
| 40 | 80 |
| 50 | 102 |
| 60 | 124 |
| 70 | 149 |
| 80 | 175 |
| 90 | 202 |
| 100 | **231** |

For a fresh Warrior, that also allowed base ATK to rise to 234 instead of stopping at 53 from normal level deltas. The result would eventually erase the deep-floor pressure work and make equipment/town growth less relevant.

## Correction

The canonical core now consumes `PROGRESSION_RULES.progressionCaps(...).level` before applying XP-driven level gains.

For a fresh save:

- permanent level ceiling = **50**;
- the kill loop cannot transiently step to Level 51;
- latent XP is parked below the Level-50 threshold instead of accumulating for a later accidental burst;
- post-cap kills explicitly report that permanent level is MAX;
- the HUD shows `Permanent Level MAX` rather than a frozen XP fraction.

A repeat 1→100 deterministic probe after correction reached Level 50 during the late 20s and remained exactly Level 50 through Floor 100.

## Legacy compatibility

Existing historical saves already above Level 50 are not rolled back. Their stored level becomes their grandfathered permanent ceiling, matching the compatibility principle previously used by the retired guard. They cannot ratchet that ceiling upward through new XP.

This is intentional: v1.8 fixes future growth without silently deleting old player progress.

## Veteran Oath coherence

The cap audit exposed a second problem: Veteran Oath originally unlocked at town Tier 4 even though a normal 1→100 run reaches the permanent Level-50 ceiling at about Floor 28.

A 30-seed deterministic progression sample showed:

| Contract | Average floor reaching Level 50 | Median |
| --- | ---: | ---: |
| Free Expedition | 27.9 | 28 |
| Veteran Oath (+18% XP) | 26.1 | 26 |

Therefore Veteran Oath now unlocks at **town Tier 2**, after the opening phase but while XP still has meaningful runway. At the permanent cap the town disables the Oath and explains why, so the player cannot accidentally accept +12% enemy ATK for zero progression reward.

The Oath remains an early/mid permanent-progression accelerator. Deep progression after Level 50 is intentionally carried by equipment, six-piece collection, forging, town development and depth-based skill evolutions rather than uncapped base-stat inflation.

## Authority

- `game/domain/progression/progression-rules-v130.js` owns the cap calculation.
- `game/core/game.js` remains the sole owner of XP and player-state mutation.
- No quarantined progression owner is restored.
- Snapshot clamp/evolution helper exports remain dormant.
- Storage epoch remains `v130`.

## Regression gate

`test/progression-cap-runtime-v180.cjs` boots the canonical core and verifies:

- fresh Level-50 ceiling;
- oversized XP cannot cross the ceiling;
- post-cap kills cannot accumulate latent XP;
- base ATK stops after the intended 49 level deltas;
- Veteran Oath is enabled while progression has runway and disabled at cap;
- historical over-50 saves form a fixed compatibility ceiling and cannot ratchet upward;
- the HUD exposes an explicit MAX state.
