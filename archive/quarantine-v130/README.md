# v1.3.0 quarantine shelves

This directory preserves previously completed Dungeon Echo work while production ownership is normalized. Nothing here is loaded by production or admitted by `ops/release/static-files.txt`.

The rule is: **preserve the work, isolate the authority.**

## Gameplay shelves

- `gameplay/combat/` — combat pressure and defense behavior.
- `gameplay/equipment/` — equipment/inventory system work.
- `gameplay/economy/` — commerce and forging.
- `gameplay/progression/` — progression and progression guards.
- `gameplay/town/` — town gameplay and NPC stability.
- `gameplay/content-risk/` — content generation, challenge pressure, risk/reward and tuning.

## Presentation / platform shelves

- `ui/combat/` — combat hints and expedition pressure UI.
- `ui/town/` — shop, forge feedback, town workspace and expedition record UI.
- `ui/platform/` — audio and mobile UX work.
- `ui/reference/` — historical Help/responsive implementations retained for comparison.
- `input/` — old combat-controls and desktop/gamepad implementations.
- `locale/data/` — historical locale data snapshots.
- `locale/route/` — historical fixed-route owner snapshot.
- `locale/interceptors/` — retired Canvas/screen interception implementations.
- `persistence/` — save validation, migration and New Adventure reset shims.

## Art shelves

- `art/code/` — retired overlay/coordinator runtime code.
- `art/assets/runtime/` — detailed Boss, monster, prop, hero and loot assets from the overlay era.
- `art/assets/equipment/` — retired equipment art assets.

## Restoration rule

A shelf item is never switched back on in place.

To restore something:

1. identify its responsibility in `docs/authority-map-v130.json`;
2. identify the planned destination in `docs/MODULE_REINTEGRATION_PLAN_v130.md`;
3. port useful logic/data/art into the sole owner or into a helper whose write authority is explicitly delegated by that owner;
4. remove the old implementation's competing state, event, render or storage ownership;
5. transfer authority atomically in the same PR if a new owner replaces the old one;
6. update the authority contract and release allowlist only after the single-owner invariant passes.

The quarantine is an organized reconstruction library, not an alternate runtime.