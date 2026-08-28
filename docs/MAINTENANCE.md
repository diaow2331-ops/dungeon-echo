# Dungeon Echo Maintenance Guide

This document describes the current production and repository contract for **v1.2.9**, which formalizes the post-v1.2.8 fixed-route convergence work as the current release line.

For product-facing information, start with `README.md`. Historical release notes preserve old implementation context; current documents must describe the product as it exists now.

## Current release contract

- Repository semantic release line: **v1.2.9**.
- Static cache generation: **153**; semantic version and cache generation are intentionally independent.
- `VERSION` is the repository version authority; deployment is only proven after the normal activation and health checks pass.
- Production journey: **floor 1 → floor 100**.
- Chinese entry: `https://play.91hwl.cn/dungeon-echo/`.
- English entry: `https://play.91hwl.cn/dungeon-echo/en/`.
- Legacy `?lang=` links remain compatibility redirects only.
- Project page: `https://91hwl.cn/toys/dungeon-echo/`.
- Runtime: static HTML / CSS / JavaScript; no core gameplay backend dependency.
- Saves: browser `localStorage`; no account, cloud save or cross-device synchronization.
- Primary experiences: desktop browser plus dedicated portrait/landscape touch layouts; Gamepad API is also supported.

## Production vs development

### Fixed production entries

`index.html` and `en/index.html` are separate fixed-language source pages that:

- always use `classic-100`;
- start new players at floor 1;
- allow return only to earned checkpoints;
- never expose player-selectable skips into unconquered content;
- advertise and implement **J Attack / K Skill / Mana**;
- boot the exact same synchronous gameplay graph;
- share the same origin, gameplay data and save namespaces;
- differ only in player-facing source copy and route-owned display rendering.

Changing language is a title-screen navigation action that reloads into the other fixed route. Do not reintroduce whole-page live translation, generic DOM tree scans, localization observers or locale polling.

### `dev.html`

The internal development harness:

- exposes short deterministic profiles for regression/reproduction work;
- shares the current gameplay/UI contract with production;
- is excluded from the public release allowlist;
- must never become a second stale product implementation.

## Core gameplay model

`descend → fight / loot → decide whether to push deeper → return safely → secure and improve the build → descend again`

Changes to combat, equipment, return scrolls, death risk, town economy, forging or checkpoints should be evaluated against this loop rather than in isolation.

## Controls and mana

- Movement/facing: WASD / arrows / map click; mobile four-way D-pad.
- Attack: **J** / mobile Attack.
- Active skill: **K** / mobile Skill.
- Wait/focus: Space or `.` on keyboard; deliberately not exposed on the mobile D-pad.
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

Tier-specific v13 equipment art is authoritative for item presentation. The hero atlas remains the sole character-art owner; do not restore obsolete equipment-derived hero geometry/overlays.

Stable localization identity is additive: `stable-item-id-migration-v150.js` may attach language-neutral `baseId`, `rarityId` and `slotId` fields to compatible equipment records, but it must not rename stored items, fork save namespaces or invalidate old compatible saves.

### Guardians and finale

Floors 10 / 20 / … / 90 and the floor-100 finale have explicit readable mechanics. Floor 100 is a three-phase encounter. Preserve telegraphs, movement counterplay and the rule that ordinary hits do not regain hidden random armor penetration.

### Town

The town owns risky carried assets, safe storage, banked gold, finite supplies, forging/selling, earned checkpoints and the optional fortune wheel. Return Scroll extraction is a two-stage semantic state machine; desktop keyboard, touch and gamepad must delegate to that owner instead of inventing independent return behavior.

## Localization ownership

Production localization is now **fixed-route and source-owned**, not translation-after-render.

Current owners:

- `index.html` — fixed Chinese shell/source route.
- `en/index.html` — fixed English shell/source route using `<base href="../">` so both entries share the same assets and origin.
- `fixed-locale-entry-v130.js` — title language selector plus legacy `?lang=` compatibility redirects; it may write `de-language-v1` only as a presentation preference.
- `locale-data-v134.js` — route-aware catalog/display helpers and stable identity lookup.
- `core-locale-data-v139.js` — one-shot class/achievement display localization after core boot.
- `core-screen-owner-v153.js` — exact remaining English core screen render owner: title, class select, pause, death/victory overlay, dungeon shop and town dynamic rows.
- `town-canvas-locale-v153.js` — exact `town-scene` / `wheel-canvas` text sink owner; it must stay scoped to those concrete contexts and must not patch `CanvasRenderingContext2D.prototype`.
- feature modules such as `town-system.js`, `commerce-system.js`, `forge-system.js`, `combat-hint-polish.js`, `help-copy-v126.js` and `expedition-record-v126.js` render their own fixed-route copy directly.

Retired from production:

- `i18n.js`, `i18n-runtime.js`, `i18n-content.js`, `ux-hotfix-v121.js`;
- `locale-event-owner-v130.js`, `locale-runtime-v122.js`, `locale-completeness-v128.js`.

Those files may remain as historical repository artifacts, but they must not return to `runtime-bootstrap.js` or `ops/release/static-files.txt`.

