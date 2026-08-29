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
asset_generation=174

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

test "$version" = '1.3.5'
test -r "$manifest"
command -v zip >/dev/null

# Source must already be the deployable graph. The builder never edits HTML/JS.
! grep -Eq '^game/systems/' "$manifest"
for forbidden in \
  game/input/combat-controls.js \
  game/locale/core-screen-owner-v153.js \
  game/locale/town-canvas-locale-v153.js \
  game/ui/equipment-shop-ui.js \
  game/ui/town-workspace-v156.js \
  game/ui/town-workspace-events-v156.js \
  game/ui/forge-feedback-v122.js \
  game/ui/combat-hint-polish.js \
  game/ui/expedition-pressure-v1211.js \
  game/ui/audio-director.js \
  game/ui/mobile-ux.js \
  game/ui/expedition-record-v126.js; do
  ! grep -Fxq "$forbidden" "$manifest"
done

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
  grep -Fq 'v1.3.5' "$entry"
  grep -Fq "?v=$asset_generation" "$entry"
  ! grep -Eq '\?v=(153|157|166|167|168|169)' "$entry"
  ! grep -Eq 'game/systems/|combat-controls|core-screen-owner|town-canvas-locale|town-workspace|forge-feedback|combat-hint-polish|expedition-pressure|audio-director|mobile-ux|expedition-record|art-runtime|visual-polish' "$entry"
done

grep -Fq "const assetVersion = '$asset_generation'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "followers:'presentation-only'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "gameplayStateOwner:'game/core/game.js'" "$bundle/public/dungeon-echo/game/core/runtime-bootstrap.js"
grep -Fq "gameplayInputOwner:'game/core/game.js'" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"
grep -Fq "gameplayPersistenceOwner:'game/core/game.js'" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"
grep -Fq "newAdventure:'gameplay-reset-preserve-preferences'" "$bundle/public/dungeon-echo/game/core/production-bootstrap.js"

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
echo 'authority_graph=single'
echo 'dungeon_echo_bundle_build=PASS'
