#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/ops/home-mount"
site_version="$(tr -d '\r\n' < "$source_root/SITE_VERSION")"
game_version="$(tr -d '\r\n' < "$repo_root/VERSION")"
moyu_version="$(tr -d '\r\n' < "$repo_root/moyu/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-home-web-toys-v$site_version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-home-web-toys-v$site_version"
accepted_site_v133=79d3ad94568447068f37419b24b0851cfbf94850

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

command -v zip >/dev/null
command -v sha256sum >/dev/null
command -v bash >/dev/null
command -v node >/dev/null

test "$site_version" = '1.3.4' || { echo "unexpected site version: $site_version" >&2; exit 2; }
test "$game_version" = '1.2.10' || { echo "unexpected Dungeon Echo version: $game_version" >&2; exit 2; }
test "$moyu_version" = '1.11.5' || { echo "unexpected Moyu version: $moyu_version" >&2; exit 2; }
git -C "$repo_root" merge-base --is-ancestor "$accepted_site_v133" HEAD || { echo 'accepted site v1.3.3 boundary is not an ancestor of HEAD' >&2; exit 2; }

for file in \
  "$source_root/SITE_VERSION" \
  "$source_root/README.txt" \
  "$source_root/deploy.sh" \
  "$source_root/healthcheck.sh" \
  "$source_root/build-v134.cjs" \
  "$source_root/public/index.html" \
  "$source_root/public/toys/dungeon-echo/index.html" \
  "$source_root/public/toys/moyu/index.html"; do
  rel="${file#$repo_root/}"
  git -C "$repo_root" cat-file -e "HEAD:$rel" 2>/dev/null || { echo "untracked site release source: $rel" >&2; exit 2; }
done

mkdir -p "$stage_root/site/public/toys/dungeon-echo" "$stage_root/site/public/toys/moyu"
cp "$source_root/public/index.html" "$stage_root/site/public/index.html"
cp "$source_root/public/toys/dungeon-echo/index.html" "$stage_root/site/public/toys/dungeon-echo/index.html"
cp "$source_root/public/toys/moyu/index.html" "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-v134.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"

home="$stage_root/site/public/index.html"
de_detail="$stage_root/site/public/toys/dungeon-echo/index.html"
moyu_detail="$stage_root/site/public/toys/moyu/index.html"
grep -Fq 'data-site-version="1.3.4"' "$home"
grep -Fq 'name="google" content="notranslate"' "$home"
grep -Fq 'window.__91HWL_PREFS' "$home"
grep -Fq -- '--fs-body:16px' "$home"
grep -Fq 'min-height:42px' "$home"
grep -Fq 'GitHub / Source' "$home"
grep -Fq '公开仓库' "$home"
grep -Fq "softwareVersion\":\"$game_version\"" "$de_detail"
grep -Fq '901–1180px' "$de_detail"
grep -Fq "softwareVersion\":\"$moyu_version\"" "$moyu_detail"
grep -Fq '双端更稳' "$moyu_detail"
grep -Fq 'Cleaner across screens' "$moyu_detail"

bash -n "$source_root/deploy.sh"
bash -n "$source_root/healthcheck.sh"
grep -Fq "test \"\$version\" = '1.3.4'" "$source_root/deploy.sh"
grep -Fq 'Dungeon Echo v1.2.10 detail marker missing' "$source_root/deploy.sh"
grep -Fq 'Clock Out Alive v1.11.5 detail marker missing' "$source_root/deploy.sh"
grep -Fq 'web-toys-v134' "$source_root/deploy.sh"
grep -Fq 'web_toys_home_mount=ROLLED_BACK' "$source_root/deploy.sh"
grep -Fq 'previous_home_sha256=' "$source_root/deploy.sh"
! grep -Fq 'EXPECTED_INDEX_SHA256' "$source_root/deploy.sh"
! grep -Fq 'live homepage changed unexpectedly' "$source_root/deploy.sh"
grep -Fq 'public site v1.3.4 check failed' "$source_root/healthcheck.sh"
grep -Fq 'GitHub / Source' "$source_root/healthcheck.sh"
grep -Fq '双端更稳' "$source_root/healthcheck.sh"
grep -Fq 'Cleaner across screens' "$source_root/healthcheck.sh"
grep -Fq 'HEALTH_CONTRACT_MISS:' "$source_root/healthcheck.sh"

mkdir -p "$bundle/public/toys/dungeon-echo" "$bundle/public/toys/moyu" "$bundle/ops"
install -m 0644 "$home" "$bundle/public/index.html"
install -m 0644 "$de_detail" "$bundle/public/toys/dungeon-echo/index.html"
install -m 0644 "$moyu_detail" "$bundle/public/toys/moyu/index.html"
install -m 0755 "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$source_root/README.txt" "$bundle/README.txt"

cmp -s "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
cmp -s "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"

printf '%s\n' "$revision" > "$bundle/REVISION"
printf '%s\n' "$site_version" > "$bundle/VERSION"
(
  cd "$bundle"
  find README.txt REVISION VERSION ops public -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)

mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)

echo "bundle=$output"
echo "site_version=$site_version"
echo "game_version=$game_version"
echo "moyu_version=$moyu_version"
echo "revision=$revision"
echo 'site_bundle_build=PASS'
