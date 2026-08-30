#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOME_URL=https://91hwl.cn/
DE_DETAIL_URL=https://91hwl.cn/toys/dungeon-echo/
MOYU_DETAIL_URL=https://91hwl.cn/toys/moyu/
ABOUT_URL=https://91hwl.cn/about/
PRIVACY_URL=https://91hwl.cn/privacy/
CONTACT_URL=https://91hwl.cn/contact/
ADS_URL=https://91hwl.cn/ads.txt
DE_PLAY_URL=https://play.91hwl.cn/dungeon-echo/
MOYU_PLAY_URL=https://play.91hwl.cn/moyu/
DE_VERSION_URL=https://play.91hwl.cn/dungeon-echo/VERSION
MOYU_VERSION_URL=https://play.91hwl.cn/moyu/VERSION
MAIN_RESOLVE=91hwl.cn:443:127.0.0.1
PLAY_RESOLVE=play.91hwl.cn:443:127.0.0.1
ADSENSE_CLIENT=ca-pub-2648680835467283
ADS_LINE='google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0'
ATTEMPTS=6
DELAY=2

fail(){ echo "WEB_TOYS_HOME_HEALTH_ERROR: $*" >&2; exit 1; }
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
work_dir="$(mktemp -d /tmp/web-toys-home-v150-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

fetch(){ output="$1"; shift; curl --fail --silent --show-error --location --noproxy '*' --output "$output" "$@"; }

require_fixed(){
  file="$1"; needle="$2"; label="$3"
  grep -Fq "$needle" "$file" || { echo "HEALTH_CONTRACT_MISS: $label :: $needle" >&2; return 1; }
}

check_pref_contract(){
  file="$1"
  require_fixed "$file" 'id="themeToggle"' 'theme toggle' || return 1
  require_fixed "$file" 'data-lang-choice="zh"' 'zh language control' || return 1
  require_fixed "$file" 'data-lang-choice="en"' 'en language control' || return 1
  require_fixed "$file" '91hwl_site_lang' 'site language storage key' || return 1
  require_fixed "$file" '91hwl_site_theme' 'site theme storage key' || return 1
  require_fixed "$file" '91hwl_lang' 'shared language cookie key' || return 1
  require_fixed "$file" '91hwl_theme' 'shared theme cookie key' || return 1
  require_fixed "$file" 'data-carry' 'preference-carry link contract' || return 1
}

check_social_contract(){
  file="$1"; url="$2"; title="$3"
  require_fixed "$file" 'name="robots" content="index,follow,max-image-preview:large"' 'large image preview policy' || return 1
  require_fixed "$file" "property=\"og:url\" content=\"$url\"" 'Open Graph canonical URL' || return 1
  require_fixed "$file" 'property="og:site_name" content="91hwl"' 'Open Graph site name' || return 1
  require_fixed "$file" 'property="og:image:alt"' 'Open Graph image alt' || return 1
  require_fixed "$file" "name=\"twitter:title\" content=\"$title\"" 'X card title' || return 1
  require_fixed "$file" 'name="twitter:description"' 'X card description' || return 1
  require_fixed "$file" 'name="twitter:image"' 'X card image' || return 1
  require_fixed "$file" 'name="twitter:image:alt"' 'X card image alt' || return 1
}

check_adsense_surface(){
  file="$1"; label="$2"
  require_fixed "$file" "$ADSENSE_CLIENT" "$label AdSense client" || return 1
  require_fixed "$file" 'href="/about/"' "$label About link" || return 1
  require_fixed "$file" 'href="/privacy/"' "$label Privacy link" || return 1
  require_fixed "$file" 'href="/contact/"' "$label Contact link" || return 1
}

