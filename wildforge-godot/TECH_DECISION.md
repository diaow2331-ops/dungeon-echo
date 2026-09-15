# Wildforge Commercial Client — Godot Technical Decision (PoC)

## Engine pin
Godot 4.7.2 stable, Standard/GDScript, GL Compatibility renderer for the first mobile-focused slice.

## Authority rule
`wildforge/` v0.43.1 remains the reference authority only for systems not yet migrated. Godot is authoritative for migrated subsystems once their explicit migration/parity gates pass. A gameplay subsystem must never be live-authoritative in both clients at once.

## Feel gate
Godot is promoted only if a touch-device build is materially better than the Canvas reference in all five areas:
1. movement and camera response;
2. jump timing/control;
3. mining feedback and target precision;
4. melee hit/knockback response;
5. unobtrusive landscape touch controls.

If the advantage is not obvious, stop further migration and retain the last proven authority boundary. The feel gate has already allowed the narrow traveler/settlement economy slice to migrate. v0.21 established the faction political authority boundary; v0.28 added bounded war raids and annexation, while v0.29–v0.30 moved autonomous caravans, world-driven diplomacy and causal travel consequences onto those same authorities. Larger siege presentation remains deferred until its own causal simulation gate exists.

## Architecture rules
- World data is authoritative; visual/physics nodes are projections of nearby data.
- Never create one Node per permanent world tile in the commercial world. The PoC collision shapes are intentionally temporary; production uses chunks.
- Frontier/faction simulation stays pure data and sparse local actors remain the presentation strategy.
- Player, combat, UI and camera are engine-side systems; macro simulation must not depend on scene-tree population.
- Android is a first-class target, not a WebView wrapper target.

## Server policy
The 2-core / 1.7 GiB cloud VM is build/test infrastructure only. Do not leave the Godot editor or a game process running persistently. Use `--headless` for CI-style checks and software-rendered Xvfb only for short visual smoke tests.

Observed initial PoC headless runtime: ~123 MB peak RSS for 180 iterations, ~23% average CPU on this VM, ~1.6 s wall time.

### Art migration rule

Do not migrate or redraw the full Wildforge art set before the Godot feel gate passes. Placeholder geometry is acceptable through the control/combat/mining validation phase. After approval, migrate art in layers: tiles/biomes -> player/enemy animation -> effects/lighting -> settlements/props -> UI skin. Keep nearest-neighbor filtering and a fixed pixel-density contract; use shaders/lighting as enhancement, not as a substitute for readable sprite art.

## Feel gate v0.03

The slice must prefer readable committed attacks over passive contact damage. Input forgiveness is allowed only as bounded timing windows (jump buffer, attack buffer, mining aim grace); it must not become aim magnetism or hidden auto-play.

## Material loop rule

The Godot slice may keep a tiny player-owned material wallet to prove mine -> pickup -> collect -> place conservation. It must not become a second production inventory/economy authority before the migration gate is passed.

## Chunk authority rule

`SliceWorld.cells` remains the only block-world authority. Render chunks and collision chunks may cache that state, but they must not store independent tile truth. Runtime edits invalidate only the affected chunk and cardinal boundary neighbor.

## Early crafting parity rule

During migration, any recipe copied from the Canvas reference must be guarded by a cross-implementation parity test. The slice may port only the minimum recipes needed to prove a loop; it must not fork a second balance table.

## Survival parity rule

Hunger, nourishment, starvation cadence and survival recipes are migration data, not new balance work. Until the Godot client becomes authoritative, these values must remain parity-guarded against the Canvas reference. Survival consumes the same slice item stock used by harvesting/crafting; no second food inventory is allowed.

## Early enemy-role rule

Different survival rewards must come from meaningfully different combat roles, not recolored or loot-tagged copies of one enemy. Early hunt targets require readable commitment, counterplay, and a reward identity distinct from ambient harassment enemies.

## Exploration authority rule

