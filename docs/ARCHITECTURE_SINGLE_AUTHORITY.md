# Dungeon Echo single-authority architecture

## Non-negotiable rule

**One responsibility has exactly one production authority.**

A feature may be split into data, rendering helpers, tests and archived prototypes, but only one active owner may mutate the authoritative state or surface for that responsibility. No overlay, monkey-patch, migration shim, event interceptor or wrapper may become a second owner.

## Production authority map

| Responsibility | Sole production authority | Followers may do | Followers must not do |
| --- | --- | --- | --- |
| Gameplay state / turn flow | `game/core/game.js` | read exported test/debug state | assign state, wrap turn/combat functions |
| Content classification | `game/domain/content/content-rules-v130.js` | supply deterministic eligibility decisions to core | spawn entities, consume RNG, mutate map/player/combat state |
| Equipment stat scoring | `game/domain/inventory/equipment-rules-v130.js` | return the canonical deterministic equipment stat score to core | mutate bag/equipment/player state, consume RNG, generate loot, alter class-fit/rarity/depth rules, or price economy transactions |
| Equipment transaction pricing | `game/domain/economy/economy-rules-v130.js` | quote canonical forge/sell prices from supplied item value + forge level | value items, mutate gold/stock/items, commit transactions, or own town/heal/quick-dive/wheel pricing |
| Level-up arithmetic | `game/domain/progression/progression-rules-v130.js` | calculate XP threshold, level deltas and talent-due classification | mutate XP/player state, open talent UI, enforce caps/clamps or activate skill-evolution milestones |
| Dungeon + town Canvas rendering | `game/core/game.js` | supply static art/data | obtain production Canvas contexts, mask/redraw entities |
| Keyboard + touch gameplay commands | `game/core/game.js` | transport standard commands | register competing gameplay key/click handlers |
| Gamepad input | `game/input/desktop-controls.js` | translate pad input to canonical commands | call gameplay systems or mutate state/storage |
| Gameplay persistence | `game/core/game.js` | read for diagnostics only | write run/meta/gameplay storage |
| Storage epoch reset | `game/core/production-bootstrap.js` | clear obsolete `de-*` data before boot | mutate live run state after core starts |
| Runtime follower loading | `game/core/runtime-bootstrap.js` | load approved DOM-only followers | load gameplay wrappers or Canvas overlays |
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

## Current staged domain shelves

The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include town and combat rules. Content classification, equipment stat scoring, equipment transaction pricing and level-up arithmetic have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.

Cross-responsibility boundaries are strict:

- inventory/equipment currently owns only canonical equipment stat scoring; affinity, rarity, depth-bonus and class-fit helpers remain dormant until separately transferred;
- economy currently owns only canonical forge/sell pricing; town/heal/quick-dive/wheel helpers remain dormant until separately transferred;
- progression currently owns only XP thresholds, level deltas and talent-due classification; caps/clamps/next-talent/skill-evolution helpers remain dormant until separately transferred;
- content classifies floor eligibility without spawning or consuming RNG;
- town owns checkpoint/readiness policy only;
- combat performs deterministic math from supplied values only.

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