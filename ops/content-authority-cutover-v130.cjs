'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const CHECK = process.argv.includes('--check') || !APPLY;

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, text) { fs.writeFileSync(path.join(root, rel), text); }
function countLiteral(text, needle) { return text.split(needle).length - 1; }
function replaceLiteral(text, before, after, label) {
  if (text.includes(after)) {
    if (text.includes(before)) throw new Error(`${label}: mixed pre/post-cutover state`);
    return text;
  }
  const n = countLiteral(text, before);
  if (n !== 1) throw new Error(`${label}: expected exactly one pre-cutover match, found ${n}`);
  return text.replace(before, after);
}
function replaceRegex(text, re, after, label) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const probe = new RegExp(re.source, flags);
  const hits = [...text.matchAll(probe)];
  if (hits.length === 0 && text.includes(after)) return text;
  if (hits.length !== 1) throw new Error(`${label}: expected exactly one regex match, found ${hits.length}`);
  return text.replace(re, after);
}
function stage(rel, fn) {
  const before = read(rel);
  const after = fn(before);
  if (APPLY && after !== before) write(rel, after);
  return { rel, changed: after !== before, after };
}

const results = [];

results.push(stage('game/domain/content/content-rules-v130.js', src => {
  let out = src;
  out = replaceLiteral(out,
    '/* Dungeon Echo staged content-selection rules v1.3.0.\n *\n * Pure floor/content classification extracted from the canonical core and quarantined\n * content work. This library owns NO production authority yet and is not shipped.\n *\n * Boundary rule: content may answer "what is eligible on this floor"; it must not spawn,\n * mutate runtime state, consume RNG, touch the DOM, write storage or apply combat effects.\n */',
    '/* Dungeon Echo production content-classification authority v1.3.0.\n *\n * Pure floor/content classification extracted from the canonical core. This module is\n * shipped before game.js and is the sole production owner of deterministic floor eligibility.\n *\n * Boundary rule: content may answer "what is eligible on this floor"; it must not spawn,\n * mutate runtime state, consume RNG, touch the DOM, write storage or apply combat effects.\n */',
    'content rules header');
  out = replaceLiteral(out, "    version: 'v1.3.0-staged',\n    authority: 'none',", "    version: 'v1.3.0-production',\n    authority: 'content-classification',", 'content rules authority');
  out = replaceLiteral(out,
    "    sources: Object.freeze([\n      'game/core/game.js',\n      'archive/quarantine-v130/gameplay/content-risk/content-system.js',\n    ]),",
    "    sources: Object.freeze([\n      'game/core/game.js',\n    ]),",
    'content rules production provenance');
  return out;
}));

