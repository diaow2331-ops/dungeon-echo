# Governance Log — 2026-09-01

## Dungeon Echo v1.8.0 release freeze
The completed Living Town II + Named Relics branch is frozen as Dungeon Echo v1.8.0 on cache generation 182. The cutover is version-only: storage epoch remains `v130`, existing save keys remain stable, and no new gameplay owner or migration wrapper was introduced. Production runtime now loads `release-stamp-v180.js`; the allowlist, immutable builder, deployer, healthcheck, authored locale routes, current-release pointer and release tests share the same version/cache authority. The deployment contract now also requires and probes the v1.8 town, relic and NPC atlases plus the pure town-growth and named-set policy modules.

## v1.8 town character and dialogue admission
The living-town audit found that contextual NPC writing existed but was presented only as adventure-log text, while the plaza still depended on the historical SVG character sheet. A shared-order pair of 4 × 4 WebP atlases now supplies transparent scene figures and matching authored dialogue portraits for all service NPCs, residents and action variants. Canonical interaction opens a responsive portrait card while preserving the same `npcLine` / `residentLine` result in the log; live chips read existing town/event/archive/depth state without creating new gameplay or persistence authority. The old SVG remains a load fallback, exact coordinates are pinned by `v180-town-character-art.map.json`, and public v1.7.0 remains unchanged. See `docs/DUNGEON_V180_TOWN_CHARACTER_ART_AUDIT.md`.

## v1.8 town and relic atlas admission
The art audit found that v1.8 mechanics had outpaced their visual identity: named relics still reused generic equipment cells and town construction stages were mostly textual/procedural. A normalized alpha-WebP batch now supplies 54 fixed relic cells (six sets × four class weapons plus five wearables) and 16 town-project cells (four projects × stages 0–3). Canonical core maps existing set/project IDs to those cells for bag, equipment, ground loot, Relic Hall and construction/service cards; no gameplay or persistence authority moved. Exact coordinates are pinned by `art/source-atlases/runtime-maps/v180-town-relic-art.map.json`, admission is covered by `test/v180-art-atlases.cjs`, and public v1.7.0 remains unchanged. See `docs/DUNGEON_V180_ART_ATLAS_AUDIT.md`.

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

## Skill-evolution delivery closure
Restoring the Level-50 ceiling exposed a hidden coupling: Floor-40/60/80 skill evolutions had only been surfaced when a later level-up happened, so a correctly capped character could never receive them. Canonical core now delivers the existing earliest-missing evolution directly after descend, Quick Dive, Greedy checkpoint departure and run restore. If an ordinary every-third-level talent and an evolution are pending together, the evolution is shown first but the ordinary reward is preserved; skipped milestones chain in order without creating a second persistence ledger or spending extra combat turns between choice screens. See `docs/DUNGEON_V180_SKILL_EVOLUTION_DELIVERY_AUDIT.md` and `test/skill-evolution-delivery-v180.cjs`.

## 1→100 permanent-progression closure
The full-depth audit found a serious ownership regression: the historical Level-50 guard had been quarantined while `progression-rules-v130.js` still carried the cap as a dormant pure helper, so the canonical kill loop could level indefinitely. A deterministic 1→100 probe reached Level 231 / base ATK 234 before correction. Core now consumes the progression authority's cap calculation while retaining sole XP/player mutation; fresh saves stop at Level 50, latent XP cannot overflow, the HUD shows MAX, and existing over-50 saves are grandfathered without being allowed to ratchet higher. The same audit showed Veteran Oath unlocked too late to provide XP value, so it now unlocks at town Tier 2 and becomes unavailable at the permanent cap. See `docs/DUNGEON_V180_PROGRESSION_CLOSURE_AUDIT.md` and `test/progression-cap-runtime-v180.cjs`.

## Town construction economy follow-up
A runtime Gold audit showed that the original 4,970 G full-project build was far too cheap relative to dungeon income: representative cleared-floor gross Gold averages rise from about 588 G at Floor 10 to 3,990 G at Floor 80. The four three-stage project curves now total 35,500 G, with individual stages costing roughly 0.7–1.7 baseline cleared floors at their unlock bands. Effects, tier gates, relic-count gates, save schema and Gold mutation ownership are unchanged; only future construction commitment changed. See `docs/DUNGEON_V180_TOWN_ECONOMY_AUDIT.md` and the strengthened `town-growth-v180.cjs` gate.

## Expedition contract role follow-up
A quantitative contract audit found that Elite Hunt was indirectly competing for the named-relic role because its increased elite density also creates more high-rarity equipment. Relic Sweep now owns a separate bounded +16 percentage-point named-relic discovery premium through the expedition authority. The set authority composes that input with rarity and Relic Hall bonuses, capped so the current maximum Legendary named chance is 83%. Representative 90-seed floor proxies that include generated chest equipment now put Relic Sweep at 1.64 / 1.71 / 1.69 named relics per Floor 50 / 80 / 90 sample versus Elite Hunt at 1.18 / 1.36 / 1.47. Elite Hunt remains the Gold route, Veteran Oath remains the XP route, and no missing-slot guarantee was introduced. See `docs/DUNGEON_V180_CONTRACT_ROLE_AUDIT.md` and `test/expedition-contract-roles-v180.cjs`.

## Named-relic identity follow-up
A second audit found three collection-quality defects that did not show up in the earlier static catalogue review. First, 6/6 rewards still converged on generic healing/potion/critical-power stats, so complete sets did not change playstyle enough. Each of the six sets now reserves its 6/6 threshold for one distinct power-2 capstone routed through the existing canonical mechanic engine; five pieces never activate it. Second, named relics were inheriting ordinary loot's 30/25/15/15/10/5 slot scarcity, and their coarse same-floor identity hash could repeatedly collapse onto a few pieces. Named relic piece selection is now an equal six-way deterministic policy and the already-consumed slot roll supplies per-drop identity entropy without an additional RNG call. A 12,000-item Floor-80 Legendary probe produced a 16.0%–17.1% share for every named slot after the correction. Third, reducing named relics to one random secondary affix had made their old one-stat fixed signatures too weak: named Legendary value could fall to roughly two-thirds of ordinary Legendary gear. Fixed signatures are now authored multi-stat packages with stronger depth scaling; runtime value probes keep Epic+ named gear near ordinary-item parity while single Legendary relics remain below ordinary Legendary high rolls so set bonuses still matter. See `docs/DUNGEON_V180_RELIC_IDENTITY_AUDIT.md`.
