'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const growth=require(path.join(root,'game/domain/town/town-growth-rules-v180.js'));
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('game/core/game.js'),css=read('style.css');
const authority=JSON.parse(read('docs/authority-map-v130.json'));

assert.deepEqual(growth.EVENTS.map(x=>x.id),['relic_exhibition','caravan_surplus','scout_cache']);
assert.equal(growth.eventForReturn({tier:1,newRelics:0,runs:1,lastReturnDepth:3,relics:0}),null,'tier-1 return without a relic should not invent a service event');
let event=growth.eventForReturn({tier:1,newRelics:1,runs:1,lastReturnDepth:3,relics:1});
assert(event&&event.id==='relic_exhibition'&&event.cost===0&&event.effect.gold>0,'new relic safe return should stage the free exhibition event');
const ctx={tier:5,newRelics:0,runs:8,lastReturnDepth:47,relics:5};
assert.equal(growth.eventForReturn(ctx).id,growth.eventForReturn(ctx).id,'same return context must select the same town event');
event=growth.eventOffer('caravan_surplus',{tier:5});
assert(event&&event.cost>0&&event.effect.marketRestock===1,'caravan event must be a bounded paid market restock');
event=growth.eventOffer('scout_cache',{tier:5});
assert(event&&event.effect.escapes===1&&event.effect.keys===1,'scout event must supply explicit survival resources');
assert(!/Math\.random|\brng\s*\(/.test(read('game/domain/town/town-growth-rules-v180.js')),'town-growth policy must stay deterministic and RNG-free');

const smithBroken=growth.npcLine('smith',{tier:2,works:{smithy:0}});
const smithBuilt=growth.npcLine('smith',{tier:7,works:{smithy:3}});
assert(smithBroken.zh!==smithBuilt.zh&&smithBroken.en!==smithBuilt.en,'NPC copy must react to actual construction state');
const curatorEmpty=growth.npcLine('records',{tier:2,relics:0,works:{relics:0}});
const curatorFull=growth.npcLine('records',{tier:8,relics:12,works:{relics:2}});
assert(curatorEmpty.zh!==curatorFull.zh,'Relic Curator copy must react to archive progress');

assert(core.includes('townEvent: null'),'meta schema must explicitly own one pending town event');
assert(core.includes('function stageTownReturnEvent(newRelics = 0)'),'core must stage safe-return events');
assert(core.includes('function resolveTownEvent()'),'core must own event resource mutation');
assert(core.includes('data-townevent="resolve"'),'town UI must expose the pending event action');
assert(core.includes('const stagedTownEvent = stageTownReturnEvent(returnedRelics.length);'),'safe return must be the event generation boundary');
const deathStart=core.indexOf('function greedyDeathReturn(');
const deathEnd=core.indexOf('const fullscreenElement',deathStart);
assert(!core.slice(deathStart,deathEnd).includes('stageTownReturnEvent('),'death must not create a positive safe-return town event');
assert(core.includes('const line = townNpcLine(row);')&&core.includes('TOWN_GROWTH_RULES.npcLine(row.id'),'walkable NPC interaction must surface state-aware town copy');
assert(core.includes('function drawTownEventNotice(ctx, now, W, H)')&&core.includes("ctx.fillText('!',x,y-23)"),'pending town events must be visible in the walkable plaza');
assert(css.includes('.town-event-card')&&css.includes('.town-event-copy'),'town event needs dedicated responsive presentation');
assert.equal(authority.authorities.townReturnEventPolicy,'game/domain/town/town-growth-rules-v180.js');
assert.equal(authority.authorities.townNpcStateCopy,'game/domain/town/town-growth-rules-v180.js');
assert.equal(authority.authorities.townEventPersistence,'game/core/game.js');

console.log('town_life_v180=PASS');
