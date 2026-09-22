/* Dungeon Echo v1.9.3 — guardian fury soft-enrage contract.
 *
 * Player-facing problem: guardians keep flat authored stats and never escalate
 * within the fight, so boss combat degenerates into "stand adjacent, press J,
 * step once when warned" — weak and boring, and v1.9.2's ordinary-monster
 * pressure pass made the gap wider.
 *
 * Now: while a guardian stays engaged (sees you / alerted / adjacent), it gains
 * +GUARDIAN_FURY_RATE attack every GUARDIAN_FURY_STEP_TURNS turns, capped at
 * GUARDIAN_FURY_MAX_STACKS stacks. Killing pace becomes the decision; slow poke
 * and risk-free kiting get taxed. The curve is pure policy in the combat rules
 * authority; core owns engagement detection, the counter, RNG and damage.
 *
 * Run: node test/guardian-fury-v193.cjs   (exit 0 = pass)
 */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const rules = require(path.join(root, 'game/domain/combat/combat-rules-v130.js'));

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

// ---------- 1. Pure policy ----------
ok(rules.GUARDIAN_FURY_STEP_TURNS === 4 && rules.GUARDIAN_FURY_RATE === 0.06 && rules.GUARDIAN_FURY_MAX_STACKS === 8,
  'fury constants: +6% attack every 4 engaged turns, capped at 8 stacks');
ok(rules.guardianFuryStacks(0) === 0 && rules.guardianFuryStacks(3) === 0 && rules.guardianFuryStacks(4) === 1,
  'stacks begin at the fourth engaged turn');
ok(rules.guardianFuryStacks(31) === 7 && rules.guardianFuryStacks(32) === 8 && rules.guardianFuryStacks(999) === 8,
  'stacks cap at 8 (32 engaged turns)');
ok(rules.guardianFuryScale(0) === 1 && Number(rules.guardianFuryScale(4).toFixed(2)) === 1.06,
  'scale is 1.00 at fight start and 1.06 at the first stack');
ok(Number(rules.guardianFuryScale(32).toFixed(2)) === 1.48 && Number(rules.guardianFuryScale(999).toFixed(2)) === 1.48,
  'scale caps at 1.48');
let mono = true;
for (let t = 0; t < 80; t++) if (rules.guardianFuryScale(t) > rules.guardianFuryScale(t + 1)) mono = false;
ok(mono, 'fury scale is monotonically non-decreasing');
const rulesSrc = fs.readFileSync(path.join(root, 'game/domain/combat/combat-rules-v130.js'), 'utf8');
ok(!/localStorage|addEventListener|querySelector|document\.|Math\.random|Date\.now/.test(rulesSrc),
  'fury policy adds no storage, input, DOM or RNG ownership to the combat module');

