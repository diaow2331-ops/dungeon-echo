# Contributing to Dungeon Echo

Thanks for helping improve **Dungeon Echo / 地牢回响**.

The project is in active gameplay development. Small, focused changes are much easier to review than broad rewrites, especially while the 1→100 production curve is still being stabilized.

## Before opening a pull request

1. Check existing Issues first.
2. For balance or gameplay changes, describe the player-facing problem before proposing numbers.
3. For large changes, open an Issue before implementation so the design can be agreed on without wasting code work.
4. Keep the production route fixed to `classic-100`; short profiles are regression fixtures only.

## Project priorities

Current work is ordered roughly as follows:

- combat-rule correctness and readable counterplay;
- equipment/build identity;
- class progression and boss mechanics;
- 1→100 economy and difficulty;
- regression-test modernization;
- final art/UI only after systems stabilize.

See `PRODUCTION_ROADMAP.md` for details.

## Design rules

A contribution should normally preserve these principles:

- **Human experience first.** Bot/simulation results are diagnostic tools, not a target for equal class win rates.
- **Trade-offs over free power.** Strong effects should ask for positioning, resources, risk or opportunity cost.
- **Builds over score.** Equipment and talents should change decisions, not only increase one universal rating.
- **Readable danger.** Important enemy mechanics should be observable and learnable rather than unexplained random punishment.
- **One production journey.** Players start at floor 1 and progress toward floor 100. Returning to conquered checkpoints is allowed; skipping unconquered content is not.
- **Incremental modularization.** Do not rewrite `game.js` wholesale merely to improve architecture. Move a boundary when the affected system is already being changed.

## Development setup

No package install is required for the core game.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` for the production route or `/dev.html` for development profiles.

More details are in `DEVELOPMENT.md`.

## Testing expectations

Run only tests relevant to the change.

At minimum, JavaScript files you touch should parse successfully. Existing headless tests live under `test/`, but some were written for the older multi-profile production model and are being modernized; do not treat a stale assertion as permission to change the production design back to match the test.

For gameplay changes, include the exact scenario you checked: class, approximate floor, equipment/build assumptions and what changed in player behavior.

## Pull requests

Keep each PR centered on one problem. A good PR description contains:

- the player/developer problem;
- the chosen solution;
- files/systems touched;
- targeted validation performed;
- known follow-up work that is intentionally out of scope.

Avoid unrelated formatting or refactors in the same PR.

## Commit messages

Short conventional-style prefixes are preferred when useful:

```text
fix(combat): ...
balance(equipment): ...
feat(progression): ...
refactor(town): ...
docs: ...
test: ...
```

## Art and UI contributions

Visual fixes that solve a functional problem are welcome now. Large visual redesigns should generally wait for the final art/UI phase so gameplay changes do not repeatedly invalidate the work.

## License

By contributing, you agree that your contribution may be distributed under the repository's MIT License.
