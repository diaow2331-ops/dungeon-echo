#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST=play.91hwl.cn
GAME_URL=https://play.91hwl.cn/dungeon-echo/
EN_URL=https://play.91hwl.cn/dungeon-echo/en/
VERSION_URL=https://play.91hwl.cn/dungeon-echo/VERSION
ORIGIN_RESOLVE=play.91hwl.cn:443:127.0.0.1
PUBLIC_ATTEMPTS=6
PUBLIC_DELAY=2
ASSET_GENERATION=156

fail(){ echo "DUNGEON_ECHO_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
work_dir="$(mktemp -d /tmp/dungeon-echo-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

probe_game(){
  label="$1"
  shift
  body="$work_dir/$label.body"
  headers="$work_dir/$label.headers"
  curl --fail --silent --show-error --location --noproxy '*' \
    --dump-header "$headers" --output "$body" "$@" || return 1
  grep -Fq 'Dungeon Echo' "$body" || return 1
  grep -Fq "?v=$ASSET_GENERATION" "$body" || return 1
  ! grep -Fq '?v=153' "$body" || return 1
  grep -Eiq '^content-type:.*text/html' "$headers" || return 1
}

probe_version(){
  expected="$1"
  shift
  body="$work_dir/version.body"
  curl --fail --silent --show-error --location --noproxy '*' --output "$body" "$@" || return 1
  actual="$(tr -d '\r\n[:space:]' < "$body")"
  test "$actual" = "$expected"
}

probe_game origin --resolve "$ORIGIN_RESOLVE" "$GAME_URL" || fail 'local origin Chinese game/generation check failed'
probe_game origin-en --resolve "$ORIGIN_RESOLVE" "$EN_URL" || fail 'local origin English game/generation check failed'
probe_version "$version" --resolve "$ORIGIN_RESOLVE" "$VERSION_URL" || fail 'local origin VERSION check failed'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  "https://$HOST/dungeon-echo/game/core/runtime-bootstrap.js?v=$ASSET_GENERATION" -o "$work_dir/runtime.js" || fail 'runtime bootstrap missing'
grep -Fq "const assetVersion = '$ASSET_GENERATION'" "$work_dir/runtime.js" || fail 'runtime cache generation mismatch'
grep -Fq 'release-stamp-v1210.js' "$work_dir/runtime.js" || fail 'v1.2.10 release stamp owner missing'
grep -Fq 'town-workspace-v156.js' "$work_dir/runtime.js" || fail 'town workspace owner not wired into runtime'
grep -Fq 'responsive-final-v154.js' "$work_dir/runtime.js" || fail 'responsive owner not wired into runtime'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  "https://$HOST/dungeon-echo/game/ui/town-workspace-v156.js?v=$ASSET_GENERATION" -o "$work_dir/town-workspace.js" || fail 'town workspace asset missing'
grep -Fq '__DE_TOWN_WORKSPACE_V156' "$work_dir/town-workspace.js" || fail 'town workspace owner marker missing'
grep -Fq 'data-de-town-tab="gear"' "$work_dir/town-workspace.js" || fail 'town workspace tabs missing'
grep -Fq '91hwl.cn/' "$work_dir/town-workspace.js" || fail 'back-to-site navigation missing'
grep -Fq 'play.91hwl.cn/moyu/' "$work_dir/town-workspace.js" || fail 'other-game navigation missing'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  "https://$HOST/dungeon-echo/game/locale/fixed-locale-entry-v130.js?v=$ASSET_GENERATION" -o "$work_dir/locale.js" || fail 'fixed locale owner asset missing'
grep -Fq 'installNoTranslateBoundary' "$work_dir/locale.js" || fail 'browser retranslation guard missing'
grep -Fq "setAttribute('translate', 'no')" "$work_dir/locale.js" || fail 'translate=no boundary missing'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  "https://$HOST/dungeon-echo/game/ui/responsive-final-v154.js?v=$ASSET_GENERATION" -o "$work_dir/responsive.js" || fail 'responsive owner asset missing'
grep -Fq '@media (min-width:901px) and (max-width:1180px)' "$work_dir/responsive.js" || fail 'mid-width PC rule missing'
grep -Fq 'min-height:44px!important' "$work_dir/responsive.js" || fail 'portrait touch-target rule missing'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  --output /dev/null "https://$HOST/moyu/" || fail 'existing /moyu/ check failed'
curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  --output /dev/null "https://$HOST/healthz" || fail 'existing /healthz check failed'

public_url="${GAME_URL}?release=$revision"
public_en_url="${EN_URL}?release=$revision"
public_version_url="${VERSION_URL}?release=$revision"
public_ok=false
for ((attempt=1; attempt<=PUBLIC_ATTEMPTS; attempt++)); do
  if probe_game public "$public_url" && probe_game public-en "$public_en_url" && probe_version "$version" "$public_version_url"; then
    public_ok=true
    break
  fi
  if (( attempt < PUBLIC_ATTEMPTS )); then sleep "$PUBLIC_DELAY"; fi
done
test "$public_ok" = true || fail "public game/version/generation check failed after $PUBLIC_ATTEMPTS attempts"

echo "public_url=$GAME_URL"
echo "public_version=$version"
echo "asset_generation=$ASSET_GENERATION"
echo 'dungeon_echo_healthcheck=PASS'
