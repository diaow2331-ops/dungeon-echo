/* Dungeon Echo v1.8.0 named relic-set policy.
 *
 * Pure deterministic authority for fixed six-piece named sets, piece identity,
 * lore, collection metadata and threshold stat bonuses.
 * Core remains sole owner of RNG consumption, runtime state, drops, combat,
 * persistence, UI, rendering and input.
 */
(() => {
  'use strict';

  const SLOTS = Object.freeze(['weapon','armor','helmet','boots','ring','amulet']);

  const weaponNames = (warrior,ranger,mage,assassin) => Object.freeze({warrior,ranger,mage,assassin});

  const SETS = Object.freeze([
    Object.freeze({
      id:'ashen_watch', minDepth:1, maxDepth:42,
      zh:'灰烬守望', en:'Ashen Watch',
      zhStory:'旧城墙倒下前，最后六名守夜人把名字从军册上划去，只留下六件东西。后来的人说，那一夜没有一个人逃。',
      enStory:'Before the old wall fell, the last six watchmen struck their names from the roster and left only six relics. Later generations said none of them fled that night.',
      pieces:Object.freeze({
        weapon:Object.freeze({ zh:weaponNames('断誓剑','烽火弓','灰烬杖','静默刃'), en:weaponNames('Oathbreaker Sword','Beacon Bow','Ashen Staff','Silent Knife'), zhLore:'它的刃口没有卷。守夜人不是因为武器坏了才失守。', enLore:'Its edge never rolled. The watch did not fall because their weapons failed.' }),
        armor:Object.freeze({ zh:'未眠者的旧甲', en:'Old Mail of the Sleepless', zhLore:'胸口内侧刻着六道短痕，第七道只划了一半。', enLore:'Six short marks are cut inside the breastplate. A seventh stops halfway.' }),
        helmet:Object.freeze({ zh:'最后一班岗的铁盔', en:'Helm of the Last Watch', zhLore:'盔沿被烟熏黑，里面却还留着一点松脂与雨水的味道。', enLore:'Smoke blackened the rim, yet the inside still smells faintly of pine resin and rain.' }),
        boots:Object.freeze({ zh:'巡墙者的夜行靴', en:'Night Boots of the Wall-Walker', zhLore:'鞋底磨损只在外缘——主人总沿着同一段城墙来回走。', enLore:'Only the outer soles are worn. Their owner paced the same length of wall for years.' }),
        ring:Object.freeze({ zh:'第七码灯戒', en:'Seventh Lamp Ring', zhLore:'城墙上明明只有六盏灯。没人知道第七盏为谁而点。', enLore:'The wall records only six lamps. No one remembers who the seventh was meant for.' }),
        amulet:Object.freeze({ zh:'黎明未至的护符', en:'Amulet Before Dawn', zhLore:'背面只写着一句话：天亮以前，不许关门。', enLore:'One sentence is carved on the back: Do not close the gate before dawn.' }),
      }),
      bonuses:Object.freeze([
        Object.freeze({ pieces:2, id:'watch_line', zh:'守线：固定减伤 +2', en:'Hold the Line: Fixed DR +2', stats:Object.freeze({fixedDr:2}) }),
        Object.freeze({ pieces:4, id:'watch_flask', zh:'余烬药酒：药水治疗 +20%', en:'Ember Draught: Potion healing +20%', stats:Object.freeze({potionBoost:20}) }),
        Object.freeze({ pieces:6, id:'watch_home', zh:'全员归岗：击杀回复 +5', en:'All Posts Manned: Kill healing +5', stats:Object.freeze({regen:5}) }),
      ]),
    }),
    Object.freeze({
      id:'star_hunt', minDepth:28, maxDepth:76,
      zh:'逐星遗誓', en:'Star-Hunter Oath',
      zhStory:'有人相信深渊顶部的星光会移动，于是六名猎手用一生追逐那条“会逃跑的天河”。他们没有找到出口，却留下了最准确的深层地图。',
      enStory:'Six hunters spent their lives chasing a river of starlight they swore moved above the abyss. They never found an exit, but left the most accurate deep maps ever drawn.',
      pieces:Object.freeze({
        weapon:Object.freeze({ zh:weaponNames('逐星重刃','星索长弓','测天仪杖','猎轨短刃'), en:weaponNames('Star-Chaser Greatblade','Starline Longbow','Astrolabe Staff','Trail-Hunter Knife'), zhLore:'刃脊上不是血槽，而是一条从一层延伸到七十层的路线。', enLore:'The groove along it is not for blood; it is a route from Floor 1 to Floor 70.' }),
        armor:Object.freeze({ zh:'逆风披甲', en:'Upwind Harness', zhLore:'甲片朝着常理相反的方向叠压，据说能在坠落时兜住风。', enLore:'Its plates overlap the wrong way, supposedly to catch air during a fall.' }),
        helmet:Object.freeze({ zh:'无月观星罩', en:'Moonless Star Hood', zhLore:'遮住双眼以后，反而能看见地底最微弱的反光。', enLore:'Covering the eyes somehow makes the faintest underground reflections easier to see.' }),
        boots:Object.freeze({ zh:'折返者的轻靴', en:'Switchback Boots', zhLore:'左右鞋跟高度不同，是为了适应一条早已坍塌的斜井。', enLore:'The heels differ in height, made for an inclined shaft that collapsed long ago.' }),
        ring:Object.freeze({ zh:'猎星人的校准环', en:'Star-Hunter Calibration Ring', zhLore:'转动内圈时，会停在一个没有刻度的位置。', enLore:'Turn the inner band and it stops at a place with no marking.' }),
        amulet:Object.freeze({ zh:'第六张星图', en:'The Sixth Star Chart', zhLore:'前五张图都画着星空，这一张只画了一扇门。', enLore:'The first five charts show stars. The sixth shows only a door.' }),
      }),
      bonuses:Object.freeze([
        Object.freeze({ pieces:2, id:'hunt_eye', zh:'校准：暴击 +6%', en:'Calibration: Crit +6%', stats:Object.freeze({crit:6}) }),
        Object.freeze({ pieces:4, id:'hunt_tempo', zh:'追迹：技能冷却 -1 回合（仍受最低 2 回合限制）', en:'Trailcraft: Skill cooldown -1 turn (minimum 2 still applies)', stats:Object.freeze({skillHaste:1}) }),
        Object.freeze({ pieces:6, id:'hunt_focus', zh:'星落一击：暴击伤害强化 +30', en:'Falling Star: Critical power +30', stats:Object.freeze({critPower:30}) }),
      ]),
    }),
    Object.freeze({
      id:'void_court', minDepth:60, maxDepth:999,
      zh:'虚空王庭', en:'Void Court',
      zhStory:'最深处没有王国，但有人仍然为一个不存在的王准备冠冕、礼服与宴席。六件遗物的尺寸属于六个不同的人。',
      enStory:'There is no kingdom in the deepest dark, yet someone prepared a crown, court dress and banquet for a king who never existed. The six relics fit six different people.',
      pieces:Object.freeze({
        weapon:Object.freeze({ zh:weaponNames('无王之剑','空席礼弓','黑冠权杖','侍宴短匕'), en:weaponNames('Sword Without a King','Ceremonial Bow of the Empty Seat','Black-Crown Scepter','Banquet Attendant Dagger'), zhLore:'剑柄上有王室纹章，纹章中央却故意留白。', enLore:'A royal crest marks the hilt, but its center was deliberately left blank.' }),
        armor:Object.freeze({ zh:'空王座前的礼服', en:'Court Dress Before the Empty Throne', zhLore:'衣服有六层衬里，每一层都缝着不同人的名字。', enLore:'Six inner layers carry six different names stitched into the seams.' }),
        helmet:Object.freeze({ zh:'没有主人的黑冠', en:'Black Crown Without an Owner', zhLore:'冠圈太大，任何人戴上都会滑到眼前。', enLore:'The crown is too large; on any head it slips down over the eyes.' }),
        boots:Object.freeze({ zh:'觐见者的无声靴', en:'Silent Audience Boots', zhLore:'鞋底从未沾过泥，却磨得像走过一万级台阶。', enLore:'The soles bear no mud, yet are worn as if they climbed ten thousand steps.' }),
        ring:Object.freeze({ zh:'第零席指环', en:'Ring of Seat Zero', zhLore:'宴席名单从第一席开始，这枚戒指偏偏刻着“0”。', enLore:'The banquet list begins at Seat One. This ring is engraved with a zero.' }),
        amulet:Object.freeze({ zh:'谢幕前的王印', en:'Royal Seal Before the Curtain Falls', zhLore:'印面没有字，只有一扇从内部被推开的门。', enLore:'The seal bears no words, only a door being pushed open from the inside.' }),
      }),
      bonuses:Object.freeze([
        Object.freeze({ pieces:2, id:'court_blood', zh:'空宴：吸血 +5%', en:'Empty Feast: Leech +5%', stats:Object.freeze({leech:5}) }),
        Object.freeze({ pieces:4, id:'court_gaze', zh:'觐见：暴击 +10%', en:'Audience: Crit +10%', stats:Object.freeze({crit:10}) }),
        Object.freeze({ pieces:6, id:'court_decree', zh:'无王敕令：暴击伤害强化 +45', en:'Kingless Decree: Critical power +45', stats:Object.freeze({critPower:45}) }),
      ]),
    }),
  ]);

  const SET_BY_ID = Object.freeze(Object.fromEntries(SETS.map(row => [row.id,row])));
  const clampInt = (v,lo,hi) => Math.max(lo,Math.min(hi,Math.floor(Number(v)||0)));

  function normalizeClassId(id) {
    return ['warrior','ranger','mage','assassin'].includes(id) ? id : 'warrior';
  }
  function setById(id) { return SET_BY_ID[String(id||'')] || null; }
  function piece(setId,slot,classId='warrior') {
    const set=setById(setId);
    if(!set || !SLOTS.includes(slot)) return null;
    const row=set.pieces[slot];
    if(!row) return null;
    const cid=normalizeClassId(classId);
    return Object.freeze({
      setId:set.id, setNameZh:set.zh, setNameEn:set.en, slot,
      zh:typeof row.zh==='string'?row.zh:row.zh[cid],
      en:typeof row.en==='string'?row.en:row.en[cid],
      zhLore:row.zhLore, enLore:row.enLore,
    });
  }
  function eligibleSets(depth) {
    const d=Math.max(1,Math.floor(Number(depth)||1));
    return Object.freeze(SETS.filter(row=>d>=row.minDepth&&d<=row.maxDepth));
  }
  function namedChance(rarity) {
    const r=clampInt(rarity,0,4);
    return r>=4?0.58:r===3?0.22:0;
  }
  function chooseSet(depth,hashValue=0) {
    const pool=eligibleSets(depth);
    if(!pool.length) return null;
    return pool[Math.abs(Math.floor(Number(hashValue)||0))%pool.length];
  }
  function equippedCounts(equip) {
    const out={};
    if(!equip||typeof equip!=='object') return out;
    for(const slot of SLOTS){
      const item=equip[slot];
      if(item&&SET_BY_ID[item.setId]) out[item.setId]=(out[item.setId]||0)+1;
    }
    return out;
  }
  function activeBonuses(equip) {
    const counts=equippedCounts(equip), rows=[];
    for(const set of SETS){
      const count=counts[set.id]||0;
      for(const bonus of set.bonuses) if(count>=bonus.pieces) rows.push(Object.freeze({setId:set.id,count,...bonus}));
    }
    return Object.freeze(rows);
  }
  function statBonuses(equip) {
    const out={};
    for(const row of activeBonuses(equip)) for(const [key,val] of Object.entries(row.stats||{}))
      out[key]=(out[key]||0)+(Number(val)||0);
    return Object.freeze(out);
  }
  function signatureStats(setId,slot,depth) {
    const d=Math.max(1,Math.floor(Number(depth)||1));
    if(setId==='ashen_watch'){
      if(slot==='weapon') return Object.freeze({atk:1+Math.floor(d/20)});
      if(slot==='armor') return Object.freeze({def:1+Math.floor(d/30)});
      if(slot==='helmet') return Object.freeze({def:1});
      if(slot==='boots') return Object.freeze({hp:8+Math.floor(d/4)});
      if(slot==='ring') return Object.freeze({hp:10+Math.floor(d/3)});
      if(slot==='amulet') return Object.freeze({regen:2});
    }
    if(setId==='star_hunt'){
      if(slot==='weapon') return Object.freeze({atk:2+Math.floor(d/18)});
      if(slot==='armor') return Object.freeze({def:1});
      if(slot==='helmet') return Object.freeze({crit:3});
      if(slot==='boots') return Object.freeze({crit:2});
      if(slot==='ring') return Object.freeze({crit:4});
      if(slot==='amulet') return Object.freeze({atk:1+Math.floor(d/25)});
    }
    if(setId==='void_court'){
      if(slot==='weapon') return Object.freeze({atk:3+Math.floor(d/15)});
      if(slot==='armor') return Object.freeze({def:2+Math.floor(d/35)});
      if(slot==='helmet') return Object.freeze({crit:4});
      if(slot==='boots') return Object.freeze({leech:3});
      if(slot==='ring') return Object.freeze({leech:4});
      if(slot==='amulet') return Object.freeze({crit:5});
    }
    return Object.freeze({});
  }
  function collectionKey(item) {
    return item&&SET_BY_ID[item.setId]&&SLOTS.includes(item.setPiece) ? item.setId+':'+item.setPiece : '';
  }
  function collectionProgress(ledger,setId) {
    const set=setById(setId); if(!set) return Object.freeze({found:0,total:SLOTS.length,slots:Object.freeze([])});
    const foundSlots=SLOTS.filter(slot=>!!(ledger&&ledger[set.id+':'+slot]));
    return Object.freeze({found:foundSlots.length,total:SLOTS.length,slots:Object.freeze(foundSlots)});
  }

  const api=Object.freeze({
    version:'v1.8.0-development',
    authority:'named-set-policy',
    SLOTS, SETS,
    setById, piece, eligibleSets, namedChance, chooseSet,
    equippedCounts, activeBonuses, statBonuses, signatureStats,
    collectionKey, collectionProgress,
  });

  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(typeof window!=='undefined') window.DE_SET_RULES_V180=api;
})();
