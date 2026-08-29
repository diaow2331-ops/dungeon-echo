'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const run = (cmd,args) => spawnSync(cmd,args,{cwd:root,encoding:'utf8'});

assert.equal(read('VERSION').trim(), '1.3.0');
const authority = JSON.parse(read('docs/authority-map-v130.json'));
assert.equal(authority.policy, 'one-responsibility-one-production-authority');
assert.equal(authority.cacheGeneration, 169);
assert.equal(authority.authorities.gameplayState, 'game/core/game.js');
assert.equal(authority.authorities.canvasRendering, 'game/core/game.js');
assert.equal(authority.authorities.keyboardTouchInput, 'game/core/game.js');
assert.equal(authority.authorities.gameplayPersistence, 'game/core/game.js');
assert.equal(authority.authorities.gamepadTransport, 'game/input/desktop-controls.js');
assert.equal(authority.authorities.runtimeFollowerLoading, 'game/core/runtime-bootstrap.js');

const manifestRows = read('ops/release/static-files.txt').trim().split(/\r?\n/).filter(Boolean);
const manifest = new Set(manifestRows);
assert(!manifestRows.some(x => x.startsWith('archive/')), 'quarantine must never ship');
assert(!manifestRows.some(x => x.startsWith('game/systems/')), 'gameplay wrapper systems must not ship');

const retiredActive = [
  'game/core/save-integrity-system.js',
  'game/locale/stable-item-id-migration-v150.js',
  'game/input/combat-controls.js',
  'game/locale/core-screen-owner-v153.js',
  'game/locale/town-canvas-locale-v153.js',
  'game/ui/visual-polish.js',
  'game/ui/art-runtime-v2.js',
  'game/ui/art-runtime-v4.js',
  'game/ui/town-art-v160.js',
  'game/ui/character-art-cleanup-v122.js',
  'game/ui/world-loot-polish-v122.js',
  'game/ui/hero-directional-art-v165.js',
  'game/ui/class-combat-fx-v163.js',
  'game/ui/new-run-reset-v167.js',
  'game/ui/equipment-shop-ui.js',
  'game/ui/town-workspace-v156.js',
  'game/ui/town-workspace-events-v156.js',
  'game/ui/forge-feedback-v122.js',
  'game/ui/combat-hint-polish.js',
  'game/ui/expedition-pressure-v1211.js',
  'game/ui/audio-director.js',
  'game/ui/mobile-ux.js',
  'game/ui/expedition-record-v126.js',
];
for (const rel of retiredActive) {
  assert(!exists(rel), `second authority still active: ${rel}`);
  assert(!manifest.has(rel), `second authority still ships: ${rel}`);
}
assert(exists('archive/quarantine-v130/README.md'));
assert(exists('archive/quarantine-v130/RESPONSIBILITY_INDEX.md'));
assert(exists('archive/quarantine-v130/gameplay-systems/commerce-system.js'));
assert(exists('archive/quarantine-v130/input-legacy/combat-controls.js'));
assert(exists('archive/quarantine-v130/art-runtime-code/art-runtime-v2.js'));
assert(exists('archive/quarantine-v130/art-runtime/boss-guardian-atlas-v3.png'));

const zh = read('index.html');
const en = read('en/index.html');
for (const html of [zh,en]) {
  assert(html.includes('v1.3.0'));
  assert(html.includes('?v=169'));
  assert(!/\?v=(153|157|166|167|168)/.test(html), 'historical cache generation remains');
  assert(!/archive\/|game\/systems\/|combat-controls|art-runtime|town-art|hero-directional|class-combat-fx/.test(html), 'entry references non-authoritative runtime');
}

