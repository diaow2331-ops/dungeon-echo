'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const storage = new Map();
global.localStorage = {
  getItem(k) { return storage.has(k) ? storage.get(k) : null; },
  setItem(k, v) { storage.set(k, String(v)); },
  removeItem(k) { storage.delete(k); },
};

const rafQueue = [];
global.requestAnimationFrame = cb => { rafQueue.push(cb); return rafQueue.length; };
function frame(turn) {
  api.turns = turn;
  const cb = rafQueue.shift();
  if (!cb) throw new Error('expected queued animation frame');
  cb();
}

function ctx() {
  return {
    clearRect() {}, save() {}, restore() {}, fillRect() {}, strokeRect() {},
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
  };
}
function el(id = '') {
  return {
    id, style: {}, children: [], textContent: '', width: 0, height: 0,
    setAttribute() {},
    appendChild(child) { this.children.push(child); return child; },
    getContext() { return ctx(); },
  };
}
const elements = new Map();
const game = el('game'); game.width = 1280; game.height = 896;
const stage = el('stage');
elements.set('game', game);
elements.set('stage', stage);
elements.set('st-hptext', el('st-hptext'));
elements.set('st-hpfill', el('st-hpfill'));
global.document = {
  documentElement:{dataset:{deLocale:'zh-CN'}},
  getElementById(id) { return elements.get(id) || null; },
  createElement(tag) { return el(tag); },
};

const profile = {
  themes: Array.from({ length: 21 }, (_, i) => ({ name: 't' + i })),
  midBosses: [10,20,30,40,50,60,70,80,90].map(depth => ({ depth })),
  boss: {},
};
const grid = Array.from({ length: 28 }, () => Array(40).fill(1));
let meleeCalls = 0, rangedCalls = 0;
const api = {
  profileId: 'classic-100', runProfile: profile,
  depth: 20, turns: 0, state: 'playing',
  player: { x: 5, y: 5, hp: 500 },
  monsters: [], mapGrid: grid,
  pMaxHp: () => 500,
  monsterAttack() { meleeCalls++; api.player.hp -= 10; },
  monsterRangedAttack() { rangedCalls++; api.player.hp -= 8; },
};
global.window = { DE_TEST: api };

const source = fs.readFileSync(path.resolve(__dirname, '..', 'content-system.js'), 'utf8');
vm.runInThisContext(source, { filename: 'content-system.js' });

ok(window.__DE_CONTENT_SYSTEM === 'v6', 'content bridge reports v6');
ok(profile.themes.length === 25, 'late-game themes extend to 25 palettes');
const byDepth = d => profile.midBosses.find(g => g.depth === d);
ok(byDepth(10).armorBreak === true, 'floor 10 retains telegraphed armor-break tutorial');
ok(byDepth(20).regen === true && byDepth(20).slow === false, 'floor 20 uses positioning identity plus secondary regen');
ok(byDepth(30).boom === true && byDepth(30).enrage === false, 'floor 30 removes generic enrage identity');
ok(byDepth(40).ranged === 4, 'floor 40 retains ranged hunter baseline');
ok(byDepth(50).ranged === 2 && byDepth(50).regen === false, 'floor 50 moves healing from passive regen to channel');
ok(byDepth(60).leech === 0.20 && byDepth(60).enrage === false, 'floor 60 removes generic enrage identity');
ok(byDepth(70).regen === true && byDepth(70).boom === true && byDepth(70).slow === false, 'floor 70 removes generic slow identity');
ok(byDepth(80).ranged === 3 && byDepth(80).regen === false, 'floor 80 removes passive regen identity');
ok(byDepth(90).ranged === 3 && byDepth(90).enrage === false && byDepth(90).leech === 0.10, 'floor 90 becomes controlled echo trial');
ok(stage.children.length === 2, 'runtime creates one telegraph canvas and warning badge');

const frost = { midBoss:true, hp:100, maxHp:100, x:5, y:5, slow:false, skip:0 };
api.monsters=[frost]; api.depth=20; frame(1); frame(2); frame(3);
ok(frost.slow === true && frost.skip === 0, 'frost ring reserves guardian action');
let persisted = JSON.parse(localStorage.getItem('de-guardian-encounter-v1'));
ok(persisted && persisted.active && persisted.active.specId === 'frost-ring' && persisted.active.resolveTurn === 4, 'active frost telegraph persists immediately');
frost.skip=1; frame(4);
ok(meleeCalls === 1, 'frost ring hits inside radius');
ok(frost.slow === false && frost.skip === 0, 'frost ring restores flags');

