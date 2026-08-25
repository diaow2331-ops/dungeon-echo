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
function ctx() { return { clearRect() {}, save() {}, restore() {}, fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }; }
function el(id = '') { return { id, style: {}, children: [], textContent: '', width: 0, height: 0, setAttribute() {}, appendChild(child) { this.children.push(child); return child; }, getContext() { return ctx(); } }; }
const elements = new Map();
const game = el('game'); game.width = 1280; game.height = 896;
const stage = el('stage');
elements.set('game', game); elements.set('stage', stage);
elements.set('st-hptext', el('st-hptext')); elements.set('st-hpfill', el('st-hpfill'));
global.document = { getElementById(id) { return elements.get(id) || null; }, createElement(tag) { return el(tag); } };

const profile = { themes: Array.from({ length: 21 }, (_, i) => ({ name: 't' + i })), midBosses: [10,20,30,40,50,60,70,80,90].map(depth => ({ depth })), boss: {} };
const grid = Array.from({ length: 28 }, () => Array(40).fill(1));
let meleeCalls = 0;
let rangedCalls = 0;
const api = {
  profileId: 'classic-100', runProfile: profile, depth: 20, turns: 0, state: 'playing',
  player: { x: 5, y: 5, hp: 100 }, monsters: [], mapGrid: grid,
  pMaxHp: () => 100,
  monsterAttack() { meleeCalls++; api.player.hp -= 10; },
  monsterRangedAttack() { rangedCalls++; api.player.hp -= 8; },
};
global.window = { DE_TEST: api };
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '..', 'content-system.js'), 'utf8'), { filename: 'content-system.js' });

ok(window.__DE_CONTENT_SYSTEM === 'v3', 'content bridge reports v3');
ok(profile.themes.length === 25, 'late-game themes still extend to 25 palettes');
const g20data = profile.midBosses.find(g => g.depth === 20);
const g30data = profile.midBosses.find(g => g.depth === 30);
const g40data = profile.midBosses.find(g => g.depth === 40);
const g50data = profile.midBosses.find(g => g.depth === 50);
const g60data = profile.midBosses.find(g => g.depth === 60);
const g70data = profile.midBosses.find(g => g.depth === 70);
ok(g20data.regen === true && !g20data.slow, 'floor 20 identity no longer depends on generic slow');
ok(g30data.boom === true && !g30data.enrage, 'floor 30 keeps death burst without generic enrage identity');
ok(g40data.ranged === 4, 'floor 40 retains ranged baseline for hunter encounter');
ok(g50data.ranged === 2 && !g50data.regen, 'floor 50 healing identity moves from passive regen to interruptible channel');
ok(g60data.leech === 0.20 && !g60data.enrage, 'floor 60 keeps leech without generic enrage identity');
ok(g70data.regen === true && g70data.boom === true && !g70data.slow, 'floor 70 keeps secondary texture without generic slow identity');
ok(stage.children.length === 2, 'runtime creates telegraph canvas and warning badge');

const frost = { midBoss: true, hp: 100, x: 5, y: 5, slow: false, skip: 0 };
api.monsters = [frost]; api.depth = 20; api.turns = 1; runFrame();
api.turns = 2; runFrame(); api.turns = 3; runFrame();
ok(frost.slow === true && frost.skip === 0, 'frost ring reserves the next guardian action');
frost.skip = 1; api.turns = 4; runFrame();
ok(meleeCalls === 1 && api.player.hp === 90, 'frost ring hits a player who remains inside radius 2');
ok(frost.slow === false && frost.skip === 0, 'frost ring restores guardian turn flags after resolution');

const ember = { midBoss: true, hp: 100, x: 10, y: 10, slow: false, skip: 0 };
api.monsters = [ember]; api.depth = 30; api.player.x = 12; api.player.y = 10;
api.turns = 20; runFrame(); api.turns = 21; runFrame(); api.turns = 22; runFrame();
ember.skip = 1; api.player.x = 13; api.turns = 23; runFrame();
ok(meleeCalls === 1, 'ember mark misses after player leaves the marked tile');
ok(ember.slow === false && ember.skip === 0, 'ember mark restores guardian turn flags after evade');

