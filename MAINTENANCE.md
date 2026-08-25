# Dungeon Echo Maintenance Guide

This document describes the current `main` production contract.

For product-facing information, start with `README.md`. For current priorities, use `PRODUCTION_ROADMAP.md`. Git history preserves prior development context; current documentation should describe the product as it exists now.

## Current product contract

- Public version: **v1.1.0**.
- Production journey: **floor 1 → floor 100**.
- Play: `https://play.91hwl.cn/dungeon-echo/`
- Project page: `https://91hwl.cn/toys/dungeon-echo/`
- Runtime: static HTML / CSS / JavaScript; no runtime backend is required by the core game.
- Saves: browser `localStorage`; no cloud account or cross-device synchronization.
- Primary experience: desktop web, with touch fallback and Gamepad API support.

## Production vs development

### `index.html`

The public route:

- always uses `classic-100`;
- starts new players at floor 1;
- allows returning only to earned checkpoints;
- does not expose player-selectable skips into unconquered content.

### `dev.html`

The internal development harness:

- exposes short deterministic profiles for regression/reproduction work;
- is excluded from the public release allowlist;
- must not be treated as a set of public game modes.

If this harness drifts from production UI/behavior, fix the harness or replace it with a smaller purpose-built tool; do not let it become a second product implementation.

## Core gameplay model

`descend → fight / loot → decide whether to push deeper → return safely → secure and improve the build → descend again`

Changes to combat, equipment, return scrolls, death risk, town economy, forging or checkpoints should be evaluated against this loop rather than in isolation.

## Current systems

### Classes

- Warrior — melee pressure, mitigation, cleave, retaliation and sustain.
- Ranger — ranged positioning, kiting and movement-dependent pressure.
- Arcanist — fragile ranged burst, knockback and cooldown management.
- Assassin — high-risk burst, repositioning and execution.

### Equipment

Six slots: weapon, armor, helmet, boots, ring and amulet.

The production contract includes class-relative combat fit, class-independent intrinsic value, Epic/Legendary mechanic traits, deterministic +1…+5 forging, +3 refinement choices and +5 masterwork completion.

### Progression

- Talents remain part of the long-run route.
- Each class receives two-choice active-skill evolution at floors 20 / 40 / 60 / 80.
- The active skill remains on `C`; milestone progression should change behavior rather than expand the hotkey bar.

### Guardians

Floors 10 / 20 / … / 90 and the floor-100 finale now have explicit readable mechanics. Floor 100 is a three-phase encounter. New encounter work should preserve telegraphs and avoid hidden normal-hit + special double spikes.

### Town

The town owns risky carried assets, safe storage, banked gold, finite supplies, forging/selling, earned checkpoints and the optional fortune wheel. Post-v1.1 town work should improve service identity and progression feedback rather than add low-value buttons.

## Module boundaries

- `game.js` — core state, map, turn engine and mechanics requiring direct engine access.
- `gameplay-tuning.js` — production-route policy and class tuning.
- `equipment-system.js` — equipment generation, fit/value logic and deep-floor progression.
- `progression-system.js` — talents and milestone skill evolution.
- `town-system.js` — checkpoint progression and town/wheel policy.
- `commerce-system.js` — finite supply stock and chapter-scaled prices.
- `forge-system.js` — +3 refinement and +5 masterwork.
- `content-system.js` — late-floor content and guardian/finale state machines.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `profiles/classic-100.profile.js` — production content/data.
- short profiles — development/regression fixtures only.

The architecture rule is incremental extraction, not rewrite for rewrite's sake.

## Save compatibility

Current persistent keys/schemas remain intentionally stable. When changing persistent state:

1. preserve existing keys when practical;
2. add compatible defaults/migration rather than assuming a fresh save;
3. test old-save loading and fresh-save creation;
4. never silently clear progress as a repair strategy;
5. keep temporary combat/UI state out of persistent data.

Static JS/CSS/art hotfixes should not alter player `localStorage` unless the change explicitly includes a reviewed save migration.

## Validation

Current recorded contracts:

- production entry: **29/29**;
- deterministic 1→100 chain: **13/13**;
- broad gameplay/save suite: **525/525**;
- release contract: **11/11**;
- guardian state-machine contract: **37/37**;
- skill-evolution contract: **9/9**;
- v1.1 deployment/public health checks: **PASS**.

Common focused checks:

```bash
node --check game.js
node --check content-system.js
node --check progression-system.js
node test/production.cjs
node test/descent100.cjs
node test/guardian-content.cjs
node test/skill-evolution.cjs
node test/smoke.cjs
node test/release.cjs
```

Use the smallest test set that can falsify the affected change. `test/sim.cjs` is a diagnostic tool, not a ritual for unrelated documentation/art changes.

## Current quality priorities

1. **Human 1→100 audit** — class-specific difficulty, retreat timing, resource pressure and economy competition.
2. **Town identity** — make market, forge, storage, expedition gate/cartography and records feel like distinct services.
3. **Combat feedback** — guardian phase VFX/audio, skill-evolution feedback and Epic/Legendary mechanic triggers.
4. **Equipment presentation** — continue improving coherent item/hero visuals without changing item identity or save data unnecessarily.
5. **Repository hygiene** — keep current docs aligned, prune merged branches, avoid duplicate release paths and prevent stale development-only copy from masquerading as current product state.

## Decisions that should not regress

- Do not restore player-selectable production starting depths.
- Do not tune solely around bot win rates.
- Do not target identical class performance.
- Do not turn progression into a large hotkey bar.
- Do not add runtime backend infrastructure without product value.
- Do not rewrite the whole engine merely to modernize its appearance.
- Do not collapse equipment choice into a universal score.
- Do not reintroduce hidden random punishment where readable counterplay is possible.
- Do not break compatible local saves for presentation-only work.

## AI-assisted engineering

Dungeon Echo uses AI-assisted engineering in a human-directed workflow. OpenAI ChatGPT has contributed to repository analysis, debugging, systems reasoning, regression strategy, gameplay/economy analysis, deployment review, documentation and focused implementation work.

The maintainer remains responsible for product direction, acceptance/rejection, merges, deployment and final quality judgment. See `AI_COLLABORATION.md` for the collaboration record.

## Recommended reading order

1. `README.md`
2. `PRODUCTION_ROADMAP.md`
3. current open Issues
4. `RELEASE_NOTES_v1.1.0.md`
5. `DEVELOPMENT.md`
6. relevant production modules
7. `BALANCE_NOTES.md` when balance context is needed
8. `AI_COLLABORATION.md` when collaboration provenance matters

If documentation and code disagree, treat current `main` behavior plus the latest accepted changes as the source of truth, then fix the documentation.
