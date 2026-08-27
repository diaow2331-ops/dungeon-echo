#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
out_dir="${1:-$repo_root/dist/web-toys-release}"
de_version="$(tr -d '\r\n' < "$repo_root/VERSION")"
moyu_version="$(tr -d '\r\n' < "$repo_root/moyu/VERSION")"
site_version="$(tr -d '\r\n' < "$repo_root/ops/home-mount/SITE_VERSION")"

mkdir -p "$out_dir"
test "$de_version" = '1.2.6' || { echo "unexpected Dungeon Echo version: $de_version" >&2; exit 2; }
test "$moyu_version" = '1.11.0' || { echo "unexpected Moyu version: $moyu_version" >&2; exit 2; }
test "$site_version" = '1.3.0' || { echo "unexpected site version: $site_version" >&2; exit 2; }

# Dungeon Echo v1.2.6 is an already accepted/tagged immutable game boundary.
# Do not rebuild or redeploy it from a later site/Moyu commit.
bash "$repo_root/ops/release/build-moyu-bundle.sh" "$out_dir/91hwl-play-moyu-v$moyu_version.zip"
bash "$repo_root/ops/release/build-home-mount-bundle.sh" "$out_dir/91hwl-home-web-toys-v$site_version.zip"

cat <<EOF
web_toys_release_dir=$out_dir
dungeon_echo_boundary=v1.2.6 (frozen; no rebuild)
moyu_bundle=$out_dir/91hwl-play-moyu-v$moyu_version.zip
site_bundle=$out_dir/91hwl-home-web-toys-v$site_version.zip
web_toys_release_build=PASS
EOF