results.push(stage('game/core/game.js', src => {
  let out = src;
  out = replaceLiteral(out,
    "const ENDLESS_AFTER = !!(RUN_PROFILE.floorRules && RUN_PROFILE.floorRules.endlessAfter);\nconst themeIdx = d => Math.min(THEMES.length - 1,\n  Math.floor((Math.max(1, d) - 1) / RUN_PROFILE.floorRules.themeBandSize));",
    "const ENDLESS_AFTER = !!(RUN_PROFILE.floorRules && RUN_PROFILE.floorRules.endlessAfter);\nconst CONTENT_RULES = typeof window !== 'undefined' ? window.DE_CONTENT_RULES_V130 : null;\nif (!CONTENT_RULES || CONTENT_RULES.authority !== 'content-classification')\n  throw new Error('Dungeon Echo content-classification authority missing');\nconst themeIdx = d => CONTENT_RULES.themeIndex(d, THEMES.length, RUN_PROFILE.floorRules.themeBandSize);",
    'core content authority binding');

  out = replaceLiteral(out,
    "const classDef = () => CLASSES[classId] || CLASSES.warrior;\nconst isFinalFloor = () => !player.echoMode && depth >= MAX_DEPTH;\nconst canDescendNow = () => player.echoMode || depth < MAX_DEPTH;\n\nfunction monsterPoolFor(d) {\n  const pool = MONSTERS.filter(m => d >= m.min && d <= m.max);\n  if (pool.length) return pool;\n  let best = MONSTERS[0], bestDist = Infinity;\n  for (const m of MONSTERS) {\n    const mid = (m.min + m.max) / 2;\n    const dist = Math.abs(mid - d);\n    if (dist < bestDist) { best = m; bestDist = dist; }\n  }\n  return [best];\n}",
    "const classDef = () => CLASSES[classId] || CLASSES.warrior;\nconst echoModeNow = () => !!(player && player.echoMode);\nconst isFinalFloor = () => CONTENT_RULES.isFinalFloor(depth, MAX_DEPTH, echoModeNow());\nconst canDescendNow = () => CONTENT_RULES.canDescend(depth, MAX_DEPTH, echoModeNow());\nconst monsterPoolFor = d => CONTENT_RULES.monsterPool(MONSTERS, d);",
    'core floor/pool delegation');

  out = replaceLiteral(out,
    "  const want = Math.min(\n    Math.max(FR.baseMonsterCount + depth * FR.monsterPerDepth, FR.minMonsters || 5),\n    FR.maxMonsters\n  );",
    "  const want = CONTENT_RULES.desiredMonsterCount(depth, FR);",
    'core monster target delegation');

  out = replaceLiteral(out,
    "  for (const mb of MID_BOSSES) {\n    if (depth !== mb.depth || (player && player.echoMode)) continue;",
    "  for (const mb of CONTENT_RULES.midBossesAtDepth(MID_BOSSES, depth, echoModeNow())) {",
    'core mid-boss delegation');

  out = replaceLiteral(out,
    "  } else if (player && player.echoMode && depth > MAX_DEPTH && depth % 5 === 0) {",
    "  } else if (CONTENT_RULES.echoGuardianFloor(depth, MAX_DEPTH, echoModeNow())) {",
    'core echo-guardian delegation');

  out = replaceLiteral(out,
    "  const onShopFloor = SHOP_FLOORS.includes(depth) ||\n    (player && player.echoMode && depth > MAX_DEPTH && depth % 4 === 0);\n  if (!onShopFloor) return;",
    "  if (!CONTENT_RULES.isShopFloor(depth, SHOP_FLOORS, MAX_DEPTH, echoModeNow())) return;",
    'core shop-floor delegation');

  out = replaceLiteral(out,
    "  if (!REST_FLOORS.includes(depth) && !(player && player.echoMode && depth > MAX_DEPTH && depth % 10 === 5)) return;",
    "  if (!CONTENT_RULES.isRestFloor(depth, REST_FLOORS, MAX_DEPTH, echoModeNow())) return;",
    'core rest-floor delegation');
  return out;
}));

for (const rel of ['index.html', 'en/index.html']) {
  results.push(stage(rel, src => replaceLiteral(src,
    '<script src="game/locale/locale-data-v134.js?v=169"></script>\n<script src="game/core/game.js?v=169"></script>',
    '<script src="game/locale/locale-data-v134.js?v=169"></script>\n<script src="game/domain/content/content-rules-v130.js?v=169"></script>\n<script src="game/core/game.js?v=169"></script>',
    `${rel} content script order`)));
}

results.push(stage('ops/release/static-files.txt', src => replaceLiteral(src,
  'game/locale/locale-data-v134.js\ngame/core/game.js',
  'game/locale/locale-data-v134.js\ngame/domain/content/content-rules-v130.js\ngame/core/game.js',
  'release allowlist content module')));

results.push(stage('docs/authority-map-v130.json', src => {
  const map = JSON.parse(src);
  map.authorities.contentClassification = 'game/domain/content/content-rules-v130.js';
  if (map.stagedPureLibraries) delete map.stagedPureLibraries.contentRules;
  return JSON.stringify(map, null, 2) + '\n';
}));

results.push(stage('docs/ARCHITECTURE_SINGLE_AUTHORITY.md', src => {
  let out = src;
  out = replaceLiteral(out,
    '| Gameplay state / turn flow | `game/core/game.js` | read exported test/debug state | assign state, wrap turn/combat functions |',
    '| Gameplay state / turn flow | `game/core/game.js` | read exported test/debug state | assign state, wrap turn/combat functions |\n| Content classification | `game/domain/content/content-rules-v130.js` | supply deterministic eligibility decisions to core | spawn entities, consume RNG, mutate map/player/combat state |',
    'architecture authority table');
  out = replaceLiteral(out,
    'The currently re-housed pure libraries are registered in `docs/authority-map-v130.json` and include inventory, economy, progression, content, town and combat rules. Each must remain absent from the release allowlist and both production entries until an atomic authority transfer is deliberately performed.',
    'The currently staged pure libraries are registered in `docs/authority-map-v130.json` and include inventory, economy, progression, town and combat rules. Content classification has completed its atomic authority transfer and is now active production. Remaining staged libraries must stay absent from the release allowlist and both production entries until their own transfer is deliberately performed.',
    'architecture staged shelf status');
  return out;
}));

