#!/usr/bin/env bash
set -euo pipefail
BUNDLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; REV="$(tr -d '\r\n' < "$BUNDLE_ROOT/REVISION")"; work="$(mktemp -d /tmp/site131.XXXXXX)";trap 'rm -rf "$work"' EXIT
fail(){ echo "WEB_TOYS_HOME_HEALTH_ERROR: $*" >&2;exit 1; }
check(){ url="$1"; marker="$2"; out="$3"; curl -fsSL "$url" -o "$out"||return 1;grep -Fq "$marker" "$out"; }
check "https://91hwl.cn/?release=$REV" 'data-site-version="1.3.1"' "$work/home"||fail 'homepage failed';grep -Fq 'Open.' "$work/home"||grep -Fq '打开。' "$work/home"||fail 'new homepage identity missing';grep -Fq 'Clock Out Alive' "$work/home"||fail 'Moyu home card missing';grep -Fq 'Dungeon Echo' "$work/home"||fail 'Dungeon home card missing';! grep -Eq '这次统一治理了什么|公开开发记录' "$work/home"||fail 'developer-governance copy leaked into product homepage'
check "https://91hwl.cn/toys/dungeon-echo/?release=$REV" 'softwareVersion":"1.2.6"' "$work/de"||fail 'Dungeon detail failed';check "https://91hwl.cn/toys/moyu/?release=$REV" 'softwareVersion":"1.11.1"' "$work/moyu"||fail 'Moyu detail failed';curl -fsSL https://play.91hwl.cn/dungeon-echo/ -o /dev/null||fail 'Dungeon play unavailable';curl -fsSL https://play.91hwl.cn/moyu/ -o /dev/null||fail 'Moyu play unavailable';echo 'web_toys_home_health=PASS'
