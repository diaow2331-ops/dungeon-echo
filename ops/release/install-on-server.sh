#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=/opt/dungeon-echo
RELEASE_ROOT=/srv/dungeon-echo
SNIPPET=/etc/nginx/snippets/dungeon-echo-static.conf
TEMPLATE=$REPO_ROOT/ops/nginx/dungeon-echo.locations.conf
PATCHER=$REPO_ROOT/ops/nginx/patch-play-site.py
PUBLIC_URL=https://play.91hwl.cn/dungeon-echo/

fail(){ echo "DUNGEON_ECHO_INSTALL_ERROR: $*" >&2; exit 1; }
test "${EUID:-$(id -u)}" -eq 0 || fail 'root required'
test "$#" -eq 0 || fail 'this installer accepts no arguments'
test -d "$REPO_ROOT/.git" || fail "repository missing: $REPO_ROOT"
test -r "$TEMPLATE" || fail 'Nginx template missing'
test -r "$PATCHER" || fail 'Nginx patcher missing'
command -v nginx >/dev/null || fail 'nginx missing'
command -v curl >/dev/null || fail 'curl missing'

GIT=(sudo -u ubuntu -H env GIT_OPTIONAL_LOCKS=0 git -C "$REPO_ROOT")
test "$("${GIT[@]}" branch --show-current)" = main || fail 'main branch required'
test -z "$("${GIT[@]}" status --porcelain)" || fail 'worktree must be clean'
"${GIT[@]}" fetch origin main
"${GIT[@]}" merge --ff-only origin/main
test "$("${GIT[@]}" rev-parse HEAD)" = "$("${GIT[@]}" rev-parse origin/main)" || fail 'main is not aligned to origin/main'

site_json="$(python3 "$PATCHER")" || fail 'play.91hwl.cn HTTPS block is not unique'
site_path="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["file"])' <<<"$site_json")"
test -r "$site_path" || fail "Nginx site unreadable: $site_path"

backup_dir="$(mktemp -d /tmp/dungeon-echo-install.XXXXXX)"
site_backup="$backup_dir/site.conf"
snippet_backup="$backup_dir/snippet.conf"
cp -a "$site_path" "$site_backup"
snippet_existed=false
if test -e "$SNIPPET"; then cp -a "$SNIPPET" "$snippet_backup"; snippet_existed=true; fi

rollback(){
  rc=$?
  if test "$rc" -ne 0; then
    cp -a "$site_backup" "$site_path"
    if test "$snippet_existed" = true; then cp -a "$snippet_backup" "$SNIPPET"; else rm -f "$SNIPPET"; fi
    nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1 || true
    echo 'dungeon_echo_install=ROLLED_BACK' >&2
  fi
  exit "$rc"
}
trap rollback EXIT

cd "$REPO_ROOT"
DUNGEON_ECHO_RELEASE_ROOT="$RELEASE_ROOT" bash ops/release/stage-static-release.sh
release_dir="$(readlink -f "$RELEASE_ROOT/current")"
[[ "$release_dir" == "$RELEASE_ROOT"/releases/* ]] || fail 'unexpected immutable release path'

snippet_tmp="$backup_dir/snippet.next"
sed "s#__DUNGEON_ECHO_RELEASE_DIR__#$release_dir#g" "$TEMPLATE" > "$snippet_tmp"
grep -Fq "alias $release_dir/;" "$snippet_tmp" || fail 'rendered Nginx alias mismatch'
install -m 0644 "$snippet_tmp" "$SNIPPET"
python3 "$PATCHER" --site "$site_path" --write >/dev/null
nginx -t
systemctl reload nginx

body="$(curl --fail --silent --show-error --location "$PUBLIC_URL")"
grep -Fq '地牢回响' <<<"$body" || fail 'public page title missing'
grep -Fq 'v1.0.0' <<<"$body" || fail 'public version missing'
headers="$(curl --fail --silent --show-error --head "$PUBLIC_URL")"
grep -Eiq '^cache-control:.*no-store' <<<"$headers" || fail 'public no-store header missing'
grep -Eiq '^content-security-policy:' <<<"$headers" || fail 'public CSP header missing'

trap - EXIT
find "$backup_dir" -depth -delete
echo "release_revision=$("${GIT[@]}" rev-parse HEAD)"
echo "release_dir=$release_dir"
echo "public_url=$PUBLIC_URL"
echo 'dungeon_echo_install=PASS'
