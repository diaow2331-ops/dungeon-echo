'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
};

const listeners = { window:{}, document:{} };
const body = { appendChild(){} };
global.document = {
  body,
  head:{ appendChild(){} },
  hidden:false,
  getElementById(){ return null; },
  querySelector(){ return null; },
  createElement(){ return { style:{}, dataset:{}, setAttribute(){}, appendChild(){}, insertAdjacentElement(){} }; },
  addEventListener(type, fn) { (listeners.document[type] ||= []).push(fn); },
};
global.queueMicrotask = fn => fn();
global.Image = class { constructor(){ this.complete=false; this.naturalWidth=0; } set src(_v){} };

global.window = {
  addEventListener(type, fn) { (listeners.window[type] ||= []).push(fn); },
};

let turns = 0;
let coreCalls = 0;
let persisted = 0;
let evoCalls = 0;
const player = {
  x:1, y:1, hp:40, hpBase:40, atkBase:4, facing:[1,0], equip:{},
  mana:60, manaMax:60, skillCd:0, talents:['se_w20_guard'],
};
const api = {
  profileId:'classic-100', state:'playing', classId:'warrior', meta:null,
  player, monsters:[], items:[], mapGrid:[[1,1,1],[1,1,1],[1,1,1]],
  CLASSES:{ warrior:{ rangedRange:0, skill:{ name:'横扫' } } },
  get turns(){ return turns; },
  tryMove(){},
  persistRun(){ persisted++; },
  useSkill(){ coreCalls++; turns++; player.skillCd=5; return true; },
};
window.DE_TEST = api;
window.DE_SKILL_EVOLUTION = {
  cast(){ evoCalls++; return api.useSkill(); },
};

const src = fs.readFileSync(path.join(__dirname, '..', 'combat-controls.js'), 'utf8');
vm.runInThisContext(src, { filename:'combat-controls.js' });
const C = window.__DE_COMBAT_CONTROLS_V1;

ok(!!C && typeof C.castSkillAction === 'function', 'combat controls expose one semantic skill action');
ok(!/requestAnimationFrame\s*\(loop\)/.test(src), 'combat controls no longer run a permanent DOM RAF follower');
ok(typeof C.scheduleSync === 'function' && (listeners.document.keydown || []).length >= 1,
  'event-driven sync is installed on document input');

function keyEvent(key) {
  return { key, prevented:false, stopped:false,
    preventDefault(){ this.prevented=true; },
    stopImmediatePropagation(){ this.stopped=true; },
  };
}
function reset(mana=60, talents=['se_w20_guard']) {
  player.mana=mana; player.manaMax=60; player.skillCd=0; player.talents=talents.slice();
  turns=0; coreCalls=0; evoCalls=0; persisted=0;
}

reset();
const k = keyEvent('k');
for (const fn of listeners.window.keydown || []) fn(k);
ok(k.prevented && k.stopped, 'K is owned by combat input router');
ok(evoCalls===1 && coreCalls===1, 'K routes through skill evolution exactly once');
ok(player.mana===30, 'K evolved cast still consumes normal Warrior mana cost');

reset();
const skillTarget = { closest(sel){ return sel === '[data-act="skill"]' ? this : null; } };
const click = { target:skillTarget, prevented:false, stopped:false,
  preventDefault(){ this.prevented=true; },
  stopImmediatePropagation(){ this.stopped=true; },
};
for (const fn of listeners.window.click || []) fn(click);
ok(click.prevented && click.stopped, 'touch skill button is owned by combat input router');
ok(evoCalls===1 && coreCalls===1 && player.mana===30, 'touch skill matches K evolution + mana semantics');

reset(10);
C.castSkillAction();
ok(evoCalls===0, 'insufficient mana blocks evolution pre-effects before cast');
ok(coreCalls===0 && player.mana===10, 'insufficient mana cannot execute core skill or consume mana');

reset(60, []);
C.castSkillAction();
ok(evoCalls===0 && coreCalls===1 && player.mana===30, 'non-evolved skills use the normal mana-wrapped core path');

console.log(`RESULT ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