check_home(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.5.0"' 'homepage site version' || return 1
  require_fixed "$file" 'data-theme="dark"' 'homepage default theme' || return 1
  require_fixed "$file" 'Dungeon Echo' 'homepage Dungeon Echo card' || return 1
  require_fixed "$file" 'Clock Out Alive' 'homepage Moyu card' || return 1
  require_fixed "$file" 'v1.4.2' 'homepage Dungeon Echo version' || return 1
  require_fixed "$file" 'v1.22.0' 'homepage Moyu version' || return 1
  require_fixed "$file" 'GitHub / Source' 'homepage source CTA' || return 1
  require_fixed "$file" '公开开发' 'homepage public-development copy' || return 1
  require_fixed "$file" 'site-home-v150' 'homepage v1.5.0 Chinese layout style' || return 1
  require_fixed "$file" '方寸屏间' 'homepage Chinese hero copy' || return 1
  require_fixed "$file" '敬请期待' 'homepage future-game slot' || return 1
  require_fixed "$file" '来处、规矩与回音。' 'homepage records heading' || return 1
  require_fixed "$file" 'mailto:diaow2331@gmail.com' 'homepage visible contact email' || return 1
  require_fixed "$file" '游戏运行界面本身不作为广告展示面' 'homepage ad-surface disclosure' || return 1
  grep -Eq 'Small screen\.|方寸屏间' "$file" || { echo 'HEALTH_CONTRACT_MISS: homepage Chinese editorial headline' >&2; return 1; }
  require_fixed "$file" 'min-height:42px' 'homepage control height' || return 1
  check_social_contract "$file" 'https://91hwl.cn/' '91hwl · Browser Games' || return 1
  check_pref_contract "$file" || return 1
  check_adsense_surface "$file" 'homepage' || return 1
}

check_de_detail(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.5.0"' 'Dungeon Echo detail site version' || return 1
  require_fixed "$file" 'softwareVersion":"1.4.2"' 'Dungeon Echo detail software version' || return 1
  require_fixed "$file" '1120×460 可步行广场' 'Dungeon Echo v1.4.2 town release copy' || return 1
  require_fixed "$file" 'Dungeon Echo' 'Dungeon Echo detail title' || return 1
  require_fixed "$file" 'class-roster.webp' 'Dungeon Echo roster art' || return 1
  require_fixed "$file" 'town-backdrop-v11.webp' 'Dungeon Echo town art' || return 1
  require_fixed "$file" 'final-boss-v11.png' 'Dungeon Echo final boss art' || return 1
  require_fixed "$file" 'href="https://play.91hwl.cn/dungeon-echo/" data-carry' 'Dungeon Echo play link' || return 1
  require_fixed "$file" 'GitHub / Source' 'Dungeon Echo source CTA' || return 1
  require_fixed "$file" 'MIT · OPEN SOURCE' 'Dungeon Echo open-source identity' || return 1
  check_social_contract "$file" 'https://91hwl.cn/toys/dungeon-echo/' 'Dungeon Echo · 100-Floor Browser Roguelike' || return 1
  check_pref_contract "$file" || return 1
  check_adsense_surface "$file" 'Dungeon detail' || return 1
}

check_moyu_detail(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.5.0"' 'Moyu detail site version' || return 1
  require_fixed "$file" 'softwareVersion":"1.22.0"' 'Moyu detail software version' || return 1
  require_fixed "$file" 'Clock Out Alive' 'Moyu detail title' || return 1
  require_fixed "$file" '四幕皆有新声' 'Moyu current Chinese release copy' || return 1
  require_fixed "$file" 'Four scenes, fuller sound' 'Moyu current English release copy' || return 1
  require_fixed "$file" 'href="https://play.91hwl.cn/moyu/" data-carry' 'Moyu play link' || return 1
  check_pref_contract "$file" || return 1
  check_adsense_surface "$file" 'Moyu detail' || return 1
}

check_trust_page(){
  file="$1"; marker="$2"; canonical="$3"; label="$4"
  require_fixed "$file" "$marker" "$label content" || return 1
  require_fixed "$file" "rel=\"canonical\" href=\"$canonical\"" "$label canonical" || return 1
  require_fixed "$file" 'name="robots" content="index,follow"' "$label robots" || return 1
  require_fixed "$file" "$ADSENSE_CLIENT" "$label AdSense client" || return 1
  require_fixed "$file" 'data-lang-choice="zh"' "$label zh control" || return 1
  require_fixed "$file" 'data-lang-choice="en"' "$label en control" || return 1
  require_fixed "$file" 'id="themeToggle"' "$label theme control" || return 1
  require_fixed "$file" 'href="/about/"' "$label About link" || return 1
  require_fixed "$file" 'href="/privacy/"' "$label Privacy link" || return 1
  require_fixed "$file" 'href="/contact/"' "$label Contact link" || return 1
}