results.push(stage('test/content-rules-v130.cjs', src => {
  let out = src;
  out = replaceLiteral(out, "assert.equal(rules.authority, 'none');\nassert.equal(rules.version, 'v1.3.0-staged');", "assert.equal(rules.authority, 'content-classification');\nassert.equal(rules.version, 'v1.3.0-production');", 'content test authority');
  out = replaceLiteral(out,
    "assert(!manifest.includes(rel), 'staged content rules must not enter release before atomic authority transfer');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(!html.includes(rel), `${entry}: staged content rules must not be loaded in production`);\n}",
    "assert(manifest.includes(rel), 'production content rules must ship after atomic authority transfer');\nfor (const entry of ['index.html', 'en/index.html']) {\n  const html = fs.readFileSync(path.join(root, entry), 'utf8');\n  assert(html.includes(`${rel}?v=169`), `${entry}: production content rules must be loaded`);\n  assert(html.indexOf(`${rel}?v=169`) < html.indexOf('game/core/game.js?v=169'), `${entry}: content authority must load before core`);\n}",
    'content test production graph');
  out = out.replace('staged content rules must stay pure, deterministic and disconnected', 'production content rules must stay pure and deterministic');
  return out;
}));

results.push(stage('test/entry-authority-v130.cjs', src => replaceLiteral(src,
  "  'game/locale/locale-data-v134.js?v=169',\n  'game/core/game.js?v=169',",
  "  'game/locale/locale-data-v134.js?v=169',\n  'game/domain/content/content-rules-v130.js?v=169',\n  'game/core/game.js?v=169',",
  'entry authority expected scripts')));

results.push(stage('test/single-authority-v130.cjs', src => {
  let out = src;
  out = replaceLiteral(out,
    "assert.equal(authority.authorities.gameplayState, 'game/core/game.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",
    "assert.equal(authority.authorities.gameplayState, 'game/core/game.js');\nassert.equal(authority.authorities.contentClassification, 'game/domain/content/content-rules-v130.js');\nassert.equal(authority.authorities.canvasRendering, 'game/core/game.js');",
    'single authority content owner assertion');
  out = replaceLiteral(out,
    "  \"const ctx = canvas.getContext('2d')\",\n  \"document.addEventListener('keydown'\",",
    "  \"const ctx = canvas.getContext('2d')\",\n  \"const CONTENT_RULES = typeof window !== 'undefined' ? window.DE_CONTENT_RULES_V130 : null\",\n  \"document.addEventListener('keydown'\",",
    'single authority core delegation token');
  out = replaceLiteral(out,
    "  'game/core/game.js','game/core/production-bootstrap.js','game/core/runtime-bootstrap.js',",
    "  'game/core/game.js','game/core/production-bootstrap.js','game/core/runtime-bootstrap.js',\n  'game/domain/content/content-rules-v130.js',",
    'single authority canonical source list');
  const anchor = "assert(!/DE_TEST/.test(gamepad), 'gamepad must not call gameplay API directly');";
  const extra = `${anchor}\nassert(!game.includes('const isFinalFloor = () => !player.echoMode && depth >= MAX_DEPTH'), 'core still duplicates final-floor classification');\nassert(!game.includes('const pool = MONSTERS.filter(m => d >= m.min && d <= m.max)'), 'core still duplicates monster-pool classification');\nassert(!game.includes('SHOP_FLOORS.includes(depth)'), 'core still duplicates shop-floor classification');\nassert(!game.includes('REST_FLOORS.includes(depth)'), 'core still duplicates rest-floor classification');`;
  out = replaceLiteral(out, anchor, extra, 'single authority duplicate-content rejection');
  return out;
}));

const changed = results.filter(r => r.changed).map(r => r.rel);
if (CHECK && !APPLY) {
  console.log(`content_authority_cutover_preflight=PASS files=${results.length} would_change=${changed.length}`);
  for (const rel of changed) console.log(`would_change=${rel}`);
} else {
  console.log(`content_authority_cutover=PASS changed=${changed.length}`);
  for (const rel of changed) console.log(`changed=${rel}`);
}
