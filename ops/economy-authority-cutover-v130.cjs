'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const CHECK = process.argv.includes('--check') || !APPLY;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const write = (rel, text) => fs.writeFileSync(path.join(root, rel), text);
const L = rows => rows.join('\n');
const countLiteral = (text, needle) => text.split(needle).length - 1;

function replaceLiteral(text, before, after, label) {
  if (text.includes(after)) {
    const residue = text.replace(after, '');
    if (residue.includes(before)) throw new Error(`${label}: mixed pre/post-cutover state`);
    return text;
  }
  const n = countLiteral(text, before);
  if (n !== 1) throw new Error(`${label}: expected exactly one pre-cutover match, found ${n}`);
  return text.replace(before, after);
}
function stage(rel, fn) {
  const before = read(rel);
  const after = fn(before);
  return { rel, before, after, changed: after !== before };
}

const results = [];

results.push(stage('game/domain/economy/economy-rules-v130.js', src => {
  let out = src;
  out = replaceLiteral(out,
    L([
      '/* Dungeon Echo staged economy rules v1.3.0.',
      ' *',
      ' * Pure calculations extracted from the canonical core and quarantined commerce work.',
      ' * This library owns NO production authority yet and is intentionally not shipped.',
      ' *',
      ' * Boundary rule: inventory/equipment decides an item\'s value score; economy only turns',
      ' * that value into prices/costs. No duplicated equipment scoring lives here.',
      ' */',
    ]),
    L([
      '/* Dungeon Echo production economy-pricing-rules authority v1.3.0.',
      ' *',
      ' * Pure deterministic quote/cost calculations. Inventory/core supplies item-value inputs;',
      ' * core remains the owner of gold, stock, purchases, forge results, wheel lifecycle, RNG,',
      ' * rendering and persistence. Future dynamic town/heal helpers remain unadopted by core.',
      ' */',
    ]),
    'economy rules header');

  out = replaceLiteral(out,
    L([
      '  function forgeCost(itemValue, forgeLevel=0) {',
      '    const value = Math.max(0, Number(itemValue) || 0);',
      '    const level = nonNegativeInt(forgeLevel);',
      '    return 30 + Math.round(value * 1.2) * (level + 1);',
      '  }',
      '',
      '  function sellPrice(itemValue, forgeLevel=0) {',
      '    const value = Math.max(0, Number(itemValue) || 0);',
      '    const level = nonNegativeInt(forgeLevel);',
      '    return Math.max(4, Math.round(value * 0.45) + level * 15);',
      '  }',
      '',
      '  function quickDiveCost(fromDepth, floors) {',
      '    const count = nonNegativeInt(floors);',
      '    const depth = Math.max(1, Math.floor(Number(fromDepth) || 1));',
      '    return count * (8 + depth * 4);',
      '  }',
      '',
      '  function wheelSpinCost(spins=0) {',
      '    return 40 + nonNegativeInt(spins) * 20;',
      '  }',
      '',
      '  function wheelResetCost(resets=0) {',
      '    return 60 + nonNegativeInt(resets) * 40;',
      '  }',
    ]),
    L([
      '  function forgeCost(itemValue, forgeLevel=0) {',
      '    return 30 + Math.round(itemValue * 1.2) * ((forgeLevel || 0) + 1);',
      '  }',
      '',
      '  function sellPrice(itemValue, forgeLevel=0) {',
      '    return Math.max(4, Math.round(itemValue * 0.45) + (forgeLevel || 0) * 15);',
      '  }',
      '',
      '  function quickDiveCost(fromDepth, n) {',
      '    const floors = Math.max(0, Math.floor(n) || 0);',
      '    return floors * (8 + Math.max(1, Math.floor(fromDepth)) * 4);',
      '  }',
      '',
      '  function wheelSpinCost(spins=0) {',
      '    return 40 + (spins || 0) * 20;',
      '  }',
      '',
      '  function wheelResetCost(resets=0) {',
      '    return 60 + (resets || 0) * 40;',
      '  }',
    ]),
    'economy canonical pricing formulas');

  out = replaceLiteral(out,
    L([
      "    version:'v1.3.0-staged',",
      "    authority:'none',",
      '    sources:Object.freeze([',
      "      'game/core/game.js',",
      "      'archive/quarantine-v130/gameplay/economy/commerce-system.js',",
      '    ]),',
    ]),
    L([
      "    version:'v1.3.0-production',",
      "    authority:'economy-pricing-rules',",
      "    sources:Object.freeze(['game/core/game.js']),",
    ]),
    'economy production authority');
  return out;
}));

