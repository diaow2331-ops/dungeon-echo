# Dungeon Echo Maintenance Guide

This document describes the **current `main` production contract** for maintainers and engineering collaborators.

For product-facing information, start with `README.md`. For current priorities, use `PRODUCTION_ROADMAP.md`. Historical implementation transitions remain available through Git history and do not define the current product.

## Current product contract

- Public version: **v1.0.0**, with active post-launch development.
- Production journey: **floor 1 → floor 100**.
- Play: `https://play.91hwl.cn/dungeon-echo/`
- Project page: `https://91hwl.cn/toys/dungeon-echo/`
- Runtime: static HTML / CSS / JavaScript; no Node, PHP, API or database is required by the core game at runtime.
- Saves: browser `localStorage`; no cloud account or cross-device synchronization.
- Primary experience: desktop web, with touch fallback and browser Gamepad API support.

## Production and development entry points

### `index.html`

The public route:

- always uses `classic-100`;
- starts new players at floor 1;
- allows returning to conquered checkpoints only after the corresponding guardian progression has been earned;
- does not expose paid or player-selectable skips into unconquered content.

### `dev.html`

The development route:

- keeps short deterministic profiles such as `classic-10` … `classic-60`;
- exists for regression, reproduction and balance diagnostics;
- must not be treated as a set of public game modes.

## Core gameplay model

Dungeon Echo is built around one repeating decision loop:

`descend → fight / loot → decide whether to push deeper → return safely → secure and improve the build → descend again`

The long-run design depends on the interaction between combat, equipment, return scrolls, death risk, safe storage, town supplies, forging, selling, checkpoints and optional gambling. Changes to one system should be evaluated against the loop rather than in isolation.

## Class identities

- **Warrior** — melee pressure, stable mitigation, cleave, retaliation and sustain.
- **Ranger** — ranged positioning, kiting and movement-dependent pressure.
- **Arcanist** — fragile ranged burst, knockback and cooldown management.
- **Assassin** — high-risk burst, repositioning and execution.

The balance goal is not identical win rates. Each class should have a clear strength, cost and answer to common encounter problems.

## Equipment contract

The production equipment system has six slots:

- weapon;
- armor;
- helmet;
- boots;
- ring;
- amulet.

Current equipment rules include:

- class-relative combat fit;
- class-independent intrinsic value for economic use;
- deep-floor rarity/progression support;
- Epic/Legendary mechanic traits;
- deterministic +1…+5 forging;
- a player-selected refinement direction at +3;
- masterwork completion at +5.

Do not reduce equipment decisions back to “equip the single highest score.”

## Town contract

The current town already owns the main long-run services:

- risky carried bag / safe stash;
- carried gold / safe bank;
- finite chapter-scaled supplies;
- forging and selling;
- conquered checkpoints;
- an optional fortune wheel with one-claim-per-slot settlement policy.

Post-launch town work should improve service identity, progression feedback and preparation clarity rather than simply add more buttons.

## Module boundaries

- `game.js` — core state, map, turn engine and mechanics that genuinely need direct engine access.
- `gameplay-tuning.js` — production route policy and human-first class tuning.
- `equipment-system.js` — equipment generation, fit/value logic and deep-floor progression.
- `progression-system.js` — talents and future milestone skill evolution.
- `town-system.js` — checkpoint progression and town/wheel policy.
- `commerce-system.js` — finite supply stock and chapter-scaled prices.
- `forge-system.js` — +3 refinement choices and +5 masterwork paths.
- `content-system.js` — late-floor themes and guardian content bridge.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `profiles/classic-100.profile.js` — production content/data.
- `profiles/classic-10..60.profile.js` — development/regression fixtures.

The architecture rule is **incremental extraction, not rewrite for rewrite’s sake**. If a mechanic must participate directly in turn, damage or movement state, changing `game.js` can be correct. Do not duplicate core state merely to increase module count.

## Validation

The v1.0.0 release record established these deterministic gates:

- production-entry contract: **24/24**;
- deterministic 1→100 descent/victory chain: **13/13**;
- historical gameplay/save regression suite: **525/525**.

Common checks:

```bash
node --check game.js
node test/production.cjs
node test/descent100.cjs
node test/smoke.cjs
node test/release.cjs
```

`test/sim.cjs` is a diagnostic tool for combat/economy/progression changes, not a ritual required for unrelated edits. Run the smallest validation set that can genuinely detect the regression at risk.

## Current quality priorities

### 1. Bespoke guardians and final boss

Several chapter guardians still rely on combinations of shared traits. Replace them progressively with memorable, readable encounter mechanics, explicit counterplay and stateful phases. The floor-100 finale should become a true multi-stage encounter.

### 2. Town as a progression hub

Give market, blacksmith, storage, expedition gate/cartography, fortune wheel and expedition record clearer identities. Guardian progression should cause visible or functional town changes without forcing slow avatar walking for menu access.

### 3. Milestone skill evolution

Evolve each class’s existing skill around long-run milestones while keeping the current compact control scheme. Behavior changes matter more than additional percentage bonuses.

### 4. Full-run human audit

Continue collecting real 1→100 evidence for retreat timing, resource pressure, economy competition, replacement decisions and difficulty cliffs around major chapters.

### 5. Deeper visual pass

Prioritize character silhouettes, equipment identity, chapter enemies, unique guardian/final-boss art, town progression, telegraphs, particles/audio and clearer desktop HUD hierarchy. Visual work should improve mechanic readability rather than obscure the grid.

## Decisions that should not regress

- Do not restore player-selectable production starting depths.
- Do not use low bot win rates as the sole reason for repeated global enemy nerfs.
- Do not target identical class DPS/survival/clear rates.
- Do not turn long-run progression into a large hotkey bar.
- Do not add runtime backend infrastructure without clear product value.
- Do not rewrite the whole engine simply to modernize its appearance.
- Do not collapse equipment choice into a universal score.
- Do not reintroduce hidden random punishment where readable counterplay is possible.

## AI-assisted engineering

Dungeon Echo uses AI-assisted engineering as part of a human-directed workflow. OpenAI ChatGPT has contributed to repository analysis, debugging, systems reasoning, regression strategy, deployment review and documentation refinement.

The maintainer remains responsible for product direction, accepting or rejecting proposals, merges, deployment and final quality judgment. See `AI_COLLABORATION.md` for the explicit collaboration record.

When an AI or agent works on the repository, it should:

1. inspect the real current code before proposing changes;
2. prefer the smallest implementation that solves the actual problem;
3. run targeted validation rather than unrelated large test suites;
4. make concrete code/document changes when asked to implement;
5. preserve production-entry, save-compatibility and static-deployment contracts;
6. verify uncertain facts instead of overwriting current behavior from assumptions.

## Recommended reading order

1. `README.md`
2. `PRODUCTION_ROADMAP.md`
3. current open Issues
4. `RELEASE_NOTES_v1.0.0.md`
5. `DEVELOPMENT.md`
6. relevant production modules
7. `BALANCE_NOTES.md` when balance context is needed
8. `AI_COLLABORATION.md` when collaboration provenance matters

If documentation and code disagree, treat current `main` behavior plus the latest accepted Issues/commits as the source of truth, then update the documentation to remove the contradiction.
