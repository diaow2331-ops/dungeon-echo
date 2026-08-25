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
work_dir="$(mktemp -d /tmp/dungeon-echo-home-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

fetch(){
  output="$1"
  shift
  curl --fail --silent --show-error --location --noproxy '*' --output "$output" "$@"
}

fetch "$work_dir/home.html" --resolve "$MAIN_RESOLVE" "$HOME_URL" || fail 'origin homepage check failed'
grep -Fq '地牢回响' "$work_dir/home.html" || fail 'homepage card title missing'
grep -Fq 'https://play.91hwl.cn/dungeon-echo/' "$work_dir/home.html" || fail 'homepage play link missing'
grep -Fq 'href="/toys/dungeon-echo/"' "$work_dir/home.html" || fail 'homepage detail link missing'

fetch "$work_dir/detail.html" --resolve "$MAIN_RESOLVE" "$DETAIL_URL" || fail 'origin detail page check failed'
grep -Fq '地牢回响' "$work_dir/detail.html" || fail 'detail page title missing'
fetch /dev/null --resolve "$MAIN_RESOLVE" 'https://91hwl.cn/toys/moyu/' || fail 'existing Moyu detail page check failed'
fetch /dev/null --resolve "$PLAY_RESOLVE" "$PLAY_URL" || fail 'live Dungeon Echo check failed'

public_ok=false
for ((attempt=1; attempt<=ATTEMPTS; attempt++)); do
  if fetch "$work_dir/public-home.html" "${HOME_URL}?release=$revision" \
      && grep -Fq '地牢回响' "$work_dir/public-home.html" \
      && fetch "$work_dir/public-detail.html" "${DETAIL_URL}?release=$revision" \
      && grep -Fq '地牢回响' "$work_dir/public-detail.html"; then
    public_ok=true
    break
  fi
  if (( attempt < ATTEMPTS )); then sleep "$DELAY"; fi
done
test "$public_ok" = true || fail "public homepage mount check failed after $ATTEMPTS attempts"

echo "homepage=$HOME_URL"
echo "detail_page=$DETAIL_URL"
echo 'dungeon_echo_home_health=PASS'
