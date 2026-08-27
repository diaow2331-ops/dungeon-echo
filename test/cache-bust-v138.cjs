/* Focused release contract for production asset generation 138. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,html] of [['zh',zh],['en',en]]){
  ok(!/\?v=(?:128|130|131|132|133|134)\b/.test(html),`${name} entry no longer requests stale pre-138 generations`);
  ok((html.match(/\?v=138/g)||[]).length>=21,`${name} entry cache-busts core/style assets to generation 138`);
  ok(html.includes('locale-data-v134.js?v=138')&&html.indexOf('locale-data-v134.js?v=138')<html.indexOf('game.js?v=138'),`${name} fixed locale data boots before core at generation 138`);
  ok(html.includes('runtime-bootstrap.js?v=138'),`${name} runtime entry uses generation 138`);
}
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '138'"),'runtime followers use the same generation 138 cache key');
ok(runtime.includes("fresh('forge-feedback-v122.js')")&&runtime.includes("fresh('mobile-ux.js')")&&runtime.includes("fresh('expedition-record-v126.js')"),'shared followers are cache-busted by runtime generation 138');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
