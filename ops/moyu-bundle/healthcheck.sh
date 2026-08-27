#!/usr/bin/env bash
set -euo pipefail
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; GAME_URL=https://play.91hwl.cn/moyu/; VERSION_URL=https://play.91hwl.cn/moyu/VERSION; ORIGIN=play.91hwl.cn:443:127.0.0.1
fail(){ echo "MOYU_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '\r\n' < "$BUNDLE_ROOT/VERSION")"; revision="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"; work="$(mktemp -d /tmp/moyu-health.XXXXXX)"; trap 'rm -rf -- "$work"' EXIT
probe(){ prefix="$1"; shift; curl -fsSL --noproxy '*' "$@" -o "$work/$prefix.html"; grep -Fq '<meta name="version" content="1.11.2"' "$work/$prefix.html"; grep -Fq 'style.css?v=1112' "$work/$prefix.html"; grep -Fq 'visual-v1112.css?v=1112' "$work/$prefix.html"; grep -Fq 'game.js?v=1112' "$work/$prefix.html"; }
probe origin --resolve "$ORIGIN" "$GAME_URL" || fail 'origin HTML check failed'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "https://play.91hwl.cn/moyu/visual-v1112.css?v=1112" -o "$work/visual.css" || fail 'origin visual CSS missing'; grep -Fq 'min-width:60px' "$work/visual.css" || fail 'language control scale missing'; grep -Fq 'font-size:15px' "$work/visual.css" || fail 'result body readability rule missing'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "https://play.91hwl.cn/moyu/game.js?v=1112" -o "$work/game.js" || fail 'origin JS missing'; grep -Fq 'groundTakeoff=before===0' "$work/game.js" || fail 'ground-only jump dust guard missing'; grep -Fq 'writeSharedLangCookie(currentLang)' "$work/game.js" || fail 'shared language bridge missing'; ! grep -Fq 'drawPlayerFocus(drawX,footY,altitude);' "$work/game.js" || fail 'player halo still active'; ! grep -Fq 'drawBackground();drawAmbientOfficeLife();drawRunAtmosphere();' "$work/game.js" || fail 'drifting ambient coworkers still active'
actual="$(curl -fsSL --noproxy '*' --resolve "$ORIGIN" "$VERSION_URL" | tr -d '\r\n[:space:]')"; test "$actual" = "$version" || fail 'origin VERSION mismatch'
# Query propagation must select the requested game language on first load.
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${GAME_URL}?lang=zh&release=$revision" -o "$work/zh.html" || fail 'origin zh route failed'; grep -Fq 'game.js?v=1112' "$work/zh.html" || fail 'zh route asset mismatch'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${GAME_URL}?lang=en&release=$revision" -o "$work/en.html" || fail 'origin en route failed'; grep -Fq 'game.js?v=1112' "$work/en.html" || fail 'en route asset mismatch'
public_ok=false; for i in 1 2 3 4 5 6; do if probe public "${GAME_URL}?release=$revision" && test "$(curl -fsSL "${VERSION_URL}?release=$revision" | tr -d '\r\n[:space:]')" = "$version"; then public_ok=true; break; fi; sleep 2; done; test "$public_ok" = true || fail 'public Moyu check failed'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" https://play.91hwl.cn/dungeon-echo/ -o /dev/null || fail 'Dungeon Echo preservation check failed'
echo "public_url=$GAME_URL"; echo "public_version=$version"; echo 'moyu_healthcheck=PASS'
