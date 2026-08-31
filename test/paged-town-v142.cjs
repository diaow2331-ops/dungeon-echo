'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('game/core/game.js'),zh=read('index.html'),en=read('en/index.html'),css=read('style.css');
let pass=0,fail=0;
const ok=(cond,name)=>{console.log((cond?'  PASS ':'  FAIL ')+name);cond?pass++:fail++};

for(const [name,html] of [['zh',zh],['en',en]]){
  const town=html.slice(html.indexOf('id="town-screen"'),html.indexOf('id="achv-screen"'));
  ok((town.match(/data-town-page="/g)||[]).length===7, `${name} exposes seven town tabs`);
  ok((town.match(/data-town-page-panel="/g)||[]).length===7, `${name} exposes seven town panels`);
  ok(/data-town-page="plaza"[^>]*>/.test(town)&&/data-town-page-panel="plaza"/.test(town), `${name} defaults to the plaza`);
  ok(/id="town-scene" width="1120" height="460"/.test(town), `${name} ships the large plaza canvas`);
}
ok(/bag:'gear', stash:'gear', market:'market', tavern:'tavern', wheel:'wheel', relics:'relics', portal:'depart'/.test(core),'services map to focused pages');
ok(/panel\.hidden = !active/.test(core)&&/aria-selected/.test(core)&&/function selectTownPage\(/.test(core),'page switching owns visibility and accessible tab state');
ok(/const artScale = clamp\(H \/ 300, 1, 1\.34\)/.test(core),'large plaza scales character detail');
ok(/#town-screen \.town-shell[\s\S]*height: min\(940px, calc\(100dvh - 24px\)\)[\s\S]*overflow: hidden/.test(css),'desktop town is fixed to the viewport');
ok(/\.town-page \{[\s\S]*overflow: auto/.test(css)&&/\.town-tabs[\s\S]*repeat\(7/.test(css),'town pages own overflow beneath seven desktop tabs');
ok(/@media \(max-width: 760px\)[\s\S]*repeat\(3/.test(css),'mobile town keeps compact paged navigation');
ok(!/[\u3400-\u9fff]/.test(en),'English paged town contains no CJK text');
console.log(`\nRESULT ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);
