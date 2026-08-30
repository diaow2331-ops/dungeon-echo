#!/usr/bin/env bash
set -euo pipefail
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; GAME_URL=https://play.91hwl.cn/moyu/; VERSION_URL=https://play.91hwl.cn/moyu/VERSION; ORIGIN=play.91hwl.cn:443:127.0.0.1
fail(){ echo "MOYU_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"; revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"; work="$(mktemp -d /tmp/moyu-health.XXXXXX)"; trap 'rm -rf -- "$work"' EXIT
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "$GAME_URL?release=$revision" -o "$work/index.html" || fail 'origin HTML missing'
grep -Fq '<meta name="version" content="1.26.0"' "$work/index.html" || fail 'version marker mismatch'; grep -Fq 'game.js?v=1260' "$work/index.html" || fail 'JS fingerprint mismatch'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${GAME_URL}game.js?v=1260" -o "$work/game.js" || fail 'origin JS missing'
grep -Fq "dataset.gameVersion='1.26.0'" "$work/game.js" || fail 'runtime version mismatch'; grep -Fq 'assets/scenes-v126/workstation.svg?v=1260' "$work/game.js" || fail 'HD scene runtime missing'; grep -Fq 'function drawSceneBackdrop(idx)' "$work/game.js" || fail 'HD scene renderer missing'
for f in workstation meeting pantry gym; do curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${GAME_URL}assets/scenes-v126/$f.svg?v=1260" -o "$work/$f.svg" || fail "HD scene missing: $f"; grep -Fq '<svg' "$work/$f.svg" || fail "invalid HD scene: $f"; done
actual="$(curl -fsSL --noproxy '*' --resolve "$ORIGIN" "$VERSION_URL" | tr -d '\r\n[:space:]')"; test "$actual" = "$version" || fail 'origin VERSION mismatch'
for lang in zh en; do curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${GAME_URL}?lang=$lang&release=$revision" -o "$work/$lang.html" || fail "$lang route failed"; grep -Fq 'game.js?v=1260' "$work/$lang.html" || fail "$lang asset mismatch"; done
curl -fsSL --noproxy '*' --resolve "$ORIGIN" https://play.91hwl.cn/dungeon-echo/ -o /dev/null || fail 'Dungeon Echo preservation check failed'
echo "public_url=$GAME_URL"; echo "public_version=$version"; echo 'moyu_healthcheck=PASS'