const ember = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0 };
api.monsters=[ember]; api.depth=30; api.player.x=12; api.player.y=10; frame(20); frame(21); frame(22);
ember.skip=1; api.player.x=13; frame(23);
ok(meleeCalls === 1, 'ember mark misses after leaving marked tile');

const hunter = { midBoss:true, hp:100, maxHp:100, x:4, y:8, slow:false, skip:0 };
api.monsters=[hunter]; api.depth=40; api.player.x=9; api.player.y=8; frame(40); frame(41); frame(42);
hunter.skip=1; api.player.y=9; frame(43);
ok(rangedCalls === 0, 'hunter line misses after sidestep');
api.player.x=9; api.player.y=8; frame(46); hunter.skip=1; frame(47);
ok(rangedCalls === 1, 'hunter line hits aligned target');

const healer = { midBoss:true, hp:60, maxHp:100, x:10, y:10, slow:false, skip:0 };
api.monsters=[healer]; api.depth=50; api.player.x=12; api.player.y=10; frame(60); frame(61); frame(62);
ok(healer.slow === true, 'mending channel reserves guardian action');
healer.hp=50; healer.skip=1; frame(63);
ok(healer.hp === 50, 'damage interrupts mending channel');
frame(68); healer.skip=1; frame(69);
ok(healer.hp === 65, 'uninterrupted mending heals 15 percent max HP');

const blood = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0 };
api.monsters=[blood]; api.depth=60; api.player.x=12; api.player.y=10; const meleeBeforeTether=meleeCalls;
frame(80); frame(81); frame(82); blood.skip=1; api.player.x=14; frame(83);
ok(meleeCalls === meleeBeforeTether, 'blood tether breaks at distance four');
api.player.x=12; frame(87); blood.skip=1; frame(88);
ok(meleeCalls === meleeBeforeTether + 1, 'blood tether hits within distance three');

const quake = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0 };
api.monsters=[quake]; api.depth=70; api.player.x=12; api.player.y=10; const meleeBeforeCross=meleeCalls;
frame(100); frame(101); frame(102); quake.skip=1; api.player.y=11; frame(103);
ok(meleeCalls === meleeBeforeCross, 'rupture cross misses off both axes');
api.player.x=10; api.player.y=12; frame(107); quake.skip=1; frame(108);
ok(meleeCalls === meleeBeforeCross + 1, 'rupture cross hits short vertical lane');

const arcane = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0, regen:true, enrage:true, enraged:true };
api.monsters=[arcane]; api.depth=80; api.player.x=12; api.player.y=10; const rangedBeforeArcane=rangedCalls;
frame(120);
ok(arcane.regen === false && arcane.enrage === false && arcane.enraged === false, 'floor 80 runtime normalization strips generic regen/enrage');
frame(121); frame(122);
arcane.skip=1; api.player.y=11; frame(123);
ok(rangedCalls === rangedBeforeArcane, 'arcane strip misses after perpendicular sidestep');
api.player.x=12; api.player.y=10; frame(127); arcane.skip=1; frame(128);
ok(rangedCalls === rangedBeforeArcane + 1, 'arcane strip hits player who stays in short line');

const echo = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0, regen:true, enrage:true, enraged:true, leech:.15 };
api.monsters=[echo]; api.depth=90; api.player.x=12; api.player.y=10; const meleeBeforeEcho=meleeCalls, rangedBeforeEcho=rangedCalls;
frame(140);
ok(echo.regen === false && echo.enrage === false && echo.leech === 0.10, 'floor 90 runtime normalization uses controlled secondary pressure');
frame(141); frame(142);
echo.skip=1; api.player.x=13; frame(143);
ok(meleeCalls === meleeBeforeEcho, 'echo sequence step 1 mark is dodgeable');
api.player.x=13; api.player.y=10; frame(146);
echo.skip=1; api.player.y=11; frame(147);
ok(rangedCalls === rangedBeforeEcho, 'echo sequence step 2 line is dodgeable');
api.player.x=11; api.player.y=10; frame(150);
echo.skip=1; frame(151);
ok(meleeCalls === meleeBeforeEcho + 1, 'echo sequence step 3 ring resolves in fixed order');

