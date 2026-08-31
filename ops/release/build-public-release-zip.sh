#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

fail(){ echo "PUBLIC_RELEASE_ZIP_ERROR: $*" >&2; exit 1; }
for cmd in git bash zip unzip sha256sum curl; do command -v "$cmd" >/dev/null || fail "missing command: $cmd"; done

dungeon_version="$(tr -d '\r\n' < VERSION)"
moyu_version="$(tr -d '\r\n' < moyu/VERSION)"
board_version="$(tr -d '\r\n' < board-games/VERSION)"
site_version="$(tr -d '\r\n' < ops/home-mount/SITE_VERSION)"
revision="$(git rev-parse HEAD)"
semver(){ [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; }
semver "$dungeon_version" || fail "invalid Dungeon Echo version: $dungeon_version"
semver "$moyu_version" || fail "invalid Moyu version: $moyu_version"
semver "$board_version" || fail "invalid Board Trio version: $board_version"
semver "$site_version" || fail "invalid site version: $site_version"
test -z "$(git status --porcelain --untracked-files=no)" || fail 'tracked worktree is not clean'

output="${1:-$repo_root/91hwl-public-dungeon-${dungeon_version}-moyu-${moyu_version}-board-${board_version}-site-${site_version}.zip}"
work="$(mktemp -d /tmp/91hwl-public-zip.XXXXXX)"
cleanup(){ rm -rf -- "$work"; }
trap cleanup EXIT

bash ops/release/build-site-bundle.sh "$work/dungeon.zip"
bash ops/release/build-moyu-bundle.sh "$work/moyu.zip"
bash ops/release/build-board-games-bundle.sh "$work/board.zip"
bash ops/release/build-home-mount-bundle.sh "$work/home.zip"

bundle="$work/bundle"
mkdir -p "$bundle/components"
install -m 0644 "$work/dungeon.zip" "$bundle/components/dungeon.zip"
install -m 0644 "$work/moyu.zip" "$bundle/components/moyu.zip"
install -m 0644 "$work/board.zip" "$bundle/components/board.zip"
install -m 0644 "$work/home.zip" "$bundle/components/home.zip"

cat > "$bundle/deploy.sh" <<'DEPLOY'
#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fail(){ echo "PUBLIC_RELEASE_DEPLOY_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'run with sudo/root'
for cmd in unzip curl; do command -v "$cmd" >/dev/null || fail "missing command: $cmd"; done
work="$(mktemp -d /tmp/91hwl-public-deploy.XXXXXX)"
cleanup(){ rm -rf -- "$work"; }
trap cleanup EXIT
for name in dungeon moyu board home; do
  test -r "$root/components/$name.zip" || fail "missing component: $name.zip"
  mkdir -p "$work/$name"
  unzip -q "$root/components/$name.zip" -d "$work/$name"
done
bash "$work/dungeon/ops/deploy.sh"
bash "$work/moyu/ops/deploy.sh"
bash "$work/board/ops/deploy.sh"
bash "$work/home/ops/deploy.sh"
expected_de="$(tr -d '\r\n[:space:]' < "$root/DUNGEON_VERSION")"
expected_moyu="$(tr -d '\r\n[:space:]' < "$root/MOYU_VERSION")"
expected_board="$(tr -d '\r\n[:space:]' < "$root/BOARD_VERSION")"
expected_site="$(tr -d '\r\n[:space:]' < "$root/SITE_VERSION")"
revision="$(tr -d '\r\n[:space:]' < "$root/REVISION")"
actual_de="$(curl -fsSL https://play.91hwl.cn/dungeon-echo/VERSION | tr -d '\r\n[:space:]')"
actual_moyu="$(curl -fsSL https://play.91hwl.cn/moyu/VERSION | tr -d '\r\n[:space:]')"
actual_board="$(curl -fsSL https://play.91hwl.cn/board-games/VERSION | tr -d '\r\n[:space:]')"
home_body="$work/home-public.html"
curl -fsSL "https://91hwl.cn/?release=$revision" -o "$home_body"
test "$actual_de" = "$expected_de" || fail "Dungeon version mismatch: $actual_de"
test "$actual_moyu" = "$expected_moyu" || fail "Moyu version mismatch: $actual_moyu"
test "$actual_board" = "$expected_board" || fail "Board Trio version mismatch: $actual_board"
grep -Fq "data-site-version=\"$expected_site\"" "$home_body" || fail "site version marker missing: $expected_site"
grep -Fq 'GitHub / Source' "$home_body" || fail 'homepage GitHub CTA missing'
grep -Fq '方寸棋局 · Board Trio' "$home_body" || fail 'homepage Board Trio card missing'
grep -Fq 'https://github.com/diaow2331-ops/dungeon-echo/security/policy' "$home_body" || fail 'homepage security-policy route missing'
echo "revision=$revision"
echo "dungeon_echo_version=$actual_de"
echo "moyu_version=$actual_moyu"
echo "board_games_version=$actual_board"
echo "site_version=$expected_site"
echo 'public_release_zip_deploy=PASS'
DEPLOY
chmod 0755 "$bundle/deploy.sh"
printf '%s\n' "$revision" > "$bundle/REVISION"
printf '%s\n' "$dungeon_version" > "$bundle/DUNGEON_VERSION"
printf '%s\n' "$moyu_version" > "$bundle/MOYU_VERSION"
printf '%s\n' "$board_version" > "$bundle/BOARD_VERSION"
printf '%s\n' "$site_version" > "$bundle/SITE_VERSION"
(
  cd "$bundle"
  find REVISION DUNGEON_VERSION MOYU_VERSION BOARD_VERSION SITE_VERSION deploy.sh components -type f -print0 | sort -z |
    while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS
)
mkdir -p "$(dirname "$output")"
rm -f -- "$output"
(cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"
echo "revision=$revision"
echo "dungeon_echo_version=$dungeon_version"
echo "moyu_version=$moyu_version"
echo "board_games_version=$board_version"
echo "site_version=$site_version"
echo 'public_release_zip_build=PASS'
