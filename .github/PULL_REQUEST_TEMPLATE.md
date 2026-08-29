## Problem

Describe the player-facing or maintainer-facing problem this PR solves.

## Responsibility / authority impact

- Responsibility being changed:
- Current sole owner from `docs/authority-map-v130.json`:
- Does this PR introduce a new writer, renderer, gameplay input handler, persistence writer or runtime wrapper? **Must be no unless ownership is intentionally replaced.**
- If restoring quarantined work, source path under `archive/quarantine-v130/`:
- How was the useful behavior/data/art ported into the sole owner instead of re-enabling the old wrapper?

## Solution

What changed and why this preserves one responsibility → one production authority.

## Scope

- Active production files touched:
- Quarantine/reference files touched:
- Intentionally out of scope:

## Validation

- [ ] `node test/single-authority-v130.cjs`
- [ ] No `archive/` path was added to `ops/release/static-files.txt`
- [ ] No `game/systems/` wrapper was reintroduced to production
- [ ] No follower monkey-patches gameplay APIs
- [ ] No second dungeon/town Canvas owner was introduced
- [ ] No second gameplay localStorage writer was introduced
- [ ] No competing gameplay key/touch handler was introduced
- [ ] Production source equals artifact; build tooling does not rewrite the dependency graph
- [ ] Relevant focused gameplay test run if gameplay semantics changed
- [ ] Public repository safety checks run if ops/governance changed

## Release / online acceptance

For a deployable change, CI PASS is not final acceptance. Record the immutable artifact, deployment health check and public-site verification separately.

## Risk / follow-up

What functionality remains quarantined or intentionally deferred?
