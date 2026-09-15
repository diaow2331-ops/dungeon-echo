# Wildforge Godot Vertical Slice

This directory is an isolated technical proof for the future commercial client. The existing `wildforge/` HTML/Canvas build remains the reference for systems that have not yet migrated. Godot is authoritative for each subsystem explicitly migrated and covered by its current tests; no subsystem may have two live gameplay authorities.

## Gate
The Godot client only becomes authoritative if this slice is materially better on touch devices for movement, jump, mining, placement and melee combat.

## Scope
- Small destructible 2D block world
- CharacterBody2D movement with acceleration, coyote time and jump buffering
- Context primary action: melee enemy or mine aimed block
- Block placement
- One hostile creature with knockback
- Camera smoothing and lightweight hit feedback
- Low-obstruction touch input: floating left/right sticks, one contextual place button

Still deferred: large-scale siege presentation and boss content. Persistence, regional logistics, autonomous caravans, world-driven diplomacy, bounded war raids, political annexation, travel incidents, population displacement and the three-faction authority chain now run in Godot; Canvas remains reference-only for historical systems.

## v0.02 Feel Gate

Before any faction/economy migration, the slice must make the basic verbs feel good: move, jump, land, mine, place, strike, take a hit. v0.02 adds explicit melee windup/active/recovery timing, micro hitstop, enemy stun/flash, camera look-ahead, landing squash, mining crack progress, procedural impact bursts, and touch deadzones.

## Art policy during the engine proof

Final art is intentionally deferred. The proof uses procedural placeholder shapes so gameplay timing can be evaluated independently of polish. Once the feel gate passes, Godot's 2D pipeline will own production art: nearest-filter pixel atlases, TileSet/TileMapLayer-based presentation over chunk data, AnimatedSprite2D/AnimationPlayer character animation, CanvasItem shaders, 2D lights, particles and themed Control UI. Art assets must never become gameplay authority; world simulation stays data-driven.

## v0.03 rhythm milestone

- Faster reversal and bounded apex gravity improve movement response without adding a dash button.
- Melee taps have a short input buffer plus a small grounded attack step; acquisition range stays wider than actual hit range.
- Touch mining keeps only a 90 ms aim-stick grace so minor thumb jitter does not erase progress.
- Crawler damage is no longer passive contact damage: chase -> telegraph -> committed lunge -> recovery.
- Player hits interrupt enemy windup/lunge. Final art remains deferred.

## v0.04 material loop milestone

- Mining now produces a physical material pickup instead of silently deleting world data.
- Pickups use a short bounded magnet radius and feed one player-owned slice material wallet.
- Placement consumes material only after a valid world mutation succeeds; failed placement is free.
- Pickup collection is idempotent to prevent same-frame duplication.
- This wallet is a vertical-slice mechanic, not the production inventory migration.

## v0.05 chunk foundation

- The authoritative world remains one `cells` dictionary. Chunks are cache/presentation only.
- Static terrain drawing is split into 16x16 chunk views, so a tile edit redraws only its chunk.
- Terrain collision is split into chunk bodies and deferred outside the physics callback.
- Ordinary edits rebuild exactly one collision chunk; cardinal chunk neighbors are touched only on boundaries.
- Negative world coordinates use floor-based chunk indexing.
- The headless runner now requires explicit PASS markers so a script parse failure cannot masquerade as success.

## v0.06 crafting loop

- Sparse pass-through trees feed the same physical pickup path as mined blocks.
- The slice ports only the canonical early recipes `1 wood -> 4 plank` and `8 plank -> 1 workbench`.
- One context action changes from craft to station placement and then back to block placement; no extra permanent mobile buttons are added.
- A cross-implementation parity gate prevents the Godot slice from silently drifting from the Canvas reference recipe ratios.

## v0.07 survival loop

- Canonical hunger values are ported unchanged: 100 max, 82 start, 100/720 drain per second, 2 starvation damage every 4 seconds.
- One sparse hunt target proves physical raw-meat drops without migrating the full enemy catalog.
- Canonical food values are preserved: raw meat +9 hunger; trail ration +38.
- Canonical survival recipes are preserved: 6 stone + 2 wood -> campfire; 2 raw meat + 1 wood at a nearby campfire -> trail ration.
- Empty/low hunger applies the same movement penalties as the Canvas reference; a nearby campfire provides the canonical daytime rest-heal rate.
- The single compact context action handles urgent eating, cooking and campfire placement without adding permanent touch buttons.

## v0.09 hunt differentiation

- Early meat hunting now uses a dedicated Bramble Boar instead of a loot-tagged crawler.
- The boar stalks, telegraphs a charge, commits through the charge, then exposes a recovery window.
- Close contact alone is harmless; the tell can be interrupted, while a committed charge has higher resistance.
- Raw meat remains the canonical 1–2 stack reward and still feeds the same survival inventory authority.

## v0.10 exploration milestone

- Two deterministic shallow ruin pockets sit outside the spawn neighborhood on opposite sides of the slice.
- Each ruin exposes real coal/copper world tiles plus one guard-locked relic cache.
- Cache rewards preserve the Canvas shallow-ruin contract: one Ancient Core, bounded coal, bounded copper ore.
- Relic caches reuse the primary-action/harvestable path; no new permanent mobile button is introduced.
- Exploration rewards enter the same proof stock authority used by mining, crafting and survival.

## v0.11 copper-return milestone

- The two shallow ruin expeditions together contain enough copper/fuel for exactly one canonical Red Copper Pick upgrade path.
- Copper ore is smelted only beside an Ember Pit: 2 ore + 1 coal -> 1 bar.
- Red Copper Pick is crafted only beside a Craft Table: 5 bars + 2 wood -> 1 unique pick.
- The upgrade auto-equips and raises real mining power from the stone tier's 1.75 to the canonical 2.30.
- This is the first complete leave-camp -> recover resource -> return -> convert to capability loop.

