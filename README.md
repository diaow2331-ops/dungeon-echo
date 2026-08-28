# Dungeon Echo · 地牢回响

**A browser-native 100-floor turn-based roguelike about builds, risk, retreat and greed.**

[Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Play in English](https://play.91hwl.cn/dungeon-echo/en/) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Status:** v1.2.9 is the current repository release line. Public deployment is complete only after the game-only bundle, version endpoint and health checks pass. Compatible browser saves remain valid.

![Dungeon Echo title artwork](art/title-backdrop.webp)

Dungeon Echo is a vanilla HTML/CSS/JavaScript roguelike built around one continuous journey from **floor 1 to floor 100**:

`descend → fight → loot → decide whether to push deeper → return safely → secure the build → descend again`

No account or runtime backend is required. Saves live in browser `localStorage`.

## Start here

The repository is folder-first: all active JavaScript lives under `game/`, so a new visitor does not have to scroll through dozens of loose runtime files.

- [`index.html`](index.html) — fixed Chinese production entry.
- [`en/index.html`](en/index.html) — fixed English production entry; shares the same gameplay graph and saves.
- [`game/`](game/) — all active game JavaScript.
  - [`game/core/`](game/core/) — core engine, production bootstrap, save guard, runtime bootstrap and current release stamp.
  - [`game/systems/`](game/systems/) — gameplay owners for equipment, town, commerce, progression, encounters and balance pressure.
  - [`game/input/`](game/input/) — keyboard/gamepad and J/K + Mana input ownership.
  - [`game/locale/`](game/locale/) — fixed-route locale data, stable display IDs and exact English screen/Canvas sinks.
  - [`game/ui/`](game/ui/) — bounded presentation followers such as audio, mobile UX, onboarding, help and visual feedback.
- [`profiles/`](profiles/) — production and deterministic development profiles.
- [`art/`](art/) — production artwork.
- [`docs/`](docs/) — current engineering, maintenance, localization and design documentation.
- [`test/`](test/) — deterministic repository and gameplay contracts.
- [`ops/`](ops/) — release, deployment, rollback and repository-maintenance tooling.
- [`archive/`](archive/) — retired runtime and historical release stamps kept for provenance; nothing here is loaded by production.

The core turn/map engine is [`game/core/game.js`](game/core/game.js). Fixed-route render owners live under `game/locale/`, while the retired translation-after-render stack is quarantined under `archive/runtime/` and is neither loaded nor shipped.

For engineering details, read [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) and [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md). Historical release notes are collected under [`docs/releases/`](docs/releases/).

## What is in the game?

- One production route: **1 → 100**, with earned checkpoints rather than paid skips.
- Four classes: **Warrior, Ranger, Arcanist, Assassin**.
- Six equipment slots with rarity, affixes, forging and build tradeoffs.
- Greedy Expedition town loop with safe storage, finite supplies and commerce.
- Skill evolution at **20 / 40 / 60 / 80**.
- Guardians at each tenth-floor milestone and a three-phase floor-100 finale.
- Explicit **J Attack / K Skill** combat with class-specific Mana.
- Adaptive procedural BGM with independent Music/SFX controls.
- Keyboard/mouse, Gamepad API and portrait/landscape touch support.
- Fixed Chinese and English routes on the same origin with shared gameplay/save data.

## Controls

| Action | Keyboard | Gamepad | Mobile |
| --- | --- | --- | --- |
| Move / face | Arrow keys / WASD | Stick / D-pad | Four-way D-pad |
| Attack | `J` | RT | Attack |
| Class skill | `K` | X | Skill |
| Wait / focus | Space / `.` | B | Not exposed on touch D-pad |
| Potion | `Q` | Y | Potion |
| Scroll | `E` | LB | Scroll |
| Return to town | `T` | Hold View | Return |
| Descend | `Enter` | A | Descend |
| Pause | `Esc` | Start | Pause |
| Master mute | `M` | — | Sound |
| Fullscreen | `F` | RB | Fullscreen |

## Language and saves

`/dungeon-echo/` is the fixed Chinese route and `/dungeon-echo/en/` is the fixed English route. Legacy `?lang=` links redirect to those paths. Language switching is navigation, not live whole-page translation.

Both routes keep the same `de-run-v6`, `de-greedy-meta-v1` and other gameplay namespaces. `stable-item-id-migration-v150.js` adds language-neutral item IDs without renaming historical stored items. v1.2.9 does not require a progress reset.

## Run locally

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
http://localhost:8000/en/
http://localhost:8000/dev.html
```

`dev.html` is an internal short-profile harness and is intentionally excluded from the production release package.

## Repository layout

```text
.
├── index.html                 # Chinese production entry
├── en/                        # English production entry
├── game/
│   ├── core/                  # engine / boot / save / runtime boundary
│   ├── systems/               # gameplay owners
│   ├── input/                 # keyboard + gamepad + combat input
│   ├── locale/                # fixed-route display ownership
│   └── ui/                    # bounded presentation followers
├── profiles/                  # production + dev profiles
├── art/                       # production artwork
├── docs/                      # current documentation + releases
├── test/                      # deterministic contracts
├── ops/                       # build/deploy/rollback/repo tooling
├── archive/                   # historical code; never production
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── VERSION
```

The repository root intentionally contains **zero active `.js` files**. New JavaScript must be placed under the appropriate `game/` ownership folder rather than reintroducing root-level clutter. The production entries reference those organized paths directly; there is no compatibility copy or duplicate runtime at root.

## Validation and release boundary

Engineering checks protect contracts but do not replace human playtesting. High-value checks cover 1→100 descent, save compatibility, Return Scroll extraction, fixed-route localization, input/mana, equipment, mobile UX and release packaging.

`VERSION` is the semantic release authority. v1.2.9 uses static cache generation **153**; those numbers are intentionally independent. The game-only package is built by `ops/release/build-site-bundle.sh` and overlays only `/dungeon-echo/`, preserving the existing site and Moyu release tree.

Release notes: [`docs/releases/RELEASE_NOTES_v1.2.9.md`](docs/releases/RELEASE_NOTES_v1.2.9.md).

## Contributing

Focused issues and pull requests are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) before changing production ownership or persistent state.

## AI-assisted development

OpenAI ChatGPT has been used as an engineering collaborator for repository inspection, debugging, gameplay/economy reasoning, deployment review, localization architecture and release governance. See [`docs/AI_COLLABORATION.md`](docs/AI_COLLABORATION.md).

## License

MIT — see [`LICENSE`](LICENSE).
