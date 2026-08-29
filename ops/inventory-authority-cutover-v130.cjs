'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const CHECK = process.argv.includes('--check') || !APPLY;
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const write = (rel, text) => fs.writeFileSync(path.join(root, rel), text);
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

results.push(stage('game/domain/inventory/equipment-rules-v130.js', src => {
  let out = src;
  out = replaceLiteral(out,
`/* Dungeon Echo staged inventory rules v1.3.0.
 *
 * Extracted from the quarantined production equipment system as pure data/functions.
 * This file intentionally owns NO production state yet:
 * - no DE_TEST access;
 * - no DOM/event listeners;
 * - no storage writes;
 * - no profile mutation;
 * - not admitted by ops/release/static-files.txt.
 *
 * Atomic authority transfer will happen in a later PR only after game/core/game.js
 * relinquishes the corresponding calculation responsibility in the same change.
 */`,
`/* Dungeon Echo production inventory-derived-rules authority v1.3.0.
 *
 * Pure deterministic item/equipment calculations. The module owns derived inventory rules only;
 * live bag/equipment state, RNG, equip commands, rendering, persistence and economy transactions
 * remain with their current production owners.
 */`,
    'inventory rules header');
  out = replaceLiteral(out,
`  function classFitScore(stats, classId='warrior') {`,
`  function itemStatScore(stats) {
    const source = stats || {};
    return Math.round((Number(source.atk) || 0) * 3 + (Number(source.def) || 0) * 3 +
      (Number(source.hp) || 0) * .6 + (Number(source.crit) || 0) * 1.5 +
      (Number(source.leech) || 0) * 1.2 + (Number(source.gold) || 0) * .15 +
      (Number(source.thorns) || 0) * 2 + (Number(source.regen) || 0));
  }

  function classFitScore(stats, classId='warrior') {`,
    'inventory canonical stat score');
  out = replaceLiteral(out,
`    version:'v1.3.0-staged',
    authority:'none',
    source:'archive/quarantine-v130/gameplay/equipment/equipment-system.js',`,
`    version:'v1.3.0-production',
    authority:'inventory-derived-rules',
    sources:Object.freeze(['game/core/game.js']),`,
    'inventory production authority');
  out = replaceLiteral(out,
`    SLOT_BONUS,
    classFitScore,`,
`    SLOT_BONUS,
    itemStatScore,
    classFitScore,`,
    'inventory api stat score export');
  return out;
}));

results.push(stage('game/core/game.js', src => replaceLiteral(src,
`// 装备评分：全游戏唯一口径（生成、锻造重算共用）
const eqScoreOf = stats =>
  Math.round((stats.atk || 0) * 3 + (stats.def || 0) * 3 + (stats.hp || 0) * .6 +
             (stats.crit || 0) * 1.5 + (stats.leech || 0) * 1.2 + (stats.gold || 0) * .15 +
             (stats.thorns || 0) * 2 + (stats.regen || 0) * 1);`,
`// 装备评分：由唯一 inventory-derived-rules 权威提供；core 只消费结果。
const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null;
if (!INVENTORY_RULES || INVENTORY_RULES.authority !== 'inventory-derived-rules')
  throw new Error('Dungeon Echo inventory-derived-rules authority missing');
const eqScoreOf = stats => INVENTORY_RULES.itemStatScore(stats);`,
  'core inventory stat-score delegation')));

for (const rel of ['index.html', 'en/index.html']) {
  results.push(stage(rel, src => replaceLiteral(src,
`<script src="game/domain/content/content-rules-v130.js?v=169"></script>
<script src="game/core/game.js?v=169"></script>`,
`<script src="game/domain/content/content-rules-v130.js?v=169"></script>
<script src="game/domain/inventory/equipment-rules-v130.js?v=169"></script>
<script src="game/core/game.js?v=169"></script>`,
    `${rel} inventory script order`)));
}

results.push(stage('ops/release/static-files.txt', src => replaceLiteral(src,
`game/domain/content/content-rules-v130.js
game/core/game.js`,
`game/domain/content/content-rules-v130.js
game/domain/inventory/equipment-rules-v130.js
game/core/game.js`,
  'release allowlist inventory module')));

results.push(stage('docs/authority-map-v130.json', src => {
  const map = JSON.parse(src);
  const owner = map.authorities && map.authorities.inventoryDerivedRules;
  const staged = map.stagedPureLibraries && map.stagedPureLibraries.inventoryRules;
  if (owner && staged) throw new Error('authority map: mixed inventory staged/production state');
  if (owner && owner !== 'game/domain/inventory/equipment-rules-v130.js') throw new Error(`authority map: unexpected inventory owner ${owner}`);
  if (!owner && staged !== 'game/domain/inventory/equipment-rules-v130.js') throw new Error('authority map: expected staged inventory library');
  map.authorities.inventoryDerivedRules = 'game/domain/inventory/equipment-rules-v130.js';
  if (map.stagedPureLibraries) delete map.stagedPureLibraries.inventoryRules;
  return JSON.stringify(map, null, 2) + '\n';
}));

