# 地牢回响 · Dungeon Echo

A browser-first 100-floor roguelike built with vanilla HTML, CSS and JavaScript.

> **Project status:** **v1.0.0 release candidate**. The production route, first public art pass and deterministic release gates are complete; public deployment is the remaining launch step.

## What is Dungeon Echo?

**地牢回响 / Dungeon Echo** is a turn-based browser roguelike focused on a single continuous descent from **floor 1 to floor 100**.

The main design question is not simply “can you clear the next room?” but:

**How much longer are you willing to stay underground before taking your loot home?**

The Greedy Expedition loop is built around that decision:

`descend → fight → loot → decide whether to push deeper → return to town → secure and improve your build → descend again`

## Current gameplay

- One production journey: **1 → 100 floors**.
- Four classes with different risk/reward profiles:
  - Warrior — durable melee pressure and cleave.
  - Ranger — positioning, kiting and sustained ranged damage.
  - Arcanist — fragile ranged burst and cooldown management.
  - Assassin — high-risk burst, mobility and execution.
- Six equipment slots: weapon, armor, helmet, boots, ring and amulet.
- Affixes including attack, defense, HP, crit, lifesteal, thorns, kill-heal and gold gain.
- Greedy Expedition town loop with stash, bank, supplies, forging and a deliberately negative-EV fortune wheel.
- Return-scroll risk management: bank loot before death takes the run inventory and carried gold.
- Conquered-depth checkpoints so returning to town does not require replaying every cleared floor.
- Talents and class-oriented progression.
- Ten-floor chapter / guardian cadence with a floor-100 finale.
- Keyboard, mouse/touch and native Gamepad API support.
- Local saves through `localStorage`; the core game requires no account or backend.

## Production vs. development entry points

- `index.html` — production entry. Fixed to the `classic-100` profile and the 1→100 journey.
- `dev.html` — internal development entry. Keeps short profiles for deterministic regression and balance work.

The short `classic-10` … `classic-60` profiles are **test fixtures**, not player-selectable game modes.

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
├── game.js                     # legacy core: state/map/turn loop; gradually being reduced
├── gameplay-tuning.js          # production rules and human-first class tuning
├── equipment-system.js         # equipment generation/value/deep-floor scaling
├── progression-system.js       # talents and long-run progression
├── town-system.js              # town and conquered-depth return flow
├── content-system.js           # late-floor/chapter content extensions
├── desktop-controls.js         # gamepad and desktop input adapter
├── profiles/                   # production + regression profiles
├── art/                        # current art assets
├── test/                       # deterministic/headless regression harnesses
├── BALANCE_NOTES.md            # human-play balance baseline
└── PRODUCTION_ROADMAP.md       # production priorities and definition of done
```

The project is being modularized **incrementally**. We do not plan a big-bang rewrite of `game.js`; systems are moved out when they are actively changed.

## Release status

The v1.0.0 production package is a dependency-free static build with an explicit file allowlist, deterministic module order and an immutable-release Nginx template. The release gates cover the public entry contract, all 100 floors and the historical regression suite.

The first release intentionally leaves deeper skill evolution, further boss presentation work and extended real-player balance telemetry as post-launch improvements. See [`RELEASE_NOTES_v1.0.0.md`](RELEASE_NOTES_v1.0.0.md), [`PRODUCTION_ROADMAP.md`](PRODUCTION_ROADMAP.md) and [`BALANCE_NOTES.md`](BALANCE_NOTES.md).

## Contributing

Issues and focused pull requests are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making a large change.

A few project rules matter more than code style:

- Real player experience beats bot win-rate symmetry.
- Builds should change decisions, not only increase a score.
- Do not reintroduce player-selectable starting depths into the production route.
- Avoid large rewrites when a targeted, testable change is possible.
- Gameplay and systems are stabilized before the final art/UI pass.

## Deployment target

Dungeon Echo is intentionally backend-free. The production allowlist can be staged as an immutable static release behind Nginx/CDN without Node, PHP, an API or a database.

The planned public mount is `https://91hwl.cn/dungeon-echo/`. It will be changed to a verified Play link only after the live TLS/cache/content checks pass.

## License

MIT — see [`LICENSE`](LICENSE).
