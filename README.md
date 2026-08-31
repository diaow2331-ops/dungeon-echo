# 91hwl Games · 浏览器游戏仓库

**A multi-game, browser-native repository for 91hwl.cn. No launcher, no account, open and play.**

[91hwl Games](https://91hwl.cn/) · [Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Clock Out Alive](https://play.91hwl.cn/moyu/) · [Board Trio](https://play.91hwl.cn/board-games/)

This repository now owns three independently versioned games and the public-site release tooling. `games.json` is the repository-level game catalog; each game keeps its own version authority and immutable bundle builder.

| Game | Route | Version authority |
| --- | --- | --- |
| Dungeon Echo · 地牢回响 | `/dungeon-echo/` | `VERSION` |
| Clock Out Alive · 摸鱼到下班 | `/moyu/` | `moyu/VERSION` |
| Board Trio · 方寸棋局 | `/board-games/` | `board-games/VERSION` |

Dungeon Echo remains the legacy root-layout game for now; its single-authority architecture is documented below. New games live in self-contained directories so the repository can continue expanding without coupling their runtimes.

## Current architecture rule

The repository now follows one non-negotiable rule:

> **One responsibility has exactly one production authority.**

The authoritative map is machine-readable in [`docs/authority-map-v130.json`](docs/authority-map-v130.json) and explained in [`docs/ARCHITECTURE_SINGLE_AUTHORITY.md`](docs/ARCHITECTURE_SINGLE_AUTHORITY.md).

Current production ownership:

- gameplay state, combat, progression, economy, town behavior and gameplay persistence → `game/core/game.js`;
- dungeon/town Canvas rendering → `game/core/game.js`;
- keyboard/touch gameplay input → `game/core/game.js`;
- storage epoch reset before core boot → `game/core/production-bootstrap.js`;
- gamepad → canonical command transport only → `game/input/desktop-controls.js`;
- dynamic loading → presentation-only followers from `game/core/runtime-bootstrap.js`;
- fixed Chinese/English route navigation → `game/locale/fixed-locale-entry-v130.js`.

No production overlay may redraw/mask core entities. No follower may monkey-patch gameplay APIs, become a second gameplay storage writer or capture competing gameplay input.

## Quarantine: preserve work, do not execute it

The cleanup is not deleting previous work. Completed v1.2 systems, UI, input, localization, persistence shims and art runtimes are preserved under [`archive/quarantine-v130/`](archive/quarantine-v130/).

That archive includes previously implemented commerce, equipment, forge, progression, town, pressure/risk systems, shop/town UI, combat controls, locale interceptors and the detailed overlay art graph. The bytes are retained for reconstruction, but `archive/` is never shipped.

A quarantined feature returns by **porting its useful behavior/data/art into the sole owner for that responsibility**. The old wrapper is never simply re-enabled.

## Production baseline

The active immutable artifact is intentionally smaller while ownership is repaired. Canonical production art currently comes directly through core:

- `art/hero-atlas-v11.png`
- `art/monster-atlas-v11.png`
- `art/guardian-atlas-v11.png`
- `art/final-boss-v11.png`
- `art/town-backdrop-v11.webp`
- `art/loot-atlas.png`

The richer v1.2 overlay assets remain quarantined and can be promoted later only when the core renderer directly owns them.

## Storage reset

v1.3.0 uses storage epoch `v130`. Historical Dungeon Echo `de-*` gameplay state is deliberately cleared rather than migrated. Gameplay persistence belongs to core; old save-integrity and item-migration shims remain quarantine references only.

## Controls in the clean baseline

The clean baseline reports only controls currently owned by core:

| Action | Keyboard | Gamepad | Mobile |
| --- | --- | --- | --- |
| Move / face | Arrow keys / WASD | Stick / D-pad | Four-way D-pad |
| Basic attack | `J` | RT | Attack |
| Class skill | `K` (`C` alias) | X | Skill |
| Quick dive | `Shift+Enter` | LT | Quick dive |
| Wait | Space / `.` | B | Wait |
| Potion | `Q` | Y | Potion |
| Scroll | `E` | LB | Scroll |
| Return | `T` | Hold View | Return |
| Descend | `Enter` | A | Descend |
| Pause | `Esc` | Start | Pause |
| Sound | `M` | — | Sound |
| Fullscreen | `F` | RB | Fullscreen |

J Attack, K Skill and their Mana/ranged semantics are integrated directly in the sole input/combat owner; the historical competing module remains quarantined.

## Repository layout

```text
.
├── games.json                      # repository-level game catalog authority
├── index.html / game/ / art/       # Dungeon Echo legacy source root
├── moyu/                           # Clock Out Alive source root
├── board-games/                    # Board Trio source root
├── docs/                           # game + repository architecture contracts
├── test/                           # focused and aggregate contracts
├── ops/release/                    # immutable component/aggregate builders
├── ops/site-bundle/                # Dungeon Echo deployment
├── ops/moyu-bundle/                # Clock Out Alive deployment
└── ops/board-games-bundle/         # Board Trio deployment
```

`games.json` defines the three playable products and their version/build authorities. See [`docs/GAMES_REPOSITORY.md`](docs/GAMES_REPOSITORY.md). Dungeon Echo keeps its legacy root layout for compatibility; new games use self-contained directories.

## Development and restoration workflow

1. Start from the authority map.
2. Decide which responsibility a change belongs to.
3. Modify the sole owner, or introduce a narrow read-only/data helper with no competing state/input/render ownership.
4. If restoring historical work, port it from `archive/quarantine-v130/`; do not load the archived wrapper.
5. Run `node test/single-authority-v130.cjs`.
6. Build the immutable artifact with `ops/release/build-site-bundle.sh`.

See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) and [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).

## License

MIT — see [`LICENSE`](LICENSE).
