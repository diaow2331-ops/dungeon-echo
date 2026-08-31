#!/usr/bin/env bash
# Canonical 91hwl play-root composition policy.
# Component deployments preserve only approved public root entries from the
# previous immutable release. Unrelated tools, archives and rollback folders
# must never hitchhike into the next production release.

play_release_root_allowed() {
  local name="$1"
  case "$name" in
    dungeon-echo|moyu|board-games|favicon.svg|robots.txt|sitemap.xml) return 0 ;;
  esac
  [[ "$name" =~ ^[0-9a-fA-F]{32}\.txt$ ]]
}

play_copy_release_root() {
  local source="$1" target="$2"
  test -d "$source" && test -d "$target" || return 2
  local path name
  shopt -s dotglob nullglob
  for path in "$source"/*; do
    name="$(basename "$path")"
    play_release_root_allowed "$name" || continue
    cp -aL -- "$path" "$target/$name"
  done
  shopt -u dotglob nullglob
}

play_assert_release_root() {
  local root="$1"
  test -d "$root" || return 2
  local path name bad=0
  shopt -s dotglob nullglob
  for path in "$root"/*; do
    name="$(basename "$path")"
    if ! play_release_root_allowed "$name"; then
      printf 'PLAY_RELEASE_ROOT_VIOLATION: %s\n' "$name" >&2
      bad=1
    fi
  done
  shopt -u dotglob nullglob
  test "$bad" -eq 0
}