## v0.12 deep-gate milestone

- One deeper relic annex sits behind a two-block sealed ruin barrier.
- Sealed ruin tiles require 2.30 mining power, so the stone pick cannot bypass the copper-return loop.
- The annex contains exactly 6 copper ore + 3 coal, enough for three additional canonical copper bars.
- One Ancient Core + 3 copper bars + 2 wood at a Craft Table creates the canonical Relic Delver Pick.
- Relic Delver Pick auto-equips at canonical 2.70 mining power.

## v0.13 persistence milestone

The Godot client now owns a versioned save schema (`SAVE_VERSION = 13`) instead of behaving like a disposable proof scene. Persistent authority includes world-cell mutations, player transform/health/hunger, the single stock wallet, equipped tools, placed Craft Tables/Ember Pits, felled resource trees, opened relic caches, and defeated relic guards. Ordinary ambient enemies remain regenerative local actors and are intentionally excluded.

Saves are written every ~20 seconds and on application pause/close. Loading rebuilds scene presentation from persistent authority and explicitly clears transient movement, touch, mining and attack state so a resumed session cannot inherit stale momentum/input. `tests/save_test.gd` performs in-memory and disk round trips; tests never auto-load the user's normal save path.

## v0.14 save-safety milestone

Persistence now uses transactional writes: a candidate save is written and validated at a temporary path, the previous valid primary is rotated to a single backup, and only then is the candidate atomically promoted. Loading tries the primary first and automatically falls back to the previous valid backup if the primary is missing, malformed or fails schema validation. No successful save leaves a `.tmp` file behind.

This milestone intentionally keeps save schema 13 because the payload shape did not change; gameplay milestone numbers and persistence-schema versions are governed independently.

## v0.15 world-scale milestone

The deterministic proof world expands from 85 to 257 columns (`-128..128`) and from depth 27 to 47, while retaining 16x16 chunk presentation/collision. Remote deterministic copper/coal veins create room for later travel content without turning every distant tile into authored state.

Persistence schema 14 stores `WORLD_GENERATION_VERSION` plus only player-authored cell overrides. A fresh generated world stores zero terrain deltas; mining one baseline tile stores one AIR delta; restoring the original tile removes that delta again. v0.13/schema-13 full-map saves migrate only their old `-42..42`, depth-27 authority over the current deterministic baseline, so newly expanded frontier remains intact.

## WF-Foundation 0.1 — block and edit authority

The production-world refactor begins by reducing mutation entry points before adding more simulation. Block hardness, mining threshold, drop identity, solidity and placeability now come from `data/blocks.json` through `SliceBlockRegistry`; they are no longer scattered across mining/drop match statements.

All runtime player terrain edits and station placements route through `SliceWorldEditAuthority`. Decisions already carry actor, owner and legal-status metadata even though Foundation 0.1 still treats generated land as wilderness. World generation and save restoration remain internal baseline writers; gameplay actors are not allowed to mutate the cell dictionary directly.

This structure was informed by inspection of mature MIT Godot sandbox projects such as Coheronia's data-driven block registry, but the Wildforge implementation is independently written around its existing world/save contracts. `tests/world_authority_test.gd` validates runtime decisions and `tests/world_authority_contract.mjs` fails if gameplay scripts regress to direct world-cell access.

## WF-Foundation 0.2 ownership authority

World ownership is persistent authority, not a visual label. Region claims and cell/structure claims resolve independently of terrain tiles, and structure claims override broader territorial claims. Runtime edits now classify legality as `legal`, `illegal`, or `wartime` without making claimed terrain magically indestructible. Permits, owner-faction work and declared war all pass through the same edit decision path. Save schema 15 persists ownership claims while remaining compatible with schema-14 delta saves and schema-13 full-map saves.


## WF-Foundation 0.3 chunk streaming

World data remains fully authoritative while render/collision chunks are streamed around the player with bounded load radii and a one-chunk hysteresis margin. Off-screen edits update terrain/delta state without instantiating presentation or physics; approaching that region rebuilds from the latest authority. Chunk activation/deactivation signals are the shared lifecycle hook for future vegetation, settlement workers, guards and other sparse local actors.

## WF-Foundation 0.4 chunk lighting

Block optical properties are data-driven in `data/blocks.json`; light absorption/emission no longer belongs in presentation code. `SliceLightingAuthority` computes sunlight and local-source propagation only for streamed chunks plus a one-chunk halo, and keeps the resulting scalar light field as derived cache rather than save authority.

Terrain edits invalidate nearby lighting, local emitters propagate across chunk boundaries, and distant unloaded emitters do not allocate caches. Approaching a region rebuilds light from current terrain, while unloading releases its light cache. Lighting is intentionally absent from save payloads. Final colored lighting, shaders and art-directed grading remain presentation work layered above this foundation.
## WF-Foundation 0.5 chunk fluid authority

Water and lava now live in a dedicated `SliceFluidAuthority` instead of overloading terrain block IDs. Fluid amount/type are persistent world authority, while rendering and lighting remain derived presentation. A sparse chunk index means each 10 Hz simulation tick visits only liquid cells in streamed chunks plus a one-chunk halo; distant liquid remains stored but asleep until the player approaches.

Flow is bounded and conservative: unobstructed liquid falls first, blocked liquid equalizes laterally, capacity is clamped to one cell-volume, and propagation crosses chunk boundaries without waking the whole world. Water/lava contact uses one explicit reaction entry point with measured consumption. Placing solid terrain displaces fluid through the same world edit path.

