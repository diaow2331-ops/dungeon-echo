# Dungeon Echo v1.8.0 — Living Town II + Named Relics

## Goal
Make returning to town materially meaningful and make equipment feel like authored objects rather than anonymous stat bundles.

## Pillar 1 — Persistent town construction
The plaza now exposes four bounded three-stage projects:
- **Rekindled Smithy** — reduces forge cost by 5% / 10% / 15%.
- **East-Gate Trade Road** — adds +1 / +2 / +3 stock to each town supply line.
- **Relic Hall Expansion** — adds +3% / +6% / +9% Epic/Legendary named-relic discovery chance; later stages require catalogue progress as well as Gold.
- **Ember Tavern** — expands the per-character permanent toast cap from 8 to 9 / 10 / 11.

Projects are gated by town tier and Gold. Their levels persist in the existing v130 Greedy meta record and are clamped by the pure town-growth policy on load.

## Pillar 2 — Town visibly remembers investment
Town project levels are shown in walkable NPC nameplates. The town Canvas also gains bounded project landmarks (smithy fire/furnace detail, market awning/crates, tavern lanterns, deeper Relic Hall framing), so investment changes the home base rather than only numbers in a panel. The Relic Hall facade now carries six small collection markers: empty, partial, completed and currently researched sets read differently at a glance, while the plaza ledger separately counts loose relics and completed six-piece sets.

## Pillar 3 — Fixed named six-piece sets
Named relics use the existing six equipment slots and activate at 2 / 4 / 6 pieces. Each fixed piece has its own name, lore and signature stats. Named relics keep at most one random secondary affix so identity remains primary.

The first authored catalogue now contains **six fixed sets / 36 named pieces**: Ashen Watch, Drowned Bell Company, Star-Hunter Oath, Rust-Bell Saints, Void Court and Shattered Moon Rite. Their depth bands deliberately overlap, so early, middle and deep progression all offer competing named-set identities rather than one automatic set per band.

Relic Hall construction turns that catalogue into an active town service. After the first archive expansion, the player may track one known/reached set. When a named relic is rolled and the tracked set is eligible at that depth, set-selection bias rises to 50% / 65% / 80% by Hall level. Research does **not** increase ordinary Epic/Legendary frequency by itself and never guarantees the missing slot, so assembling six pieces remains a dungeon hunt rather than a vending-machine purchase.

## Pillar 4 — A town that reacts to returns
Safe return may stage one deterministic town event instead of treating the town as a static menu. The first slice includes Relic Exhibition, Caravan Surplus and Scout Reserve Crate. Events persist until handled, can consume or add real town resources, and are surfaced both in the plaza ledger and by a visible notice marker.

Walkable NPC dialogue now reacts to construction level, archive progress and recent return depth. The smith talks differently after furnace reconstruction, the merchant reflects trade-road investment, the innkeeper remembers a recent deep return, and the Relic Curator changes tone as the archive fills. Death does not create positive safe-return events.

The plaza also keeps a bounded **Recent Town Chronicle**. Safe returns, project completions, newly catalogued relics and resolved town events leave structured records, so the home base accumulates visible history without storing duplicate free-form story text.

## Pillar 5 — Residents, not scenery
The background population is promoted into a deterministic resident roster. Provisioners, an apothecary apprentice, town watch, expedition scout, portal technician and resident alchemist appear only when town tier and relevant construction justify them. They are real walkable/clickable interaction targets with state-aware dialogue; pending caravan/scout events change the lines of the people involved. Decorative duplicates remain limited to non-interactive crowd dressing.

## Authority boundaries
- `game/domain/town/town-growth-rules-v180.js`: project definitions, requirements and bounded deterministic effects.
- `game/domain/inventory/set-rules-v180.js`: named-set identities, lore, signatures, set thresholds.
- `game/domain/economy/economy-rules-v130.js`: canonical forge and stock pricing algorithms, accepting bounded project modifiers as inputs.
- `game/core/game.js`: sole mutation owner for Gold, project levels, safe-return relic ledger, RNG, combat, persistence, UI, Canvas and input.

## Compatibility
- Storage epoch stays `v130`.
- Missing `townWorks` sanitizes to zero levels.
- Current public release remains v1.7.0 / cache generation 181 until v1.8 is explicitly frozen and released.
