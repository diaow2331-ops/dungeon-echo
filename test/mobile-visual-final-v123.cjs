'use strict';
const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const version = read('VERSION').trim();
const runtime = read('runtime-bootstrap.js');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const finalizer = read('mobile-visual-final-v123.js');
const notes = read('RELEASE_NOTES_v1.2.3.md');

assert.strictEqual(version, '1.2.3', 'final mobile/visual hotfix must publish as v1.2.3');
assert(runtime.includes('release-stamp-v123.js'), 'runtime must load the v1.2.3 release stamp');
assert(runtime.includes('mobile-visual-final-v123.js'), 'runtime must load the v1.2.3 finalizer after mobile UX');
assert(manifest.includes('release-stamp-v123.js'), 'release manifest must ship the v1.2.3 release stamp');
assert(manifest.includes('mobile-visual-final-v123.js'), 'release manifest must ship the mobile/visual finalizer');
assert(!manifest.includes('release-stamp-v122.js'), 'production package must not ship the retired v1.2.2 visible stamp');

assert(finalizer.includes("oldRoot.replaceWith(fresh)"), 'mobile finalizer must detach the old observed action root');
assert(finalizer.includes("btn.addEventListener('pointerdown'"), 'touch gameplay must react on pointer-down');
assert(finalizer.includes("de-browser-chrome"), 'non-fullscreen mobile browser mode must have an explicit stable-layout class');
assert(finalizer.includes("position:relative!important"), 'browser-chrome mode must avoid sticky HUD/control composition');
assert(finalizer.includes("backdrop-filter:none!important"), 'browser-chrome mode must remove costly backdrop filtering');
assert(finalizer.includes('playerAura'), 'desktop/mobile player aura suppression must remain explicit');
assert(finalizer.includes('skillReadyRing'), 'desktop/mobile skill-ready ring suppression must remain explicit');
assert(finalizer.includes('mobileEntityRadial'), 'mobile camera-misaligned decorative entity radials must be suppressed');
assert(notes.includes('Combat numbers') && notes.includes('save schema'), 'release notes must preserve gameplay/save non-goals');

console.log('mobile_visual_final_v123=PASS');
