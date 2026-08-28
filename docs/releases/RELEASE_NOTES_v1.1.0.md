# Dungeon Echo v1.1.0 — Art, Equipment & Human-Play Balance Remaster

Dungeon Echo v1.1.0 is the first substantial post-launch update after v1.0.0. It keeps the existing `de-run-v6` version-2 run save and `de-greedy-meta-v1` town save intact; no progress reset is required.

## Equipment and presentation remaster

- Added dedicated v13 weapon and wearable atlases.
- Existing equipment now resolves to tier-specific art instead of reusing one icon across many names and depths.
- Equipment art is consistent across the dungeon bag, top equipment bar, character gear overlay, town bag, stash and underground merchant preview.
- Character sprites visibly reflect equipped weapon, armor, helmet and boots; rings and amulets use restrained accessory effects.
- Four heroes, common monsters, all nine guardians, the floor-100 boss and the town retain their dedicated production art passes.

## Town and progression presentation

- Town presentation evolves across ten progression stages.
- Bag and stash rows now preserve the same equipment identity seen inside the dungeon.
- Underground merchant equipment previews show the actual item art before purchase.
- Existing stash, market, forge, checkpoint and optional fortune-wheel behavior remains unchanged.

## Guardian encounter remaster

The ten guardian/finale nodes use readable counterplay rather than hidden punishment:

- **10 — Telegraphed Armor Break**
- **20 — Frost Ring**
- **30 — Ember Mark**
- **40 — Hunter Line**
- **50 — Mending Channel**
- **60 — Blood Tether**
- **70 — Rupture Cross**
- **80 — Arcane Strip**
- **90 — Echo Trial**
- **100 — End-Abyss Sovereign**, with three HP-driven phases

Late explicit specials at floors 40/60/70/80/90/100 now resolve through the visible armor-break path when they hit. They still provide a full warning window and can be avoided entirely by movement, distance or line-of-sight play. Hidden random armor penetration remains disabled.

## Human-play balance pass

Real-player testing exposed a problem simulation success rates did not: endgame defensive equipment could outscale major enemy attack values so far that deep guardians became near-zero-risk encounters.

v1.1.0 therefore:

- raises ordinary depth scaling moderately;
- increases elite durability and attack pressure without making every monster a stat wall;
- retunes all nine guardians and the final boss to a monotonic 1→100 pressure curve;
- sets the floor-100 boss target to **2200 HP / 104 ATK / 34 DEF**;
- gives guardians, deep elites and selected heavy/ranged late enemies the existing one-turn telegraphed armor-break mechanic;
- keeps normal attacks armor-based and keeps `pierceChanceOf() === 0`;
- restores floor potion supply to a genuine 1–2 roll instead of forcing every floor to two;
- reduces ordinary kill-potion frequency so damage leaves a resource cost and retreat/shop/rest decisions matter again.

Player equipment, talents, owned consumables, save keys and item IDs are not nerfed or migrated.

## Skill evolution

Floors **20 / 40 / 60 / 80** each unlock a two-choice active-skill evolution while keeping the same `C` skill input. Warrior, Ranger, Arcanist and Assassin each receive distinct routes for damage, mobility, protection, sustain and cooldown behavior.

## Compatibility

- Existing run/meta save keys and schema versions remain unchanged.
- Existing compatible saves are preserved.
- Art/UI changes do not clear browser `localStorage`.
- Item IDs and equipment storage remain compatible with the v1.0.0 save path.
- Public game and project URLs remain unchanged.

## Validation note

The repository still contains its deterministic production, save, guardian, progression and release contracts. GitHub Actions quota was exhausted during the final art/balance pass, so the final v1.1.0 balance changes are not represented as a fresh full-suite Actions result. They were deliberately kept as small reviewable diffs with targeted regression contracts.

Human play remains the source of truth for combat feel and long-run balance.

## Deployment target

- Game: `https://play.91hwl.cn/dungeon-echo/`
- Project page: `https://91hwl.cn/toys/dungeon-echo/`
- Version: **1.1.0**
