'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const zh=read('index.html'),en=read('en/index.html'),runtime=read('runtime-bootstrap.js');
const manifest=read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const screens=read('game/locale/core-screen-owner-v153.js');
const canvas=read('game/locale/town-canvas-locale-v153.js');
const migration=read('game/locale/stable-item-id-migration-v150.js');
const scripts=html=>[...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);

assert(/data-de-locale="zh-CN"/.test(zh),'root route must be fixed Chinese');
assert(/data-de-locale="en"/.test(en)&&/<base href="\.\.\/">/.test(en),'English route must be fixed and share the root asset graph');
assert.deepStrictEqual(scripts(zh),scripts(en),'fixed routes must boot the exact same synchronous graph');
assert(scripts(zh).every(src=>/\?v=153$/.test(src)),'all synchronous JS must use cache generation 153');
assert(/style\.css\?v=153/.test(zh)&&/style\.css\?v=153/.test(en),'both routes must use style generation 153');
assert(/assetVersion = '153'/.test(runtime)&&/version:'v13'/.test(runtime),'late runtime must be fixed-route v13 generation 153');

for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']){
  assert(!runtime.includes(retired),`${retired} must not load in production`);
  assert(!manifest.some(file=>file===retired||file.endsWith('/'+retired)),`${retired} must not ship in the release bundle`);
}
for(const owner of ['game/locale/fixed-locale-entry-v130.js','game/locale/stable-item-id-migration-v150.js','game/locale/core-screen-owner-v153.js','game/locale/town-canvas-locale-v153.js']){
  assert(runtime.includes(owner),`${owner} must boot from the production runtime`);
  assert(manifest.includes(owner),`${owner} must ship in the release bundle`);
}

for(const src of [screens,canvas]){
  assert(!/MutationObserver|setInterval\s*\(|requestAnimationFrame\s*\(/.test(src),'final locale owners must not poll, observe, or own an animation follower');
  assert(!/translateTree|characterData\s*:|querySelectorAll\s*\(/.test(src),'final locale owners must not perform generic DOM translation/tree scans');
  new Function(src);
}
assert(!/CanvasRenderingContext2D[^\n]*prototype|\.prototype\.fillText|proto\.fillText/.test(canvas),'town canvas owner must not patch the global Canvas 2D prototype');
assert(/ownCanvas\('town-scene'\)/.test(canvas)&&/ownCanvas\('wheel-canvas'\)/.test(canvas),'town canvas owner must bind only the two exact legacy canvas sinks');
for(const fn of ['renderTitle','renderClassSelect','renderPause','renderOverlay','renderDungeonShop','renderTown'])
  assert(new RegExp(`function\\s+${fn}\\s*\\(`).test(screens),`missing exact core screen renderer ${fn}`);
assert(!/de-run-v6|de-greedy-meta-v1|de-town-wheel-state-v1/.test(screens),'screen owner must not write or fork gameplay saves');
assert(/baseId|rarityId|slotId/.test(migration)&&!/de-language-v1/.test(migration),'stable item migration owns language-neutral ids without language save coupling');

console.log('final_fixed_locale_v153=PASS');
