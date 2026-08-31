# Governance Log — 2026-09-01

## Dungeon Echo v1.8 development — service-depth pass

Branch: `feature/dungeon-v180-town-relic-sets`.

Production remains v1.7.0. This pass continues the v1.8 town/relic branch and does not change the public release boundary.

### Why this pass exists
The first town-growth slice gave buildings persistent levels, visual landmarks and numeric effects. That was necessary but insufficient: a building should eventually change what the player can *do*, not only make the same button cheaper.

### Service progression
- **Smithy**
  - Existing v1.7 +3 refinement and +5 masterwork remain baseline capabilities; old saves do not lose them.
  - Lv1 retains the forge-cost benefit.
  - Lv2 adds paid refinement-route retempering.
  - Lv3 permits already-masterworked gear to change route while preserving masterwork.
  - Repeat retempers rise in price.
- **East-Gate Trade Road**
  - Existing one-click readiness remains available.
  - Lv1 upgrades the readiness kit to top up one Key.
  - Lv2 adds one guarded-caravan stock refill per expedition market cycle.
  - Lv3 applies an 8% supply-price discount.
- **Ember Tavern**
  - Baseline remains one weighted-random post-expedition toast.
  - Lv1 / Lv2 / Lv3 turn that into 2-way / 3-way / 4-way choice.
  - The permanent ATK toast remains hard-capped at two lifetime applications and the count is persisted separately from short display history.
- **Relic Hall**
  - Existing archive expansion already changes service behavior through 50% / 65% / 80% named-set research preference and +3% / +6% / +9% named discovery chance.

### Authority
- `game/domain/town/town-growth-rules-v180.js` owns deterministic service-stage eligibility and bounded modifiers.
- `game/domain/economy/economy-rules-v130.js` owns forge retemper cost, guarded-caravan restock cost and supply prices.
- `game/core/game.js` remains the only owner of Gold/stock/item mutation, tavern reward application, persistence and UI.
- v1.7 refinement/masterwork behavior is deliberately preserved rather than re-gated behind v1.8 construction.

### Compatibility
Storage epoch remains `v130`. New fields (`market.restockUsed`, `tavernRewardCounts`) are optional and sanitized/migrated by the existing meta owner.

### Verification
`town-services-v180.cjs` covers the static/pure service contract, including baseline non-regression, qualitative unlocks, economy delegation, persistent bounded tavern rewards and responsive service UI. `town-services-runtime-v180.cjs` boots the canonical core and verifies the actual town flow: old one-click readiness, Key-enhanced road service, one guarded-caravan refill, night-market price reduction, smithy retemper gates and the two-use ATK-toast cap.
