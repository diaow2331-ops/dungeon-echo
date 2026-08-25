'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const rafQueue = [];
global.requestAnimationFrame = cb => { rafQueue.push(cb); return rafQueue.length; };
function runFrame() {
  const cb = rafQueue.shift();
  if (!cb) throw new Error('expected a queued animation frame');
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
    setAttribute() {}, appendChild(child) { this.children.push(child); return child; },
    getContext() { return ctx(); },
  };
}
const elements = new Map();
const game = el('game'); game.width = 1280; game.height = 896;
const stage = el('stage');
elements.set('game', game); elements.set('stage', stage);
elements.set('st-hptext', el('st-hptext')); elements.set('st-hpfill', el('st-hpfill'));
global.document = {
  getElementById(id) { return elements.get(id) || null; },
  createElement(tag) { return el(tag); },
};

const profile = {
  themes: Array.from({ length: 21 }, (_, i) => ({ name: 't' + i })),
  midBosses: [10,20,30,40,50,60,70,80,90].map(depth => ({ depth })),
  boss: {},
};
const grid = Array.from({ length: 28 }, () => Array(40).fill(1));
let meleeCalls = 0;
let rangedCalls = 0;
const api = {
  profileId: 'classic-100', runProfile: profile,
  depth: 20, turns: 0, state: 'playing',
  player: { x: 5, y: 5, hp: 100 },
  monsters: [], mapGrid: grid,
  pMaxHp: () => 100,
  monsterAttack() { meleeCalls++; api.player.hp -= 10; },
  monsterRangedAttack() { rangedCalls++; api.player.hp -= 8; },
};
global.window = { DE_TEST: api };

const source = fs.readFileSync(path.resolve(__dirname, '..', 'content-system.js'), 'utf8');
vm.runInThisContext(source, { filename: 'content-system.js' });

ok(window.__DE_CONTENT_SYSTEM === 'v2', 'content bridge reports v2');
ok(profile.themes.length === 25, 'late-game themes still extend to 25 palettes');
const g20data = profile.midBosses.find(g => g.depth === 20);
const g30data = profile.midBosses.find(g => g.depth === 30);
const g40data = profile.midBosses.find(g => g.depth === 40);
ok(g20data.regen === true && !g20data.slow, 'floor 20 identity no longer depends on generic slow');
ok(g30data.boom === true && !g30data.enrage, 'floor 30 keeps death burst without generic enrage identity');
ok(g40data.ranged === 4, 'floor 40 retains ranged baseline for hunter encounter');
ok(stage.children.length === 2, 'runtime creates telegraph canvas and warning badge');

const frost = { midBoss: true, hp: 100, x: 5, y: 5, slow: false, skip: 0 };
api.monsters = [frost]; api.depth = 20; api.turns = 1; runFrame();
api.turns = 2; runFrame();
api.turns = 3; runFrame();
ok(frost.slow === true && frost.skip === 0, 'frost ring reserves the next guardian action');
frost.skip = 1; api.turns = 4; runFrame();
ok(meleeCalls === 1 && api.player.hp === 90, 'frost ring hits a player who remains inside radius 2');
ok(frost.slow === false && frost.skip === 0, 'frost ring restores guardian turn flags after resolution');

const ember = { midBoss: true, hp: 100, x: 10, y: 10, slow: false, skip: 0 };
api.monsters = [ember]; api.depth = 30; api.player.x = 12; api.player.y = 10;
api.turns = 20; runFrame();
api.turns = 21; runFrame();
api.turns = 22; runFrame();
ember.skip = 1; api.player.x = 13; api.turns = 23; runFrame();
ok(meleeCalls === 1, 'ember mark misses after player leaves the marked tile');
ok(ember.slow === false && ember.skip === 0, 'ember mark restores guardian turn flags after evade');

const hunter = { midBoss: true, hp: 100, x: 4, y: 8, slow: false, skip: 0 };
api.monsters = [hunter]; api.depth = 40; api.player.x = 9; api.player.y = 8;
api.turns = 40; runFrame();
api.turns = 41; runFrame();
api.turns = 42; runFrame();
hunter.skip = 1; api.player.y = 9; api.turns = 43; runFrame();
ok(rangedCalls === 0, 'hunter line misses when player sidesteps out of locked row');

api.player.x = 9; api.player.y = 8;
api.turns = 46; runFrame();
api.turns = 47; runFrame();
api.turns = 48; runFrame();
hunter.skip = 1; api.turns = 49; runFrame();
ok(rangedCalls === 1 && api.player.hp === 82, 'hunter line fires when player remains aligned and unobstructed');

console.log(`\nGuardian content: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
