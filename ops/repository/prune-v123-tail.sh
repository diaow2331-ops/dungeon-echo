#!/usr/bin/env bash
set -euo pipefail

# Prune the two refs introduced after the 65-branch audited cleanup table was frozen.
# Default is dry-run. --apply deletes only exact SHA matches.

REMOTE="${REMOTE:-origin}"
APPLY=0
case "${1:-}" in
  "") ;;
  --apply) APPLY=1 ;;
  -h|--help)
    cat <<'EOF'
Usage:
  bash ops/repository/prune-v123-tail.sh
  bash ops/repository/prune-v123-tail.sh --apply

This helper only covers the v1.2.3 hotfix branch and the unused governance
closeout branch created immediately after it. Any moved ref is refused.
EOF
    exit 0
    ;;
  *) echo "unknown argument: $1" >&2; exit 2 ;;
esac

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 2; }
git remote get-url "$REMOTE" >/dev/null 2>&1 || { echo "remote '$REMOTE' is not configured" >&2; exit 2; }

read -r -d '' AUDITED <<'EOF' || true
hotfix/v1.2.3-mobile-visual-final	447172ed6a30979722f2394e8d2b631fabcabfb1
chore/v1.2.3-governance-closeout	efa30228a7555d162a32fd39f461de264b2c1b4e
EOF

verified=0
missing=0
moved=0
deleted=0

while IFS=$'\t' read -r branch expected; do
  [ -n "$branch" ] || continue
  current="$(git ls-remote --heads "$REMOTE" "refs/heads/$branch" | awk 'NR==1 {print $1}')"

  if [ -z "$current" ]; then
    printf 'SKIP missing    %s\n' "$branch"
    missing=$((missing + 1))
    continue
  fi
  if [ "$current" != "$expected" ]; then
    printf 'REFUSE moved   %s expected=%s current=%s\n' "$branch" "$expected" "$current" >&2
    moved=$((moved + 1))
    continue
  fi

  verified=$((verified + 1))
  if [ "$APPLY" -eq 1 ]; then
    printf 'DELETE verified %s %s\n' "$branch" "$current"
    git push "$REMOTE" --delete "$branch"
    deleted=$((deleted + 1))
  else
    printf 'WOULD_DELETE   %s %s\n' "$branch" "$current"
  fi
done <<< "$AUDITED"

cat <<EOF
v123_tail_verified=$verified
v123_tail_missing=$missing
v123_tail_moved_refused=$moved
v123_tail_deleted=$deleted
EOF

if [ "$moved" -ne 0 ]; then
  echo "v123_tail_prune=REFUSED_MOVED_REFS" >&2
  exit 1
fi
if [ "$APPLY" -eq 1 ]; then
  echo "v123_tail_prune=PASS"
else
  echo "v123_tail_prune=DRY_RUN_PASS"
fi
