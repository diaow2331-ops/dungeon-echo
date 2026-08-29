# Dungeon Echo · 地牢回响

**A browser-native 100-floor turn-based roguelike about builds, risk, retreat and greed.**

[91hwl Games](https://91hwl.cn/) · [Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Play in English](https://play.91hwl.cn/dungeon-echo/en/) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Release candidate:** Dungeon Echo **v1.3.0** resets the production architecture to one authoritative Canvas renderer and one clean browser-storage epoch. Public runtime cache generation is **168**.

![Dungeon Echo title artwork](art/title-backdrop.webp)

Dungeon Echo is a vanilla HTML/CSS/JavaScript roguelike built around one continuous journey from **floor 1 to floor 100**:

`descend → fight → loot → decide whether to push deeper → return safely → secure the build → descend again`

## Why play it?

- **100-floor campaign** with ten-floor guardian milestones and a Floor-100 finale.
- **Four classes** — Warrior, Ranger, Arcanist and Assassin — with distinct combat rhythms.
- **Build-driven equipment** across six slots, rarity/affix tradeoffs, forging and refinement.
- **Greedy Expedition** risk loop: push deeper with carried loot or return safely to town.
- **Town workspace** for gear, stash, market, fortune and progression.
- **Skill evolution at 20 / 40 / 60 / 80**, `J` Attack / `K` Skill combat and class-specific Mana.
- **PC + mobile + gamepad**, fullscreen support, procedural BGM and independent Music/SFX controls.
- **Fixed Chinese and English routes** on the same origin.
- **Open source** under MIT.

## v1.3.0 authority model

The v1.2 line accumulated several presentation layers that could draw or intercept the same Canvas. v1.3.0 removes that structure instead of adding another compatibility patch.

- `game/core/game.js` is the **only dungeon/town Canvas render owner**.
- Historical art overlays, Canvas monkey patches and presentation coordinators are removed from the active tree and release artifact.
- Production no longer ships the old `art/runtime/` overlay asset graph.
- Canonical hero, monster, guardian, final-boss and town art is rendered directly by core.
- The runtime bootstrap may load DOM/UI helpers, but those helpers do not own dungeon/town Canvas rendering.

## Storage reset

v1.3.0 starts storage epoch `v130`.

On the first v1.3.0 visit, prior Dungeon Echo `de-*` browser storage is cleared. Historical save-integrity and migration shims are not loaded or shipped. **New Adventure** performs a full Dungeon Echo reset, including Greedy Expedition meta, and begins with a fresh seed.

This means **v1.2 browser progress is intentionally not migrated into v1.3.0**.

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

Active production JavaScript belongs under `game/`. Retired runtime history belongs in Git history or `archive/`, never in the production dependency graph.

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

## Language

`/dungeon-echo/` is the fixed Chinese route and `/dungeon-echo/en/` is the fixed English route. Language switching is navigation, not whole-page live translation.

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

## Validation and release governance

The focused v1.3.0 release contract verifies the single-authority runtime, clean storage epoch, retained combat/expedition contracts and the final immutable ZIP. The artifact itself must reject all retired overlay and save-migration files.

`VERSION` is the semantic release authority. v1.3.0 uses public runtime cache generation **168**.

Production follows one rule: **build elsewhere, deploy artifacts only**. The server verifies checksums, stages the artifact, atomically activates it, runs health checks and rolls back on failure. It does not fetch Git or build production content.

Release notes: [`docs/releases/RELEASE_NOTES_v1.3.0.md`](docs/releases/RELEASE_NOTES_v1.3.0.md).

## Contributing

Focused issues and pull requests are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) before changing production ownership or persistent state.

## AI-assisted development

OpenAI ChatGPT has been used as an engineering collaborator for repository inspection, debugging, gameplay/economy reasoning, localization architecture, deployment review and release governance. See [`docs/AI_COLLABORATION.md`](docs/AI_COLLABORATION.md).

## License

MIT — see [`LICENSE`](LICENSE).
