# Development Guide

Dungeon Echo is deliberately a static browser game. The production build does not require a package manager, bundler, application server or database.

The engineering goal is to keep changes understandable, testable and safe to deploy without turning the repository into an abstraction exercise.

## Current baseline

- Repository release line: **v1.2.6**.
- Production route: `index.html` → `classic-100` only.
- Development route: `dev.html` → internal short deterministic profiles using the current shared gameplay/UI runtime.
- Attack: **J**.
- Skill: **K** + Mana.
- Localization owner: `locale-runtime-v122.js`.

Do not add player-facing starting-depth selection back into `index.html`. Do not let `dev.html` become a second stale implementation.

## Local server

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/dev.html
```

## Current module boundaries

Core/shared gameplay:

- `game.js` — core state, map generation, turn loop and mechanics requiring direct engine access.
- `equipment-system.js` — equipment generation, class-relative fit, intrinsic value and deep-floor scaling.
- `town-system.js` — conquered-depth checkpoints, town progression and wheel policy.
- `commerce-system.js` — finite town supply stock and chapter-scaled pricing.
- `forge-system.js` — bounded +3 refinement choices and +5 masterwork completion.
- `progression-system.js` — talents and 20/40/60/80 milestone skill evolution.
- `content-system.js` — late-floor themes plus guardian/finale state machines.
- `combat-pressure.js` — readable deep-floor/guardian pressure.
- `challenge-pressure.js` — final mild late-game attack-pressure layer.
- `risk-reward-system.js` — shrine wagers and cask downside resolution.
- `gameplay-tuning.js` — production-route policy and tuning.
- `defense-system.js` — armor/fixed-reduction semantics.
- `desktop-controls.js` — desktop/gamepad input adapter.
- `combat-controls.js` — synchronous J/K + Mana contract.

Presentation/runtime followers:

- `visual-polish.js` — atmosphere plus equipment/town presentation.
- `equipment-shop-ui.js` — equipment/shop presentation bridge.
- `locale-runtime-v122.js` — current zh/en per-page locale owner.
- `character-art-cleanup-v122.js` — presentation-only hero cleanup.
- `world-loot-polish-v122.js` — visible ground-loot presentation.
- `forge-feedback-v122.js` — post-result forge feedback.
- `audio-director.js` — adaptive music/SFX mixer.
- `mobile-ux.js` — mobile layout, haptics and hold-to-walk.
- `runtime-bootstrap.js` — late presentation/runtime followers.

Profiles:

- `profiles/classic-100.profile.js` — production data.
- other short profiles — deterministic development/regression fixtures only.

The intended direction remains gradual extraction from `game.js`, not a rewrite. A new module should own a real responsibility instead of duplicating state merely to increase module count.

## Retired architecture

The old production localization chain is retired:

- `i18n.js`
- `i18n-runtime.js`
- `i18n-content.js`
- `ux-hotfix-v121.js`

Do not add these back to the production manifest or describe them as current runtime owners. The current v1.2.x line uses one locale per page load instead of whole-run live language translation.

The old C-skill / J-quick-dive UI is also retired. Current controls are J Attack / K Skill.

## Save data

The game stores progress in browser `localStorage`.

Current compatibility boundary:

- `de-run-v6`, version 2;
- `de-greedy-meta-v1`;
- existing item/profile identities remain stable.

When changing persistent structures:

1. preserve old keys when practical;
2. add compatible defaults/migration instead of assuming a fresh save;
3. test a pre-change save and a fresh save;
4. avoid silently deleting player progress to repair malformed data;
5. keep temporary combat/UI state out of persisted state.

Presentation-only art/CSS/UI changes should not require a save migration.

## Balance workflow

`BALANCE_NOTES.md` records human-play context.

When changing class or combat balance, evaluate at least:

- damage rhythm;
- incoming damage / healing pressure;
- resource usage;
- positioning burden;
- equipment dependence;
- retreat incentives;
- early/mid/late-floor behavior;
- guardian-specific counterplay.

Do not optimize only for bot clear rate. Simulation is diagnostic, not a substitute for human positioning, retreat, shopping and risk decisions.

## Tests

Use the smallest check set that can falsify the affected change.

High-value release/repository checks include:

```bash
node test/public-repo-safety.cjs
node test/repository-event-safety.cjs
node test/production.cjs
node test/descent100.cjs
node test/guardian-content.cjs
node test/skill-evolution.cjs
node test/release.cjs
node test/repository-governance-v122.cjs
```

`node test/public-repo-safety.cjs` is mandatory for operations/configuration/repository-governance changes in this public repository. It scans the checked-out tree for common credential artifacts, recognizable live-secret shapes and non-example email addresses; Git history remains a separate audit surface.

`node test/repository-event-safety.cjs` is mandatory when `.github/`, automation or deployment tooling changes. It prevents tracked workflows from turning public repository events into a production control path or consuming repository secrets for production mutation.

`node test/smoke.cjs` preserves broader historical feature/save coverage on development fixtures. `node test/sim.cjs` remains an optional balance diagnostic and should not be run as ritual validation for documentation or presentation-only work.

For focused JavaScript changes, `node --check <file>` is cheap and appropriate.

## Release boundary

The public static file set is controlled by `ops/release/static-files.txt`.

Development-only files, tests and short profiles must not leak into the production package. New production art/scripts must enter the allowlist deliberately and be covered by a release contract.

The deployment model overlays `/dungeon-echo/` into the existing immutable `91hwl-play` release tree and atomically switches the shared `current` symlink. Failed health checks must preserve rollback behavior.

`VERSION` is authoritative for the repository version. GitHub Release/tag metadata should provide immutable historical version boundaries; branch names are not a substitute for releases forever.

## Repository governance

After v1.2.6, the default repository shape should converge toward:

- `main` as the durable development line;
- short-lived feature/fix/art/chore/security branches deleted after their PR is merged;
- release branches retained only while they temporarily provide an otherwise-missing immutable version boundary;
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

OpenAI ChatGPT has been used for repository inspection, debugging, systems reasoning, regression strategy, gameplay/economy analysis, deployment review, art integration, documentation, localization and governance assistance. Repository ownership and final judgment remain human-controlled.

## Architecture rule of thumb

If a change can be implemented as a self-contained system without duplicating private core state, prefer a module. If a mechanic genuinely belongs inside the turn/state engine, modifying `game.js` can be correct.

Architecture exists to reduce regression risk and make iteration safer. It is not a goal by itself.
