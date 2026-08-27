/* Focused event-ownership contract for combat/challenge pressure. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const combat=fs.readFileSync(path.join(root,'combat-pressure.js'),'utf8');
const challenge=fs.readFileSync(path.join(root,'challenge-pressure.js'),'utf8');
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};
for(const [name,src] of [['combat-pressure.js',combat],['challenge-pressure.js',challenge]]){try{new vm.Script(src,{filename:name});ok(true,name+' parses')}catch(e){console.error(e);ok(false,name+' parses')}}
ok(!/setInterval\s*\(/.test(combat),'combat pressure installs no permanent polling interval');
ok(!/setInterval\s*\(/.test(challenge),'challenge pressure installs no permanent polling interval');
ok(combat.includes('function scheduleSync()')&&challenge.includes('function scheduleSync()'),'both pressure owners coalesce state sync');
ok(combat.includes("addEventListener('pageshow', scheduleSync)")&&challenge.includes("addEventListener('pageshow', scheduleSync)"),'both pressure owners resync on page restore');
ok(combat.includes("owner: 'combat-pressure'")&&challenge.includes("owner:'challenge-pressure'"),'pressure runtime ownership is explicit');
ok(combat.includes('Armor Break Special · hit ignores Armor'),'armor-break warning renders English at its owner');
ok(/setTimeout\([^]*installGuardianSpecialBridge/.test(combat),'combat bridge uses only a one-shot post-bootstrap retry');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);process.exit(fail?1:0);
