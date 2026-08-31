#!/usr/bin/env bash
set -euo pipefail
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; SITE_ROOT=/srv/91hwl-play; RELEASES_DIR=$SITE_ROOT/releases; CURRENT_LINK=$SITE_ROOT/current; SOURCE=$BUNDLE_ROOT/public/board-games; HEALTHCHECK=$BUNDLE_ROOT/ops/healthcheck.sh
fail(){ echo "BOARD_GAMES_DEPLOY_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'; test "$#" -eq 0 || fail 'no arguments accepted'
(cd "$BUNDLE_ROOT" && sha256sum --check --status SHA256SUMS) || fail 'checksum verification failed'
version="$(tr -d '
' < "$BUNDLE_ROOT/VERSION")"; revision="$(tr -d '
' < "$BUNDLE_ROOT/REVISION")"; test "$version" = '0.6.0' || fail "unexpected version $version"
previous="$(readlink -f "$CURRENT_LINK")"; [[ "$previous" == "$RELEASES_DIR"/* ]] || fail 'invalid current release'; test -r "$previous/dungeon-echo/index.html" || fail 'Dungeon Echo missing'; test -r "$previous/moyu/index.html" || fail 'Moyu missing'
release="$RELEASES_DIR/$(date -u +%Y%m%dT%H%M%SZ)-board-games-${revision:0:12}"; tmp="$(mktemp -d "$RELEASES_DIR/.board-games.XXXXXX")"; next="$SITE_ROOT/.current-board-games-${revision:0:12}"; switched=false
rollback(){ rc=$?; if test "$rc" -ne 0; then if test "$switched" = true; then r="$SITE_ROOT/.rollback-board-games-${revision:0:12}"; ln -s "$previous" "$r"; mv -Tf "$r" "$CURRENT_LINK"; systemctl reload nginx >/dev/null 2>&1 || true; fi; rm -rf "$tmp"; rm -f "$next"; echo board_games_deploy=ROLLED_BACK >&2; fi; exit "$rc"; }; trap rollback EXIT
cp -aL "$previous/." "$tmp/"; rm -rf "$tmp/board-games"; mkdir -p "$tmp/board-games"; cp -a "$SOURCE/." "$tmp/board-games/"; find "$tmp" -type d -exec chmod 0755 {} +; find "$tmp" -type f -exec chmod 0644 {} +
mv "$tmp" "$release"; ln -s "$release" "$next"; mv -Tf "$next" "$CURRENT_LINK"; switched=true; nginx -t; systemctl reload nginx; "$HEALTHCHECK"; trap - EXIT
echo "site_release=$release"; echo "board_games_version=$version"; echo 'board_games_deploy=PASS'
