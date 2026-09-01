# Dungeon Echo v1.8.0

## Release focus

Living Town II + Named Relics. This release makes returning to town a persistent progression loop and gives high-value equipment authored identity without reopening the single-authority runtime architecture.

## Player-facing changes

- Build the Rekindled Smithy, East-Gate Trade Road, Ember Tavern and Relic Hall through three persistent stages. Construction changes both the town's appearance and what its services can do.
- Hunt six fixed named relic sets containing 36 individually named pieces with lore, fixed signature stats, 2/4/6 thresholds and six distinct complete-set capstones.
- Use Relic Hall research to bias eligible named-set discovery without guaranteeing missing pieces.
- Safe returns can stage town events, record a recent chronicle and attract six deterministic residents as town tier and construction advance.
- Town NPCs now use authored scene figures and matching dialogue portraits. Conversations show contextual lines and live town/depth state while remaining available in the adventure log.
- Permanent character growth now closes at Level 50; deep progression continues through equipment, forging, town projects, relic sets and Floor 20/40/60/80 skill evolutions.
- Expedition contracts have clearer roles: Elite Hunt favors Gold, Veteran Oath accelerates pre-cap XP and Relic Sweep owns the named-relic discovery premium.

## Art admission

- 54-cell named relic atlas: six sets × four class weapon forms plus five wearable slots.
- 16-cell town construction atlas: four projects × stages 0–3.
- Shared-order 16-cell town NPC scene and portrait atlases with the historical SVG sheet retained as a load fallback.

## Architecture and compatibility

- `game/domain/town/town-growth-rules-v180.js` owns town projects, service modifiers, return events, NPC dialogue policy and resident eligibility.
- `game/domain/inventory/set-rules-v180.js` owns named-set identity, lore, signatures, thresholds, research policy and capstone definitions.
- `game/core/game.js` remains the sole owner of gameplay mutation, RNG, persistence, input, Canvas rendering and live UI.
- Storage epoch remains `v130`; existing v1.7 saves are preserved and optional v1.8 fields sanitize to compatible defaults.

## Release boundary

- Semantic version: `1.8.0`
- Cache generation: `182`
- Storage epoch: `v130`
