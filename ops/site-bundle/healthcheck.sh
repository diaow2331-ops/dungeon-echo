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
ASSET_GENERATION=168

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
  grep -Fq 'v1.3.0' "$body" || return 1
  grep -Fq "?v=$ASSET_GENERATION" "$body" || return 1
  ! grep -Fq '?v=153' "$body" || return 1
  ! grep -Fq '?v=157' "$body" || return 1
  ! grep -Eq 'save-integrity-system|visual-polish|art-runtime-v2|art-runtime-v4|town-art-v160|hero-directional|class-combat-fx|new-run-reset|art/runtime/' "$body" || return 1
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

probe_asset(){
  path="$1"
  out="$2"
  curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
    "https://$HOST/dungeon-echo/$path?release=$revision" -o "$work_dir/$out"
  test -s "$work_dir/$out"
}

probe_absent(){
  path="$1"
  code="$(curl --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" -o /dev/null -w '%{http_code}' \
    "https://$HOST/dungeon-echo/$path?release=$revision" || true)"
  test "$code" = '404'
}

probe_game origin --resolve "$ORIGIN_RESOLVE" "$GAME_URL" || fail 'local origin Chinese game/authority check failed'
probe_game origin-en --resolve "$ORIGIN_RESOLVE" "$EN_URL" || fail 'local origin English game/authority check failed'
probe_version "$version" --resolve "$ORIGIN_RESOLVE" "$VERSION_URL" || fail 'local origin VERSION check failed'

probe_asset 'game/core/game.js' 'game.js' || fail 'authoritative game renderer missing'
probe_asset 'game/core/runtime-bootstrap.js' 'runtime.js' || fail 'runtime bootstrap missing'
probe_asset 'game/core/production-bootstrap.js' 'production.js' || fail 'production authority bootstrap missing'
probe_asset 'game/core/release-stamp-v130.js' 'stamp.js' || fail 'v1.3.0 release stamp missing'
probe_asset 'art/hero-atlas-v11.png' 'hero.png' || fail 'authoritative hero atlas missing'
probe_asset 'art/monster-atlas-v11.png' 'monster.png' || fail 'authoritative monster atlas missing'
probe_asset 'art/guardian-atlas-v11.png' 'guardian.png' || fail 'authoritative guardian atlas missing'
probe_asset 'art/final-boss-v11.png' 'final.png' || fail 'authoritative final boss art missing'

runtime="$work_dir/runtime.js"
production="$work_dir/production.js"
grep -Fq "const assetVersion = '$ASSET_GENERATION'" "$runtime" || fail 'runtime cache generation mismatch'
grep -Fq 'release-stamp-v130.js' "$runtime" || fail 'v1.3.0 stamp not wired'
grep -Fq "renderOwner:'game/core/game.js'" "$runtime" || fail 'runtime render owner mismatch'
! grep -Eq 'stable-item-id-migration|character-art-cleanup|world-loot-polish|new-run-reset' "$runtime" || fail 'legacy follower remains in runtime chain'

grep -Fq "const STORAGE_EPOCH = 'v130'" "$production" || fail 'storage epoch v130 missing'
grep -Fq "renderOwner:'game/core/game.js'" "$production" || fail 'production render owner mismatch'
grep -Fq "newAdventure:'full-reset'" "$production" || fail 'New Adventure full reset contract missing'
grep -Fq "historicalSaveMigration:false" "$production" || fail 'historical save migration unexpectedly enabled'
! grep -Eq 'art-runtime-v4.js|town-art-v160.js|hero-directional-art|class-combat-fx' "$production" || fail 'legacy presentation runtime remains wired'

for retired in \
  game/core/save-integrity-system.js \
  game/core/release-stamp-v1212.js \
  game/locale/stable-item-id-migration-v150.js \
  game/ui/visual-polish.js \
  game/ui/art-runtime-v2.js \
  game/ui/art-runtime-v4.js \
  game/ui/town-art-v160.js \
  game/ui/character-art-cleanup-v122.js \
  game/ui/world-loot-polish-v122.js \
  game/ui/hero-directional-art-v165.js \
  game/ui/class-combat-fx-v163.js \
  game/ui/new-run-reset-v167.js; do
  probe_absent "$retired" || fail "retired runtime still publicly reachable: $retired"
done

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  "https://$HOST/dungeon-echo/game/locale/fixed-locale-entry-v130.js?v=$ASSET_GENERATION" -o "$work_dir/locale.js" || fail 'fixed locale owner asset missing'
grep -Fq 'installNoTranslateBoundary' "$work_dir/locale.js" || fail 'browser retranslation guard missing'
grep -Fq "setAttribute('translate', 'no')" "$work_dir/locale.js" || fail 'translate=no boundary missing'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" \
  "https://$HOST/dungeon-echo/game/ui/responsive-final-v154.js?v=$ASSET_GENERATION" -o "$work_dir/responsive.js" || fail 'responsive owner asset missing'
grep -Fq '@media (min-width:901px) and (max-width:1180px)' "$work_dir/responsive.js" || fail 'mid-width PC rule missing'
grep -Fq 'min-height:44px!important' "$work_dir/responsive.js" || fail 'portrait touch-target rule missing'

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" --output /dev/null "https://$HOST/moyu/" || fail 'existing /moyu/ check failed'
curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" --output /dev/null "https://$HOST/healthz" || fail 'existing /healthz check failed'

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
test "$public_ok" = true || fail "public game/version/authority check failed after $PUBLIC_ATTEMPTS attempts"

echo "public_url=$GAME_URL"
echo "public_version=$version"
echo "asset_generation=$ASSET_GENERATION"
echo 'dungeon_echo_healthcheck=PASS'
