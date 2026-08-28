'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/town-art-v157.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(releaseFiles.has('game/ui/town-art-v157.js'), 'town art runtime missing from release boundary');
assert(releaseFiles.has('art/runtime/dungeon-props-atlas-v1.svg'), 'town art prop atlas missing from release boundary');
assert(releaseFiles.has('art/town-backdrop-v11.webp'), 'town backdrop must remain in release boundary');

for (const landmark of [
  'treasureChest', 'forgeAnvil', 'alchemyTable', 'marketStall',
  'angelShrine', 'bountyBoard', 'townPortal', 'arcaneCrystal', 'runeObelisk',
]) assert(runtime.includes(`${landmark}:`), `town landmark missing: ${landmark}`);

for (const threshold of [2,3,4,5,6,8,10])
  assert(runtime.includes(`townTier >= ${threshold}`), `town visual growth threshold missing: ${threshold}`);

for (const label of [
  '仓库管事', 'Quartermaster', '补给商人', 'Provisioner',
  '铁匠', 'Smith', '药剂师', 'Alchemist', '祈祷者', 'Oracle',
  '远征告示', 'Expedition Board', '深层传送门', 'Deep Portal',
]) assert(runtime.includes(label), `town scene identity missing: ${label}`);

assert(runtime.includes("owner:'presentation'"), 'town art must remain presentation-owned');
assert(runtime.includes('gameplayMutation:false'), 'town art must explicitly deny gameplay mutation');
assert(runtime.includes('tierAware:true'), 'town art must expose tier-aware growth metadata');
assert(runtime.includes("runtimeAsset('dungeon-props-atlas-v1.svg')"), 'town art must consume admitted prop atlas');
assert(runtime.includes("wrap.appendChild(scene)"), 'town scene must retain the authoritative core canvas');
assert(runtime.includes("wrap.appendChild(overlay)"), 'town art overlay must layer over the authoritative scene');

assert(bootstrap.includes("../ui/town-art-v157.js?v=159"), 'production bootstrap must load town art v1.5.7');
assert(bootstrap.includes("'__DE_TOWN_ART_V157'"), 'production bootstrap must guard duplicate town art loading');

for (const forbidden of [
  'Math.random(',
  'localStorage.setItem(',
  'api.meta.gold =',
  'api.meta.bestDepth =',
  'api.buyTown(',
  'api.depositStash(',
  'api.withdrawStash(',
  'api.departTown(',
]) assert(!runtime.includes(forbidden), `town presentation owns gameplay behavior: ${forbidden}`);

console.log('town-art-v157=PASS');