Fluid optical data is registry-driven in `data/fluids.json`; water attenuates light and lava contributes emission to the existing chunk-lighting authority. Save schema 16 persists fluid cells, while schema 15 ownership saves, schema 14 delta saves and schema 13 full-map saves remain migration sources. `tests/fluid_test.gd` locks conservation, cross-chunk flow, active/halo sleeping, reaction accounting, lighting integration and authoritative persistence.

## WF-Foundation 0.6 sparse world actor projection

Persistent world actors are no longer defined by whether a scene node happens to be loaded. `SliceWorldActorAuthority` owns stable identities, chunk location and presence for deterministic ruin guards/caches; active chunks project those records into local Godot nodes and unload them again through the existing chunk lifecycle. No second distance manager or parallel streamer is introduced.

Save schema remains 16 because the external payload shape is unchanged. Guard/cache presence is now read from actor authority instead of scanning loaded groups, so autosaving while a region is unloaded cannot silently record living actors as dead. Defeat/open actions update the same authority before their projection disappears, and streaming the chunk back in cannot resurrect removed actors or duplicate surviving ones. `tests/actor_streaming_test.gd` locks unload/save/reproject/removal behavior.

## WF-Foundation 0.7 vegetation and forestry authority

Trees now come from deterministic world vegetation data instead of three eager scene nodes. `data/vegetation.json` defines harvest durability and drops, while `SliceWorldActorAuthority` owns persistent tree identity and projects trees only inside active chunks. Distant forest belts therefore exist in world authority without consuming scene-tree objects until approached.

Vegetation follows the same baseline-plus-delta rule as terrain. Save schema 17 stores only removed deterministic trees and planted trees; a fresh forest costs zero vegetation rows, felling one baseline tree adds one removal, and restoring that baseline tree collapses the delta again. Schema-16 migration applies its historical `trees` list only to the three legacy onboarding positions so newly generated forests are never erased by an older save.

Tree ownership is resolved from current `SliceWorldOwnershipAuthority` unless a planted tree has an explicit owner override. Territorial transfer therefore changes the legal owner of existing forest without rewriting every tree. Plant/fell APIs are authority operations ready for later faction forestry, permits and theft consequences; Foundation 0.7 does not yet add logging jobs or axe progression. `tests/vegetation_test.gd` locks streaming, ownership transfer, delta persistence, legacy migration and stale-projection cleanup.

## WF-Foundation 0.8 structure authority

Structures are blueprints over real world cells, not decorative scene labels and not a parallel HP system. `SliceStructureAuthority` registers deterministic structure identities and expected tiles, then derives integrity and repair deficits directly from authoritative terrain. Existing ruin chambers and the deep sealed gate are the first baseline structures.

Ownership is not duplicated inside structures. Structure claims are delegated to `SliceWorldOwnershipAuthority`; annexation changes the owner seen by a structure without rewriting its blueprint. Repairs use the same `SliceWorldEditAuthority` path as other runtime edits, including protected/non-player-placeable blueprint tiles. Baseline structure condition requires no new save schema: terrain deltas persist damage and ownership claims persist sovereignty, so integrity reconstructs on load.

## WF-Foundation 0.9 seeded world generator

Natural terrain is no longer authored from a sine surface plus fixed ore coordinates. `SliceWorldGenerator` uses Godot's native `FastNoiseLite` with one explicit seed and separate deterministic channels for surface relief, biome classification, caves, coal, copper and vegetation. Ruins and future settlements remain structure overlays above that natural baseline instead of being baked into terrain generation.

The proof world expands to 1025 columns (`-512..512`) and depth 79 while presentation/collision stay chunk-streamed. Save schema 18 binds terrain/ownership/fluid/vegetation deltas to both `WORLD_GENERATION_VERSION` and `world_seed`. Loading a different seeded save rebuilds terrain, structures, vegetation projections and regenerative local actors before applying persistent deltas. Schema 17 and older saves are explicitly recognized as generation-v1/default-seed worlds; they may migrate only under that historical assumption, never by silently applying old deltas to an arbitrary seed.

## v0.16 traveler foundation

The formal new-game role is now a traveler rather than an innate miner. A fresh player owns one ordinary blade, no pick, no axe and no free placement reserve. Mining power is zero until a real mining tool is acquired; trees require an axe-capable role rather than treating melee weapons as logging tools. Historical `starter_pick` support remains only for old proof saves/tests and is not granted to new players.

One authoritative world day lasts 720 real seconds. Hunger is deliberately slower than the old proof balance (about 30 real minutes from full to empty), ordinary movement never regenerates health, and campfire healing requires a fed, stationary, non-combat rest state at 0.4 HP/s. Save schema 19 persists the world clock and the explicit absence/presence of extraction tools; schema 18 and older saves migrate without inventing an axe or a new-game pick.

## v0.17 first physical settlement

The first formal faction settlement is Verdant's Mossbridge, generated as deterministic world baseline rather than a decorative scene. Its warehouse, market and two gates are real block blueprints owned through `SliceStructureAuthority` and `SliceWorldOwnershipAuthority`; damage, illegality and repair therefore use the same world-edit path as every other physical structure.

`SliceSettlementAuthority` owns the settlement inventory and treasury. The first production trade loop is deliberately narrow: hunted raw meat can be sold only at the physical Mossbridge market, moving goods into settlement stock, debiting settlement treasury and crediting player Forge Marks. Prices respond to the settlement's current shortage, and batch sales are priced marginally so an initial shortage quote cannot be exploited across the whole stack.

Save schema 20 persists settlement economy and player currency. Because Mossbridge changes the deterministic world baseline, world generation is version 3; schema-19/18 generation-2 saves migrate explicitly and cannot erase the newly introduced settlement with historical terrain deltas.

