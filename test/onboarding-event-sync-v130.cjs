/* Focused event-ownership contract for progressive onboarding. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'combat-hint-polish.js'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
try{new vm.Script(src,{filename:'combat-hint-polish.js'});ok(true,'onboarding parses')}catch(e){console.error(e);ok(false,'onboarding parses')}
ok(!/setInterval\s*\(/.test(src),'onboarding installs no permanent inspection interval');
ok(!/new\s+MutationObserver\s*\(/.test(src),'onboarding installs no body MutationObserver');
ok(src.includes('function scheduleInspect()')&&src.includes("addEventListener('pageshow',scheduleInspect)"),'tutorial inspection is coalesced on real transitions');
ok(src.includes('function scrubLegacyFeedback()')&&src.includes('attachReset();'),'legacy feedback cleanup and settings reset attachment are event-owned');
ok(src.includes("owner:'combat-hint-polish'")&&src.includes('schedule:scheduleInspect'),'runtime ownership is explicit');
ok(src.includes("const KEY = 'de-onboarding-v2'"),'persistent onboarding save contract remains unchanged');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);process.exit(fail?1:0);
