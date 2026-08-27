#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE=https://play.91hwl.cn/moyu
DUNGEON=https://play.91hwl.cn/dungeon-echo/
RESOLVE=play.91hwl.cn:443:127.0.0.1
ATTEMPTS=6
DELAY=2
fail(){ echo "MOYU_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
work="$(mktemp -d /tmp/moyu-health.XXXXXX)"; trap 'rm -rf -- "$work"' EXIT
fetch(){ curl --fail --silent --show-error --location --noproxy '*' "$@"; }
check_set(){
  prefix="$1"; shift
  fetch "$@" "$BASE/?release=$revision" > "$work/$prefix.html" || return 1
  grep -Fq 'Clock Out Alive' "$work/$prefix.html" || return 1
  grep -Fq 'style.css?v=1110' "$work/$prefix.html" || return 1
  grep -Fq 'game.js?v=1110' "$work/$prefix.html" || return 1
  fetch "$@" "$BASE/style.css?v=1110&release=$revision" > "$work/$prefix.css" || return 1
  grep -Fq 'safe-area-inset-bottom' "$work/$prefix.css" || return 1
  fetch "$@" "$BASE/game.js?v=1110&release=$revision" > "$work/$prefix.js" || return 1
  grep -Fq "dataset.gameVersion='1.11.0'" "$work/$prefix.js" || return 1
  fetch "$@" "$BASE/VERSION?release=$revision" > "$work/$prefix.version" || return 1
  test "$(tr -d '\r\n[:space:]' < "$work/$prefix.version")" = "$version" || return 1
}
check_set origin --resolve "$RESOLVE" || fail 'origin Moyu asset set failed'
fetch --resolve "$RESOLVE" "$DUNGEON" >/dev/null || fail 'Dungeon Echo preservation check failed'
public_ok=false
for ((i=1;i<=ATTEMPTS;i++)); do if check_set public; then public_ok=true; break; fi; ((i<ATTEMPTS)) && sleep "$DELAY"; done
test "$public_ok" = true || fail "public Moyu asset set failed after $ATTEMPTS attempts"
echo "public_url=$BASE/"
echo "public_version=$version"
echo 'moyu_healthcheck=PASS'
