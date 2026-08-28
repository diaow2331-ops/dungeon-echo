'use strict';
const fs=require('fs'),path=require('path');
const root=process.env.DE_ROOT||path.resolve(__dirname,'..');
const visual=fs.readFileSync(path.join(root,'visual-polish.js'),'utf8');
const cleanup=fs.readFileSync(path.join(root,'character-art-cleanup-v122.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'runtime-bootstrap.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'ops/release/static-files.txt'),'utf8').split(/\r?\n/).filter(Boolean);
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  PASS '+n)}else{fail++;console.log('  FAIL '+n)}};

ok(cleanup.includes('window.__DE_CHARACTER_ART_CLEANUP_V122'),'dedicated character-art cleanup owner exists');
ok(cleanup.includes('hero-atlas-v11\\.png'),'cleanup detects the canonical hero-atlas draw boundary');
ok(cleanup.includes('isLegacyRarityRing'),'pre-hero equipment rarity ellipse is quarantined');
ok(cleanup.includes('equipment-weapons-v13.png')&&cleanup.includes('equipment-wearables-v13.png'),'equipment atlases are blocked from the character overlay canvas');
ok(cleanup.includes('legacyGearDepth'),'post-hero legacy gear geometry is quarantined as one block');
ok(cleanup.includes('tinyRarityGem'),'obsolete amulet chest-gem remnant is suppressed');
ok(cleanup.includes("RARITY.has(String(ctx.strokeStyle"),'obsolete rarity-aware hero ring stroke is suppressed');
ok(!/localStorage\.setItem|persistRun|endTurn|\.stats\s*=|\.forge\s*=|api\.player\s*=/.test(cleanup),'character cleanup remains presentation-only');

const fixedPos=runtime.indexOf("'fixed-locale-entry-v130.js'");
const screenPos=runtime.indexOf("'core-screen-owner-v153.js'");
const cleanupPos=runtime.indexOf("'character-art-cleanup-v122.js'");
const lootPos=runtime.indexOf("'world-loot-polish-v122.js'");
ok(fixedPos>=0&&screenPos>fixedPos&&cleanupPos>screenPos&&lootPos>cleanupPos,'character cleanup loads after fixed-route owners and before ground-loot polish');
for(const retired of ['locale-event-owner-v130.js','locale-runtime-v122.js','locale-completeness-v128.js']) ok(!runtime.includes(retired),`character art no longer depends on retired locale runtime ${retired}`);
ok(manifest.includes('character-art-cleanup-v122.js'),'release manifest ships the character cleanup owner');
ok(/function drawCharacterGear\(/.test(visual),'legacy overlay remains identifiable for later source deletion while production cleanup quarantines it');

console.log(`\nRESULT  ${pass} passed / ${fail} failed`);
process.exit(fail?1:0);