check_main_origin(){
  fetch "$work_dir/origin-home.html" --resolve "$MAIN_RESOLVE" "$HOME_URL" && check_home "$work_dir/origin-home.html" || return 1
  fetch "$work_dir/origin-de.html" --resolve "$MAIN_RESOLVE" "$DE_DETAIL_URL" && check_de_detail "$work_dir/origin-de.html" || return 1
  fetch "$work_dir/origin-moyu.html" --resolve "$MAIN_RESOLVE" "$MOYU_DETAIL_URL" && check_moyu_detail "$work_dir/origin-moyu.html" || return 1
  fetch "$work_dir/origin-about.html" --resolve "$MAIN_RESOLVE" "$ABOUT_URL" && check_trust_page "$work_dir/origin-about.html" 'About 91hwl' "$ABOUT_URL" 'About page' || return 1
  fetch "$work_dir/origin-privacy.html" --resolve "$MAIN_RESOLVE" "$PRIVACY_URL" && check_trust_page "$work_dir/origin-privacy.html" 'Google AdSense and consent' "$PRIVACY_URL" 'Privacy page' || return 1
  fetch "$work_dir/origin-contact.html" --resolve "$MAIN_RESOLVE" "$CONTACT_URL" && check_trust_page "$work_dir/origin-contact.html" 'mailto:diaow2331@gmail.com' "$CONTACT_URL" 'Contact page' || return 1
  local ads
  ads="$(curl -fsSL --noproxy '*' --resolve "$MAIN_RESOLVE" "$ADS_URL" | tr -d '\r\n')"
  test "$ads" = "$ADS_LINE" || return 1
}

check_main_origin || fail 'origin 91hwl site contract failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${DE_PLAY_URL}?lang=zh" || fail 'origin Dungeon Echo zh route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${DE_PLAY_URL}?lang=en" || fail 'origin Dungeon Echo en route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${MOYU_PLAY_URL}?lang=zh" || fail 'origin Moyu zh route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${MOYU_PLAY_URL}?lang=en" || fail 'origin Moyu en route failed'

de_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$DE_VERSION_URL" | tr -d '\r\n[:space:]')"
moyu_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$MOYU_VERSION_URL" | tr -d '\r\n[:space:]')"
test "$de_origin" = '1.4.2' || fail "origin Dungeon Echo VERSION mismatch: $de_origin"
test "$moyu_origin" = '1.22.0' || fail "origin Moyu VERSION mismatch: $moyu_origin"

public_ok=false
for ((attempt=1; attempt<=ATTEMPTS; attempt++)); do
  if fetch "$work_dir/public-home.html" "${HOME_URL}?release=$revision" && check_home "$work_dir/public-home.html" \
      && fetch "$work_dir/public-de.html" "${DE_DETAIL_URL}?release=$revision" && check_de_detail "$work_dir/public-de.html" \
      && fetch "$work_dir/public-moyu.html" "${MOYU_DETAIL_URL}?release=$revision" && check_moyu_detail "$work_dir/public-moyu.html" \
      && fetch "$work_dir/public-about.html" "${ABOUT_URL}?release=$revision" && check_trust_page "$work_dir/public-about.html" 'About 91hwl' "$ABOUT_URL" 'About page' \
      && fetch "$work_dir/public-privacy.html" "${PRIVACY_URL}?release=$revision" && check_trust_page "$work_dir/public-privacy.html" 'Google AdSense and consent' "$PRIVACY_URL" 'Privacy page' \
      && fetch "$work_dir/public-contact.html" "${CONTACT_URL}?release=$revision" && check_trust_page "$work_dir/public-contact.html" 'mailto:diaow2331@gmail.com' "$CONTACT_URL" 'Contact page' \
      && test "$(curl -fsSL "${ADS_URL}?release=$revision" | tr -d '\r\n')" = "$ADS_LINE" \
      && test "$(curl -fsSL "${DE_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.4.2' \
      && test "$(curl -fsSL "${MOYU_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.22.0'; then
    public_ok=true
    break
  fi
  if (( attempt < ATTEMPTS )); then sleep "$DELAY"; fi
done
test "$public_ok" = true || fail "public site v1.5.0 check failed after $ATTEMPTS attempts"

echo "homepage=$HOME_URL"
echo "dungeon_echo_detail=$DE_DETAIL_URL"
echo "moyu_detail=$MOYU_DETAIL_URL"
echo "about=$ABOUT_URL"
echo "privacy=$PRIVACY_URL"
echo "contact=$CONTACT_URL"
echo "ads_txt=$ADS_URL"
echo "site_version=$version"
echo 'web_toys_home_health=PASS'
