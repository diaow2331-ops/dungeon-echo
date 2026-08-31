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
        Object.freeze({ pieces:6, id:'watch_home', zh:'全员归岗：等待后，下一次敌人直击伤害 -50%', en:'All Posts Manned: after Wait, the next direct enemy hit deals -50%', stats:Object.freeze({}), capstone:Object.freeze({ mechanic:'brace', power:2 }) }),
      ]),
    }),
    Object.freeze({
      id:'drowned_bell', minDepth:12, maxDepth:55,
      zh:'沉钟航团', en:'Drowned Bell Company',
      zhStory:'一支没有海的航团把深渊当成航道。他们在每次出发前敲一次铜钟，直到某天钟声从地下更深处先响了回来。',
      enStory:'A company with no sea treated the abyss as a shipping route. They rang one bronze bell before every departure, until one day the bell answered first from somewhere deeper below.',
      pieces:Object.freeze({
        weapon:Object.freeze({ zh:weaponNames('镇潮砍刀','潮讯长弓','沉钟仪杖','锚链短刃'), en:weaponNames('Tidebreaker Cleaver','Tidings Longbow','Drowned-Bell Staff','Anchor-Chain Knife'), zhLore:'刃根有一圈干涸盐霜。没人能解释地底为什么会留下海盐。', enLore:'A ring of dried salt crusts the base of the blade. No one can explain sea salt this far underground.' }),
        armor:Object.freeze({ zh:'浸盐航衣', en:'Salt-Soaked Voyage Coat', zhLore:'布料硬得像晒干的帆，夹层里却缝着一张从未抵达任何港口的货单。', enLore:'The cloth is stiff as a dried sail. Inside is a cargo manifest for a port no one ever reached.' }),
        helmet:Object.freeze({ zh:'听潮铜盔', en:'Tide-Listening Helm', zhLore:'贴近耳朵时能听见极轻的回声，像有人隔着很深的水敲钟。', enLore:'Held close to the ear, it carries a faint echo like a bell struck beneath very deep water.' }),
        boots:Object.freeze({ zh:'逆流长靴', en:'Upcurrent Boots', zhLore:'鞋底钉子全部向后倾斜，像主人一生都在逆着某种看不见的水流前进。', enLore:'Every nail in the sole leans backward, as if its owner spent a lifetime walking against an unseen current.' }),
        ring:Object.freeze({ zh:'第十三声钟戒', en:'Thirteenth Bell Ring', zhLore:'航团日志只记录十二次钟响。戒面内侧偏偏刻着十三。', enLore:'The company log records twelve bell strokes. The inner band is engraved with thirteen.' }),
        amulet:Object.freeze({ zh:'无港航标', en:'Beacon Without a Harbor', zhLore:'小小的金属牌永远指向地下，而不是任何已知方位。', enLore:'The tiny metal marker always points downward, never toward any known direction.' }),
      }),
      bonuses:Object.freeze([
        Object.freeze({ pieces:2, id:'bell_brace', zh:'压舱：固定减伤 +1', en:'Ballast: Fixed DR +1', stats:Object.freeze({fixedDr:1}) }),
        Object.freeze({ pieces:4, id:'bell_drain', zh:'回潮：吸血 +4%', en:'Returning Tide: Leech +4%', stats:Object.freeze({leech:4}) }),
        Object.freeze({ pieces:6, id:'bell_ration', zh:'第十三声：喝下药水时直接清除重伤', en:'Thirteenth Bell: drinking a Potion clears Grievous immediately', stats:Object.freeze({}), capstone:Object.freeze({ mechanic:'clarity', power:2 }) }),
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
        Object.freeze({ pieces:6, id:'hunt_focus', zh:'星落一击：施放职业技能后，下一回合的下一次普攻伤害 +40%', en:'Falling Star: after a class skill, the next basic attack next turn deals +40%', stats:Object.freeze({}), capstone:Object.freeze({ mechanic:'echo_edge', power:2 }) }),
      ]),
    }),
    Object.freeze({
      id:'rust_saints', minDepth:42, maxDepth:90,
      zh:'锈钟圣徒', en:'Rust-Bell Saints',
      zhStory:'六名修士相信地牢的齿轮声是神谕。他们把坏掉的机械带回礼拜堂，一件件擦亮，最后却发现钟从来不是为人敲的。',
      enStory:'Six monks believed the dungeon gears spoke prophecy. They carried broken mechanisms back to their chapel and polished them one by one, until they learned the bell was never tolling for people.',
      pieces:Object.freeze({
        weapon:Object.freeze({ zh:weaponNames('赎罪齿剑','钟舌猎弓','旧礼仪杖','祷轮短刃'), en:weaponNames('Penitent Gearblade','Clapper Huntbow','Old-Liturgy Staff','Prayer-Wheel Knife'), zhLore:'武器护手嵌着一枚不再转动的铜齿轮，齿间卡着干掉的蜡。', enLore:'A stopped bronze gear is set into the guard, with dried chapel wax packed between its teeth.' }),
        armor:Object.freeze({ zh:'锈圣衣', en:'Rusted Vestment', zhLore:'胸甲本该是白色，如今只剩被机油浸透的褐色。内衬依旧一尘不染。', enLore:'The cuirass was once white and is now brown with machine oil. The inner lining remains spotless.' }),
        helmet:Object.freeze({ zh:'听谕兜帽', en:'Hood of the Heard Omen', zhLore:'罩住耳朵后，佩戴者只能听见自己的呼吸和远处极慢的金属摩擦声。', enLore:'With the ears covered, the wearer hears only breathing and a very slow scrape of metal somewhere far away.' }),
        boots:Object.freeze({ zh:'跪行者铁靴', en:'Iron Boots of the Kneeling Pilgrim', zhLore:'膝部没有磨损，鞋尖却磨平了。修士们所谓的“跪行”似乎并不是跪着走。', enLore:'The knees show no wear, yet the toes are ground flat. The saints’ “kneeling pilgrimage” was apparently not done on their knees.' }),
        ring:Object.freeze({ zh:'停摆时环', en:'Stopped-Hour Ring', zhLore:'内圈有十二格刻度，却永远停在第七格。无论摔落还是敲击都不会移动。', enLore:'Twelve marks circle the band, yet it always stops at the seventh. Neither falls nor hammer blows move it.' }),
        amulet:Object.freeze({ zh:'无声钟舌', en:'Silent Bell Clapper', zhLore:'这枚小钟舌没有配套的钟。摇动时也没有声音，但附近的火焰会轻轻偏向它。', enLore:'This small clapper has no bell and makes no sound, yet nearby flames lean toward it when shaken.' }),
      }),
      bonuses:Object.freeze([
        Object.freeze({ pieces:2, id:'saint_timing', zh:'静听：暴击 +5%', en:'Listen: Crit +5%', stats:Object.freeze({crit:5}) }),
        Object.freeze({ pieces:4, id:'saint_shell', zh:'旧礼甲：固定减伤 +2', en:'Old Rite Mail: Fixed DR +2', stats:Object.freeze({fixedDr:2}) }),
        Object.freeze({ pieces:6, id:'saint_return', zh:'听钟入定：等待时额外恢复 2 回合技能冷却', en:'Listen Between Bells: Wait restores 2 additional turns of skill cooldown', stats:Object.freeze({}), capstone:Object.freeze({ mechanic:'meditate', power:2 }) }),
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
        Object.freeze({ pieces:6, id:'court_decree', zh:'无王敕令：普攻击杀敌人时额外返还 2 回合技能冷却', en:'Kingless Decree: basic-attack kills refund 2 additional turns of skill cooldown', stats:Object.freeze({}), capstone:Object.freeze({ mechanic:'reaper', power:2 }) }),
      ]),
    }),
    Object.freeze({
      id:'shattered_moon', minDepth:72, maxDepth:999,
      zh:'碎月遗仪', en:'Shattered Moon Rite',
      zhStory:'一座没有天空的观测台曾坚持记录“月相”。最后一页只写着：月亮不是碎了，是有人把它一片片搬到了地下。',
      enStory:'An observatory with no sky kept recording “moon phases.” Its final page says only: the moon did not shatter; someone carried it underground piece by piece.',
      pieces:Object.freeze({
        weapon:Object.freeze({ zh:weaponNames('缺月长刃','弦月猎弓','月蚀仪杖','碎辉短刃'), en:weaponNames('Crescent-Missing Blade','Crescent Huntbow','Eclipse Instrument Staff','Shardglow Knife'), zhLore:'刃面像镜子，却永远映不出佩戴者的脸，只能映出头顶不存在的月光。', enLore:'The blade is mirror-bright yet never reflects its bearer, only moonlight from a sky that is not there.' }),
        armor:Object.freeze({ zh:'无夜观测服', en:'Nightless Observatory Coat', zhLore:'衣领内侧缝着三十张极小的月相图，其中有四张从未出现在任何历法里。', enLore:'Thirty tiny lunar diagrams line the collar. Four of the phases exist in no known calendar.' }),
        helmet:Object.freeze({ zh:'碎辉目镜', en:'Shardglow Visor', zhLore:'镜片有一道贯穿中央的裂缝。透过裂缝看火焰时，火会变成冷白色。', enLore:'A crack runs through the lens. Flames seen through it turn cold white.' }),
        boots:Object.freeze({ zh:'落月无声靴', en:'Silent Moonfall Boots', zhLore:'鞋底没有尘土，只有极细的银粉。银粉在黑暗里会缓慢向上飘。', enLore:'The soles hold no dust, only fine silver powder that drifts upward in darkness.' }),
        ring:Object.freeze({ zh:'蚀环', en:'Eclipse Ring', zhLore:'戒面由两层金属组成。外环每天都会比前一天多遮住内环一点。', enLore:'Two metals form the band. Each day the outer ring covers a little more of the inner one.' }),
        amulet:Object.freeze({ zh:'第零片月石', en:'Moonstone Shard Zero', zhLore:'档案把月石碎片从“一”开始编号，这一片却比所有记录都更早。', enLore:'Archive shards are numbered from One. This fragment is older than every recorded piece and is marked Zero.' }),
      }),
      bonuses:Object.freeze([
        Object.freeze({ pieces:2, id:'moon_sip', zh:'冷辉：药水治疗 +20%', en:'Cold Glow: Potion healing +20%', stats:Object.freeze({potionBoost:20}) }),
        Object.freeze({ pieces:4, id:'moon_cycle', zh:'缺相循环：技能冷却 -1 回合（仍受最低 2 回合限制）', en:'Missing Phase: Skill cooldown -1 turn (minimum 2 still applies)', stats:Object.freeze({skillHaste:1}) }),
        Object.freeze({ pieces:6, id:'moon_break', zh:'碎月余辉：施放职业技能后，下一次敌人直击伤害 -40%', en:'Shardglow Afterimage: after a class skill, the next direct enemy hit deals -40%', stats:Object.freeze({}), capstone:Object.freeze({ mechanic:'afterimage', power:2 }) }),
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
  function namedChance(rarity, relicHallBonus=0, expeditionBonus=0) {
    const r=clampInt(rarity,0,4);
    const base=r>=4?0.58:r===3?0.22:0;
    if(base<=0) return 0;
    const hall=Math.max(0,Math.min(0.09,Number(relicHallBonus)||0));
    const contract=Math.max(0,Math.min(0.16,Number(expeditionBonus)||0));
    return Math.min(0.84,base+hall+contract);
  }
  function focusWeight(relicHallLevel=0) {
    const lvl=clampInt(relicHallLevel,0,3);
    return [0,0.50,0.65,0.80][lvl];
  }
  function focusableSets(bestDepth,ledger) {
    const depth=Math.max(0,Math.floor(Number(bestDepth)||0));
    return Object.freeze(SETS.filter(set => depth>=set.minDepth || collectionProgress(ledger,set.id).found>0));
  }
  function normalizeFocusId(id,bestDepth,ledger) {
    const value=String(id||'');
    return focusableSets(bestDepth,ledger).some(set=>set.id===value) ? value : '';
  }
  function namedPieceSlot(hashValue=0) {
    let h=(Math.floor(Number(hashValue)||0)>>>0);
    // Avalanche before modulo so authored six-piece slots do not inherit low-bit patterns
    // from a caller's deterministic hash. This does not consume runtime RNG.
    h^=h>>>16; h=Math.imul(h,0x7feb352d); h^=h>>>15; h=Math.imul(h,0x846ca68b); h^=h>>>16;
    return SLOTS[(h>>>0)%SLOTS.length];
  }
  function chooseSet(depth,hashValue=0,focusSetId='',relicHallLevel=0) {
    const pool=eligibleSets(depth);
    if(!pool.length) return null;
    const focus=pool.find(row=>row.id===String(focusSetId||''));
    const weight=focus ? focusWeight(relicHallLevel) : 0;
    if(focus && weight>0) {
      const h=(Math.floor(Number(hashValue)||0)>>>0);
      const roll=((h ^ 0x9e3779b9)>>>0)/4294967295;
      if(roll<weight) return focus;
      const rest=pool.filter(row=>row.id!==focus.id);
      if(!rest.length) return focus;
      return rest[h%rest.length];
    }
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
  function activeCapstones(equip) {
    const rows=[];
    for(const bonus of activeBonuses(equip)) if(bonus.capstone) rows.push(Object.freeze({
      setId:bonus.setId, bonusId:bonus.id, mechanic:bonus.capstone.mechanic, power:bonus.capstone.power,
      zh:bonus.zh, en:bonus.en,
    }));
    return Object.freeze(rows);
  }
  function signatureScale(depth) {
    const d=Math.max(1,Math.floor(Number(depth)||1));
    return Object.freeze({
      atk:3+Math.floor(d/3),
      def:2+Math.floor(d/5),
      hp:18+Math.round(d*1.4),
      crit:5+Math.floor(d/12),
      leech:4+Math.floor(d/15),
      regen:3+Math.floor(d/6),
      thorns:3+Math.floor(d/8),
    });
  }
  const RELIC_SIGNATURE_MULT=1.45;
  function signaturePack(source) {
    const out={};
    for(const [key,value] of Object.entries(source||{})){
      const n=Math.max(0,Math.round((Number(value)||0)*RELIC_SIGNATURE_MULT));
      if(n>0) out[key]=n;
    }
    return Object.freeze(out);
  }
  function signatureStats(setId,slot,depth) {
    const s=signatureScale(depth);
    if(setId==='ashen_watch'){
      if(slot==='weapon') return signaturePack({atk:s.atk*.70,hp:s.hp*.45});
      if(slot==='armor') return signaturePack({def:s.def,hp:s.hp*.90});
      if(slot==='helmet') return signaturePack({def:s.def*.85,hp:s.hp*.65,regen:s.regen*.60});
      if(slot==='boots') return signaturePack({def:s.def*.50,hp:s.hp});
      if(slot==='ring') return signaturePack({hp:s.hp*.90,thorns:s.thorns*.90});
      if(slot==='amulet') return signaturePack({hp:s.hp*.75,regen:s.regen});
    }
    if(setId==='drowned_bell'){
      if(slot==='weapon') return signaturePack({atk:s.atk*.75,hp:s.hp*.25,leech:s.leech});
      if(slot==='armor') return signaturePack({def:s.def*.70,hp:s.hp});
      if(slot==='helmet') return signaturePack({hp:s.hp*.85,leech:s.leech});
      if(slot==='boots') return signaturePack({hp:s.hp,regen:s.regen*.80});
      if(slot==='ring') return signaturePack({hp:s.hp*.70,leech:s.leech*1.40});
      if(slot==='amulet') return signaturePack({hp:s.hp*.65,regen:s.regen*.90,leech:s.leech*.80});
    }
    if(setId==='star_hunt'){
      if(slot==='weapon') return signaturePack({atk:s.atk,crit:s.crit});
      if(slot==='armor') return signaturePack({def:s.def*.55,hp:s.hp*.75,crit:s.crit*.70});
      if(slot==='helmet') return signaturePack({hp:s.hp*.60,crit:s.crit*1.50});
      if(slot==='boots') return signaturePack({hp:s.hp*.65,atk:s.atk*.45,crit:s.crit});
      if(slot==='ring') return signaturePack({hp:s.hp*.45,atk:s.atk*.40,crit:s.crit*1.60});
      if(slot==='amulet') return signaturePack({hp:s.hp*.50,atk:s.atk*.65,crit:s.crit*1.20});
    }
    if(setId==='rust_saints'){
      if(slot==='weapon') return signaturePack({atk:s.atk*.80,thorns:s.thorns});
      if(slot==='armor') return signaturePack({def:s.def,hp:s.hp*.75,thorns:s.thorns*.70});
      if(slot==='helmet') return signaturePack({def:s.def*.90,hp:s.hp*.60,regen:s.regen*.80});
      if(slot==='boots') return signaturePack({hp:s.hp,thorns:s.thorns});
      if(slot==='ring') return signaturePack({hp:s.hp*.55,crit:s.crit*.80,thorns:s.thorns*.90});
      if(slot==='amulet') return signaturePack({hp:s.hp*.65,def:s.def*.55,regen:s.regen});
    }
    if(setId==='void_court'){
      if(slot==='weapon') return signaturePack({atk:s.atk,leech:s.leech*1.20});
      if(slot==='armor') return signaturePack({def:s.def*.90,hp:s.hp*.80,leech:s.leech*.70});
      if(slot==='helmet') return signaturePack({hp:s.hp*.55,crit:s.crit*1.20,leech:s.leech});
      if(slot==='boots') return signaturePack({hp:s.hp*.70,leech:s.leech*1.50});
      if(slot==='ring') return signaturePack({hp:s.hp*.45,crit:s.crit*1.10,leech:s.leech*1.60});
      if(slot==='amulet') return signaturePack({hp:s.hp*.45,atk:s.atk*.55,crit:s.crit*1.50});
    }
    if(setId==='shattered_moon'){
      if(slot==='weapon') return signaturePack({atk:s.atk*.90,crit:s.crit*1.20});
      if(slot==='armor') return signaturePack({hp:s.hp,crit:s.crit*.80});
      if(slot==='helmet') return signaturePack({hp:s.hp*.60,crit:s.crit*1.60});
      if(slot==='boots') return signaturePack({hp:s.hp*.85,crit:s.crit*1.20});
      if(slot==='ring') return signaturePack({hp:s.hp*.45,crit:s.crit*1.80,leech:s.leech*.80});
      if(slot==='amulet') return signaturePack({hp:s.hp*.55,crit:s.crit*1.30,leech:s.leech*1.40});
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
    setById, piece, eligibleSets, namedChance, focusWeight, focusableSets, normalizeFocusId, namedPieceSlot, chooseSet,
    equippedCounts, activeBonuses, statBonuses, activeCapstones, signatureStats,
    collectionKey, collectionProgress,
  });

  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(typeof window!=='undefined') window.DE_SET_RULES_V180=api;
})();
