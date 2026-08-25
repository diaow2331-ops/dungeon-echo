#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
version="$(tr -d '\r\n' < "$repo_root/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-home-dungeon-echo-v$version.zip}"
source_root="$repo_root/ops/home-mount"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-home-dungeon-echo-v$version"

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT
command -v zip >/dev/null

mkdir -p "$bundle/public/toys/dungeon-echo" "$bundle/ops"
install -m 0644 "$source_root/public/index.html" "$bundle/public/index.html"
install -m 0644 "$source_root/public/toys/dungeon-echo/index.html" "$bundle/public/toys/dungeon-echo/index.html"
install -m 0755 "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$source_root/README.txt" "$bundle/README.txt"
install -m 0644 "$source_root/EXPECTED_INDEX_SHA256" "$bundle/EXPECTED_INDEX_SHA256"
printf '%s\n' "$revision" > "$bundle/REVISION"
printf '%s\n' "$version" > "$bundle/VERSION"
(
  cd "$bundle"
  find EXPECTED_INDEX_SHA256 README.txt REVISION VERSION ops public -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)

mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"
echo "version=$version"
echo "revision=$revision"
