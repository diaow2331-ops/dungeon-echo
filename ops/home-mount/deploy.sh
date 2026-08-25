#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/var/www/91hwl
BACKUP_ROOT=/var/backups/91hwl-home-mount
PUBLIC_ROOT=$BUNDLE_ROOT/public
DETAIL_REL=toys/dungeon-echo
HEALTHCHECK=$BUNDLE_ROOT/ops/healthcheck.sh

fail(){ echo "DUNGEON_ECHO_HOME_MOUNT_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this deployer accepts no arguments'
test -r "$SITE_ROOT/index.html" || fail '91hwl homepage missing'
test -r "$PUBLIC_ROOT/index.html" || fail 'updated homepage missing'
test -r "$PUBLIC_ROOT/$DETAIL_REL/index.html" || fail 'Dungeon Echo detail page missing'
test -r "$BUNDLE_ROOT/EXPECTED_INDEX_SHA256" || fail 'expected homepage hash missing'
test -r "$BUNDLE_ROOT/SHA256SUMS" || fail 'bundle checksums missing'
test -x "$HEALTHCHECK" || fail 'healthcheck missing'
command -v nginx >/dev/null || fail 'nginx missing'
command -v curl >/dev/null || fail 'curl missing'

(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'

expected_sha="$(tr -d '\r\n' < "$BUNDLE_ROOT/EXPECTED_INDEX_SHA256")"
actual_sha="$(sha256sum "$SITE_ROOT/index.html" | awk '{print $1}')"
new_sha="$(sha256sum "$PUBLIC_ROOT/index.html" | awk '{print $1}')"
if test "$actual_sha" != "$expected_sha" && test "$actual_sha" != "$new_sha"; then
  fail "live homepage changed unexpectedly: $actual_sha"
fi

mkdir -p "$BACKUP_ROOT"
backup_dir="$(mktemp -d "$BACKUP_ROOT/dungeon-echo.XXXXXX")"
cp -a "$SITE_ROOT/index.html" "$backup_dir/index.html"
detail_existed=false
if test -e "$SITE_ROOT/$DETAIL_REL"; then
  cp -a "$SITE_ROOT/$DETAIL_REL" "$backup_dir/dungeon-echo"
  detail_existed=true
fi

rollback(){
  rc=$?
  if test "$rc" -ne 0; then
    cp -a "$backup_dir/index.html" "$SITE_ROOT/index.html"
    if test "$detail_existed" = true; then
      rm -rf -- "$SITE_ROOT/$DETAIL_REL"
      cp -a "$backup_dir/dungeon-echo" "$SITE_ROOT/$DETAIL_REL"
    else
      rm -rf -- "$SITE_ROOT/$DETAIL_REL"
    fi
    nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1 || true
    echo 'dungeon_echo_home_mount=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

index_tmp="$SITE_ROOT/.index.dungeon-echo.tmp"
install -m 0644 "$PUBLIC_ROOT/index.html" "$index_tmp"
chown --reference="$SITE_ROOT/index.html" "$index_tmp"
mv -Tf "$index_tmp" "$SITE_ROOT/index.html"

mkdir -p "$SITE_ROOT/$DETAIL_REL"
detail_tmp="$SITE_ROOT/$DETAIL_REL/.index.tmp"
install -m 0644 "$PUBLIC_ROOT/$DETAIL_REL/index.html" "$detail_tmp"
chown --reference="$SITE_ROOT/index.html" "$detail_tmp"
mv -Tf "$detail_tmp" "$SITE_ROOT/$DETAIL_REL/index.html"

test "$(sha256sum "$SITE_ROOT/index.html" | awk '{print $1}')" = "$new_sha" || fail 'homepage write verification failed'
nginx -t
systemctl reload nginx
"$HEALTHCHECK"

trap - EXIT
echo "backup_dir=$backup_dir"
echo 'dungeon_echo_home_mount=PASS'
