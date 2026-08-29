/* Historical filename; focused release contract now locks production asset generation 175. */
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
  ok(versions.length>0&&versions.every(v=>v==='175'),`${name} authored entry uses only cache generation 175`);
  ok(/style\.css\?v=175/.test(html),`${name} stylesheet uses generation 175`);
  ok(scripts.length===12&&scripts.every(src=>src.endsWith('?v=175')),`${name} boots 12 generation-175 synchronous scripts`);
  ok(html.includes('game/locale/locale-data-v134.js?v=175')&&html.indexOf('game/locale/locale-data-v134.js?v=175')<html.indexOf('game/core/game.js?v=175'),`${name} locale data boots before core`);
  ok(html.includes('game/domain/combat/combat-rules-v130.js?v=175')&&html.indexOf('game/domain/combat/combat-rules-v130.js?v=175')<html.indexOf('game/core/game.js?v=175'),`${name} active domain authorities boot before core`);
  ok(html.includes('game/core/game.js?v=175')&&html.includes('game/locale/core-locale-data-v139.js?v=175')&&html.indexOf('game/core/game.js?v=175')<html.indexOf('game/locale/core-locale-data-v139.js?v=175'),`${name} one-shot core locale data boots after core`);
  ok(scripts[scripts.length-1]==='game/core/runtime-bootstrap.js?v=175',`${name} runtime bootstrap is final synchronous script`);
}
ok(authority.version==='1.3.6'&&authority.cacheGeneration===175,'authority map locks v1.3.6 cache generation 175');
ok(runtime.includes("const assetVersion = '175'"),'runtime followers use generation 175 cache key');
ok(deployReadme.includes('v1.3.6 publishes cache generation 175'),'deployment README declares generation 175');
ok(!/cache generation (?:153|157|166|167|168)\b/.test(deployReadme),'deployment README contains no retired cache generation');
for(const active of [
  "fresh('game/core/release-stamp-v136.js')",
  "fresh('game/locale/fixed-locale-entry-v130.js')",
  "fresh('game/ui/responsive-final-v154.js')",
  "fresh('game/ui/help-copy-v126.js')",
  "fresh('game/ui/theme-atmosphere-v131.js')",
  "fresh('game/ui/adaptive-bgm-v132.js')",
  "fresh('game/ui/forge-feedback-v132.js')",
]) ok(runtime.includes(active),`runtime cache-busts active follower: ${active}`);
for(const retired of ['core-screen-owner-v153.js','town-canvas-locale-v153.js','forge-feedback-v122.js','world-loot-polish-v122.js','expedition-record-v126.js'])
  ok(!runtime.includes(retired),`retired follower stays out of v175 runtime: ${retired}`);
ok(/version:'v27'/.test(runtime),'runtime generation-175 follower graph is bootstrap v27');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
