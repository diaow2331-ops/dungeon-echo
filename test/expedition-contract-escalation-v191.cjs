/* Dungeon Echo v1.9.1 — expedition contract depth-escalation contract.
 *
 * Proves the single highest-value gameplay-logic change of this pass:
 * Greedy Expedition contracts are no longer flat one-time town picks. Every
 * 10-floor segment escalates both the risk and the reward of the chosen
 * contract, so "push one segment deeper or bank the haul with a Return Scroll"
 * becomes a live per-segment decision instead of a solved departure checkbox.
 *
 * Coverage:
 *  1. Pure deterministic escalation policy in game/domain/expedition/expedition-rules-v170.js.
 *  2. Runtime: core game.js actually composes the policy into monster ATK/XP,
 *     Elite Hunt bounty, trap counts and descent messaging (authority boundary:
 *     domain stays pure, core owns state/RNG).
 *  3. Authority map keeps the new policy under the existing expedition owner.
 *
 * Run: node test/expedition-contract-escalation-v191.cjs   (exit 0 = pass)
 */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const rules = require(path.join(root, 'game/domain/expedition/expedition-rules-v170.js'));

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name); } };

// ---------- 1. Pure escalation policy ----------
ok(rules.ESCALATION_STEP_FLOORS === 10, 'escalation segment is the legible 10-floor band');
ok(rules.escalationStep(1) === 0 && rules.escalationStep(10) === 0, 'floors 1-10 are escalation step 0 (contract keeps its flat v170 face early)');
ok(rules.escalationStep(11) === 1 && rules.escalationStep(20) === 1 && rules.escalationStep(21) === 2, 'escalation steps advance exactly on segment boundaries 11/21');
ok(rules.escalationStep(91) === 9 && rules.escalationStep(100) === 9, 'final segment reaches step 9');
ok(rules.escalationStep(101) === 9 && rules.escalationStep(250) === 9, 'endless echo depths clamp at step 9 instead of growing unbounded');

ok(rules.contractEscalates('none') === false && rules.contractEscalates('garbage') === false, 'free/unknown expedition never escalates');
ok(rules.contractEscalates('hunt') && rules.contractEscalates('relic') && rules.contractEscalates('oath'), 'all three risk contracts escalate');

// Veteran Oath: risk and reward climb together.
ok(rules.monsterAtkEscalation('oath', 1) === 1, 'oath ATK escalation starts neutral on floor 1');
ok(rules.monsterAtkEscalation('oath', 11) === 1.02, 'oath ATK escalation +2% from segment 2');
ok(rules.monsterAtkEscalation('oath', 91) === 1.18, 'oath ATK escalation caps the run at +18% on the final segment');
ok(Number((rules.monsterAtkMultiplier('oath') * rules.monsterAtkEscalation('oath', 91)).toFixed(4)) === 1.3216,
  'deep Oath normal enemies hit ~32% harder than contract-free (was a flat 12%)');
ok(rules.monsterXpEscalation('oath', 1) === 1 && rules.monsterXpEscalation('oath', 91) === 1.225, 'oath XP escalation reaches +22.5% on the final segment');
ok(Number((rules.monsterXpMultiplier('oath') * rules.monsterXpEscalation('oath', 91)).toFixed(4)) === 1.4455,
  'deep Oath pays ~44.5% XP (was a flat 18%) — the push-your-luck premium');


// Relic Sweep: deeper means more named relics AND more traps.
ok(rules.trapEscalation('relic', 1) === 0 && rules.trapEscalation('relic', 30) === 0, 'relic trap escalation is dormant through floor 30');
ok(rules.trapEscalation('relic', 31) === 1 && rules.trapEscalation('relic', 61) === 2 && rules.trapEscalation('relic', 91) === 3,
  'relic traps grow +1 every three segments (31/61/91)');
ok(rules.namedRelicEscalation('relic', 1) === 0 && rules.namedRelicEscalation('relic', 91) === 0.135, 'relic named chance grows to +13.5% on the final segment');
ok(Number((rules.namedRelicChanceBonus('relic') + rules.namedRelicEscalation('relic', 91)).toFixed(4)) === 0.295,
  'deep Relic Sweep named-relic bonus totals +29.5% (was a flat 16%)');

