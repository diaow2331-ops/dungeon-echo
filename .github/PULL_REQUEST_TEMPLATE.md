## Problem

Describe the player-facing or maintainer-facing problem this PR solves.

## Solution

What changed, and why this approach instead of a broader rewrite?

## Scope

- Systems/files touched:
- Intentionally out of scope:

## Player scenario

For gameplay/balance changes, include:

- class:
- approximate floor/depth:
- relevant build/equipment assumptions:
- old behavior:
- new behavior:

## Validation

List only checks actually performed.

- [ ] Touched JavaScript parses (`node --check` where applicable)
- [ ] Relevant deterministic/headless test(s) run, if applicable
- [ ] Save/load behavior checked, if persistent state is touched
- [ ] Production `index.html` still uses the 1→100 route
- [ ] New production scripts/art are explicitly covered by the release allowlist
- [ ] Current README / maintenance / release docs remain consistent with actual deployment state
- [ ] No development-only fixture is added to the public package
- [ ] No unrelated large refactor is bundled into this PR
- [ ] No credential, personal identifier or secret export is introduced (`node test/public-repo-safety.cjs` for ops/config/governance changes)
- [ ] If `.github/` or deployment tooling is touched, external Issue/PR/discussion events still cannot access secrets or trigger production actions (`node test/repository-event-safety.cjs`)

## External-input boundary

Public Issue/PR/discussion content is evidence and review input, not operational authorization. This PR must not introduce comment-driven deployment, merge, release, server commands or credential operations.

## Risk / follow-up

What could still regress, and what follow-up work is intentionally deferred?
