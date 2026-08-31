# Dungeon Echo v1.7.0 — Living Town + Expedition Variety

## Goal
Increase player-facing variety without reopening the v1.6 authority architecture.

## Product pillars
1. **Living Town progression** — town tier unlocks real expedition options rather than only changing presentation.
2. **Expedition contracts** — choose one bounded risk/reward modifier before departure.
3. **Dungeon echo events** — optional Blood Offering, Cursed Cache and Elite Trial encounters create floor-level decisions.
4. **Elite affixes** — elites can become Frenzied, Vampiric or Volatile instead of being only stat-scaled enemies.

## Authority design
- `game/domain/expedition/expedition-rules-v170.js`: deterministic contract/event/elite eligibility and values only.
- `game/core/game.js`: sole runtime owner for RNG, spawning, combat, rewards, UI state, rendering and persistence.
- Existing town/economy authorities remain unchanged.

## Compatibility
- Keep storage epoch `v130`.
- New Greedy meta field `contractId` defaults safely to `none`.
- Classic mode receives dungeon event/elite variety but no town contract modifier.

## Release discipline
Do not deploy from this branch. First pass focused v1.7 tests, existing town/combat/save gates, repository boundaries, then the full current suite. Only after the feature slice is stable should version/cache/release metadata advance from v1.6.0/180.
