'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const growth=require(path.join(root,'game/domain/town/town-growth-rules-v180.js'));
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const core=read('game/core/game.js');
const authority=JSON.parse(read('docs/authority-map-v130.json'));

assert.deepEqual(growth.RESIDENTS.map(x=>x.id),['provisioner','apothecary','watch','scout','technician','alchemist']);
assert.equal(growth.residentRoster({tier:1,works:{}}).length,0,'tier 1 plaza should remain sparse');
assert.deepEqual(growth.residentRoster({tier:2,works:{}}).map(x=>x.id),['provisioner']);
assert.deepEqual(growth.residentRoster({tier:3,works:{market:0}}).map(x=>x.id),['provisioner'],'apothecary needs a functioning trade road');
assert.deepEqual(growth.residentRoster({tier:3,works:{market:1}}).map(x=>x.id),['provisioner','apothecary']);
const late=growth.residentRoster({tier:8,works:{market:2}});
assert.deepEqual(late.map(x=>x.id),['provisioner','apothecary','watch','scout','technician','alchemist']);
assert(growth.residentLine('watch',{bestDepth:70}).zh.includes('两班倒'),'watch dialogue should react to deep exploration pressure');
assert(growth.residentLine('provisioner',{tier:4,works:{market:1},eventId:'caravan_surplus'}).zh.includes('压仓货'),'pending caravan event should be acknowledged by its resident');
assert(growth.residentLine('scout',{tier:5,lastReturnDepth:47,eventId:'scout_cache'}).zh.includes('备用箱'),'pending scout event should be acknowledged by its resident');

assert(core.includes('const TOWN_RESIDENT_VISUALS = Object.freeze'),'core must own resident art/positions');
assert(core.includes('function activeTownResidents()'),'core must materialize policy residents into runtime actors');
assert(core.includes('function townInteractables() { return [...TOWN_HOTSPOTS, ...activeTownResidents()]; }'),'resident interactions must join the canonical town interaction list');
assert(core.includes("row.kind === 'resident'")&&core.includes('TOWN_GROWTH_RULES.residentLine(row.id, context)'),'resident interaction must use policy-owned state-aware copy');
assert(core.includes('for (const row of townInteractables())'),'pointer targeting must include residents');
assert(core.includes('const residentCount = TOWN_HOTSPOTS.length + activeTownResidents().length'),'town ledger must report visible resident growth');
assert(core.includes("if (row.kind === 'resident') return !!TOWN_GROWTH_RULES.residentById(row.id)"),'resident chronicle rows must sanitize through the resident policy authority');
assert(core.includes('function recordResidentArrivals(beforeIds)')&&core.includes("recordTownChronicle({ kind:'resident', id:row.id })"),'new project/depth residents must leave structured town-history entries');
assert(core.includes('const arrivedResidents = recordResidentArrivals(residentsBefore)'),'safe-return/project flows must explicitly detect new residents');
assert.equal(authority.authorities.townResidentRosterPolicy,'game/domain/town/town-growth-rules-v180.js');
assert.equal(authority.authorities.townResidentInteraction,'game/core/game.js');

console.log('town_residents_v180=PASS');
