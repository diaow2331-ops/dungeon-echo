#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOME_URL=https://91hwl.cn/
DE_DETAIL_URL=https://91hwl.cn/toys/dungeon-echo/
MOYU_DETAIL_URL=https://91hwl.cn/toys/moyu/
DE_PLAY_URL=https://play.91hwl.cn/dungeon-echo/
MOYU_PLAY_URL=https://play.91hwl.cn/moyu/
DE_VERSION_URL=https://play.91hwl.cn/dungeon-echo/VERSION
MOYU_VERSION_URL=https://play.91hwl.cn/moyu/VERSION
MAIN_RESOLVE=91hwl.cn:443:127.0.0.1
PLAY_RESOLVE=play.91hwl.cn:443:127.0.0.1
ATTEMPTS=6
DELAY=2

fail(){ echo "WEB_TOYS_HOME_HEALTH_ERROR: $*" >&2; exit 1; }
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
work_dir="$(mktemp -d /tmp/web-toys-home-v134-health.XXXXXX)"
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

check_home(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.3.4"' 'homepage site version' || return 1
  require_fixed "$file" 'data-theme="dark"' 'homepage default theme' || return 1
  require_fixed "$file" 'Dungeon Echo' 'homepage Dungeon Echo card' || return 1
  require_fixed "$file" 'Clock Out Alive' 'homepage Moyu card' || return 1
  require_fixed "$file" 'v1.2.10' 'homepage Dungeon Echo version' || return 1
  require_fixed "$file" 'v1.11.5' 'homepage Moyu version' || return 1
  require_fixed "$file" 'GitHub / Source' 'homepage source CTA' || return 1
  require_fixed "$file" '公开仓库' 'homepage open-source copy' || return 1
  grep -Eq 'Open\.|打开。' "$file" || { echo 'HEALTH_CONTRACT_MISS: homepage open CTA' >&2; return 1; }
  require_fixed "$file" 'min-height:42px' 'homepage control height' || return 1
  check_social_contract "$file" 'https://91hwl.cn/' '91hwl · Browser Games' || return 1
  check_pref_contract "$file" || return 1
}

check_de_detail(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.3.4"' 'Dungeon Echo detail site version' || return 1
  require_fixed "$file" 'softwareVersion":"1.2.10"' 'Dungeon Echo detail software version' || return 1
  require_fixed "$file" '901–1180px' 'Dungeon Echo responsive release copy' || return 1
  require_fixed "$file" 'Dungeon Echo' 'Dungeon Echo detail title' || return 1
  require_fixed "$file" 'class-roster.webp' 'Dungeon Echo roster art' || return 1
  require_fixed "$file" 'town-backdrop-v11.webp' 'Dungeon Echo town art' || return 1
  require_fixed "$file" 'final-boss-v11.png' 'Dungeon Echo final boss art' || return 1
  require_fixed "$file" 'href="https://play.91hwl.cn/dungeon-echo/" data-carry' 'Dungeon Echo play link' || return 1
  require_fixed "$file" 'GitHub / Source' 'Dungeon Echo source CTA' || return 1
  require_fixed "$file" 'MIT · OPEN SOURCE' 'Dungeon Echo open-source identity' || return 1
  check_social_contract "$file" 'https://91hwl.cn/toys/dungeon-echo/' 'Dungeon Echo · 100-Floor Browser Roguelike' || return 1
  check_pref_contract "$file" || return 1
}

check_moyu_detail(){
  file="$1"
  require_fixed "$file" 'data-site-version="1.3.4"' 'Moyu detail site version' || return 1
  require_fixed "$file" 'softwareVersion":"1.11.5"' 'Moyu detail software version' || return 1
  require_fixed "$file" 'Clock Out Alive' 'Moyu detail title' || return 1
  require_fixed "$file" '双端更稳' 'Moyu current Chinese release copy' || return 1
  require_fixed "$file" 'Cleaner across screens' 'Moyu current English release copy' || return 1
  require_fixed "$file" 'href="https://play.91hwl.cn/moyu/" data-carry' 'Moyu play link' || return 1
  check_pref_contract "$file" || return 1
}

fetch "$work_dir/origin-home.html" --resolve "$MAIN_RESOLVE" "$HOME_URL" || fail 'origin homepage check failed'
check_home "$work_dir/origin-home.html" || fail 'origin homepage presentation contract failed'
fetch "$work_dir/origin-de.html" --resolve "$MAIN_RESOLVE" "$DE_DETAIL_URL" || fail 'origin Dungeon Echo detail check failed'
check_de_detail "$work_dir/origin-de.html" || fail 'origin Dungeon Echo detail contract failed'
fetch "$work_dir/origin-moyu.html" --resolve "$MAIN_RESOLVE" "$MOYU_DETAIL_URL" || fail 'origin Moyu detail check failed'
check_moyu_detail "$work_dir/origin-moyu.html" || fail 'origin Moyu detail contract failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${DE_PLAY_URL}?lang=zh" || fail 'origin Dungeon Echo zh route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${DE_PLAY_URL}?lang=en" || fail 'origin Dungeon Echo en route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${MOYU_PLAY_URL}?lang=zh" || fail 'origin Moyu zh route failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "${MOYU_PLAY_URL}?lang=en" || fail 'origin Moyu en route failed'

de_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$DE_VERSION_URL" | tr -d '\r\n[:space:]')"
moyu_origin="$(curl -fsSL --noproxy '*' --resolve "$PLAY_RESOLVE" "$MOYU_VERSION_URL" | tr -d '\r\n[:space:]')"
test "$de_origin" = '1.2.10' || fail "origin Dungeon Echo VERSION mismatch: $de_origin"
test "$moyu_origin" = '1.11.5' || fail "origin Moyu VERSION mismatch: $moyu_origin"

public_ok=false
for ((attempt=1; attempt<=ATTEMPTS; attempt++)); do
  if fetch "$work_dir/public-home.html" "${HOME_URL}?release=$revision" && check_home "$work_dir/public-home.html" \
      && fetch "$work_dir/public-de.html" "${DE_DETAIL_URL}?release=$revision" && check_de_detail "$work_dir/public-de.html" \
      && fetch "$work_dir/public-moyu.html" "${MOYU_DETAIL_URL}?release=$revision" && check_moyu_detail "$work_dir/public-moyu.html" \
      && test "$(curl -fsSL "${DE_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.2.10' \
      && test "$(curl -fsSL "${MOYU_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.11.5'; then
    public_ok=true
    break
  fi
  if (( attempt < ATTEMPTS )); then sleep "$DELAY"; fi
done
test "$public_ok" = true || fail "public site v1.3.4 check failed after $ATTEMPTS attempts"

echo "homepage=$HOME_URL"
echo "dungeon_echo_detail=$DE_DETAIL_URL"
echo "moyu_detail=$MOYU_DETAIL_URL"
echo "site_version=$version"
echo 'web_toys_home_health=PASS'
