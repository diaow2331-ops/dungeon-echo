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
work_dir="$(mktemp -d /tmp/web-toys-home-v132-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

fetch(){ output="$1"; shift; curl --fail --silent --show-error --location --noproxy '*' --output "$output" "$@"; }

check_pref_contract(){
  file="$1"
  grep -Fq 'id="themeToggle"' "$file" || return 1
  grep -Fq 'data-lang-choice="zh"' "$file" || return 1
  grep -Fq 'data-lang-choice="en"' "$file" || return 1
  grep -Fq '91hwl_site_lang' "$file" || return 1
  grep -Fq '91hwl_site_theme' "$file" || return 1
  grep -Fq '91hwl_lang' "$file" || return 1
  grep -Fq '91hwl_theme' "$file" || return 1
  grep -Fq 'data-carry' "$file" || return 1
}

check_home(){
  file="$1"
  grep -Fq 'data-site-version="1.3.2"' "$file" || return 1
  grep -Fq 'data-theme="dark"' "$file" || return 1
  grep -Fq 'Dungeon Echo' "$file" || return 1
  grep -Fq 'Clock Out Alive' "$file" || return 1
  grep -Fq 'v1.2.6' "$file" || return 1
  grep -Fq 'v1.11.2' "$file" || return 1
  grep -Eq 'Open\.|打开。' "$file" || return 1
  grep -Fq 'min-height:40px' "$file" || return 1
  check_pref_contract "$file" || return 1
}

check_de_detail(){
  file="$1"
  grep -Fq 'data-site-version="1.3.2"' "$file" || return 1
  grep -Fq 'softwareVersion":"1.2.6"' "$file" || return 1
  grep -Fq 'Dungeon Echo' "$file" || return 1
  grep -Fq 'class-roster.webp' "$file" || return 1
  grep -Fq 'town-backdrop-v11.webp' "$file" || return 1
  grep -Fq 'final-boss-v11.png' "$file" || return 1
  grep -Fq 'href="https://play.91hwl.cn/dungeon-echo/" data-carry' "$file" || return 1
  check_pref_contract "$file" || return 1
}

check_moyu_detail(){
  file="$1"
  grep -Fq 'data-site-version="1.3.2"' "$file" || return 1
  grep -Fq 'softwareVersion":"1.11.2"' "$file" || return 1
  grep -Fq 'Clock Out Alive' "$file" || return 1
  grep -Fq '跟随主页语言' "$file" || return 1
  grep -Fq 'Readable result cards' "$file" || return 1
  grep -Fq 'href="https://play.91hwl.cn/moyu/" data-carry' "$file" || return 1
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
test "$de_origin" = '1.2.6' || fail "origin Dungeon Echo VERSION mismatch: $de_origin"
test "$moyu_origin" = '1.11.2' || fail "origin Moyu VERSION mismatch: $moyu_origin"

public_ok=false
for ((attempt=1; attempt<=ATTEMPTS; attempt++)); do
  if fetch "$work_dir/public-home.html" "${HOME_URL}?release=$revision" && check_home "$work_dir/public-home.html" \
      && fetch "$work_dir/public-de.html" "${DE_DETAIL_URL}?release=$revision" && check_de_detail "$work_dir/public-de.html" \
      && fetch "$work_dir/public-moyu.html" "${MOYU_DETAIL_URL}?release=$revision" && check_moyu_detail "$work_dir/public-moyu.html" \
      && test "$(curl -fsSL "${DE_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.2.6' \
      && test "$(curl -fsSL "${MOYU_VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = '1.11.2'; then
    public_ok=true
    break
  fi
  if (( attempt < ATTEMPTS )); then sleep "$DELAY"; fi
done
test "$public_ok" = true || fail "public site v1.3.2 check failed after $ATTEMPTS attempts"

echo "homepage=$HOME_URL"
echo "dungeon_echo_detail=$DE_DETAIL_URL"
echo "moyu_detail=$MOYU_DETAIL_URL"
echo "site_version=$version"
echo 'web_toys_home_health=PASS'
