#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/srv/91hwl-play
RELEASES_DIR=$SITE_ROOT/releases
CURRENT_LINK=$SITE_ROOT/current
GAME_SOURCE=$BUNDLE_ROOT/public/dungeon-echo
HEALTHCHECK=$BUNDLE_ROOT/ops/healthcheck.sh
EXPECTED_VERSION=1.2.10
EXPECTED_GENERATION=154

fail(){ echo "DUNGEON_ECHO_SITE_DEPLOY_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this deployer accepts no arguments'
for f in "$GAME_SOURCE/index.html" "$GAME_SOURCE/en/index.html" "$GAME_SOURCE/VERSION" "$GAME_SOURCE/game/core/runtime-bootstrap.js" "$GAME_SOURCE/game/core/production-bootstrap.js" "$GAME_SOURCE/game/core/release-stamp-v1210.js" "$GAME_SOURCE/game/ui/responsive-final-v154.js" "$BUNDLE_ROOT/VERSION" "$BUNDLE_ROOT/REVISION" "$BUNDLE_ROOT/SHA256SUMS"; do
  test -r "$f" || fail "missing $f"
done
test -x "$HEALTHCHECK" || fail 'bundle healthcheck missing'
command -v nginx >/dev/null || fail 'nginx missing'
command -v curl >/dev/null || fail 'curl missing'

(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'

previous_release="$(readlink -f "$CURRENT_LINK")"
[[ "$previous_release" == "$RELEASES_DIR"/* ]] || fail 'existing 91hwl-play current release is invalid'
test -r "$previous_release/moyu/index.html" || fail 'existing /moyu/ release is missing'

revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || fail 'bundle revision is invalid'
test "$version" = "$EXPECTED_VERSION" || fail "unexpected Dungeon Echo version: $version"
test "$(tr -d '\r\n' < "$GAME_SOURCE/VERSION")" = "$version" || fail 'game VERSION mismatch'

grep -Fq "?v=$EXPECTED_GENERATION" "$GAME_SOURCE/index.html" || fail 'Chinese entry cache generation missing'
grep -Fq "?v=$EXPECTED_GENERATION" "$GAME_SOURCE/en/index.html" || fail 'English entry cache generation missing'
! grep -Fq '?v=153' "$GAME_SOURCE/index.html" || fail 'Chinese entry still references generation 153'
! grep -Fq '?v=153' "$GAME_SOURCE/en/index.html" || fail 'English entry still references generation 153'
grep -Fq "const assetVersion = '$EXPECTED_GENERATION'" "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'runtime cache generation mismatch'
grep -Fq 'release-stamp-v1210.js' "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'runtime does not load v1.2.10 release stamp'
grep -Fq 'responsive-final-v154.js' "$GAME_SOURCE/game/core/runtime-bootstrap.js" || fail 'runtime does not load final responsive owner'
grep -Fq "const version = '$EXPECTED_VERSION'" "$GAME_SOURCE/game/core/release-stamp-v1210.js" || fail 'release stamp version mismatch'
grep -Fq 'ONE_SHOT_REPEAT_KEYS' "$GAME_SOURCE/game/core/production-bootstrap.js" || fail 'one-shot keyboard repeat guard missing'
grep -Fq '@media (min-width:901px) and (max-width:1180px)' "$GAME_SOURCE/game/ui/responsive-final-v154.js" || fail 'mid-width PC responsive rule missing'
grep -Fq 'min-height:44px!important' "$GAME_SOURCE/game/ui/responsive-final-v154.js" || fail 'portrait touch-target rule missing'

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
    rm -rf -- "$tmp_dir"
    rm -f -- "$next_link"
    echo 'dungeon_echo_site_deploy=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

cp -aL "$previous_release/." "$tmp_dir/"
case "$tmp_dir" in
  "$RELEASES_DIR"/.dungeon-echo-*) rm -rf -- "$tmp_dir/dungeon-echo" ;;
  *) fail 'unsafe temporary release path' ;;
esac
mkdir -p "$tmp_dir/dungeon-echo"
cp -a "$GAME_SOURCE/." "$tmp_dir/dungeon-echo/"

test -r "$tmp_dir/moyu/index.html" || fail 'existing /moyu/ was not preserved'
test -r "$tmp_dir/dungeon-echo/index.html" || fail 'Dungeon Echo Chinese entry was not staged'
test -r "$tmp_dir/dungeon-echo/en/index.html" || fail 'Dungeon Echo English entry was not staged'
test -r "$tmp_dir/dungeon-echo/game/core/runtime-bootstrap.js" || fail 'organized runtime bootstrap was not staged'
test -r "$tmp_dir/dungeon-echo/game/ui/responsive-final-v154.js" || fail 'responsive owner was not staged'

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
echo 'dungeon_echo_site_deploy=PASS'
