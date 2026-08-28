'use strict';
const fs = require('fs');
const assert = require('assert');

const fixed = fs.readFileSync('game/locale/fixed-locale-entry-v130.js','utf8');
const screen = fs.readFileSync('game/locale/core-screen-owner-v153.js','utf8');
const runtime = fs.readFileSync('runtime-bootstrap.js','utf8');
const manifest = fs.readFileSync('ops/release/static-files.txt','utf8').split(/\r?\n/).filter(Boolean);

// Historical hotfix/translator layers are quarantined under archive/ for archaeology,
// but none may return to the production runtime or release package.
for (const retired of [
  'ux-hotfix-v121.js','i18n-runtime.js','i18n-content.js',
  'locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js'
]) {
  assert(!runtime.includes(`'${retired}'`), `retired locale layer must not load: ${retired}`);
  assert(!manifest.some(file=>file===retired||file.endsWith('/'+retired)), `retired locale layer must not ship: ${retired}`);
  assert(fs.existsSync(`archive/runtime/${retired}`), `retired locale layer must remain available in archive: ${retired}`);
}

assert(/box\.id\s*=\s*'de-title-language'/.test(fixed), 'fixed-route title language picker missing');
assert(fixed.includes('location.replace(target.href)'), 'language choice must route to the fixed counterpart');
assert(fixed.includes("searchParams.delete('lang')"), 'legacy query locale must converge to fixed routes');
assert(screen.includes("owner:'core-screen-owner-v153'"), 'exact core screen locale owner missing');
assert(!/MutationObserver|translateTree|setInterval|requestAnimationFrame/.test(screen), 'fixed core screen owner must not regain runtime translation scanning');
assert(runtime.includes("assetVersion = '153'") && runtime.includes("version:'v13'"), 'final fixed-route runtime generation mismatch');

console.log('ux_hotfix_and_runtime_locale_stack_retired_v153=PASS');
