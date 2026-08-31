# Dungeon Echo single-authority architecture

## Non-negotiable rule

**One responsibility has exactly one production authority.**

A feature may be split into data, rendering helpers, tests and archived prototypes, but only one active owner may mutate the authoritative state or surface for that responsibility. No overlay, monkey-patch, migration shim, event interceptor or wrapper may become a second owner.

## Production authority map

| Responsibility | Sole production authority | Followers may do | Followers must not do |
| --- | --- | --- | --- |
| Gameplay state / turn flow | `game/core/game.js` | read exported test/debug state | assign state, wrap turn/combat functions |
| Content classification | `game/domain/content/content-rules-v130.js` | supply deterministic eligibility decisions to core | spawn entities, consume RNG, mutate map/player/combat state |
| Equipment decision scoring | `game/domain/inventory/equipment-rules-v130.js` | return canonical base-stat and class-fit scores to core for item comparison | mutate bag/equipment/player state, consume RNG, generate loot, alter affinity/rarity/depth rules, auto-equip items, or price economy transactions |
| Economy pricing policy | `game/domain/economy/economy-rules-v130.js` | quote forge/sell, town supply, tavern, quick-dive and wheel costs/stock from caller-supplied values | value items, mutate gold/stock/items, commit transactions, consume RNG, render UI or write storage |
| Town checkpoint + readiness policy | `game/domain/town/town-rules-v130.js` | classify unlocked checkpoints and expedition supply needs from caller-supplied progress/supplies | mutate town/meta state, buy supplies, select UI pages, render Canvas/DOM or write storage |
| Level-up arithmetic | `game/domain/progression/progression-rules-v130.js` | calculate XP threshold, level deltas and talent-due classification | mutate XP/player state, open talent UI, enforce caps/clamps or activate skill-evolution milestones |
| Critical-damage multiplier | `game/domain/combat/combat-rules-v130.js` | calculate the canonical critical damage multiplier from caller-supplied crit power | roll critical hits, mutate actors, sequence attacks, or own other combat/defense/healing arithmetic |
| Dungeon + town Canvas rendering | `game/core/game.js` | supply static art/data | obtain production Canvas contexts, mask/redraw entities |
| Keyboard + touch gameplay commands | `game/core/game.js` | transport standard commands | register competing gameplay key/click handlers |
| Gamepad input | `game/input/desktop-controls.js` | translate pad input to canonical commands | call gameplay systems or mutate state/storage |
| Gameplay persistence | `game/core/game.js` | read for diagnostics only | write run/meta/gameplay storage |
| Audio preferences + SFX graph | `game/core/game.js` | read the frozen Music/SFX/mute preference snapshot; synthesize through core-owned SFX bus | write a second audio preference key, intercept `AudioNode.connect`, or own gameplay audio commands |
| Adaptive music graph | `game/ui/adaptive-bgm-v132.js` | follow core `de-audio-settings` events and read state for scene selection | write storage, own M/mute state, intercept SFX, or mutate gameplay |
| Storage epoch reset | `game/core/production-bootstrap.js` | clear obsolete gameplay `de-*` data before boot while preserving audio/onboarding preferences | mutate live run state after core starts or erase durable preferences |
| Runtime follower loading | `game/core/runtime-bootstrap.js` | load approved presentation-only followers | load gameplay wrappers or Canvas overlays |
| Fixed-route language navigation | `game/locale/fixed-locale-entry-v130.js` | navigate between authored routes | translate/rewrite Canvas or gameplay state |
| Responsive layout | `game/ui/responsive-final-v154.js` | inject CSS only | capture gameplay input or Canvas |
| Help copy | `game/ui/help-copy-v126.js` | update bounded help DOM | alter gameplay contracts |

The machine-readable mirror is `docs/authority-map-v130.json`. If prose and the machine map disagree, production changes must stop until they are reconciled.

## Active, staged, quarantine and source assets

The repository has four states for implementation work:

1. **Active production** — files explicitly admitted by `ops/release/static-files.txt`.
2. **Staged pure domain libraries** — re-housed deterministic rules under `game/domain/*` with `authority: 'none'`. They are not shipped and cannot mutate runtime state.
3. **Quarantine** — previously implemented features preserved under `archive/quarantine-v130/`. Quarantine code is reference material only and is never shipped or executed.
4. **Source/provenance** — art sources, historical release stamps and Git history.

