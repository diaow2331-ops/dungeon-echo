#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/moyu"
version="$(tr -d '\r\n' < "$source_root/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-play-moyu-v$version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-play-moyu-v$version"

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

command -v zip >/dev/null
command -v sha256sum >/dev/null
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
test -r "$source_root/index.html" || { echo 'moyu/index.html missing' >&2; exit 2; }
test -r "$source_root/SOURCE_SHA256" || { echo 'moyu/SOURCE_SHA256 missing' >&2; exit 2; }
git -C "$repo_root" cat-file -e 'HEAD:moyu/index.html' 2>/dev/null || { echo 'moyu/index.html must be committed before building' >&2; exit 2; }
(
  cd "$source_root"
  sha256sum --check --status SOURCE_SHA256
) || { echo 'moyu source checksum mismatch' >&2; exit 2; }

grep -Fq '<meta name="version" content="1.11.0"' "$source_root/index.html" || { echo 'moyu version marker missing' >&2; exit 2; }
grep -Fq 'Clock Out Alive' "$source_root/index.html" || { echo 'moyu English product identity missing' >&2; exit 2; }
grep -Fq 'https://play.91hwl.cn/moyu/' "$source_root/index.html" || { echo 'moyu canonical URL missing' >&2; exit 2; }

mkdir -p "$bundle/public/moyu" "$bundle/ops"
install -m 0644 "$source_root/index.html" "$bundle/public/moyu/index.html"
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
