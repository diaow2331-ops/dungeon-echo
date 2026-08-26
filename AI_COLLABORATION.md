# AI-assisted development record

Dungeon Echo is a human-directed project that has used **OpenAI ChatGPT as an AI engineering collaborator** during development, debugging, release preparation, art integration, repository governance and post-launch refinement.

This document makes that collaboration explicit without overstating authorship or implying endorsement.

## Collaboration model

The repository maintainer owns the project and is responsible for:

- product direction and gameplay goals;
- deciding which proposals are accepted or rejected;
- final taste/quality judgment;
- repository permissions, merges and releases;
- live deployment and operational decisions.

ChatGPT has been used to inspect the actual repository state, reason across systems, propose or apply focused changes, and turn observations into reviewable implementation plans and regression contracts.

AI output is treated as engineering input that must be inspected and validated, not as an authority.

## Areas where ChatGPT has contributed

### Repository and architecture

AI-assisted work has included tracing the interaction between `game.js` and the extracted production modules, preserving the rule that modularization must reduce risk rather than exist for its own sake.

Current examples include gameplay/equipment/town/commerce/forge/progression/content modules, J/K + Mana controls, pressure/defense layers, presentation followers and the v1.2.2 locale/art cleanup runtime.

### Gameplay and systems reasoning

Examples include:

- replacing hidden/random anti-defense behavior with readable counterplay;
- separating class-relative equipment fit from class-independent economic value;
- turning high-rarity equipment into behavior-changing build choices;
- keeping forging bounded instead of creating unlimited reroll loops;
- analyzing gold, finite supplies, checkpoints, forging, selling and the fortune wheel as one economy;
- replacing generic guardian trait piles with readable encounter mechanics;
- defining milestone skill evolution without expanding the hotkey bar;
- improving town risk/preparation clarity without forcing unnecessary avatar walking.

The aim has been to improve player decisions, not merely increase system count.

### Debugging and regression strategy

The collaboration favors:

- deterministic reproduction where possible;
- narrow tests that can falsify a proposed fix;
- compatible-save preservation;
- explicit separation of production `classic-100` from development fixtures;
- simulation as diagnostic evidence rather than a substitute for human play;
- avoiding large unrelated test runs when a smaller contract is sufficient.

### Release, deployment and governance

AI-assisted work has also covered:

- static production packaging and allowlists;
- 91hwl deployment topology and rollback paths;
- origin/public health checks;
- release/version documentation;
- branch/PR/Issue hygiene;
- protecting current repository truth from stale historical documentation.

The resulting public game remains a static browser application.

### Art and presentation integration

AI-assisted integration/review has included:

- class hero, monster, guardian, final-boss and town art integration;
- equipment atlas continuity across dungeon, inventory, town and shop;
- desktop atmosphere and combat-presence polish;
- removal of detached/obsolete character-equipment overlays;
- ground-loot presentation and forge feedback cleanup;
- preserving presentation-only boundaries so art work does not silently mutate gameplay state.

The visual direction and acceptance decisions remain maintainer-controlled.

## 2026-08-26 documentation and v1.1 integration passes

GPT-5.6 Sol assisted with the public-repository documentation/refinement and v1.1 integration work, including repository analysis, conflict resolution, current-state documentation, the art/town remaster merge and production/release boundary review.

The v1.1 gameplay refinement work also included readable guardian state machines and four-class skill evolution at floors 20 / 40 / 60 / 80. The current active-skill input is **K**, not the historical C binding. Later v1.2 work separated movement from explicit **J Attack / K Skill** control and added Mana.

## v1.2 / v1.2.2 refinement

On **2026-08-26–27**, GPT-5.6 Sol assisted with the v1.2 release line and v1.2.2 final game-polish/governance work.

This included:

- J Attack / K Skill + class-specific Mana and persistence reasoning;
- mobile portrait/landscape UX and audio-resume hardening;
- Chinese / English presentation work;
- later replacement of the layered localization chain with the stable `locale-runtime-v122.js` per-page model after human testing exposed stalls;
- character-art residual cleanup so obsolete equipment geometry no longer competes with the hero atlas;
- ground-loot presentation and forge feedback polish;
- release/deployment verification improvements;
- repository documentation alignment after v1.2.2;
- classification of accumulated merged branches and release-boundary debt.

The v1.2.2 art/UX pass is treated as the end of this broad game-polish cycle. Further game/art changes should be driven by concrete player-facing evidence rather than a need to keep increasing version scope.

## What this disclosure does not mean

- It does not mean every line in the repository was generated by AI.
- It does not mean AI decisions bypassed maintainer review.
- It does not mean OpenAI reviewed, certified or endorsed Dungeon Echo.
- It does not make Dungeon Echo an OpenAI product.

Dungeon Echo remains an independent project. The AI contribution described here is the use of OpenAI ChatGPT as a development and reasoning collaborator within a human-controlled engineering workflow.
