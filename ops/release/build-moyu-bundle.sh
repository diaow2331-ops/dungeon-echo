#!/usr/bin/env bash
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
source_root="$repo_root/moyu"
version="$(tr -d '\r\n' < "$source_root/VERSION")"
revision="$(git -C "$repo_root" rev-parse HEAD)"
output="${1:-$repo_root/91hwl-play-moyu-v$version.zip}"
stage_root="$(mktemp -d)"
bundle="$stage_root/91hwl-play-moyu-v$version"
base_game="$stage_root/base-game.js"
assembled="$stage_root/game.js"
cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT
command -v zip >/dev/null
command -v sha256sum >/dev/null
command -v patch >/dev/null
command -v node >/dev/null
test "$version" = '1.11.2'
for f in index.html style.css visual-v1112.css SOURCE_SHA256 patches/runtime-v1111.patch patches/runtime-v1112.patch; do test -r "$source_root/$f"; done
parts=("$source_root"/src/game.part*.js)
test "${#parts[@]}" -eq 15 || { echo "expected 15 game source parts, found ${#parts[@]}" >&2; exit 2; }
for file in "$source_root/index.html" "$source_root/style.css" "$source_root/visual-v1112.css" "$source_root/VERSION" "$source_root/SOURCE_SHA256" "$source_root/patches/runtime-v1111.patch" "$source_root/patches/runtime-v1112.patch" "${parts[@]}"; do
  rel="${file#$repo_root/}"; git -C "$repo_root" cat-file -e "HEAD:$rel" 2>/dev/null || { echo "untracked release source: $rel" >&2; exit 2; }
done
cat "${parts[@]}" > "$base_game"
expected_base="$(awk '$2=="base-game.js"{print $1}' "$source_root/SOURCE_SHA256")"
expected_v1111="$(awk '$2=="game-v1111.js"{print $1}' "$source_root/SOURCE_SHA256")"
test -n "$expected_base" -a -n "$expected_v1111"
test "$(sha256sum "$base_game" | awk '{print $1}')" = "$expected_base" || { echo 'Moyu base runtime checksum mismatch' >&2; exit 2; }
cp "$base_game" "$assembled"
patch --silent "$assembled" < "$source_root/patches/runtime-v1111.patch"
test "$(sha256sum "$assembled" | awk '{print $1}')" = "$expected_v1111" || { echo 'Moyu v1.11.1 intermediate runtime checksum mismatch' >&2; exit 2; }
patch --silent "$assembled" < "$source_root/patches/runtime-v1112.patch"
node --check "$assembled" >/dev/null
final_game_sha="$(sha256sum "$assembled" | awk '{print $1}')"
grep -Fq 'style.css?v=1112' "$source_root/index.html"; grep -Fq 'visual-v1112.css?v=1112' "$source_root/index.html"; grep -Fq 'game.js?v=1112' "$source_root/index.html"
grep -Fq "dataset.gameVersion='1.11.2'" "$assembled"; grep -Fq 'DAY_END_DISTANCE=2200' "$assembled"; grep -Fq 'const groundTakeoff=before===0' "$assembled"
grep -Fq 'writeSharedLangCookie(currentLang)' "$assembled"; grep -Fq "home.searchParams.set('lang',currentLang)" "$assembled"
! grep -Fq 'drawPlayerFocus(drawX,footY,altitude);' "$assembled"; ! grep -Fq 'drawBackground();drawAmbientOfficeLife();drawRunAtmosphere();' "$assembled"
grep -Fq 'font-size:15px' "$source_root/visual-v1112.css"; grep -Fq 'min-width:60px' "$source_root/visual-v1112.css"
mkdir -p "$bundle/public/moyu" "$bundle/ops"
install -m 0644 "$source_root/index.html" "$bundle/public/moyu/index.html"
install -m 0644 "$source_root/style.css" "$bundle/public/moyu/style.css"
install -m 0644 "$source_root/visual-v1112.css" "$bundle/public/moyu/visual-v1112.css"
install -m 0644 "$assembled" "$bundle/public/moyu/game.js"
printf '%s\n' "$version" > "$bundle/public/moyu/VERSION"
install -m 0755 "$repo_root/ops/moyu-bundle/deploy.sh" "$bundle/ops/deploy.sh"
install -m 0755 "$repo_root/ops/moyu-bundle/healthcheck.sh" "$bundle/ops/healthcheck.sh"
install -m 0644 "$repo_root/ops/moyu-bundle/README.txt" "$bundle/README.txt"
printf '%s\n' "$version" > "$bundle/VERSION"
printf '%s\n' "$revision" > "$bundle/REVISION"
(cd "$bundle" && find README.txt REVISION VERSION ops public -type f -print0 | sort -z | while IFS= read -r -d '' file; do sha256sum "$file"; done > SHA256SUMS)
mkdir -p "$(dirname "$output")"; rm -f -- "$output"; (cd "$bundle" && zip -q -r "$output" .)
echo "bundle=$output"; echo "version=$version"; echo "revision=$revision"; echo "game_sha256=$final_game_sha"; echo 'moyu_bundle_build=PASS'
