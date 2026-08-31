#!/usr/bin/env bash
set -euo pipefail
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; URL=https://play.91hwl.cn/board-games/; ORIGIN=play.91hwl.cn:443:127.0.0.1
fail(){ echo "BOARD_GAMES_HEALTHCHECK_ERROR: $*" >&2; exit 1; }
version="$(tr -d '
' < "$BUNDLE_ROOT/VERSION")"; work="$(mktemp -d /tmp/board-games-health.XXXXXX)"; trap 'rm -rf "$work"' EXIT
curl -fsSL --noproxy '*' --resolve "$ORIGIN" "$URL" -o "$work/index.html" || fail 'HTML missing'; grep -Fq '<meta name="version" content="0.2.0"' "$work/index.html" || fail 'version marker missing'
for f in rules.js game.js style.css VERSION; do curl -fsSL --noproxy '*' --resolve "$ORIGIN" "${URL}$f" -o "$work/$f" || fail "$f missing"; done
test "$(tr -d '
[:space:]' < "$work/VERSION")" = "$version" || fail 'VERSION mismatch'; grep -Fq "dataset.gameVersion='0.2.0'" "$work/game.js" || fail 'runtime marker missing'
curl -fsSL --noproxy '*' --resolve "$ORIGIN" https://play.91hwl.cn/dungeon-echo/ -o /dev/null || fail 'Dungeon Echo preservation failed'; curl -fsSL --noproxy '*' --resolve "$ORIGIN" https://play.91hwl.cn/moyu/ -o /dev/null || fail 'Moyu preservation failed'
echo "public_url=$URL"; echo "public_version=$version"; echo 'board_games_healthcheck=PASS'
