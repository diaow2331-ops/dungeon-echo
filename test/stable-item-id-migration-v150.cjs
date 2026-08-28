'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'stable-item-id-migration-v150.js'),'utf8');

const run={version:2,profileId:'classic-100',player:{inv:[{name:'稀有·铁剑',slot:'weapon',rarity:2,stats:{atk:4}}],equip:{weapon:{name:'皮甲',slot:'armor',rarity:1}}},items:[{type:'equip',item:{name:'铜戒指',slot:'ring',rarity:0}}],shopStock:[{kind:'equip',item:{name:'学徒法杖',slot:'weapon',rarity:3}}]};
const meta={v:1,classId:'warrior',bag:[{name:'匕首',slot:'weapon',rarity:0}],stash:[{name:'板甲',slot:'armor',rarity:2}],equip:{ring:{name:'守护之戒',slot:'ring',rarity:2}},wheelSlots:[{kind:'equip',item:{name:'月石坠',slot:'amulet',rarity:1}}]};
const store=new Map([['de-run-v6',JSON.stringify(run)],['de-greedy-meta-v1',JSON.stringify(meta)],['unrelated-key','keep-me']]);

global.window=global;
global.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
global.DE_LOCALE_DATA={
  baseId:item=>({
    '稀有·铁剑':'weapon.warrior.iron-sword','皮甲':'armor.leather','铜戒指':'ring.copper','学徒法杖':'weapon.mage.apprentice-staff',
    '匕首':'weapon.assassin.dagger','板甲':'armor.plate','守护之戒':'ring.guardian','月石坠':'amulet.moonstone'
  })[item.name]||`legacy.${item.slot}.${item.name}`,
  rarityId:i=>['common','fine','rare','epic','legendary'][Math.max(0,Math.min(4,Number(i)||0))],
};
global.DE_TEST={player:{inv:[],equip:{}},items:[],meta:null,getShopStock:()=>[]};
vm.runInThisContext(src,{filename:'stable-item-id-migration-v150.js'});

const outRun=JSON.parse(store.get('de-run-v6')),outMeta=JSON.parse(store.get('de-greedy-meta-v1'));
assert.strictEqual(outRun.player.inv[0].name,'稀有·铁剑','legacy display name must be preserved');
assert.strictEqual(outRun.player.inv[0].baseId,'weapon.warrior.iron-sword');
assert.strictEqual(outRun.player.inv[0].rarityId,'rare');
assert.strictEqual(outRun.player.inv[0].slotId,'weapon');
assert.strictEqual(outRun.items[0].item.baseId,'ring.copper','ground equipment gains stable identity');
assert.strictEqual(outRun.shopStock[0].item.baseId,'weapon.mage.apprentice-staff','saved shop equipment gains stable identity');
assert.strictEqual(outMeta.stash[0].baseId,'armor.plate','stash equipment gains stable identity');
assert.strictEqual(outMeta.wheelSlots[0].item.baseId,'amulet.moonstone','wheel equipment gains stable identity');
assert.strictEqual(store.get('unrelated-key'),'keep-me','migration must not touch unrelated storage');
assert.deepStrictEqual(global.__DE_STABLE_ITEM_ID_MIGRATION_V150.keys,{run:'de-run-v6',meta:'de-greedy-meta-v1'});
assert(global.__DE_STABLE_ITEM_ID_MIGRATION_V150.report.writes===2,'only existing run/meta blobs are rewritten');
assert(!/setInterval|requestAnimationFrame|MutationObserver/.test(src),'migration is one-shot and has no follower loop');
assert(!/removeItem\(/.test(src),'migration never deletes saves');
new Function(src);
console.log('stable_item_id_migration_v150=PASS');
