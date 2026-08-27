/* Focused event-ownership contract for defense-system. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'defense-system.js'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
try{new vm.Script(src,{filename:'defense-system.js'});ok(true,'defense system parses')}catch(e){console.error(e);ok(false,'defense system parses')}
ok(!/setInterval\s*\(/.test(src),'defense/talent owners install no permanent polling interval');
ok((src.match(/function scheduleSync\s*\(/g)||[]).length===2,'defense and talent safety each expose coalesced event sync');
ok((src.match(/addEventListener\('pageshow', scheduleSync\)/g)||[]).length===2,'both owners resync on page restore');
ok(src.includes("owner: 'defense-system'")&&src.includes("schedule: scheduleSync"),'runtime ownership is explicit');
ok(src.includes('dataset.deLocale')&&!src.includes('DE_I18N'),'defense/talent visible copy uses fixed route with no runtime translator');
ok(src.includes("version: 'v3'")&&src.includes("version: 'v2'"),'defense v3 and talent safety v2 contracts are present');
ok(src.includes('Armor ${armor()} · Fixed DR')&&src.includes('Ember Resupply'),'defense tooltip and exhaustion fallback render English directly');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);process.exit(fail?1:0);