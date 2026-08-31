'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const rules=require(path.join(root,'game/domain/inventory/set-rules-v180.js'));
const core=read('game/core/game.js'),zh=read('index.html'),en=read('en/index.html'),css=read('style.css');
const locale=read('game/locale/locale-data-v134.js');
const manifest=read('ops/release/static-files.txt');
const authority=JSON.parse(read('docs/authority-map-v130.json'));

assert.equal(rules.authority,'named-set-policy');
assert.equal(rules.version,'v1.8.0-development');
assert.deepEqual(rules.SLOTS,['weapon','armor','helmet','boots','ring','amulet']);
assert(rules.SETS.length>=6,'v1.8 must provide a real multi-set named-relic ecosystem');
assert(rules.eligibleSets(20).length>=2&&rules.eligibleSets(50).length>=3&&rules.eligibleSets(80).length>=3,'early/mid/deep bands must all offer competing named sets so Relic Hall research matters');
const capstoneMechanics=new Set();
for(const set of rules.SETS){
  assert.deepEqual(set.bonuses.map(b=>b.pieces),[2,4,6],set.id+' must use 2/4/6 activation');
  const capstone=set.bonuses.find(b=>b.pieces===6);
  assert(capstone&&capstone.capstone&&capstone.capstone.mechanic&&capstone.capstone.power===2,set.id+' must reserve an authored gameplay capstone for the complete six-piece set');
  capstoneMechanics.add(capstone.capstone.mechanic);
  assert(set.zh&&set.en&&set.zhStory&&set.enStory,set.id+' must own set identity and story');
  const names=[];
  for(const slot of rules.SLOTS){
    const p=rules.piece(set.id,slot,'warrior');
    assert(p&&p.zh&&p.en&&p.zhLore&&p.enLore,set.id+':'+slot+' must be a named lore-bearing relic');
    names.push(p.zh);
    assert(Object.keys(rules.signatureStats(set.id,slot,Math.max(1,set.minDepth))).length>=2,set.id+':'+slot+' must have a multi-stat fixed signature package that replaces random-affix volume');
  }
  assert.equal(new Set(names).size,6,set.id+' piece names must be individually memorable');
}
assert.equal(capstoneMechanics.size,rules.SETS.length,'each complete six-piece set must own a distinct capstone playstyle');
assert.equal(rules.namedChance(2),0,'rare and below must remain ordinary gear');
assert(rules.namedChance(3)>0&&rules.namedChance(4)>rules.namedChance(3),'Epic/Legendary named relic chance must be bounded and rarity-sensitive');
assert.equal(Number((rules.namedChance(3,.09)-rules.namedChance(3)).toFixed(2)),.09,'Relic Hall may add at most a bounded +9% named chance');
assert.deepEqual([0,1,2,3].map(x=>rules.focusWeight(x)),[0,.5,.65,.8],'Relic Hall focus strength must remain bounded by construction level');
const slotCounts=Object.fromEntries(rules.SLOTS.map(slot=>[slot,0]));
for(let i=0;i<600;i++) slotCounts[rules.namedPieceSlot(i)]++;
assert(rules.SLOTS.every(slot=>slotCounts[slot]>=80&&slotCounts[slot]<=120),'named relic slot hashing must stay approximately uniform across all six authored pieces');
assert.equal(rules.normalizeFocusId('void_court',59,{}),'','unreached deep set cannot be focused without a recovered clue');
assert.equal(rules.normalizeFocusId('void_court',60,{}),'void_court','reaching a set band unlocks research focus');
assert.notEqual(rules.chooseSet(65,1).id,'star_hunt','chosen probe should have a non-focused deterministic baseline');
assert.equal(rules.chooseSet(65,1,'star_hunt',3).id,'star_hunt','level-three research bias may deterministically redirect an eligible named relic');

const set=rules.SETS[0];
const equip={};
for(const slot of rules.SLOTS.slice(0,4)) equip[slot]={setId:set.id,setPiece:slot};
assert.equal(rules.equippedCounts(equip)[set.id],4);
assert.equal(rules.activeBonuses(equip).filter(x=>x.setId===set.id).length,2,'four pieces activate 2/4 but not 6');
assert.equal(rules.activeCapstones(equip).length,0,'partial sets must not activate six-piece capstones');
for(const slot of rules.SLOTS.slice(4)) equip[slot]={setId:set.id,setPiece:slot};
assert.equal(rules.activeCapstones(equip).length,1,'all six specified pieces are required for the set capstone');
const ledger={}; ledger[set.id+':weapon']=1; ledger[set.id+':ring']=1;
assert.equal(rules.collectionProgress(ledger,set.id).found,2);