Exploration sites are deterministic world-generation data plus sparse local actors. Ore remains authoritative block data; relic caches and guards are local projections. Cache rewards must feed the same player stock and must not introduce a parallel loot wallet.

## Return-loop rule

Exploration rewards are not complete content until they convert into a measurable player capability. v0.11 therefore binds ruin copper to the existing campfire/workbench stations and preserves canonical crafting ratios while keeping the Godot feel-scale implementation.

## Capability-gated exploration rule

New regions should open from capabilities already earned through the same world loop, not from arbitrary level numbers. v0.12 uses authoritative sealed world tiles requiring copper-pick power, then converts the existing Ancient Core reward through the canonical Relic Delver Pick recipe.

## Persistence authority

Godot saves data, not the scene tree. World cells, player progression and durable world interactions are serialized; render chunks, effects, camera state, live input buffers and ordinary regenerative enemies are reconstructed. This keeps future art/node refactors independent from save compatibility. Save payloads are explicitly versioned and must pass a full memory + disk round-trip gate before a schema becomes authoritative.

## Transactional save writes

Never overwrite the only good save in place. Write + validate a temporary candidate, rotate the previous primary to one backup, then atomically rename the candidate to primary. Load must reject malformed/out-of-schema data before mutating game authority and may recover from the backup. A gameplay milestone does not force a save-schema bump when the serialized shape is unchanged.

### Deterministic baseline + delta persistence

World generation is deterministic and versioned. Persistent terrain authority records only deviations from that baseline, not the full generated map. This keeps autosave cost proportional to player edits rather than world area and makes larger worlds viable. When the generation contract changes, bump `WORLD_GENERATION_VERSION` and provide an explicit migration path rather than silently reinterpreting old deltas. Schema-13 full-map saves are migrated only across their historical bounds so new frontier generated by later versions is never erased by an old save.

## Sparse local actor projection

A durable world actor and its Godot node are different things. Stable world identity/presence must live in data authority; nodes are short-lived projections created only for active chunks. Chunk activation/deactivation is the single lifecycle hook for these projections. Never infer death, collection, annexation or other durable state from a node disappearing because its chunk unloaded, and never add a second proximity/streaming state machine for NPCs.

## Vegetation authority

Vegetation is deterministic world data plus sparse actor projection, not authored scene decoration. Baseline trees are regenerated from the versioned world contract; saves record only removals and planted additions. Ownership is resolved through the same territorial authority used by terrain so conquest can transfer forest rights without rewriting tree records. Planting, felling and future NPC forestry must mutate this authority rather than infer durable state from loaded tree nodes.

## Structure authority

A durable building is defined by stable structure identity plus a blueprint of expected world cells. The terrain dictionary remains the only physical truth: missing or replaced blueprint tiles are damage, and repair demand is derived from that difference. Do not store a second structure HP value.

Structure ownership must resolve through the existing ownership authority. A structure blueprint never owns a second faction field that can drift during annexation. Construction and repair must use `WorldEditAuthority`; deterministic baseline blueprints need no duplicate save payload because terrain deltas and ownership claims already reconstruct condition and sovereignty.

## Seeded generation authority

World seed and generation version are part of persistence authority. Natural terrain channels must be deterministic for a given `(generation_version, seed)` pair. Gameplay code must not hard-code remote ore/forest coordinates to simulate a world generator; authored ruins and settlements belong to the structure overlay layer. A save delta is invalid without the seed/generation contract that produced its baseline. Legacy pre-seed saves are treated only as the historical default seed and must use explicit migration logic.

## Traveler-role authority

New-game capability must come from owned tools, contracts and permissions, not from hidden innate mining/logging powers. The traveler starts combat-capable but extraction-incompetent: blade only, no pick, no axe. Historical proof tools may remain migration-compatible, but tests that need them must grant them explicitly rather than redefining the formal start state.

## World-time authority

Day/night time belongs to world simulation and persistence, not HUD animation. One full day is 720 real seconds. Survival, future settlement schedules, markets and faction simulation must read the same world clock; save/load restores that clock exactly instead of reconstructing time from presentation state.