Rules:

1. route identity is fixed for the page load;
2. gameplay/content/save IDs remain language-independent;
3. stored item/monster/profile identity is never translated or renamed merely for display;
4. Chinese and English production entries boot the same gameplay/runtime graph;
5. no global character-data observer, generic `translateTree`, locale polling loop or whole-document scan;
6. Canvas localization is limited to exact legacy sinks;
7. language selection never changes gameplay state, RNG, balance or save identity.

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
- `save-integrity-system.js` — pre-core run/meta validation.
- `npc-stability-system.js` — consumed utility cleanup + path stability.
- `equipment-system.js` — equipment generation, fit/value and swap-turn authority.
- `town-system.js` — checkpoint progression and town/wheel policy.
- `commerce-system.js` — finite supply stock, chapter pricing and Return extraction state machine.
- `forge-system.js` — +3 refinement and +5 masterwork.
- `progression-system.js` — talents and milestone skill evolution.
- `progression-guard-system.js` — permanent growth / XP bounds.
- `content-system.js` — late-floor content and guardian/finale state machines.
- `combat-pressure.js` / `challenge-pressure.js` — readable deep-floor pressure layers.
- `gameplay-tuning.js` / `defense-system.js` — production-route and mitigation semantics.
- `desktop-controls.js` / `combat-controls.js` — desktop/gamepad plus J/K/Mana controls.

Presentation/runtime:

- `locale-data-v134.js`, `core-locale-data-v139.js`, `stable-item-id-migration-v150.js` — language-neutral catalog/data boundary.
- `core-screen-owner-v153.js`, `town-canvas-locale-v153.js` — exact residual fixed-route render sinks.
- `visual-polish.js` — camera-aware atmosphere and town/equipment presentation.
- `equipment-shop-ui.js` — equipment/shop presentation bridge.
- `character-art-cleanup-v122.js` — presentation-only hero cleanup.
- `world-loot-polish-v122.js` — visible ground-loot presentation.
- `forge-feedback-v122.js` — post-result forge feedback.
- `combat-hint-polish.js` — action-driven onboarding.
- `audio-director.js` — music/SFX mixer.
- `mobile-ux.js` — mobile layout/haptics/direct pointer-down movement.
- `help-copy-v126.js` — fixed-route help/device copy.
- `expedition-record-v126.js` — fixed-route achievement catalog/progress UI.
- `runtime-bootstrap.js` — late follower loader; both fixed routes must expose the same chain.

The architecture rule is incremental extraction, not rewrite for rewrite's sake.

## Save compatibility

The current line preserves:

- run key `de-run-v6`, save version 2;
- town/meta key `de-greedy-meta-v1`;
- wheel state key `de-town-wheel-state-v1`;
- existing profile/class/monster/content identities;
- compatible historical item names as migration fallback only.

`de-language-v1` is presentation state and must never become part of run/meta identity.

When changing persistent state:

1. preserve existing keys when practical;
2. add compatible defaults/migration rather than assuming a fresh save;
3. test old-save loading and fresh-save creation;
4. never silently clear progress as a repair strategy;
5. keep temporary UI/presentation state out of persistent gameplay data.

Presentation-only JS/CSS/art/localization changes should not reset player progress.

## Validation policy

Use the smallest check set that can falsify the affected change. Simulation is diagnostic, not proof of human game feel.

For the fixed-route convergence, high-value checks include `test/final-fixed-locale-v153.cjs`, `test/fixed-locale-routes-v131.cjs`, `test/cache-bust-v140.cjs`, `test/runtime-debt-contract-v141.cjs`, `test/save-integrity-v128.cjs`, `test/extraction-channel.cjs` and `test/release.cjs`.

Do not claim a fresh complete GitHub Actions or browser suite when no run exists. Human browser play remains the source of truth for repeated Return Scroll T×2 behavior, responsive presentation and full-session language leakage.

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

## Repository governance after v1.2.9

The current priority is convergence, not another broad rewrite:

1. keep `main` as the durable development line;
2. keep fixed Chinese/English routes and shared saves stable;
3. remove short-lived merged branches once their history is safely in Git;
4. use current Issues for unresolved browser acceptance or concrete player-facing defects;
5. do not reopen large architecture/art cycles without evidence.

Merged feature branches are historical pointers, not permanent development lines. Git history remains the archive.

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
- Do not restore translation-after-render, whole-document localization observers or polling.
- Do not make Chinese and English separate gameplay/save products.

## Recommended reading order

1. `README.md`
2. `docs/releases/RELEASE_NOTES_v1.2.9.md`
3. `docs/PRODUCTION_ROADMAP.md`
4. current open Issues
5. `docs/DEVELOPMENT.md`
6. `docs/LOCALIZATION.md`
7. relevant production modules
8. `docs/BALANCE_NOTES.md` when balance context is needed
9. `docs/AI_COLLABORATION.md` when collaboration provenance matters

If documentation and code disagree, treat current production behavior plus the latest accepted changes as the source of truth, then fix the documentation.