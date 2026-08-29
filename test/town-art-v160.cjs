'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const runtime = read('game/ui/town-art-v160.js');
const bootstrap = read('game/core/production-bootstrap.js');
const releaseRuntime = read('game/core/runtime-bootstrap.js');
const releaseGen = (releaseRuntime.match(/const assetVersion = '(\d+)'/) || [,''])[1];
const releaseFiles = new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

assert(/^\d+$/.test(releaseGen), 'release cache generation missing');
assert(releaseFiles.has('game/ui/town-art-v160.js'), 'town art v160 missing from release boundary');
assert(!releaseFiles.has('game/ui/town-art-v157.js'), 'retired town art v157 must leave release boundary');
for (const dep of ['art/runtime/dungeon-props-atlas-v1.svg', 'art/runtime/hero-action-atlas-v2.svg', 'art/town-backdrop-v11.webp'])
  assert(releaseFiles.has(dep), `town art dependency missing from release boundary: ${dep}`);

assert(runtime.includes("runtimeAsset('hero-action-atlas-v2.svg')"), 'detailed NPC atlas source missing');
assert(runtime.includes("runtimeAsset('dungeon-props-atlas-v1.svg')"), 'town landmark atlas source missing');
for (const role of ['quartermaster','smith','provisioner','alchemist','oracle','portalWarden'])
  assert(runtime.includes(`${role}:`), `town NPC role mapping missing: ${role}`);
for (const threshold of [2,3,4,5,6,7,8,10])
  assert(runtime.includes(`townTier >= ${threshold}`), `town visual growth threshold missing: ${threshold}`);
for (const label of [
  '仓库管事', 'Quartermaster', '补给商人', 'Provisioner',
  '铁匠', 'Smith', '药剂师', 'Alchemist', '祈祷者', 'Oracle',
  '远征告示', 'Expedition Board', '深层传送门', 'Deep Portal',
]) assert(runtime.includes(label), `town scene identity missing: ${label}`);

assert(runtime.includes('function npc(index, x, baseY, hue, now'), 'atlas NPC renderer missing');
assert(runtime.includes('atlasCell(npcs, index, 4, 4'), 'NPC renderer must consume 4x4 character atlas');
assert(runtime.includes("owner:'presentation'"), 'town art must remain presentation-owned');
assert(runtime.includes('gameplayMutation:false'), 'town art must explicitly deny gameplay mutation');
assert(runtime.includes('tierAware:true'), 'town art must expose tier-aware growth metadata');
assert(runtime.includes("npcAtlas:'hero-action-atlas-v2.svg'"), 'town runtime metadata must expose NPC atlas');
assert(runtime.includes('wrap.appendChild(scene)'), 'authoritative town canvas must remain mounted');
assert(runtime.includes('wrap.appendChild(overlay)'), 'town overlay must layer above core scene');

assert(bootstrap.includes(`../ui/town-art-v160.js?v=${releaseGen}`), 'production bootstrap must load town art at current release generation');
assert(bootstrap.includes("'__DE_TOWN_ART_V160'"), 'production bootstrap must guard duplicate town v160 loading');
assert(!bootstrap.includes('town-art-v157.js'), 'production bootstrap must stop loading retired v157 town art');

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

console.log('town-art-v160=PASS');