const hunter = { midBoss: true, hp: 100, x: 4, y: 8, slow: false, skip: 0 };
api.monsters = [hunter]; api.depth = 40; api.player.x = 9; api.player.y = 8;
api.turns = 40; runFrame(); api.turns = 41; runFrame(); api.turns = 42; runFrame();
hunter.skip = 1; api.player.y = 9; api.turns = 43; runFrame();
ok(rangedCalls === 0, 'hunter line misses when player sidesteps out of locked row');
api.player.x = 9; api.player.y = 8; api.turns = 46; runFrame(); api.turns = 47; runFrame(); api.turns = 48; runFrame();
hunter.skip = 1; api.turns = 49; runFrame();
ok(rangedCalls === 1 && api.player.hp === 82, 'hunter line fires when player remains aligned and unobstructed');
grid[8][7] = 0; api.player.x = 9; api.player.y = 8; api.turns = 52; runFrame(); api.turns = 53; runFrame(); api.turns = 54; runFrame();
hunter.skip = 1; api.turns = 55; runFrame();
ok(rangedCalls === 1, 'hunter line is blocked by intervening wall terrain');

const healer = { midBoss: true, hp: 60, maxHp: 100, x: 10, y: 10, slow: false, skip: 0 };
api.monsters = [healer]; api.depth = 50; api.player.x = 12; api.player.y = 10;
api.turns = 60; runFrame(); api.turns = 61; runFrame(); api.turns = 62; runFrame();
ok(healer.slow === true, 'mending channel reserves the next guardian action');
healer.hp = 50; healer.skip = 1; api.turns = 63; runFrame();
ok(healer.hp === 50, 'mending channel is interrupted when guardian takes damage during tell');
ok(healer.slow === false && healer.skip === 0, 'mending channel restores guardian turn flags after interrupt');
api.turns = 68; runFrame(); healer.skip = 1; api.turns = 69; runFrame();
ok(healer.hp === 65, 'uninterrupted mending channel restores 15 percent max HP');

const blood = { midBoss: true, hp: 100, maxHp: 100, x: 10, y: 10, slow: false, skip: 0 };
api.monsters = [blood]; api.depth = 60; api.player.x = 12; api.player.y = 10;
const meleeBeforeTether = meleeCalls;
api.turns = 80; runFrame(); api.turns = 81; runFrame(); api.turns = 82; runFrame();
blood.skip = 1; api.player.x = 14; api.turns = 83; runFrame();
ok(meleeCalls === meleeBeforeTether, 'blood tether breaks when player reaches distance 4');
api.player.x = 12; api.turns = 87; runFrame(); blood.skip = 1; api.turns = 88; runFrame();
ok(meleeCalls === meleeBeforeTether + 1, 'blood tether hits when player remains within distance 3');

const quake = { midBoss: true, hp: 100, maxHp: 100, x: 10, y: 10, slow: false, skip: 0 };
api.monsters = [quake]; api.depth = 70; api.player.x = 12; api.player.y = 10;
const meleeBeforeCross = meleeCalls;
api.turns = 100; runFrame(); api.turns = 101; runFrame(); api.turns = 102; runFrame();
quake.skip = 1; api.player.y = 11; api.turns = 103; runFrame();
ok(meleeCalls === meleeBeforeCross, 'rupture cross misses after player steps off row and column');
api.player.x = 10; api.player.y = 12; api.turns = 107; runFrame(); quake.skip = 1; api.turns = 108; runFrame();
ok(meleeCalls === meleeBeforeCross + 1, 'rupture cross hits inside the three-tile vertical lane');

console.log(`\nGuardian content: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