## Settlement economy authority

Faction settlements are physical world overlays plus pure data economy, never a parallel decorative town scene. Structure condition derives from real cells, sovereignty derives from ownership claims, and settlement inventory/treasury live in one `SliceSettlementAuthority`.

Trade must conserve both sides of the transaction: player goods/currency and settlement stock/treasury change together or not at all. Prices may derive from authoritative shortages but presentation code never owns price state.

Any deterministic settlement added to the generated baseline requires a world-generation version bump and an explicit migration boundary. Legacy terrain deltas must not silently overwrite cells introduced by a newer settlement baseline.

## Android-first product constraint
- Wildforge is designed first for paid distribution on Google Play. Desktop remains a development and compatibility target; iOS is deferred.
- New UI/input work must be evaluated on Android landscape first: sensor-landscape orientation, safe-area insets, thumb-sized controls, no touch-through, and correct app pause/resume behavior.
- Settlement NPC interaction uses the existing streamed world-actor authority. Dialogue is presentation only and must not become a second NPC/gameplay state authority.
- Mobile layout calculations are centralized in `scripts/ui/mobile_layout.gd`; new screens should reuse that contract instead of hardcoding device-specific insets.
## Physical merchant interaction rule

A market UI is a projection, not an economy. Merchant interaction must begin from a streamed settlement NPC at bounded physical range, while all quotes, stock, treasury and settlement identity come from `SliceSettlementAuthority`. UI buttons may request a transaction but may not mutate player goods, currency, settlement inventory or prices directly. The provisional near-market context-button sale path is retired once v0.19 is active.
## Macro simulation heartbeat rule

World-scale simulation advances from the existing authoritative world clock, not from NPC nodes, chunk activity or a second scheduler. The runtime may keep a transient derived cursor for crossed world-hour boundaries, but durable simulation truth remains in the authorities being mutated (for example settlement inventory/treasury). Save restore must re-derive that cursor from the restored clock and must never replay historical ticks already represented by persisted authority state.

A macro tick must remain valid while the corresponding settlement, caravan or faction has zero projected scene nodes. Projection load/unload therefore cannot start, stop or own economic simulation.
## Faction political authority rule

There are at most three major faction identities in one world. `SliceFactionAuthority` owns only political identity, pairwise diplomacy, lifecycle status and sovereign controller chains. It must not own settlement inventory/treasury, terrain claims, structure condition, NPC presence or duplicate settlement records.

A diplomatic pair is stored once. Reads and writes involving an annexed faction resolve through its current sovereign controller so no shadow relation can exist behind a vassal. Annexation status may change political control without rewriting physical terrain or structure data; settlement control is derived from existing ownership plus the controller chain. Cyclic controller graphs are invalid.

Political facts are persistent and therefore require schema 21. Schema-20 migration must preserve every already-authoritative physical/economic field exactly and add only the deterministic faction baseline. Future war, raid and caravan systems must mutate these same authorities rather than introduce a parallel frontier state object in Godot.
## Three-settlement world baseline rule

Each canonical faction owns one deterministic physical settlement baseline. Settlement buildings remain real world cells and structure blueprints; economy remains in `SliceSettlementAuthority`; political control remains in `SliceFactionAuthority`; physical sovereignty remains in `SliceWorldOwnershipAuthority`. A town scene, shop-local inventory or faction-owned copy of settlement state is forbidden.

A world-generation change that introduces a new settlement footprint must protect the new baseline from legacy terrain deltas without erasing edits to settlements that already existed in the prior generation. For generation 3 -> 4, only Frostmirror and Cinder Ridge footprints are protected; Mossbridge deltas remain authoritative. Ownership migration follows the same rule: restore existing claims first, then add claims only for newly introduced settlements.

Macro biomes are stable strategic geography, not a presentation-only random label. The west/center/east frost-verdant-ember ordering is part of generation version 4 so settlement identity, future logistics distance and faction geography share one deterministic world contract.

