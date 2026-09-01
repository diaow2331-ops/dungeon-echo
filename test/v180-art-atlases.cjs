'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel));
const text=rel=>read(rel).toString('utf8');

function webpInfo(rel){
  const data=read(rel);
  assert.equal(data.toString('ascii',0,4),'RIFF',rel+' must be RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP',rel+' must be WebP');
  const offset=data.indexOf(Buffer.from('VP8X'));
  assert(offset>=0,rel+' must use an extended WebP header');
  const flags=data[offset+8];
  const width=1+data[offset+12]+(data[offset+13]<<8)+(data[offset+14]<<16);
  const height=1+data[offset+15]+(data[offset+16]<<8)+(data[offset+17]<<16);
  return {width,height,alpha:!!(flags&0x10),bytes:data.length};
}

const relic=webpInfo('art/named-relic-atlas-v180.webp');
const town=webpInfo('art/town-growth-atlas-v180.webp');
assert.deepEqual([relic.width,relic.height],[1539,1026]);
assert.deepEqual([relic.width/9,relic.height/6],[171,171]);
assert(relic.alpha&&relic.bytes>100000,'relic atlas must retain authored alpha and non-placeholder content');
assert.deepEqual([town.width,town.height],[1256,1256]);
assert.deepEqual([town.width/4,town.height/4],[314,314]);
assert(town.alpha&&town.bytes>100000,'town atlas must retain authored alpha and non-placeholder content');

const map=JSON.parse(text('art/source-atlases/runtime-maps/v180-town-relic-art.map.json'));
assert.deepEqual(map.atlases.namedRelics.grid,[9,6]);
assert.deepEqual(map.atlases.namedRelics.cell,[171,171]);
assert.equal(map.atlases.namedRelics.rows.length,6);
assert.equal(map.atlases.namedRelics.columns.length,9);
assert.deepEqual(map.atlases.townGrowth.grid,[4,4]);
assert.deepEqual(map.atlases.townGrowth.cell,[314,314]);

const core=text('game/core/game.js'),css=text('style.css'),manifest=text('ops/release/static-files.txt');
assert(core.includes("namedRelicAtlasV180.src = 'art/named-relic-atlas-v180.webp'"));
assert(core.includes('function namedRelicArtCell(')&&core.includes('function itemLootMarkup('));
assert(core.includes('function townGrowthArtMarkup(')&&core.includes("TOWN_GROWTH_ART_ROW = Object.freeze({ smithy:0, market:1, tavern:2, relics:3 })"));
assert(core.includes("namedRelicMarkup(set.id,slot,meta.classId"),'Relic Hall cards must consume the canonical set atlas');
assert(core.includes('if (item && item.namedSet && imageReady(namedRelicAtlasV180))'),'ground relics must consume the same atlas');
assert(css.includes('background-size: 900% 600%')&&css.includes('background-size:400% 400%'));
for(const rel of ['index.html','en/index.html']){
  const html=text(rel);
  assert(html.includes('art/named-relic-atlas-v180.webp')&&html.includes('art/town-growth-atlas-v180.webp'),rel+' must warm both v1.8 atlases');
}
assert(manifest.includes('art/named-relic-atlas-v180.webp'));
assert(manifest.includes('art/town-growth-atlas-v180.webp'));

console.log('v180_art_atlases=PASS');