results.push(stage('docs/ARCHITECTURE_SINGLE_AUTHORITY.md', src => {
  let out = src;
  out = replaceLiteral(out,
`| Content classification | \`game/domain/content/content-rules-v130.js\` | supply deterministic eligibility decisions to core | spawn entities, consume RNG, mutate map/player/combat state |`,
`| Content classification | \`game/domain/content/content-rules-v130.js\` | supply deterministic eligibility decisions to core | spawn entities, consume RNG, mutate map/player/combat state |
| Inventory derived rules | \`game/domain/inventory/equipment-rules-v130.js\` | supply deterministic item/equipment calculations to core | mutate bag/equipment/player state, consume RNG, price or commit economy transactions |`,
    'architecture inventory authority row');
  out = replaceLiteral(out,
`The currently staged pure libraries are registered in \`docs/authority-map-v130.json\` and include inventory, economy, progression, town and combat rules. Content classification has completed its atomic authority transfer and is now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.`,
`The currently staged pure libraries are registered in \`docs/authority-map-v130.json\` and include economy, progression, town and combat rules. Content classification and inventory derived rules have completed their atomic authority transfers and are now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.`,
    'architecture staged shelf status');
  return out;
}));

results.push(stage('test/inventory-rules-v130.cjs', src => {
  let out = src;
  out = replaceLiteral(out,
`assert.equal(rules.authority, 'none');
assert.equal(rules.version, 'v1.3.0-staged');
assert.equal(rules.source, 'archive/quarantine-v130/gameplay/equipment/equipment-system.js');
assert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|fetch\\s*\\(/.test(executableSource), 'staged inventory rules must stay pure and disconnected');`,
`assert.equal(rules.authority, 'inventory-derived-rules');
assert.equal(rules.version, 'v1.3.0-production');
assert.deepEqual([...rules.sources], ['game/core/game.js']);
assert(!/DE_TEST|addEventListener|getContext\\s*\\(|localStorage|sessionStorage|fetch\\s*\\(|Math\\.random/.test(executableSource), 'production inventory rules must stay pure and deterministic');`,
    'inventory test authority');
  out = replaceLiteral(out,
`assert(!manifest.includes(rel), 'staged inventory rules must not enter the release allowlist before atomic authority transfer');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(!html.includes(rel), \`\${entry}: staged inventory rules must not be loaded in production\`);
}`,
`assert(manifest.includes(rel), 'production inventory rules must ship after atomic authority transfer');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(html.includes(\`\${rel}?v=169\`), \`\${entry}: production inventory rules must be loaded\`);
  assert(html.indexOf(\`\${rel}?v=169\`) < html.indexOf('game/core/game.js?v=169'), \`\${entry}: inventory authority must load before core\`);
}`,
    'inventory test production graph');
  out = replaceLiteral(out,
`const sample = { atk:10, def:5, hp:20, crit:4, leech:3, gold:10, thorns:2, regen:1 };`,
`const sample = { atk:10, def:5, hp:20, crit:4, leech:3, gold:10, thorns:2, regen:1 };
assert.equal(rules.itemStatScore(sample), 73);
assert.equal(rules.itemStatScore({ atk:2, def:3, hp:11, crit:1, leech:2, gold:7, thorns:4, regen:5 }), 40);`,
    'inventory stat score behavior tests');
  return out;
}));

results.push(stage('test/entry-authority-v130.cjs', src => replaceLiteral(src,
`  'game/domain/content/content-rules-v130.js?v=169',
  'game/core/game.js?v=169',`,
`  'game/domain/content/content-rules-v130.js?v=169',
  'game/domain/inventory/equipment-rules-v130.js?v=169',
  'game/core/game.js?v=169',`,
  'entry authority inventory script')));

results.push(stage('test/single-authority-v130.cjs', src => {
  let out = src;
  out = replaceLiteral(out,
`assert.equal(authority.authorities.contentClassification, 'game/domain/content/content-rules-v130.js');
assert.equal(authority.authorities.canvasRendering, 'game/core/game.js');`,
`assert.equal(authority.authorities.contentClassification, 'game/domain/content/content-rules-v130.js');
assert.equal(authority.authorities.inventoryDerivedRules, 'game/domain/inventory/equipment-rules-v130.js');
assert.equal(authority.authorities.canvasRendering, 'game/core/game.js');`,
    'single authority inventory owner assertion');
  out = replaceLiteral(out,
`assert(!game.includes('REST_FLOORS.includes(depth)'), 'core still duplicates rest-floor classification');`,
`assert(!game.includes('REST_FLOORS.includes(depth)'), 'core still duplicates rest-floor classification');
assert(!game.includes('Math.round((stats.atk || 0) * 3'), 'core still duplicates inventory stat-score formula');`,
    'single authority duplicate inventory rejection');
  out = replaceLiteral(out,
`  "const CONTENT_RULES = typeof window !== 'undefined' ? window.DE_CONTENT_RULES_V130 : null",
  "document.addEventListener('keydown'",`,
`  "const CONTENT_RULES = typeof window !== 'undefined' ? window.DE_CONTENT_RULES_V130 : null",
  "const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null",
  "document.addEventListener('keydown'",`,
    'single authority inventory delegation token');
  out = replaceLiteral(out,
`  'game/domain/content/content-rules-v130.js',
  'art/hero-atlas-v11.png'`,
`  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js',
  'art/hero-atlas-v11.png'`,
    'single authority canonical inventory source');
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
  console.log(`inventory_authority_cutover_preflight=PASS files=${results.length} would_change=${changed.length}`);
  for (const rel of changed) console.log(`would_change=${rel}`);
} else {
  console.log(`inventory_authority_cutover=PASS changed=${changed.length}`);
  for (const rel of changed) console.log(`changed=${rel}`);
}