results.push(stage('game/core/game.js', src => {
  let out = src;
  out = replaceLiteral(out,
    L([
      'const forgeCost = it => 30 + Math.round(itemValueScore(it) * 1.2) * ((it.forge || 0) + 1);',
      'const sellPrice = it => Math.max(4, Math.round(itemValueScore(it) * .45) + (it.forge || 0) * 15);',
    ]),
    L([
      "const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null;",
      "if (!ECONOMY_RULES || ECONOMY_RULES.authority !== 'economy-pricing-rules')",
      "  throw new Error('Dungeon Echo economy-pricing-rules authority missing');",
      'const forgeCost = it => ECONOMY_RULES.forgeCost(itemValueScore(it), it && it.forge || 0);',
      'const sellPrice = it => ECONOMY_RULES.sellPrice(itemValueScore(it), it && it.forge || 0);',
    ]),
    'core forge/sell quote delegation');
  out = replaceLiteral(out,
    L([
      'function quickDiveCost(fromDepth, n) {',
      '  const floors = Math.max(0, Math.floor(n) || 0);',
      '  return floors * (8 + Math.max(1, Math.floor(fromDepth)) * 4);',
      '}',
    ]),
    'const quickDiveCost = (fromDepth, n) => ECONOMY_RULES.quickDiveCost(fromDepth, n);',
    'core quick-dive quote delegation');
  out = replaceLiteral(out,
    L([
      'const WHEEL_SLOTS = 8;',
      'const WHEEL_BASE_SPIN = 40, WHEEL_SPIN_STEP = 20;',
      'const WHEEL_BASE_RESET = 60, WHEEL_RESET_STEP = 40;',
      "const wheelDepth = () => Math.max(3, meta ? (meta.bestDepth || 0) : 0);",
      'const spinCost = () => WHEEL_BASE_SPIN + (meta && meta.wheelSpins || 0) * WHEEL_SPIN_STEP;',
      'const resetWheelCost = () => WHEEL_BASE_RESET + (meta && meta.wheelResets || 0) * WHEEL_RESET_STEP;',
    ]),
    L([
      'const WHEEL_SLOTS = 8;',
      "const wheelDepth = () => Math.max(3, meta ? (meta.bestDepth || 0) : 0);",
      'const spinCost = () => ECONOMY_RULES.wheelSpinCost(meta && meta.wheelSpins || 0);',
      'const resetWheelCost = () => ECONOMY_RULES.wheelResetCost(meta && meta.wheelResets || 0);',
    ]),
    'core wheel quote delegation');
  return out;
}));

for (const rel of ['index.html', 'en/index.html']) {
  results.push(stage(rel, src => replaceLiteral(src,
    L([
      '<script src="game/domain/inventory/equipment-rules-v130.js?v=169"></script>',
      '<script src="game/core/game.js?v=169"></script>',
    ]),
    L([
      '<script src="game/domain/inventory/equipment-rules-v130.js?v=169"></script>',
      '<script src="game/domain/economy/economy-rules-v130.js?v=169"></script>',
      '<script src="game/core/game.js?v=169"></script>',
    ]),
    `${rel} economy script order`)));
}

