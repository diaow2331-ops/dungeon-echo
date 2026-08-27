#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST=play.91hwl.cn
GAME_URL=https://play.91hwl.cn/moyu/
VERSION_URL=https://play.91hwl.cn/moyu/VERSION
ORIGIN_RESOLVE=play.91hwl.cn:443:127.0.0.1
PUBLIC_ATTEMPTS=6
PUBLIC_DELAY=2

fail(){ echo "MOYU_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
work_dir="$(mktemp -d /tmp/moyu-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

probe_game(){
  label="$1"; shift
  body="$work_dir/$label.body"
  headers="$work_dir/$label.headers"
  curl --fail --silent --show-error --location --noproxy '*' --dump-header "$headers" --output "$body" "$@" || return 1
  grep -Fq 'Clock Out Alive' "$body" || return 1
  grep -Fq '<meta name="version" content="1.11.0"' "$body" || return 1
  grep -Eiq '^content-type:.*text/html' "$headers" || return 1
}

probe_version(){
  expected="$1"; shift
  body="$work_dir/version.body"
  curl --fail --silent --show-error --location --noproxy '*' --output "$body" "$@" || return 1
  actual="$(tr -d '\r\n[:space:]' < "$body")"
  test "$actual" = "$expected"
}

probe_game origin --resolve "$ORIGIN_RESOLVE" "$GAME_URL" || fail 'local origin Moyu check failed'
probe_version "$version" --resolve "$ORIGIN_RESOLVE" "$VERSION_URL" || fail 'local origin VERSION check failed'
curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" --output /dev/null "https://$HOST/dungeon-echo/" || fail 'Dungeon Echo preservation check failed'
curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" --output /dev/null "https://$HOST/healthz" || fail 'healthz check failed'

public_ok=false
for ((attempt=1; attempt<=PUBLIC_ATTEMPTS; attempt++)); do
  if probe_game public "${GAME_URL}?release=$revision" && probe_version "$version" "${VERSION_URL}?release=$revision"; then
    public_ok=true
    break
  fi
  if (( attempt < PUBLIC_ATTEMPTS )); then sleep "$PUBLIC_DELAY"; fi
done
test "$public_ok" = true || fail "public Moyu/version check failed after $PUBLIC_ATTEMPTS attempts"

echo "public_url=$GAME_URL"
echo "public_version=$version"
echo 'moyu_healthcheck=PASS'
