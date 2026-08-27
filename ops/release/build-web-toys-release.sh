#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
out="${1:-$repo_root/dist/web-toys-release}"
de_version="$(tr -d '\r\n' < "$repo_root/VERSION")"
moyu_version="$(tr -d '\r\n' < "$repo_root/moyu/VERSION")"
site_version="$(tr -d '\r\n' < "$repo_root/ops/home-mount/SITE_VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"

test "$de_version" = '1.2.7' || { echo "unexpected Dungeon Echo version: $de_version" >&2; exit 2; }
test "$moyu_version" = '1.11.3' || { echo "unexpected Moyu version: $moyu_version" >&2; exit 2; }
test "$site_version" = '1.3.3' || { echo "unexpected site version: $site_version" >&2; exit 2; }

tag_target="$(git -C "$repo_root" rev-parse "v${de_version}^{commit}" 2>/dev/null || true)"
test "$tag_target" = "$revision" || {
  echo "v$de_version must point at the exact unified release revision before building all public bundles" >&2
  exit 2
}

mkdir -p "$out"
de_bundle="$out/91hwl-play-dungeon-echo-v$de_version.zip"
moyu_bundle="$out/91hwl-play-moyu-v$moyu_version.zip"
site_bundle="$out/91hwl-home-web-toys-v$site_version.zip"

bash "$repo_root/ops/release/build-site-bundle.sh" "$de_bundle"
bash "$repo_root/ops/release/build-moyu-bundle.sh" "$moyu_bundle"
bash "$repo_root/ops/release/build-home-mount-bundle.sh" "$site_bundle"

echo "web_toys_release_dir=$out"
echo "revision=$revision"
echo "dungeon_echo_bundle=$de_bundle"
echo "moyu_bundle=$moyu_bundle"
echo "site_bundle=$site_bundle"
echo 'web_toys_release_build=PASS'
