# Dungeon Echo Maintenance Guide

This document describes the production contract for the v1.2 release line.

For product-facing information, start with `README.md`. For current priorities, use `PRODUCTION_ROADMAP.md`. Git history preserves old implementation context; current documentation should describe the product as it exists now.

## Current release contract

- Frozen release candidate: **v1.2.0**.
- Public activation is only proven after deployment/health checks pass; do not infer deployment from a merge or version bump.
- Production journey: **floor 1 → floor 100**.
- Play: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- Project page: `https://91hwl.cn/toys/dungeon-echo/`
- Runtime: static HTML / CSS / JavaScript; no core gameplay backend dependency.
- Saves: browser `localStorage`; no cloud account or cross-device synchronization.
- Primary experiences: desktop browser and dedicated mobile portrait/landscape touch layouts; Gamepad API is also supported.

## Production vs development

### `index.html`

The public route:

- always uses `classic-100`;
- starts new players at floor 1;
- allows returning only to earned checkpoints;
- does not expose player-selectable skips into unconquered content;
- advertises and implements J Attack / K Skill / mana;
- exposes bilingual presentation through `?lang=en`, `?lang=zh` and the in-game language switch.

### `dev.html`

The internal development harness:

- exposes short deterministic profiles for regression/reproduction work;
- is excluded from the public release allowlist;
- must not be treated as a set of public game modes.

If the harness drifts from production behavior, fix the harness or replace it with a smaller purpose-built tool. Do not let it become a second product implementation.

## Core gameplay model

`descend → fight / loot → decide whether to push deeper → return safely → secure and improve the build → descend again`

Changes to combat, equipment, return scrolls, death risk, town economy, forging or checkpoints should be evaluated against this loop rather than in isolation.

## Controls and mana

- Movement/facing: WASD / arrows / map click; mobile D-pad.
- Attack: **J** / mobile Attack.
- Active skill: **K** / mobile Skill.
- Wait/focus: Space or `.` / D-pad center.
- Potion: Q.
- Scroll: E.
- Return: T.
- Descend: Enter.
- Pause: Esc.
- Master mute: M / mobile Sound.
- Fullscreen: F.

J/K + mana are gameplay-critical and load synchronously. Do not move them back into a late presentation bootstrap.

Class mana contracts for v1.2:

- Warrior — max 60 / cost 30.
- Ranger — max 70 / cost 32.
- Arcanist — max 100 / cost 42.
- Assassin — max 65 / cost 34.

Mana changes must commit through the existing run-save path after the final mutation. Do not create a second storage key or a parallel save owner for mana.

## Current systems

### Classes

- Warrior — melee pressure, mitigation and cleave.
- Ranger — ranged positioning, kiting and movement pressure.
- Arcanist — fragile ranged burst, knockback and resource timing.
- Assassin — high-risk burst, repositioning and execution.

### Equipment

Six slots: weapon, armor, helmet, boots, ring and amulet.

The production contract includes class-relative combat fit, class-independent intrinsic value, Epic/Legendary mechanic traits, deterministic +1…+5 forging, +3 refinement choices and +5 masterwork completion.

Tier-specific v13 equipment art is authoritative for item presentation. Do not restore old character-overlay geometry that obscures the hero atlas.

### Progression

- Talents remain part of the long-run route.
- Each class receives two-choice active-skill evolution at floors 20 / 40 / 60 / 80.
- Active skills remain on **K**; milestone progression changes behavior rather than expanding the hotkey bar.

### Guardians

Floors 10 / 20 / … / 90 and the floor-100 finale have explicit readable mechanics. Floor 100 is a three-phase encounter. Preserve telegraphs, movement counterplay and the rule that normal hits do not regain hidden random armor penetration.

### Town

The town owns risky carried assets, safe storage, banked gold, finite supplies, forging/selling, earned checkpoints and the optional fortune wheel. New town work should improve service identity and progression feedback rather than add low-value buttons.

## Localization ownership

`i18n.js` is the language owner. `i18n-runtime.js` and `i18n-content.js` are display followers.

Rules:

1. gameplay/content IDs remain language-independent;
2. saved item/monster/profile identities are never translated in storage;
3. dynamic DOM/canvas output may translate presentation only;
4. language switching must be reversible in the same run;
5. avoid duplicating language dictionaries inside audio, combat or economy owners;
6. English and Chinese accessibility/help text should follow the same language state.

## Audio ownership

`audio-director.js` owns the adaptive BGM and Music/SFX mixer.

- independent persistent Music / SFX sliders: 0–100%;
- recommended mix: 30 / 85;
- M and mobile Sound share the same master mute;
- pointer/touch resume listeners remain available so mobile browsers can recover WebAudio after backgrounding;
- legacy core SFX still connect at play time and are routed through the shared mixer interception.

