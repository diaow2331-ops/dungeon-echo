# Repository maintenance

## Prune merged remote branches

The repository accumulated many short-lived `fix/`, `refactor/`, `perf/`, `release/` and `chore/` branches. Git history and merged pull requests already preserve those changes, so fully merged remote branches should not remain indefinitely.

Preview the exact safe deletion set:

```bash
bash ops/repo/prune-merged-branches.sh
```

Delete only branches whose tips are already ancestors of `origin/main`:

```bash
bash ops/repo/prune-merged-branches.sh --apply
```

The script always excludes `main` and never deletes a branch with commits that are not reachable from `origin/main`. Diverged/unmerged branches require manual review instead of automatic deletion.
