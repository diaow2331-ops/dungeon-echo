#!/usr/bin/env bash
set -euo pipefail

apply=false
case "${1:-}" in
  '') ;;
  --apply) apply=true ;;
  *) echo "usage: $0 [--apply]" >&2; exit 2 ;;
esac

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

git remote get-url origin >/dev/null
git fetch --prune origin main
base=origin/main

mapfile -t candidates < <(
  git for-each-ref --format='%(refname:strip=3)' refs/remotes/origin |
    sort -u |
    while IFS= read -r branch; do
      case "$branch" in
        ''|HEAD|main) continue ;;
      esac
      if git merge-base --is-ancestor "origin/$branch" "$base" 2>/dev/null; then
        printf '%s\n' "$branch"
      fi
    done
)

printf 'base=%s\n' "$base"
printf 'merged_remote_branches=%d\n' "${#candidates[@]}"
for branch in "${candidates[@]}"; do printf '  %s\n' "$branch"; done

if ! $apply; then
  echo 'mode=DRY_RUN'
  echo 'Re-run with --apply to delete only the branches listed above.'
  exit 0
fi

for branch in "${candidates[@]}"; do
  git push origin --delete "$branch"
done

echo 'mode=APPLY'
echo "deleted_remote_branches=${#candidates[@]}"
