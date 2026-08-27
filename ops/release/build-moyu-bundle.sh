#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/moyu"
version="$(tr -d '\r\n' < "$source_root/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-play-moyu-v$version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-play-moyu-v$version"
assembled="$stage_root/game.js"

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

command -v zip >/dev/null
command -v sha256sum >/dev/null
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]

test -r "$source_root/index.html"
test -r "$source_root/style.css"
test -r "$source_root/SOURCE_SHA256"
parts=("$source_root"/src/game.part*.js)
test "${#parts[@]}" -eq 15 || { echo "expected 15 game source parts, found ${#parts[@]}" >&2; exit 2; }

for file in "$source_root/index.html" "$source_root/style.css" "$source_root/VERSION" "$source_root/SOURCE_SHA256" "${parts[@]}"; do
  rel="${file#$repo_root/}"
  git -C "$repo_root" cat-file -e "HEAD:$rel" 2>/dev/null || { echo "untracked release source: $rel" >&2; exit 2; }
done

cat "${parts[@]}" > "$assembled"
expected_index="$(awk '$2=="index.html"{print $1}' "$source_root/SOURCE_SHA256")"
expected_game="$(awk '$2=="game.js"{print $1}' "$source_root/SOURCE_SHA256")"
test -n "$expected_index" -a -n "$expected_game"
test "$(sha256sum "$source_root/index.html" | awk '{print $1}')" = "$expected_index" || { echo 'Moyu index source checksum mismatch' >&2; exit 2; }
test "$(sha256sum "$assembled" | awk '{print $1}')" = "$expected_game" || { echo 'Moyu reconstructed game.js checksum mismatch' >&2; exit 2; }

grep -Fq 'style.css?v=1110' "$source_root/index.html"
grep -Fq 'game.js?v=1110' "$source_root/index.html"
grep -Fq "dataset.gameVersion='1.11.0'" "$assembled"
grep -Fq 'DAY_END_DISTANCE=2200' "$assembled"

mkdir -p "$bundle/public/moyu" "$bundle/ops"
install -m 0644 "$source_root/index.html" "$bundle/public/moyu/index.html"
install -m 0644 "$source_root/style.css" "$bundle/public/moyu/style.css"
install -m 0644 "$assembled" "$bundle/public/moyu/game.js"
printf '%s\n' "$version" > "$bundle/public/moyu/VERSION"
install -m 0755 "$repo_root/ops/moyu-bundle/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$repo_root/ops/moyu-bundle/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$repo_root/ops/moyu-bundle/README.txt" "$bundle/README.txt"
printf '%s\n' "$version" > "$bundle/VERSION"
printf '%s\n' "$revision" > "$bundle/REVISION"
(
  cd "$bundle"
  find README.txt REVISION VERSION ops public -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)
mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"
echo "version=$version"
echo "revision=$revision"
echo "game_sha256=$expected_game"