// ---------- 2. Runtime harness ----------
const gradient = { addColorStop() {} };
function ctx() { return new Proxy({}, { get(_t, k) { if (k === 'canvas') return { width: 32, height: 32 }; if (typeof k === 'string' && k.startsWith('create')) return () => gradient; if (k === 'measureText') return () => ({ width: 10 }); return () => {}; }, set() { return true; } }); }
function elem(id) { return { id, innerHTML: '', textContent: '', disabled: false, title: '', style: {}, dataset: {}, hidden: false, getContext: () => ctx(), getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 600 }), focus() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {}, setAttribute() {}, removeAttribute() {}, replaceChildren() {}, appendChild() {}, append() {}, querySelector: () => elem(id + '-child') }; }
const elements = new Map(), el = id => { if (!elements.has(id)) elements.set(id, elem(id)); return elements.get(id); };
global.document = { getElementById: id => el(id), createElement: t => t === 'canvas' ? { width: 0, height: 0, getContext: () => ctx(), toDataURL: () => '' } : elem('created'), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, documentElement: { dataset: {} } };
global.window = { innerWidth: 1280, innerHeight: 800, addEventListener() {}, dispatchEvent() {}, DE_PROFILES: {} };
global.localStorage = { _m: new Map(), getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }, setItem(k, v) { this._m.set(k, String(v)); }, removeItem(k) { this._m.delete(k); } };
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.Image = class { set src(_v) {} };
global.matchMedia = () => ({ matches: false }); global.performance = { now: () => Date.now() }; global.location = { search: '?profile=classic-100' };
vm.runInThisContext(fs.readFileSync(path.join(root, 'profiles/classic-100.profile.js'), 'utf8'), { filename: 'classic-100' });
for (const rel of ['game/domain/content/content-rules-v130.js', 'game/domain/inventory/equipment-rules-v130.js', 'game/domain/inventory/set-rules-v180.js', 'game/domain/economy/economy-rules-v130.js', 'game/domain/town/town-rules-v130.js', 'game/domain/town/town-growth-rules-v180.js', 'game/domain/expedition/expedition-rules-v170.js', 'game/domain/progression/progression-rules-v130.js', 'game/domain/combat/combat-rules-v130.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root, rel), 'utf8'), { filename: rel });
vm.runInThisContext(fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8'), { filename: 'game.js' });
const T = window.DE_TEST;
ok(!!T, 'core exposes the DE_TEST runtime surface');
T.setGreedy(true); T.newGame('warrior'); T.departTown(1);
T.monsters.splice(0, T.monsters.length);

// ---------- 3. Engaged guardian accumulates fury and hits harder over time ----------
// depth 15 midBoss: no guardian identity traits (no armorBreak cycle) and no special table.
const g = T.makeMonster({ sprite: 'boss', name: '测试守卫', color: '#fff', hp: 9999, atk: 20, def: 0, xp: 0, depth: 15, midBoss: true }, { x: T.player.x + 1, y: T.player.y });
ok(g.furyTurns === 0, 'a freshly spawned guardian starts with zero fury');
g.armorBreak = false; g.ranged = 0;
T.monsters.push(g);
T.setSeed('fury-fight');
T.player.hp = 5000;
const hits = [];
for (let i = 0; i < 20 && T.state === 'playing'; i++) {
  const hp0 = T.player.hp;
  T.waitTurn();
  hits.push(hp0 - T.player.hp);
}
ok(T.state === 'playing' && hits.length === 20, 'the player survives a controlled 20-turn engagement');
ok(g.furyTurns === 20, 'every engaged turn accumulates fury (even while the guardian just swings)');
const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
const early = avg(hits.slice(0, 4)), late = avg(hits.slice(16, 20));
ok(early > 0 && late > early * 1.15, `PLAYER DECISION: the same guardian hits meaningfully harder late in the fight (${early.toFixed(1)} -> ${late.toFixed(1)})`);
ok(el('log').innerHTML.includes('怒意升腾'), 'fury stack-ups are announced to the player');

// ---------- 4. Fury persists through save/restore (no save-scumming the enrage) ----------
T.persistRun();
const saved = T.peekRun();
ok(saved && saved.monsters[0] && saved.monsters[0].furyTurns === 20, 'fury counter rides the canonical run save (additive field)');
T.restoreRun(JSON.parse(JSON.stringify(saved)));
ok(T.monsters[0].furyTurns === 20, 'restore preserves the enrage progress');

// ---------- 5. Ordinary monsters are untouched by fury ----------
function ordinaryHit(fury) {
  T.setSeed('fury-ordinary');
  T.monsters.splice(0, T.monsters.length);
  const d = T.makeMonster({ sprite: 'rat', name: '靶子', color: '#fff', hp: 9999, atk: 20, def: 0, xp: 0, min: 1, max: 100 }, { x: T.player.x + 1, y: T.player.y });
  d.furyTurns = fury; d.armorBreak = false; d.ranged = 0;
  T.monsters.push(d);
  T.player.hp = 5000;
  const hp0 = T.player.hp;
  T.waitTurn();
  return hp0 - T.player.hp;
}
const d0 = ordinaryHit(0), d100 = ordinaryHit(100);
ok(d0 > 0 && d0 === d100, 'ordinary monsters ignore the fury curve even with a counter attached');

// ---------- 6. Disengaged guardians do not gain fury ----------
T.setSeed('fury-calm');
T.monsters.splice(0, T.monsters.length);
const far = T.makeMonster({ sprite: 'boss', name: '沉睡守卫', color: '#fff', hp: 9999, atk: 20, def: 0, xp: 0, depth: 15, midBoss: true }, { x: 1, y: 1 });
far.armorBreak = false; far.alert = 0;
T.monsters.push(far);
// wall the guardian off in a pocket so it can neither see nor reach the player
for (const [wx, wy] of [[2, 1], [1, 2], [2, 2]]) T.mapGrid[wy][wx] = 0;
const calmBefore = far.furyTurns;
for (let i = 0; i < 6; i++) T.waitTurn();
ok(far.furyTurns === calmBefore, 'a guardian that cannot see or reach the player stays calm');

// ---------- 7. Authority boundary ----------
const core = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
ok(core.includes('COMBAT_RULES.guardianFuryScale(') && core.includes('COMBAT_RULES.guardianFuryStacks('),
  'core delegates the fury curve to the combat rules authority');
ok(!/GUARDIAN_FURY_(RATE|STEP_TURNS|MAX_STACKS)\s*=/.test(core), 'core does not duplicate the fury constants (reads them through the authority)');
const authority = JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8'));
ok(authority.authorities.guardianFuryPolicy === 'game/domain/combat/combat-rules-v130.js',
  'authority map registers guardian fury under the existing combat rules owner (no second authority)');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);

T.monsters.splice(0, T.monsters.length);
