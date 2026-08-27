#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/ops/home-mount"
site_version="$(tr -d '\r\n' < "$source_root/SITE_VERSION")"
game_version="$(tr -d '\r\n' < "$repo_root/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-home-web-toys-v$site_version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-home-web-toys-v$site_version"
accepted_site_v132=e15ac9959687dbd47457cd650a0e96f008c151c5

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

command -v zip >/dev/null
command -v sha256sum >/dev/null
command -v sed >/dev/null
command -v bash >/dev/null

test "$site_version" = '1.3.3' || { echo "unexpected site version: $site_version" >&2; exit 2; }
test "$game_version" = '1.2.7' || { echo "unexpected Dungeon Echo version: $game_version" >&2; exit 2; }
git -C "$repo_root" merge-base --is-ancestor "$accepted_site_v132" HEAD || { echo 'accepted site v1.3.2 boundary is not an ancestor of HEAD' >&2; exit 2; }

for file in \
  "$source_root/SITE_VERSION" \
  "$source_root/README.txt" \
  "$source_root/deploy.sh" \
  "$source_root/healthcheck.sh" \
  "$source_root/public/index.html" \
  "$source_root/public/toys/dungeon-echo/index.html" \
  "$source_root/public/toys/moyu/index.html"; do
  rel="${file#$repo_root/}"
  git -C "$repo_root" cat-file -e "HEAD:$rel" 2>/dev/null || { echo "untracked site release source: $rel" >&2; exit 2; }
done

grep -Fq 'data-site-version="1.3.3"' "$source_root/public/index.html"
grep -Fq 'name="google" content="notranslate"' "$source_root/public/index.html"
grep -Fq 'window.__91HWL_PREFS' "$source_root/public/index.html"
grep -Fq -- '--fs-body:16px' "$source_root/public/index.html"
grep -Fq 'min-height:42px' "$source_root/public/index.html"
grep -Fq "softwareVersion\":\"$game_version\"" "$source_root/public/toys/dungeon-echo/index.html"
grep -Fq 'softwareVersion":"1.11.3"' "$source_root/public/toys/moyu/index.html"
grep -Fq '先把字看清楚' "$source_root/public/toys/moyu/index.html"
grep -Fq 'Readable first' "$source_root/public/toys/moyu/index.html"

mkdir -p "$bundle/public/toys/dungeon-echo" "$bundle/public/toys/moyu" "$bundle/ops"
install -m 0644 "$source_root/public/index.html" "$bundle/public/index.html"
install -m 0644 "$source_root/public/toys/dungeon-echo/index.html" "$bundle/public/toys/dungeon-echo/index.html"
install -m 0644 "$source_root/public/toys/moyu/index.html" "$bundle/public/toys/moyu/index.html"
install -m 0755 "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$source_root/README.txt" "$bundle/README.txt"

# Reuse the field-tested v1.3.2 deploy/health logic, then deterministically adapt it to the v1.3.3 release facts.
for script in "$bundle/ops/deploy.sh" "$bundle/ops/healthcheck.sh"; do
  sed -i \
    -e 's/1\.3\.2/1.3.3/g' \
    -e 's/v132/v133/g' \
    -e 's/1\.11\.2/1.11.3/g' \
    -e 's/1\.2\.6/1.2.7/g' \
    -e 's/min-height:40px/min-height:42px/g' \
    -e 's/跟随主页语言/先把字看清楚/g' \
    -e 's/Readable result cards/Readable first/g' \
    "$script"
  bash -n "$script"
done

grep -Fq "test \"\$version\" = '1.3.3'" "$bundle/ops/deploy.sh"
grep -Fq 'Dungeon Echo v1.2.7 detail marker missing' "$bundle/ops/deploy.sh"
grep -Fq 'web_toys_home_mount=ROLLED_BACK' "$bundle/ops/deploy.sh"
grep -Fq 'public site v1.3.3 check failed' "$bundle/ops/healthcheck.sh"
grep -Fq 'min-height:42px' "$bundle/ops/healthcheck.sh"
grep -Fq '先把字看清楚' "$bundle/ops/healthcheck.sh"
grep -Fq 'Readable first' "$bundle/ops/healthcheck.sh"
! grep -Fq '跟随主页语言' "$bundle/ops/healthcheck.sh"
! grep -Fq 'Readable result cards' "$bundle/ops/healthcheck.sh"
grep -Fq "test \"\$de_origin\" = '1.2.7'" "$bundle/ops/healthcheck.sh"
grep -Fq "test \"\$moyu_origin\" = '1.11.3'" "$bundle/ops/healthcheck.sh"

# Site v1.3.2 is the page set deployed before this prepaint/typography patch.
git -C "$repo_root" show "$accepted_site_v132:ops/home-mount/public/index.html" > "$stage_root/previous-index.html"
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
echo "game_version=$game_version"
echo "revision=$revision"
echo "previous_home_sha256=$(cat "$bundle/EXPECTED_INDEX_SHA256")"
echo 'site_bundle_build=PASS'
