# Dungeon Echo v1.8 — Skill Evolution Delivery Audit

Date: 2026-09-01  
Branch: `feature/dungeon-v180-town-relic-sets`

## Defect exposed by restoring the permanent level cap

Dungeon Echo already has four class-specific skill-evolution milestones at Floors 20 / 40 / 60 / 80. Each milestone offers exactly two authored choices and persists the selected stable evolution ID in the player's existing talent list.

The choice data and combat effects were correct, but delivery had an accidental dependency on XP progression:

`pendingSkillEvolution()` was only consulted when `openTalent()` happened, and `openTalent()` was normally reached after a level-up.

Once the canonical permanent Level-50 ceiling was restored, a fresh 1→100 run normally stopped leveling around Floor 28. That meant the Floor-40 / 60 / 80 evolution pairs could become permanently unreachable. Quick Dive, checkpoint departures and restored old runs could also arrive beyond a milestone without any later level-up to wake the choice screen.

Uncapped progression had hidden this defect by continuously generating new talent screens.

## Correction — milestone delivery is depth-driven

The canonical core now has one bounded delivery helper:

`openPendingSkillEvolution()`

It asks the existing earliest-missing scan whether the current depth has an unresolved milestone. No new progression table, milestone ledger or persistence schema was added.

The helper is invoked after the canonical depth/restoration transitions that can reveal a milestone:

- normal stair descent;
- paid Quick Dive;
- Greedy town departure, including conquered checkpoint starts;
- run restoration.

If a player jumps directly to Floor 80 with only the Floor-20 evolution recorded, the existing earliest-missing scan delivers Floor 40 first, then Floor 60, then Floor 80.

## Overlapping level-up talent is preserved

A second edge case occurs when a kill simultaneously:

1. reaches a talent-granting level (every three levels); and
2. happens while a depth evolution is pending.

The evolution is intentionally shown first, but the ordinary level-up talent is no longer discarded. While an evolution pair is open, `pendingTalent` remains intact. Selecting the evolution immediately chains:

- the next missing evolution, if any;
- otherwise the preserved ordinary talent screen.

Only after the final relevant choice does normal play resume. Evolution chaining itself does not spend an extra combat turn between modal choices.

## Persistence and authority

- Evolution definitions, earliest-missing scan, modal delivery and gameplay mutation remain canonical-core responsibilities.
- Completion continues to be inferred from stable evolution IDs already stored in `player.talents`; there is no second milestone ledger.
- The progression domain remains the authority for XP thresholds and permanent level-cap calculation, not for skill-evolution UI/state.
- Storage epoch remains `v130`.
- A run saved before a milestone modal is opened remains recoverable because restore re-evaluates the earliest missing milestone from depth + stable talent IDs.

## Regression evidence

`test/skill-evolution-delivery-v180.cjs` boots the canonical core and verifies:

- Floor 20 exposes exactly its class pair without needing a level-up;
- a simultaneous Level-3 talent + Floor-20 evolution preserves both rewards;
- a direct Floor-80 state with only Floor-20 resolved chains Floor 40 → 60 → 80 in order;
- each milestone persists exactly one stable choice;
- completed milestones do not reopen.

The older `skill-evolution.cjs` contract also now requires the delivery hook on descend, Quick Dive, checkpoint departure and restore.
