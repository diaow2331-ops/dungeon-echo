# Contributing to Dungeon Echo

Thanks for helping improve **Dungeon Echo / 地牢回响**.

Dungeon Echo is a publicly deployed browser roguelike in active post-launch development. The production 1→100 route is established; current work focuses on deeper boss encounters, long-run progression, town identity, full-run human balance evidence and visual refinement.

Small, focused changes are usually easier to review and safer to validate than broad rewrites.

## Before opening a pull request

1. Check existing Issues and `PRODUCTION_ROADMAP.md` first.
2. For gameplay/balance changes, describe the player-facing problem before proposing numbers.
3. For large design changes, open an Issue first so the intended player behavior is clear before implementation.
4. Keep the production route fixed to `classic-100`; short profiles are deterministic development fixtures only.
5. Preserve compatible browser saves whenever practical.

## Current priorities

Current post-launch work is roughly ordered around:

- bespoke ten-floor guardian and floor-100 boss mechanics;
- milestone skill evolution without expanding the hotkey bar;
- town/service progression and preparation clarity;
- full 1→100 human economy/difficulty evidence;
- deeper character, equipment, enemy, boss and town presentation;
- targeted regression/tooling improvements when they reduce real maintenance risk.

See `PRODUCTION_ROADMAP.md` for the current plan.

## Design rules

A contribution should normally preserve these principles:

- **Human experience first.** Bot/simulation results are diagnostic evidence, not a target for equal class win rates.
- **Trade-offs over free power.** Strong effects should ask for positioning, resources, risk or opportunity cost.
- **Builds over score.** Equipment and talents should change decisions, not only increase one universal rating.
- **Readable danger.** Important enemy mechanics should be observable and learnable rather than unexplained random punishment.
- **One production journey.** Players start at floor 1 and progress toward floor 100. Returning to conquered checkpoints is allowed; skipping unconquered content is not.
- **Incremental modularization.** Do not rewrite `game.js` wholesale merely to improve architecture. Extract a boundary when the affected system has a real responsibility.
- **Visual clarity serves gameplay.** Art, VFX and UI should make classes, equipment and encounter states easier to read, not obscure the grid.

## Development setup

No package install is required for the core game.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` for the production route or `/dev.html` for development fixtures.

More details are in `DEVELOPMENT.md` and `MAINTENANCE.md`.

## Testing expectations

Run the smallest set of checks that can detect the regression your change could introduce.

At minimum, JavaScript files you touch should parse successfully. The main release-oriented checks are documented in `DEVELOPMENT.md`.

Short profiles remain useful deterministic fixtures, but they are not the public product contract. Do not change production design merely to satisfy a fixture assumption that no longer represents `classic-100`.

For gameplay changes, include the exact scenario you checked when possible:

- class;
- approximate floor;
- relevant equipment/build assumptions;
- old player behavior;
- new player behavior;
- resource/positioning consequences.

For visual work, include the mechanic/readability goal as well as appearance changes.

## Pull requests

Keep each PR centered on one problem. A useful PR description contains:

- the player/developer problem;
- the chosen solution and why;
- files/systems touched;
- targeted validation actually performed;
- known follow-up work intentionally left out.

Avoid unrelated formatting or refactors in the same PR.

## Commit messages

Short conventional-style prefixes are preferred when useful:

```text
fix(combat): ...
balance(equipment): ...
feat(progression): ...
feat(boss): ...
refactor(town): ...
art: ...
docs: ...
test: ...
```

## Art and UI contributions

The project is now in a stage where substantial visual refinement is valid, provided it follows stable gameplay responsibilities.

High-value areas include:

- four-class in-dungeon identity;
- six-slot equipment and mechanic-trait feedback;
- chapter enemy silhouettes;
- unique guardian/final-boss presentation and telegraphs;
- town service/building identity and progression changes;
- desktop HUD hierarchy, comparison UI, particles and audio feedback.

Avoid purely decorative effects that make paths, danger states or turn information harder to read.

## AI-assisted contributions

AI-assisted engineering is allowed. If AI tools materially contribute to a change, the contributor remains responsible for understanding the result, validating relevant behavior and avoiding false claims about provenance or endorsement.

See `AI_COLLABORATION.md` for this repository’s documented collaboration model.

## License

By contributing, you agree that your contribution may be distributed under the repository's MIT License.