## Biome material authority rule

A macro biome must have physical world consequences before economy or art is allowed to depend on it. Generation 5 therefore makes biome substrate authoritative world data: Frostglass uses snow/ice, Verdant Reach keeps grass/dirt/stone, and Ember Wastes uses ash/sandstone/basalt. Ore remains an overlay generated by the same world generator.

Biome material identity belongs to the block/world authority, never to a texture atlas, TileSet, settlement scene or market table. Presentation may change freely later; hardness, drops, placement, lighting and persistence continue to read the registry. Geography-derived economy and logistics may consume these material facts, but must not recreate biome state in a second subsystem.

Changing deterministic substrate requires an explicit generation/schema boundary. Schema-22 deltas migrate over generation 5 without rewriting settlement, faction or clock authority, and legacy validators remain restricted to block ids that existed in their historical generation.

## Geography / settlement economy authority rule

Natural geography is the source of local supply; settlement identity is the source of demand/consumption; faction ownership is political only. These deterministic rules may mutate only `SliceSettlementAuthority` inventory/treasury through the authoritative world heartbeat. Annexation must never rewrite a region into the conqueror's resource profile, and no parallel production ledger, caravan inventory, biome economy cache, or scene-node-owned stock is allowed.

Persistent saves store economic facts only. Biome supply, settlement targets, base prices and consumption profiles remain deterministic code/data baseline and are re-derived after restore. A future caravan must therefore move goods between the same settlement inventories rather than synchronize duplicate inventories.
## First-five-minute survival authority rule

Onboarding must use the same resource, crafting, station, combat and save authorities as the rest of the game. A new traveler may own baseline role equipment, but must not receive injected wood, stone, currency or fabricated tutorial goods. The current baseline is one ordinary travel hatchet, no pick, and zero building resources.

The first mining tool is the wood pick crafted at a real workbench from harvested wood. It grants exactly the minimum 1.0 pick power needed to enter normal terrain mining; stone, campfire construction and later tools then continue through the existing block registry and crafting authority. Tutorial-only resource nodes, tutorial inventories, or a second starter progression state are forbidden.

## Multi-good market presentation rule

The merchant selector lists only SettlementAuthority.accepted_goods. UI quotes are projections, never transaction authority: each sale revalidates physical range, item, quantity, player stock and treasury through sell_from_player. Selected goods are ephemeral presentation state and never enter saves. Regional resource art remains a future renderer over the existing item/world identities.

Retail purchase and route hints follow the same ownership rule: purchase_quote/buy_to_player mutate only existing player stock/currency and settlement inventory/treasury. The spread is calculated from post-withdrawal stock to prevent profitable same-town immediate reversal. Route leads are live reads, not contracts or guaranteed rewards; the UI waypoint stores only a destination id and does not enter persistence. NPC crates and HUD hints are read-only projections. Save schema remains 23.

## v0.27 security and physical loss ownership

SettlementAuthority owns stock, treasury and unfilled stolen supply deficits; FactionAuthority owns player bounty and pursuit dispatch timing. WorldActorAuthority owns guard/patrol health, presence, key collection and recoverable cargo containers. WorldEditAuthority owns physical warehouse-door edits. The lock is derived from the door cells, not another saved boolean. Player stock owns carried keys and goods. UI hauling state is transient; it does not reserve, duplicate or persist goods before the single successful transfer.

New schema 24 explicitly carries the new durable facts while preserving generation 5 and migrating schema 23. No crime record expires on unload, UI close or player death. Patrols are bounded projections over persisted actor/political facts. Ordinary stock variation gets only an 8% premium; loss-induced crises use factual theft deficits and are relieved only by physical replacement goods.

## v0.28 — Phase 2 personal storage foundation

Implements the plan's hand hauling → storage step on the Godot runtime. Click a nearby workbench to craft a storage box (8 planks + 2 stone), then aim at supported empty ground and use the central context action to place it. Placement is limited to wilderness/player land and rejects occupied cells.

