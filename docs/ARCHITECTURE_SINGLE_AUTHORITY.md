# Dungeon Echo single-authority architecture

## Non-negotiable rule

**One responsibility has exactly one production authority.**

A feature may be split into data, rendering helpers, tests and archived prototypes, but only one active owner may mutate the authoritative state or surface for that responsibility. No overlay, monkey-patch, migration shim, event interceptor or wrapper may become a second owner.

## Production authority map

| Responsibility | Sole production authority | Followers may do | Followers must not do |
| --- | --- | --- | --- |
| Gameplay state / turn flow | `game/core/game.js` | read exported test/debug state | assign state, wrap turn/combat functions |
| Dungeon + town Canvas rendering | `game/core/game.js` | supply static art/data | obtain production Canvas contexts, mask/redraw entities |
| Keyboard + touch gameplay commands | `game/core/game.js` | transport standard commands | register competing gameplay key/click handlers |
| Gamepad input | `game/input/desktop-controls.js` | translate pad input to canonical commands | call gameplay systems or mutate state/storage |
| Gameplay persistence | `game/core/game.js` | read for diagnostics only | write run/meta/gameplay storage |
| Storage epoch reset | `game/core/production-bootstrap.js` | clear obsolete `de-*` data before boot | mutate live run state after core starts |
| Runtime follower loading | `game/core/runtime-bootstrap.js` | load approved DOM-only followers | load gameplay wrappers or Canvas overlays |
| Fixed-route language navigation | `game/locale/fixed-locale-entry-v130.js` | navigate between authored routes | translate/rewrite Canvas or gameplay state |
| Responsive layout | `game/ui/responsive-final-v154.js` | inject CSS only | capture gameplay input or Canvas |
| Help copy | `game/ui/help-copy-v126.js` | update bounded help DOM | alter gameplay contracts |

## Active, quarantine and source assets

The repository has three states for implementation work:

1. **Active production** — files explicitly admitted by `ops/release/static-files.txt`.
2. **Quarantine** — previously implemented features preserved under `archive/quarantine-v130/`. Quarantine code is reference material only and is never shipped or executed.
3. **Source/provenance** — art sources, historical release stamps and Git history.

Quarantine is not a trash can. It is the staging area for previously completed work while ownership is repaired.

## Restoring a quarantined feature

A quarantined feature may return only through this sequence:

1. Name the responsibility it belongs to.
2. Identify the sole active owner from the authority map.
3. Extract the useful behavior/data/art from quarantine.
4. Integrate that behavior into the owner or through a narrow read-only/data interface owned by it.
5. Do **not** restore the old wrapper/overlay file to the production dependency graph.
6. Add or update an authority contract proving there is still only one writer/renderer/input owner.
7. Add the file to the release allowlist only after the authority contract passes.

## Forbidden production patterns

- Assigning to or replacing methods on `window.DE_TEST` / gameplay API objects from follower files.
- A second module calling `getContext()` on `#game`, `#town-scene`, `#wheel-canvas` or replacing Canvas methods.
- Multiple modules writing the same gameplay `localStorage` namespace.
- Presentation code masking the core renderer to replace entities.
- A release builder rewriting dependency graphs with `sed` or ad-hoc substitutions.
- Loading anything from `archive/` in production.

## Why this exists

The v1.2 line accumulated independently useful additions—combat controls, town economy, progression, presentation polish, art overlays, localization fixes and save shims—but several were attached by wrapping the same runtime surfaces. The result was multiple effective authorities and regressions such as stale masks, conflicting input, duplicate persistence and state drift.

v1.3.0 treats repository cleanup as a re-housing operation: preserve useful work, remove it from production, establish sole owners, then re-integrate features one responsibility at a time.