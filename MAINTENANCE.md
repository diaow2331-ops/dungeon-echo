# Dungeon Echo Maintenance Guide

This document describes the current production and repository contract for **v1.2.2**.

For product-facing information, start with `README.md`. For current priorities, use `PRODUCTION_ROADMAP.md`. Historical release notes preserve old implementation context; current documents must describe the product as it exists now.

## Current release contract

- Repository release line: **v1.2.2**.
- `VERSION` is the repository version authority; deployment is only proven after the normal activation and health checks pass.
- Production journey: **floor 1 → floor 100**.
- Play: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- Project page: `https://91hwl.cn/toys/dungeon-echo/`
- Runtime: static HTML / CSS / JavaScript; no core gameplay backend dependency.
- Saves: browser `localStorage`; no account, cloud save or cross-device synchronization.
- Primary experiences: desktop browser plus dedicated portrait/landscape touch layouts; Gamepad API is also supported.

## Production vs development

### `index.html`

The public route:

- always uses `classic-100`;
- starts new players at floor 1;
- allows return only to earned checkpoints;
- never exposes player-selectable skips into unconquered content;
- advertises and implements **J Attack / K Skill / Mana**;
- uses one locale per page load through `locale-runtime-v122.js` and `?lang=en` / `?lang=zh`.

Changing language is a title-screen choice that reloads into the selected locale. Do not reintroduce whole-run live translation observers or polling.

### `dev.html`

The internal development harness:

- exposes short deterministic profiles for regression/reproduction work;
- shares the current gameplay/UI runtime contract with production;
- is excluded from the public release allowlist;
- must never become a second stale product implementation.

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

J/K + Mana are gameplay-critical and load synchronously. Mana mutations must commit through the existing run-save path after the final mutation.

Current class Mana contracts:

- Warrior — max 60 / cost 30.
- Ranger — max 70 / cost 32.
- Arcanist — max 100 / cost 42.
- Assassin — max 65 / cost 34.

## Current systems

### Classes and progression

- Warrior — melee pressure, mitigation and cleave.
- Ranger — ranged positioning, kiting and movement pressure.
- Arcanist — fragile ranged burst, knockback and resource timing.
- Assassin — high-risk burst, repositioning and execution.
- Each class receives two-choice active-skill evolution at floors 20 / 40 / 60 / 80.

### Equipment

Six slots: weapon, armor, helmet, boots, ring and amulet.

The production contract includes class-relative combat fit, class-independent intrinsic value, Epic/Legendary mechanic traits, deterministic +1…+5 forging, +3 refinement choices and +5 masterwork completion.

Tier-specific v13 equipment art is authoritative for item presentation. v1.2.2 deliberately suppresses obsolete equipment-derived hero geometry/overlays so the hero atlas remains the sole character-art owner. Do not restore those retired character overlay paths.

### Guardians and finale

Floors 10 / 20 / … / 90 and the floor-100 finale have explicit readable mechanics. Floor 100 is a three-phase encounter. Preserve telegraphs, movement counterplay and the rule that ordinary hits do not regain hidden random armor penetration.

### Town

The town owns risky carried assets, safe storage, banked gold, finite supplies, forging/selling, earned checkpoints and the optional fortune wheel. Service identity and progression feedback are already part of the current presentation; future work should be evidence-driven rather than another broad town rewrite.

## Localization ownership

`locale-runtime-v122.js` is the current language owner.

The retired production chain — `i18n.js`, `i18n-runtime.js`, `i18n-content.js`, `ux-hotfix-v121.js` — must not return to the production manifest or current architecture documentation.

Rules:

1. one locale is selected per page load;
2. gameplay/content/save IDs remain language-independent;
3. saved item/monster/profile identities are never translated in storage;
4. dynamic translation is event-driven and narrowly scoped;
5. no global character-data observer or locale polling loop;
6. canvas translation stays cached rather than repeating expensive work every paint.

## Audio ownership

`audio-director.js` owns adaptive BGM and the Music/SFX mixer.

- independent persistent Music / SFX sliders: 0–100%;
- recommended mix: 30 / 85;
- M and mobile Sound share the same master mute;
- pointer/touch resume listeners remain available so mobile browsers can recover WebAudio after backgrounding.

Do not introduce a second mute state in a mobile-only layer.

## Module boundaries

Core/shared gameplay:

