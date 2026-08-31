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
STYLE_URL=https://91hwl.cn/assets/site-v1110/style.css
SCRIPT_URL=https://91hwl.cn/assets/site-v1110/site.js
ART_URL=https://91hwl.cn/assets/site-v1110/wang-jian-landscape-1668.jpg
MOYU_COVER_URL=https://91hwl.cn/assets/site-v1110/moyu-run-v1265.jpg
DE_COVER_URL=https://91hwl.cn/assets/site-v1110/dungeon-roster.webp
DE_PLAY_URL=https://play.91hwl.cn/dungeon-echo/
MOYU_PLAY_URL=https://play.91hwl.cn/moyu/
BOARD_PLAY_URL=https://play.91hwl.cn/board-games/
DE_VERSION_URL=https://play.91hwl.cn/dungeon-echo/VERSION
MOYU_VERSION_URL=https://play.91hwl.cn/moyu/VERSION
BOARD_VERSION_URL=https://play.91hwl.cn/board-games/VERSION
MAIN_RESOLVE=91hwl.cn:443:127.0.0.1
PLAY_RESOLVE=play.91hwl.cn:443:127.0.0.1
ADSENSE_CLIENT=ca-pub-2648680835467283
ADS_LINE='google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0'
ATTEMPTS=6
DELAY=2

fail(){ echo "WEB_TOYS_HOME_HEALTH_ERROR: $*" >&2; exit 1; }
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
work_dir="$(mktemp -d /tmp/web-toys-home-v190-health.XXXXXX)"
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
  require_fixed "$file" 'site-v1110/site.js' 'shared interaction runtime' || return 1
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
  require_fixed "$file" 'data-site-version="1.11.4"' 'homepage site version' || return 1
  require_fixed "$file" 'data-theme="dark"' 'homepage default theme' || return 1
  require_fixed "$file" 'Dungeon Echo' 'homepage Dungeon Echo card' || return 1
  require_fixed "$file" 'Clock Out Alive' 'homepage Moyu card' || return 1
  require_fixed "$file" '方寸棋局 · Board Trio' 'homepage Board Trio card' || return 1
  require_fixed "$file" 'v1.5.0' 'homepage Dungeon Echo version' || return 1
  require_fixed "$file" 'v1.26.5' 'homepage Moyu version' || return 1
  require_fixed "$file" 'v0.2.1' 'homepage Board Trio version' || return 1
  require_fixed "$file" 'GitHub / Source' 'homepage source CTA' || return 1
  require_fixed "$file" '公开开发' 'homepage public-development copy' || return 1
  require_fixed "$file" 'site-v1110/style.css' 'homepage v1.11.4 shared design' || return 1
  require_fixed "$file" 'quick-pick' 'homepage quick pick' || return 1
  require_fixed "$file" 'hero-showcase' 'homepage game-art hero' || return 1
  require_fixed "$file" '浏览器游戏' 'homepage Chinese hero copy' || return 1
  require_fixed "$file" 'game-card-board' 'homepage Board Trio visual card' || return 1
  require_fixed "$file" 'https://play.91hwl.cn/board-games/' 'homepage Board Trio play link' || return 1
  ! grep -Fq '下一款开发中' "$file" || return 1
  require_fixed "$file" 'game-media-moyu' 'homepage Moyu visual cover hook' || return 1
  require_fixed "$file" 'dungeon-roster.webp' 'homepage Dungeon visual cover hook' || return 1
  require_fixed "$file" 'id="navToggle"' 'homepage mobile directory control' || return 1
  require_fixed "$file" '关于、隐私与联系。' 'homepage records heading' || return 1
  require_fixed "$file" 'mailto:diaow2331@gmail.com' 'homepage visible contact email' || return 1
  require_fixed "$file" '游戏界面本身不放广告' 'homepage ad-surface disclosure' || return 1
  grep -Eq 'Browser games|浏览器游戏' "$file" || { echo 'HEALTH_CONTRACT_MISS: homepage direct game headline' >&2; return 1; }
  check_social_contract "$file" 'https://91hwl.cn/' '91hwl · Browser Games' || return 1
  check_pref_contract "$file" || return 1
  check_adsense_surface "$file" 'homepage' || return 1
}

