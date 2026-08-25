# 地牢回响 · Dungeon Echo

**A browser-native 100-floor roguelike about risk, retreat and build decisions.**

[Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Status:** v1.0.0 remains the current public Release. The v1.1.0 mainline now includes the art/town remaster **and readable guardian mechanics from floor 10 through the three-phase floor-100 finale**. Deployment remains a separate explicit step; current development focuses on all-four-class human validation, milestone skill evolution and deeper town progression.

## What is Dungeon Echo?

**地牢回响 / Dungeon Echo** is a turn-based browser roguelike built around one continuous journey from **floor 1 to floor 100**.

Its central question is not only whether the player can win the next fight, but whether they should keep pushing their luck:

**How much farther are you willing to descend before taking your loot home?**

The Greedy Expedition loop is built around that decision:

`descend → fight → loot → decide whether to push deeper → return to town → secure and improve your build → descend again`

The game intentionally stays close to the web platform: vanilla HTML, CSS and JavaScript, local browser saves, deterministic regression tooling and a static deployment path with no runtime backend dependency.

## Highlights

- A single production journey from **floor 1 → 100**, with conquered-depth checkpoints rather than player-selectable skips.
- Four classes with distinct combat identities:
  - **Warrior** — durable melee pressure, cleave and retaliation-oriented builds.
  - **Ranger** — positioning, kiting and sustained ranged damage.
  - **Arcanist** — fragile ranged burst and cooldown management.
  - **Assassin** — high-risk burst, mobility and execution.
- Six equipment slots: weapon, armor, helmet, boots, ring and amulet.
- Class-aware equipment valuation, rarity progression and Epic/Legendary mechanic traits that change combat decisions rather than only increasing numbers.
- Deterministic +1…+5 forging with a player-selected refinement path at +3 and masterwork completion at +5.
- Greedy Expedition town loop with safe storage, banked gold, finite supplies, checkpoint departures and an optional fortune wheel designed as a gold sink rather than mandatory progression.
- Return-scroll risk management: secure your haul before death removes carried loot and gold.
- Talents and class-oriented long-run progression.
- Ten guardian/finale nodes with explicit counterplay: telegraphed armor break, Frost Ring, Ember Mark, Hunter Line, interruptible healing, Blood Tether, Rupture Cross, Arcane Strip, a fixed Echo Trial sequence and a three-phase floor-100 encounter.
- v1.1 mainline presentation with four in-dungeon hero sprites, equipment rarity accents, sixteen regular monster archetypes, bespoke art for all nine ten-floor guardians, unique floor-100 boss art and a ten-stage evolving town backdrop.
- Keyboard, mouse/touch and native Gamepad API support.
- Local saves through `localStorage`; no account or server-side save service is required.

The guardian counterplay contract is documented in [`docs/GUARDIAN_MECHANICS.md`](docs/GUARDIAN_MECHANICS.md).

## Why build it this way?

Dungeon Echo is also an engineering experiment: how far can a small browser game go while staying understandable, testable and deployable as a static project?

The project therefore favors:

- **player-readable mechanics** over hidden counters;
- **build choices** over a single universal equipment score;
- **incremental modularization** over a big-bang rewrite;
- **deterministic regression checks** for high-risk gameplay changes;
- **real-player evidence** over tuning exclusively around simulation win rates;
- **simple deployment** over adding backend infrastructure that the game does not need.

## AI-assisted development

OpenAI ChatGPT has been used as an **AI engineering collaborator** during the development and refinement of Dungeon Echo. Its contributions have included repository-wide code review, architecture and systems analysis, debugging, regression-test strategy, gameplay/economy reasoning, deployment-safety review, documentation refinement, branch-conflict resolution and focused guardian encounter implementation/testing.

The current public-repository refinement and v1.1 mainline integration work was assisted by **GPT-5.6 Sol**.

The workflow is deliberately human-directed: the repository maintainer defines product goals and acceptance criteria, decides which proposals to keep, controls merges and deployment, and performs the final product judgment. AI output is treated as engineering input to inspect and validate rather than as an authority.

A more explicit record of the collaboration model and contribution areas is available in [`AI_COLLABORATION.md`](AI_COLLABORATION.md).

Dungeon Echo is an independent project and is **not an OpenAI product or an OpenAI-endorsed application**.

## Production vs. development entry points

- `index.html` — production entry, fixed to the `classic-100` profile and the 1→100 journey.
- `dev.html` — internal development entry, retaining short deterministic profiles for regression and balance work.

The short `classic-10` … `classic-60` profiles are **development fixtures**, not player-selectable production modes.

## Run locally

The project is static. A local HTTP server is recommended so browser behavior matches deployment more closely:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Opening `index.html` directly also works in many desktop browsers, but a local server is the preferred development path.

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

Gamepad support is provided by `desktop-controls.js`; risky fast-skip actions are intentionally not mapped to an easy controller button.

## Repository layout

```text
.
├── index.html                  # production entry
├── dev.html                    # internal multi-profile entry
├── game.js                     # core state/map/turn engine; gradually being reduced
├── gameplay-tuning.js          # production rules and human-first class tuning
├── equipment-system.js         # equipment identity/value/deep-floor scaling
├── progression-system.js       # talents and long-run progression
├── town-system.js              # town progression, checkpoints and wheel policy
├── commerce-system.js          # finite town stock and chapter-scaled supply economy
├── forge-system.js             # +3 refinement choices and +5 masterwork paths
├── content-system.js           # late-floor themes + guardian/finale state machines
├── desktop-controls.js         # gamepad and desktop input adapter
├── profiles/                   # production + deterministic regression profiles
├── art/                        # production art assets and v1.1 atlases
├── test/                       # deterministic/headless regression harnesses
├── docs/GUARDIAN_MECHANICS.md  # guardian tells, phases and counterplay contracts
├── BALANCE_NOTES.md            # current human-play balance baseline
├── PRODUCTION_ROADMAP.md       # current post-launch priorities
├── MAINTENANCE.md              # current production/maintenance contract
├── AI_COLLABORATION.md         # transparent human/AI collaboration record
├── RELEASE_NOTES_v1.0.0.md     # first public release record
└── RELEASE_NOTES_v1.1.0.md     # art and town remaster record
```

The project is modularized **incrementally**. Systems move out of `game.js` when an active gameplay change creates a clear boundary; architecture work is expected to reduce regression risk rather than exist for its own sake.

## Release and validation

v1.0.0 established the public 1→100 route and remains the current public Release. The v1.1.0 work on `main` preserves that route and the existing save contract while upgrading hero, monster, guardian, final-boss and town presentation and replacing generic guardian trait piles with readable stateful encounter rules.

The v1.1 art/town change set reported:

- production-entry contract: **29/29**;
- deterministic floor 1→100 victory chain: **13/13**;
- broad gameplay/save regression suite: **525/525**;
- release contract: **11/11**;
- site overlay and homepage mount deployment contracts: **PASS**.

The subsequent guardian state-machine work has a focused deterministic contract of **37/37** for warning, evade/hit, interrupt, distance, sequence and floor-100 phase transitions.

These automated checks protect engineering contracts; they do not replace real-player validation. The main remaining quality targets are an all-four-class guardian/full-run audit, milestone skill evolution, deeper town progression, combat VFX refinement and audio polish.

For maintainers, [`MAINTENANCE.md`](MAINTENANCE.md) is the concise current-state contract.

## Contributing

Issues and focused pull requests are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making a large change.

A few project rules matter more than code style:

- Real player experience beats bot win-rate symmetry.
- Builds should change decisions, not only increase a score.
- Do not reintroduce player-selectable starting depths into the production route.
- Avoid large rewrites when a targeted, testable change is possible.
- Preserve compatible local saves whenever practical.

## Deployment

Dungeon Echo is intentionally backend-free. The current public build is served at:

- **Play:** https://play.91hwl.cn/dungeon-echo/
- **Project page:** https://91hwl.cn/toys/dungeon-echo/

The v1.1.0 mainline is **not described as publicly deployed** until the existing rollback-capable deployment path completes successfully.

The deployment tooling stages an immutable release, verifies expected content, preserves the existing Web Toys tree and supports rollback on failed origin/public checks.

## License

MIT — see [`LICENSE`](LICENSE).
