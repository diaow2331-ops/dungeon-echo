# Dungeon Echo — Living Town return-loop audit (v1.9.0 release)

Date: 2026-09-02  
Baseline: `main@b6eaf48` / public v1.8.1

## Problem

v1.8.0 established the correct town foundation: persistent construction, residents, a bounded chronicle, named-relic collection and safe-return town events. The remaining weakness was repetition. Only three return events existed, while the Street Rumor line mostly repeated the latest safe-return depth.

That meant a highly developed Smithy, Trade Road or Tavern changed service math and art but did not create enough new ordinary-town consequences between expeditions.

## Candidate change

This pass keeps the existing state model and makes completed construction feed back into town life.

The safe-return event catalogue grows from three to six:
- Relic Exhibition — unchanged;
- Caravan Surplus — unchanged;
- Scout Reserve Crate — unchanged;
- Apothecary Batch — requires Trade Road Lv1 and offers two Potions for a bounded bulk price;
- Smithy Caravan Commission — requires Smithy Lv1 and turns the rebuilt furnace into a small non-dungeon Gold earner;
- Long-Table Supply Pool — requires Tavern Lv1 and offers a Potion + Return Scroll bundle.

Project-gated events are selected only from services that actually exist. No new event queue, currency, resident state or RNG stream is introduced.

## Ambient town memory

`townRumor()` is now a pure deterministic projection of the existing town snapshot: town tier, run count, deepest/last return, archive progress, project levels, pending town business and Relic Hall focus.

A pending town event takes priority on the notice board. Otherwise the line rotates among authored observations about the smithy, trade road/night market, tavern, Relic Hall, deep-floor watch pressure and recent returns.

The function consumes no gameplay RNG and writes no persistence. Reloading the same durable town state therefore cannot silently alter game state.

## Authority boundary

- `game/domain/town/town-growth-rules-v180.js` remains the sole policy owner for event definitions, eligibility, deterministic selection and state-aware town copy.
- `game/core/game.js` remains the sole mutation owner for Gold, Potions, Return Scrolls, Keys, event persistence, town chronicle and rendering.
- Storage epoch remains `v130`; existing saves require no migration.
- Dungeon generation, combat, loot RNG, named-set rules, expedition contracts and the other games are untouched.

## Acceptance

Focused checks must prove:
- all six event identities are deterministic and bounded;
- project-only events cannot appear before their project exists;
- pending Potion effects survive sanitization and are applied only by core;
- ambient rumors are deterministic and bilingual;
- the existing town/relic/contract contracts remain green.

The candidate passed the full local authority, cross-game and current-release suites and is promoted with v1.9.0 / cache generation 190.