Click the box nearby to deposit/withdraw 1 or 5 items. Each box holds 480 units of cargo weight; withdrawals obey the player's existing 160 hard carrying limit. Equipped tools retain one copy. Transfers take time and cancel on injury, movement, or closing the menu. An empty box can be packed and carried elsewhere. Inventory is held only in world actor authority; streamed scene nodes display it.

Save schema 25 persists each box's ID, position and inventory, and migrates schema 24/23 and older supported saves. Personal storage does not alter town stock, prices, crime or bounty. This is the foundation for later pack beasts and transport routes, not completion of Phase 2.

Validation: Godot headless editor script compilation only. Full gameplay, mobile interaction and migration regression remain for integration; no PR merge or full test run performed.

## v0.29 — Mossback transport foundation (Phase 2)

A merchant can sell the player one mossback for 240 forge marks, paid into that settlement's authoritative treasury. Wanted players cannot purchase. This first transport tier carries 320 weight, with 1/5/20-item timed loading through the existing cargo authority. It follows physically, slows with cargo, stops at deep drops and can jump small obstacles. It never teleports to catch up; streamed-out animals remain at their recorded location.

Travel distance consumes food/energy. One actual trail ration restores 35 energy and 30 health up to 100/180. Waiting/following can be toggled in the animal's panel. The animal pauses while the player interacts; world threats continue. Nearby hostile actors inflict contact damage through an unobstructed line, with a 1.5-second cooldown; long falls also damage it. This is an initial escort-risk model, not enemy retargeting AI.

On death, the original inventory loses approximately 25% of each ordinary stack exactly once (warehouse keys are preserved); remaining goods stay with the corpse. Deposits, feeding and following are disabled. After recovering all goods, burial removes the descriptor and allows another purchase. No corpse inventory copy or separate cargo registry is created.

Schema 26 stores animal health/energy/following alongside its existing container record and migrates schema 25 and earlier supported saves. Moving updates the same actor cell/chunk record. Return navigation includes the animal and HUD warns about hunger, separation and death. Cargo handling cancels when the animal is injured.

The dialogue body now scrolls on short screens and the close button stays outside the scroll area. Placeholder procedural animal art establishes silhouette only; atlas production is deferred per plan.

Validation: Godot headless editor compilation and git diff --check. No full test suite, runtime playthrough, mobile visual verification or PR merge. Balance, obstacle traversal, combat risk and migration regression still require integration verification. Phase 2 is not declared complete; autonomous trade routes/caravans remain outstanding.

## v0.28 war/raid authority boundary

War is not a second world-state machine. Canonical war/peace remains a relation in `FactionAuthority`; active raids are bounded operational records owned by that same authority. `SettlementAuthority` owns only consequences that are inherently settlement facts: security, stock loss, treasury loss and post-annexation tax transfer. `WorldActorAuthority` is projection only: at most three raiders are materialized near the target, and each local defeat calls back into the single macro raid record.

Annexation intentionally does not call `OwnershipAuthority.transfer_owner()`. Physical territory, structures, biome supply and founding identity remain stable; political controller resolution changes through `FactionAuthority.controller_id()`. This preserves the plan's rule that conquest changes sovereignty without erasing regional economic identity. Schema 27 adds persistent raid/security state and treats schema 26 as the direct migration source.

### v0.28 contested-war anti-snowball rule

A war relation is not sufficient evidence for annexation. Raid decisiveness is derived from the current authoritative faction power gap: near-equal wars use alternating bounded probes and end in stalemate after two strikes; only a materially stronger side can create a decisive raid. This prevents a tiny deterministic starting-stock difference from becoming an irreversible conquest cascade. War reserve protection is calculated inside `SettlementAuthority.purchase_quote()`, so trade disruption modifies the same inventory facts instead of adding a separate wartime shop.

### v0.28 conflict presentation is projection-only

