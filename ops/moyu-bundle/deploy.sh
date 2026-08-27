#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/srv/91hwl-play
RELEASES_DIR=$SITE_ROOT/releases
CURRENT_LINK=$SITE_ROOT/current
SOURCE=$BUNDLE_ROOT/public/moyu
HEALTHCHECK=$BUNDLE_ROOT/ops/healthcheck.sh
fail(){ echo "MOYU_SITE_DEPLOY_ERROR: $*" >&2; exit 1; }

test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this deployer accepts no arguments'
for f in index.html style.css game.js VERSION; do test -r "$SOURCE/$f" || fail "bundled Moyu $f missing"; done
test -r "$BUNDLE_ROOT/VERSION" -a -r "$BUNDLE_ROOT/REVISION" -a -r "$BUNDLE_ROOT/SHA256SUMS" || fail 'bundle metadata missing'
test -x "$HEALTHCHECK" || fail 'healthcheck missing'
(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'

version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'invalid VERSION'
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || fail 'invalid REVISION'
test "$(tr -d '\r\n' < "$SOURCE/VERSION")" = "$version" || fail 'public VERSION mismatch'
grep -Fq 'Clock Out Alive' "$SOURCE/index.html" || fail 'product identity missing'
grep -Fq 'style.css?v=1110' "$SOURCE/index.html" || fail 'stylesheet release fingerprint missing'
grep -Fq 'game.js?v=1110' "$SOURCE/index.html" || fail 'runtime release fingerprint missing'
grep -Fq 'safe-area-inset-bottom' "$SOURCE/style.css" || fail 'mobile safe-area contract missing'
grep -Fq "dataset.gameVersion='1.11.0'" "$SOURCE/game.js" || fail 'runtime version marker missing'
grep -Fq 'DAY_END_DISTANCE=2200' "$SOURCE/game.js" || fail 'core day-length contract missing'

previous_release="$(readlink -f "$CURRENT_LINK")"
[[ "$previous_release" == "$RELEASES_DIR"/* ]] || fail 'existing current release is invalid'
test -r "$previous_release/dungeon-echo/index.html" || fail 'Dungeon Echo must be preserved'

release_name="$(date -u +%Y%m%dT%H%M%SZ)-moyu-${revision:0:12}"
release_dir="$RELEASES_DIR/$release_name"
tmp_dir="$(mktemp -d "$RELEASES_DIR/.moyu-${revision:0:12}.XXXXXX")"
next_link="$SITE_ROOT/.current-moyu-${revision:0:12}"
switched=false
rollback(){ rc=$?; if test "$rc" -ne 0; then if test "$switched" = true; then rb="$SITE_ROOT/.rollback-moyu-${revision:0:12}"; ln -s "$previous_release" "$rb"; mv -Tf "$rb" "$CURRENT_LINK"; systemctl reload nginx >/dev/null 2>&1 || true; fi; rm -rf -- "$tmp_dir"; rm -f -- "$next_link"; echo 'moyu_site_deploy=ROLLED_BACK' >&2; fi; exit "$rc"; }
trap rollback EXIT

cp -aL "$previous_release/." "$tmp_dir/"
rm -rf -- "$tmp_dir/moyu"; mkdir -p "$tmp_dir/moyu"; cp -a "$SOURCE/." "$tmp_dir/moyu/"
test -r "$tmp_dir/dungeon-echo/index.html" || fail 'Dungeon Echo lost during staging'
find "$tmp_dir" -type d -exec chmod 0755 {} +
find "$tmp_dir" -type f -exec chmod 0644 {} +
test ! -e "$release_dir" || fail "release already exists: $release_dir"
mv "$tmp_dir" "$release_dir"; ln -s "$release_dir" "$next_link"; mv -Tf "$next_link" "$CURRENT_LINK"; switched=true
nginx -t; systemctl reload nginx; "$HEALTHCHECK"
trap - EXIT
echo "site_release=$release_dir"
echo "moyu_revision=$revision"
echo "moyu_version=$version"
echo 'moyu_site_deploy=PASS'
