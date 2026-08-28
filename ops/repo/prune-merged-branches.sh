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
# Refresh the complete remote branch namespace. A main-only fetch is insufficient for pruning.
git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*'
base=origin/main

declare -A reason=()
declare -a candidates=()
declare -a review=()

gh_ready=false
repo_slug=''
if command -v gh >/dev/null 2>&1 && gh auth status -h github.com >/dev/null 2>&1; then
  if repo_slug="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)" && [[ -n "$repo_slug" ]]; then
    gh_ready=true
  fi
fi

mapfile -t branches < <(
  git for-each-ref --format='%(refname:strip=3)' refs/remotes/origin |
    sort -u
)

for branch in "${branches[@]}"; do
  case "$branch" in
    ''|HEAD|main) continue ;;
  esac

  current_sha="$(git rev-parse "origin/$branch")"

  # Never auto-delete a branch that still backs an open PR.
  if $gh_ready; then
    open_count="$(gh pr list --repo "$repo_slug" --state open --head "$branch" --limit 100 --json number --jq 'length')"
    if [[ "$open_count" != '0' ]]; then
      review+=("$branch")
      reason["$branch"]="open_pr"
      continue
    fi
  fi

  # Traditional merge/rebase case: branch tip is reachable from main.
  if git merge-base --is-ancestor "origin/$branch" "$base" 2>/dev/null; then
    candidates+=("$branch")
    reason["$branch"]="ancestor_of_main"
    continue
  fi

  # Squash-merge case: Git ancestry diverges, so require the current remote tip to
  # exactly match a head SHA recorded on a merged PR. If anyone pushed new commits
  # after that PR merged, the SHA no longer matches and the branch stays for review.
  if $gh_ready; then
    merged_pr="$(
      gh pr list --repo "$repo_slug" --state merged --head "$branch" --limit 100 \
        --json number,headRefOid,mergedAt \
        --jq ".[] | select(.headRefOid == \"$current_sha\") | .number" |
        head -n 1
    )"
    if [[ -n "$merged_pr" ]]; then
      candidates+=("$branch")
      reason["$branch"]="merged_pr#$merged_pr"
      continue
    fi
  fi

  review+=("$branch")
  if $gh_ready; then
    reason["$branch"]="not_proven_merged"
  else
    reason["$branch"]="not_ancestor;_gh_unavailable_for_squash_check"
  fi
done

printf 'base=%s\n' "$base"
printf 'gh_pr_detection=%s\n' "$($gh_ready && echo enabled || echo disabled)"
if $gh_ready; then
  printf 'repository=%s\n' "$repo_slug"
else
  echo 'note=GitHub CLI is unavailable or unauthenticated; squash-merged branches remain in manual review.'
fi

printf 'safe_delete_branches=%d\n' "${#candidates[@]}"
for branch in "${candidates[@]}"; do
  printf '  %s\t%s\n' "$branch" "${reason[$branch]}"
done

printf 'manual_review_branches=%d\n' "${#review[@]}"
for branch in "${review[@]}"; do
  printf '  %s\t%s\n' "$branch" "${reason[$branch]}"
done

if ! $apply; then
  echo 'mode=DRY_RUN'
  echo 'Re-run with --apply to delete only safe_delete_branches listed above.'
  exit 0
fi

for branch in "${candidates[@]}"; do
  git push origin --delete "$branch"
done

echo 'mode=APPLY'
echo "deleted_remote_branches=${#candidates[@]}"
echo "remaining_manual_review=${#review[@]}"
