# Repository maintenance

## Prune merged remote branches

The repository accumulated many short-lived `fix/`, `refactor/`, `perf/`, `release/`, `chore/` and similar branches. Git history and merged pull requests already preserve completed work, so completed remote branches should not remain indefinitely.

Preview the exact deletion set first:

```bash
bash ops/repo/prune-merged-branches.sh
```

Apply only the branches classified as safe:

```bash
bash ops/repo/prune-merged-branches.sh --apply
```

## Safety model

The script always excludes `main` and refreshes the complete `origin/*` branch namespace before classifying anything.

A branch is automatically deletable only when one of these is proven:

1. its current remote tip is already an ancestor of `origin/main`; or
2. GitHub CLI is installed/authenticated and its **current remote tip SHA exactly matches the head SHA of a merged pull request**.

The second rule matters because this repository commonly uses squash merges: a squash-merged branch normally diverges from `main` in Git ancestry even though its PR is complete.

When `gh` is available, any branch backing an open pull request is explicitly retained. A branch whose merged PR was followed by additional pushes is also retained because its current tip no longer matches the merged PR head SHA.

Anything not proven safe is printed under `manual_review_branches` and is not deleted by `--apply`.

If GitHub CLI is unavailable or unauthenticated, the script falls back to ancestry-only cleanup and leaves squash-merged branches for manual review rather than guessing.
