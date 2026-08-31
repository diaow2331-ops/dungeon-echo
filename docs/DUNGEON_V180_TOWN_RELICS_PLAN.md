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
Town project levels are shown in walkable NPC nameplates. The town Canvas also gains bounded project landmarks (smithy fire/furnace detail, market awning/crates, tavern lanterns, deeper Relic Hall framing), so investment changes the home base rather than only numbers in a panel.

## Pillar 3 — Fixed named six-piece sets
Named relics use the existing six equipment slots and activate at 2 / 4 / 6 pieces. Each fixed piece has its own name, lore and signature stats. Named relics keep at most one random secondary affix so identity remains primary.

The Relic Hall can later **research one named set at a time**. This never raises the total named-drop probability by itself; instead, once a named relic is rolled, a developed hall biases which eligible set it belongs to (50% / 65% / 80% by hall level). This turns collection into a long-term town↔dungeon loop without guaranteeing exact pieces.

Relic Hall construction also turns collection into an active town service. After the first archive expansion, the player may track one known/reached set; when a named relic is generated and the tracked set is eligible at that depth, the fixed set-selection policy biases toward it at 50% / 65% / 80% by Hall level. This does not increase ordinary Epic/Legendary frequency by itself and does not guarantee a missing slot, so completing a six-piece set remains a hunt rather than a vending-machine purchase.

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
