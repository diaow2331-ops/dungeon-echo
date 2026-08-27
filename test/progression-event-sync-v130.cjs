'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'progression-system.js'), 'utf8');
assert(!/setInterval\s*\(/.test(source), 'progression-system must not keep a polling interval');
assert(!/function\s+skillInput\s*\(/.test(source), 'progression must not own legacy C/touch skill input');
assert(source.includes("inputOwner: 'combat-controls'"), 'public skill input ownership must be explicit');
assert(source.includes('dataset.deLocale'), 'progression must read fixed route locale identity');
assert(!source.includes('window.DE_I18N'), 'progression must not depend on the runtime translator');

const listeners = { document: {}, window: {} };
const microtasks = [];
global.queueMicrotask = fn => microtasks.push(fn);
global.setInterval = () => { throw new Error('polling interval must not be created'); };
global.document = {
  documentElement:{dataset:{deLocale:'zh-CN'}},
  getElementById() { return null; },
  addEventListener(type, fn) { (listeners.document[type] ||= []).push(fn); },
};

const ids = ['iron','edge','luck','blood','haste','pack','gold','ward','bramble','scavenge','elixir','frenzy','tenacity','plunder','stone','echoborn'];
const talents = ids.map(id => ({ id, name:id, desc:id, apply(){} }));
const player = { x:1,y:1,hp:50,hpBase:50,atkBase:5,flatDr:0,skillHaste:0,skillCd:0,equip:{},talents:[] };
const api = {
  profileId:'classic-100', TALENTS:talents, depth:19, state:'playing', turns:0, player,
  monsters:[], npcs:[], mapGrid:Array.from({length:4},()=>Array(4).fill(1)), greedy:false, meta:null,
  classId:'warrior', pMaxHp:()=>50,
  applyDamageToMonster(){}, useSkill(){ api.turns++; player.skillCd=5; },
};
global.window = {
  DE_TEST:api,
  addEventListener(type, fn) { (listeners.window[type] ||= []).push(fn); },
};

vm.runInThisContext(source, { filename:'progression-system.js' });
assert.equal(window.__DE_PROGRESSION_SYSTEM, 'v3');
assert(window.DE_TALENT_RANKS && window.DE_TALENT_RANKS.version === 'v3');
assert(window.DE_SKILL_EVOLUTION && window.DE_SKILL_EVOLUTION.inputOwner === 'combat-controls');
assert.equal((listeners.document.keydown || []).length, 1, 'one key listener should schedule pool sync only');
assert.equal((listeners.document.click || []).length, 1, 'one click listener should schedule pool sync only');

assert(!api.TALENTS.some(t => String(t.id).startsWith('se_w20_')), 'floor 19 should use the regular talent pool');
api.depth = 20;
for (const fn of listeners.document.keydown || []) fn({ type:'keydown', key:'Enter' });
assert(microtasks.length >= 1, 'depth-changing input must queue a progression sync');
while (microtasks.length) microtasks.shift()();
assert.equal(api.TALENTS.length, 2, 'floor 20 should switch to exactly two evolution choices');
assert(api.TALENTS.every(t => String(t.id).startsWith('se_w20_')), 'floor 20 pool must contain only warrior evolution choices');

api.depth = 40;
for (const fn of listeners.document.keydown || []) fn({ type:'keydown', key:'x' });
for (const fn of listeners.document.click || []) fn({ type:'click', target:null });
assert.equal(microtasks.length, 1, 'progression sync should coalesce same-turn events');

console.log('progression_event_sync_v130=PASS');
