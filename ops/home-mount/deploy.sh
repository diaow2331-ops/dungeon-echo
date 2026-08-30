#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT=/var/www/91hwl
BACKUP_ROOT=/var/backups/91hwl-home-mount
PUBLIC_ROOT="$BUNDLE_ROOT/public"
DE_REL=toys/dungeon-echo
MOYU_REL=toys/moyu
ABOUT_REL=about
PRIVACY_REL=privacy
CONTACT_REL=contact
ASSET_REL=assets/site-v180
ADS_REL=ads.txt
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
  "$PUBLIC_ROOT/$ABOUT_REL/index.html" \
  "$PUBLIC_ROOT/$PRIVACY_REL/index.html" \
  "$PUBLIC_ROOT/$CONTACT_REL/index.html" \
  "$PUBLIC_ROOT/$ASSET_REL/style.css" \
  "$PUBLIC_ROOT/$ASSET_REL/site.js" \
  "$PUBLIC_ROOT/$ASSET_REL/wang-jian-landscape-1668.jpg" \
  "$PUBLIC_ROOT/$ASSET_REL/moyu-run-v1230.jpg" \
  "$PUBLIC_ROOT/$ADS_REL" \
  "$BUNDLE_ROOT/VERSION" \
  "$BUNDLE_ROOT/SHA256SUMS"; do
  test -r "$file" || fail "missing required file: $file"
