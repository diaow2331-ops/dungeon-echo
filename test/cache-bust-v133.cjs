/* Focused release contract for production asset generation 133. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8');
const en=fs.readFileSync(path.join(root,'en','index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,html] of [['zh',zh],['en',en]]){
  ok(!html.includes('?v=128')&&!html.includes('?v=130')&&!html.includes('?v=131')&&!html.includes('?v=132'),`${name} entry no longer requests stale generations`);
  ok((html.match(/\?v=133/g)||[]).length>=20,`${name} entry cache-busts core/style assets to generation 133`);
  ok(html.includes('audio-director.js')===false || html.includes('runtime-bootstrap.js?v=133'),`${name} runtime entry uses generation 133`);
}
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '133'"),'runtime followers use the same generation 133 cache key');
ok(runtime.includes("fresh('audio-director.js')")&&runtime.includes("fresh('combat-hint-polish.js')")&&runtime.includes("fresh('help-copy-v126.js')"),'fixed-locale followers are cache-busted by runtime generation 133');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