const production = read('game/core/production-bootstrap.js');
const runtime = read('game/core/runtime-bootstrap.js');
const game = read('game/core/game.js');
const gamepad = read('game/input/desktop-controls.js');
assert(production.includes("const STORAGE_EPOCH = 'v130'"));
assert(production.includes("gameplayStateOwner:'game/core/game.js'"));
assert(production.includes("gameplayInputOwner:'game/core/game.js'"));
assert(production.includes("gameplayPersistenceOwner:'game/core/game.js'"));
assert(production.includes('historicalSaveMigration:false'));
assert(runtime.includes("const assetVersion = '169'"));
assert(runtime.includes("followers:'dom-only'"));
assert(runtime.includes("gameplayStateOwner:'game/core/game.js'"));
assert(!/game\/systems\/|combat-controls|art-runtime|town-art|hero-directional|class-combat-fx/.test(runtime));
assert(!/DE_COMMERCE|DE_TOWN_|DE_EQUIPMENT|DE_FORGE|DE_PROGRESSION/.test(gamepad), 'gamepad must be transport-only');
assert(!/localStorage/.test(gamepad), 'gamepad must not own persistence');
assert(!/DE_TEST/.test(gamepad), 'gamepad must not call gameplay API directly');

for (const token of [
  "heroAtlasV11.src = 'art/hero-atlas-v11.png'",
  "monsterAtlasV11.src = 'art/monster-atlas-v11.png'",
  "guardianAtlasV11.src = 'art/guardian-atlas-v11.png'",
  "finalBossV11.src = 'art/final-boss-v11.png'",
  "townBackdropV11.src = 'art/town-backdrop-v11.webp'",
  "const ctx = canvas.getContext('2d')",
  "document.addEventListener('keydown'",
]) assert(game.includes(token), `canonical core contract missing: ${token}`);

// Behavior-level scan of every shipped JavaScript file.
const js = manifestRows.filter(x => x.endsWith('.js'));
for (const rel of js) {
  const src = read(rel);
  if (rel !== 'game/core/game.js') {
    assert(!/getElementById\(['\"]game['\"]\)[\s\S]{0,300}getContext\s*\(/.test(src), `${rel} tries to own dungeon Canvas`);
    assert(!/\.getContext\s*\(['\"]2d['\"]/.test(src) || rel === 'game/ui/responsive-final-v154.js', `${rel} obtains a 2d Canvas context`);
    assert(!/DE_TEST\s*\.[A-Za-z_$][\w$]*\s*=/.test(src), `${rel} mutates DE_TEST`);
    assert(!/DE_TEST\s*\[[^\]]+\]\s*=/.test(src), `${rel} mutates DE_TEST dynamically`);
  }
  if (rel !== 'game/core/game.js' && rel !== 'game/core/production-bootstrap.js' && rel !== 'game/locale/fixed-locale-entry-v130.js') {
    assert(!/localStorage\s*\.(setItem|removeItem|clear)\s*\(/.test(src), `${rel} writes storage outside an allowed authority`);
  }
  if (rel !== 'game/core/game.js') {
    assert(!/addEventListener\s*\(\s*['\"]keydown['\"]/.test(src), `${rel} captures gameplay keyboard input`);
  }
  assert(!/archive\/quarantine-v130/.test(src), `${rel} references quarantine`);
}

for (const rel of [
  'game/core/game.js','game/core/production-bootstrap.js','game/core/runtime-bootstrap.js',
  'art/hero-atlas-v11.png','art/monster-atlas-v11.png','art/guardian-atlas-v11.png',
  'art/final-boss-v11.png','art/town-backdrop-v11.webp',
]) {
  assert(exists(rel), `canonical source missing: ${rel}`);
  assert(manifest.has(rel), `canonical source missing from release boundary: ${rel}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'de-v130-authority-'));
const archive = path.join(tmp,'dungeon-v1.3.0.zip');
let r = run('bash',['ops/release/build-site-bundle.sh',archive]);
assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
assert.match(r.stdout,/dungeon_echo_bundle_build=PASS/);
assert.match(r.stdout,/asset_generation=169/);
r = run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files = r.stdout.trim().split(/\r?\n/);
assert(!files.some(x => x.includes('/archive/')), 'artifact ships quarantine');
assert(!files.some(x => x.includes('/game/systems/')), 'artifact ships wrapper systems');
assert(files.includes('public/dungeon-echo/game/core/game.js'));
assert(files.includes('public/dungeon-echo/art/hero-atlas-v11.png'));
fs.rmSync(tmp,{recursive:true,force:true});
console.log('single_authority_v130=PASS');
