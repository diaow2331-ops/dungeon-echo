/* Focused release contract for production asset generation 134. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,html] of [['zh',zh],['en',en]]){
  ok(!html.includes('?v=128')&&!html.includes('?v=130')&&!html.includes('?v=131')&&!html.includes('?v=132')&&!html.includes('?v=133'),`${name} entry no longer requests stale generations`);
  ok((html.match(/\?v=134/g)||[]).length>=21,`${name} entry cache-busts core/style assets to generation 134`);
  ok(html.includes('locale-data-v134.js?v=134')&&html.indexOf('locale-data-v134.js?v=134')<html.indexOf('game.js?v=134'),`${name} fixed locale data boots before core`);
  ok(html.includes('runtime-bootstrap.js?v=134'),`${name} runtime entry uses generation 134`);
}
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '134'"),'runtime followers use the same generation 134 cache key');
ok(runtime.includes("fresh('forge-feedback-v122.js')")&&runtime.includes("fresh('mobile-ux.js')")&&runtime.includes("fresh('expedition-record-v126.js')"),'fixed-locale followers are cache-busted by runtime generation 134');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);