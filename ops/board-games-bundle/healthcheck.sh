#!/usr/bin/env bash
set -euo pipefail
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; URL=https://play.91hwl.cn/board-games/; ORIGIN=play.91hwl.cn:443:127.0.0.1
fail(){ echo "BOARD_GAMES_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '
' < "$BUNDLE_ROOT/VERSION")"; work="$(mktemp -d /tmp/board-games-health.XXXXXX)"; trap 'rm -rf "$work"' EXIT
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "$URL" -o "$work/index.html" || fail 'HTML missing'; grep -Fq '<meta name="version" content="0.6.2"' "$work/index.html" || fail 'version marker missing'; grep -Fq 'id="langBtn"' "$work/index.html" || fail 'language control missing'; grep -Fq 'id="fullscreenBtn"' "$work/index.html" || fail 'fullscreen control missing'; grep -Fq 'class="top-action home-action"' "$work/index.html" || fail 'home control missing'; grep -Fq 'id="captureFx"' "$work/index.html" || fail 'Xiangqi capture feedback missing'; grep -Fq 'id="startMatchBtn"' "$work/index.html" || fail 'AI start gate missing'; grep -Fq 'id="clearDataBtn"' "$work/index.html" || fail 'local-data reset missing'; grep -Fq 'id="volumeRange"' "$work/index.html" || fail 'volume control missing'
for f in ui.js rules.js ai.js ai-worker.js game.js style.css VERSION; do curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${URL}$f" -o "$work/$f" || fail "$f missing"; done
test "$(tr -d '
[:space:]' < "$work/VERSION")" = "$version" || fail 'VERSION mismatch'; grep -Fq "dataset.gameVersion='0.6.2'" "$work/game.js" || fail 'runtime marker missing'; grep -Fq 'xiangqiOccurrence' "$work/game.js" || fail 'Xiangqi repetition handling missing'; grep -Fq 'function startMatch()' "$work/game.js" || fail 'explicit AI start flow missing'; grep -Fq 'function clearBoardData()' "$work/game.js" || fail 'local-data reset runtime missing'; grep -Fq ':fullscreen .notice{position:absolute' "$work/style.css" || fail 'fullscreen stable notice overlay missing'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" https://play.91hwl.cn/dungeon-echo/ -o /dev/null || fail 'Dungeon Echo preservation failed'; curl -fsSL --noproxy '*' --resolve "$ORIGIN" https://play.91hwl.cn/moyu/ -o /dev/null || fail 'Moyu preservation failed'
echo "public_url=$URL"; echo "public_version=$version"; echo 'board_games_healthcheck=PASS'
