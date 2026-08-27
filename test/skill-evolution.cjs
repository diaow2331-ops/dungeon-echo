'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const listeners = {};
global.document = {
  documentElement:{dataset:{deLocale:'zh-CN'}},
  getElementById() { return null; },
  addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
};
global.setInterval = () => 1;
global.clearInterval = () => {};

const baseIds = ['iron','edge','luck','blood','haste','pack','gold','ward','bramble','scavenge','elixir','frenzy','tenacity','plunder','stone','echoborn'];
const talents = baseIds.map(id => ({ id, name: id, desc: id, apply() {} }));
let classId = 'warrior';
const grid = Array.from({ length: 10 }, () => Array(10).fill(1));
const player = {
  x: 5, y: 5, hp: 70, hpBase: 100, atkBase: 10, flatDr: 0, skillHaste: 0,
  skillCd: 0, equip: {}, talents: [],
};
const api = {
  profileId: 'classic-100', TALENTS: talents, depth: 20, state: 'playing', turns: 0,
  player, monsters: [], npcs: [], mapGrid: grid,
  get classId() { return classId; },
  pMaxHp: () => 100,
  applyDamageToMonster(m, dmg) {
    m.hp -= dmg;
    if (m.hp <= 0) api.monsters.splice(api.monsters.indexOf(m), 1);
  },
  useSkill() { api.turns++; player.skillCd = 5; },
};
global.window = { DE_TEST: api, addEventListener() {} };

const source = fs.readFileSync(path.resolve(__dirname, '..', 'progression-system.js'), 'utf8');
vm.runInThisContext(source, { filename: 'progression-system.js' });

ok(window.__DE_PROGRESSION_SYSTEM === 'v3', 'progression bridge reports v3');
ok((listeners.keydown || []).length === 1 && (listeners.click || []).length === 1,
  'progression no longer registers a second keyboard-only follow-up attack listener');
ok(window.DE_SKILL_EVOLUTION.nextAttackOwner === 'mechanics-integrity',
  'cross-input mechanics layer is the single owner of next-attack consumption');
ok(api.TALENTS.length === 2 && api.TALENTS.every(t => t.id.startsWith('se_w20_')),
  'floor 20 exposes exactly two warrior skill evolutions');

player.talents = ['se_w20_guard'];
api.depth = 40;
const pending40 = window.DE_SKILL_EVOLUTION.pending();
ok(pending40 && pending40.length === 2 && pending40.every(t => t.id.startsWith('se_w40_')),
  'next missing milestone advances to floor 40');

let drSeen = -1;
api.useSkill = () => { drSeen = player.flatDr; api.turns++; player.skillCd = 5; };
api.monsters = [{ x: 6, y: 5, hp: 30, maxHp: 30, def: 0 }];
api.depth = 20; player.talents = ['se_w20_guard']; player.skillCd = 0;
window.DE_SKILL_EVOLUTION.cast();
ok(drSeen === 3 && player.flatDr === 0, 'warrior guard applies only during the skill turn');

player.talents = ['se_w20_arc']; player.skillCd = 0; api.turns = 0;
const diagonal = { x: 6, y: 6, hp: 30, maxHp: 30, def: 0 };
api.monsters = [{ x: 6, y: 5, hp: 30, maxHp: 30, def: 0 }, diagonal];
api.useSkill = () => { api.turns++; player.skillCd = 5; };
window.DE_SKILL_EVOLUTION.cast();
ok(diagonal.hp < 30, 'warrior arc damages a diagonal secondary target');

classId = 'mage'; player.talents = ['se_m20_fork']; player.skillCd = 0; api.depth = 20;
player.x = 1; player.y = 1;
const primary = { x: 3, y: 1, hp: 30, maxHp: 30, def: 0 };
const secondary = { x: 4, y: 1, hp: 30, maxHp: 30, def: 0 };
api.monsters = [primary, secondary];
api.useSkill = () => { api.turns++; player.skillCd = 4; };
window.DE_SKILL_EVOLUTION.cast();
ok(secondary.hp < 30, 'mage fork damages the second visible target');

classId = 'ranger'; player.talents = ['se_r40_hunt']; player.skillCd = 0;
api.monsters = [{ x: 2, y: 2, hp: 1, maxHp: 1, def: 0 }];
api.useSkill = () => { api.monsters = []; api.turns++; player.skillCd = 5; };
window.DE_SKILL_EVOLUTION.cast();
ok(player.skillCd === 0, 'ranger hunt resets cooldown on a skill kill');

classId = 'assassin'; player.talents = ['se_a20_execute']; player.skillCd = 0;
player.x = 1; player.y = 1;
const prey = { x: 2, y: 1, hp: 4, maxHp: 10, def: 0 };
api.monsters = [prey];
let atkSeen = 0;
api.useSkill = () => { atkSeen = player.atkBase; api.turns++; player.skillCd = 5; };
window.DE_SKILL_EVOLUTION.cast();
ok(atkSeen > 10 && player.atkBase === 10,
  'assassin execute boosts a low-health target cast without leaking base attack');

classId = 'warrior';
player.talents = ['se_w20_guard', 'se_w60_pressure']; player.skillCd = 0; api.depth = 60;
api.monsters = [{ x: 9, y: 9, hp: 30, maxHp: 30, def: 0 }];
const baseAtk = player.atkBase, baseDr = player.flatDr, baseHaste = player.skillHaste;
api.useSkill = () => {};
window.DE_SKILL_EVOLUTION.cast();
ok(player.atkBase === baseAtk && player.flatDr === baseDr && player.skillHaste === baseHaste,
  'failed casts do not leak temporary permanent stats');

console.log(`\nSkill evolution: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