assert(core.includes("window.DE_SET_RULES_V180")&&core.includes("authority !== 'named-set-policy'"),'core must consume the pure named-set authority');
assert(core.includes("const affixCount = namedSet ? Math.min(1, RARITIES[rarity].affixes)"),'named relics must not be drowned in random affixes');
assert(core.includes('function registerReturnedRelics(items)'),'core must own safe-return collection mutation');
const escapeStart=core.indexOf('function useEscape()'),deathStart=core.indexOf('function greedyDeathReturn(',escapeStart);
const escapeBlock=core.slice(escapeStart,deathStart);
assert(escapeBlock.includes('registerReturnedRelics(['),'safe return must catalog relics');
const deathBlock=core.slice(deathStart,core.indexOf('const fullscreenElement',deathStart));
assert(!deathBlock.includes('registerReturnedRelics('),'death must not create permanent relic discoveries');
assert(core.includes("service:'relics', zh:'遗物书记', en:'Relic Curator'"),'walkable town must have a Relic Curator hotspot');
assert(core.includes("ui('遗物馆','RELICS')"),'town growth art must visibly gain a Relic Hall marker');
assert(core.includes('function renderTownRelics()'),'town must render a persistent relic archive');
assert(core.includes('function completedRelicSets(')&&core.includes("recordTownChronicle({ kind:'set', id:set.id })"),'completing all six pieces must become a first-class town-history event');
assert(core.includes("if (row.kind === 'set') return !!SET_RULES.setById(row.id)"),'completed-set chronicle rows must sanitize through the named-set authority');
assert(core.includes('六件遗物终于重新聚在一起')&&core.includes('All six relics stand together again'),'safe return with a completed set must deliver explicit collection payoff');
assert(core.includes('relicFocusSet')&&core.includes('function selectRelicFocus(setId)'),'core must persist and expose Relic Hall research focus');
assert(core.includes("SET_RULES.chooseSet(d, namedHash, meta && meta.relicFocusSet, townWorkLevel('relics'))"),'item generation must consume the bounded research focus through set policy');
assert(core.includes('const namedEntropy = Math.floor(roll * 4294967296) >>> 0')&&core.includes("classId, namedEntropy].join('|')"),'named identity must reuse already-consumed per-drop entropy instead of collapsing same-floor/base drops onto one relic piece');
assert(core.includes('slot = SET_RULES.namedPieceSlot(pieceHash)')&&core.includes('namedRelicBaseForSlot(slot, d, pieceHash >>> 3)'),'named relic generation must detach six-piece collection slots from ordinary-loot slot scarcity without consuming extra RNG');
assert(core.includes("setStat('fixedDr')")&&core.includes("setStat('crit')")&&core.includes("setStat('skillHaste')"),'set bonuses must affect canonical combat/stat paths');
assert(core.includes('for (const row of SET_RULES.activeCapstones(player.equip))'),'complete named sets must feed their capstone through the existing canonical mechanic engine');
assert(core.includes("b.capstone ? '✦ ' : ''")&&css.includes('.relic-set-bonuses span.capstone'),'six-piece capstones need first-class presentation instead of another anonymous stat line');
assert(core.includes("ui('附带 · ','Secondary · ')")&&css.includes('.named-relic-secondary'),'the single random secondary affix on named relics must be visually subordinate to relic identity');

for(const [name,html] of [['zh',zh],['en',en]]){
  const town=html.slice(html.indexOf('id="town-screen"'),html.indexOf('id="achv-screen"'));
  assert.equal((town.match(/data-town-page="/g)||[]).length,7,name+' must expose seven town tabs');
  assert.equal((town.match(/data-town-page-panel="/g)||[]).length,7,name+' must expose seven town panels');
  assert(town.includes('data-town-page="relics"')&&town.includes('id="town-relics"'),name+' must expose Relic Hall');
  assert(html.includes('game/domain/inventory/set-rules-v180.js?v=181'),name+' must boot set policy before core');
}
assert(!/[\u3400-\u9fff]/.test(en),'English authored route must remain CJK-free');
assert(locale.includes('item.namedEn'),'locale must preserve fixed English relic names');
assert(css.includes('.relic-set-card')&&css.includes('.named-relic-lore'),'relic archive and lore require dedicated presentation');
assert(css.includes('.relic-research')&&css.includes('.relic-focus-action'),'Relic Hall research needs dedicated responsive presentation');
assert(manifest.includes('game/domain/inventory/set-rules-v180.js'),'release allowlist must ship set policy');
assert.equal(authority.authorities.namedRelicSetPolicy,'game/domain/inventory/set-rules-v180.js');
assert.equal(authority.authorities.namedRelicResearchPolicy,'game/domain/inventory/set-rules-v180.js');
assert.equal(authority.authorities.namedRelicCapstonePolicy,'game/domain/inventory/set-rules-v180.js');
assert.equal(authority.authorities.relicCollectionPersistence,'game/core/game.js');
assert.equal(authority.authorities.relicResearchPersistence,'game/core/game.js');

console.log('named_relic_sets_v180=PASS');
