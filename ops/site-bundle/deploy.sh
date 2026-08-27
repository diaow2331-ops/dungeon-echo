#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/srv/91hwl-play
RELEASES_DIR=$SITE_ROOT/releases
CURRENT_LINK=$SITE_ROOT/current
GAME_SOURCE=$BUNDLE_ROOT/public/dungeon-echo
HEALTHCHECK=$BUNDLE_ROOT/ops/healthcheck.sh

fail(){ echo "DUNGEON_ECHO_SITE_DEPLOY_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this deployer accepts no arguments'
test -d "$GAME_SOURCE" || fail 'bundled dungeon-echo directory missing'
test -r "$GAME_SOURCE/index.html" || fail 'bundled game entry missing'
test -r "$BUNDLE_ROOT/VERSION" || fail 'bundle VERSION missing'
test -r "$BUNDLE_ROOT/REVISION" || fail 'bundle REVISION missing'
test -r "$BUNDLE_ROOT/SHA256SUMS" || fail 'bundle checksums missing'
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
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'bundle version is invalid'
release_stamp="release-stamp-v${version//./}.js"
asset_version="${version//./}"

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
test -r "$tmp_dir/dungeon-echo/index.html" || fail 'Dungeon Echo entry was not staged'
grep -Fq '地牢回响' "$tmp_dir/dungeon-echo/index.html" || fail 'Dungeon Echo title missing from staged entry'
test -r "$tmp_dir/dungeon-echo/runtime-bootstrap.js" || fail 'runtime bootstrap missing from staged entry'
test -r "$tmp_dir/dungeon-echo/$release_stamp" || fail "release stamp missing from staged entry: $release_stamp"
grep -Fq "$release_stamp" "$tmp_dir/dungeon-echo/runtime-bootstrap.js" || fail 'runtime bootstrap does not load current release stamp'
grep -Fq "const version = '$version'" "$tmp_dir/dungeon-echo/$release_stamp" || fail 'release stamp version does not match bundle VERSION'

if test "$version" = '1.2.4' || test "$version" = '1.2.5' || test "$version" = '1.2.6' || test "$version" = '1.2.7' || test "$version" = '1.2.8'; then
  test -r "$tmp_dir/dungeon-echo/style.css" || fail 'navigation stylesheet missing'
  grep -Fq '#achv-screen, #help-screen {' "$tmp_dir/dungeon-echo/style.css" || fail 'Help/Expedition Log fixed-screen selector missing'
  grep -Fq '#help-screen > .title-card { margin: auto; }' "$tmp_dir/dungeon-echo/style.css" || fail 'Help/Expedition Log card scroll-centering contract missing'
fi

if test "$version" = '1.2.5' || test "$version" = '1.2.6' || test "$version" = '1.2.7' || test "$version" = '1.2.8'; then
  grep -Fq "style.css?v=$asset_version" "$tmp_dir/dungeon-echo/index.html" || fail 'stylesheet cache fingerprint missing'
  grep -Fq "runtime-bootstrap.js?v=$asset_version" "$tmp_dir/dungeon-echo/index.html" || fail 'runtime bootstrap cache fingerprint missing'
  grep -Fq "const assetVersion = '$asset_version'" "$tmp_dir/dungeon-echo/runtime-bootstrap.js" || fail 'follower cache fingerprint missing'
fi

if test "$version" = '1.2.6' || test "$version" = '1.2.7' || test "$version" = '1.2.8'; then
  test -r "$tmp_dir/dungeon-echo/help-copy-v126.js" || fail 'shared help copy owner missing'
  test -r "$tmp_dir/dungeon-echo/expedition-record-v126.js" || fail 'shared expedition record owner missing'
  grep -Fq 'help-copy-v126.js' "$tmp_dir/dungeon-echo/runtime-bootstrap.js" || fail 'runtime bootstrap does not load help copy owner'
  grep -Fq 'expedition-record-v126.js' "$tmp_dir/dungeon-echo/runtime-bootstrap.js" || fail 'runtime bootstrap does not load expedition record owner'
  grep -Fq "catalogSize:CATALOG.length" "$tmp_dir/dungeon-echo/expedition-record-v126.js" || fail 'expedition record catalog contract missing'
  grep -Fq 'No expedition profile yet' "$tmp_dir/dungeon-echo/expedition-record-v126.js" || fail 'expedition record zero-state copy missing'
  grep -Fq 'Mobile:' "$tmp_dir/dungeon-echo/help-copy-v126.js" || fail 'English device help copy missing'
  grep -Fq '手机：' "$tmp_dir/dungeon-echo/help-copy-v126.js" || fail 'Chinese device help copy missing'
fi

if test "$version" = '1.2.7' || test "$version" = '1.2.8'; then
  for owner in npc-stability-system.js progression-guard-system.js risk-reward-system.js; do
    test -r "$tmp_dir/dungeon-echo/$owner" || fail "gameplay owner missing: $owner"
    grep -Fq "$owner?v=$asset_version" "$tmp_dir/dungeon-echo/index.html" || fail "gameplay owner cache fingerprint missing: $owner"
  done
fi

if test "$version" = '1.2.8'; then
  locale_owner="$tmp_dir/dungeon-echo/locale-completeness-v128.js"
  test -r "$locale_owner" || fail 'locale completeness owner missing'
  grep -Fq 'locale-completeness-v128.js' "$tmp_dir/dungeon-echo/runtime-bootstrap.js" || fail 'runtime bootstrap does not load locale completeness owner'
  grep -Fq 'characterData:true' "$locale_owner" || fail 'locale completeness characterData contract missing'
  grep -Fq "'#equipbar'" "$locale_owner" || fail 'locale completeness equipment scope missing'
  grep -Fq "'#log'" "$locale_owner" || fail 'locale completeness log scope missing'
  grep -Fq 'You stepped on a trap' "$locale_owner" || fail 'locale completeness trap translation missing'
  grep -Fq 'This floor has' "$locale_owner" || fail 'locale completeness floor-summary translation missing'
  grep -Fq "weapon:'Weapon'" "$locale_owner" || fail 'locale completeness equipment labels missing'
  ! grep -Eq 'setInterval[[:space:]]*\(' "$locale_owner" || fail 'locale completeness must not poll'
fi

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
echo 'dungeon_echo_site_deploy=PASS'
