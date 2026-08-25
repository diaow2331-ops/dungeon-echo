# AI-assisted development record

Dungeon Echo is a human-directed project that has used **OpenAI ChatGPT as an AI engineering collaborator** during development, debugging, release preparation and post-launch refinement.

This document exists to make that collaboration explicit without overstating authorship or implying endorsement.

## Collaboration model

The repository maintainer owns the project and is responsible for:

- product direction and gameplay goals;
- deciding which proposals are accepted or rejected;
- final taste/quality judgment;
- repository permissions, merges and releases;
- live deployment and operational decisions.

ChatGPT has been used to accelerate engineering work by inspecting the actual repository state, reasoning across systems, proposing or applying focused changes, and helping turn observations into testable implementation plans.

AI output is treated as **engineering input that must be inspected and validated**, not as an authority.

## Areas where ChatGPT has contributed

### 1. Repository and architecture analysis

AI-assisted review has been used to understand the interaction between the core `game.js` engine and the gradually extracted production modules.

The collaboration has emphasized incremental modularization: move a system only when it has a real responsibility and a stable boundary, rather than rewriting the game to make the architecture look newer.

Relevant current modules include:

- `gameplay-tuning.js`
- `equipment-system.js`
- `progression-system.js`
- `town-system.js`
- `commerce-system.js`
- `forge-system.js`
- `content-system.js`
- `desktop-controls.js`

### 2. Gameplay and systems reasoning

ChatGPT has been used to reason about gameplay problems that were not well explained by a single number, including:

- replacing hidden/random anti-defense behavior with readable counterplay;
- separating class-relative equipment fit from class-independent economic value;
- turning high-rarity equipment into behavior-changing build choices;
- keeping forging bounded instead of introducing unlimited random reroll loops;
- analyzing the interaction between gold income, finite supplies, checkpoints, forging, selling and the fortune wheel;
- identifying the gap between generic guardian trait combinations and truly bespoke boss encounters;
- defining milestone skill evolution that changes behavior without expanding the hotkey bar;
- defining a town direction that behaves like a persistent progression hub rather than a storage spreadsheet.

The aim has been to improve player decisions, not merely increase the number of systems.

### 3. Debugging and regression strategy

AI-assisted debugging has focused on finding structural causes before repeatedly changing balance numbers.

The workflow favors:

- deterministic reproduction where possible;
- narrow tests that can actually falsify a proposed fix;
- preserving compatible saves;
- separating production `classic-100` behavior from short development fixtures;
- using simulation as diagnostic evidence rather than treating bot win rate as the product goal;
- avoiding large unrelated test runs when a smaller check is sufficient.

### 4. Release and deployment reasoning

ChatGPT has also been used during release/deployment work to reason about:

- static production packaging;
- explicit public-file allowlists;
- deployment verification;
- preserving the existing 91hwl Web Toys tree;
- origin/public health checks;
- rollback-oriented deployment paths;
- keeping the core game independent from unnecessary runtime backend services.

The resulting public game remains a static browser application.

### 5. Documentation and project communication

AI-assisted documentation work has included turning implementation history into clearer public project communication:

- explaining the 1→100 product loop before internal engineering detail;
- separating production behavior from regression fixtures;
- distinguishing completed v1.0.0 work from post-launch priorities;
- replacing temporary transition-oriented documentation with a durable maintenance guide;
- correcting stale balance/security/contribution wording after production behavior changed;
- documenting known limitations instead of hiding them;
- recording AI collaboration transparently for reviewers and contributors.

## Current documented pass

On **2026-08-26**, the public-repository documentation/refinement pass was assisted by **GPT-5.6 Sol**.

That pass updated or introduced the project-facing and maintenance documentation, including:

- `README.md`
- `PRODUCTION_ROADMAP.md`
- `RELEASE_NOTES_v1.0.0.md`
- `DEVELOPMENT.md`
- `README.txt`
- `MAINTENANCE.md`
- `BALANCE_NOTES.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `.github/ISSUE_TEMPLATE/gameplay_balance.yml`
- `AI_COLLABORATION.md`

The purpose of the pass was to align documentation with the actual live product, remove stale transition-era framing from current project surfaces, document the next engineering priorities, and make the human/AI collaboration model explicit.

## v1.1 integration pass

On **2026-08-26**, GPT-5.6 Sol also assisted with integrating the v1.1 art/town remaster into the current mainline.

The work included:

- diagnosing why the art branch had become unmergeable after later documentation/governance commits;
- comparing the branch and current `main` to prove the intervening changes were documentation/governance only;
- constructing a resolved merge tree that preserved current README, maintenance, security and AI-collaboration documents instead of overwriting them with older branch copies;
- retaining the v1.1 hero, monster, guardian, final-boss and town assets plus their runtime fallbacks, UI integration and release allowlist changes;
- restoring PR #26 to a clean, reviewable state and merging it through a squash commit;
- aligning the repository-facing v1.1 status and release notes with the actual mainline state without claiming deployment before health checks succeed.

The v1.1 visual concepts and product direction remained maintainer-controlled; the AI contribution here was repository analysis, integration reasoning, conflict resolution and implementation assistance.

## v1.1 gameplay refinement pass

On **2026-08-26**, GPT-5.6 Sol assisted with the gameplay-focused portion of the v1.1 release candidate.

The work included:

- replacing floors 20–100 guardian trait piles with incremental, readable state machines rather than rewriting the core combat engine;
- designing and integrating one-turn telegraphs and explicit counterplay for Frost Ring, Ember Mark, Hunter Line, Mending Channel, Blood Tether, Rupture Cross, Arcane Strip, Echo Trial and the three-phase End-Abyss Sovereign finale;
- keeping guardian specials from stacking with a normal attack on the same turn;
- adding focused deterministic guardian transition coverage that reached **37/37** for the completed 10→100 encounter set;
- reviewing and integrating four-class skill evolution at floors 20 / 40 / 60 / 80 while preserving the single `C` skill input and existing save schema;
- adding focused skill-evolution coverage that reached **9/9**, including milestone catch-up and temporary-stat leakage protection;
- keeping Issues #4 and #5 open for human-play validation after the code-side implementation was complete, rather than treating automated tests as proof of final balance.

These changes were implemented through focused branches and pull requests, preserving the existing static deployment topology and local-save contracts.

## What this disclosure does not mean

- It does not mean every line in the repository was generated by AI.
- It does not mean AI decisions bypassed maintainer review.
- It does not mean OpenAI reviewed, certified or endorsed Dungeon Echo.
- It does not make Dungeon Echo an OpenAI product.

Dungeon Echo remains an independent project. The AI contribution described here is the use of OpenAI ChatGPT as a development and reasoning collaborator within a human-controlled engineering workflow.