done
test -x "$HEALTHCHECK" || fail 'healthcheck missing'
(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'bundle checksum verification failed'

version="$(tr -d '\r\n[:space:]' < "$BUNDLE_ROOT/VERSION")"
test "$version" = '1.8.0' || fail "unexpected site version: $version"
grep -Fq 'data-site-version="1.8.0"' "$PUBLIC_ROOT/index.html" || fail 'homepage site version marker missing'
grep -Fq 'data-theme="dark"' "$PUBLIC_ROOT/index.html" || fail 'homepage theme system missing'
grep -Fq 'id="themeToggle"' "$PUBLIC_ROOT/index.html" || fail 'homepage theme control missing'
grep -Fq 'data-carry' "$PUBLIC_ROOT/index.html" || fail 'homepage preference-carry links missing'
grep -Fq 'GitHub / Source' "$PUBLIC_ROOT/index.html" || fail 'homepage source CTA missing'
grep -Fq 'site-v180/style.css' "$PUBLIC_ROOT/index.html" || fail 'homepage v1.8.0 shared design missing'
grep -Fq '游艺择签' "$PUBLIC_ROOT/index.html" || fail 'homepage chooser interaction missing'
grep -Fq 'wang-jian-landscape-1668.jpg' "$PUBLIC_ROOT/index.html" || fail 'homepage landscape artwork missing'
grep -Fq '方寸屏间' "$PUBLIC_ROOT/index.html" || fail 'homepage Chinese hero copy missing'
grep -Fq '敬请期待' "$PUBLIC_ROOT/index.html" || fail 'homepage future-game slot missing'
grep -Fq 'game-media-moyu' "$PUBLIC_ROOT/index.html" || fail 'Moyu visual cover hook missing'
grep -Fq 'id="navToggle"' "$PUBLIC_ROOT/index.html" || fail 'mobile directory control missing'
grep -Fq '公开开发' "$PUBLIC_ROOT/index.html" || fail 'homepage public-development copy missing'
grep -Fq 'mailto:diaow2331@gmail.com' "$PUBLIC_ROOT/index.html" || fail 'homepage visible contact email missing'
grep -Fq 'ca-pub-2648680835467283' "$PUBLIC_ROOT/index.html" || fail 'homepage AdSense client missing'
grep -Fq 'href="/privacy/"' "$PUBLIC_ROOT/index.html" || fail 'homepage privacy link missing'
grep -Fq 'softwareVersion":"1.4.2"' "$PUBLIC_ROOT/$DE_REL/index.html" || fail 'Dungeon Echo v1.4.2 detail marker missing'
grep -Fq '1120×460 可步行广场' "$PUBLIC_ROOT/$DE_REL/index.html" || fail 'Dungeon Echo v1.4.2 town copy missing'
grep -Fq 'softwareVersion":"1.23.0"' "$PUBLIC_ROOT/$MOYU_REL/index.html" || fail 'Clock Out Alive v1.23.0 detail marker missing'
grep -Fq '四幕皆有新声' "$PUBLIC_ROOT/$MOYU_REL/index.html" || fail 'current Moyu Chinese release copy missing'
grep -Fq 'Four scenes, fuller sound' "$PUBLIC_ROOT/$MOYU_REL/index.html" || fail 'current Moyu English release copy missing'
grep -Fq '一方小站，二种玩法。' "$PUBLIC_ROOT/$ABOUT_REL/index.html" || fail 'about page marker missing'
grep -Fq 'record-about' "$PUBLIC_ROOT/$ABOUT_REL/index.html" || fail 'about page identity missing'
grep -Fq '隐私案卷' "$PUBLIC_ROOT/$PRIVACY_REL/index.html" || fail 'privacy page marker missing'
grep -Fq 'privacy-emblem' "$PUBLIC_ROOT/$PRIVACY_REL/index.html" || fail 'privacy page identity missing'
grep -Fq '把问题说清，把回音留下。' "$PUBLIC_ROOT/$CONTACT_REL/index.html" || fail 'contact page content marker missing'
grep -Fq 'record-letter' "$PUBLIC_ROOT/$CONTACT_REL/index.html" || fail 'contact page identity missing'
grep -Fq 'mailto:diaow2331@gmail.com' "$PUBLIC_ROOT/$CONTACT_REL/index.html" || fail 'contact email marker missing'
grep -Fxq 'google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0' "$PUBLIC_ROOT/$ADS_REL" || fail 'ads.txt content mismatch'

# The validated immutable bundle is authoritative. Existing live content is
# recorded and backed up, but a historical homepage hash is never a release
# prerequisite. This makes legitimate prior releases and manual recovery
# states deployable without weakening artifact checksum validation.
live_sha="$(sha256sum "$SITE_ROOT/index.html" | awk '{print $1}')"
new_sha="$(sha256sum "$PUBLIC_ROOT/index.html" | awk '{print $1}')"

mkdir -p "$BACKUP_ROOT"
backup_dir="$(mktemp -d "$BACKUP_ROOT/web-toys-v180.XXXXXX")"
cp -a "$SITE_ROOT/index.html" "$backup_dir/index.html"
printf '%s\n' "$live_sha" > "$backup_dir/LIVE_INDEX_SHA256"

de_existed=false
moyu_existed=false
about_existed=false
privacy_existed=false
contact_existed=false
assets_existed=false
ads_existed=false
if test -e "$SITE_ROOT/$DE_REL"; then cp -a "$SITE_ROOT/$DE_REL" "$backup_dir/dungeon-echo"; de_existed=true; fi
if test -e "$SITE_ROOT/$MOYU_REL"; then cp -a "$SITE_ROOT/$MOYU_REL" "$backup_dir/moyu"; moyu_existed=true; fi
if test -e "$SITE_ROOT/$ABOUT_REL"; then cp -a "$SITE_ROOT/$ABOUT_REL" "$backup_dir/about"; about_existed=true; fi
if test -e "$SITE_ROOT/$PRIVACY_REL"; then cp -a "$SITE_ROOT/$PRIVACY_REL" "$backup_dir/privacy"; privacy_existed=true; fi
if test -e "$SITE_ROOT/$CONTACT_REL"; then cp -a "$SITE_ROOT/$CONTACT_REL" "$backup_dir/contact"; contact_existed=true; fi
if test -e "$SITE_ROOT/$ASSET_REL"; then cp -a "$SITE_ROOT/$ASSET_REL" "$backup_dir/site-v180"; assets_existed=true; fi
if test -e "$SITE_ROOT/$ADS_REL"; then cp -a "$SITE_ROOT/$ADS_REL" "$backup_dir/ads.txt"; ads_existed=true; fi

restore_dir(){
  rel="$1"; backup="$2"; existed="$3"
  rm -rf -- "$SITE_ROOT/$rel"
  if test "$existed" = true; then
    mkdir -p "$(dirname "$SITE_ROOT/$rel")"
    cp -a "$backup" "$SITE_ROOT/$rel"
  fi
}

restore_file(){
  rel="$1"; backup="$2"; existed="$3"
  rm -f -- "$SITE_ROOT/$rel"
  if test "$existed" = true; then cp -a "$backup" "$SITE_ROOT/$rel"; fi
}

rollback(){
  rc=$?
  if test "$rc" -ne 0; then
    cp -a "$backup_dir/index.html" "$SITE_ROOT/index.html"
    restore_dir "$DE_REL" "$backup_dir/dungeon-echo" "$de_existed"
    restore_dir "$MOYU_REL" "$backup_dir/moyu" "$moyu_existed"
    restore_dir "$ABOUT_REL" "$backup_dir/about" "$about_existed"
    restore_dir "$PRIVACY_REL" "$backup_dir/privacy" "$privacy_existed"
    restore_dir "$CONTACT_REL" "$backup_dir/contact" "$contact_existed"
    restore_dir "$ASSET_REL" "$backup_dir/site-v180" "$assets_existed"
    restore_file "$ADS_REL" "$backup_dir/ads.txt" "$ads_existed"
    nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1 || true
    echo 'web_toys_home_mount=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

index_tmp="$SITE_ROOT/.index.web-toys-v180.tmp"
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
install_detail "$ABOUT_REL"
install_detail "$PRIVACY_REL"
install_detail "$CONTACT_REL"

mkdir -p "$SITE_ROOT/assets"
rm -rf -- "$SITE_ROOT/$ASSET_REL"
cp -a "$PUBLIC_ROOT/$ASSET_REL" "$SITE_ROOT/$ASSET_REL"
chown -R --reference="$SITE_ROOT/index.html" "$SITE_ROOT/$ASSET_REL"

ads_tmp="$SITE_ROOT/.ads.txt.web-toys-v180.tmp"
install -m 0644 "$PUBLIC_ROOT/$ADS_REL" "$ads_tmp"
chown --reference="$SITE_ROOT/index.html" "$ads_tmp"
mv -Tf "$ads_tmp" "$SITE_ROOT/$ADS_REL"

test "$(sha256sum "$SITE_ROOT/index.html" | awk '{print $1}')" = "$new_sha" || fail 'homepage write verification failed'
grep -Fq 'site-v180/style.css' "$SITE_ROOT/index.html" || fail 'homepage v1.8.0 design write verification failed'
grep -Fq '游艺择签' "$SITE_ROOT/index.html" || fail 'homepage chooser write verification failed'
cmp -s "$PUBLIC_ROOT/$ASSET_REL/style.css" "$SITE_ROOT/$ASSET_REL/style.css" || fail 'shared CSS write verification failed'
cmp -s "$PUBLIC_ROOT/$ASSET_REL/site.js" "$SITE_ROOT/$ASSET_REL/site.js" || fail 'shared interaction write verification failed'
cmp -s "$PUBLIC_ROOT/$ASSET_REL/wang-jian-landscape-1668.jpg" "$SITE_ROOT/$ASSET_REL/wang-jian-landscape-1668.jpg" || fail 'landscape asset write verification failed'
cmp -s "$PUBLIC_ROOT/$ASSET_REL/moyu-run-v1230.jpg" "$SITE_ROOT/$ASSET_REL/moyu-run-v1230.jpg" || fail 'Moyu cover write verification failed'
grep -Fq '敬请期待' "$SITE_ROOT/index.html" || fail 'homepage future-game slot write verification failed'
grep -Fxq 'google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0' "$SITE_ROOT/$ADS_REL" || fail 'ads.txt write verification failed'
nginx -t
systemctl reload nginx
"$HEALTHCHECK"

trap - EXIT
echo "previous_home_sha256=$live_sha"
echo "new_home_sha256=$new_sha"
echo "backup_dir=$backup_dir"
echo 'web_toys_home_mount=PASS'
