/* Focused release contract for production asset generation 131. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,html] of [['zh',zh],['en',en]]){
  ok(!html.includes('?v=128')&&!html.includes('?v=130'),`${name} entry no longer requests stale generations`);
  ok((html.match(/\?v=131/g)||[]).length>=20,`${name} entry cache-busts core/style assets to generation 131`);
  ok(html.includes('gameplay-tuning.js?v=131')&&html.includes('runtime-bootstrap.js?v=131'),`${name} latest ownership layers use generation 131`);
}
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '131'"),'runtime followers use the same generation 131 cache key');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
