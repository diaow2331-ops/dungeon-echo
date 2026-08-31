#!/usr/bin/env bash
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
version="$(tr -d '\n' < "$repo_root/board-games/VERSION")"
revision="${SOURCE_REVISION:-$(git -C "$repo_root" rev-parse HEAD)}"
output="${1:-$repo_root/91hwl-play-board-games-v$version.zip}"
stage="$(mktemp -d)"; trap 'rm -rf -- "$stage"' EXIT
bundle="$stage/91hwl-play-board-games-v$version"
test "$version" = '0.6.2'
[[ "$revision" =~ ^[0-9a-f]{40}$ ]]
files=(VERSION index.html style.css ui.js rules.js ai.js ai-worker.js game.js)
mkdir -p "$bundle/public/board-games" "$bundle/ops"
for f in "${files[@]}"; do git -C "$repo_root" cat-file -e "HEAD:board-games/$f"; cp "$repo_root/board-games/$f" "$bundle/public/board-games/$f"; done
grep -Fq '<meta name="version" content="0.6.2"' "$bundle/public/board-games/index.html"
grep -Fq 'ui.js?v=062' "$bundle/public/board-games/index.html"
grep -Fq 'rules.js?v=062' "$bundle/public/board-games/index.html"
grep -Fq 'ai.js?v=062' "$bundle/public/board-games/index.html"
grep -Fq 'id="langBtn"' "$bundle/public/board-games/index.html"
grep -Fq 'id="fullscreenBtn"' "$bundle/public/board-games/index.html"
grep -Fq 'class="top-action home-action"' "$bundle/public/board-games/index.html"
grep -Fq 'id="startMatchBtn"' "$bundle/public/board-games/index.html"
grep -Fq 'id="clearDataBtn"' "$bundle/public/board-games/index.html"
grep -Fq 'id="volumeRange"' "$bundle/public/board-games/index.html"
grep -Fq "dataset.gameVersion='0.6.2'" "$bundle/public/board-games/game.js"
node --check "$bundle/public/board-games/ui.js"; node --check "$bundle/public/board-games/rules.js"; node --check "$bundle/public/board-games/ai.js"; node --check "$bundle/public/board-games/ai-worker.js"; node --check "$bundle/public/board-games/game.js"
install -m 0755 "$repo_root/ops/board-games-bundle/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$repo_root/ops/board-games-bundle/healthcheck.sh" "$bundle/ops/healthcheck.sh"
printf '%s\n' "$version" > "$bundle/VERSION"; printf '%s\n' "$revision" > "$bundle/REVISION"
(cd "$bundle" && find REVISION VERSION ops public -type f -print0 | sort -z | while IFS= read -r -d '' f; do sha256sum "$f"; done > SHA256SUMS)
mkdir -p "$(dirname "$output")"; rm -f "$output"; (cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"; echo "version=$version"; echo "revision=$revision"; echo 'board_games_bundle_build=PASS'
