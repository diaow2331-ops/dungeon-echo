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
test -r "$SOURCE/index.html" || fail 'bundled Moyu entry missing'
test -r "$SOURCE/VERSION" || fail 'bundled Moyu VERSION missing'
test -r "$BUNDLE_ROOT/VERSION" || fail 'bundle VERSION missing'
test -r "$BUNDLE_ROOT/REVISION" || fail 'bundle REVISION missing'
test -r "$BUNDLE_ROOT/SHA256SUMS" || fail 'bundle checksums missing'
test -x "$HEALTHCHECK" || fail 'bundle healthcheck missing'
command -v nginx >/dev/null || fail 'nginx missing'
command -v curl >/dev/null || fail 'curl missing'
(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'

previous_release="$(readlink -f "$CURRENT_LINK")"
[[ "$previous_release" == "$RELEASES_DIR"/* ]] || fail 'existing 91hwl-play current release is invalid'
test -r "$previous_release/dungeon-echo/index.html" || fail 'existing Dungeon Echo release is missing'

revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || fail 'bundle revision is invalid'
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'bundle version is invalid'
test "$(tr -d '\r\n' < "$SOURCE/VERSION")" = "$version" || fail 'Moyu VERSION mismatch'

grep -Fq '<meta name="version" content="1.11.0"' "$SOURCE/index.html" || fail 'Moyu release marker missing'
grep -Fq 'Clock Out Alive' "$SOURCE/index.html" || fail 'Moyu English identity missing'
grep -Fq '91hwl_lang' "$SOURCE/index.html" || fail 'Moyu language persistence contract missing'
grep -Fq 'safe-area-inset-bottom' "$SOURCE/index.html" || fail 'Moyu mobile safe-area contract missing'
grep -Fq "dataset.gameVersion='1.11.0'" "$SOURCE/index.html" || fail 'Moyu runtime version marker missing'

release_name="$(date -u +%Y%m%dT%H%M%SZ)-moyu-${revision:0:12}"
release_dir="$RELEASES_DIR/$release_name"
tmp_dir="$(mktemp -d "$RELEASES_DIR/.moyu-${revision:0:12}.XXXXXX")"
next_link="$SITE_ROOT/.current-moyu-${revision:0:12}"
switched=false

rollback(){
  rc=$?
  if test "$rc" -ne 0; then
    if test "$switched" = true; then
      rollback_link="$SITE_ROOT/.rollback-moyu-${revision:0:12}"
      ln -s "$previous_release" "$rollback_link"
      mv -Tf "$rollback_link" "$CURRENT_LINK"
      systemctl reload nginx >/dev/null 2>&1 || true
    fi
    rm -rf -- "$tmp_dir"
    rm -f -- "$next_link"
    echo 'moyu_site_deploy=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

cp -aL "$previous_release/." "$tmp_dir/"
case "$tmp_dir" in
  "$RELEASES_DIR"/.moyu-*) rm -rf -- "$tmp_dir/moyu" ;;
  *) fail 'unsafe temporary release path' ;;
esac
mkdir -p "$tmp_dir/moyu"
cp -a "$SOURCE/." "$tmp_dir/moyu/"

test -r "$tmp_dir/dungeon-echo/index.html" || fail 'Dungeon Echo was not preserved'
test -r "$tmp_dir/moyu/index.html" || fail 'Moyu was not staged'
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
echo "moyu_revision=$revision"
echo "moyu_version=$version"
echo 'moyu_site_deploy=PASS'