const boss = { boss:true, hp:1000, maxHp:1400, x:10, y:10, slow:false, skip:0, regen:true, enrage:true, enraged:true, leech:.12 };
api.monsters=[boss]; api.depth=100; api.player.x=12; api.player.y=10; const meleeBeforeBoss=meleeCalls, rangedBeforeBoss=rangedCalls;
frame(170);
ok(boss.regen === false && boss.enrage === false && boss.enraged === false && boss.leech === 0.08, 'floor 100 suppresses passive regen/enrage and keeps light leech');
frame(171); frame(172);
boss.skip=1; api.player.x=13; frame(173);
ok(meleeCalls === meleeBeforeBoss, 'final phase 1 throne mark is dodgeable');

boss.hp=700; api.player.x=13; api.player.y=10; frame(174);
frame(175);
boss.skip=1; api.player.y=11; frame(176);
ok(rangedCalls === rangedBeforeBoss, 'final phase 2 void line is dodgeable after HP transition');

boss.hp=400; api.player.x=11; api.player.y=10; frame(177);
frame(178);
boss.skip=1; frame(179);
ok(meleeCalls === meleeBeforeBoss + 1, 'final phase 3 heart nova activates below one-third HP');
ok(boss.slow === false && boss.skip === 0, 'final phase specials restore guardian action flags');

// Resume contract: an announced mark survives recreation of the runtime monster object.
const resume = window.DE_GUARDIAN_ENCOUNTER_STATE;
const resumeGuardian = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0 };
api.depth=30; api.turns=300; api.player.x=15; api.player.y=15; api.monsters=[resumeGuardian];
localStorage.setItem('de-guardian-encounter-v1', JSON.stringify({
  v:1, profileId:'classic-100', depth:30, turn:300,
  guardian:{boss:false,midBoss:true,name:'',maxHp:100}, sequenceIndex:0, finalPhase:null, nextSpecialTurn:304,
  active:{specId:'ember-mark',resolveTurn:301,originalSlow:false,originalSkip:0,targetX:15,targetY:15,startHp:100,axis:null,line:null},
}));
ok(resume && resume.version === 'v2' && resume.owner === 'content-system' && resume.locale === 'zh-CN' && resume.restore(resumeGuardian) === true, 'saved telegraph can restore onto reloaded guardian object');
ok(resumeGuardian.slow === true && resume.active && resume.active.specId === 'ember-mark', 'restored telegraph reserves guardian and keeps original special');
api.player.x=16; frame(301);
ok(meleeCalls === meleeBeforeBoss + 1, 'restored ember mark uses saved target and can still be dodged');
persisted = JSON.parse(localStorage.getItem('de-guardian-encounter-v1'));
ok(persisted && persisted.active === null && persisted.nextSpecialTurn === 305, 'resolved resumed special preserves its future cadence');

const echoReload = { midBoss:true, hp:100, maxHp:100, x:10, y:10, slow:false, skip:0 };
api.depth=90; api.turns=350; api.monsters=[echoReload];
localStorage.setItem('de-guardian-encounter-v1', JSON.stringify({
  v:1, profileId:'classic-100', depth:90, turn:350,
  guardian:{boss:false,midBoss:true,name:'',maxHp:100}, sequenceIndex:2, finalPhase:null, nextSpecialTurn:354,
  active:{specId:'echo-ring',resolveTurn:351,originalSlow:false,originalSkip:0,targetX:11,targetY:10,startHp:100,axis:null,line:null},
}));
ok(resume.restore(echoReload) === true && resume.sequenceIndex === 2 && resume.active.specId === 'echo-ring', 'floor 90 reload preserves sequence position and active pattern');

api.depth=1; api.turns=400; api.monsters=[]; frame(400);
ok(localStorage.getItem('de-guardian-encounter-v1') === null, 'new non-guardian expedition state clears stale encounter sidecar');

console.log(`\nGuardian content: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
