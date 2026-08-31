# Repository maintenance

Dungeon Echo is a public post-launch repository. `main` is the only long-lived production branch. Feature, fix, performance, documentation and release branches are temporary review vehicles and should be removed after merge.

## Branch policy

Expected steady state:

```text
main
```

A short-lived branch may exist while a focused PR is open. Once that PR is merged or abandoned, the remote branch should be deleted.

Do not keep completed `fix/`, `refactor/`, `perf/`, `release/`, `chore/`, `hotfix/` or similar branches as pseudo-archives. Git commits, merged PRs, release notes and `archive/` already preserve the relevant history.


## Main protection

`main` is protected at the GitHub repository level. Direct pushes, force pushes and branch deletion
are blocked; changes must arrive through a pull request. Zero approving reviews are required because
this is currently a solo-maintained repository, and no Actions status check is required while hosted
Actions quota is unavailable. Required status checks may be enabled again only when they can actually
run.

Repository merge policy keeps squash/rebase available, disables merge commits, enables branch updates,
and deletes merged head branches automatically.

## Prune merged remote branches

The repository includes a squash-aware pruning helper:

```bash
bash ops/repo/prune-merged-branches.sh
```

This is always a dry run. Review the exact `safe_delete_branches` list first.

Apply only the branches proven safe:

```bash
bash ops/repo/prune-merged-branches.sh --apply
```

## Safety model

The script always excludes `main` and refreshes the complete `origin/*` branch namespace before classifying anything.

A branch is automatically deletable only when one of these is proven:

1. its current remote tip is already an ancestor of `origin/main`; or
2. GitHub CLI is installed/authenticated and its **current remote tip SHA exactly matches the head SHA of a merged pull request**.

The second rule matters because this repository normally uses squash merge: a squash-merged branch diverges from `main` in Git ancestry even though its PR is complete.

When `gh` is available, any branch backing an open pull request is explicitly retained. A branch whose merged PR was followed by additional pushes is also retained because its current tip no longer matches the merged PR head SHA.

Anything not proven safe is printed under `manual_review_branches` and is not deleted by `--apply`.

If GitHub CLI is unavailable or unauthenticated, the script falls back to ancestry-only cleanup and leaves squash-merged branches for manual review rather than guessing.

## Public-history policy

This repository uses squash merges, so PR titles normally become the visible `main` commit titles.

Public history should therefore use concise English Conventional Commit-style titles. Placeholder/process titles (`temp`, `wip`, `try again`, migration mechanics, tool/session IDs, mixed-language scratch notes) are not acceptable for new PRs.

Historical commit titles are not rewritten merely for cosmetics: rewriting them would change commit SHAs and break release/PR/audit references. Product identity is defined by the current README, release notes and roadmap. Migration commits remain provenance only.

See `CONTRIBUTING.md` for title examples and the complete branch lifecycle policy.

## Multi-game isolation

`games.json` is the product catalog authority. Each game keeps its own version authority and immutable builder. Source roots must not import another game's runtime. Run `bash ops/repo/check-game-boundaries.sh` for any multi-game or catalog change.

Do not create a shared runtime as a shortcut. Shared code requires an explicit authority decision and an updated boundary contract.

## Post-launch maintenance rule

After public launch, repository maintenance should follow this sequence:

```text
player evidence → focused issue → short-lived branch → focused PR → squash merge → delete branch
```

No open PR normally means no non-`main` work branch should remain.

## Security release gates

Before operations/release changes are merged, run node test/public-repo-safety.cjs and node test/play-release-root-policy.cjs in addition to the current suite. Public site contact routes must remain repository-based, and component deployers must use the canonical play-root policy.
