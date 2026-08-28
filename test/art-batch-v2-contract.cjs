'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));

const loot = json('art/source-atlases/runtime-maps/loot-atlas-v2.map.json');
const monsters = json('art/source-atlases/runtime-maps/monster-deep-atlas-v2.map.json');
const heroes = json('art/source-atlases/runtime-maps/hero-action-atlas-v2.map.json');
const props = json('art/source-atlases/runtime-maps/dungeon-props-atlas-v1.map.json');
const maps = [loot, monsters, heroes, props];

const expectedLoot = [
  'iron-sword','broad-sword','battle-axe','rune-blade',
  'leather-armor','chain-mail','plate-armor','mithril-armor',
  'copper-ring','ruby-ring','guardian-ring','healing-potion',
  'teleport-scroll','gold-pile','dungeon-heart','dungeon-key',
  'dagger','hunting-bow','arcane-staff',
  'helm-cloth','helm-iron','helm-knight','helm-dragon',
  'boots-cloth','boots-leather','boots-steel','boots-wind',
  'amulet-copper','amulet-moonstone','amulet-guardian','amulet-abyss',
];
assert.deepEqual(loot.ids, expectedLoot);
assert.equal(loot.columns, 4);
assert.equal(loot.rows, 8);
assert.equal(loot.cellPixels, 48);
assert.deepEqual(loot.atlasPixels, [192, 384]);
assert.deepEqual(loot.spareCell, [3, 7]);
assert.equal(new Set(loot.ids).size, loot.ids.length);

assert.equal(monsters.columns, 4);
assert.equal(monsters.rows, 4);
assert.equal(monsters.cellPixels, 48);
assert.deepEqual(monsters.atlasPixels, [192, 192]);
assert.equal(monsters.cells.length, 16);
assert.deepEqual(monsters.directSpriteMap, {abomination:0, seraph:1, voidspawn:2, voidlord:3});

assert.deepEqual(heroes.rowsByClass, ['warrior','ranger','mage','assassin']);
assert.deepEqual(heroes.columnsByState, ['idle','attack','hurt','skill']);
assert.equal(heroes.cellPixels, 48);
assert.deepEqual(heroes.atlasPixels, [192, 192]);

assert.equal(props.columns, 6);
assert.equal(props.rows, 4);
assert.equal(props.cellPixels, 48);
assert.equal(props.cells.length, 24);
assert.equal(new Set(props.cells).size, 24);
assert.deepEqual(props.atlasPixels, [288, 192]);

const runtimePaths = new Set([
  'art/runtime/loot-atlas-v2.svg',
  'art/runtime/monster-deep-atlas-v2.svg',
  'art/runtime/hero-action-atlas-v2.svg',
  'art/runtime/dungeon-props-atlas-v1.svg',
]);
for (const map of maps) {
  assert.equal(map.sourceArchive, 'dungeon-echo-art-library-batch-2026-08-29.zip');
  assert.equal(typeof map.sourceFile, 'string');
  assert.match(map.runtimeSha256, /^[0-9a-f]{64}$/);
  assert(runtimePaths.has(map.runtimePath), `unexpected runtime path: ${map.runtimePath}`);
  assert(fs.existsSync(path.join(root, map.runtimePath)), `runtime asset missing: ${map.runtimePath}`);
}

const staticFiles = read('ops/release/static-files.txt');
assert.doesNotMatch(staticFiles, /art\/source-atlases\//, 'source art must never ship in production');
for (const rel of runtimePaths) assert(staticFiles.includes(rel), `release boundary missing: ${rel}`);
assert(staticFiles.includes('game/ui/art-runtime-v2.js'));

const game = read('game/core/game.js');
for (const id of expectedLoot) assert(game.includes(`'${id}'`), `runtime loot identity missing: ${id}`);
assert.match(game, /background-size:\s*400%\s+800%/);

console.log('RESULT  art batch v2 provenance + mapping contract PASS');
