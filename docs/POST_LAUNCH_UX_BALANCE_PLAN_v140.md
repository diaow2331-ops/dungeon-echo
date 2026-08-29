# Dungeon Echo v1.4.0 — Core Balance & UX Recovery Plan

Baseline: public v1.3.6 (`b89e4e1`). This plan supersedes the remaining v1.3.x post-launch backlog where rules conflict.

## Why v1.4.0

Direct Chrome playtesting found that the game is functionally much healthier, but several systems now contradict each other: class identity, ranged combat, skill economy, backpack decisions, desktop viewport sizing, and the Greedy town loop.

This release is a rules-and-UX recovery, not another cosmetic patch.

## Mature public references

Before implementation, compare public implementations and adopt design principles only:

- Shattered Pixel Dungeon `items/weapon/missiles/MissileWeapon.java`: ranged attacks are explicit targeted actions rather than movement side-effects.
- Shattered Pixel Dungeon `items/wands/Wand.java`: ranged magic owns a visible charge pool, spends charge on casts, and recharges over time/actions.
- Existing Dungeon Echo quarantined v1.2 combat-controls is historical product evidence only; it must never regain runtime/input/save authority.

Do not copy GPL runtime code. Re-implement the principles inside canonical `game/core/game.js`.

## P0 — Class identity and combat economy

### Weapon proficiency

World loot remains class-agnostic. A Warrior can find a bow; an Assassin can find a staff. That is desirable loot variance.

Equipping is class-bound:

- Warrior: swords / axes (`base.cls=warrior`)
- Ranger: bows (`base.cls=ranger`)
- Arcanist: staves (`base.cls=mage`)
- Assassin: daggers (`base.cls=assassin`)
- armor / helmet / boots / rings / amulets remain universal

Off-class weapons can be carried, sold, stashed and forged, but cannot be equipped. Tooltip/detail must state the required class and why the current class cannot use it.

Legacy saves with an off-class weapon already equipped must migrate without item loss.

### Basic attacks

Movement remains standard roguelike movement and bump-melee. It must never auto-fire merely because an enemy is somewhere down the movement line.

`J` becomes an explicit directional basic attack:

- Warrior / Assassin: attack the adjacent enemy in the facing direction.
- Ranger: line attack up to 5 tiles.
- Arcanist: arcane basic attack up to 4 tiles, with modest armor penetration but lower raw scaling than the Ranger.
- Walls block both ranged attacks.

Mouse/touch ranged targeting can be added only through the same canonical attack function.

### Controls

Canonical desktop contract:

- Move: WASD / arrows / explored-tile click
- Basic Attack: `J`
- Class Skill: `K` (`C` remains a compatibility alias for v1.3.x players)
- Quick Dive: `Shift+Enter`
- Descend: `Enter`
- Wait: Space / `.`
- Potion Q / Scroll E / Return T / Pause Esc / Mute M / Fullscreen F

Gamepad and touch must follow the same semantic actions, not old key labels.

### Mana

Mana is canonical player state and persists in run saves.

Initial targets, based on the previously playable v1.2 resource contract:

| Class | Max | Skill Cost | Turn Regen | Basic Attack Bonus | Wait Focus Bonus |
| --- | ---: | ---: | ---: | ---: | ---: |
| Warrior | 60 | 30 | 2 | 2 | 3 |
| Ranger | 70 | 32 | 2 | 3 | 4 |
| Arcanist | 100 | 42 | 3 | 1 | 10 |
| Assassin | 65 | 34 | 2 | 3 | 4 |

Skills require both cooldown-ready and enough Mana. Invalid casts spend neither turn nor Mana.

Mana recovery occurs in canonical turn resolution. Waiting is intentionally the strongest recovery choice; successful basic attacks also reward engagement.

## P0 — Greedy mode continuity

`Greedy Expedition: On` must survive the New Run reload and class-selection handoff. The mode is part of the requested new-run intent and must not be cleared with the single-run save.

Acceptance: Title toggle → New Run → choose class must enter Greedy meta/town flow with `greedy=true`.

## P0 — Desktop play area

At common desktop browser viewports (including 1600×900-ish and 1920×1080-ish outer windows), the gameplay surface must fit vertically without document scrolling.

Reuse the already-correct fullscreen principle: constrain Canvas by available viewport height while preserving aspect ratio. The page footer may collapse into compact help on desktop gameplay.

## P0/P1 — Equipment decision flow

PC and touch must use the same meaning:

1. single click/tap selects an item;
2. persistent detail shows stats, Class Fit, Item Value, weapon proficiency and compare delta;
3. explicit Equip / Drop buttons perform mutations.

Desktop hover tooltip remains a fast preview only. No normal click should silently equip an item.

Newly picked equipment should become selected automatically when practical, so the decision panel is visible immediately.

## P1 — Low-health action clarity

Low HP already has a vignette. Add an actionable Potion affordance: show `Q Potion ×N` / `Q 药水 ×N` prominently when HP <= 25%, without auto-consuming it.

## P1 — Adventure log signal/noise

Normal repeated hit lines should not drown out status, loot, level-up, guardian and tutorial messages. Implement bounded aggregation for repetitive basic-hit entries while retaining exact important events.

## P1 — Greedy town hierarchy

At standard desktop viewport height, `Depart` must be available without scrolling to the bottom.

- Make primary town actions sticky/always visible.
- Compress locked checkpoint buttons into a compact progression row.
- Keep bag / stash / market in the primary workspace.
- Fortune wheel is secondary and may collapse below the primary workspace.

## P1 — Ground-loot readability

Do not create another atlas. Improve the already integrated v13 assets through rendering:

- slightly larger equipment footprint;
- rarity halo/pulse without hard square borders;
- readable nearby label for notable equipment;
- stronger silhouette separation among gold, potion, scroll and equipment.

## Balance guardrails

Do not retune monster HP/ATK again in this pass unless the restored ranged/Mana/proficiency model produces measured breakage. First restore player decision clarity, then re-run 1–10 floor human-style simulations.

Guardian 10–100 pressure remains frozen unless a dedicated balance test shows a regression.

## Release gates

A release candidate must prove:

- off-class weapons drop but cannot equip;
- legacy off-class equipped weapon migrates without loss;
- Ranger and Arcanist can perform explicit ranged basic attacks;
- movement toward a distant enemy does not auto-fire;
- Mana persists, spends only on successful skills, and recovers by turn/attack/wait rules;
- Greedy mode survives New Run reload;
- PC inventory selection shows persistent detail before equip;
- common desktop viewport has no gameplay document overflow;
- low-HP potion affordance appears;
- current suite, authority, 1→100/Endless and immutable release bundle remain green.