// Elite Hunt: the bounty itself escalates.
ok(rules.eliteBountyEscalation(1, 'hunt') === 0 && rules.eliteBountyEscalation(91, 'hunt') === 27, 'hunt bounty escalation adds +3 G per segment');
ok(rules.eliteBounty(91, 'hunt') + rules.eliteBountyEscalation(91, 'hunt') === 126, 'deep Elite Hunt pays 126 G per elite (was 99 G)');
ok(rules.eliteBountyEscalation(91, 'relic') === 0 && rules.eliteBountyEscalation(91, 'oath') === 0, 'bounty escalation stays exclusive to Elite Hunt');

// Role exclusivity is preserved under escalation: each contract still owns exactly one lever.
ok(rules.monsterAtkEscalation('hunt', 91) === 1 && rules.monsterAtkEscalation('relic', 91) === 1, 'only the Oath escalates enemy ATK');
ok(rules.monsterXpEscalation('hunt', 91) === 1 && rules.monsterXpEscalation('relic', 91) === 1, 'only the Oath escalates XP');
ok(rules.trapEscalation('hunt', 91) === 0 && rules.trapEscalation('oath', 91) === 0, 'only Relic Sweep escalates traps');
ok(rules.namedRelicEscalation('hunt', 91) === 0 && rules.namedRelicEscalation('oath', 91) === 0, 'only Relic Sweep escalates named relics');
ok(rules.monsterAtkEscalation('none', 91) === 1 && rules.trapEscalation('none', 91) === 0 && rules.eliteBountyEscalation(91, 'none') === 0,
  'Free Expedition stays fully neutral at every depth');

const fx = rules.escalationEffects('oath', 91);
ok(Object.isFrozen(fx) && fx.contractId === 'oath' && fx.step === 9 && fx.monsterAtkMultiplier === 1.18 && fx.monsterXpMultiplier === 1.225,
  'escalationEffects returns one frozen coherent snapshot for core messaging');
ok(JSON.stringify(rules.escalationEffects('relic', 61)) === JSON.stringify(rules.escalationEffects('relic', 61)),
  'escalation policy is deterministic across repeated calls');

// Domain purity: the escalation owner must remain a pure policy module.
const rulesSrc = fs.readFileSync(path.join(root, 'game/domain/expedition/expedition-rules-v170.js'), 'utf8');
ok(!/localStorage|addEventListener|querySelector|document\.|Math\.random|Date\.now/.test(rulesSrc),
  'escalation policy adds no storage, input, DOM or RNG ownership to the domain module');


// ---------- 2. Runtime: core composes the policy ----------
const gradient = { addColorStop() {} };
function ctx() { return new Proxy({}, { get(_t, k) { if (k === 'canvas') return { width: 32, height: 32 }; if (typeof k === 'string' && k.startsWith('create')) return () => gradient; if (k === 'measureText') return () => ({ width: 10 }); return () => {}; }, set() { return true; } }); }
function elem(id) { return { id, innerHTML: '', textContent: '', disabled: false, title: '', style: {}, dataset: {}, hidden: false, getContext: () => ctx(), getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 600 }), focus() {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {}, setAttribute() {}, removeAttribute() {}, replaceChildren() {}, appendChild() {}, append() {}, querySelector: () => elem(id + '-child') }; }
const elements = new Map(), el = id => { if (!elements.has(id)) elements.set(id, elem(id)); return elements.get(id); };
global.document = { getElementById: id => el(id), createElement: t => t === 'canvas' ? { width: 0, height: 0, getContext: () => ctx(), toDataURL: () => '' } : elem('created'), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, documentElement: { dataset: {} } };
global.window = { innerWidth: 1280, innerHeight: 800, addEventListener() {}, dispatchEvent() {}, DE_PROFILES: {} };
global.localStorage = { _m: new Map(), getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }, setItem(k, v) { this._m.set(k, String(v)); }, removeItem(k) { this._m.delete(k); } };
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.Image = class { set src(_v) {} };
global.matchMedia = () => ({ matches: false }); global.performance = { now: () => Date.now() }; global.location = { search: '?profile=classic-100' };
for (const id of ['classic-10', 'classic-20', 'classic-30', 'classic-40', 'classic-50', 'classic-60', 'classic-100'])
  vm.runInThisContext(fs.readFileSync(path.join(root, 'profiles', id + '.profile.js'), 'utf8'), { filename: id });
