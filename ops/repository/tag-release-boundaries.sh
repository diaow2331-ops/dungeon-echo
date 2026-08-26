#!/usr/bin/env bash
set -euo pipefail

# Create/verify immutable lightweight release tags on the accepted mainline
# release commits. Default is dry-run. --apply pushes missing tags.

REMOTE="${REMOTE:-origin}"
APPLY=0
case "${1:-}" in
  "") ;;
  --apply) APPLY=1 ;;
  -h|--help)
    cat <<'EOF'
Usage:
  bash ops/repository/tag-release-boundaries.sh
  bash ops/repository/tag-release-boundaries.sh --apply

The script only creates a missing tag when its pinned target is an ancestor of
origin/main. Existing tags must already resolve to the exact pinned commit or
the script refuses to continue.
EOF
    exit 0
    ;;
  *) echo "unknown argument: $1" >&2; exit 2 ;;
esac

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 2; }
git remote get-url "$REMOTE" >/dev/null 2>&1 || { echo "remote '$REMOTE' is not configured" >&2; exit 2; }

git fetch "$REMOTE" main --quiet

read -r -d '' RELEASES <<'EOF' || true
v1.1.0	f745845d8e0658ffa5e0a664fb8531d378e37c99
v1.2.0	cad69bb24b82e8e8768925cdcdcfb91e66509c5f
v1.2.1	47e9ce006ad9366fb68dd85db3340598e201f64f
v1.2.2	d2341fd47ade8deed1c3cbb29649a621494d915c
v1.2.3	efa30228a7555d162a32fd39f461de264b2c1b4e
EOF

verified=0
missing=0
created=0
refused=0

remote_tag_target(){
  tag="$1"
  # Lightweight tags return the target in refs/tags/<tag>. Annotated tags return
  # the peeled commit in refs/tags/<tag>^{}; accept either shape but always compare
  # the final commit target.
  out="$(git ls-remote --tags "$REMOTE" "refs/tags/$tag" "refs/tags/$tag^{}")"
  peeled="$(printf '%s\n' "$out" | awk '$2 ~ /\^\{\}$/ {print $1; exit}')"
  if [ -n "$peeled" ]; then printf '%s' "$peeled"; return; fi
  printf '%s\n' "$out" | awk '$2 !~ /\^\{\}$/ {print $1; exit}'
}

while IFS=$'\t' read -r tag expected; do
  [ -n "$tag" ] || continue

  git cat-file -e "$expected^{commit}" 2>/dev/null || {
    echo "REFUSE missing commit $tag $expected" >&2
    refused=$((refused + 1))
    continue
  }

  if ! git merge-base --is-ancestor "$expected" "$REMOTE/main"; then
    echo "REFUSE non-main target $tag $expected" >&2
    refused=$((refused + 1))
    continue
  fi

  current="$(remote_tag_target "$tag")"
  if [ -n "$current" ]; then
    if [ "$current" != "$expected" ]; then
      echo "REFUSE moved tag $tag expected=$expected current=$current" >&2
      refused=$((refused + 1))
      continue
    fi
    echo "VERIFIED tag $tag $expected"
    verified=$((verified + 1))
    continue
  fi

  missing=$((missing + 1))
  if [ "$APPLY" -eq 0 ]; then
    echo "WOULD_TAG $tag $expected"
    continue
  fi

  local_target="$(git rev-parse -q --verify "$tag^{commit}" 2>/dev/null || true)"
  if [ -n "$local_target" ] && [ "$local_target" != "$expected" ]; then
    echo "REFUSE local tag mismatch $tag expected=$expected current=$local_target" >&2
    refused=$((refused + 1))
    continue
  fi
  if [ -z "$local_target" ]; then git tag "$tag" "$expected"; fi
  git push "$REMOTE" "refs/tags/$tag:refs/tags/$tag"

  pushed="$(remote_tag_target "$tag")"
  if [ "$pushed" != "$expected" ]; then
    echo "REFUSE post-push verification failed $tag expected=$expected current=${pushed:-missing}" >&2
    refused=$((refused + 1))
    continue
  fi
  echo "CREATED tag $tag $expected"
  created=$((created + 1))
done <<< "$RELEASES"

cat <<EOF
release_tags_verified=$verified
release_tags_missing_before_apply=$missing
release_tags_created=$created
release_tags_refused=$refused
EOF

if [ "$refused" -ne 0 ]; then
  echo "release_tag_governance=REFUSED" >&2
  exit 1
fi
if [ "$APPLY" -eq 1 ]; then
  echo "release_tag_governance=PASS"
else
  echo "release_tag_governance=DRY_RUN_PASS"
fi
