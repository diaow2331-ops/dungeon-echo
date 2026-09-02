#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST=play.91hwl.cn
GAME_URL=https://play.91hwl.cn/dungeon-echo/
EN_URL=https://play.91hwl.cn/dungeon-echo/en/
VERSION_URL=https://play.91hwl.cn/dungeon-echo/VERSION
ORIGIN_RESOLVE=play.91hwl.cn:443:127.0.0.1
ASSET_GENERATION=183
PUBLIC_ATTEMPTS=6
PUBLIC_DELAY=2

fail(){ echo "DUNGEON_ECHO_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"
revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"
work_dir="$(mktemp -d /tmp/dungeon-echo-health.XXXXXX)"
trap 'rm -rf -- "$work_dir"' EXIT

probe_game(){
  label="$1"; shift
  body="$work_dir/$label.body"; headers="$work_dir/$label.headers"
  curl --fail --silent --show-error --location --noproxy '*' --dump-header "$headers" --output "$body" "$@" || return 1
  grep -Fq 'Dungeon Echo' "$body" || return 1
  grep -Fq 'v1.8.1' "$body" || return 1
  grep -Fq "?v=$ASSET_GENERATION" "$body" || return 1
  ! grep -Eq '\?v=(153|157|166|167|168|169|178|179|180|181)' "$body" || return 1
  ! grep -Eq 'game/systems/|combat-controls|core-screen-owner|town-canvas-locale|town-workspace|forge-feedback|combat-hint-polish|expedition-pressure|audio-director|mobile-ux|expedition-record' "$body" || return 1
  grep -Eiq '^content-type:.*text/html' "$headers" || return 1
}
probe_version(){
  expected="$1"; shift
  body="$work_dir/version.body"
  curl --fail --silent --show-error --location --noproxy '*' --output "$body" "$@" || return 1
  test "$(tr -d '\r\n[:space:]' < "$body")" = "$expected"
}
probe_asset(){
  path="$1"; out="$2"
  curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" "https://$HOST/dungeon-echo/$path?release=$revision" -o "$work_dir/$out"
  test -s "$work_dir/$out"
}
probe_absent(){
  path="$1"
  code="$(curl --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" -o /dev/null -w '%{http_code}' "https://$HOST/dungeon-echo/$path?release=$revision" || true)"
  test "$code" = '404'
}

probe_game origin --resolve "$ORIGIN_RESOLVE" "$GAME_URL" || fail 'origin Chinese authority check failed'
probe_game origin-en --resolve "$ORIGIN_RESOLVE" "$EN_URL" || fail 'origin English authority check failed'
probe_version "$version" --resolve "$ORIGIN_RESOLVE" "$VERSION_URL" || fail 'origin VERSION check failed'
probe_asset 'game/core/game.js' 'game.js' || fail 'canonical game owner missing'
probe_asset 'game/core/production-bootstrap.js' 'production.js' || fail 'production authority missing'
probe_asset 'game/core/runtime-bootstrap.js' 'runtime.js' || fail 'runtime loader missing'
probe_asset 'game/input/desktop-controls.js' 'gamepad.js' || fail 'gamepad transport missing'
probe_asset 'game/domain/town/town-rules-v130.js' 'town-rules.js' || fail 'town policy authority missing'
probe_asset 'game/domain/economy/economy-rules-v130.js' 'economy-rules.js' || fail 'economy pricing authority missing'
probe_asset 'game/domain/town/town-growth-rules-v180.js' 'town-growth-rules.js' || fail 'town growth policy authority missing'
probe_asset 'game/domain/inventory/set-rules-v180.js' 'set-rules.js' || fail 'named relic policy authority missing'
probe_asset 'game/domain/expedition/expedition-rules-v170.js' 'expedition-rules.js' || fail 'expedition variation authority missing'
probe_asset 'art/named-relic-atlas-v180.webp' 'named-relic-atlas.webp' || fail 'named relic atlas missing'
probe_asset 'art/town-growth-atlas-v180.webp' 'town-growth-atlas.webp' || fail 'town growth atlas missing'
probe_asset 'art/town-backdrop-v190.webp' 'town-backdrop-v190.webp' || fail 'authored town backdrop missing'
probe_asset 'art/town-blacksmith-v190.webp' 'town-blacksmith-v190.webp' || fail 'authored blacksmith scene missing'
probe_asset 'art/town-market-v190.webp' 'town-market-v190.webp' || fail 'authored market scene missing'
probe_asset 'art/town-tavern-v190.webp' 'town-tavern-v190.webp' || fail 'authored tavern scene missing'
probe_asset 'art/town-relic-hall-v190.webp' 'town-relic-hall-v190.webp' || fail 'authored relic hall scene missing'
probe_asset 'art/town-npc-atlas-v180.webp' 'town-npc-atlas.webp' || fail 'town NPC scene atlas missing'
probe_asset 'art/town-npc-portraits-v180.webp' 'town-npc-portraits.webp' || fail 'town NPC portrait atlas missing'
grep -Fq "authority: 'town-checkpoint-readiness-policy'" "$work_dir/town-rules.js" || fail 'town policy authority mismatch'
grep -Fq "authority:'economy-pricing'" "$work_dir/economy-rules.js" || fail 'economy pricing authority mismatch'
grep -Fq "authority:'town-growth-policy'" "$work_dir/town-growth-rules.js" || fail 'town growth policy authority mismatch'
grep -Fq "authority:'named-set-policy'" "$work_dir/set-rules.js" || fail 'named relic policy authority mismatch'
grep -Fq "authority:'expedition-variation-policy'" "$work_dir/expedition-rules.js" || fail 'expedition variation authority mismatch'

