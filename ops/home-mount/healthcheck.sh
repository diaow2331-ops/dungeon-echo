#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOME_URL=https://91hwl.cn/
DETAIL_URL=https://91hwl.cn/toys/dungeon-echo/
PLAY_URL=https://play.91hwl.cn/dungeon-echo/
MAIN_RESOLVE=91hwl.cn:443:127.0.0.1
PLAY_RESOLVE=play.91hwl.cn:443:127.0.0.1
ATTEMPTS=6
DELAY=2

fail(){ echo "DUNGEON_ECHO_HOME_HEALTH_ERROR: $*" >&2; exit 1; }
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
work_dir="$(mktemp -d /tmp/dungeon-echo-home-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

fetch(){
  output="$1"
  shift
  curl --fail --silent --show-error --location --noproxy '*' --output "$output" "$@"
}

check_home(){
  file="$1"
  grep -Fq '地牢回响' "$file" || return 1
  grep -Fq 'https://play.91hwl.cn/dungeon-echo/' "$file" || return 1
  grep -Fq 'href="/toys/dungeon-echo/"' "$file" || return 1
  grep -Fq 'data-lang-choice="en"' "$file" || return 1
  grep -Fq 'art/title-backdrop.webp' "$file" || return 1
  grep -Fq 'github.com/diaow2331-ops/dungeon-echo' "$file" || return 1
}

check_detail(){
  file="$1"
  grep -Fq 'Dungeon Echo' "$file" || return 1
  grep -Fq "data-site-version=\"$version\"" "$file" || return 1
  grep -Fq 'data-lang-choice="en"' "$file" || return 1
  grep -Fq 'art/class-roster.webp' "$file" || return 1
  grep -Fq 'art/town-backdrop-v11.webp' "$file" || return 1
  grep -Fq 'art/final-boss-v11.png' "$file" || return 1
  grep -Fq 'github.com/diaow2331-ops/dungeon-echo' "$file" || return 1
}

fetch "$work_dir/home.html" --resolve "$MAIN_RESOLVE" "$HOME_URL" || fail 'origin homepage check failed'
check_home "$work_dir/home.html" || fail 'origin homepage presentation contract failed'

fetch "$work_dir/detail.html" --resolve "$MAIN_RESOLVE" "$DETAIL_URL" || fail 'origin detail page check failed'
check_detail "$work_dir/detail.html" || fail 'origin detail-page presentation contract failed'

fetch /dev/null --resolve "$MAIN_RESOLVE" 'https://91hwl.cn/toys/moyu/' || fail 'existing Moyu detail page check failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "$PLAY_URL" || fail 'live Dungeon Echo check failed'

public_ok=false
for ((attempt=1; attempt<=ATTEMPTS; attempt++)); do
  if fetch "$work_dir/public-home.html" "${HOME_URL}?release=$revision" \
      && check_home "$work_dir/public-home.html" \
      && fetch "$work_dir/public-detail.html" "${DETAIL_URL}?release=$revision" \
      && check_detail "$work_dir/public-detail.html"; then
    public_ok=true
    break
  fi
  if (( attempt < ATTEMPTS )); then sleep "$DELAY"; fi
done
test "$public_ok" = true || fail "public homepage mount check failed after $ATTEMPTS attempts"

echo "homepage=$HOME_URL"
echo "detail_page=$DETAIL_URL"
echo "site_version=$version"
echo 'dungeon_echo_home_health=PASS'
