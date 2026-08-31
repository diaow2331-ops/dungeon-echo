/* Focused release contract for the v1.6.0 production asset generation. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en/index.html'),'utf8');
const runtime=fs.readFileSync(path.join(root,'game/core/runtime-bootstrap.js'),'utf8');
const deployReadme=fs.readFileSync(path.join(root,'ops/site-bundle/README.txt'),'utf8');
const authority=JSON.parse(fs.readFileSync(path.join(root,'docs/authority-map-v130.json'),'utf8'));
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
const scriptSrcs=html=>[...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
for(const [name,html] of [['zh',zh],['en',en]]){
  const versions=[...html.matchAll(/\?v=(\d+)/g)].map(m=>m[1]);
  const scripts=scriptSrcs(html);
  ok(versions.length>0&&versions.every(v=>v==='180'),`${name} authored entry uses only cache generation 180`);
  ok(/style\.css\?v=180/.test(html),`${name} stylesheet uses generation 180`);
  ok(scripts.length===13&&scripts.every(src=>src.endsWith('?v=180')),`${name} boots 13 generation-180 synchronous scripts`);
  ok(html.includes('game/locale/locale-data-v134.js?v=180')&&html.indexOf('game/locale/locale-data-v134.js?v=180')<html.indexOf('game/core/game.js?v=180'),`${name} locale data boots before core`);
  ok(html.includes('game/domain/combat/combat-rules-v130.js?v=180')&&html.indexOf('game/domain/combat/combat-rules-v130.js?v=180')<html.indexOf('game/core/game.js?v=180'),`${name} active domain authorities boot before core`);
  ok(html.includes('game/domain/town/town-rules-v130.js?v=180')&&html.indexOf('game/domain/town/town-rules-v130.js?v=180')<html.indexOf('game/core/game.js?v=180'),`${name} town policy authority boots before core`);
  ok(html.includes('game/core/game.js?v=180')&&html.includes('game/locale/core-locale-data-v139.js?v=180')&&html.indexOf('game/core/game.js?v=180')<html.indexOf('game/locale/core-locale-data-v139.js?v=180'),`${name} one-shot core locale data boots after core`);
  ok(scripts[scripts.length-1]==='game/core/runtime-bootstrap.js?v=180',`${name} runtime bootstrap is final synchronous script`);
}
ok(authority.version==='1.6.0'&&authority.cacheGeneration===180,'authority map locks v1.6.0 cache generation 180');
ok(runtime.includes("const assetVersion = '180'"),'runtime followers use generation 180 cache key');
ok(deployReadme.includes('v1.6.0 publishes cache generation 180'),'deployment README declares generation 180');
ok(!/cache generation (?:153|157|166|167|168)\b/.test(deployReadme),'deployment README contains no retired cache generation');
for(const active of [
  "fresh('game/core/release-stamp-v160.js')",
  "fresh('game/locale/fixed-locale-entry-v130.js')",
  "fresh('game/ui/responsive-final-v154.js')",
  "fresh('game/ui/help-copy-v126.js')",
  "fresh('game/ui/theme-atmosphere-v131.js')",
  "fresh('game/ui/adaptive-bgm-v132.js')",
  "fresh('game/ui/forge-feedback-v132.js')",
]) ok(runtime.includes(active),`runtime cache-busts active follower: ${active}`);
for(const retired of ['core-screen-owner-v153.js','town-canvas-locale-v153.js','forge-feedback-v122.js','world-loot-polish-v122.js','expedition-record-v126.js'])
  ok(!runtime.includes(retired),`retired follower stays out of v180 runtime: ${retired}`);
ok(/version:'v32'/.test(runtime),'runtime generation-180 follower graph is bootstrap v32');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
