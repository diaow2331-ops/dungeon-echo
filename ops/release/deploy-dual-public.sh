#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

fail(){ echo "DUAL_PUBLIC_RELEASE_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'run with sudo/root so all three deployers can switch production files'
test "$#" -eq 0 || fail 'this release orchestrator accepts no arguments'
for cmd in git node patch zip unzip sha256sum curl nginx; do command -v "$cmd" >/dev/null || fail "missing command: $cmd"; done

dungeon_version="$(tr -d '\r\n' < VERSION)"
moyu_version="$(tr -d '\r\n' < moyu/VERSION)"
site_version="$(tr -d '\r\n' < ops/home-mount/SITE_VERSION)"
revision="$(git rev-parse HEAD)"
test "$dungeon_version" = '1.2.10' || fail "unexpected Dungeon Echo version: $dungeon_version"
test "$moyu_version" = '1.11.5' || fail "unexpected Moyu version: $moyu_version"
test "$site_version" = '1.3.4' || fail "unexpected site version: $site_version"
test -z "$(git status --porcelain --untracked-files=no)" || fail 'tracked worktree is not clean'

work="$(mktemp -d /tmp/91hwl-dual-public.XXXXXX)"
cleanup(){ rm -rf -- "$work"; }
trap cleanup EXIT

dungeon_zip="$work/dungeon.zip"
moyu_zip="$work/moyu.zip"
home_zip="$work/home.zip"

bash ops/release/build-site-bundle.sh "$dungeon_zip"
bash ops/release/build-moyu-bundle.sh "$moyu_zip"
bash ops/release/build-home-mount-bundle.sh "$home_zip"

mkdir -p "$work/dungeon" "$work/moyu" "$work/home"
unzip -q "$dungeon_zip" -d "$work/dungeon"
unzip -q "$moyu_zip" -d "$work/moyu"
unzip -q "$home_zip" -d "$work/home"

# Order matters: the homepage health contract expects both play.91hwl.cn games to
# already expose their new VERSION endpoints.
bash "$work/dungeon/ops/deploy.sh"
bash "$work/moyu/ops/deploy.sh"
bash "$work/home/ops/deploy.sh"

actual_de="$(curl -fsSL https://play.91hwl.cn/dungeon-echo/VERSION | tr -d '\r\n[:space:]')"
actual_moyu="$(curl -fsSL https://play.91hwl.cn/moyu/VERSION | tr -d '\r\n[:space:]')"
home_body="$work/home-public.html"
curl -fsSL "https://91hwl.cn/?release=$revision" -o "$home_body"
test "$actual_de" = "$dungeon_version" || fail "public Dungeon VERSION mismatch after deployment: $actual_de"
test "$actual_moyu" = "$moyu_version" || fail "public Moyu VERSION mismatch after deployment: $actual_moyu"
grep -Fq 'data-site-version="1.3.4"' "$home_body" || fail 'public homepage v1.3.4 marker missing after deployment'
grep -Fq 'GitHub / Source' "$home_body" || fail 'public homepage source CTA missing after deployment'

echo "revision=$revision"
echo "dungeon_echo_version=$dungeon_version"
echo "moyu_version=$moyu_version"
echo "site_version=$site_version"
echo 'dual_public_release=PASS'