check_de_detail(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.11.4"' 'Dungeon Echo detail site version' || return 1
  require_fixed "$file" 'softwareVersion":"1.5.0"' 'Dungeon Echo detail software version' || return 1
  require_fixed "$file" '强化战斗打击反馈' 'Dungeon Echo v1.5.0 release copy' || return 1
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
  require_fixed "$file" 'data-site-version="1.11.4"' 'Moyu detail site version' || return 1
  require_fixed "$file" 'softwareVersion":"1.26.5"' 'Moyu detail software version' || return 1
  require_fixed "$file" 'Clock Out Alive' 'Moyu detail title' || return 1
  require_fixed "$file" '画面与信息都更清楚' 'Moyu current Chinese release copy' || return 1
  require_fixed "$file" 'Clearer world, readable UI' 'Moyu current English release copy' || return 1
  require_fixed "$file" 'href="https://play.91hwl.cn/moyu/" data-carry' 'Moyu play link' || return 1
  check_pref_contract "$file" || return 1
  check_adsense_surface "$file" 'Moyu detail' || return 1
}

check_trust_page(){
  file="$1"; marker="$2"; canonical="$3"; label="$4"
  require_fixed "$file" "$marker" "$label content" || return 1
  require_fixed "$file" "rel=\"canonical\" href=\"$canonical\"" "$label canonical" || return 1
  require_fixed "$file" 'name="robots" content="index,follow"' "$label robots" || return 1
  require_fixed "$file" 'data-site-version="1.11.4"' "$label site version" || return 1
  require_fixed "$file" 'site-v1110/style.css' "$label shared design" || return 1
  require_fixed "$file" 'site-v1110/site.js' "$label shared interactions" || return 1
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
  fetch "$work_dir/origin-about.html" --resolve "$MAIN_RESOLVE" "$ABOUT_URL" && check_trust_page "$work_dir/origin-about.html" '这是一个独立浏览器游戏站。' "$ABOUT_URL" 'About page' || return 1
  fetch "$work_dir/origin-privacy.html" --resolve "$MAIN_RESOLVE" "$PRIVACY_URL" && check_trust_page "$work_dir/origin-privacy.html" '隐私说明' "$PRIVACY_URL" 'Privacy page' || return 1
  fetch "$work_dir/origin-contact.html" --resolve "$MAIN_RESOLVE" "$CONTACT_URL" && check_trust_page "$work_dir/origin-contact.html" '如何提交有效反馈' "$CONTACT_URL" 'Contact page' || return 1
  fetch "$work_dir/origin-style.css" --resolve "$MAIN_RESOLVE" "$STYLE_URL" && require_fixed "$work_dir/origin-style.css" '.hero-showcase' 'shared modern Chinese design CSS' || return 1
  fetch "$work_dir/origin-site.js" --resolve "$MAIN_RESOLVE" "$SCRIPT_URL" && require_fixed "$work_dir/origin-site.js" 'data-game-choice' 'shared interactive chooser runtime' || return 1
  fetch "$work_dir/origin-art.jpg" --resolve "$MAIN_RESOLVE" "$ART_URL" && test -s "$work_dir/origin-art.jpg" || return 1
  fetch "$work_dir/origin-moyu-cover.jpg" --resolve "$MAIN_RESOLVE" "$MOYU_COVER_URL" && test -s "$work_dir/origin-moyu-cover.jpg" || return 1
  fetch "$work_dir/origin-dungeon-cover.webp" --resolve "$MAIN_RESOLVE" "$DE_COVER_URL" && test -s "$work_dir/origin-dungeon-cover.webp" || return 1
  local ads
  ads="$(curl -fsSL --noproxy '*' --resolve "$MAIN_RESOLVE" "$ADS_URL" | tr -d '\r\n')"
  test "$ads" = "$ADS_LINE" || return 1
}

