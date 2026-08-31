#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
out="${1:-$repo_root/dist/web-toys-release}"
de_version="$(tr -d '\r\n' < "$repo_root/VERSION")"
moyu_version="$(tr -d '\r\n' < "$repo_root/moyu/VERSION")"
board_version="$(tr -d '\r\n' < "$repo_root/board-games/VERSION")"
site_version="$(tr -d '\r\n' < "$repo_root/ops/home-mount/SITE_VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
semver(){ [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; }
semver "$de_version" || { echo "invalid Dungeon Echo version: $de_version" >&2; exit 2; }
semver "$moyu_version" || { echo "invalid Moyu version: $moyu_version" >&2; exit 2; }
semver "$board_version" || { echo "invalid Board Trio version: $board_version" >&2; exit 2; }
semver "$site_version" || { echo "invalid site version: $site_version" >&2; exit 2; }
test -z "$(git -C "$repo_root" status --porcelain --untracked-files=no)" || { echo 'tracked worktree is not clean' >&2; exit 2; }

mkdir -p "$out"
de_bundle="$out/91hwl-play-dungeon-echo-v$de_version.zip"
moyu_bundle="$out/91hwl-play-moyu-v$moyu_version.zip"
board_bundle="$out/91hwl-play-board-games-v$board_version.zip"
site_bundle="$out/91hwl-home-web-toys-v$site_version.zip"
bash "$repo_root/ops/release/build-site-bundle.sh" "$de_bundle"
bash "$repo_root/ops/release/build-moyu-bundle.sh" "$moyu_bundle"
bash "$repo_root/ops/release/build-board-games-bundle.sh" "$board_bundle"
bash "$repo_root/ops/release/build-home-mount-bundle.sh" "$site_bundle"

echo "web_toys_release_dir=$out"
echo "revision=$revision"
echo "dungeon_echo_bundle=$de_bundle"
echo "moyu_bundle=$moyu_bundle"
echo "board_games_bundle=$board_bundle"
echo "site_bundle=$site_bundle"
echo 'web_toys_release_build=PASS'