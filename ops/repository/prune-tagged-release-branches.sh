#!/usr/bin/env bash
set -euo pipefail

# Prune the four temporary release-boundary branches only after the corresponding
# immutable remote tag resolves to the accepted mainline release commit.
# Default is dry run; --apply performs verified deletions.

REMOTE="${REMOTE:-origin}"
APPLY=0
case "${1:-}" in
  "") ;;
  --apply) APPLY=1 ;;
  -h|--help)
    cat <<'EOF'
Usage:
  bash ops/repository/prune-tagged-release-branches.sh
  bash ops/repository/prune-tagged-release-branches.sh --apply

Run tag-release-boundaries.sh first. This script refuses a branch deletion if
its immutable version tag is missing/moved or if the branch head changed since
the audit.
EOF
    exit 0
    ;;
  *) echo "unknown argument: $1" >&2; exit 2 ;;
esac

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 2; }
git remote get-url "$REMOTE" >/dev/null 2>&1 || { echo "remote '$REMOTE' is not configured" >&2; exit 2; }

# branch, audited branch head, tag, accepted mainline tag target
read -r -d '' RELEASE_BRANCHES <<'EOF' || true
release/v1.1.0	d5caa1c75bf8f7526b1f05d6a9916e5ed00ee7d3	v1.1.0	f745845d8e0658ffa5e0a664fb8531d378e37c99
release/v1.2.0	a99b967c9296c1f7a6a9dcbb0d7db5d9cfd53e9d	v1.2.0	cad69bb24b82e8e8768925cdcdcfb91e66509c5f
hotfix/v1.2.1-language-hints	b1c69a41e6c23c6c22b70c2c4a62f020b11d8e07	v1.2.1	47e9ce006ad9366fb68dd85db3340598e201f64f
release/v1.2.2-final-polish	a9542b67e1d49cf61771428a4b4fa5433d1dbc6c	v1.2.2	d2341fd47ade8deed1c3cbb29649a621494d915c
EOF

remote_tag_target(){
  tag="$1"
  out="$(git ls-remote --tags "$REMOTE" "refs/tags/$tag" "refs/tags/$tag^{}")"
  peeled="$(printf '%s\n' "$out" | awk '$2 ~ /\^\{\}$/ {print $1; exit}')"
  if [ -n "$peeled" ]; then printf '%s' "$peeled"; return; fi
  printf '%s\n' "$out" | awk '$2 !~ /\^\{\}$/ {print $1; exit}'
}

verified=0
missing=0
refused=0
deleted=0

while IFS=$'\t' read -r branch branch_sha tag tag_sha; do
  [ -n "$branch" ] || continue

  tag_current="$(remote_tag_target "$tag")"
  if [ "$tag_current" != "$tag_sha" ]; then
    echo "REFUSE tag boundary $branch tag=$tag expected=$tag_sha current=${tag_current:-missing}" >&2
    refused=$((refused + 1))
    continue
  fi

  branch_current="$(git ls-remote --heads "$REMOTE" "refs/heads/$branch" | awk 'NR==1 {print $1}')"
  if [ -z "$branch_current" ]; then
    echo "SKIP missing branch $branch"
    missing=$((missing + 1))
    continue
  fi
  if [ "$branch_current" != "$branch_sha" ]; then
    echo "REFUSE moved branch $branch expected=$branch_sha current=$branch_current" >&2
    refused=$((refused + 1))
    continue
  fi

  verified=$((verified + 1))
  if [ "$APPLY" -eq 1 ]; then
    echo "DELETE tagged release branch $branch $branch_current"
    git push "$REMOTE" --delete "$branch"
    deleted=$((deleted + 1))
  else
    echo "WOULD_DELETE tagged release branch $branch $branch_current tag=$tag:$tag_sha"
  fi
done <<< "$RELEASE_BRANCHES"

cat <<EOF
release_branches_verified=$verified
release_branches_missing=$missing
release_branches_refused=$refused
release_branches_deleted=$deleted
EOF

if [ "$refused" -ne 0 ]; then
  echo "release_branch_prune=REFUSED" >&2
  exit 1
fi
if [ "$APPLY" -eq 1 ]; then
  echo "release_branch_prune=PASS"
else
  echo "release_branch_prune=DRY_RUN_PASS"
fi
