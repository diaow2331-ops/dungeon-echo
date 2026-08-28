'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));

const runtime = read('game/ui/art-runtime-v2.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

const loot = json('art/source-atlases/runtime-maps/loot-atlas-v2.map.json');
const monster = json('art/source-atlases/runtime-maps/monster-deep-atlas-v2.map.json');
const hero = json('art/source-atlases/runtime-maps/hero-action-atlas-v2.map.json');
const props = json('art/source-atlases/runtime-maps/dungeon-props-atlas-v1.map.json');

const expectedLoot = [
  'iron-sword', 'broad-sword', 'battle-axe', 'rune-blade',
  'leather-armor', 'chain-mail', 'plate-armor', 'mithril-armor',
  'copper-ring', 'ruby-ring', 'guardian-ring', 'healing-potion',
  'teleport-scroll', 'gold-pile', 'dungeon-heart', 'dungeon-key',
  'dagger', 'hunting-bow', 'arcane-staff',
  'helm-cloth', 'helm-iron', 'helm-knight', 'helm-dragon',
  'boots-cloth', 'boots-leather', 'boots-steel', 'boots-wind',
  'amulet-copper', 'amulet-moonstone', 'amulet-guardian', 'amulet-abyss',
];

assert.deepStrictEqual(loot.ids, expectedLoot, 'loot atlas identity order drifted');
assert.deepStrictEqual([loot.columns, loot.rows, loot.cellPixels], [4, 8, 48]);
assert.deepStrictEqual(loot.atlasPixels, [192, 384]);
assert.deepStrictEqual(loot.spareCell, [3, 7]);

assert.deepStrictEqual(hero.rowsByClass, ['warrior', 'ranger', 'mage', 'assassin']);
assert.deepStrictEqual(hero.columnsByState, ['idle', 'attack', 'hurt', 'skill']);
assert.deepStrictEqual([hero.columns, hero.rows, hero.cellPixels], [4, 4, 48]);
assert.deepStrictEqual(hero.atlasPixels, [192, 192]);

assert.deepStrictEqual(monster.directSpriteMap, {
  abomination: 0,
  seraph: 1,
  voidspawn: 2,
  voidlord: 3,
});
assert.deepStrictEqual([monster.columns, monster.rows, monster.cellPixels], [4, 4, 48]);
assert.deepStrictEqual(monster.atlasPixels, [192, 192]);
assert.deepStrictEqual([props.columns, props.rows, props.cellPixels], [6, 4, 48]);
assert.deepStrictEqual(props.atlasPixels, [288, 192]);
assert.strictEqual(props.cells.length, 24, 'props atlas must remain 24 deterministic cells');

const runtimeAssets = [
  ['art/runtime/loot-atlas-v2.svg', 192, 384],
  ['art/runtime/monster-deep-atlas-v2.svg', 192, 192],
  ['art/runtime/hero-action-atlas-v2.svg', 192, 192],
  ['art/runtime/dungeon-props-atlas-v1.svg', 288, 192],
];
for (const [rel, width, height] of runtimeAssets) {
  assert(releaseFiles.has(rel), `${rel} missing from release boundary`);
  const svg = read(rel).slice(0, 300);
  assert(svg.includes(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`),
    `${rel} has unexpected runtime geometry`);
}
assert(releaseFiles.has('game/ui/art-runtime-v2.js'), 'art runtime missing from release boundary');

assert(runtime.includes("const HERO_ROWS = Object.freeze({ warrior:0, ranger:1, mage:2, assassin:3 })"));
assert(runtime.includes("const HERO_STATE = Object.freeze({ idle:0, attack:1, hurt:2, skill:3 })"));
assert(runtime.includes("const DEEP_MONSTER = Object.freeze({ abomination:0, seraph:1, voidspawn:2, voidlord:3 })"));
assert(runtime.includes("if (!m || m.boss || m.midBoss || !visibleAt(m.x, m.y, d)) continue;"),
  'bespoke boss/guardian art must remain authoritative');
assert(runtime.includes("if (it.type === 'chest' && imageReady(images.props))"));
assert(runtime.includes("if (type === 'shrine') return PROP.angelShrine"));
assert(runtime.includes("if (type === 'rest') return PROP.campfire"));
assert(runtime.includes("if (type === 'shop') return PROP.marketStall"));
assert(runtime.includes("window.__DE_ART_RUNTIME_V2"));

assert(bootstrap.includes("game/ui/art-runtime-v2.js?v=157") || bootstrap.includes("../ui/art-runtime-v2.js?v=157"),
  'production bootstrap must load v2 art runtime');
assert(bootstrap.includes('The v2 layer is optional presentation') || bootstrap.includes('v2 layer is optional presentation'),
  'fallback contract must remain explicit');

for (const forbidden of [
  'localStorage.setItem(',
  'Math.random(',
  'player.hp =',
  'player.atkBase =',
  'player.def =',
  'monsters.push(',
  'items.push(',
]) {
  assert(!runtime.includes(forbidden), `presentation runtime must not own gameplay mutation: ${forbidden}`);
}

console.log('art-runtime-v2=PASS');