for (const rel of ['game/domain/content/content-rules-v130.js', 'game/domain/inventory/equipment-rules-v130.js', 'game/domain/inventory/set-rules-v180.js', 'game/domain/economy/economy-rules-v130.js', 'game/domain/town/town-rules-v130.js', 'game/domain/town/town-growth-rules-v180.js', 'game/domain/expedition/expedition-rules-v170.js', 'game/domain/progression/progression-rules-v130.js', 'game/domain/combat/combat-rules-v130.js'])
  vm.runInThisContext(fs.readFileSync(path.join(root, rel), 'utf8'), { filename: rel });
vm.runInThisContext(fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8'), { filename: 'game/core/game.js' });
const T = window.DE_TEST;
ok(!!T, 'core exposes the DE_TEST runtime surface');

T.setGreedy(true); T.newGame('warrior'); T.departTown(1);
ok(T.state === 'playing' && T.greedy === true, 'greedy expedition departs from town at floor 1');

// Probe monster: no min/max band => depth scale stays 1, isolating the contract multiplier.
const probeBase = () => ({ id: 'esc-probe', name: 'Escalation Probe', color: '#999', x: 1, y: 1, fx: 1, fy: 1, hp: 100, maxHp: 100, atk: 100, def: 0, xp: 100, boss: false, midBoss: false, elite: false, boom: false, regen: false, enrage: false, armorBreak: false, traits: [] });
function probeAt(depth, contractId, seed) {
  T.depth = depth; T.player.contractId = contractId; T.setSeed(seed);
  return T.makeMonster(probeBase(), { x: 2, y: 2 });
}
const none1 = probeAt(1, 'none', 777), oath1 = probeAt(1, 'oath', 777);
const none91 = probeAt(91, 'none', 777), oath91 = probeAt(91, 'oath', 777);
ok(none1.elite === oath1.elite && none91.elite === oath91.elite && none1.elite === none91.elite,
  'same seed keeps the elite roll identical across contracts (only the policy multiplier differs)');
const expectedOath1 = Math.round(100 * (none1.elite ? T.runProfile.floorRules.eliteAtkMult : 1) * 1.12 * 1 * T.monsterThreatScale(1, none1.elite, false));
const expectedOath91 = Math.round(100 * (none91.elite ? T.runProfile.floorRules.eliteAtkMult : 1) * 1.12 * 1.18 * T.monsterThreatScale(91, none91.elite, false));
ok(oath1.atk === expectedOath1, 'core composes the flat oath multiplier exactly at floor 1');
ok(oath91.atk === expectedOath91, 'core composes flat x escalation oath multipliers at floor 91');
ok(oath91.atk / none91.atk > oath1.atk / none1.atk,
  'PLAYER DECISION: the Oath risk premium over contract-free grows with depth — pushing deeper is a real gamble, not a solved pick');
const expectedXp91 = Math.round(100 * (none91.elite ? 2 : 1) * 1.18 * 1.225);
ok(oath91.xp === expectedXp91, 'core composes the oath XP escalation into kill XP at floor 91');
ok(oath91.xp / Math.max(1, none91.xp) > oath1.xp / Math.max(1, none1.xp),
  'PLAYER DECISION: the Oath XP premium also grows with depth — risk and reward climb together');


// Elite Hunt bounty runtime: the same kill pays strictly more on the final segment.
function bountyAt(depth) {
  T.depth = depth; T.player.contractId = 'hunt'; T.setSeed(4242);
  T.player.gold = 0;
  const m = T.makeMonster(probeBase(), { x: 3, y: 3 }, { forceElite: true });
  m.xp = 0; T.monsters.push(m);
  const before = T.player.gold; T.killMonster(m);
  return T.player.gold - before;
}
const bounty1 = bountyAt(1), bounty91 = bountyAt(91);
ok(bounty1 === rules.eliteBounty(1, 'hunt') + rules.eliteBountyEscalation(1, 'hunt'), 'core pays the flat hunt bounty on floor 1');
ok(bounty91 === 126 && bounty91 > bounty1, 'core pays the escalated 126 G hunt bounty on floor 91 — deeper hunts are worth more');

// Relic Sweep trap runtime: the same seeded floor layout carries more traps when the contract is active.
function trapCount(contractId, depth, seed) {
  T.depth = depth; T.player.contractId = contractId; T.setSeed(seed);
  T.genLevel();
  return T.traps.length;
}
// The contract changes chest/event rolls too, so the base trap draw legitimately
// re-rolls between contracts; what must hold for every seed is the policy band:
// deep Relic Sweep always fields more traps than any contract-free floor can.
const trapsNone91 = trapCount('none', 91, 20260921), trapsRelic91 = trapCount('relic', 91, 20260921);
ok(trapsNone91 >= 2 && trapsNone91 <= 5, `contract-free floor 91 stays inside the authored 2-5 trap band (got ${trapsNone91})`);
ok(trapsRelic91 >= 2 + rules.trapBonus('relic') + rules.trapEscalation('relic', 91) && trapsRelic91 <= 5 + rules.trapBonus('relic') + rules.trapEscalation('relic', 91),
  `relic floor 91 carries the full policy surcharge band 6-9 (got ${trapsRelic91})`);
ok(trapsRelic91 > 5, 'PLAYER DECISION: a deep Relic Sweep floor always has more traps than any contract-free floor — loot greed costs real HP');
ok(trapCount('relic', 1, 20260921) - trapCount('none', 1, 20260921) === rules.trapBonus('relic'),
  'floor 1 keeps the original flat +1 trap surcharge (no early-game escalation)');

// Descent messaging: crossing a segment boundary under a contract warns about the new stakes.
T.depth = 10; T.player.contractId = 'oath'; T.setSeed(99); T.genLevel();
let stairs = null;
for (let y = 0; y < T.mapGrid.length && !stairs; y++)
  for (let x = 0; x < T.mapGrid[y].length && !stairs; x++)
    if (T.mapGrid[y][x] === 2) stairs = { x, y };
ok(!!stairs, 'floor 10 offers stairs for the segment-boundary descent probe');
if (stairs) {
  T.player.x = stairs.x; T.player.y = stairs.y;
  el('log').innerHTML = '';
  T.descend();
  ok(T.depth === 11, 'descent crosses into segment 2 (floor 11)');
  const mentions = () => (el('log').innerHTML.match(/誓约随深度收紧/g) || []).length;
  ok(mentions() === 1, 'crossing a segment boundary warns the player about the tightened Oath');
  // Re-descending inside the same segment must not re-announce.
  let stairs2 = null;
  for (let y = 0; y < T.mapGrid.length && !stairs2; y++)
    for (let x = 0; x < T.mapGrid[y].length && !stairs2; x++)
      if (T.mapGrid[y][x] === 2) stairs2 = { x, y };
  if (stairs2) { T.player.x = stairs2.x; T.player.y = stairs2.y; T.descend(); }
  ok(T.depth === 12 && mentions() === 1,
    'descending inside the same segment stays silent (no spam, message marks real decision points)');
}

// ---------- 3. Authority boundary ----------
const core = fs.readFileSync(path.join(root, 'game/core/game.js'), 'utf8');
ok(core.includes('EXPEDITION_RULES.monsterAtkEscalation(contractId, depth)'), 'core consumes oath ATK escalation from the expedition authority');
ok(core.includes('EXPEDITION_RULES.monsterXpEscalation(contractId, depth)'), 'core consumes oath XP escalation from the expedition authority');
ok(core.includes('EXPEDITION_RULES.trapEscalation(currentExpeditionContractId(), depth)'), 'core consumes relic trap escalation from the expedition authority');
ok(core.includes('EXPEDITION_RULES.namedRelicEscalation(currentExpeditionContractId(), d)'), 'core consumes relic named-chance escalation from the expedition authority');
ok(core.includes('EXPEDITION_RULES.eliteBountyEscalation(depth, currentExpeditionContractId())'), 'core consumes hunt bounty escalation from the expedition authority');
ok(core.includes('announceContractEscalation(prevDepth)'), 'core announces segment crossings through one bounded helper');
const authority = JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8'));
ok(authority.authorities.expeditionContractEscalationPolicy === 'game/domain/expedition/expedition-rules-v170.js',
  'authority map keeps contract escalation under the existing expedition policy owner (no second authority)');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
