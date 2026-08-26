'use strict';
const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const visual = fs.readFileSync(path.join(root, 'visual-polish.js'), 'utf8');
const cleanup = fs.readFileSync(path.join(root, 'character-art-cleanup-v122.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'runtime-bootstrap.js'), 'utf8');
const manifest = fs.readFileSync(path.join(root, 'ops/release/static-files.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
let pass = 0, fail = 0;
const ok = (cond, name) => {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
};

ok(cleanup.includes('window.__DE_CHARACTER_ART_CLEANUP_V122'),
  'v1.2.2 declares a dedicated character-art cleanup owner');
ok(cleanup.includes('hero-atlas-v11\\.png'),
  'cleanup detects the canonical hero-atlas draw boundary');
ok(cleanup.includes('isLegacyRarityRing'),
  'pre-hero equipment rarity ellipse is explicitly quarantined');
ok(cleanup.includes("equipment-weapons-v13.png") && cleanup.includes("equipment-wearables-v13.png"),
  'equipment atlas images are blocked from the character overlay canvas');
ok(cleanup.includes('legacyGearDepth'),
  'post-hero legacy weapon/armor/helmet/charm geometry is quarantined as one block');
ok(cleanup.includes('tinyRarityGem'),
  'obsolete amulet chest-gem remnant is explicitly suppressed');
ok(cleanup.includes('RARITY.has(String(ctx.strokeStyle'),
  'obsolete rarity-aware ring-on-hero stroke is explicitly suppressed');
ok(!/localStorage\.setItem|persistRun|endTurn|\.stats\s*=|\.forge\s*=|api\.player\s*=/.test(cleanup),
  'character cleanup remains presentation-only');

const localePos = runtime.indexOf("'locale-runtime-v122.js'");
const cleanupPos = runtime.indexOf("'character-art-cleanup-v122.js'");
const lootPos = runtime.indexOf("'world-loot-polish-v122.js'");
ok(localePos >= 0 && cleanupPos > localePos && lootPos > cleanupPos,
  'character cleanup loads after locale and before ground-loot polish');
ok(manifest.includes('character-art-cleanup-v122.js'),
  'release manifest ships the character cleanup owner');

// Legacy source may remain until repository cleanup, but it must be quarantined in production.
ok(/function drawCharacterGear\(/.test(visual),
  'legacy overlay is still identifiable for later repository deletion');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