### v0.18 — Android-first NPC dialogue
- Mossbridge merchant and guard are streamed WorldActorAuthority projections, not permanent scene-only NPCs.
- Mouse click and Android touch share one dialogue interaction path; dialogue locks world input and clears stale virtual-stick touches.
- Android/Google Play is the primary shipping target. The project baseline is 1280×720 sensor-landscape with safe-area-aware UI.
- Dialogue, HUD, and contextual actions use the shared MobileLayout contract; minimum primary touch targets are 56 px.
- `npc_dialogue_test.gd` and `mobile_ui_test.gd` are release gates for NPC interaction and Android landscape usability.
## v0.19 physical market interaction

Mossbridge trade is now a real in-world merchant interaction rather than a provisional context-button shortcut. The streamed merchant projection is interactable only at bounded physical range; opening that NPC reuses the existing dialogue overlay and projects a live quote from `SliceSettlementAuthority`. Selling one raw meat routes back through the same `sell_from_player` mutation, so player goods/currency and settlement stock/treasury still change atomically in one authority.

The UI never owns price or inventory state. After every sale it rereads the settlement quote, so shortage relief is reflected immediately. Guards cannot expose the market surface, and mobile trade actions obey the shared safe-area/minimum-touch-target contract.
## v0.20 world simulation heartbeat

The first macro-world heartbeat is driven only by the authoritative `SliceWorldClock`. Crossing world-hour boundaries advances pure settlement data even when Mossbridge and all of its NPC projections are unloaded. No scene node, proximity manager or second timer owns settlement simulation.

The initial rule is intentionally narrow: every four world hours, local residents consume one stored raw meat if available. That real stock reduction recreates shortage pressure and therefore raises the existing market quote naturally. A bounded amount of local sale revenue returns to the same settlement treasury, capped at its deterministic baseline target. The simulation mutates only `SliceSettlementAuthority`; market UI, streamed merchant nodes and chunk state remain projections.

The heartbeat cursor is transient and re-derived from the persisted world clock after load, so restoring a save never replays already-applied economic ticks. Existing settlement inventory/treasury persistence remains the sole durable economy state; no save-schema bump or parallel simulation journal is introduced.
## v0.21 three-faction political authority

`SliceFactionAuthority` is now the single durable authority for the world's three canonical political identities (`verdant`, `ember`, `frost`), their pairwise diplomatic relations, faction lifecycle status and annexation controller chain. The authority is hard-capped to three factions and owns no inventory, treasury, terrain, structure or NPC state. Mossbridge economy remains solely in `SliceSettlementAuthority`; physical sovereignty remains solely in `SliceWorldOwnershipAuthority`.

Diplomacy is stored once per canonical faction pair. If a faction is annexed, reads and writes resolve through its sovereign controller, preventing hidden "vassal relation" records from drifting behind the active political relation. Controller cycles are rejected both at mutation time and at save validation. Political control of a settlement is derived from the settlement's physical owner plus this controller chain rather than copied onto the settlement.

Save schema 21 persists only political facts. Schema 20 is a first-class migration source from the same world-generation version: terrain deltas, ownership claims, fluids, vegetation, settlement stock/treasury, player Forge Marks and world clock restore exactly, while the deterministic three-faction baseline is added. `tests/faction_authority_test.gd` and the schema migration gates prevent a second economy or diplomacy authority from appearing.
## v0.22 three physical settlements

World generation version 4 establishes one deterministic physical settlement for each canonical faction: Frostmirror in `frostglass`, Mossbridge in `verdant_reach`, and Cinder Ridge in `ember_wastes`. The three settlements reuse one parameterized generator; each contributes a real warehouse, market, two gates, one merchant and one guard rather than a parallel town scene or duplicated settlement codepath.

The biome contract is now macro-stable: frost occupies the western frontier, verdant the central frontier, and ember the eastern frontier, with bounded noise warp at the borders. Mossbridge keeps its generation-3 anchor at x=-65 so existing physical edits remain spatially compatible. Frostmirror and Cinder Ridge are new generation-4 baseline overlays.

Save schema 22 binds to world generation 4. Schema 21/20 migration preserves Mossbridge terrain deltas, economy, player Forge Marks, world clock and political facts exactly, while filtering only terrain deltas that would collide with the two newly introduced settlement footprints and adding ownership claims for those new settlements. Existing Mossbridge damage is explicitly regression-tested and must not be healed by migration.

All three settlements share `SliceSettlementAuthority` and the existing world heartbeat. Their NPC identities live in `SliceWorldActorAuthority`, but chunk streaming still projects only nearby actors; adding three towns does not make six settlement NPC nodes permanent.

## v0.23 biome material authority

World generation version 5 gives the three macro biomes distinct physical substrate rather than presentation-only labels. Verdant Reach keeps grass/dirt/stone; Frostglass generates snow/ice/stone; Ember Wastes generates ash/sandstone/basalt. Coal and copper remain resource overlays on those real substrates.

Ash, sandstone, basalt, snow and ice are formal block-registry entries with hardness, drops, placement legality and optical properties. Mining, pickups, placement, lighting and persistence therefore use the same existing world/edit authorities. The current procedural colors are placeholders only; future atlases may replace their rendering but cannot redefine their gameplay state.

Save schema 23 binds to generation 5. Schema 22 is an explicit generation-4 migration source: player-authored terrain deltas are replayed over the new biome baseline, while three-settlement economy, ownership, faction politics, Forge Marks and world clock remain unchanged. Legacy schemas reject block ids that did not exist in their generation.

## v0.24 geography-derived economy baseline