Settlement banners and guard alert posture are read-only projections. They do not persist status, controller or raid flags and therefore cannot become a second state machine. A banner resolves its current state directly from `FactionAuthority` every time the authoritative political state changes; local actor streaming only decides whether that visualization is instantiated near the player.

## v0.29 caravan logistics authority boundary

Autonomous caravan logistics belongs to `SettlementAuthority` because the durable facts are settlement stock, treasury escrow, route endpoints and in-transit cargo. There is no parallel caravan economy: cargo leaves the same origin inventory at dispatch, destination money leaves the same treasury into the caravan record, and arrival or cancellation resolves those exact facts once. Later local caravan actors must be projections of these records and may not own a second cargo wallet.

The scheduler is deliberately bounded to two active caravans and derives candidates only from geography-produced surplus and real destination shortage. Direct war blocks a route; broader tension/war reduces load size. Save schema 28 persists only the minimal in-transit records required to preserve conservation across process death.

### v0.29 caravan projection rule

A visible trade caravan is a streamed projection, not a second simulation. `WorldActorAuthority` may cache only descriptor position and presentation metadata derived from the macro caravan ID. Cargo, payment, departure/arrival time and route outcome remain owned by `SettlementAuthority`. The projection signature changes only when the bounded caravan set or its authoritative world-hour route cell changes, avoiding whole-actor reconciliation each frame.

### v0.29 diplomacy evolves from world facts

Autonomous diplomacy may mutate only the canonical `FactionAuthority.relations` rows. Inputs are authoritative facts already owned elsewhere: successful caravan arrivals, settlement targets/current inventory/local production, and raid outcomes. The 48-hour cadence and capped shortage pressure prevent rapid oscillation; score hysteresis enters trade at +30, enters war at -60, leaves war only after recovery to -20, and leaves trade below +10. A diplomacy transition out of war removes obsolete raid records immediately.

This is intentionally not a random diplomacy simulator. If the economy and logistics stabilize, relations stop degrading; if physical exchange succeeds repeatedly, relations improve; if a balanced war grinds into stalemate, exhaustion can cool it. The political layer therefore remains downstream of the same world state the player will eventually be free to influence.

## v0.30 travel-event authority boundary

Travel events do not own a second inventory, quest ledger or reward table. `SettlementAuthority` remains the logistics owner and may emit a causal `caravan_attacked` fact while mutating the real shipment and escrow. `FactionAuthority` receives only the diplomatic consequence. `SliceWorld` forwards simulation facts synchronously, and `WorldActorAuthority` materializes recoverable cargo as a projection/consequence without becoming the source of logistics truth.

Route-pair incident cooldowns are persisted with caravan authority because they constrain future logistics simulation. The spilled cargo itself is persisted by the pre-existing lost-cargo authority. This split keeps one owner for each fact and allows the Phase 4 event layer to increase travel density without inventing a parallel mission system.

### v0.30 population/displacement authority boundary

Population is intentionally coarse at v0.30: one integer per settlement, owned by `SettlementAuthority`, not individual persistent citizens. War pressure may transfer a small bounded group between those integers through one persisted in-transit displacement record. Demand reads that population directly; local traveler nodes are streaming projections only.

This avoids premature citizen simulation while establishing the causal contract needed by Phase 4: warfare can now move people, movement changes real regional demand, and those consequences survive save/load without a refugee quest ledger or second economy.

### v0.30 route hazards are derived, not a second event state

Temporary route blockage is derived directly from the caravan-incident cooldown already owned by `SettlementAuthority`. No separate road-event registry exists. Dispatch checks that cooldown, and `WorldActorAuthority` only projects debris for active entries. Expiry prunes the same cooldown and therefore clears both the economic effect and the visible world consequence together.

## v0.31 shortage opportunities are derived facts

Shortage events may not own state. `SettlementAuthority` derives pressure and severity from population-scaled demand targets and the same inventory used by markets and caravans. Severe shortage may temporarily raise the existing buy price and candidate priority, but delivery through either autonomous logistics or ordinary player trade must collapse that premium automatically as stock recovers. Presentation may show the derived severity; it may not cache a separate shortage flag.

