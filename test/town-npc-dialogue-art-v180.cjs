'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel));
const text=rel=>read(rel).toString('utf8');

function webpInfo(rel){
  const data=read(rel);
  assert.equal(data.toString('ascii',0,4),'RIFF',rel+' must be RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP',rel+' must be WebP');
  const extended=data.indexOf(Buffer.from('VP8X'));
  if(extended>=0){
    return {
      width:1+data[extended+12]+(data[extended+13]<<8)+(data[extended+14]<<16),
      height:1+data[extended+15]+(data[extended+16]<<8)+(data[extended+17]<<16),
      alpha:!!(data[extended+8]&0x10), bytes:data.length,
    };
  }
  const signature=data.indexOf(Buffer.from([0x9d,0x01,0x2a]));
  assert(signature>=0,rel+' must contain a decodable VP8 frame');
  return {
    width:data.readUInt16LE(signature+3)&0x3fff,
    height:data.readUInt16LE(signature+5)&0x3fff,
    alpha:false, bytes:data.length,
  };
}

const scene=webpInfo('art/town-npc-atlas-v180.webp');
const portraits=webpInfo('art/town-npc-portraits-v180.webp');
for(const info of [scene,portraits]){
  assert.deepEqual([info.width,info.height],[1256,1256]);
  assert.deepEqual([info.width/4,info.height/4],[314,314]);
  assert(info.bytes>150000,'character atlas must contain authored image data');
}
assert(scene.alpha,'scene figures must retain true alpha');

const map=JSON.parse(text('art/source-atlases/runtime-maps/v180-town-character-art.map.json'));
assert.deepEqual(map.atlases.townNpcScene.grid,[4,4]);
assert.deepEqual(map.atlases.townNpcPortraits.grid,[4,4]);
assert.equal(map.cells.flat().length,16);
assert.deepEqual(map.cells[0],['quartermaster','smith','smith-action','records-clerk']);
assert.deepEqual(map.cells[3],['portal-warden','portal-technician','innkeeper','expedition-scout']);

const core=text('game/core/game.js'),css=text('style.css'),manifest=text('ops/release/static-files.txt');
assert(core.includes("townNpcAtlasV180.src = 'art/town-npc-atlas-v180.webp'"));
assert(core.includes("townNpcPortraitsV180.src = 'art/town-npc-portraits-v180.webp'"));
assert(core.includes('imageReady(townNpcAtlasV180) ? townNpcAtlasV180 : townNpcAtlasV1'),'historical SVG remains the load fallback');
assert(core.includes('function showTownDialogue(row, line)')&&core.includes('showTownDialogue(row, line);'));
assert(core.includes('function townDialogueTags(row)')&&core.includes('function hideTownDialogue()'));
assert(core.includes('TOWN_GROWTH_RULES.residentLine(row.id, context)')&&core.includes('TOWN_GROWTH_RULES.npcLine(row.id, context)'),'existing dialogue authority remains wired');
assert(css.includes("url('art/town-npc-portraits-v180.webp')")&&css.includes('.town-dialogue.shown'));
assert(css.includes('@media (prefers-reduced-motion: reduce)'));
for(const rel of ['index.html','en/index.html']){
  const html=text(rel);
  assert(html.includes('art/town-npc-atlas-v180.webp')&&html.includes('art/town-npc-portraits-v180.webp'),rel+' must warm both NPC atlases');
  assert(html.includes('id="town-dialogue"')&&html.includes('id="town-dialogue-portrait"'),rel+' must own the dialogue surface');
}
assert(!/[\u3400-\u9fff]/.test(text('en/index.html')),'authored English route must remain CJK-free');
assert(manifest.includes('art/town-npc-atlas-v180.webp')&&manifest.includes('art/town-npc-portraits-v180.webp'));

console.log('town_npc_dialogue_art_v180=PASS');
