/* Historical filename; retirement guard for the former transitional locale event owner. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'ops','release','static-files.txt'),'utf8').split(/\r?\n/).filter(Boolean);
const screen=fs.readFileSync(path.join(root,'core-screen-owner-v153.js'),'utf8');
const canvas=fs.readFileSync(path.join(root,'town-canvas-locale-v153.js'),'utf8');
const archived=fs.readFileSync(path.join(root,'locale-event-owner-v130.js'),'utf8');

for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  assert(!runtime.includes(retired),`${retired} must remain absent from production bootstrap`);
  assert(!manifest.includes(retired),`${retired} must remain absent from release allowlist`);
}
assert(/owner:'core-screen-owner-v153'/.test(screen),'fixed core screen owner replaces the old six-root translation bridge');
assert(/renderTitle/.test(screen)&&/renderClassSelect/.test(screen)&&/renderPause/.test(screen)&&/renderOverlay/.test(screen)&&/renderDungeonShop/.test(screen)&&/renderTown/.test(screen),'all former residual DOM roots have exact sink renderers');
assert(!/translateTree|MutationObserver|setInterval|requestAnimationFrame/.test(screen),'replacement screen owner cannot regress to generic translation or continuous followers');
assert(/owner:'town-canvas-locale-v153'/.test(canvas)&&/id==='town-scene'/.test(canvas)&&/id==='wheel-canvas'/.test(canvas),'town Canvas copy has an exact fixed-route sink');
assert(!/MutationObserver|setInterval|requestAnimationFrame/.test(canvas),'canvas sink owns no observer/polling/animation follower');
assert(/version:'v145'/.test(archived),'historical bridge source stays identifiable for archaeology only');
assert(/assetVersion = '153'/.test(runtime)&&/version:'v13'/.test(runtime),'retirement ships on generation 153/v13');
new Function(screen);new Function(canvas);
console.log('locale_event_owner_retired_v153=PASS');