results.push(stage('ops/release/static-files.txt', src => replaceLiteral(src,
  L(['game/domain/inventory/equipment-rules-v130.js', 'game/core/game.js']),
  L(['game/domain/inventory/equipment-rules-v130.js', 'game/domain/economy/economy-rules-v130.js', 'game/core/game.js']),
  'release allowlist economy module')));

results.push(stage('docs/authority-map-v130.json', src => {
  const map = JSON.parse(src);
  const owner = map.authorities && map.authorities.economyPricingRules;
  const staged = map.stagedPureLibraries && map.stagedPureLibraries.economyRules;
  if (owner && staged) throw new Error('authority map: mixed economy staged/production state');
  if (owner && owner !== 'game/domain/economy/economy-rules-v130.js') throw new Error(`authority map: unexpected economy owner ${owner}`);
  if (!owner && staged !== 'game/domain/economy/economy-rules-v130.js') throw new Error('authority map: expected staged economy library');
  map.authorities.economyPricingRules = 'game/domain/economy/economy-rules-v130.js';
  if (map.stagedPureLibraries) delete map.stagedPureLibraries.economyRules;
  return JSON.stringify(map, null, 2) + '\n';
}));

results.push(stage('docs/ARCHITECTURE_SINGLE_AUTHORITY.md', src => {
  let out = src;
  out = replaceLiteral(out,
    '| Equipment stat scoring | `game/domain/inventory/equipment-rules-v130.js` | return the canonical deterministic equipment stat score to core | mutate bag/equipment/player state, consume RNG, generate loot, alter class-fit/rarity/depth rules, or price economy transactions |',
    L([
      '| Equipment stat scoring | `game/domain/inventory/equipment-rules-v130.js` | return the canonical deterministic equipment stat score to core | mutate bag/equipment/player state, consume RNG, generate loot, alter class-fit/rarity/depth rules, or price economy transactions |',
      '| Economy pricing rules | `game/domain/economy/economy-rules-v130.js` | supply deterministic forge/sell/dive/wheel quotes to core | mutate gold/stock/items/wheel state, consume RNG, commit transactions |',
    ]),
    'architecture economy authority row');
  out = replaceLiteral(out,
    'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include economy, progression, town and combat rules. Content classification and equipment stat scoring have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.',
    'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include progression, town and combat rules. Content classification, equipment stat scoring and economy pricing rules have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.',
    'architecture staged shelf status');
  return out;
}));

results.push(stage('test/economy-rules-v130.cjs', src => {
  let out = src;
  out = replaceLiteral(out,
    L([
      "assert.equal(rules.authority, 'none');",
      "assert.equal(rules.version, 'v1.3.0-staged');",
      "assert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b/.test(executableSource), 'staged economy rules must stay pure and disconnected');",
    ]),
    L([
      "assert.equal(rules.authority, 'economy-pricing-rules');",
      "assert.equal(rules.version, 'v1.3.0-production');",
      "assert.deepEqual([...rules.sources], ['game/core/game.js']);",
      "assert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|document\\b|Math\\.random|fetch\\s*\\(/.test(executableSource), 'production economy rules must stay pure and deterministic');",
    ]),
    'economy test authority');
  out = replaceLiteral(out,
    L([
      "assert(!manifest.includes(rel), 'staged economy rules must not enter release before atomic authority transfer');",
      "for (const entry of ['index.html', 'en/index.html']) {",
      "  const html = fs.readFileSync(path.join(root, entry), 'utf8');",
      '  assert(!html.includes(rel), `${entry}: staged economy rules must not be loaded in production`);',
      '}',
    ]),
    L([
      "assert(manifest.includes(rel), 'production economy rules must ship after atomic authority transfer');",
      "for (const entry of ['index.html', 'en/index.html']) {",
      "  const html = fs.readFileSync(path.join(root, entry), 'utf8');",
      '  assert(html.includes(`${rel}?v=169`), `${entry}: production economy rules must be loaded`);',
      "  assert(html.indexOf(`${rel}?v=169`) < html.indexOf('game/core/game.js?v=169'), `${entry}: economy authority must load before core`);",
      '}',
    ]),
    'economy test production graph');
  return out;
}));