Quarantine is not a trash can. It is the staging area for previously completed work while ownership is repaired. A staged library is also not an authority: creating the future module directory never grants it production ownership.

## Current pure domain authorities

The v1.7.0 release has no staged pure library waiting to be shipped. Town checkpoint/readiness
policy remains loaded before core, and the new expedition variation policy is likewise a pure
production authority. Core remains the sole owner of stateful town/dungeon orchestration, RNG,
combat execution, rewards and persistence.

Cross-responsibility boundaries are strict:

- inventory/equipment owns canonical base-stat scoring plus class-fit scoring for player-facing comparison; class fit is read-only decision information and never enters pricing/loot/auto-equip logic;
- economy owns deterministic forge/sell, town supply, tavern, quick-dive and wheel pricing/stock policy; it never mutates gold, stock or items and does not own dungeon-heal behavior;
- progression owns XP thresholds, level deltas and talent-due classification; caps/clamps/next-talent/skill-evolution helpers remain dormant;
- content classifies floor eligibility without spawning or consuming RNG;
- town domain owns checkpoint unlocks and expedition-readiness thresholds; core owns town movement, purchases, selection state, persistence and presentation;
- expedition domain owns deterministic contract availability/modifiers, dungeon-event specifications and elite-affix eligibility; core consumes RNG, spawns actors, mutates combat/reward state and persists the selected contract;
- inventory set policy owns fixed named-set definitions, six-piece identities, lore, signatures and 2/4/6 threshold bonuses; core owns deterministic item-generation attachment, relic-ledger mutation on safe return, live stat consumption and town presentation;
- town growth policy owns fixed project definitions, tier/relic/Gold requirements, bounded project-effect values, deterministic safe-return town-event selection and state-aware NPC copy; economy consumes smithy/market modifiers as explicit inputs while core remains the sole owner of Gold/supply mutation, event/project/chronicle persistence, market invalidation, UI and Canvas state;
- combat owns the canonical critical-damage multiplier; live monster threat scaling, engagement strikes, defense, damage application and turn consequences remain core-owned.

## Restoring a quarantined feature

A quarantined feature may return only through this sequence:

1. Name the responsibility it belongs to.
2. Identify the sole active owner from the authority map.
3. Extract the useful behavior/data/art from quarantine.
4. First prefer a staged pure library when the useful part can be expressed without runtime authority.
5. When runtime ownership must move, integrate through an **atomic authority transfer**: new owner takes the complete responsibility and old owner relinquishes the same responsibility in the same change.
6. Do **not** restore the old wrapper/overlay file to the production dependency graph.
7. Add or update an authority contract proving there is still only one writer/renderer/input owner.
8. Add a new runtime file to the release allowlist only after the transfer is complete.

Never operate old and new runtime owners side by side as a migration strategy.

## Local governance check

Routine governance must not depend on hosted CI. Run:

```bash
bash ops/check-authority-local.sh
```

The local checker verifies the single-authority topology, production entry boundary and every currently staged pure domain rule contract. GitHub Actions is manual-only (`workflow_dispatch`) and is reserved for an explicitly requested release/governance run; ordinary repository cleanup must not consume Actions quota.

A local check failure blocks the change. Do not patch around the contract or relax a check merely to merge a module.

## Forbidden production patterns

- Assigning to or replacing methods on `window.DE_TEST` / gameplay API objects from follower files.
- A second module calling `getContext()` on `#game`, `#town-scene`, `#wheel-canvas` or replacing Canvas methods.
- Multiple modules writing the same gameplay `localStorage` namespace.
- Presentation code masking the core renderer to replace entities.
- A release builder rewriting dependency graphs with `sed` or ad-hoc substitutions.
- Loading anything from `archive/` in production.
- Loading a staged `game/domain/*` library in production before the corresponding atomic authority transfer.
- Recreating an old wrapper only to bridge two competing owners.

## Why this exists

The v1.2 line accumulated independently useful additions—combat controls, town economy, progression, presentation polish, art overlays, localization fixes and save shims—but several were attached by wrapping the same runtime surfaces. The result was multiple effective authorities and regressions such as stale masks, conflicting input, duplicate persistence and state drift.

v1.3.0 treats repository cleanup as a re-housing operation: preserve useful work, remove it from production, establish sole owners, classify reusable rules into bounded modules, then re-integrate features one responsibility at a time.
