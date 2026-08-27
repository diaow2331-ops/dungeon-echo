/* Focused release contract for production asset generation 140. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,html] of [['zh',zh],['en',en]]){
  ok(!/\?v=(?:128|130|131|132|133|134|138|139)\b/.test(html),`${name} entry no longer requests stale pre-140 generations`);
  ok((html.match(/\?v=140/g)||[]).length>=22,`${name} entry cache-busts core/style assets to generation 140`);
  ok(html.includes('locale-data-v134.js?v=140')&&html.indexOf('locale-data-v134.js?v=140')<html.indexOf('game.js?v=140'),`${name} fixed locale data boots before core at generation 140`);
  ok(html.includes('game.js?v=140')&&html.includes('core-locale-data-v139.js?v=140')&&html.indexOf('game.js?v=140')<html.indexOf('core-locale-data-v139.js?v=140'),`${name} one-shot core locale data owner boots immediately after core`);
  ok(html.includes('runtime-bootstrap.js?v=140'),`${name} runtime entry uses generation 140`);
}
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '140'"),'runtime followers use the same generation 140 cache key');
ok(runtime.includes("fresh('forge-feedback-v122.js')")&&runtime.includes("fresh('world-loot-polish-v122.js')")&&runtime.includes("fresh('expedition-record-v126.js')"),'shared followers are cache-busted by runtime generation 140');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
