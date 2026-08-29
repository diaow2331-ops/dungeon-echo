#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
version="$(tr -d '\r\n' < "$repo_root/VERSION")"
revision="${SOURCE_REVISION:-$(git -C "$repo_root" rev-parse HEAD)}"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || { echo "invalid source revision: $revision" >&2; exit 2; }
output="${1:-$repo_root/91hwl-play-dungeon-echo-v$version.zip}"
manifest="$repo_root/ops/release/static-files.txt"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-play-dungeon-echo-v$version"
source_generation=153
legacy_art_generation=157
asset_generation=168

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

test -r "$manifest"
test "$version" = '1.3.0'
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

for entry in "$bundle/public/dungeon-echo/index.html" "$bundle/public/dungeon-echo/en/index.html"; do
  test -r "$entry"
  # Immutable production bytes are normalized to the v1.3.0 single-authority graph.
  sed -i \
    -e '/game\/core\/save-integrity-system\.js/d' \
    -e '/game\/ui\/visual-polish\.js/d' \
    -e '/game\/ui\/art-runtime-v2\.js/d' \
    -e '/art\/runtime\//d' \
    -e 's/v1\.2\.12/v1.3.0/g' \
    -e "s/?v=$source_generation/?v=$asset_generation/g" \
    -e "s/?v=$legacy_art_generation/?v=$asset_generation/g" \
    "$entry"
  grep -Fq "?v=$asset_generation" "$entry"
  grep -Fq 'v1.3.0' "$entry"
  ! grep -Fq "?v=$source_generation" "$entry"
  ! grep -Fq "?v=$legacy_art_generation" "$entry"
  ! grep -Eq 'save-integrity-system|visual-polish|art-runtime-v2|art-runtime-v4|town-art-v160|hero-directional|class-combat-fx|new-run-reset|art/runtime/' "$entry"
done

grep -Fq "const assetVersion = '$asset_generation'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "release-stamp-v130.js" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "renderOwner:'game/core/game.js'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "renderOwner:'game/core/game.js'" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"
grep -Fq "storageEpoch:STORAGE_EPOCH" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"
grep -Fq "historicalSaveMigration:false" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"
grep -Fq "newAdventure:'full-reset'" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"
grep -Fq "installNoTranslateBoundary" "$bundle/public/dungeon-echo/game/locale/fixed-locale-entry-v130.js"
grep -Fq "responsive-final-v154.js" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"

# The active artifact has exactly one Canvas renderer: game/core/game.js.
for required in \
  game/core/game.js \
  game/core/release-stamp-v130.js \
  art/hero-atlas-v11.png \
  art/monster-atlas-v11.png \
  art/guardian-atlas-v11.png \
  art/final-boss-v11.png \
  art/town-backdrop-v11.webp; do
  test -r "$bundle/public/dungeon-echo/$required"
done

for retired in \
  game/core/save-integrity-system.js \
  game/core/release-stamp-v1212.js \
  game/locale/stable-item-id-migration-v150.js \
  game/ui/visual-polish.js \
  game/ui/art-runtime-v2.js \
  game/ui/art-runtime-v4.js \
  game/ui/town-art-v160.js \
  game/ui/character-art-cleanup-v122.js \
  game/ui/world-loot-polish-v122.js \
  game/ui/hero-directional-art-v165.js \
  game/ui/class-combat-fx-v163.js \
  game/ui/new-run-reset-v167.js; do
  test ! -e "$bundle/public/dungeon-echo/$retired"
done

test ! -d "$bundle/public/dungeon-echo/art/runtime"

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
