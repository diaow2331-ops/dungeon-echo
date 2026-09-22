/* Dungeon Echo v1.9.2 — expedition return & sustain pressure contract.
 *
 * Player-facing problem: expeditions had no real attrition. Returning to town
 * was a free full heal (wounds never persisted while Mana did), Return Scrolls
 * were guaranteed every 10 floors, ordinary monsters stayed harmless deep,
 * and passive HP/Mana regen outpaced incoming damage.
 *
 * This pass fixes the return logic and re-tightens pressure:
 *  1. HP persists across expeditions as meta.hpPct (like Mana already did);
 *     a safe return only convalesces to >=50% (pure policy: town-rules
 *     townConvalescenceHp); full recovery costs a tavern toast (Gold sink).
 *  2. Guaranteed Return Scroll bands halved (every other 10-floor segment).
 *  3. Ordinary monster threat/HP/DEF curves steepened (core-owned tuning).
 *  4. Passive Mana regen halved (attack/focus gains unchanged); natural HP
 *     regen slowed 6->9 turns; rest-camp 45%->30% and shrine-water 50%->35%.
 *
 * Run: node test/expedition-return-pressure-v192.cjs   (exit 0 = pass)
 */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const townRules = require(path.join(root, 'game/domain/town/town-rules-v130.js'));

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

// ---------- 1. Pure convalescence policy ----------
ok(typeof townRules.townConvalescenceHp === 'function', 'town rules own the return convalescence policy');
ok(townRules.townConvalescenceHp(10, 100) === 50, 'badly wounded return is patched to half HP, not full');
ok(townRules.townConvalescenceHp(80, 100) === 80, 'lightly wounded return keeps the actual wound level');
ok(townRules.townConvalescenceHp(0, 100) === 50 && townRules.townConvalescenceHp(1, 38) === 19, 'convalescence floor holds at any low HP');
ok(townRules.townConvalescenceHp(50, 101) === 51 && townRules.townConvalescenceHp(200, 100) === 100, 'convalescence rounds up and clamps at max');
const townSrc = fs.readFileSync(path.join(root, 'game/domain/town/town-rules-v130.js'), 'utf8');
ok(!/localStorage|addEventListener|querySelector|document\.|Math\.random|Date\.now/.test(townSrc),
  'convalescence policy adds no storage, input, DOM or RNG ownership to the domain module');

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


// ---------- 3. Return pressure: wounds persist, full heal is a town spend ----------
T.setGreedy(true); T.newGame('warrior'); T.departTown(1);
ok(T.state === 'playing' && T.player.hp === T.pMaxHp() && T.meta.hpPct === 100, 'fresh legacy-free meta departs at full HP (save-compatible default)');
T.player.hp = 5; T.player.mana = 7; T.player.gold = 120; T.player.potions = 4;
const metaGold0 = T.meta.gold || 0, escapes0 = T.meta.escapes;
// v1.9.3: escape is a channel ritual — clear the floor so it cannot be interrupted here.
function settleEscape() { T.monsters.splice(0, T.monsters.length); T.useEscape(); let g = 0; while (T.state === 'playing' && g++ < 6) T.endTurn(); }
settleEscape();
ok(T.state === 'town', 'return scroll lands in town');
ok(T.meta.gold - metaGold0 === 120, 'carried Gold is banked exactly once on return');
ok(T.meta.escapes === escapes0 - 1, 'return consumes exactly one scroll');
ok(T.meta.hpPct === 50, 'FIX: wounded return convalesces to 50% instead of a free full heal');
ok(T.meta.mana === 9, 'Mana persistence is unchanged: 7 carried Mana plus 2 channel-turn regen ticks (warrior +1) banks as 9');
T.departTown(1);
ok(T.player.hp === 19 && T.player.hp < T.pMaxHp(), 'FIX: departure carries the wound (19/38) — town return no longer erases attrition');
ok(el('log').innerHTML.includes('旧伤未愈'), 'wounded departure is announced with the tavern remedy hint');

// Tavern toast is the deliberate full-heal spend.
settleEscape();
T.meta.gold = 500;
ok(T.tavernAvailable() && T.drinkAtTavern() === true, 'tavern toast remains available after a return');
ok(T.meta.hpPct === 100, 'tavern toast fully restores HP — Gold now buys the recovery that used to be free');
T.departTown(1);
ok(T.player.hp === T.pMaxHp(), 'departure after a toast is genuinely full');

// Death keeps its harsher penalty and still wakes you fully recovered in town.
T.player.inv.push({ slot: 'ring', name: 'pressure-probe', rarity: 1, stats: { atk: 1 }, icon: 'copper-ring' });
const potionsBeforeDeath = T.player.potions, deathsBefore = T.meta.deaths || 0;
T.monsters.splice(0, T.monsters.length);
const killer = T.makeMonster({ sprite: 'x', name: 'killer', color: '#fff', hp: 999, atk: 5, def: 0, xp: 0, min: 1, max: 100 }, { x: T.player.x + 1, y: T.player.y });
T.monsters.push(killer);
T.player.hp = 3; T.player.poison = 0; if (T.player.grievous) T.player.grievous = 0;
T.monsterAttack(killer, false, 99);
ok(T.state === 'town' && (T.meta.deaths || 0) === deathsBefore + 1, 'lethal damage routes through the greedy death return');
ok(T.meta.hpPct === 100, 'death wakes you fully recovered (penalty stays on bag + carried Gold)');
ok((T.meta.bag || []).length === 0, 'death still clears the backpack');
ok(T.meta.potions === potionsBeforeDeath, 'death still preserves stocked consumables (documented behavior)');


