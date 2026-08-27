#!/usr/bin/env bash
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"; source_root="$repo_root/ops/home-mount"; site_version="$(tr -d '\r\n' < "$source_root/SITE_VERSION")"; revision="$(git -C "$repo_root" rev-parse HEAD)"; output="${1:-$repo_root/91hwl-home-web-toys-v$site_version.zip}"; stage="$(mktemp -d)"; bundle="$stage/91hwl-home-web-toys-v$site_version"; accepted_de=9443cf4755584a521f9c55a15b79fecfc9ecda78; accepted_site=8d6b1a151621484a1a0d2a0655913066ea59aec4
trap 'rm -rf -- "$stage"' EXIT
test "$site_version" = '1.3.1'; test "$(git -C "$repo_root" rev-parse 'v1.2.6^{commit}')" = "$accepted_de"; git -C "$repo_root" merge-base --is-ancestor "$accepted_site" HEAD
mkdir -p "$bundle/public/toys/dungeon-echo" "$bundle/public/toys/moyu" "$bundle/ops"
install -m0644 "$source_root/public/index.html" "$bundle/public/index.html"; install -m0644 "$source_root/public/toys/dungeon-echo/index.html" "$bundle/public/toys/dungeon-echo/index.html"; install -m0644 "$source_root/public/toys/moyu/index.html" "$bundle/public/toys/moyu/index.html"; install -m0755 "$source_root/deploy.sh" "$bundle/ops/deploy.sh"; install -m0755 "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"
git -C "$repo_root" show "$accepted_site:ops/home-mount/public/index.html" > "$stage/previous-index.html"; sha256sum "$stage/previous-index.html"|awk '{print $1}' > "$bundle/EXPECTED_INDEX_SHA256"; printf '%s\n' "$revision">"$bundle/REVISION"; printf '%s\n' "$site_version">"$bundle/VERSION"
(cd "$bundle"; find EXPECTED_INDEX_SHA256 REVISION VERSION ops public -type f -print0|sort -z|while IFS= read -r -d '' f;do sha256sum "$f";done>SHA256SUMS)
mkdir -p "$(dirname "$output")"; rm -f "$output"; (cd "$bundle"&&zip -q -r "$output" .); echo "bundle=$output"; echo "site_version=$site_version"; echo "revision=$revision"