- `game.js` — state, map, turn engine and mechanics requiring direct engine access.
- `equipment-system.js` — equipment generation, fit/value and progression.
- `town-system.js` — checkpoint progression and town/wheel policy.
- `commerce-system.js` — finite supply stock and chapter-scaled prices.
- `forge-system.js` — +3 refinement and +5 masterwork.
- `progression-system.js` — talents and milestone skill evolution.
- `content-system.js` — late-floor content and guardian/finale state machines.
- `combat-pressure.js` / `challenge-pressure.js` — readable deep-floor pressure layers.
- `gameplay-tuning.js` / `defense-system.js` — production-route and mitigation semantics.
- `desktop-controls.js` / `combat-controls.js` — desktop/gamepad plus J/K/Mana controls.

Presentation/runtime followers:

- `visual-polish.js` — atmosphere and town/equipment presentation.
- `equipment-shop-ui.js` — equipment/shop presentation bridge.
- `locale-runtime-v122.js` — stable zh/en locale runtime.
- `character-art-cleanup-v122.js` — presentation-only hero cleanup.
- `world-loot-polish-v122.js` — visible ground-loot presentation.
- `forge-feedback-v122.js` — post-result forge feedback.
- `audio-director.js` — music/SFX mixer.
- `mobile-ux.js` — mobile layout/haptics/hold-to-walk.
- `runtime-bootstrap.js` — late presentation/runtime followers.

Profiles:

- `profiles/classic-100.profile.js` — production content/data.
- short profiles — development/regression fixtures only.

The architecture rule is incremental extraction, not rewrite for rewrite's sake.

## Save compatibility

v1.2.2 intentionally preserves:

- run key `de-run-v6`, save version 2;
- town/meta key `de-greedy-meta-v1`;
- existing item/profile identities.

When changing persistent state:

1. preserve existing keys when practical;
2. add compatible defaults/migration rather than assuming a fresh save;
3. test old-save loading and fresh-save creation;
4. never silently clear progress as a repair strategy;
5. keep temporary UI/presentation state out of persistent gameplay data.

Presentation-only JS/CSS/art/localization changes should not alter player `localStorage` unless the change explicitly includes a reviewed migration.

## Validation policy

Use the smallest check set that can falsify the affected change. Simulation is diagnostic, not proof of human game feel.

The repository contains focused contracts covering production entry, deterministic descent, guardian mechanics, skill evolution, save compatibility, release boundaries, equipment art, J/K+Mana, Mana persistence, localization, audio/mobile behavior, repository governance and late challenge pressure.

Do not claim a fresh complete GitHub Actions suite for the v1.2 release line when one was not run. Human play remains the source of truth for feel and long-run balance.

## Release and deployment

Activation path:

`prepare artifact → upload → unpack/stage → verify → immutable release → health check → atomic switch → public check`

Expected markers include:

- `dungeon_echo_healthcheck=PASS`
- `dungeon_echo_site_deploy=PASS`
- `dungeon_echo_home_health=PASS`
- `dungeon_echo_home_mount=PASS`
- `dungeon_echo_file_release=PASS`

If deployment disconnects or fails, identify the last proven PASS marker before rerunning anything. Do not bypass checksum guards or rollback protection simply to force a release through.

## Repository governance after v1.2.2

The game/art line is intentionally frozen unless human evidence finds a concrete defect.

Current order of work:

1. finish repository metadata/release/tag and branch hygiene;
2. modernize 91hwl.cn and the Dungeon Echo project page;
3. bring first-class Chinese/English site navigation and metadata to the website;
4. prepare screenshots/GIFs/social-preview assets and a standard-account X launch package;
5. return to game balance/content only when evidence identifies a specific need.

Merged feature branches are historical pointers, not permanent development lines. Once immutable release/tag boundaries exist, old release branches may be pruned as well; Git history remains the archive.

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
- Do not restart a finished art pass without a concrete player-facing defect.

## Recommended reading order

1. `README.md`
2. `RELEASE_NOTES_v1.2.2.md`
3. `PRODUCTION_ROADMAP.md`
4. current open Issues
5. `DEVELOPMENT.md`
6. relevant production modules
7. `BALANCE_NOTES.md` when balance context is needed
8. `AI_COLLABORATION.md` when collaboration provenance matters

If documentation and code disagree, treat current production behavior plus the latest accepted changes as the source of truth, then fix the documentation.
