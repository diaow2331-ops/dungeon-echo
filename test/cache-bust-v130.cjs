/* Focused release contract for production asset generation 130. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
ok(!html.includes('?v=128'),'production entry no longer requests generation 128 assets');
ok((html.match(/\?v=130/g)||[]).length>=20,'production entry cache-busts core/style assets to generation 130');
ok(html.includes('gameplay-tuning.js?v=130')&&html.includes('runtime-bootstrap.js?v=130'),'latest gameplay and runtime ownership layers cannot be hidden behind old cache keys');
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
ok(runtime.includes("assetVersion = '130'"),'runtime followers use the same generation 130 cache key');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
