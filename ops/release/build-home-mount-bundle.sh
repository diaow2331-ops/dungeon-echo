#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/ops/home-mount"
site_version="$(tr -d '\r\n' < "$source_root/SITE_VERSION")"
game_version="$(tr -d '\r\n' < "$repo_root/VERSION")"
moyu_version="$(tr -d '\r\n' < "$repo_root/moyu/VERSION")"
board_version="$(tr -d '\r\n' < "$repo_root/board-games/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-home-web-toys-v$site_version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-home-web-toys-v$site_version"
accepted_site_v1112=40c3c1b605c903e7fa3cdfb61d9eeefe5e90c94f

cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT

command -v zip >/dev/null
command -v sha256sum >/dev/null
command -v bash >/dev/null
command -v node >/dev/null

semver(){ [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; }
test "$site_version" = '1.11.8' || { echo "unexpected site version: $site_version" >&2; exit 2; }
semver "$game_version" || { echo "invalid Dungeon Echo version: $game_version" >&2; exit 2; }
semver "$moyu_version" || { echo "invalid Moyu version: $moyu_version" >&2; exit 2; }
semver "$board_version" || { echo "invalid Board Trio version: $board_version" >&2; exit 2; }
git -C "$repo_root" merge-base --is-ancestor "$accepted_site_v1112" HEAD || { echo 'accepted site v1.11.2 boundary is not an ancestor of HEAD' >&2; exit 2; }

for file in \
  "$source_root/SITE_VERSION" \
  "$source_root/README.txt" \
  "$source_root/deploy.sh" \
  "$source_root/healthcheck.sh" \
  "$source_root/build-v134.cjs" \
  "$source_root/build-social-v134.cjs" \
  "$source_root/build-trust-v135.cjs" \
  "$source_root/build-home-v140.cjs" \
  "$source_root/build-home-v150.cjs" \
  "$source_root/build-home-v160.cjs" \
  "$source_root/build-site-v170.cjs" \
  "$source_root/build-site-v180.cjs" \
  "$source_root/build-site-v190.cjs" \
  "$source_root/build-site-v1100.cjs" \
  "$source_root/build-site-v1110.cjs" \
  "$source_root/build-site-v1111.cjs" \
  "$source_root/build-site-v1112.cjs" \
  "$source_root/build-site-v1113.cjs" \
  "$source_root/build-site-v1114.cjs" \
  "$source_root/build-site-v1115.cjs" \
  "$source_root/build-site-v1116.cjs" \
  "$source_root/build-site-v1117.cjs" \
  "$source_root/build-site-v1118.cjs" \
  "$source_root/public/assets/site-v1110/style.css" \
  "$source_root/public/assets/site-v1110/site.js" \
  "$source_root/public/assets/site-v1100/wang-jian-landscape-1668.jpg" \
  "$source_root/public/assets/site-v1100/moyu-run-v1265.jpg" \
  "$source_root/public/assets/site-v1100/dungeon-roster.webp" \
  "$source_root/public/assets/site-v1118/board-gomoku.webp" \
  "$source_root/public/assets/site-v1118/board-xiangqi.webp" \
  "$source_root/public/assets/site-v1118/board-go.webp" \
  "$source_root/public/assets/site-v1118/dungeon-town.webp" \
  "$source_root/public/assets/site-v1118/dungeon-guardians.webp" \
  "$source_root/public/assets/site-v1118/dungeon-weapons.webp" \
  "$source_root/public/assets/site-v1118/dungeon-final.webp" \
  "$source_root/public/assets/site-v1118/moyu-scenes.webp" \
  "$source_root/public/assets/site-v1118/moyu-hero.webp" \
  "$source_root/public/assets/site-v1118/moyu-hazards.webp" \
  "$source_root/public/index.html" \
  "$source_root/public/toys/dungeon-echo/index.html" \
  "$source_root/public/toys/moyu/index.html" \
  "$source_root/public/toys/board-games/index.html" \
  "$source_root/public/about/index.html" \
  "$source_root/public/privacy/index.html" \
  "$source_root/public/contact/index.html" \
  "$source_root/public/ads.txt"; do
  rel="${file#$repo_root/}"
  git -C "$repo_root" cat-file -e "HEAD:$rel" 2>/dev/null || { echo "untracked site release source: $rel" >&2; exit 2; }
done

mkdir -p \
  "$stage_root/site/public/toys/dungeon-echo" \
  "$stage_root/site/public/toys/moyu" \
  "$stage_root/site/public/toys/board-games" \
  "$stage_root/site/public/about" \
  "$stage_root/site/public/privacy" \
  "$stage_root/site/public/contact" \
  "$stage_root/site/public/assets/site-v1110" \
  "$stage_root/site/public/assets/site-v1118"
cp "$source_root/public/index.html" "$stage_root/site/public/index.html"
cp "$source_root/public/toys/dungeon-echo/index.html" "$stage_root/site/public/toys/dungeon-echo/index.html"
cp "$source_root/public/toys/moyu/index.html" "$stage_root/site/public/toys/moyu/index.html"
cp "$source_root/public/toys/board-games/index.html" "$stage_root/site/public/toys/board-games/index.html"
cp "$source_root/public/about/index.html" "$stage_root/site/public/about/index.html"
cp "$source_root/public/privacy/index.html" "$stage_root/site/public/privacy/index.html"
cp "$source_root/public/contact/index.html" "$stage_root/site/public/contact/index.html"
cp "$source_root/public/ads.txt" "$stage_root/site/public/ads.txt"
cp "$source_root/public/assets/site-v1110/style.css" "$stage_root/site/public/assets/site-v1110/style.css"
cp "$source_root/public/assets/site-v1110/site.js" "$stage_root/site/public/assets/site-v1110/site.js"
cp "$source_root/public/assets/site-v1100/wang-jian-landscape-1668.jpg" "$stage_root/site/public/assets/site-v1110/wang-jian-landscape-1668.jpg"
cp "$source_root/public/assets/site-v1100/moyu-run-v1265.jpg" "$stage_root/site/public/assets/site-v1110/moyu-run-v1265.jpg"
cp "$source_root/public/assets/site-v1100/dungeon-roster.webp" "$stage_root/site/public/assets/site-v1110/dungeon-roster.webp"
cp -a "$source_root/public/assets/site-v1118/." "$stage_root/site/public/assets/site-v1118/"
node "$source_root/build-v134.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-social-v134.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-trust-v135.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-home-v140.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-home-v150.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-home-v160.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html"
node "$source_root/build-site-v170.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v180.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v190.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1100.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1110.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1111.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1112.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1113.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1114.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1115.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1116.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1117.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"
node "$source_root/build-site-v1118.cjs" \
  "$stage_root/site/public/index.html" \
  "$stage_root/site/public/toys/dungeon-echo/index.html" \
  "$stage_root/site/public/toys/moyu/index.html" \
  "$stage_root/site/public/toys/board-games/index.html" \
  "$stage_root/site/public/about/index.html" \
  "$stage_root/site/public/privacy/index.html" \
  "$stage_root/site/public/contact/index.html"

home="$stage_root/site/public/index.html"
de_detail="$stage_root/site/public/toys/dungeon-echo/index.html"
moyu_detail="$stage_root/site/public/toys/moyu/index.html"
board_detail="$stage_root/site/public/toys/board-games/index.html"
about="$stage_root/site/public/about/index.html"
privacy="$stage_root/site/public/privacy/index.html"
contact="$stage_root/site/public/contact/index.html"
ads_txt="$stage_root/site/public/ads.txt"

grep -Fq 'data-site-version="1.11.8"' "$home"
grep -Fq 'name="google" content="notranslate"' "$home"
grep -Fq 'window.__91HWL_PREFS' "$home"
grep -Fq -- '--fs-body:16px' "$home"
grep -Fq 'min-height:42px' "$home"
grep -Fq 'GitHub / Source' "$home"
grep -Fq '公开开发' "$home"
grep -Fq 'site-home-v160' "$home"
! grep -Fq 'site-home-v150' "$home"
grep -Fq '浏览器游戏' "$home"
grep -Fq '方寸棋局 · Board Trio' "$home"
grep -Fq "03 / v$board_version" "$home"
grep -Fq '三档本地 AI、双人同屏、逐手棋谱、复盘、棋钟与全屏模式' "$home"
grep -Fq 'https://play.91hwl.cn/board-games/' "$home"
! grep -Fq '下一款开发中' "$home"
grep -Fq 'Browser games.' "$home"
grep -Fq '关于、隐私与联系。' "$home"
! grep -Fq 'site-home-v140' "$home"
! grep -Fq 'site-trust-hub-v135' "$home"
grep -Fq 'https://github.com/diaow2331-ops/dungeon-echo/security/policy' "$home"
grep -Fq '游戏界面本身不放广告' "$home"
grep -Fq 'property="og:url" content="https://91hwl.cn/"' "$home"
grep -Fq 'name="twitter:title" content="91hwl · Browser Games"' "$home"
grep -Fq 'name="twitter:image" content="https://play.91hwl.cn/dungeon-echo/art/title-backdrop.webp"' "$home"
grep -Fq 'ca-pub-2648680835467283' "$home"
grep -Fq 'href="/privacy/"' "$home"
grep -Fq 'quick-pick' "$home"
grep -Fq 'moyu-run-v1265.jpg' "$home"
grep -Fq 'site-v1110/style.css' "$home"
grep -Fq 'site-v1110/site.js' "$home"
grep -Fq 'id="navToggle"' "$home"
grep -Fq 'hero-showcase' "$home"
grep -Fq 'quick-pick' "$home"
grep -Fq '浏览器游戏' "$home"
grep -Fq 'dungeon-roster.webp' "$home"
grep -Fq 'game-media-moyu' "$home"
grep -Fq 'quick-result' "$home"
grep -Fq 'data-site-version="1.11.8"' "$de_detail"
grep -Fq "softwareVersion\":\"$game_version\"" "$de_detail"
grep -Fq '单一规则权威' "$de_detail"
grep -Fq 'dungeon-guardians.webp' "$de_detail"
grep -Fq 'property="og:url" content="https://91hwl.cn/toys/dungeon-echo/"' "$de_detail"
grep -Fq 'name="twitter:title" content="Dungeon Echo · 100-Floor Browser Roguelike"' "$de_detail"
grep -Fq 'GitHub / Source' "$de_detail"
grep -Fq 'MIT · OPEN SOURCE' "$de_detail"
grep -Fq 'ca-pub-2648680835467283' "$de_detail"
grep -Fq 'data-site-version="1.11.8"' "$moyu_detail"
grep -Fq "softwareVersion\":\"$moyu_version\"" "$moyu_detail"
grep -Fq '画面与信息都更清楚' "$moyu_detail"
grep -Fq 'Clearer world, readable UI' "$moyu_detail"
grep -Fq 'moyu-scenes.webp' "$moyu_detail"
grep -Fq 'detail-moyu-hero' "$moyu_detail"
grep -Fq 'ca-pub-2648680835467283' "$moyu_detail"
grep -Fq 'data-site-version="1.11.8"' "$board_detail"
grep -Fq "softwareVersion\":\"$board_version\"" "$board_detail"
grep -Fq '三种棋，一张桌' "$board_detail"
grep -Fq 'board-gomoku.webp' "$board_detail"
grep -Fq 'https://play.91hwl.cn/board-games/' "$board_detail"
grep -Fq 'ca-pub-2648680835467283' "$board_detail"
grep -Fq '/toys/board-games/' "$home"
grep -Fq 'board-xiangqi.webp' "$home"
grep -Fq 'board-card-shot' "$home"
grep -Fq '这是一个独立浏览器游戏站。' "$about"
grep -Fq 'record-about' "$about"
grep -Fq '隐私说明' "$privacy"
grep -Fq 'privacy-side' "$privacy"
grep -Fq '重置主站偏好' "$privacy"
grep -Fq '如何提交有效反馈' "$contact"
grep -Fq 'contact-side' "$contact"
! grep -Fq 'data-copy-email' "$contact"
grep -Fq 'https://github.com/diaow2331-ops/dungeon-echo/security/policy' "$contact"
! grep -Fq 'data-copy-email' "$source_root/public/assets/site-v1110/site.js"
for page in "$home" "$de_detail" "$moyu_detail" "$board_detail" "$about" "$privacy" "$contact"; do
  ! grep -Eiq 'mailto:|https://x\.com/' "$page" || { echo "personal contact route remains in built site: $page" >&2; exit 2; }
done
for page in "$about" "$privacy" "$contact"; do
  grep -Fq 'ca-pub-2648680835467283' "$page"
  grep -Fq 'href="/about/"' "$page"
  grep -Fq 'href="/privacy/"' "$page"
  grep -Fq 'href="/contact/"' "$page"
done
grep -Fxq 'google.com, pub-2648680835467283, DIRECT, f08c47fec0942fa0' "$ads_txt"

bash -n "$source_root/deploy.sh"
bash -n "$source_root/healthcheck.sh"
grep -Fq "test \"\$version\" = '1.11.8'" "$source_root/deploy.sh"
grep -Fq 'expected_de=' "$source_root/deploy.sh"
grep -Fq 'expected_moyu=' "$source_root/deploy.sh"
grep -Fq 'site-v1110/style.css' "$source_root/deploy.sh"
grep -Fq 'homepage Board Trio card missing' "$source_root/deploy.sh"
grep -Fq 'https://github.com/diaow2331-ops/dungeon-echo/security/policy' "$source_root/deploy.sh"
grep -Fq 'web-toys-v1118' "$source_root/deploy.sh"
grep -Fq 'web_toys_home_mount=ROLLED_BACK' "$source_root/deploy.sh"
grep -Fq 'previous_home_sha256=' "$source_root/deploy.sh"
! grep -Fq 'EXPECTED_INDEX_SHA256' "$source_root/deploy.sh"
! grep -Fq 'live homepage changed unexpectedly' "$source_root/deploy.sh"
grep -Fq 'public site v$version check failed' "$source_root/healthcheck.sh"
grep -Fq 'site-v1110/style.css' "$source_root/healthcheck.sh"
grep -Fq 'homepage Board Trio card' "$source_root/healthcheck.sh"
grep -Fq '隐私说明' "$source_root/healthcheck.sh"
grep -Fq 'https://github.com/diaow2331-ops/dungeon-echo/security/policy' "$source_root/healthcheck.sh"
grep -Fq 'pub-2648680835467283' "$source_root/healthcheck.sh"
grep -Fq 'HEALTH_CONTRACT_MISS:' "$source_root/healthcheck.sh"

mkdir -p \
  "$bundle/public/toys/dungeon-echo" \
  "$bundle/public/toys/moyu" \
  "$bundle/public/toys/board-games" \
  "$bundle/public/about" \
  "$bundle/public/privacy" \
  "$bundle/public/contact" \
  "$bundle/public/assets/site-v1110" \
  "$bundle/public/assets/site-v1118" \
  "$bundle/ops"
install -m 0644 "$home" "$bundle/public/index.html"
install -m 0644 "$de_detail" "$bundle/public/toys/dungeon-echo/index.html"
install -m 0644 "$moyu_detail" "$bundle/public/toys/moyu/index.html"
install -m 0644 "$board_detail" "$bundle/public/toys/board-games/index.html"
install -m 0644 "$about" "$bundle/public/about/index.html"
install -m 0644 "$privacy" "$bundle/public/privacy/index.html"
install -m 0644 "$contact" "$bundle/public/contact/index.html"
install -m 0644 "$ads_txt" "$bundle/public/ads.txt"
install -m 0644 "$stage_root/site/public/assets/site-v1110/style.css" "$bundle/public/assets/site-v1110/style.css"
install -m 0644 "$stage_root/site/public/assets/site-v1110/site.js" "$bundle/public/assets/site-v1110/site.js"
install -m 0644 "$stage_root/site/public/assets/site-v1110/wang-jian-landscape-1668.jpg" "$bundle/public/assets/site-v1110/wang-jian-landscape-1668.jpg"
install -m 0644 "$stage_root/site/public/assets/site-v1110/moyu-run-v1265.jpg" "$bundle/public/assets/site-v1110/moyu-run-v1265.jpg"
install -m 0644 "$stage_root/site/public/assets/site-v1110/dungeon-roster.webp" "$bundle/public/assets/site-v1110/dungeon-roster.webp"
cp -a "$stage_root/site/public/assets/site-v1118/." "$bundle/public/assets/site-v1118/"
install -m 0755 "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$source_root/README.txt" "$bundle/README.txt"

cmp -s "$source_root/deploy.sh" "$bundle/ops/deploy.sh"
cmp -s "$source_root/healthcheck.sh" "$bundle/ops/healthcheck.sh"

printf '%s\n' "$revision" > "$bundle/REVISION"
printf '%s\n' "$site_version" > "$bundle/VERSION"
printf '%s\n' "$game_version" > "$bundle/DUNGEON_VERSION"
printf '%s\n' "$moyu_version" > "$bundle/MOYU_VERSION"
printf '%s\n' "$board_version" > "$bundle/BOARD_VERSION"
(
  cd "$bundle"
  find README.txt REVISION VERSION DUNGEON_VERSION MOYU_VERSION BOARD_VERSION ops public -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)

mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)

echo "bundle=$output"
echo "site_version=$site_version"
echo "game_version=$game_version"
echo "moyu_version=$moyu_version"
echo "board_games_version=$board_version"
echo "revision=$revision"
echo 'site_bundle_build=PASS'
