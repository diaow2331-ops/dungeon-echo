# Dungeon Echo · 地牢回响

**A browser-native 100-floor turn-based roguelike about builds, risk, retreat and greed.**

[91hwl Games](https://91hwl.cn/) · [Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Play in English](https://play.91hwl.cn/dungeon-echo/en/) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Live:** Dungeon Echo **v1.2.10** is deployed publicly. Chinese and English fixed routes, shared browser saves, the Return Scroll flow, the bounded town workspace and representative PC/mobile use have completed launch acceptance.

![Dungeon Echo title artwork](art/title-backdrop.webp)

Dungeon Echo is a vanilla HTML/CSS/JavaScript roguelike built around one continuous journey from **floor 1 to floor 100**:

`descend → fight → loot → decide whether to push deeper → return safely → secure the build → descend again`

No launcher, account or runtime backend is required. Open the page and play; compatible progress is stored in browser `localStorage`.

## Why play it?

- **100-floor campaign** with earned checkpoints, ten-floor guardian milestones and a three-phase floor-100 finale.
- **Four classes** — Warrior, Ranger, Arcanist and Assassin — with different combat rhythms.
- **Build-driven equipment** across six slots, rarity/affix tradeoffs, forging and refinement.
- **Greedy Expedition** risk loop: push deeper with carried loot, or spend a Return Scroll to secure it in town.
- **Town workspace** with compact Gear & Stash, Market, Fortune and Progress panels instead of a long scrolling document UI.
- **Skill evolution at 20 / 40 / 60 / 80**, explicit `J` Attack / `K` Skill combat and class-specific Mana.
- **PC + mobile + gamepad**, fullscreen support, adaptive procedural BGM and independent Music/SFX controls.
- **Fixed Chinese and English routes** on the same origin with shared compatible saves.
- **Open source** under MIT, with engineering/release decisions documented in this repository.

## Start here

The repository is folder-first: all active JavaScript lives under `game/`, so visitors do not have to scroll through dozens of loose runtime files.

- [`index.html`](index.html) — fixed Chinese production source entry.
- [`en/index.html`](en/index.html) — fixed English production source entry; shares the same gameplay graph and saves.
- [`game/core/`](game/core/) — engine, boot, save integrity, runtime bootstrap and release boundary.
- [`game/systems/`](game/systems/) — equipment, town, commerce, progression, encounters and gameplay owners.
- [`game/input/`](game/input/) — keyboard/gamepad and combat input ownership.
- [`game/locale/`](game/locale/) — fixed-route locale data and exact screen/Canvas sinks.
- [`game/ui/`](game/ui/) — bounded presentation owners, including responsive/mobile UX and the current town workspace.
- [`art/`](art/) — production artwork.
- [`docs/`](docs/) — engineering, maintenance, design and release documentation.
- [`test/`](test/) — deterministic repository/gameplay contracts.
- [`ops/`](ops/) — immutable-artifact release, deployment, rollback and repository-maintenance tooling.
- [`archive/`](archive/) — retired runtime/history; nothing here is loaded by production.

The repository root intentionally contains **zero active `.js` files**. New runtime code belongs under the appropriate `game/` ownership directory.

## Controls

| Action | Keyboard | Gamepad | Mobile |
| --- | --- | --- | --- |
| Move / face | Arrow keys / WASD | Stick / D-pad | Four-way D-pad |
| Attack | `J` | RT | Attack |
| Class skill | `K` | X | Skill |
| Wait / focus | Space / `.` | B | — |
| Potion | `Q` | Y | Potion |
| Scroll | `E` | LB | Scroll |
| Return to town | `T` | Hold View | Return |
| Descend | `Enter` | A | Descend |
| Pause | `Esc` | Start | Pause |
| Master mute | `M` | — | Sound |
| Fullscreen | `F` | RB | Fullscreen |

## Language and saves

`/dungeon-echo/` is the fixed Chinese route and `/dungeon-echo/en/` is the fixed English route. Language switching is navigation, not whole-page live translation.

Both routes keep the same `de-run-v6`, `de-greedy-meta-v1` and related gameplay namespaces. `stable-item-id-migration-v150.js` adds language-neutral display IDs without destructively renaming historical stored items. v1.2.10 does not require a progress reset.

## Run locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/en/
http://localhost:8000/dev.html
```

`dev.html` is an internal deterministic harness and is excluded from production packaging.

## Repository layout

```text
.
├── index.html
├── en/
├── game/
│   ├── core/
│   ├── systems/
│   ├── input/
│   ├── locale/
│   └── ui/
├── profiles/
├── art/
├── docs/
├── test/
├── ops/
├── archive/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── VERSION
```

## Validation and release governance

Engineering checks protect contracts but do not replace human playtesting. Launch acceptance now covers the fixed Chinese/English routes, Return Scroll town transition, save continuity, town presentation and representative desktop/mobile use. Long-run balance/economy/guardian evidence remains intentionally tracked as post-launch validation rather than a launch blocker.

`VERSION` is the semantic release authority. The deployed v1.2.10 line currently uses public runtime cache generation **155**; semantic and cache generations are intentionally independent.

Production release governance follows one rule: **build elsewhere, deploy artifacts only**. The server receives a validated immutable ZIP and only performs checksum verification, staging/backup, atomic activation, health checks and rollback. It must not fetch Git, build, patch or transform production content. See [`.agents/skills/91hwl-static-release/SKILL.md`](.agents/skills/91hwl-static-release/SKILL.md).

Release notes: [`docs/releases/RELEASE_NOTES_v1.2.10.md`](docs/releases/RELEASE_NOTES_v1.2.10.md).

## Contributing

Focused issues and pull requests are welcome. Post-launch development is evidence-driven: player report → reproducible issue → smallest useful fix → focused validation → patch release.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) before changing production ownership or persistent state.

## AI-assisted development

OpenAI ChatGPT has been used as an engineering collaborator for repository inspection, debugging, gameplay/economy reasoning, localization architecture, deployment review and release governance. See [`docs/AI_COLLABORATION.md`](docs/AI_COLLABORATION.md).

## License

MIT — see [`LICENSE`](LICENSE).
