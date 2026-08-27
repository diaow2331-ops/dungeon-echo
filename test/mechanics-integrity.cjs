/* Focused regression contract for the post-v1.1 P0 mechanics-integrity layer. */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const storage = new Map();
global.localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};

const listeners = { window: {}, document: {} };
global.document = {
  documentElement:{dataset:{deLocale:'zh-CN'}},
  hint: { textContent: '' },
  querySelectorAll() { return []; },
  getElementById(id) { return id === 'hint' ? this.hint : null; },
  addEventListener(type, fn) { (listeners.document[type] ||= []).push(fn); },
};

global.setInterval = () => 0;
global.clearInterval = () => {};

let depth = 10;
let state = 'playing';
const player = {
  atkBase: 10, equip: {}, talents: [], lvl: 1, flatDr: 2,
  grievous: 0, hp: 50, potions: 0, scrolls: 0,
};
let monsters = [{ midBoss: true, hp: 20, atk: 10 }];
const meta = { classId: 'warrior', bestDepth: 0 };
let rangedCalls = 0;
let meleeCalls = 0;
let seenFlat = 0;
let seenAtk = 0;

const api = {
  profileId: 'classic-100',
  CLASSES: {
    warrior: { hpBase: 38, skill: { cd: 6 } },
    ranger: { rangedRange: 5 },
    mage: {},
    assassin: { hpBase: 24, skill: { cd: 6 } },
  },
  TALENTS: [],
  get depth() { return depth; },
  set depth(v) { depth = v; },
  get state() { return state; },
  get player() { return player; },
  get monsters() { return monsters; },
  get mapGrid() { return [[1]]; },
  get classId() { return meta.classId; },
  get meta() { return meta; },
  descend() { depth++; return true; },
  useSkill() {},
  monsterAttack() { meleeCalls++; },
  monsterRangedAttack(m) {
    rangedCalls++;
    seenFlat = player.flatDr;
    seenAtk = m.atk;
    return 'hit';
  },
};

global.window = {
  DE_TEST: api,
  addEventListener(type, fn) { (listeners.window[type] ||= []).push(fn); },
};

vm.runInThisContext(fs.readFileSync(path.join(root, 'gameplay-tuning.js'), 'utf8'), {
  filename: 'gameplay-tuning.js',
});

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const I = window.DE_MECHANICS_INTEGRITY;
ok(I && I.version === 'p0-v2' && I.locale === 'zh-CN', 'P0 fixed-route integrity layer boots');
ok(I && I.canLeaveDepth() === false, 'live 10-floor guardian blocks descent');
monsters = [];
ok(I && I.canLeaveDepth() === true, 'observed defeated guardian unlocks descent');
ok(I && I.guardianCleared(10) && I.allowedCheckpoints().includes(11), 'guardian proof unlocks checkpoint 11');

storage.set('de-run-v6', JSON.stringify({
  profileId: 'classic-100',
  monsters: [{ midBoss: true, hp: 20, slow: true, skip: 1, armorBreakCharge: 2, armorBreakMode: 'melee' }],
}));
ok(I && I.sanitizeGuardianSave() === true, 'resume sanitizer repairs only transient guardian reservation state');
{
  const saved = JSON.parse(storage.get('de-run-v6'));
  const g = saved.monsters[0];
  ok(g.slow === false && g.skip === 0, 'content-system transient slow/skip reservation is cleared on resume');
  ok(g.armorBreakCharge === 2 && g.armorBreakMode === 'melee', 'floor-10 armor-break telegraph survives resume');
}

let plan = I && I.attackPlan('ranger', new Set(['se_r60_marksman', 'se_r80_phantom']), false);
ok(plan && plan.scale === 0.35, '60F marksman follow-up is not weakened by 80F phantom');
plan = I && I.attackPlan('ranger', new Set(['se_r80_chain']), true);
ok(plan && plan.scale === 0.25, '80F endless hunt adds a distinct kill follow-up');

player.flatDr = 2;
meta.classId = 'warrior';
api.monsterAttack({ atk: 10 });
ok(rangedCalls === 1 && meleeCalls === 0, 'telegraphed area special avoids melee dodge/thorns path');
ok(seenFlat === 5, 'special attacks retain full flat/Warrior reduction');
ok(seenAtk === 12 || seenAtk === 13, 'area special restores melee-scale pressure through ranged core');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);