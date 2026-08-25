#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "DUNGEON_ECHO_STAGE_ERROR: $*" >&2; exit 1; }

repo_root="$(git rev-parse --show-toplevel)"
release_root="${DUNGEON_ECHO_RELEASE_ROOT:-/srv/dungeon-echo}"
manifest="$repo_root/ops/release/static-files.txt"

case "$release_root" in
  /*) ;;
  *) fail 'release root must be absolute' ;;
esac
case "$release_root" in
  /|/srv|/tmp|/var|/workspace) fail 'release root is too broad' ;;
esac

test "$(git -C "$repo_root" branch --show-current)" = main || fail 'main branch required'
test -z "$(git -C "$repo_root" status --porcelain)" || fail 'worktree must be clean'
test -r "$manifest" || fail 'static file manifest missing'

head_sha="$(git -C "$repo_root" rev-parse HEAD)"
short_sha="${head_sha:0:12}"
version="$(tr -d '\r\n' < "$repo_root/VERSION")"
releases_dir="$release_root/releases"
release_dir="$releases_dir/$short_sha"
tmp_dir="$releases_dir/.tmp-$short_sha-$$"
next_link="$release_root/.current-$short_sha"
current_link="$release_root/current"

mapfile -t release_files < <(sed -e '/^[[:space:]]*$/d' -e '/^[[:space:]]*#/d' "$manifest")
test "${#release_files[@]}" -gt 0 || fail 'static file manifest is empty'

verify_release(){
  local dir="$1" file
  test -r "$dir/REVISION" || return 1
  test -r "$dir/VERSION" || return 1
  test -r "$dir/SHA256SUMS" || return 1
  test "$(tr -d '\r\n' < "$dir/REVISION")" = "$head_sha" || return 1
  test "$(tr -d '\r\n' < "$dir/VERSION")" = "$version" || return 1
  for file in "${release_files[@]}"; do test -r "$dir/$file" || return 1; done
  (cd "$dir" && sha256sum --check --status SHA256SUMS) || return 1
}

for file in "${release_files[@]}"; do
  [[ "$file" != /* && "$file" != *'..'* ]] || fail "unsafe manifest path: $file"
  test -f "$repo_root/$file" || fail "missing production file: $file"
  git -C "$repo_root" cat-file -e "HEAD:$file" 2>/dev/null || fail "production file not tracked by HEAD: $file"
done

mkdir -p "$releases_dir"
if test -d "$release_dir"; then
  verify_release "$release_dir" || fail "existing release failed verification: $release_dir"
else
  trap 'rm -rf -- "${tmp_dir:-}" "${next_link:-}"' EXIT
  mkdir -p "$tmp_dir"
  for file in "${release_files[@]}"; do
    mkdir -p "$tmp_dir/$(dirname "$file")"
    cp -a "$repo_root/$file" "$tmp_dir/$file"
  done
  printf '%s\n' "$head_sha" > "$tmp_dir/REVISION"
  (
    cd "$tmp_dir"
    find . -type f ! -name SHA256SUMS -print0 | sort -z |
      while IFS= read -r -d '' file; do sha256sum "${file#./}"; done > SHA256SUMS
  )
  find "$tmp_dir" -type d -exec chmod 0755 {} +
  find "$tmp_dir" -type f -exec chmod 0644 {} +
  verify_release "$tmp_dir" || fail 'staged release failed verification'
  mv "$tmp_dir" "$release_dir"
fi

rm -f "$next_link"
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" "$current_link"
trap - EXIT

echo 'Dungeon Echo static release staged'
echo "version=$version"
echo "revision=$head_sha"
echo "release=$release_dir"
echo "current=$(readlink -f "$current_link")"
