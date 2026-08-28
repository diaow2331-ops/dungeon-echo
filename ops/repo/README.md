# Repository maintenance

Dungeon Echo is a public post-launch repository. `main` is the only long-lived production branch. Feature, fix, performance, documentation and release branches are temporary review vehicles and should be removed after merge.

## Branch policy

Expected steady state:

```text
main
```

A short-lived branch may exist while a focused PR is open. Once that PR is merged or abandoned, the remote branch should be deleted.

Do not keep completed `fix/`, `refactor/`, `perf/`, `release/`, `chore/`, `hotfix/` or similar branches as pseudo-archives. Git commits, merged PRs, release notes and `archive/` already preserve the relevant history.

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

## Post-launch maintenance rule

After public launch, repository maintenance should follow this sequence:

```text
player evidence → focused issue → short-lived branch → focused PR → squash merge → delete branch
```

No open PR normally means no non-`main` work branch should remain.
