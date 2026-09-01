'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('game/core/game.js'), zh=read('index.html'), en=read('en/index.html'), css=read('style.css');
let pass=0,fail=0;
const ok=(cond,name)=>{if(cond){pass++;console.log('  PASS '+name)}else{fail++;console.log('  FAIL '+name)}};

for(const [name,html] of [['zh',zh],['en',en]]){
  ok(/id="town-scene"[^>]+width="1120"[^>]+height="460"[^>]+tabindex="0"/.test(html),`${name} ships a large focusable walkable town canvas`);
  ok(/id="town-prompt"/.test(html)&&/data-service="tavern"/.test(html)&&/id="town-tavern"/.test(html),`${name} exposes town interaction and tavern UI`);
}
ok(/innkeeper:14/.test(core)&&/travellingMerchant:6/.test(core)&&/recordsClerk:3/.test(core)&&/portalTechnician:13/.test(core),'previously underused town NPC cells are integrated');
ok(/const TOWN_HOTSPOTS = Object\.freeze/.test(core)&&/function moveTownAvatar\(/.test(core)&&/function interactTown\(/.test(core),'canonical core owns town movement and interaction');
ok(/addEventListener\('pointerdown'/.test(core)&&/state === 'town'/.test(core),'town supports click-to-walk and keyboard routing');
ok(/const tavernMaxToasts = \(\) => TOWN_GROWTH_RULES\.tavernToastCap/.test(core)&&/tavernLastRun/.test(core)&&/function drinkAtTavern\(/.test(core),'tavern growth is bounded by town policy and expedition-gated');
ok(/weight:10[^\n]+atkBase \+= 1/.test(core)&&/weight:50[^\n]+hpBase \+= 2/.test(core),'tavern keeps attack rare and HP modest');
ok(!core.includes("ctx.moveTo(px + 8, py + 12)")&&!core.includes("ctx.fillRect(px - 16, py - 7")&&/const useActionAtlas = actionCol !== 0/.test(core),'idle hero uses detailed art with no fake equipment line geometry');
ok(/\.town-service\[data-service="tavern"\]/.test(css)&&/\.town-prompt/.test(css)&&/#town-scene:focus-visible/.test(css),'town interaction has responsive visual treatment');
ok(!/[\u3400-\u9fff]/.test(en),'English town route contains no CJK text');
console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