grep -Fq "const assetVersion = '$ASSET_GENERATION'" "$work_dir/runtime.js" || fail 'runtime generation mismatch'
grep -Fq "followers:'presentation-only'" "$work_dir/runtime.js" || fail 'runtime followers not presentation-only'
grep -Fq "gameplayStateOwner:'game/core/game.js'" "$work_dir/runtime.js" || fail 'state authority mismatch'
grep -Fq "gameplayInputOwner:'game/core/game.js'" "$work_dir/production.js" || fail 'input authority mismatch'
grep -Fq "gameplayPersistenceOwner:'game/core/game.js'" "$work_dir/production.js" || fail 'persistence authority mismatch'
! grep -Eq 'DE_COMMERCE|DE_TEST|localStorage' "$work_dir/gamepad.js" || fail 'gamepad transport owns gameplay/state/storage'

for retired in \
  game/input/combat-controls.js \
  game/locale/core-screen-owner-v153.js game/locale/town-canvas-locale-v153.js \
  game/systems/town-system.js game/systems/commerce-system.js game/systems/equipment-system.js \
  game/systems/progression-system.js game/systems/gameplay-tuning.js game/systems/risk-reward-system.js \
  game/ui/town-workspace-v156.js game/ui/forge-feedback-v122.js game/ui/expedition-pressure-v1211.js; do
  probe_absent "$retired" || fail "retired second authority still public: $retired"
done

curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" --output /dev/null "https://$HOST/moyu/" || fail 'existing /moyu/ check failed'
curl --fail --silent --show-error --noproxy '*' --resolve "$ORIGIN_RESOLVE" --output /dev/null "https://$HOST/healthz" || fail 'existing /healthz check failed'

public_ok=false
for ((attempt=1; attempt<=PUBLIC_ATTEMPTS; attempt++)); do
  if probe_game public "${GAME_URL}?release=$revision" && probe_game public-en "${EN_URL}?release=$revision" && probe_version "$version" "${VERSION_URL}?release=$revision"; then
    public_ok=true; break
  fi
  (( attempt < PUBLIC_ATTEMPTS )) && sleep "$PUBLIC_DELAY"
done
test "$public_ok" = true || fail "public authority check failed after $PUBLIC_ATTEMPTS attempts"
echo "public_url=$GAME_URL"
echo "public_version=$version"
echo "asset_generation=$ASSET_GENERATION"
echo 'authority_graph=single'
echo 'dungeon_echo_healthcheck=PASS'
