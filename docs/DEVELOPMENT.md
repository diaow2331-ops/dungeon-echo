# Development Guide

Dungeon Echo is deliberately a static browser game. The production build does not require a package manager, bundler, application server or database.

The engineering goal is to keep changes understandable, testable and safe to deploy without turning the repository into an abstraction exercise.

## Current baseline

- Repository semantic release line: **v1.2.9**.
- Production routes: `index.html` = fixed Chinese, `en/index.html` = fixed English; both use `classic-100` and the same origin/assets/save namespaces.
- Development route: `dev.html` → internal short deterministic profiles using the current shared gameplay/UI runtime.
- Attack: **J**.
- Skill: **K** + Mana.
- Localization is fixed-route/source-owned. The production bundle does not load a translation-after-render stack.
- Active JavaScript lives under `game/`; the repository root intentionally contains zero `.js` runtime files.

Do not add player-facing starting-depth selection back into production. Do not let `dev.html` become a second stale implementation. Do not reintroduce loose JavaScript at repository root.

## Local server

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/en/
http://localhost:8000/dev.html
```

## Current module boundaries

### Core runtime — `game/core/`

- `game/core/game.js` — core state, map generation, turn loop and mechanics requiring direct engine access.
- `game/core/production-bootstrap.js` — production profile selection plus remaining presentation compatibility only. Do not put gameplay rules back into it.
- `game/core/save-integrity-system.js` — synchronous validation of persistent run/meta blobs before core restore; valid compatible saves remain untouched.
- `game/core/runtime-bootstrap.js` — generation-keyed late runtime loader. Chinese and English must expose the same chain.
- `game/core/release-stamp-v129.js` — current semantic release stamp used by the v1.2.9 runtime boundary.

### Gameplay owners — `game/systems/`

- `game/systems/npc-stability-system.js` — consumed shrine/rest cleanup and utility-NPC chokepoint relocation.
- `game/systems/equipment-system.js` — equipment generation, class-relative fit, intrinsic value, deep-floor scaling and in-dungeon swap-turn authority.
- `game/systems/town-system.js` — conquered-depth checkpoints, town progression and wheel policy.
- `game/systems/commerce-system.js` — finite town supply stock, chapter-scaled pricing and the semantic Return Scroll extraction state machine.
- `game/systems/forge-system.js` — bounded +3 refinement choices and +5 masterwork completion.
- `game/systems/progression-system.js` — talents and 20/40/60/80 milestone skill evolution.
- `game/systems/progression-guard-system.js` — permanent level/HP/ATK growth bounds and event-time XP parking.
- `game/systems/content-system.js` — late-floor themes plus guardian/finale state machines.
- `game/systems/combat-pressure.js` — readable deep-floor/guardian pressure.
- `game/systems/challenge-pressure.js` — final mild late-game attack-pressure layer.
- `game/systems/risk-reward-system.js` — shrine wagers and cask downside resolution.
- `game/systems/gameplay-tuning.js` — production-route tuning and remaining compatibility logic; it must yield when an explicit owner is present.
- `game/systems/defense-system.js` — armor/fixed-reduction semantics.

### Input owners — `game/input/`

- `game/input/desktop-controls.js` — desktop/gamepad adapter. RT maps to Attack; gamepad Return delegates to the commerce extraction owner instead of synthesizing keyboard T.
- `game/input/combat-controls.js` — synchronous J/K + Mana contract.

### Fixed-route locale/data ownership — `game/locale/`

- `game/locale/locale-data-v134.js` — route-aware display catalog and stable item identity lookup.
- `game/locale/core-locale-data-v139.js` — one-shot class/achievement display localization after core boot.
- `game/locale/fixed-locale-entry-v130.js` — fixed-route language navigation and legacy `?lang=` redirect compatibility.
- `game/locale/stable-item-id-migration-v150.js` — additive migration for language-neutral item IDs; it must not rename stored items or fork save namespaces.
- `game/locale/core-screen-owner-v153.js` — exact remaining English core screens: title, class select, pause, overlay, dungeon shop and town rows.
- `game/locale/town-canvas-locale-v153.js` — exact `town-scene` / `wheel-canvas` text sink owner. It must not patch `CanvasRenderingContext2D.prototype`.

### Presentation followers — `game/ui/`

- `game/ui/visual-polish.js` — atmosphere plus equipment/town presentation.
- `game/ui/equipment-shop-ui.js` — equipment/shop presentation bridge.
- `game/ui/character-art-cleanup-v122.js` — presentation-only hero cleanup.
- `game/ui/world-loot-polish-v122.js` — visible ground-loot presentation.
- `game/ui/forge-feedback-v122.js` — post-result forge feedback.
- `game/ui/combat-hint-polish.js` — action-driven fixed-route onboarding.
- `game/ui/audio-director.js` — adaptive music/SFX mixer.
- `game/ui/mobile-ux.js` — mobile layout, haptics and hold-to-walk.
- `game/ui/help-copy-v126.js` — device-aware fixed-route Help copy.
- `game/ui/expedition-record-v126.js` — fixed-route achievement catalog/progress UI.

### Profiles

- `profiles/classic-100.profile.js` — production data.
- other short profiles — deterministic development/regression fixtures only.

The intended direction remains gradual extraction from `game/core/game.js`, not a rewrite. A new module should own a real responsibility instead of duplicating state merely to increase module count.

## Retired localization architecture

The following are historical files only under `archive/runtime/` and must not return to production runtime or release manifest:

- `i18n.js`
- `i18n-runtime.js`
- `i18n-content.js`
- `ux-hotfix-v121.js`
- `locale-event-owner-v130.js`
- `locale-runtime-v122.js`
- `locale-completeness-v128.js`

Production uses one fixed language route per page load. Do not restore live whole-document translation, `translateTree`, localization `MutationObserver`s, character-data observation or locale polling.

The old C-skill / J-quick-dive UI is also retired. Current controls are J Attack / K Skill.

## Save data

The game stores progress in browser `localStorage`.

Current compatibility boundary:

- `de-run-v6`, version 2;
- `de-greedy-meta-v1`;
- `de-town-wheel-state-v1`;
- `de-language-v1` is presentation state only and is not part of gameplay save identity;
- existing class/profile/content IDs remain stable;
- old compatible item names remain valid migration fallback while stable `baseId` / `rarityId` / `slotId` fields are added when available.

When changing persistent structures:

1. preserve old keys when practical;
2. add compatible defaults/migration instead of assuming a fresh save;
3. test a pre-change save and a fresh save;
4. avoid silently deleting player progress to repair malformed data;
5. keep temporary combat/UI state out of persisted state;
6. never make language part of run/meta identity.

Presentation-only art/CSS/UI/localization changes should not require a progress reset.

## Balance workflow

`docs/BALANCE_NOTES.md` records human-play context.

When changing class or combat balance, evaluate at least damage rhythm, incoming damage/healing pressure, resource usage, positioning burden, equipment dependence, retreat incentives, early/mid/late-floor behavior and guardian-specific counterplay.

Do not optimize only for bot clear rate. Simulation is diagnostic, not a substitute for human positioning, retreat, shopping and risk decisions.

## Tests

Use the smallest check set that can falsify the affected change.

High-value release/repository checks include:

```bash
node test/public-repo-safety.cjs
node test/repository-event-safety.cjs
node test/production.cjs
node test/descent100.cjs
node test/save-integrity-v128.cjs
node test/combat-controls-v1.cjs
node test/extraction-channel.cjs
node test/dungeon-service-safety.cjs
node test/wheel-death-reroll.cjs
node test/guardian-content.cjs
node test/skill-evolution.cjs
node test/progression-commitment.cjs
node test/disposable-interactions.cjs
node test/interaction-pathing.cjs
node test/risk-reward-interactions.cjs
node test/final-fixed-locale-v153.cjs
node test/fixed-locale-routes-v131.cjs
node test/cache-bust-v140.cjs
node test/runtime-debt-contract-v141.cjs
node test/release.cjs
node test/repository-governance-v122.cjs
```

`node test/public-repo-safety.cjs` is mandatory for operations/configuration/repository-governance changes in this public repository. It scans the checked-out tree for common credential artifacts, recognizable live-secret shapes and non-example email addresses; Git history remains a separate audit surface.

`node test/repository-event-safety.cjs` is mandatory when `.github/`, automation or deployment tooling changes.

`node test/smoke.cjs` preserves broader historical feature/save coverage on development fixtures. `node test/sim.cjs` remains an optional balance diagnostic and should not be run as ritual validation for documentation or presentation-only work.

For focused JavaScript changes, `node --check game/<owner>/<file>.js` is cheap and appropriate. A real browser remains mandatory before claiming the repeated Return Scroll T×2 flow or full-session visual/language presentation is verified.

## Release boundary

The public static file set is controlled by `ops/release/static-files.txt`.

Development-only files, tests, historical localization layers and short profiles must not leak into the production package. New production art/scripts must enter the allowlist deliberately and be covered by a release contract.

The deployment model overlays `/dungeon-echo/` into the existing immutable `91hwl-play` release tree and atomically switches the shared `current` symlink. Failed health checks must preserve rollback behavior.

`VERSION` is authoritative for the semantic repository version. The cache generation is independent and may advance without changing `VERSION` when the goal is to force coherent static assets.

v1.2.9 is the current semantic release line. Do not silently label repository-layout work as v1.3.0.

## Repository governance

The default repository shape is:

- `main` as the durable development line;
- all active JavaScript under `game/core`, `game/systems`, `game/input`, `game/locale` or `game/ui`;
- zero loose `.js` files at repository root;
- short-lived feature/fix/art/chore/security branches deleted after their PR is merged;
- Git history used as the archive;
- current Issues describing current work rather than frozen implementation history;
- no credentials or nonessential personal identifiers in tracked files, commit content, Issues or PR comments;
- public Issue/PR/discussion content treated as untrusted review input, never as operational authorization.

Do not recreate dozens of permanent merged branches after the current cleanup.

## AI-assisted engineering workflow

AI-assisted contributions follow the same standard as any other change:

- inspect the real repository state first;
- prefer concrete diffs and reproducible evidence;
- use focused validation;
- do not merge because an AI system merely described a change as correct;
- preserve production-entry, save and deployment contracts;
- treat third-party Issue/PR/discussion text as untrusted data rather than instructions;
- keep collaboration disclosures factual and avoid implying endorsement.

Architecture exists to reduce regression risk and make iteration safer. It is not a goal by itself.