check_main_origin || fail 'origin 91hwl site contract failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${DE_PLAY_URL}?lang=zh" || fail 'origin Dungeon Echo zh route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${DE_PLAY_URL}?lang=en" || fail 'origin Dungeon Echo en route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${MOYU_PLAY_URL}?lang=zh" || fail 'origin Moyu zh route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${MOYU_PLAY_URL}?lang=en" || fail 'origin Moyu en route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${BOARD_PLAY_URL}?game=xiangqi" || fail 'origin Board Trio route failed'

de_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$DE_VERSION_URL" | tr -d '\r\n[:space:]')"
moyu_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$MOYU_VERSION_URL" | tr -d '\r\n[:space:]')"
board_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$BOARD_VERSION_URL" | tr -d '\r\n[:space:]')"
test "$de_origin" = '1.5.0' || fail "origin Dungeon Echo VERSION mismatch: $de_origin"
test "$moyu_origin" = '1.26.5' || fail "origin Moyu VERSION mismatch: $moyu_origin"
test "$board_origin" = '0.2.1' || fail "origin Board Trio VERSION mismatch: $board_origin"

public_ok=false
for ((attempt=1; attempt<=ATTEMPTS; attempt++)); do
  if fetch "$work_dir/public-home.html" "${HOME_URL}?release=$revision" && check_home "$work_dir/public-home.html" \
      && fetch "$work_dir/public-de.html" "${DE_DETAIL_URL}?release=$revision" && check_de_detail "$work_dir/public-de.html" \
      && fetch "$work_dir/public-moyu.html" "${MOYU_DETAIL_URL}?release=$revision" && check_moyu_detail "$work_dir/public-moyu.html" \
      && fetch "$work_dir/public-about.html" "${ABOUT_URL}?release=$revision" && check_trust_page "$work_dir/public-about.html" '这是一个独立浏览器游戏站。' "$ABOUT_URL" 'About page' \
      && fetch "$work_dir/public-privacy.html" "${PRIVACY_URL}?release=$revision" && check_trust_page "$work_dir/public-privacy.html" '隐私说明' "$PRIVACY_URL" 'Privacy page' \
      && fetch "$work_dir/public-contact.html" "${CONTACT_URL}?release=$revision" && check_trust_page "$work_dir/public-contact.html" '如何提交有效反馈' "$CONTACT_URL" 'Contact page' \
      && fetch "$work_dir/public-style.css" "${STYLE_URL}?release=$revision" && require_fixed "$work_dir/public-style.css" '.hero-showcase' 'public shared modern Chinese design CSS' \
      && fetch "$work_dir/public-site.js" "${SCRIPT_URL}?release=$revision" && require_fixed "$work_dir/public-site.js" 'data-game-choice' 'public chooser runtime' \
      && fetch "$work_dir/public-art.jpg" "${ART_URL}?release=$revision" && test -s "$work_dir/public-art.jpg" \
      && fetch "$work_dir/public-moyu-cover.jpg" "${MOYU_COVER_URL}?release=$revision" && test -s "$work_dir/public-moyu-cover.jpg" \
      && fetch "$work_dir/public-dungeon-cover.webp" "${DE_COVER_URL}?release=$revision" && test -s "$work_dir/public-dungeon-cover.webp" \
      && test "$(curl -fsSL "${ADS_URL}?release=$revision" | tr -d '\r\n')" = "$ADS_LINE" \
      && test "$(curl -fsSL "${DE_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.5.0' \
      && test "$(curl -fsSL "${MOYU_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.26.5' \
      && test "$(curl -fsSL "${BOARD_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '0.2.1'; then
    public_ok=true
    break
  fi
  if (( attempt < ATTEMPTS )); then sleep "$DELAY"; fi
done
test "$public_ok" = true || fail "public site v1.11.4 check failed after $ATTEMPTS attempts"

echo "homepage=$HOME_URL"
echo "dungeon_echo_detail=$DE_DETAIL_URL"
echo "moyu_detail=$MOYU_DETAIL_URL"
echo "board_trio=$BOARD_PLAY_URL"
echo "about=$ABOUT_URL"
echo "privacy=$PRIVACY_URL"
echo "contact=$CONTACT_URL"
echo "ads_txt=$ADS_URL"
echo "site_version=$version"
echo 'web_toys_home_health=PASS'