// ---------- 4. Sustain pressure: slower passive recovery ----------
T.departTown(1);
T.monsters.splice(0, T.monsters.length);
T.player.hp = 10; T.player.poison = 0; if (T.player.grievous) T.player.grievous = 0;
T.turns = 5; T.endTurn();
ok(T.turns === 6 && T.player.hp === 10, 'natural HP regen no longer ticks at turn 6');
T.turns = 8; T.endTurn();
ok(T.turns === 9 && T.player.hp === 11, 'natural HP regen now ticks at turn 9 (was 6)');

// ---------- 5. Monster pressure: ordinary enemies stay relevant deep ----------
ok(T.monsterThreatScale(1, false, false) === 1.10, 'threat floor raised to 1.10 (was 1.07)');
ok(Number(T.monsterThreatScale(100, false, false).toFixed(2)) === 1.36, 'deep threat reaches 1.36 (was 1.24)');
ok(Number(T.monsterThreatScale(100, true, false).toFixed(2)) === 1.42, 'deep elite threat reaches 1.42 (was 1.30)');
ok(T.monsterThreatScale(100, true, true) === 1, 'guardian/final-boss authored ATK remains untouched');
const probe = d => { T.depth = d; T.setSeed('pressure-probe'); return T.makeMonster({ sprite: 'rat', name: 'rat', color: '#fff', hp: 10, atk: 10, def: 0, xp: 1, min: 1, max: 100 }, { x: 5, y: 5 }); };
const early = probe(1), late = probe(100);
ok(late.atk > early.atk && late.maxHp > early.maxHp && late.def > early.def,
  `deep ordinary monsters outscale early ones on ATK/HP/DEF (${early.atk}->${late.atk}, ${early.maxHp}->${late.maxHp}, ${early.def}->${late.def})`);

// ---------- 6. Return-scroll scarcity: guarantee every other segment ----------
for (const d of [3, 23]) {
  let guaranteed = 0;
  for (const s of ['rp-a', 'rp-b', 'rp-c', 'rp-d', 'rp-e']) {
    T.depth = d; T.setSeed(s); T.genLevel();
    if (T.items.some(i => i.type === 'escape')) guaranteed++;
  }
  ok(guaranteed === 5, `floor ${d} still guarantees a Return Scroll on every seed`);
}
{
  let lucky = 0;
  for (const s of ['rp-a', 'rp-b', 'rp-c', 'rp-d', 'rp-e']) {
    T.depth = 13; T.setSeed(s); T.genLevel();
    if (T.items.some(i => i.type === 'escape')) lucky++;
  }
  ok(lucky < 5, `floor 13 lost the guaranteed scroll (only random drops remain; ${lucky}/5 seeds rolled one)`);
}

// ---------- 7. Authority boundary ----------
const core = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
ok(core.includes('TOWN_RULES.townConvalescenceHp(player.hp, pMaxHp())'), 'core consumes convalescence from the town policy authority');
ok(core.includes('meta.hpPct') && core.includes('base.hpPct = clamp(num(raw.hpPct, 100), 1, 100)'),
  'meta.hpPct is an additive sanitized field on the existing meta blob (no schema/version change)');
ok(core.includes('((depth - returnOffset) % 20 === 0)'), 'return-scroll guarantee is halved in the core spawn owner');
ok(core.includes('COMBAT_RULES.monsterThreatScale(d, elite, bossLike)') &&
  core.includes('COMBAT_RULES.monsterHpPressure(depth, bossLike)') && core.includes('COMBAT_RULES.monsterDefDepthBonus(depth)'),
  'core delegates monster pressure tuning to the combat rules authority (v1.9.2 atomic transfer)');
const combatSrc = fs.readFileSync(path.join(root, 'game/domain/combat/combat-rules-v130.js'), 'utf8');
ok(combatSrc.includes('0.10 + Math.min(0.26') && combatSrc.includes('/ 12'), 'steeper threat/DEF curves live in the combat rules authority');
ok(core.includes('regen:1, attackGain:2') && core.includes('regen:2, attackGain:1'), 'halved passive Mana regen lives in the core mana rules');
ok(core.includes("turns % (player.fastRegen ? 4 : 9)"), 'natural HP regen interval is 9 turns in core (fastRegen talent cadence preserved)');
ok(core.includes('pMaxHp() * 0.30 * healMult()') && core.includes('pMaxHp() * 0.35 * healMult()'), 'rest-camp and shrine-water heals are reduced in core');
const authority = JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8'));
ok(authority.authorities.townReturnConvalescencePolicy === 'game/domain/town/town-rules-v130.js',
  'authority map keeps return convalescence under the existing town policy owner (no second authority)');
ok(authority.authorities.monsterThreatTuning === 'game/domain/combat/combat-rules-v130.js',
  'authority map records the monster-threat tuning transfer to combat rules (single owner)');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
