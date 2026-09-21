# Kimi K3 task — Dungeon Echo gameplay logic pass

Work only on branch `kimi/dungeon-gameplay-logic-v191`.

## Goal
Use Kimi K3's frontend/JavaScript strength to improve **actual gameplay logic** in Dungeon Echo v1.9.0. Do not deliver a CSS-only or visual-only pass.

## Authority boundary
- `game/core/game.js` remains the sole owner of live gameplay state, RNG consumption, turn/combat execution, progression mutation, Canvas rendering, input, and persistence.
- `game/domain/**` contains deterministic/pure policy and calculations only.
- `game/ui/**` is a follower; it must not mutate gameplay state.
- `archive/quarantine-v130/**` is reference-only. Do not load retired wrappers.
- Do not create a second state machine, RNG owner, save owner, or localStorage schema.

## First audit targets
1. Expedition pacing and risk/reward choices.
2. Equipment/loot decision quality.
3. Town-return and service choices.
4. Progression arithmetic and repeat-play depth.

Choose the **single highest-value logic weakness** after reading the current code. Implement one bounded improvement that changes player decisions or pacing.

Prefer the existing pure-policy seam under `game/domain/**`. `game/domain/expedition/expedition-rules-v170.js` is a strong candidate if expedition repetition is the main weakness, but do not force that choice if another existing authority is clearly better.

## Constraints
- Native JS/Canvas/offline compatibility stays intact.
- No framework/build-system migration.
- No broad rewrite of `game/core/game.js`.
- No save-format change unless absolutely unavoidable; default is none.
- Preserve Chinese and English routes.
- Add deterministic Node/runtime regression coverage.
- Existing tests must remain green.

## Delivery
Push commits only to `kimi/dungeon-gameplay-logic-v191`; do not merge `main`.
Report:
- weakness identified and player-facing effect;
- files changed;
- authority used;
- focused tests and full-suite result;
- final commit SHA;
- next highest-value logic gap.

Related coordination issue: #434.