### v0.31 route repair mutates the existing hazard authority

Road recovery is allowed to consume real settlement stock and treasury, but it may not create road-health points or a repair quest ledger. A repair pulse only shortens the existing persisted caravan-incident cooldown. Local production reserve rules prevent maintenance from consuming essential stock, and failure to fund repair leaves both inventory and the route cooldown unchanged.

### v0.31 return migration reuses displacement authority

Demographic recovery uses the same bounded `SettlementAuthority.displacements` records as wartime flight. A secure peaceful home below baseline may pull population from a safe settlement above baseline; source population is deducted at departure and home population changes only at arrival. The local traveler remains projection-only. Because the existing schema-30 population, displacement serial and in-transit records are sufficient, v0.31 adds no save schema and no parallel refugee ledger.

## v0.32 world progression is a capability gate, not a second simulation

`WorldProgressionAuthority` may answer whether a class of world consequence is currently legal, but it may not store a shadow war, economy, route, population or quest state. The canonical subsystem still owns every fact. Gates therefore sit immediately before the existing mutation: caravan dispatch, negative diplomacy, route incidents, war/raid scheduling, displacement and annexation.

Era transitions are monotonic and evaluated only at the end of a world-hour simulation tick. At most one transition may occur per tick and its new permissions take effect on the next tick. This prevents causal avalanches such as shortage → tension → war → raid → displacement → annexation in one update. Schema 31 stores only the minimal progression facts; schema-30 migration enters Reforging to preserve worlds that already ran unrestricted systems.
## v0.33 observation is distinct from simulation truth

A world fact is not automatically a player-observed fact. `WorldProgressionAuthority` may infer pressure milestones from canonical economy/diplomacy state, but `tension_seen` is granted only through a player-facing encounter that revalidates the underlying fact: interacting with a genuinely tense settlement or physically approaching an active route hazard. Presentation code cannot fabricate tension because the progression authority rechecks `FactionAuthority` or `SettlementAuthority` before recording observation.

Cross-region delivery is likewise derived rather than trusted from a generic sale callback. The destination must lack local production of the delivered item and at least one already-contacted settlement must canonically produce it. No item-provenance ledger is introduced.

Era dwell constants are explicit production pacing floors. They compensate for the accelerated 720-second world day and prevent knowledgeable players from reaching formal war or annexation in the opening hour. They do not replace milestone requirements and therefore are not a hidden level/XP system.
## v0.34 guidance is a derived projection, not quest state

Progression guidance must never become another authority. `guidance_snapshot()` is a pure read of existing era milestones plus canonical faction/settlement facts; it is not saved, has no counters of its own, and calling it cannot satisfy a milestone. Presentation may turn that snapshot into dialogue or a travel hint, but only the existing authorities may change the world.

Era transition feedback follows the same rule. `world_era_changed` may trigger a short-lived UI notice, but the notice owns no durable unlock flag and disappears automatically. It describes lived consequences such as markets opening, trade routes linking regions or sovereignty becoming mutable rather than exposing internal era numbers or an XP bar.
## v0.35 player intervention mutates canonical facts only

Player roadwork may consume carried construction material, but it cannot create a separate road-health or repair-contract state. The only durable route fact remains `SettlementAuthority.caravan_incident_cooldowns`; player action shortens that exact cooldown, so dispatch legality, remaining duration and debris projection still share one authority.

Player crisis aid follows the same rule. A qualifying external-shortage delivery adds stock through the existing market transaction and may recover a bounded amount of canonical settlement security. The effect is unavailable before Fracture and does not apply to locally produced goods. No aid score, faction reputation meter or delivery ledger is introduced.

Intervention hints are derived projection. `WorldProgressionAuthority` may expose the most urgent active route blockage or external shortage through `guidance_snapshot()`, but reading the hint cannot mutate world state. The player must still travel, carry real resources and complete the underlying action for anything to change.