Do not introduce a second mute state in a mobile-only layer.

## Module boundaries

- `game.js` — core state, map, turn engine and mechanics requiring direct engine access.
- `combat-controls.js` — synchronous J/K input + mana resource contract.
- `combat-pressure.js` — main human-play guardian/deep pressure pass.
- `challenge-pressure.js` — final synchronous mild late-game attack-pressure layer.
- `gameplay-tuning.js` — production-route policy and class tuning.
- `equipment-system.js` — equipment generation, fit/value logic and deep-floor progression.
- `progression-system.js` — talents and milestone skill evolution.
- `town-system.js` — checkpoint progression and town/wheel policy.
- `commerce-system.js` — finite supply stock and chapter-scaled prices.
- `forge-system.js` — +3 refinement and +5 masterwork.
- `content-system.js` — late-floor content and guardian/finale state machines.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `i18n.js` — language owner.
- `i18n-runtime.js` / `i18n-content.js` — localization followers.
- `audio-director.js` — BGM/SFX mixer and audio settings.
- `mobile-ux.js` — mobile layout/haptics/hold-to-walk.
- `runtime-bootstrap.js` — late presentation follower chain only.
- `profiles/classic-100.profile.js` — production content/data.
- short profiles — development/regression fixtures only.

The architecture rule is incremental extraction, not rewrite for rewrite's sake.

## Save compatibility

v1.2.0 intentionally preserves:

- run key `de-run-v6`, save version 2;
- town/meta key `de-greedy-meta-v1`;
- existing item/profile identities.

When changing persistent state:

1. preserve existing keys when practical;
2. add compatible defaults/migration rather than assuming a fresh save;
3. test old-save loading and fresh-save creation;
4. never silently clear progress as a repair strategy;
5. keep temporary UI/presentation state out of persistent gameplay data.

Static JS/CSS/art/localization hotfixes should not alter player `localStorage` unless the change explicitly includes a reviewed migration.

## Validation policy

Use the smallest check set that can falsify the affected change. Simulation is diagnostic, not proof of human game feel.

The repository contains focused contracts covering production entry, deterministic descent, guardian mechanics, skill evolution, save compatibility, release boundaries, equipment art, J/K+mana, mana persistence, localization, audio/mobile behavior and late challenge pressure.

**Do not claim a fresh full-suite GitHub Actions PASS for v1.2.0.** Actions quota was exhausted during this release line. The v1.2 freeze is based on focused diffs and targeted static regression contracts; human play remains the source of truth for combat feel and long-run balance.

Historical v1.1 deployment/public health markers were PASS. v1.2 deployment must establish new PASS markers independently.

## Release and deployment

The production activation path is deliberately Actions-independent:

`prepare artifact → upload → unpack/stage → verify → immutable release → health check → atomic switch → public check`

Production hosts should activate prepared files; they should not be required to build application archives or install development toolchains merely to release a static game.

Expected deployment markers:

- `dungeon_echo_healthcheck=PASS`
- `dungeon_echo_site_deploy=PASS`
- `dungeon_echo_home_health=PASS`
- `dungeon_echo_home_mount=PASS`
- low-bandwidth helper final marker: `dungeon_echo_file_release=PASS`

If a deployment disconnects or fails, identify the last proven PASS marker before rerunning anything. Do not bypass homepage checksum guards or rollback protections just to force a release through.

## Post-v1.2 priorities

The next product work is deliberately outside the game loop:

1. modernize the 91hwl.cn site and project presentation;
2. add first-class Chinese / English site navigation and metadata;
3. improve project/game discovery, screenshots, repository links and mobile presentation;
4. prepare a credible GitHub + X launch package after the website matches the quality of the game;
5. return to game balance/content only when human play evidence identifies a concrete need.

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

Dungeon Echo uses AI-assisted engineering in a human-directed workflow. OpenAI ChatGPT has contributed to repository analysis, debugging, systems reasoning, regression strategy, gameplay/economy analysis, deployment review, documentation, localization and focused implementation work.

The maintainer remains responsible for product direction, acceptance/rejection, merges, deployment and final quality judgment. See `AI_COLLABORATION.md` for the collaboration record.

## Recommended reading order

1. `README.md`
2. `RELEASE_NOTES_v1.2.0.md`
3. `PRODUCTION_ROADMAP.md`
4. current open Issues
5. `DEVELOPMENT.md`
6. relevant production modules
7. `BALANCE_NOTES.md` when balance context is needed
8. `AI_COLLABORATION.md` when collaboration provenance matters

If documentation and code disagree, treat current production behavior plus the latest accepted changes as the source of truth, then fix the documentation.
