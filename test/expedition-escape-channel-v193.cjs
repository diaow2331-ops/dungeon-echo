/* Dungeon Echo v1.9.3 — return-scroll channel ritual contract.
 *
 * Player-facing problem: the Return Scroll was an instant, uninterruptible
 * teleport usable while surrounded or boss-locked — retreat timing never
 * involved positioning, so "return is too easy".
 *
 * Now: the scroll is spent up front and channels for ESCAPE_CHANNEL_TURNS
 * full turns; any HP loss breaks the ritual (scroll lost). Commands during
 * the channel keep focus (they just advance the turn). When enemies can
 * reach the player inside the channel window (or poison is ticking), the
 * first T press warns instead of silently burning the scroll; a second
 * press commits. Policy lives in the expedition authority (pure data);
 * core owns turns, damage and the town transition.
 *
 * Run: node test/expedition-escape-channel-v193.cjs   (exit 0 = pass)
 */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const rules = require(path.join(root, 'game/domain/expedition/expedition-rules-v170.js'));

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

// ---------- 1. Pure policy ----------
ok(rules.ESCAPE_CHANNEL_TURNS === 2 && rules.escapeChannelTurns() === 2, 'channel ritual lasts exactly 2 full turns');
ok(rules.escapeChannelRisk(5, 5, [{ x: 7, y: 5 }]) === true, 'melee monster 2 tiles away can close inside the ritual window');
ok(rules.escapeChannelRisk(5, 5, [{ x: 8, y: 5 }]) === false, 'melee monster 3 tiles away is outside the ritual window');
ok(rules.escapeChannelRisk(5, 5, [{ x: 9, y: 5, ranged: true, inSight: true }]) === true, 'a ranged monster with line of sight threatens from any distance');
ok(rules.escapeChannelRisk(5, 5, [{ x: 9, y: 5, ranged: true, inSight: false }]) === false, 'a ranged monster without line of sight cannot interrupt');
ok(rules.escapeChannelRisk(5, 5, []) === false && rules.escapeChannelRisk(5, 5, null) === false, 'no monsters means no interruption risk');
const rulesSrc = fs.readFileSync(path.join(root, 'game/domain/expedition/expedition-rules-v170.js'), 'utf8');
ok(!/localStorage|addEventListener|querySelector|document\.|Math\.random|Date\.now/.test(rulesSrc),
  'channel policy adds no storage, input, DOM or RNG ownership to the expedition module');

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
vm.runInThisContext(fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8'), { filename: 'game/core/game.js' });
const T = window.DE_TEST;
ok(!!T, 'core exposes the DE_TEST runtime surface');


// ---------- 3. Channel lifecycle: start → tick → complete ----------
T.setGreedy(true); T.newGame('warrior'); T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 2; T.player.gold = 50;
const goldBefore = T.meta.gold || 0;
const turns0 = T.turns;
T.useEscape();
ok(T.state === 'playing' && T.player.escapeChannel === 1,
  'PLAYER DECISION: T no longer teleports instantly — the scroll starts a channel and the first hostile turn passes');
ok(T.player.escapes === 1, 'the scroll is spent up front');
ok(el('log').innerHTML.includes('引导'), 'channel start is announced');
T.useEscape(); // pressing T again keeps focus and ticks the ritual
ok(T.state === 'town', 'surviving the full ritual completes the return');
ok((T.meta.gold || 0) - goldBefore === 50, 'carried Gold is banked on channel completion');
ok(T.turns === turns0 + 2, 'the ritual consumed exactly 2 turns');

// ---------- 4. Interruption: any HP loss breaks the channel, scroll lost ----------
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 2;
const brute = T.makeMonster({ sprite: 'x', name: 'brute', color: '#fff', hp: 999, atk: 6, def: 0, xp: 0, min: 1, max: 100 }, { x: T.player.x + 1, y: T.player.y });
T.monsters.push(brute);
const hpBefore = T.player.hp;
const turnsWarn = T.turns;
T.useEscape(); // adjacent threat: pre-flight warning first, nothing is spent
ok(T.state === 'playing' && (T.player.escapeChannel || 0) === 0, 'a threatened escape warns instead of starting the ritual');
ok(T.player.escapes === 2 && T.turns === turnsWarn, 'the warning neither spends the scroll nor passes a turn');
ok(el('log').innerHTML.includes('打断'), 'the threat warning explains the interruption risk');
T.useEscape(); // second press in the same turn commits to the ritual
ok(T.player.escapes === 1 && T.player.hp < hpBefore, 'after confirming, the adjacent brute lands a hit during the first channel turn');
ok(T.state === 'playing' && (T.player.escapeChannel || 0) === 0, 'taking damage breaks the channel and leaves you in the dungeon');
ok(T.player.escapes === 1, 'the interrupted scroll is lost');
ok(el('log').innerHTML.includes('打断'), 'interruption is announced');
// A fresh scroll can restart the ritual once space is cleared.
T.monsters.splice(0, T.monsters.length);
T.useEscape();
ok(T.player.escapeChannel >= 1 && T.state === 'playing', 'a second scroll restarts the ritual after the threat is cleared');
let g = 0; while (T.state === 'playing' && g++ < 6) T.endTurn();
ok(T.state === 'town' && T.player.escapes === 0, 'the restarted ritual completes');

// ---------- 5. Commands during the channel keep focus (no free actions) ----------
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 1;
const depth0 = T.depth, px = T.player.x, py = T.player.y;
T.useEscape();
const turnsBeforeActions = T.turns;
T.descend(); // blocked: descending mid-ritual is just focus
ok(T.depth === depth0 && T.turns === turnsBeforeActions + 1, 'descend during the channel only ticks the ritual (no free floor change)');
ok(T.player.x === px && T.player.y === py, 'no movement happened while channeling');
ok(T.state === 'town', 'the focused ritual still completes on schedule');

// ---------- 5b. Teleport scroll mid-ritual is also just focus (no escape hatch) ----------
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 1; T.player.scrolls = 1;
T.useEscape();
const turnsBeforeScroll = T.turns, tx0 = T.player.x, ty0 = T.player.y;
T.useScroll(); // blocked: teleporting mid-ritual would bypass the positioning cost
ok(T.player.scrolls === 1 && T.turns === turnsBeforeScroll + 1, 'teleport scroll during the channel is not spent — it only ticks the ritual');
ok(T.player.x === tx0 && T.player.y === ty0, 'no teleport happens while channeling');
ok(T.state === 'town', 'the ritual still completes after the focused scroll command');
// The expensive combo stays legal in the correct order: reposition first, then commit.
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 1; T.player.scrolls = 1;
const turnsBeforeTp = T.turns;
T.useScroll();
ok(T.player.scrolls === 0 && T.turns === turnsBeforeTp + 1 && (T.player.escapeChannel || 0) === 0,
  'teleporting BEFORE the ritual remains a legal, costly reposition');
T.useEscape();
let g2 = 0; while (T.state === 'playing' && g2++ < 6) T.endTurn();
ok(T.state === 'town' && T.player.escapes === 0, 'a channel started after repositioning completes normally');

// ---------- 6. Death during the channel stays a death ----------
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 1; T.player.gold = 70;
const deaths0 = T.meta.deaths || 0, vault0 = T.meta.gold || 0;
const killer = T.makeMonster({ sprite: 'x', name: 'killer', color: '#fff', hp: 999, atk: 5, def: 0, xp: 0, min: 1, max: 100 }, { x: T.player.x + 1, y: T.player.y });
T.monsters.push(killer);
T.player.hp = 3; if (T.player.grievous) T.player.grievous = 0;
T.useEscape(); // warning first (adjacent killer), then commit
T.useEscape();
ok(T.state === 'town' && (T.meta.deaths || 0) === deaths0 + 1, 'dying mid-channel routes through the death settlement, not the safe return');
ok((T.meta.gold || 0) === vault0, 'carried Gold is lost on death even with a scroll in hand');

// ---------- 6b. Poisoned pre-flight: self-damage also warns, insisting burns the scroll ----------
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.escapes = 1; T.player.poison = 3;
const turnsP = T.turns;
T.useEscape();
ok(T.player.escapes === 1 && T.turns === turnsP && (T.player.escapeChannel || 0) === 0,
  'poison warns instead of silently burning the scroll');
ok(el('log').innerHTML.includes('毒素'), 'the poison warning is announced');
T.useEscape(); // insist: channel starts, poison ticks, ritual breaks instantly
ok(T.player.escapes === 0 && T.state === 'playing' && (T.player.escapeChannel || 0) === 0,
  'insisting while poisoned starts the ritual and poison breaks it (scroll lost)');
T.player.poison = 0;

// ---------- 7. Authority boundary ----------
const core = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
ok(core.includes('EXPEDITION_RULES.escapeChannelTurns()'), 'core reads the channel length from the expedition authority');
ok(core.includes('EXPEDITION_RULES.escapeChannelRisk('), 'core delegates the pre-flight interruption risk check to the expedition authority');
ok(core.includes('function completeEscape()') && core.includes('function useEscape()'),
  'channel start (useEscape) and settlement (completeEscape) stay split in core');
ok(core.includes('if (escapeChannelActive()) { channelEscapeTick(); return; }'),
  'movement and other commands funnel through the channel guard in core');
const authority = JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8'));
ok(authority.authorities.expeditionReturnChannelPolicy === 'game/domain/expedition/expedition-rules-v170.js',
  'authority map keeps the channel policy under the existing expedition owner (no second authority)');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
