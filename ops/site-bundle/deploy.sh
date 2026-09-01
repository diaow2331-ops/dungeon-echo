#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/srv/91hwl-play
RELEASES_DIR="$SITE_ROOT/releases"
CURRENT_LINK="$SITE_ROOT/current"
GAME_SOURCE="$BUNDLE_ROOT/public/dungeon-echo"
HEALTHCHECK="$BUNDLE_ROOT/ops/healthcheck.sh"
ROOT_POLICY="$BUNDLE_ROOT/ops/play-release-root-policy.sh"
test -r "$ROOT_POLICY" || { echo "DUNGEON_ECHO_SITE_DEPLOY_ERROR: release-root policy missing" >&2; exit 1; }
source "$ROOT_POLICY"
EXPECTED_VERSION=1.8.1
EXPECTED_GENERATION=183

fail(){ echo "DUNGEON_ECHO_SITE_DEPLOY_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this deployer accepts no arguments'
for cmd in nginx curl sha256sum; do command -v "$cmd" >/dev/null || fail "missing command: $cmd"; done

for f in \
  "$GAME_SOURCE/index.html" "$GAME_SOURCE/en/index.html" "$GAME_SOURCE/VERSION" \
  "$GAME_SOURCE/game/core/game.js" "$GAME_SOURCE/game/core/production-bootstrap.js" \
  "$GAME_SOURCE/game/core/runtime-bootstrap.js" "$GAME_SOURCE/game/core/release-stamp-v180.js" \
  "$GAME_SOURCE/game/domain/town/town-rules-v130.js" "$GAME_SOURCE/game/domain/economy/economy-rules-v130.js" \
  "$GAME_SOURCE/game/domain/town/town-growth-rules-v180.js" "$GAME_SOURCE/game/domain/inventory/set-rules-v180.js" \
  "$GAME_SOURCE/game/domain/expedition/expedition-rules-v170.js" \
  "$GAME_SOURCE/game/input/desktop-controls.js" \
  "$GAME_SOURCE/art/hero-atlas-v11.png" "$GAME_SOURCE/art/monster-atlas-v11.png" \
  "$GAME_SOURCE/art/guardian-atlas-v11.png" "$GAME_SOURCE/art/final-boss-v11.png" \
  "$GAME_SOURCE/art/named-relic-atlas-v180.webp" "$GAME_SOURCE/art/town-growth-atlas-v180.webp" \
  "$GAME_SOURCE/art/town-npc-atlas-v180.webp" "$GAME_SOURCE/art/town-npc-portraits-v180.webp" \
  "$BUNDLE_ROOT/VERSION" "$BUNDLE_ROOT/REVISION" "$BUNDLE_ROOT/SHA256SUMS"; do
  test -r "$f" || fail "missing $f"
done

test ! -d "$GAME_SOURCE/game/systems" || fail 'production bundle must not contain gameplay wrapper systems'
for forbidden in \
  game/input/combat-controls.js game/locale/core-screen-owner-v153.js game/locale/town-canvas-locale-v153.js \
  game/ui/equipment-shop-ui.js game/ui/town-workspace-v156.js game/ui/town-workspace-events-v156.js \
  game/ui/forge-feedback-v122.js game/ui/combat-hint-polish.js game/ui/expedition-pressure-v1211.js \
  game/ui/audio-director.js game/ui/mobile-ux.js game/ui/expedition-record-v126.js; do
  test ! -e "$GAME_SOURCE/$forbidden" || fail "second authority still ships: $forbidden"
done

(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'
revision="$(tr -d '\r\n[:space:]' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n[:space:]' < "$BUNDLE_ROOT/VERSION")"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || fail 'bundle revision is invalid'
test "$version" = "$EXPECTED_VERSION" || fail "unexpected Dungeon Echo version: $version"
test "$(tr -d '\r\n[:space:]' < "$GAME_SOURCE/VERSION")" = "$version" || fail 'game VERSION mismatch'

for entry in "$GAME_SOURCE/index.html" "$GAME_SOURCE/en/index.html"; do
  grep -Fq "?v=$EXPECTED_GENERATION" "$entry" || fail "generation $EXPECTED_GENERATION missing: $entry"
  ! grep -Eq '\?v=(153|157|166|167|168|169|178|179|180|181|182)' "$entry" || fail "historical cache generation remains: $entry"
  ! grep -Eq 'game/systems/|combat-controls|core-screen-owner|town-canvas-locale|town-workspace|forge-feedback|combat-hint-polish|expedition-pressure|audio-director|mobile-ux|expedition-record' "$entry" || fail "second authority reference remains: $entry"
done

grep -Fq "const assetVersion = '$EXPECTED_GENERATION'" "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'runtime generation mismatch'
grep -Fq 'release-stamp-v180.js' "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'runtime release stamp mismatch'
grep -Fq "followers:'presentation-only'" "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'runtime followers are not presentation-only'
grep -Fq "gameplayStateOwner:'game/core/game.js'" "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'gameplay state owner mismatch'
grep -Fq "gameplayInputOwner:'game/core/game.js'" "$GAME_SOURCE/game/core/production-bootstrap.js" || fail 'gameplay input owner mismatch'
grep -Fq "gameplayPersistenceOwner:'game/core/game.js'" "$GAME_SOURCE/game/core/production-bootstrap.js" || fail 'gameplay persistence owner mismatch'

previous_release="$(readlink -f "$CURRENT_LINK")"
[[ "$previous_release" == "$RELEASES_DIR"/* ]] || fail 'existing 91hwl-play current release is invalid'
test -r "$previous_release/moyu/index.html" || fail 'existing /moyu/ release is missing'

release_name="$(date -u +%Y%m%dT%H%M%SZ)-de-${revision:0:12}"
release_dir="$RELEASES_DIR/$release_name"
tmp_dir="$(mktemp -d "$RELEASES_DIR/.dungeon-echo-${revision:0:12}.XXXXXX")"
next_link="$SITE_ROOT/.current-dungeon-echo-${revision:0:12}"
switched=false
rollback(){
  rc=$?
  if test "$rc" -ne 0; then
    if test "$switched" = true; then
      rollback_link="$SITE_ROOT/.rollback-dungeon-echo-${revision:0:12}"
      ln -s "$previous_release" "$rollback_link"
      mv -Tf "$rollback_link" "$CURRENT_LINK"
      systemctl reload nginx >/dev/null 2>&1 || true
    fi
    rm -rf -- "$tmp_dir"; rm -f -- "$next_link"
    echo 'dungeon_echo_site_deploy=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

play_copy_release_root "$previous_release" "$tmp_dir"
rm -rf -- "$tmp_dir/dungeon-echo"
mkdir -p "$tmp_dir/dungeon-echo"
cp -a "$GAME_SOURCE/." "$tmp_dir/dungeon-echo/"
test -r "$tmp_dir/moyu/index.html" || fail 'existing /moyu/ was not preserved'
test -r "$tmp_dir/board-games/index.html" || fail 'existing /board-games/ was not preserved'
play_assert_release_root "$tmp_dir" || fail 'release root contains unapproved entries'
test -r "$tmp_dir/dungeon-echo/en/index.html" || fail 'English route was not staged'
find "$tmp_dir" -type d -exec chmod 0755 {} +
find "$tmp_dir" -type f -exec chmod 0644 {} +
test ! -e "$release_dir" || fail "release already exists: $release_dir"
mv "$tmp_dir" "$release_dir"
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" "$CURRENT_LINK"
switched=true
nginx -t
systemctl reload nginx
"$HEALTHCHECK"
trap - EXIT
echo "site_release=$release_dir"
echo "dungeon_echo_revision=$revision"
echo "dungeon_echo_version=$version"
echo "asset_generation=$EXPECTED_GENERATION"
echo 'authority_graph=single'
echo 'dungeon_echo_site_deploy=PASS'
