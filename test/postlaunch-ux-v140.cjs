'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('game/core/game.js'),css=read('style.css'),zh=read('index.html'),en=read('en/index.html');
let pass=0,fail=0; const ok=(c,n)=>{console.log((c?'  PASS ':'  FAIL ')+n);c?pass++:fail++};
for(const [name,html] of [['zh',zh],['en',en]]){
  const town=html.slice(html.indexOf('id="town-screen"'),html.indexOf('id="achv-screen"'));
  ok(town.indexOf('town-primary-actions')>=0&&town.indexOf('town-primary-actions')<town.indexOf('town-tabs'),`${name} town keeps primary actions in its fixed header`);
  ok((town.match(/data-town-page="/g)||[]).length===7&&(town.match(/data-town-page-panel="/g)||[]).length===7,`${name} town exposes seven matching tabs and page panels`);
  ok(/data-town-page-panel="wheel"[^>]*hidden[\s\S]*data-service="wheel"/.test(town),`${name} Fortune Wheel owns a dedicated page`);
}
ok(/#town-screen \.town-shell[\s\S]*height:\s*min\(940px, calc\(100dvh - 24px\)\)[\s\S]*overflow:\s*hidden/.test(css),'town shell is fixed to the viewport');
ok(/\.town-pages \{[^}]*overflow:\s*hidden/.test(css)&&/\.town-page \{[\s\S]*overflow:\s*auto/.test(css),'town pages contain their own overflow');
ok(/#town-scene \{[\s\S]*width:\s*100%[\s\S]*max-height:\s*min\(52dvh, 460px\)/.test(css),'town artwork uses the larger responsive canvas');
ok(/const nextLocked = TOWN_CHECKPOINTS\.find/.test(core)&&/visibleCheckpoints = \[\.\.\.unlocked/.test(core),'checkpoint panel shows conquered starts plus only the next locked goal');
ok(/function incomingCombatMsg\(text, damage\)/.test(core),'canonical core owns ordinary incoming-combat grouping');
ok(/kind === 'incoming-combat' && head\.turn === turns/.test(core),'incoming combat only coalesces within the same canonical turn');
ok(/drawLootIcon\(iconId, px, py, 27\)/.test(core),'ordinary ground loot is enlarged for desktop readability');
ok(/Math\.max\(Math\.abs\(it\.x - player\.x\), Math\.abs\(it\.y - player\.y\)\) <= 2/.test(core),'nearby ground equipment gets bounded decision labels only near the hero');
const a=core.indexOf('function renderLog()'),b=core.indexOf('const rarityLogCls',a); const block=core.slice(a,b);
const sb={logLines:[],turns:7,ui:(z,e)=>e,esc:x=>String(x),$(){return null}}; vm.createContext(sb);
vm.runInContext(block+';globalThis.__log={incomingCombatMsg};',sb);
sb.__log.incomingCombatMsg('Rat hit for 2',2); sb.__log.incomingCombatMsg('Bat hit for 3',3);
ok(sb.logLines.length===1&&sb.logLines[0].count===2&&sb.logLines[0].damage===5,'same-turn ordinary enemy hits collapse to one truthful total');
sb.turns=8; sb.__log.incomingCombatMsg('Rat hit for 4',4);
ok(sb.logLines.length===2&&sb.logLines[0].damage===4,'next turn starts a fresh combat log entry');
console.log(`\nRESULT ${pass} passed / ${fail} failed`); process.exit(fail?1:0);
