'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const generation = String(JSON.parse(fs.readFileSync(path.join(root, 'docs/authority-map-v130.json'), 'utf8')).cacheGeneration);
const rel = 'game/domain/economy/economy-rules-v130.js';
const source = fs.readFileSync(path.join(root, rel), 'utf8');
const executableSource = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
const rules = require(path.join(root, rel));

assert.equal(rules.authority, 'equipment-transaction-pricing');
assert.equal(rules.version, 'v1.3.0-production');
assert.deepEqual([...rules.sources], ['game/core/game.js']);
assert(!/DE_TEST|addEventListener|getContext\s*\(|localStorage|sessionStorage|document\b|Math\.random/.test(executableSource), 'production economy pricing rules must stay pure and deterministic');

const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8')
  .split(/\r?\n/).filter(Boolean);
assert(manifest.includes(rel), 'production economy pricing rules must ship');
for (const entry of ['index.html', 'en/index.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(html.includes(`${rel}?v=${generation}`), `${entry}: economy pricing authority must be loaded`);
  assert(html.indexOf(`${rel}?v=${generation}`) < html.indexOf(`game/core/game.js?v=${generation}`), `${entry}: economy pricing authority must load before core`);
}

assert.equal(rules.townTier(1), 1);
assert.equal(rules.townTier(10), 1);
assert.equal(rules.townTier(11), 2);
assert.equal(rules.townTier(100), 10);
assert.equal(rules.townPriceScale(1), 1);
assert(Math.abs(rules.townPriceScale(2) - 1.485) < 1e-12);
assert.equal(rules.townSupplyPrice(16, 2), 25);
assert.equal(rules.townSupplyPrice(16, 10), 160);
assert.equal(rules.townSupplyStock('potion', 1), 4);
assert.equal(rules.townSupplyStock('potion', 10), 7);
assert.equal(rules.townSupplyStock('scroll', 10), 4);
assert.equal(rules.townSupplyStock('escape', 4), 1);
assert.equal(rules.townSupplyStock('escape', 5), 2);
assert.equal(rules.townSupplyStock('key', 8), 4);
assert.equal(rules.townSupplyStock('insurance', 10), 1);

assert.equal(rules.dungeonTier(1), 1);
assert.equal(rules.dungeonTier(100), 10);
assert.equal(rules.dungeonHealPrice(1, 50, 100, 24), 20);
assert.equal(rules.dungeonHealPrice(1, 0, 100, 24), 30);
assert.equal(rules.dungeonHealPrice(100, 50, 100, 24), 155);
assert.equal(rules.dungeonHealPrice(100, 100, 100, 24), 0);

assert.equal(rules.forgeCost(100, 0), 150);
assert.equal(rules.forgeCost(100, 4), 630);
assert.equal(rules.sellPrice(100, 0), 45);
assert.equal(rules.sellPrice(100, 3), 90);
assert.equal(rules.quickDiveCost(10, 5), 240);
assert.equal(rules.wheelSpinCost(0), 40);
assert.equal(rules.wheelSpinCost(3), 100);
assert.equal(rules.wheelResetCost(0), 60);
assert.equal(rules.wheelResetCost(2), 140);

console.log('economy_rules_v130=PASS');
