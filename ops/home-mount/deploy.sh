#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/var/www/91hwl
BACKUP_ROOT=/var/backups/91hwl-home-mount
PUBLIC_ROOT="$BUNDLE_ROOT/public"
DE_REL=toys/dungeon-echo
MOYU_REL=toys/moyu
HEALTHCHECK="$BUNDLE_ROOT/ops/healthcheck.sh"

fail(){ echo "WEB_TOYS_HOME_MOUNT_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this deployer accepts no arguments'
for cmd in nginx curl sha256sum; do command -v "$cmd" >/dev/null || fail "missing command: $cmd"; done
for file in \
  "$SITE_ROOT/index.html" \
  "$PUBLIC_ROOT/index.html" \
  "$PUBLIC_ROOT/$DE_REL/index.html" \
  "$PUBLIC_ROOT/$MOYU_REL/index.html" \
  "$BUNDLE_ROOT/VERSION" \
  "$BUNDLE_ROOT/SHA256SUMS"; do
  test -r "$file" || fail "missing required file: $file"
done
test -x "$HEALTHCHECK" || fail 'healthcheck missing'
(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'

version="$(tr -d '\r\n[:space:]' < "$BUNDLE_ROOT/VERSION")"
test "$version" = '1.3.4' || fail "unexpected site version: $version"
grep -Fq 'data-site-version="1.3.4"' "$PUBLIC_ROOT/index.html" || fail 'homepage site version marker missing'
grep -Fq 'data-theme="dark"' "$PUBLIC_ROOT/index.html" || fail 'homepage theme system missing'
grep -Fq 'id="themeToggle"' "$PUBLIC_ROOT/index.html" || fail 'homepage theme control missing'
grep -Fq 'data-carry' "$PUBLIC_ROOT/index.html" || fail 'homepage preference-carry links missing'
grep -Fq 'GitHub / Source' "$PUBLIC_ROOT/index.html" || fail 'homepage source CTA missing'
grep -Fq 'softwareVersion":"1.2.10"' "$PUBLIC_ROOT/$DE_REL/index.html" || fail 'Dungeon Echo v1.2.10 detail marker missing'
grep -Fq 'softwareVersion":"1.11.5"' "$PUBLIC_ROOT/$MOYU_REL/index.html" || fail 'Clock Out Alive v1.11.5 detail marker missing'
grep -Fq '双端更稳' "$PUBLIC_ROOT/$MOYU_REL/index.html" || fail 'current Moyu Chinese release copy missing'
grep -Fq 'Cleaner across screens' "$PUBLIC_ROOT/$MOYU_REL/index.html" || fail 'current Moyu English release copy missing'

# The validated immutable bundle is authoritative. Existing live content is
# recorded and backed up, but a historical homepage hash is never a release
# prerequisite. This makes legitimate prior releases and manual recovery
# states deployable without weakening artifact checksum validation.
live_sha="$(sha256sum "$SITE_ROOT/index.html" | awk '{print $1}')"
new_sha="$(sha256sum "$PUBLIC_ROOT/index.html" | awk '{print $1}')"

mkdir -p "$BACKUP_ROOT"
backup_dir="$(mktemp -d "$BACKUP_ROOT/web-toys-v134.XXXXXX")"
cp -a "$SITE_ROOT/index.html" "$backup_dir/index.html"
printf '%s\n' "$live_sha" > "$backup_dir/LIVE_INDEX_SHA256"

de_existed=false
moyu_existed=false
if test -e "$SITE_ROOT/$DE_REL"; then cp -a "$SITE_ROOT/$DE_REL" "$backup_dir/dungeon-echo"; de_existed=true; fi
if test -e "$SITE_ROOT/$MOYU_REL"; then cp -a "$SITE_ROOT/$MOYU_REL" "$backup_dir/moyu"; moyu_existed=true; fi

restore_dir(){
  rel="$1"; backup="$2"; existed="$3"
  rm -rf -- "$SITE_ROOT/$rel"
  if test "$existed" = true; then
    mkdir -p "$(dirname "$SITE_ROOT/$rel")"
    cp -a "$backup" "$SITE_ROOT/$rel"
  fi
}

rollback(){
  rc=$?
  if test "$rc" -ne 0; then
    cp -a "$backup_dir/index.html" "$SITE_ROOT/index.html"
    restore_dir "$DE_REL" "$backup_dir/dungeon-echo" "$de_existed"
    restore_dir "$MOYU_REL" "$backup_dir/moyu" "$moyu_existed"
    nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1 || true
    echo 'web_toys_home_mount=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

index_tmp="$SITE_ROOT/.index.web-toys-v134.tmp"
install -m 0644 "$PUBLIC_ROOT/index.html" "$index_tmp"
chown --reference="$SITE_ROOT/index.html" "$index_tmp"
mv -Tf "$index_tmp" "$SITE_ROOT/index.html"

install_detail(){
  rel="$1"
  mkdir -p "$SITE_ROOT/$rel"
  tmp="$SITE_ROOT/$rel/.index.tmp"
  install -m 0644 "$PUBLIC_ROOT/$rel/index.html" "$tmp"
  chown --reference="$SITE_ROOT/index.html" "$tmp"
  mv -Tf "$tmp" "$SITE_ROOT/$rel/index.html"
}
install_detail "$DE_REL"
install_detail "$MOYU_REL"

test "$(sha256sum "$SITE_ROOT/index.html" | awk '{print $1}')" = "$new_sha" || fail 'homepage write verification failed'
nginx -t
systemctl reload nginx
"$HEALTHCHECK"

trap - EXIT
echo "previous_home_sha256=$live_sha"
echo "new_home_sha256=$new_sha"
echo "backup_dir=$backup_dir"
echo 'web_toys_home_mount=PASS'
