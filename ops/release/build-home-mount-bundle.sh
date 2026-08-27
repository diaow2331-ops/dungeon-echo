#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/ops/home-mount"
site_version="$(tr -d '\r\n' < "$source_root/SITE_VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-home-web-toys-v$site_version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-home-web-toys-v$site_version"
accepted_de_v126=9443cf4755584a521f9c55a15b79fecfc9ecda78

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT
command -v zip >/dev/null
command -v sha256sum >/dev/null

test "$site_version" = '1.3.0' || { echo "unexpected site version: $site_version" >&2; exit 2; }
tag_target="$(git -C "$repo_root" rev-parse 'v1.2.6^{commit}' 2>/dev/null || true)"
test "$tag_target" = "$accepted_de_v126" || { echo "v1.2.6 tag boundary missing/moved: ${tag_target:-missing}" >&2; exit 2; }

mkdir -p "$bundle/public/toys/dungeon-echo" "$bundle/public/toys/moyu" "$bundle/ops"
install -m 0644 "$source_root/public/index.html" "$bundle/public/index.html"
install -m 0644 "$source_root/public/toys/dungeon-echo/index.html" "$bundle/public/toys/dungeon-echo/index.html"
install -m 0644 "$source_root/public/toys/moyu/index.html" "$bundle/public/toys/moyu/index.html"
install -m 0755 "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$source_root/README.txt" "$bundle/README.txt"

# The accepted v1.2.6 tag contains the exact site v1.2.3 homepage that was deployed
# before this unified site release. Derive the overwrite guard from that immutable
# boundary instead of carrying a stale manual SHA forward.
git -C "$repo_root" show 'v1.2.6:ops/home-mount/public/index.html' > "$stage_root/previous-index.html"
sha256sum "$stage_root/previous-index.html" | awk '{print $1}' > "$bundle/EXPECTED_INDEX_SHA256"
printf '%s\n' "$revision" > "$bundle/REVISION"
printf '%s\n' "$site_version" > "$bundle/VERSION"
(
  cd "$bundle"
  find EXPECTED_INDEX_SHA256 README.txt REVISION VERSION ops public -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)
mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"
echo "site_version=$site_version"
echo "revision=$revision"
echo "previous_home_sha256=$(cat "$bundle/EXPECTED_INDEX_SHA256")"