Local supply now derives from the settlement biome rather than faction or settlement ownership: Verdant Reach replenishes wood, Frostglass replenishes snow/ice, and Ember Wastes replenishes ash/sandstone/basalt. Settlement demand remains a separate deterministic market profile. Political annexation can change sovereignty without changing geography-derived production. All production is bounded by settlement target stock and advances only through the existing world-clock heartbeat.

Settlement demand is intentionally asymmetric: Frostmirror and Cinder Ridge value imported food/wood, Mossbridge values remote ice/basalt, and Cinder Ridge values imported ice. These price/target rules feed the same `SliceSettlementAuthority`; geography supplies goods, settlements demand goods, and factions do not own either table.

Save schema remains 23. Durable economy state is still only settlement inventory and treasury; biome supply, settlement demand, consumption profiles, targets, and base prices are deterministic baseline rules re-derived on load. This keeps future player trade and caravans on one inventory authority.
## v0.25 first-five-minute survival loop

A fresh traveler can now complete the opening survival chain from real world resources without injected starter stock. The role begins with one ordinary travel hatchet and no pick: a real tree supplies wood, wood becomes planks and a workbench, the workbench unlocks a 1.0-power wood pick, and that pick opens real stone for the first campfire and later stone-tool progression. The travel hatchet is baseline role equipment rather than loot or a second inventory item.

The compact/mobile context path now remains usable after the first workbench exists: generic plank crafting stays available, while workbench-local tool recipes still require physical proximity. Existing saves adopt the same traveler-hatchet baseline on restore; save schema remains 23 because no new durable authority is introduced.

`tests/first30_start_loop_test.gd` is the release gate for the no-injected-resource opening chain. It obtains wood from deterministic trees, stone through `WorldEditAuthority`, food from a real Bramble Boar, and places the first authoritative workbench/campfire. Tests may no longer prove onboarding solely by injecting wood or stone into player stock.

## v0.26 regional goods at physical markets

All three merchants now expose their settlement authority's accepted goods through one thumb-sized goods selector and the existing sale action. Wood, ice, basalt and other accepted materials transfer from the same player stock into the same settlement inventory, using a fresh authoritative quote at execution time. Shortage feedback explains local demand, selection survives a sale, and unsupported goods, insufficient stock/treasury and remote transactions remain rejected. No new inventory, pricing state or save schema is introduced (schema 23).

### v0.26 continued implementation — integration handoff

- Two-way stock-backed trade: player purchases debit settlement stock and player money, crediting the same settlement treasury. Retail quotes price each withdrawal with a 25% spread above marginal buyback price; 1/5-unit UI batches use fresh execution quotes. No task cargo or additional durable inventory.
- Read-only export leads compare current source cost with other towns' funded sale quotes. Optional destination marking feeds a transient HUD waypoint with direction/distance; arrival and world reset clear it. Prices are explicitly provisional.
- Opening/travel hints derive from equipment, stock, station presence, hunger and actual market coordinates. Hint text occupies a separate HUD row.
- Context action priority now reserves available wood for campfire, cooking and smelting before generic plank crafting. Label and action order match.
- Regional merchant dialogue describes local goods and imports. NPC touch areas are 56x64; nearby interaction prompts and bounded stall crates project live inventory only.

Validation boundary: the earlier sell-only commit passed 40 gates. The subsequent purchase/navigation/context/NPC work has editor compilation checks only; integration owner should run the full suite, exercise buy/sell conservation and same-market round trips, check bulk boundaries/save reload, and review mobile layout before merging. PR/merge/release are intentionally delegated per the user's instruction. Current branch: `feat/wildforge-multi-good-market-v026`.

## v0.27 demand-led trade, warehouse robbery and pursuit

Implementation follows the user's September 14–15 direction: ordinary economics is driven by actual civilian needs and remains quiet; severe physical losses create supply crises. This is not a speculative price simulator.

- Normal shortage premium is bounded at 8%; towns stop accepting goods beyond current targets. Residents use food every four world hours and building/cooling imports once per day. Consumed essentials retain a quarter-target retail reserve. There is no imaginary stock behind the market.
- Warehouse theft transfers the same settlement inventory into the player's existing stock. A stolen supply deficit records the loss and adds crisis pricing; incoming deliveries and actual production reduce it. Trade refuses wanted players.
- Each existing warehouse has an interactive locked doorway. The corresponding guard carries its key; opening removes the real door cells through WorldEditAuthority. Saved world deltas retain the opening. Basic picks cannot bypass the lock (3.5 tool requirement).
- Guards have 420 health, 55% armor reduction, a 32-damage telegraphed thrust and resistance to stun-lock. Neutral guards require an explicit challenge; an assault adds 150 bounty, killing one adds 1,000, and theft adds 25 per unit. Corpse health/key collection persists in WorldActorAuthority. Keys can only be collected once and match one warehouse.
- FactionAuthority owns permanent bounty and pursuit scheduling. At 500+ bounty, a patrol can appear after three world hours; further dispatches are spaced by twelve world hours and only one pursuer is active at a time. Patrols spawn on real nearby surface terrain, not in the player's face. They never carry warehouse keys. Leaving town or dying does not clear the criminal record.
- Hauling takes 1.75 seconds for one unit or 3.15 for five. Leaving, closing or taking damage cancels before transfer. Load derives from existing stock; soft threshold 80, trade/haul capacity 160, maximum load slows movement to 55% before hunger effects.
- Death transfers carried supplies/keys into persistent, recoverable world bags. Equipped tools and camp stations remain with the player. This removes death-as-free-cargo-transport. Recovery uses the same timed hauling UI and never copies cargo.
- Save schema 24 stores security actors, bounty/pursuit, stolen deficits and lost cargo. Schema 23 remains a same-generation migration source; original world/economy/player data is retained and new security defaults are initialized.

