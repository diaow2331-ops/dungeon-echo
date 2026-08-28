'use strict';
const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const version = read('VERSION').trim();
const runtime = read('runtime-bootstrap.js');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const mobile = read('mobile-ux.js');
const visual = read('visual-polish.js');
const notes = read('docs/releases/RELEASE_NOTES_v1.2.3.md');

assert.strictEqual(version, '1.2.3', 'final mobile/visual hotfix must publish as v1.2.3');
assert(runtime.includes('release-stamp-v123.js'), 'runtime must load the v1.2.3 release stamp');
assert(runtime.includes("['mobile-ux.js'"), 'runtime must keep mobile UX as the mobile source owner');
assert(!runtime.includes('mobile-visual-final-v123.js'), 'runtime must not accumulate a redundant finalizer layer');
assert(manifest.includes('release-stamp-v123.js'), 'release manifest must ship the v1.2.3 release stamp');
assert(manifest.includes('mobile-ux.js') && manifest.includes('visual-polish.js'), 'release manifest must ship the direct source owners');
assert(!manifest.includes('mobile-visual-final-v123.js'), 'release manifest must not ship the discarded finalizer layer');
assert(!manifest.includes('release-stamp-v122.js'), 'production package must not ship the retired v1.2.2 visible stamp');

assert(mobile.includes("window.__DE_MOBILE_UX={version:'v2'"), 'mobile UX must identify the v2 source fix');
assert(!mobile.includes('MutationObserver'), 'mobile action layout must not retain the self-triggering MutationObserver loop');
assert(mobile.includes("btn.addEventListener('pointerdown'"), 'high-frequency touch input must react on pointer-down');
assert(mobile.includes('de-browser-chrome'), 'non-fullscreen mobile browser mode must have an explicit stable-layout class');
assert(mobile.includes('backdrop-filter:none!important'), 'browser-chrome mode must remove costly backdrop filtering');
assert(mobile.includes('#dpad [data-act="wait"]{visibility:hidden!important;pointer-events:none!important}'), 'mobile center wait must not remain a touch target');
assert(mobile.includes('syncMobileWait'), 'mobile wait target must have an explicit accessibility/disabled state');
assert(mobile.includes('#dpad button:not([data-act="wait"])'), 'directional fast-press ownership must exclude the center wait control');
assert(mobile.includes('Math.abs(width-lastWidth)<2'), 'height-only browser-chrome resize churn must not re-run the whole mobile layout');

assert(visual.includes("window.__DE_VISUAL_POLISH = { version:'v6'"), 'visual polish must identify the v6 camera-aware source fix');
assert(visual.includes('const mapCols') && visual.includes('const vx = clamp'), 'visual overlay must derive the active camera viewport');
assert(visual.includes('(x-d.vx+.5)*d.tw') && visual.includes('(y-d.vy+.52)*d.th'), 'entity overlays must subtract camera origin');
assert(!visual.includes('function drawPlayerPresence'), 'obsolete player aura/skill-ready halo renderer must be removed');
assert(!visual.includes('drawPlayerPresence(now,d)'), 'player halo must not remain in the draw loop');
assert(visual.includes('isMobileUi()?50:33'), 'mobile presentation overlay should paint at a lower optional cadence');
assert(visual.includes('if(isMobileUi()) return;'), 'mobile optional dust layer should be skipped');

assert(notes.includes('center mobile D-pad Wait target'), 'release notes must record the mobile wait mis-tap fix');
assert(notes.includes('both desktop and mobile'), 'release notes must state the halo fix covers PC and mobile');
assert(notes.includes('Combat numbers') && notes.includes('save schema'), 'release notes must preserve gameplay/save non-goals');

console.log('mobile_visual_final_v123=PASS');
