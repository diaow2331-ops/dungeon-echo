/* Focused release contract for production asset generation 132. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,html] of [['zh',zh],['en',en]]){
  ok(!html.includes('?v=128')&&!html.includes('?v=130')&&!html.includes('?v=131'),`${name} entry no longer requests stale generations`);
  ok((html.match(/\?v=132/g)||[]).length>=20,`${name} entry cache-busts core/style assets to generation 132`);
  ok(html.includes('town-system.js?v=132')&&html.includes('runtime-bootstrap.js?v=132'),`${name} town/runtime ownership layers use generation 132`);
}
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '132'"),'runtime followers use the same generation 132 cache key');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