Integration status: implementation and editor compilation only. Per user instruction, no new regression suite, PR merge or release was performed. Full runtime/balance/save/mobile integration remains for the integration owner. Earlier v0.26 gate results do not validate this v0.27 change. In particular, old tests assuming passive Area2D guards, unrestricted purchasing, old schema number, or death retaining all stock need their contracts updated deliberately.

## v0.28 — Phase 2 personal storage foundation

Implements the plan's hand hauling → storage step on the Godot runtime. Click a nearby workbench to craft a storage box (8 planks + 2 stone), then aim at supported empty ground and use the central context action to place it. Placement is limited to wilderness/player land and rejects occupied cells.

Click the box nearby to deposit/withdraw 1 or 5 items. Each box holds 480 units of cargo weight; withdrawals obey the player's existing 160 hard carrying limit. Equipped tools retain one copy. Transfers take time and cancel on injury, movement, or closing the menu. An empty box can be packed and carried elsewhere. Inventory is held only in world actor authority; streamed scene nodes display it.

Save schema 25 persists each box's ID, position and inventory, and migrates schema 24/23 and older supported saves. Personal storage does not alter town stock, prices, crime or bounty. This is the foundation for later pack beasts and transport routes, not completion of Phase 2.

Validation: Godot headless editor script compilation only. Full gameplay, mobile interaction and migration regression remain for integration; no PR merge or full test run performed.

### Phase 2 continuation — return trips and bulk unloading

Merchant, workbench and container panels now offer navigation back to any player-built storage box. Destinations read the existing actor inventory/location records, including unloaded chunks; packing a box invalidates its waypoint. The HUD shows horizontal and vertical direction and carrying weight, with an arrival hint. Navigation remains a temporary UI selection, not a delivery quest or additional saved world registry.

Personal boxes support 1/5/20-item batches with the same real inventory and timed transfer rules. Markets, hostile warehouses and death bags retain 1/5 batches. Carried boxes only take over the context action when placement is valid and outside workbench/campfire range, preserving crafting and cooking access. Removed the stale internal version suffix from the player HUD.

Editor compilation and diff whitespace check passed. No full gameplay tests or PR merges. Pack beasts and physical route risks remain the next Phase 2 implementation.

## v0.29 — Mossback transport foundation (Phase 2)

A merchant can sell the player one mossback for 240 forge marks, paid into that settlement's authoritative treasury. Wanted players cannot purchase. This first transport tier carries 320 weight, with 1/5/20-item timed loading through the existing cargo authority. It follows physically, slows with cargo, stops at deep drops and can jump small obstacles. It never teleports to catch up; streamed-out animals remain at their recorded location.

Travel distance consumes food/energy. One actual trail ration restores 35 energy and 30 health up to 100/180. Waiting/following can be toggled in the animal's panel. The animal pauses while the player interacts; world threats continue. Nearby hostile actors inflict contact damage through an unobstructed line, with a 1.5-second cooldown; long falls also damage it. This is an initial escort-risk model, not enemy retargeting AI.

On death, the original inventory loses approximately 25% of each ordinary stack exactly once (warehouse keys are preserved); remaining goods stay with the corpse. Deposits, feeding and following are disabled. After recovering all goods, burial removes the descriptor and allows another purchase. No corpse inventory copy or separate cargo registry is created.

Schema 26 stores animal health/energy/following alongside its existing container record and migrates schema 25 and earlier supported saves. Moving updates the same actor cell/chunk record. Return navigation includes the animal and HUD warns about hunger, separation and death. Cargo handling cancels when the animal is injured.

The dialogue body now scrolls on short screens and the close button stays outside the scroll area. Placeholder procedural animal art establishes silhouette only; atlas production is deferred per plan.

Validation: Godot headless editor compilation and git diff --check. No full test suite, runtime playthrough, mobile visual verification or PR merge. Balance, obstacle traversal, combat risk and migration regression still require integration verification. Phase 2 is not declared complete; autonomous trade routes/caravans remain outstanding.

## v0.28 authoritative war raids and annexation

Phase 3 now begins on the same Godot world authorities instead of a parallel war simulator. `FactionAuthority` remains the sole owner of diplomacy and now owns bounded active raid operations derived only from canonical `war` relations. `SettlementAuthority` owns settlement security, real inventory/treasury losses and occupation tax flow. `WorldActorAuthority` projects at most three local attackers for the active macro raid; defeating one local attacker reduces that exact raid rather than winning a disconnected encounter.

Unanswered raids reduce real settlement security, treasury and goods. Repeated pressure moves the defender through weakened/collapsing states and can end in political annexation. Annexation changes `FactionAuthority` control while preserving the settlement's physical ownership, biome, structures and geographic production identity, so conquest changes sovereignty instead of homogenizing regional value. Occupied settlements pay bounded tax from their real treasury into the controller's home settlement.

Markets now expose peace/tension/war/raid/occupied status and settlement security, while route hints identify destination conflict risk. Supplying a settlement during war slightly restores the same security state, making ordinary trade a direct intervention path. Save schema 27 persists settlement security and active raid state while migrating schema 26 and earlier supported saves. `war_annexation_test.gd` verifies local-to-macro casualty linkage, bounded projection, economic damage, save round-trip, annexation identity preservation and occupation tax flow.

### v0.28 balance gate — contested wars do not auto-snowball

Raid strength is now derived from the same faction power facts rather than always spawning a maximum assault. Near-equal powers produce one-unit raids, alternate initiative on successive raid windows, and resolve after two unanswered strikes as a stalemate rather than an annexation. Only a power gap of at least 24 creates a decisive three-unit assault that is eligible to annex a settlement. This keeps deterministic strong-vs-weak collapse while preventing ordinary parity from turning into arbitrary conquest.

