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

const version = read('VERSION').trim();
assert.match(version, /^1\.\d+\.\d+$/, 'VERSION must remain a valid 1.x semantic release');
const authority = JSON.parse(read('docs/authority-map-v130.json'));
assert.equal(authority.version, version);
assert.equal(authority.policy, 'one-responsibility-one-production-authority');
assert(Number.isInteger(authority.cacheGeneration) && authority.cacheGeneration > 0);
const cacheGeneration = String(authority.cacheGeneration);
assert.equal(authority.authorities.gameplayState, 'game/core/game.js');
assert.equal(authority.authorities.contentClassification, 'game/domain/content/content-rules-v130.js');
assert.equal(authority.authorities.equipmentStatScoring, 'game/domain/inventory/equipment-rules-v130.js');
assert.equal(authority.authorities.equipmentClassFitScoring, 'game/domain/inventory/equipment-rules-v130.js');
assert.equal(authority.authorities.equipmentTransactionPricing, 'game/domain/economy/economy-rules-v130.js');
assert.equal(authority.authorities.levelUpArithmetic, 'game/domain/progression/progression-rules-v130.js');
assert.equal(authority.authorities.criticalDamageMultiplier, 'game/domain/combat/combat-rules-v130.js');
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

// Completed work must be preserved in responsibility shelves rather than discarded.
for (const rel of [
  'archive/quarantine-v130/README.md',
  'archive/quarantine-v130/RESPONSIBILITY_INDEX.md',
  'archive/quarantine-v130/gameplay/combat/combat-pressure.js',
  'archive/quarantine-v130/gameplay/equipment/equipment-system.js',
  'archive/quarantine-v130/gameplay/economy/commerce-system.js',
  'archive/quarantine-v130/gameplay/economy/forge-system.js',
  'archive/quarantine-v130/gameplay/progression/progression-system.js',
  'archive/quarantine-v130/gameplay/town/town-system.js',
  'archive/quarantine-v130/gameplay/content-risk/content-system.js',
  'archive/quarantine-v130/input/combat-controls.js',
  'archive/quarantine-v130/locale/interceptors/town-canvas-locale-v153.js',
  'archive/quarantine-v130/persistence/save-integrity-system.js',
  'archive/quarantine-v130/art/code/art-runtime-v2.js',
  'archive/quarantine-v130/art/assets/runtime/boss-guardian-atlas-v3.png',
  'archive/quarantine-v130/art/assets/equipment/equipment-weapons-v13.png',
]) assert(exists(rel), `quarantined responsibility shelf missing: ${rel}`);

for (const oldShelf of [
  'archive/quarantine-v130/gameplay-systems',
  'archive/quarantine-v130/ui-legacy',
  'archive/quarantine-v130/input-legacy',
  'archive/quarantine-v130/locale-legacy',
  'archive/quarantine-v130/art-runtime-code',
  'archive/quarantine-v130/art-runtime',
  'archive/quarantine-v130/art-equipment',
]) assert(!exists(oldShelf), `unsorted quarantine box still exists: ${oldShelf}`);

