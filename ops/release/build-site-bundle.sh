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
legacy_art_generation=157
asset_generation=166

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

test -r "$manifest"
test "$version" = '1.2.12'
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

# Semantic VERSION must already be correct in source. Packaging advances both the
# stable source generation and the single legacy art-runtime tag to one public
# generation so the immutable bytes cannot mix old and new art caches.
grep -Fq "正式版 <b>v$version</b>" "$bundle/public/dungeon-echo/index.html"
grep -Fq "Release <b>v$version</b>" "$bundle/public/dungeon-echo/en/index.html"

for entry in "$bundle/public/dungeon-echo/index.html" "$bundle/public/dungeon-echo/en/index.html"; do
  test -r "$entry"
  grep -Fq "?v=$source_generation" "$entry"
  sed -i \
    -e "s/?v=$source_generation/?v=$asset_generation/g" \
    -e "s/?v=$legacy_art_generation/?v=$asset_generation/g" \
    "$entry"
  grep -Fq "?v=$asset_generation" "$entry"
  ! grep -Fq "?v=$source_generation" "$entry"
  ! grep -Fq "?v=$legacy_art_generation" "$entry"
done

grep -Fq "const assetVersion = '$asset_generation'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "release-stamp-v1212.js" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "responsive-final-v154.js" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "installNoTranslateBoundary" "$bundle/public/dungeon-echo/game/locale/fixed-locale-entry-v130.js"

# Full v1.2.12 art closeout must be present in the immutable artifact.
for art_file in \
  game/ui/art-runtime-v2.js \
  game/ui/art-runtime-v4.js \
  game/ui/town-art-v160.js \
  game/ui/class-combat-fx-v163.js \
  game/ui/hero-directional-art-v165.js \
  art/runtime/loot-atlas-v2.svg \
  art/runtime/monster-deep-atlas-v2.svg \
  art/runtime/hero-action-atlas-v2.svg \
  art/runtime/dungeon-props-atlas-v1.svg \
  art/runtime/boss-guardian-atlas-v3.png \
  art/runtime/final-boss-v3.png \
  art/runtime/hero-directional-atlas-v1.png; do
  test -r "$bundle/public/dungeon-echo/$art_file"
done

test ! -e "$bundle/public/dungeon-echo/game/ui/hero-gear-art-v162.js"

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
