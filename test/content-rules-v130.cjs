'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const generation = String(JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8')).cacheGeneration);
const rel = 'game/domain/content/content-rules-v130.js';
const source = fs.readFileSync(path.join(root, rel), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
const rules = require(path.join(root, rel));

assert.equal(rules.authority, 'content-classification');
assert.equal(rules.version, 'v1.3.0-production');
assert(!/DE_TEST|addEventListener|getContext\s*\(|localStorage|sessionStorage|document\b|fetch\s*\(|Math\.random/.test(executableSource), 'production content rules must stay pure and deterministic');

const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8')
  .split(/\r?\n/).filter(Boolean);
assert(manifest.includes(rel), 'production content rules must ship after atomic authority transfer');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(html.includes(`${rel}?v=${generation}`), `${entry}: production content rules must be loaded`);
  assert(html.indexOf(`${rel}?v=${generation}`) < html.indexOf(`game/core/game.js?v=${generation}`), `${entry}: content authority must load before core`);
}

assert.equal(rules.themeIndex(1, 10, 10), 0);
assert.equal(rules.themeIndex(10, 10, 10), 0);
assert.equal(rules.themeIndex(11, 10, 10), 1);
assert.equal(rules.themeIndex(100, 10, 10), 9);

const monsters = [
  { id:'rat', min:1, max:5 },
  { id:'orc', min:6, max:10 },
  { id:'void', min:20, max:30 },
];
assert.deepEqual(rules.monsterPool(monsters, 3).map(m => m.id), ['rat']);
assert.deepEqual(rules.monsterPool(monsters, 8).map(m => m.id), ['orc']);
assert.deepEqual(rules.monsterPool(monsters, 15).map(m => m.id), ['orc']);
assert.deepEqual(rules.monsterPool([], 10), []);

assert.equal(rules.desiredMonsterCount(1, { baseMonsterCount:4, monsterPerDepth:1, minMonsters:5, maxMonsters:12 }), 5);
assert.equal(rules.desiredMonsterCount(4, { baseMonsterCount:4, monsterPerDepth:1, minMonsters:5, maxMonsters:12 }), 8);
assert.equal(rules.desiredMonsterCount(20, { baseMonsterCount:4, monsterPerDepth:1, minMonsters:5, maxMonsters:12 }), 12);

assert.equal(rules.isFinalFloor(100, 100, false), true);
assert.equal(rules.isFinalFloor(100, 100, true), false);
assert.equal(rules.canDescend(99, 100, false), true);
assert.equal(rules.canDescend(100, 100, false), false);
assert.equal(rules.canDescend(140, 100, true), true);

assert.deepEqual(rules.midBossesAtDepth([{ depth:20, id:'a' }, { depth:40, id:'b' }], 40, false).map(b => b.id), ['b']);
assert.deepEqual(rules.midBossesAtDepth([{ depth:40, id:'b' }], 40, true), []);
assert.equal(rules.isShopFloor(20, [20, 40], 100, false), true);
assert.equal(rules.isShopFloor(104, [], 100, true), true);
assert.equal(rules.isRestFloor(115, [], 100, true), true);
assert.equal(rules.echoGuardianFloor(105, 100, true), true);
assert.equal(rules.echoGuardianFloor(105, 100, false), false);

console.log('content_rules_v130=PASS');