War also changes the real market loop. Settlements retain a larger reserve of locally consumed goods as tension escalates (25% peace baseline, 35% tension, 50% war, 75% under active raid), while player deliveries during war restore a small amount of real settlement security. When no raid is active, security recovers gradually and degraded non-annexed factions can recover readiness once the settlement is stable. `war_balance_test.gd` locks these rules into the full headless suite.

### v0.28 world-readable conflict presentation

Each canonical settlement now projects one lightweight live banner from `WorldActorAuthority`. The banner owns no political state: it reads `FactionAuthority.conflict_status()` and the current controller at draw time, so the same physical settlement visibly transitions through peace, tension, war, raid and occupation without rebuilding terrain or duplicating sovereignty. Settlement guards use the same live conflict read for their warning dialogue and a compact alert stripe. This is code-level presentation scaffolding for the later art pass, not a replacement art system.

The visualization gate verifies that one banner per settlement follows war → raid → occupation in place, that guard dialogue reports the same state, and that occupation still leaves the founding physical ownership untouched.

## v0.29 autonomous caravan logistics authority

Regional supply now moves between the three physical settlements without inventing quest cargo. `SettlementAuthority` owns at most two active caravan records. Dispatch subtracts real geography-produced goods from the origin inventory and escrows real destination treasury value; arrival moves that exact cargo into the destination inventory and releases the exact payment to the origin treasury. If the two political controllers enter war before arrival, the caravan turns back and both cargo and escrow are restored instead of being deleted or duplicated.

Caravan candidates are derived from actual producer surplus and destination shortage. Tension reduces shipment size, active war reduces it further, raid targets do not dispatch, and direct enemies cannot trade. Each active record also resolves to a deterministic world cell along the route, providing the physical position authority for later streamed caravan actors. Save schema 28 persists in-transit shipments and migrates schema 27 with an empty caravan set. `caravan_logistics_test.gd` verifies stock/money conservation, save round-trip, deterministic route position and wartime return.

### v0.29 streamed caravan projection

Active macro shipments now have one derived local projection when their route cell enters the streamed area. `WorldActorAuthority` derives the actor ID, cell and cargo label from the `SettlementAuthority` caravan record; the local node never owns goods or payment. Route movement advances by world hour, crosses chunk boundaries through the existing actor streamer, and disappears when the shipment arrives or returns. A compact state signature prevents unchanged caravans from reconciling the actor set every render frame.

### v0.29 resource-grounded autonomous diplomacy

Faction relations now evolve from durable world facts instead of random diplomacy rolls. Every 48 world hours, persistent severe shortages and unserved cross-region dependencies apply bounded pressure to the existing canonical relation score. Successful physical caravan arrivals move that same score in the opposite direction, while non-decisive raid stalemates create war-exhaustion relief. Trade and war use explicit hysteresis thresholds so a single inventory tick cannot flip diplomacy back and forth.

The causal chain is therefore shared end to end: geography creates production differences → settlement inventory develops needs → autonomous caravans serve or fail to serve those needs → relations warm or deteriorate → sustained deterioration can cross the existing war boundary → bounded raids use the same relation authority. No random faction clock, diplomacy wallet or parallel political state was added.

## v0.30 causal travel incidents

Phase 4 starts by making long-distance travel consequences emerge from existing logistics rather than from a random event table. A real in-transit caravan on a tense or insecure route can suffer one bounded midpoint attack. The lost quantity is removed from the same shipment, the matching escrow is refunded, the canonical faction relation worsens, and a route-pair cooldown prevents repeated spam.

The resulting cargo is materialized through the existing lost-cargo actor authority at the caravan's real route cell. It stays recoverable, survives save/load with provenance, and replaying the same simulation event cannot duplicate goods. Save schema 29 persists route-incident cooldowns while schema 28 migrates with no fabricated incidents.

### v0.30 war displacement is a real population flow

Settlements now keep one coarse population fact alongside security, inventory and treasury. Severe raid pressure can push a bounded group of civilians out of an unsafe settlement; those people are removed from the origin immediately, travel as one authoritative displacement record, and are added to the safest eligible destination only on arrival. Consumable target demand scales from the same population fact, so flight reduces demand at the damaged settlement and increases it at the refuge rather than creating a cosmetic refugee event.

Only one tiny local group is projected when the player approaches the route. The visible travelers own no population state. Save schema 30 persists current population, displacement cooldowns and in-transit groups while schema 29 and earlier supported saves derive deterministic baseline populations and create no synthetic refugees.

### v0.30 route disruption is a real logistics constraint

A caravan attack now leaves more than loot. The persisted route-pair incident cooldown is also the temporary road hazard authority: while it is active, new autonomous shipments cannot launch across that pair, and a lightweight debris marker is streamed only when the player approaches the physical midpoint. When the cooldown expires, dispatch eligibility and the local obstruction clear from the same fact.
## v0.31 world-density feedback loops

Phase 4 now turns severe settlement shortages into a derived world opportunity instead of a quest entry. Shortage pressure comes only from effective population-scaled targets and current authoritative inventory. Critical stock loss adds a bounded transport premium, autonomous caravans prioritize the deepest real need, the market stall shows shortage severity, and ordinary player deliveries erase both the shortage and premium by replenishing the same stock. No event currency, delivery ledger or guaranteed reward was added.

### v0.31 autonomous route recovery

A disrupted road can now recover early through real settlement capacity. Every bounded repair pulse can spend one locally produced construction material above reserve plus real treasury funds, then shortens the existing route-incident cooldown. If settlements cannot spare material or money, nothing advances. The cooldown remains the only route-hazard authority, so economic blockage and visible debris clear together.

