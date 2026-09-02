'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const zh=read('index.html'),en=read('en/index.html'),css=read('style.css'),core=read('game/core/game.js');
const manifest=new Set(read('ops/release/static-files.txt').trim().split(/\r?\n/));

const assets=[
  'art/town-backdrop-v190.webp',
  'art/town-blacksmith-v190.webp',
  'art/town-market-v190.webp',
  'art/town-tavern-v190.webp',
  'art/town-relic-hall-v190.webp',
];
for(const rel of assets){
  const p=path.join(root,rel),buf=fs.readFileSync(p);
  assert(buf.length>45000,rel+' must be a real authored environment asset');
  assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF',rel+' must be WebP/RIFF');
  assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP',rel+' must be WebP');
  assert(manifest.has(rel),rel+' must ship in the canonical release allowlist');
}
assert(zh.includes('art/town-backdrop-v190.webp')&&en.includes('art/town-backdrop-v190.webp'),'both locales must preload the authored town backdrop');
assert(!zh.includes('<link rel="preload" href="art/town-blacksmith-v190.webp"'),'service art must stay lazy instead of bloating initial load');
assert(core.includes("const townBackdropV190 = new Image();")&&core.includes('imageReady(townBackdropV190) ? townBackdropV190 : townBackdropV11'),'new town backdrop must retain the v1.1 fallback');
assert(core.includes("eventId === 'apothecary_batch'")&&core.includes("eventId === 'smithy_commission'")&&core.includes("eventId === 'long_table_pool'"),'new town business must surface as scene news');
assert(css.includes('.town-blacksmith-art')&&css.includes('.town-market-art')&&css.includes('.town-tavern-art')&&css.includes('.town-relic-art'),'all authored service scenes need explicit presentation bindings');
for(const html of [zh,en]){
  for(const cls of ['town-blacksmith-art','town-market-art','town-tavern-art','town-relic-art']) assert(html.includes(cls),cls+' must ship in both fixed locale routes');
}
assert(css.includes('@media (max-width: 760px)'),'authored environment plates must have a mobile crop contract');
console.log('town_art_v190=PASS');
