/* Dungeon Echo v1.9.9 — incremental combat-log rendering contract. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'game/core/game.js'),'utf8');
const start=core.indexOf('// ================= 消息 =================');
const end=core.indexOf('const rarityLogCls',start);
assert(start>=0&&end>start,'message/log block must be discoverable');
const block=core.slice(start,end);

function makeLine(){
  return {textContent:'',className:'',parent:null,remove(){
    if(!this.parent)return;
    const i=this.parent.children.indexOf(this);
    if(i>=0)this.parent.children.splice(i,1);
  }};
}
const logEl={
  children:[],_html:'',
  prepend(el){el.parent=this;this.children.unshift(el)},
  get firstElementChild(){return this.children[0]||null},
  get lastElementChild(){return this.children[this.children.length-1]||null},
  set innerHTML(v){this._html=String(v);this.children.length=0},
  get innerHTML(){return this._html},
};
const sb={
  logLines:[],turns:7,
  ui:(zh,en)=>en,
  esc:x=>String(x).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])),
  $:id=>id==='log'?logEl:null,
  document:{createElement:()=>makeLine()},
};
vm.createContext(sb);
vm.runInContext(block+';globalThis.API={msg,incomingCombatMsg,renderLog,resetLogPerf,perf:()=>({...logPerf})};',sb);
const A=sb.API;

A.resetLogPerf();
A.msg('alpha','good');
assert.equal(sb.logLines.length,1);
assert.equal(logEl.children.length,1);
assert.equal(logEl.firstElementChild.textContent,'alpha');
assert.equal(logEl.firstElementChild.className,'good');
let p=A.perf();
assert.equal(p.prepends,1);
assert.equal(p.fullRenders,0);

for(let i=0;i<35;i++) A.msg('row-'+i,i%2?'':'epic');
assert.equal(sb.logLines.length,30,'canonical log storage stays capped at 30');
assert.equal(logEl.children.length,30,'incremental DOM stays capped at canonical log length');
p=A.perf();
assert.equal(p.prepends,36,'all new rows use prepend path');
assert.equal(p.fullRenders,0,'normal incremental path never rebuilds all log HTML');

sb.logLines.length=0;logEl.children.length=0;sb.turns=11;A.resetLogPerf();
A.incomingCombatMsg('Rat hit for 2',2);
A.incomingCombatMsg('Bat hit for 3',3);
assert.equal(sb.logLines.length,1,'same-turn incoming hits coalesce');
assert.equal(sb.logLines[0].count,2);
assert.equal(sb.logLines[0].damage,5);
assert(logEl.firstElementChild.textContent.includes('5'),'head DOM row reflects coalesced total');
p=A.perf();
assert.equal(p.prepends,1,'first incoming hit prepends one row');
assert.equal(p.headUpdates,1,'second same-turn hit edits only the head row');
assert.equal(p.fullRenders,0,'coalescing does not rebuild full log');

A.renderLog();
assert.equal(A.perf().fullRenders,1,'explicit fallback full render remains available');
console.log('performance_log_v199=PASS');
