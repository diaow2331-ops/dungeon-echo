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
assembled_index="$stage_root/index.html"
cleanup(){ rm -rf -- "$stage_root"; }
trap cleanup EXIT
command -v zip >/dev/null
command -v sha256sum >/dev/null
command -v patch >/dev/null
command -v node >/dev/null
test "$version" = '1.11.5'
for f in index.html style.css visual-v1113.css responsive-v1115.css build-v1113.cjs build-v1114.cjs build-v1115.cjs SOURCE_SHA256 patches/runtime-v1111.patch patches/runtime-v1112.patch patches/runtime-v1114.patch patches/runtime-v1115.patch; do test -r "$source_root/$f"; done
parts=("$source_root"/src/game.part*.js)
test "${#parts[@]}" -eq 15 || { echo "expected 15 game source parts, found ${#parts[@]}" >&2; exit 2; }
for file in "$source_root/index.html" "$source_root/style.css" "$source_root/visual-v1113.css" "$source_root/responsive-v1115.css" "$source_root/build-v1113.cjs" "$source_root/build-v1114.cjs" "$source_root/build-v1115.cjs" "$source_root/VERSION" "$source_root/SOURCE_SHA256" "$source_root/patches/runtime-v1111.patch" "$source_root/patches/runtime-v1112.patch" "$source_root/patches/runtime-v1114.patch" "$source_root/patches/runtime-v1115.patch" "${parts[@]}"; do
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
cp "$source_root/index.html" "$assembled_index"
node "$source_root/build-v1113.cjs" "$assembled_index" "$assembled"
patch --silent "$assembled" < "$source_root/patches/runtime-v1114.patch"
node "$source_root/build-v1114.cjs" "$assembled_index" "$assembled"
patch --silent "$assembled" < "$source_root/patches/runtime-v1115.patch"
node "$source_root/build-v1115.cjs" "$assembled_index" "$assembled"
node --check "$assembled" >/dev/null
final_game_sha="$(sha256sum "$assembled" | awk '{print $1}')"
grep -Fq '<meta name="version" content="1.11.5"' "$assembled_index"
grep -Fq 'style.css?v=1115' "$assembled_index"; grep -Fq 'visual-v1113.css?v=1115' "$assembled_index"; grep -Fq 'responsive-v1115.css?v=1115' "$assembled_index"; grep -Fq 'game.js?v=1115' "$assembled_index"
grep -Fq 'translate="no"' "$assembled_index"; grep -Fq 'name="google" content="notranslate"' "$assembled_index"
grep -Fq "(cl==='zh'||cl==='en')?cl:((sl==='zh'||sl==='en')?sl:bl)" "$assembled_index" || { echo 'Moyu validated prepaint precedence missing' >&2; exit 2; }
! grep -Fq "c('91hwl_lang')||localStorage.getItem('91hwl_lang')||" "$assembled_index" || { echo 'Moyu legacy prepaint precedence remains' >&2; exit 2; }
grep -Fq "dataset.gameVersion='1.11.5'" "$assembled"; grep -Fq 'DAY_END_DISTANCE=2200' "$assembled"; grep -Fq 'const groundTakeoff=before===0' "$assembled"
grep -Fq 'writeSharedLangCookie(currentLang)' "$assembled"; grep -Fq "home.searchParams.set('lang',currentLang)" "$assembled"
grep -Fq 'const storedLang=storageGet(LANG_KEY)' "$assembled" || { echo 'Moyu stored-language validation missing' >&2; exit 2; }
grep -Fq "(storedLang==='en'||storedLang==='zh')?storedLang:browserLang" "$assembled" || { echo 'Moyu stored-language fallback missing' >&2; exit 2; }
! grep -Fq "storageGet(LANG_KEY)||(navigator.language||'zh').toLowerCase().startsWith('zh')?'zh':'en'" "$assembled" || { echo 'Moyu ambiguous language precedence remains' >&2; exit 2; }
grep -Fq "repeatSensitiveKeys=new Set(['Space','ArrowUp','KeyP','Escape','KeyR','KeyF','KeyM','KeyS'])" "$assembled" || { echo 'Moyu repeat-input guard missing' >&2; exit 2; }
grep -Fq 'if(!force&&!canvasLayoutDirty)return false' "$assembled" || { echo 'Moyu canvas layout invalidation guard missing' >&2; exit 2; }
grep -Fq 'syncPresentationState.signature===signature' "$assembled" || { echo 'Moyu presentation memoization missing' >&2; exit 2; }
grep -Fq "spawned.label==='BUG'&&spawned.mutation==='long'" "$assembled" || { echo 'Moyu long BUG spacing reserve missing' >&2; exit 2; }
! grep -Fq 'drawPlayerFocus(drawX,footY,altitude);' "$assembled"; ! grep -Fq 'drawBackground();drawAmbientOfficeLife();drawRunAtmosphere();' "$assembled"
grep -Fq 'font-size:17px' "$source_root/visual-v1113.css"; grep -Fq 'font-size:14.5px' "$source_root/visual-v1113.css"; grep -Fq 'height:44px' "$source_root/visual-v1113.css"
grep -Fq 'env(safe-area-inset-bottom)' "$source_root/responsive-v1115.css"; grep -Fq '@media(max-width:560px)' "$source_root/responsive-v1115.css"; grep -Fq '.home-link::before' "$source_root/responsive-v1115.css"
mkdir -p "$bundle/public/moyu" "$bundle/ops"
install -m 0644 "$assembled_index" "$bundle/public/moyu/index.html"
install -m 0644 "$source_root/style.css" "$bundle/public/moyu/style.css"
install -m 0644 "$source_root/visual-v1113.css" "$bundle/public/moyu/visual-v1113.css"
install -m 0644 "$source_root/responsive-v1115.css" "$bundle/public/moyu/responsive-v1115.css"
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