### v0.31 demographic recovery

Population flow is now reversible after war. A peaceful, secure settlement below its deterministic population baseline can draw a small group back from a safe settlement holding population above its own baseline. Returnees reuse the same persisted displacement record and streamed traveler projection: people leave the host immediately, arrive at home later, and both settlements' real consumption targets follow the population movement. Save schema remains 30 because no second durable state was introduced.

## v0.32 world-era progression authority

World complexity is now an explicit persistent authority rather than an accidental consequence of every subsystem being live on day one. New worlds begin in `Wanderer` and advance through Foothold, Open Roads, Fracture, Warfront and Reforging. The authority owns only the current era, entry hour, an allowlisted milestone set and the last transition; it never owns economy, diplomacy, population, roads or warfare.

Existing systems are gated at their real mutation boundary: local trade opens in Foothold, autonomous caravans in Open Roads, negative diplomatic tension and route incidents in Fracture, war/raids/displacement in Warfront, and annexation only in Reforging. Time, Forge Marks and kill count cannot advance a new world by themselves. Save schema 31 persists progression; schema 30 and older supported saves migrate fully unlocked so pre-era worlds never lose existing macro state.

## v0.33 lived progression and pacing floors

World progression no longer treats background simulation as player knowledge. Political pressure and caravan attacks may exist off-screen, but `tension_seen` is recorded only when the player actually encounters a tense settlement or approaches a real blocked route. A distant incident therefore cannot silently unlock Warfront while the player is somewhere else.

Regional delivery milestones are also grounded in geography. An ordinary local sale does not count as cross-region circulation; the destination must not produce that good locally and the player must already know another settlement that really does produce it. Fracture additionally waits until all three current regional powers have been discovered.

Because one Wildforge world day is only twelve real minutes, era dwell floors are measured in several world days rather than a few simulation ticks: Foothold 24h, Open Roads 120h, Fracture 240h, and Warfront 480h before conflict resolution can unlock Reforging (720h for the peaceful regional-balance route). These are pacing floors, not XP requirements: the real world milestones are still mandatory, so idling, wealth and kill count cannot advance the macro game by themselves.
## v0.34 world-readable progression guidance

Era progression is no longer only an internal gate. `WorldProgressionAuthority.guidance_snapshot()` derives the player's current next concern from the same canonical milestones, diplomacy, settlement contacts and conflict facts that already drive the simulation. The snapshot is never persisted and cannot mutate progression, so it is guidance rather than a quest ledger.

Mobile journey hints now translate that derived state into practical world language: survive first, find another region, prove real logistics, let cross-faction exchange mature, investigate an actually tense settlement or blocked road, or choose how to respond once war is real. Unknown-region hints are rumors and directions rather than exact checklist counters.

Merchant and guard conversations append one current, authority-derived line after contact/observation has been recorded. This keeps advice synchronized with what just happened instead of presenting stale phase text. Era transitions also briefly replace the ordinary journey hint with an ambient world notice; peaceful maturity explicitly remains peaceful rather than being presented as a scripted war unlock.
## v0.35 player agency inside world eras

Fracture is no longer only something the player observes. A physically blocked caravan route can now be repaired directly at the debris site with carried wood, sandstone or basalt. Each contribution removes six world-hours from the same authoritative incident cooldown that blocks autonomous logistics. Enough real material reopens the route immediately and removes the streamed debris; remote repair and cosmetic progress are rejected.

Scarce external deliveries now provide a bounded peaceful intervention path once tension-capable eras begin. If a settlement is genuinely strained or critical for a good it does not produce locally, delivering that real stock can restore a small amount of the same settlement security used by incidents, raids and displacement. Open Roads trade remains ordinary trade, and locally produced goods do not receive the external-relief effect.

The existing progression guidance now derives live interventions from those same facts. Active route damage takes priority as a repair rumor; otherwise the deepest external shortage becomes a supply lead. These are read-only world opportunities rather than quests: no repair meter, aid ledger, reputation currency or guaranteed reward state is persisted.

## v0.36 crime is a real destabilization path

Player crime now changes the same local stability facts used by the rest of the world. Stealing from an opened faction warehouse removes real stock, increases the existing stolen deficit and bounty, and applies bounded damage to that settlement's canonical security. Taking already scarce goods hurts slightly more than ordinary theft. Killing a settlement guard also applies one bounded security loss exactly once.

High-impact crime can act as the `tension_catalyst` for Open Roads only after the regional trade layer exists. The existing 500-bounty pursuit threshold is reused as the trigger; ordinary crime below it does not advance macro progression, and even severe crime cannot bypass era dwell time, fabricate relation loss or declare war directly.

Warehouse UI now exposes current local security and completed theft feedback reports the real security loss. This gives the criminal route visible consequences without adding a crime XP bar, destabilization meter or parallel political state.

## v0.37 NPC identity, death and succession

Settlement NPCs are no longer immortal service fixtures. `NpcRosterAuthority` separates a persistent role slot from the person currently holding it. Names and personality are generated deterministically from world seed, role slot and succession generation, so the same save reproduces the same person while a successor is guaranteed to be a new identity with a different name and speaking temperament.

Merchants and settlement guards are now valid deliberate melee targets. Killing one permanently kills that person's identity, applies the existing crime/bounty and local-security consequences, and leaves the role vacant. The vacancy cannot refill immediately: merchant and guard roles wait different world-time delays, require minimum population/security, and spend real settlement treasury before a successor can take the same job.

Succession reuses the same physical role slot but never revives the deceased person. Save schema 32 persists generation, life state, health, death hour and replacement deadline. Schema 31 remains loadable; legacy dead guards migrate into roster death, while older saves never invent deaths they did not previously record.
