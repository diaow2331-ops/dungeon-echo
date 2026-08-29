'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const grad={addColorStop(){}};
function ctx(){return new Proxy({}, {get(_t,k){if(k==='canvas')return{width:32,height:32};if(k==='measureText')return()=>({width:10});if(String(k).startsWith('create'))return()=>grad;return()=>{}},set(){return true}})}
function el(id){return {id,innerHTML:'',textContent:'',style:{},dataset:{},disabled:false,getContext:()=>ctx(),classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},setAttribute(){},appendChild(){},querySelector(sel){return el(id+'-'+sel)},getBoundingClientRect(){return {left:0,top:0,width:1280,height:896}}}}
const els=new Map();const get=id=>{if(!els.has(id))els.set(id,el(id));return els.get(id)};
global.document={getElementById:get,createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx()}:el('created'),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},documentElement:{dataset:{deLocale:'zh-CN'}}};
global.window={innerWidth:1280,innerHeight:800,addEventListener(){},DE_PROFILES:{}};global.location={search:'?profile=classic-100'};global.matchMedia=()=>({matches:false});global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};global.Image=class{constructor(){this.complete=true;this.naturalWidth=192;this.naturalHeight=128}set src(v){this._src=v}};global.performance={now:()=>0};
global.localStorage={m:new Map(),getItem(k){return this.m.has(k)?this.m.get(k):null},setItem(k,v){this.m.set(k,String(v))},removeItem(k){this.m.delete(k)}};
localStorage.setItem('de-greedy-meta-v1',JSON.stringify({v:1,classId:'warrior',runs:3,wins:1,totalKills:47,deaths:2,bestDepth:22,gold:444,wheelTotal:4,gotLegend:1,achv:{first_run:1},equip:{weapon:null,armor:null,ring:null},bag:[],stash:[]}));
for(const f of ['profiles/classic-100.profile.js','game/locale/locale-data-v134.js','game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/economy/economy-rules-v130.js','game/domain/progression/progression-rules-v130.js','game/domain/combat/combat-rules-v130.js','game/core/game.js']) vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const T=window.DE_TEST; let pass=0,fail=0; const ok=(c,n)=>{console.log((c?'PASS ':'FAIL ')+n);c?pass++:fail++};
let r=T.getRecord(); ok(r.runs>=3&&r.totalKills>=47&&r.bestDepth>=22&&r.legends>=1,'legacy lower-bound migrates into independent record');
const metaBefore=JSON.parse(localStorage.getItem('de-greedy-meta-v1')); T.setGreedy(false); T.setSeed('record-classic'); T.newGame('mage'); r=T.getRecord(); ok(r.runs>=4,'classic run increments global record'); ok(JSON.parse(localStorage.getItem('de-greedy-meta-v1')).runs===metaBefore.runs,'classic record does not increment greedy run economy');
const m=T.monsters[0]; const kills0=r.totalKills; T.killMonster(m); ok(T.getRecord().totalKills===kills0+1,'classic kill increments record');
T.depth=35; T.persistRun(); ok(T.getRecord().bestDepth>=22,'record persists independently of run save');
const achv=T.checkAchv(false); ok(Array.isArray(achv),'achievement evaluation works without Greedy mode');
const src=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8'); ok(src.includes("equipmentWeaponsV13.src = 'art/equipment-weapons-v13.png'")&&src.includes('drawGroundEquipment(it.item, px, py, 29)'),'canonical Canvas uses v13 ground equipment art');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8'); ok(css.includes('*::-webkit-scrollbar-thumb')&&css.includes('#save-now-toggle { min-width: 52px'),'scrollbars and Save control are themed');
ok(src.includes("$('st-escape-wrap').style.display = greedyMode ? '' : 'none'"),'classic HUD hides Greedy-only Return resource');
ok(src.includes('Enter Descend · J Quick Dive'),'English stairs hint keeps Quick Dive truth');
const zh=fs.readFileSync(path.join(root,'index.html'),'utf8'), en=fs.readFileSync(path.join(root,'en/index.html'),'utf8');
ok(zh.includes('地牢回响 · 远征录')&&en.includes('Dungeon Echo · Expedition Record'),'record is presented as a cross-run Dungeon Echo profile');
ok(zh.includes('modal-corner-close')&&en.includes('modal-corner-close'),'record close control is immediately accessible');
const boot=fs.readFileSync(path.join(root,'game/core/production-bootstrap.js'),'utf8');
ok(boot.includes("'de-expedition-record-v1'")&&boot.includes('PERSISTENT_PREF_KEYS'),'New Adventure preserves the cross-run record while clearing run state');
ok(boot.includes('window.__DE_FRESH_CLASS_SELECT_PENDING = true')&&src.includes('window.__DE_FRESH_CLASS_SELECT_PENDING = false')&&!boot.includes('setTimeout(enterFreshClassSelect, 0)'),'New Adventure class selection uses deterministic core-ready handoff');
console.log(`RESULT ${pass}/${pass+fail}`);process.exit(fail?1:0);