results.push(stage('test/entry-authority-v130.cjs', src => replaceLiteral(src,
  L([
    "  'game/domain/inventory/equipment-rules-v130.js?v=169',",
    "  'game/core/game.js?v=169',",
  ]),
  L([
    "  'game/domain/inventory/equipment-rules-v130.js?v=169',",
    "  'game/domain/economy/economy-rules-v130.js?v=169',",
    "  'game/core/game.js?v=169',",
  ]),
  'entry authority economy script')));

results.push(stage('test/single-authority-v130.cjs', src => {
  let out = src;
  out = replaceLiteral(out,
    "assert.equal(authority.authorities.equipmentStatScoring, 'game/domain/inventory/equipment-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",
    "assert.equal(authority.authorities.equipmentStatScoring, 'game/domain/inventory/equipment-rules-v130.js');\nassert.equal(authority.authorities.economyPricingRules, 'game/domain/economy/economy-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",
    'single authority economy owner assertion');
  out = replaceLiteral(out,
    "assert(!game.includes('Math.round((stats.atk || 0) * 3'), 'core still duplicates inventory stat-score formula');",
    L([
      "assert(!game.includes('Math.round((stats.atk || 0) * 3'), 'core still duplicates inventory stat-score formula');",
      "assert(!game.includes('30 + Math.round(itemValueScore(it) * 1.2)'), 'core still duplicates forge quote formula');",
      "assert(!game.includes('Math.round(itemValueScore(it) * .45)'), 'core still duplicates sell quote formula');",
      "assert(!game.includes('floors * (8 + Math.max(1, Math.floor(fromDepth)) * 4)'), 'core still duplicates quick-dive quote formula');",
      "assert(!game.includes('WHEEL_BASE_SPIN'), 'core still duplicates wheel spin quote constants');",
      "assert(!game.includes('WHEEL_BASE_RESET'), 'core still duplicates wheel reset quote constants');",
    ]),
    'single authority duplicate economy rejection');
  out = replaceLiteral(out,
    L([
      '  "const INVENTORY_RULES = typeof window !== \'undefined\' ? window.DE_INVENTORY_RULES_V130 : null",',
      '  "document.addEventListener(\'keydown\'",',
    ]),
    L([
      '  "const INVENTORY_RULES = typeof window !== \'undefined\' ? window.DE_INVENTORY_RULES_V130 : null",',
      '  "const ECONOMY_RULES = typeof window !== \'undefined\' ? window.DE_ECONOMY_RULES_V130 : null",',
      '  "document.addEventListener(\'keydown\'",',
    ]),
    'single authority economy delegation token');
  out = replaceLiteral(out,
    "  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js',\n  'art/hero-atlas-v11.png'",
    "  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/economy/economy-rules-v130.js',\n  'art/hero-atlas-v11.png'",
    'single authority canonical economy source');
  return out;
}));



const changed = results.filter(r => r.changed).map(r => r.rel);
if (APPLY && changed.length) {
  const written = [];
  try {
    for (const result of results) {
      if (!result.changed) continue;
      write(result.rel, result.after);
      written.push(result);
    }
  } catch (error) {
    for (const result of written.reverse()) {
      try { write(result.rel, result.before); } catch (_) {}
    }
    throw error;
  }
}

if (CHECK && !APPLY) {
  console.log(`economy_authority_cutover_preflight=PASS files=${results.length} would_change=${changed.length}`);
  for (const rel of changed) console.log(`would_change=${rel}`);
} else {
  console.log(`economy_authority_cutover=PASS changed=${changed.length}`);
  for (const rel of changed) console.log(`changed=${rel}`);
}
