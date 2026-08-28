#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
version="$(tr -d '\r\n' < "$repo_root/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-play-dungeon-echo-v$version.zip}"
manifest="$repo_root/ops/release/static-files.txt"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-play-dungeon-echo-v$version"
source_generation=153
asset_generation=154

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

test -r "$manifest"
test "$version" = '1.2.10'
command -v zip >/dev/null
mkdir -p "$bundle/public/dungeon-echo" "$bundle/ops"

while IFS= read -r file; do
  test -n "$file" || continue
  [[ "$file" != /* && "$file" != *'..'* ]]
  test -f "$repo_root/$file"
  git -C "$repo_root" cat-file -e "HEAD:$file" 2>/dev/null
  mkdir -p "$bundle/public/dungeon-echo/$(dirname "$file")"
  cp -a "$repo_root/$file" "$bundle/public/dungeon-echo/$file"
done < "$manifest"

# v1.2.10 is the first Dungeon release to separate the stable source entry generation
# from the immutable public cache generation. Rewrite only the packaged HTML entries;
# source/dev pages stay untouched while every public CSS/JS request moves to generation 154.
for entry in "$bundle/public/dungeon-echo/index.html" "$bundle/public/dungeon-echo/en/index.html"; do
  test -r "$entry"
  grep -Fq "?v=$source_generation" "$entry"
  sed -i "s/?v=$source_generation/?v=$asset_generation/g; s/v1\.2\.9/v1.2.10/g" "$entry"
  grep -Fq "?v=$asset_generation" "$entry"
  ! grep -Fq "?v=$source_generation" "$entry"
done

grep -Fq "const assetVersion = '$asset_generation'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "release-stamp-v1210.js" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "responsive-final-v154.js" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"

install -m 0755 "$repo_root/ops/site-bundle/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$repo_root/ops/site-bundle/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$repo_root/ops/site-bundle/README.txt" "$bundle/README.txt"
printf '%s\n' "$version" > "$bundle/VERSION"
printf '%s\n' "$revision" > "$bundle/REVISION"
(
  cd "$bundle"
  find README.txt REVISION VERSION ops public -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)

mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"
echo "version=$version"
echo "revision=$revision"
echo "asset_generation=$asset_generation"
echo 'dungeon_echo_bundle_build=PASS'
