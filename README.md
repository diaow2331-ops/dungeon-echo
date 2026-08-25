# 地牢回响 · Dungeon Echo

**A browser-native 100-floor roguelike about risk, retreat and build decisions.**

[Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Status:** v1.0.0 is publicly deployed. Development now focuses on post-launch boss design, long-run progression, town identity and a deeper art/UI pass.

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
- Ten-floor chapter / guardian cadence with a floor-100 finale and post-launch work underway on more bespoke boss mechanics.
- Keyboard, mouse/touch and native Gamepad API support.
- Local saves through `localStorage`; no account or server-side save service is required.

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

OpenAI ChatGPT has been used as an **AI engineering collaborator** during the development and refinement of Dungeon Echo. Its contributions have included repository-wide code review, architecture and systems analysis, debugging, regression-test strategy, gameplay/economy reasoning, deployment-safety review and documentation refinement.

The current public-repository documentation/refinement pass was assisted by **GPT-5.6 Sol**.

The workflow is deliberately human-directed: the repository maintainer defines product goals and acceptance criteria, decides which proposals to keep, controls merges and deployment, and performs the final product judgment. AI output is treated as engineering input to inspect and validate rather than as an authority.

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
├── content-system.js           # late-floor themes and guardian content bridge
├── desktop-controls.js         # gamepad and desktop input adapter
├── profiles/                   # production + deterministic regression profiles
├── art/                        # current art assets
├── test/                       # deterministic/headless regression harnesses
├── BALANCE_NOTES.md            # balance findings and human-play baseline
├── PRODUCTION_ROADMAP.md       # current post-launch priorities
└── RELEASE_NOTES_v1.0.0.md     # first public release record
```

The project is modularized **incrementally**. Systems move out of `game.js` when an active gameplay change creates a clear boundary; architecture work is expected to reduce regression risk rather than exist for its own sake.

## Release and validation

v1.0.0 established a complete public 1→100 route, static production package and deterministic release gates. The release record reports:

- production-entry contract: **24/24**;
- deterministic floor 1→100 victory chain: **13/13**;
- historical gameplay/save regression suite: **525/525**.

Post-launch work is tracked through Issues and `PRODUCTION_ROADMAP.md`. The main remaining quality targets are bespoke guardian/final-boss mechanics, milestone skill evolution, town progression identity, full-run human balance evidence and a more ambitious final visual pass.

## Contributing

Issues and focused pull requests are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making a large change.

A few project rules matter more than code style:

- Real player experience beats bot win-rate symmetry.
- Builds should change decisions, not only increase a score.
- Do not reintroduce player-selectable starting depths into the production route.
- Avoid large rewrites when a targeted, testable change is possible.
- Preserve compatible local saves whenever practical.

## Deployment

Dungeon Echo is intentionally backend-free. The game is deployed as static files at:

- **Play:** https://play.91hwl.cn/dungeon-echo/
- **Project page:** https://91hwl.cn/toys/dungeon-echo/

The deployment tooling stages an immutable release, verifies expected content, preserves the existing Web Toys tree and supports rollback on failed origin/public checks.

## License

MIT — see [`LICENSE`](LICENSE).