const zh = read('index.html');
const en = read('en/index.html');
for (const html of [zh,en]) {
  assert(html.includes(`v${version}`));
  const generations = [...html.matchAll(/\?v=(\d+)/g)].map(match => match[1]);
  assert(generations.length > 0 && generations.every(row => row === cacheGeneration), 'entry cache generation drifted');
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
assert(runtime.includes(`const assetVersion = '${cacheGeneration}'`));
assert(runtime.includes("followers:'presentation-only'"));
assert(runtime.includes("gameplayStateOwner:'game/core/game.js'"));
assert(!/game\/systems\/|combat-controls|art-runtime|town-art|hero-directional|class-combat-fx/.test(runtime));
assert(!/DE_COMMERCE|DE_TOWN_|DE_EQUIPMENT|DE_FORGE|DE_PROGRESSION/.test(gamepad), 'gamepad must be transport-only');
assert(!/localStorage/.test(gamepad), 'gamepad must not own persistence');
assert(!/DE_TEST/.test(gamepad), 'gamepad must not call gameplay API directly');
assert(!game.includes('const isFinalFloor = () => !player.echoMode && depth >= MAX_DEPTH'), 'core still duplicates final-floor classification');
assert(!game.includes('const pool = MONSTERS.filter(m => d >= m.min && d <= m.max)'), 'core still duplicates monster-pool classification');
assert(!game.includes('SHOP_FLOORS.includes(depth)'), 'core still duplicates shop-floor classification');
assert(!game.includes('REST_FLOORS.includes(depth)'), 'core still duplicates rest-floor classification');
assert(!game.includes('Math.round((stats.atk || 0) * 3'), 'core still duplicates inventory stat-score formula');
assert(!game.includes('30 + Math.round(itemValueScore(it) * 1.2)'), 'core still duplicates forge pricing');
assert(!game.includes('Math.max(4, Math.round(itemValueScore(it) * .45)'), 'core still duplicates sell pricing');
assert(game.includes('const forgeCost = it => ECONOMY_RULES.forgeCost(')&&game.includes('TOWN_GROWTH_RULES.forgeDiscount(currentTownWorks())'), 'core must delegate forge pricing while supplying the town-project discount as policy input');
assert(game.includes('const sellPrice = it => ECONOMY_RULES.sellPrice(itemValueScore(it), it.forge || 0);'), 'core must delegate sell pricing');
for (const delegated of ['townTier','townSupplyPrice','townSupplyStock','quickDiveCost','tavernToastCost','wheelSpinCost','wheelResetCost']) assert(game.includes(`ECONOMY_RULES.${delegated}(`), `core must delegate active economy policy ${delegated}`);
for (const dormant of ['dungeonTier','dungeonHealPrice']) assert(!game.includes(`ECONOMY_RULES.${dormant}(`), `core unexpectedly adopted dormant economy helper ${dormant}`);
assert(game.includes('TOWN_RULES.expeditionSupplyNeeds(meta)'), 'core must delegate expedition readiness thresholds');
assert(game.includes('TOWN_RULES.unlockedCheckpoints(meta && meta.bestDepth)'), 'core must delegate checkpoint unlock policy');
assert(game.includes('TOWN_RULES.isCheckpointUnlocked(checkpointDepth, meta.bestDepth)'), 'core must delegate checkpoint selection policy');
assert(!game.includes('const TOWN_CHECKPOINTS = Object.freeze([1, 11, 21, 31, 41, 51, 61, 71, 81, 91])'), 'core must not duplicate checkpoint table');
assert(!game.includes('potion:Math.max(0, 2 - (meta.potions || 0))'), 'core must not duplicate expedition readiness threshold');
assert(!game.includes('while (player.xp >= player.lvl * 15)'), 'core still duplicates XP threshold');
assert(!game.includes('player.lvl * 15'), 'core still duplicates XP threshold arithmetic outside the progression authority');
assert(!game.includes('player.lvl++; player.hpBase += 6; player.atkBase += 1;'), 'core still duplicates level-up deltas');
assert(!game.includes('if (player.lvl % 3 === 0) pendingTalent = true;'), 'core still duplicates talent-due classification');
assert(game.includes('PROGRESSION_RULES.xpThreshold(player.lvl)'), 'core must delegate XP threshold');
assert(game.includes('PROGRESSION_RULES.levelUpDelta()'), 'core must delegate level-up delta');
assert(game.includes('PROGRESSION_RULES.talentDue(player.lvl)'), 'core must delegate talent due');
for (const dormant of ['progressionCaps','clampGrowthSnapshot','reachedEvolutionMilestones','nextEvolutionMilestone','nextTalentLevel']) assert(!game.includes(`PROGRESSION_RULES.${dormant}(`), `core unexpectedly adopted dormant progression helper ${dormant}`);
assert(!game.includes("const pCritMul  = () => 1.8 + (player.critPower || 0) / 100;"), 'core still duplicates critical multiplier arithmetic');
assert(game.includes("const pCritMul  = () => COMBAT_RULES.criticalMultiplier((player.critPower || 0) + setStat('critPower'));"), 'core must delegate critical multiplier while supplying active set bonus input');
for (const dormant of ['warriorDamageReduction','totalDefense','grievousHealMultiplier','outgoingHitDamage','incomingMeleeDamage','incomingRangedDamage','thornsDamage','killHeal']) assert(!game.includes(`COMBAT_RULES.${dormant}(`), `core unexpectedly adopted dormant combat helper ${dormant}`);

for (const token of [
  "heroAtlasV11.src = 'art/hero-atlas-v11.png'",
  "monsterAtlasV11.src = 'art/monster-atlas-v11.png'",
  "guardianAtlasV11.src = 'art/guardian-atlas-v11.png'",
  "finalBossV11.src = 'art/final-boss-v11.png'",
  "townBackdropV11.src = 'art/town-backdrop-v11.webp'",
  "const ctx = canvas.getContext('2d')",
  "const CONTENT_RULES = typeof window !== 'undefined' ? window.DE_CONTENT_RULES_V130 : null",
  "const INVENTORY_RULES = typeof window !== 'undefined' ? window.DE_INVENTORY_RULES_V130 : null",
  "const ECONOMY_RULES = typeof window !== 'undefined' ? window.DE_ECONOMY_RULES_V130 : null",
  "const TOWN_RULES = typeof window !== 'undefined' ? window.DE_TOWN_RULES_V130 : null",
  "const PROGRESSION_RULES = typeof window !== 'undefined' ? window.DE_PROGRESSION_RULES_V130 : null",
  "const COMBAT_RULES = typeof window !== 'undefined' ? window.DE_COMBAT_RULES_V130 : null",
  "document.addEventListener('keydown'",
]) assert(game.includes(token), `canonical core contract missing: ${token}`);

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
  if (rel !== 'game/core/game.js' && /addEventListener\s*\(\s*['\"]keydown['\"]/.test(src)) {
    assert(!/addEventListener\s*\(\s*['\"]keydown['\"][\s\S]{0,160},\s*true\s*\)/.test(src), `${rel} registers a capture-phase keyboard owner`);
    assert(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(src), `${rel} intercepts gameplay keyboard control flow`);
  }
  assert(!/archive\/quarantine-v130/.test(src), `${rel} references quarantine`);
}

for (const rel of [
  'game/core/game.js','game/core/production-bootstrap.js','game/core/runtime-bootstrap.js',
  'game/domain/content/content-rules-v130.js','game/domain/inventory/equipment-rules-v130.js','game/domain/inventory/set-rules-v180.js',
  'game/domain/economy/economy-rules-v130.js',
  'game/domain/town/town-rules-v130.js',
  'game/domain/town/town-growth-rules-v180.js',
  'game/domain/expedition/expedition-rules-v170.js',
  'game/domain/progression/progression-rules-v130.js',
  'game/domain/combat/combat-rules-v130.js',
  'art/hero-atlas-v11.png','art/monster-atlas-v11.png','art/guardian-atlas-v11.png',
  'art/final-boss-v11.png','art/town-backdrop-v11.webp',
]) {
  assert(exists(rel), `canonical source missing: ${rel}`);
  assert(manifest.has(rel), `canonical source missing from release boundary: ${rel}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'de-v130-authority-'));
const archive = path.join(tmp,`dungeon-v${version}.zip`);
let r = run('bash',['ops/release/build-site-bundle.sh',archive]);
assert.equal(r.status,0,`${r.stdout}\n${r.stderr}`);
assert.match(r.stdout,/dungeon_echo_bundle_build=PASS/);
assert(r.stdout.includes(`asset_generation=${cacheGeneration}`));
r = run('unzip',['-Z1',archive]);
assert.equal(r.status,0,r.stderr);
const files = r.stdout.trim().split(/\r?\n/);
assert(!files.some(x => x.includes('/archive/')), 'artifact ships quarantine');
assert(!files.some(x => x.includes('/game/systems/')), 'artifact ships wrapper systems');
assert(files.includes('public/dungeon-echo/game/core/game.js'));
assert(files.includes('public/dungeon-echo/art/hero-atlas-v11.png'));
fs.rmSync(tmp,{recursive:true,force:true});
console.log('single_authority_v130=PASS');
