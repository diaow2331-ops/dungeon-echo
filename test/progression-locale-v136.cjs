'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'..','progression-system.js'),'utf8');
assert(!src.includes('window.DE_I18N'),'progression cannot depend on runtime translator');
assert(src.includes('dataset.deLocale'),'progression must read fixed route identity');
const listeners={document:{},window:{}};
global.document={
  documentElement:{dataset:{deLocale:'en'}},
  getElementById(){return null;},
  addEventListener(type,fn){(listeners.document[type] ||= []).push(fn);},
};
global.queueMicrotask=fn=>fn();
const ids=['iron','edge','luck','blood','haste','pack','gold','ward','bramble','scavenge','elixir','frenzy','tenacity','plunder','stone','echoborn'];
const talents=ids.map(id=>({id,name:`中文-${id}`,desc:`中文说明-${id}`,apply(){}}));
const player={x:1,y:1,hp:50,hpBase:50,atkBase:5,flatDr:0,skillHaste:0,skillCd:0,equip:{},talents:[]};
const api={
  profileId:'classic-100',TALENTS:talents,depth:19,state:'playing',turns:0,player,
  monsters:[],npcs:[],mapGrid:Array.from({length:4},()=>Array(4).fill(1)),greedy:false,meta:null,classId:'warrior',
  pMaxHp:()=>50,applyDamageToMonster(){},useSkill(){api.turns++;player.skillCd=5;},
};
global.window={DE_TEST:api,addEventListener(type,fn){(listeners.window[type] ||= []).push(fn);}};
vm.runInThisContext(src,{filename:'progression-system.js'});
assert.equal(window.__DE_PROGRESSION_SYSTEM,'v3');
assert.equal(window.DE_TALENT_RANKS.locale,'en');
assert(api.TALENTS.some(t=>t.id==='iron'&&t.name==='Ironbone'),'base talent label must be English at source');
assert(api.TALENTS.some(t=>t.id==='w_bulwark'&&t.name==='Immovable Bulwark'),'class talent label must be English at source');
assert(api.TALENTS.every(t=>!/[\u3400-\u9fff]/.test(`${t.name} ${t.desc}`)),'visible floor-19 talent pool must contain no CJK');
api.depth=20;window.DE_TALENT_RANKS.sync();
assert.equal(api.TALENTS.length,2,'floor 20 exposes exactly two evolution choices');
assert(api.TALENTS.every(t=>/^Floor 20 · /.test(t.name)),'evolution names use English floor prefix');
assert(api.TALENTS.every(t=>!/[\u3400-\u9fff]/.test(`${t.name} ${t.desc}`)),'visible evolution pool must contain no CJK');
console.log('progression_locale_v136=PASS');
