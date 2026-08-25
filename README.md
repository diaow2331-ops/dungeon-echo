# 地牢回响 · Dungeon Echo

**A browser-native 100-floor roguelike about risk, retreat and build decisions.**

[Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Status:** **v1.1.0 is publicly deployed.** The current mainline includes the art/town remaster, readable guardian mechanics from floor 10 through the three-phase floor-100 finale, four-class 20/40/60/80 skill evolution, and the unified equipment-art pass. Existing browser saves remain compatible.

## What is Dungeon Echo?

Dungeon Echo is a turn-based browser roguelike built around one continuous journey from **floor 1 to floor 100**.

The core loop is deliberately simple to describe and difficult to optimize:

`descend → fight → loot → decide whether to push deeper → return safely → secure/improve the build → descend again`

The project stays close to the web platform: vanilla HTML/CSS/JavaScript, local browser saves, deterministic regression tooling and a static deployment path with no runtime backend dependency.

## Current game

- One production route: **1 → 100**, with conquered-depth checkpoints rather than player-selectable skips.
- Four classes: **Warrior, Ranger, Arcanist, Assassin**.
- Six equipment slots: weapon, armor, helmet, boots, ring and amulet.
- Epic/Legendary mechanic traits that change decisions, not only stat totals.
- Deterministic +1…+5 forging, +3 refinement choice and +5 masterwork completion.
- Greedy Expedition town loop with safe storage, banked gold, finite supplies, checkpoint departures and an optional fortune wheel.
- Four-class skill evolution at **20 / 40 / 60 / 80**, while retaining the single `C` active-skill input.
- Ten guardian/finale nodes with explicit counterplay, including interrupt, movement, distance and multi-phase mechanics.
- A three-phase floor-100 finale.
- Four-class hero art, sixteen regular monster archetypes, bespoke guardian/final-boss art, ten-stage town presentation and a unified equipment/loot visual language.
- Keyboard, mouse/touch and native Gamepad API support.
- Local saves through `localStorage`; no account or server-side save service is required.

Guardian mechanics are documented in [`docs/GUARDIAN_MECHANICS.md`](docs/GUARDIAN_MECHANICS.md). Skill routes are documented in [`docs/SKILL_EVOLUTION.md`](docs/SKILL_EVOLUTION.md).

## Design / engineering principles

Dungeon Echo intentionally favors:

- readable counterplay over hidden punishment;
- build decisions over a single universal item score;
- real-player evidence over tuning only around bot win rates;
- incremental modularization over large rewrites;
- targeted deterministic regression checks for high-risk changes;
- static, rollback-capable deployment over unnecessary runtime infrastructure;
- save compatibility whenever practical.

## Production and development entry points

- `index.html` — production entry, fixed to the `classic-100` 1→100 journey.
- `dev.html` — internal development harness for short deterministic profiles and reproduction work.
- `profiles/classic-10` … `classic-60` — development fixtures, not player-facing production modes.

The development harness is intentionally excluded from the public release allowlist.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | Arrow keys / WASD |
| Wait | Space / `.` |
| Potion | `Q` |
| Scroll | `E` |
| Return to town | `T` |
| Class skill | `C` |
| Descend | `Enter` |
| Pause | `Esc` |
| Mute | `M` |
| Fullscreen | `F` |
| Restart after death/win | `R` |

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Repository layout

```text
.
├── index.html                  # production entry
├── dev.html                    # internal multi-profile development harness
├── game.js                     # core state/map/turn engine
├── gameplay-tuning.js          # production route and class tuning
├── equipment-system.js         # equipment generation / fit / intrinsic value
├── progression-system.js       # talents + milestone skill evolution
├── town-system.js              # town progression / checkpoints / wheel policy
├── commerce-system.js          # finite supply stock and chapter pricing
├── forge-system.js             # +3 refinement and +5 masterwork
├── content-system.js           # late-floor themes + guardian/finale state machines
├── desktop-controls.js         # desktop/gamepad input adapter
├── profiles/                   # production + deterministic regression profiles
├── art/                        # production art assets
├── test/                       # deterministic/headless regression harnesses
├── docs/                       # focused gameplay contracts
├── BALANCE_NOTES.md            # human-play balance baseline
├── PRODUCTION_ROADMAP.md       # post-v1.1 priorities
├── MAINTENANCE.md              # current production/maintenance contract
├── AI_COLLABORATION.md         # human/AI collaboration record
└── RELEASE_NOTES_v*.md         # historical release records
```

## Validation

The current high-value checks are:

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

Current recorded contracts include:

- production-entry contract: **29/29**;
- deterministic 1→100 chain: **13/13**;
- broad gameplay/save suite: **525/525**;
- release contract: **11/11**;
- focused guardian state-machine contract: **37/37**;
- focused skill-evolution contract: **9/9**;
- deployment / public health checks: **PASS** for the v1.1 rollout.

These checks protect engineering contracts; they do not replace human playtesting.

## Save compatibility

The game stores progress in browser `localStorage`. v1.1 keeps the existing run/meta save keys and schemas; the art/UI hotfixes do not clear or migrate player data.

Clearing site data, changing browser profile/device or changing storage origin can make a local save unavailable. Normal static-file updates and hard refreshes do not remove `localStorage`.

## AI-assisted development

OpenAI ChatGPT has been used as an AI engineering collaborator for repository inspection, architecture/systems analysis, debugging, regression strategy, gameplay/economy reasoning, deployment review, documentation, branch-conflict resolution, guardian mechanics and skill-evolution integration.

The current public-repository refinement work was assisted by **GPT-5.6 Sol**. Product direction, acceptance decisions, merges, deployment and final quality judgment remain human-controlled.

See [`AI_COLLABORATION.md`](AI_COLLABORATION.md) for the explicit collaboration record. Dungeon Echo is an independent project and is not an OpenAI product or endorsement.

## Contributing and maintenance

Focused issues and pull requests are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before large changes and [`MAINTENANCE.md`](MAINTENANCE.md) for the current production contract.

Historical branches/PRs/releases may preserve development context; current documentation describes the product as it exists now.

## License

MIT — see [`LICENSE`](LICENSE).
