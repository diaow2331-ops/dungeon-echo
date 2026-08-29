# Quarantined responsibility index

Each shelf preserves completed work but owns **zero production authority**.

| Shelf | Preserved work | Current production owner | Planned extraction destination |
| --- | --- | --- | --- |
| `gameplay/combat/` | combat pressure, defense | `game/core/game.js` | `game/domain/combat/` |
| `gameplay/equipment/` | equipment/inventory rules | `game/core/game.js` | `game/domain/inventory/` |
| `gameplay/economy/` | commerce, forge | `game/core/game.js` | `game/domain/economy/` |
| `gameplay/progression/` | progression, guards | `game/core/game.js` | `game/domain/progression/` |
| `gameplay/town/` | town gameplay, NPC stability | `game/core/game.js` | `game/domain/town/` |
| `gameplay/content-risk/` | content, risk/reward, challenge/tuning | `game/core/game.js` | `game/domain/content/` |
| `ui/combat/` | combat/expedition presentation | DOM only; gameplay stays core | `game/ui/combat/` |
| `ui/town/` | shop/forge/town/record presentation | DOM only; gameplay stays core | `game/ui/town/` |
| `ui/platform/` | audio/mobile UX | no active equivalent yet | `game/ui/platform/` after bounded contracts exist |
| `input/` | old J/K combat controls, old pad adapter | keyboard/touch: core; gamepad: `desktop-controls.js` | `game/input/` only after atomic ownership transfer |
| `locale/*` | data, route owner, old interceptors | current `game/locale/*` + core renderer | `game/locale/`; interceptors are reference-only |
| `persistence/` | validation/migration/reset shims | gameplay: core; epoch reset: production bootstrap | `game/persistence/` only after one-writer extraction |
| `art/code/` | overlay/coordinator runtime code | core renderer | do not restore as overlay; extract only reusable algorithms/data |
| `art/assets/runtime/` | detailed runtime-era art | core renderer | canonical `art/` after direct core/render-owner integration |
| `art/assets/equipment/` | equipment art | core renderer/UI | canonical `art/` only when a single consumer owns display |

## Staged extraction

Five pure libraries have now been re-housed without entering production:

- `game/domain/inventory/equipment-rules-v130.js` — class-fit, affix scaling, deep-slot and rarity rules.
- `game/domain/economy/economy-rules-v130.js` — town supply pricing/stock, heal pricing, forge/sell costs, quick-dive and wheel costs.
- `game/domain/progression/progression-rules-v130.js` — XP thresholds, level-up deltas, talent cadence, progression caps and skill-evolution milestones.
- `game/domain/content/content-rules-v130.js` — floor theme bands, monster eligibility/fallback, encounter counts and special-floor classification.
- `game/domain/town/town-rules-v130.js` — conquered checkpoint unlock/selection policy and expedition-readiness checks.

All staged libraries are intentionally absent from `ops/release/static-files.txt`, are not loaded by either production entry, and own no runtime authority. Their quarantined source implementations remain intact as provenance/reference until later atomic transfers are complete.

The boundaries are deliberately narrow:

- inventory/equipment decides class fit and item-value inputs;
- economy converts value/depth inputs into prices and costs;
- progression calculates thresholds/caps/milestones but never mutates player/meta state;
- content answers what is eligible on a floor, but never spawns entities, consumes RNG or applies combat effects;
- town owns checkpoint/readiness policy only; it does not own economy, inventory movement, rendering or persistence.

That separation prevents a staged library from becoming a second hidden owner while still preserving already-designed mechanics in the correct future shelf.

## Atomic authority-transfer rule

A planned destination is **not** an authority simply because its directory exists.

When a responsibility is extracted from `game/core/game.js`, the same change must:

1. move the complete write responsibility into the new owner;
2. remove the corresponding writer/state-machine ownership from the old owner;
3. define the narrow interface between owner and followers;
4. update `docs/authority-map-v130.json`;
5. update tests so two simultaneous owners cannot pass the lightweight governance check.

Never run old and new owners side by side during a migration.
