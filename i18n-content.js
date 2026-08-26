/* Dungeon Echo content localization v2.
 * Display-only translator for legacy/core-generated text. It never mutates item, monster,
 * profile or save identities. DOM nodes remember their Chinese source; Canvas translates
 * only at fillText time, so switching zh/en is reversible without reloading the run.
 */
(() => {
  'use strict';
  if (typeof window==='undefined'||typeof document==='undefined'||window.__DE_I18N_CONTENT_V2)return;
  const L=window.DE_I18N,api=window.DE_TEST;
  if(!L||!api)return;

  const EXACT=Object.freeze({
    // rarity / consumables / world interactables
    '普通':'Common','精良':'Fine','稀有':'Rare','史诗':'Epic','传说':'Legendary',
    '治疗药水':'Healing Potion','传送卷轴':'Teleport Scroll','回城卷轴':'Return Scroll','保险符':'Insurance Charm','金币':'Gold','锈蚀钥匙':'Rusty Key','终焉之心':'Heart of the End',
    '上锁的宝箱':'Locked Chest','木桶':'Cask','无名神龛':'Nameless Shrine','余烬营地':'Ember Camp','蒙面商人':'Masked Merchant','装备':'Gear',

    // equipment — warrior
    '铁剑':'Iron Sword','阔剑':'Broadsword','战斧':'Battle Axe','符文之刃':'Runeblade','骑士阔剑':'Knight Broadsword','裂隙之刃':'Riftblade','碎甲战斧':'Sunder Axe','熔火之刃':'Molten Blade','陨星战斧':'Meteor Axe','无光巨刃':'Lightless Greatblade','终焉之刃':'Endblade','虚空斩裂刃':'Void Cleaver','湮灭巨剑':'Annihilation Greatsword',
    // ranger
    '猎弓':'Hunting Bow','强弓':'War Bow','鹰眼长弓':'Eagle-Eye Longbow','追猎之弓':'Stalker Bow','猎手长弓':'Hunter Longbow','裂空之弓':'Skycleaver Bow','幻影猎弓':'Phantom Bow','星辰猎弓':'Starhunter Bow','陨星长弓':'Meteor Longbow','无光猎弓':'Lightless Bow','终焉之弓':'Endbow','霜陨长弓':'Frostfall Longbow','虚空之弓':'Void Bow',
    // arcanist
    '学徒法杖':'Apprentice Staff','秘纹法杖':'Runed Staff','星光法杖':'Starlight Staff','奥术权杖':'Arcane Scepter','贤者法杖':'Sage Staff','虚空法杖':'Void Staff','星辉法杖':'Astral Staff','星骸法杖':'Starbone Staff','深渊权杖':'Abyssal Scepter','陨星法杖':'Meteor Staff','终焉法杖':'Endstaff','星蚀法杖':'Eclipse Staff','混沌之杖':'Chaos Staff',
    // assassin
    '匕首':'Dagger','淬毒匕首':'Venom Dagger','暗影匕首':'Shadow Dagger','夜刃':'Nightblade','双刃匕首':'Twin Dagger','裂魂匕首':'Soulripper Dagger','血牙匕首':'Bloodfang Dagger','星骸夜刃':'Starbone Nightblade','陨星匕首':'Meteor Dagger','无光夜刃':'Lightless Nightblade','终焉匕首':'End Dagger','霜陨夜刃':'Frostfall Nightblade','虚空夜刃':'Void Nightblade',
    // armor / rings / secondary slots
    '皮甲':'Leather Armor','锁子甲':'Chainmail','板甲':'Plate Armor','秘银铠':'Mithril Armor','虚空甲':'Void Armor','星骸甲':'Starbone Armor','陨星甲':'Meteor Armor','无光铠':'Lightless Armor','终焉甲':'End Armor','星蚀圣铠':'Eclipse Plate','混沌重甲':'Chaos Heavy Armor',
    '铜戒指':'Copper Ring','红宝石戒':'Ruby Ring','守护之戒':'Guardian Ring','永夜之戒':'Evernight Ring','星骸之戒':'Starbone Ring','陨星之戒':'Meteor Ring','深渊之戒':'Abyss Ring','终焉之戒':'End Ring','星蚀之戒':'Eclipse Ring','混沌之戒':'Chaos Ring',
    '布帽':'Cloth Hood','铁盔':'Iron Helm','骑士头盔':'Knight Helm','龙冠':'Dragon Crown','草鞋':'Cloth Sandals','皮靴':'Leather Boots','钢胫甲':'Steel Greaves','疾风之靴':'Gale Boots','铜坠链':'Copper Pendant','月石坠':'Moonstone Pendant','守护圣符':'Guardian Talisman','深渊之眼':'Eye of the Abyss',

    // mechanic traits / forge paths
    '锋鸣':'Echo Edge','收割':'Reaper','镇守':'Brace','反击甲':'Reprisal','清创':'Clarity','游猎':'Skirmish','残影':'Afterimage','决斗':'Duelist','危机脉搏':'Crisis Pulse','回路超频':'Overclock','凝息':'Meditate',
    '锋锐':'Keen','饮血':'Blooded','壁垒':'Bastion','荆棘':'Barbed','生息':'Vitality','回春':'Restoration','稳步':'Stout','猎步':'Hunterstep','洞察':'Insight','血契':'Blood Pact','狂意':'Fury','凝神':'Focus','淬炼':'Masterwork',

    // early monsters
    '巨鼠':'Dire Rat','蝙蝠':'Cave Bat','哥布林':'Goblin','墓穴蛛':'Crypt Spider','骷髅':'Skeleton','兽人':'Orc','幽魂':'Ghost','血教徒':'Blood Cultist','巨魔':'Troll','深渊恶魔':'Abyss Demon','霜怨灵':'Frost Wraith','霜语法师':'Frostspeaker','墓石魔像':'Gravestone Golem','血爵':'Blood Baron','墓园巫妖':'Graveyard Lich','缝合憎恶':'Stitched Abomination','裂隙龙裔':'Rift Dragonkin','陨星使':'Fallen-Star Herald','虚空幼体':'Void Spawn',
    // mid monsters
    '腐血伯爵':'Rotblood Count','深渊巫魔':'Abyss Warlock','熔岩龙裔':'Lava Dragonkin','深渊真形':'Abyssal Trueform','堕落陨星使':'Fallen Star Herald','虚空爬行者':'Void Crawler','永冬怨灵':'Everfrost Wraith','深渊铸魔像':'Abyss-Forged Golem','血月主教':'Bloodmoon Bishop','寒冥术士':'Netherfrost Mage','石髓古魔':'Stone-Marrow Ancient','深渊执行者':'Abyss Executioner','回响狱魂':'Echoed Damned','末层狂战士':'Depth Berserker',
    // deep monsters
    '无光怨灵':'Lightless Wraith','星骸构装体':'Starbone Construct','深渊主教':'Abyss Bishop','虚灵死主':'Ethereal Deathlord','熔核龙裔':'Corefire Dragonkin','脓疱憎恶':'Blight Abomination','虚空吞噬者':'Void Devourer','永霜怨灵':'Eternal Frost Wraith','星蚀天使':'Eclipse Angel','阴谋之舌':'Whispering Tongue','血祖':'Blood Progenitor','凋零构装':'Withered Construct','深渊宰执':'Abyss Regent','星霜龙裔':'Starfrost Dragonkin','虚空君主':'Void Sovereign','末刃天使':'Endblade Angel','深渊回响':'Abyss Echo','聚合体':'Amalgam','终焉龙裔':'End Dragonkin','虚空彼方':'Beyond the Void',
    // guardians / finale
    '深渊领主':'Abyss Lord','霜骨暴君':'Frostbone Tyrant','熔核战神':'Molten Warlord','虚空执政官':'Void Archon','星骸圣裁':'Starbone Judicator','熔心龙帝':'Moltenheart Dragon Emperor','无光泰坦':'Lightless Titan','星蚀圣座':'Eclipse Seraph','深渊化身':'Abyss Incarnate','终焉渊主':'Lord of the Final Abyss',

    // themes / late encounter identities
    '石砌地窟':'Stone Crypt','苔湿洞穴':'Moss Cavern','血色深渊':'Crimson Abyss','地狱核心':'Infernal Core','霜骨墓园':'Frostbone Graveyard','沉没圣堂':'Sunken Sanctum','虚空裂隙':'Void Rift','熔岩锻炉':'Lava Forge','蛛丝墓穴':'Webbed Tomb','星骸神殿':'Starbone Temple','碎裂回廊':'Shattered Gallery','深红祭坛':'Crimson Altar','永冻深渊':'Everfrozen Abyss','熔核裂谷':'Molten Rift','虚空回声':'Void Echo','亡语圣殿':'Deathwhisper Sanctum','星尘残骸':'Stardust Ruins','无光深渊':'Lightless Abyss','终焉回廊':'Final Gallery','虚空核心':'Void Core','永夜之城':'Evernight City',
    '噤声王庭':'Hushed Court','黑星墓海':'Blackstar Necropolis','终末天井':'Endwell','回响王座':'Echo Throne',
    '霜环蓄积':'Frost Ring','爆裂标记':'Ember Mark','猎杀线':'Hunter Line','愈合咏唱':'Mending Channel','血契牵引':'Blood Tether','地脉震裂':'Rupture Cross','星蚀弹幕':'Eclipse Barrage',
    '回响试炼 I · 踏焰':'Echo Trial I · Flame Step','回响试炼 II · 断线':'Echo Trial II · Break Line','回响试炼 III · 离环':'Echo Trial III · Leave Ring',
    '终局第一相 · 王座烙印':'Finale Phase I · Throne Mark','终局第二相 · 虚空裁线':'Finale Phase II · Void Line','终局第三相 · 深渊心爆':'Finale Phase III · Abyss Heart Nova',

    // common short UI/status text
    '破甲蓄力':'Armor Break','狂暴!':'ENRAGED!','残影卸力':'Afterimage','就绪':'Ready','祈祷':'Pray','离开':'Leave','购买':'Buy','出售':'Sell','售罄':'Sold Out','装备':'Gear','丢弃':'Drop','背包':'Backpack','冒险日志':'Adventure Log',
    '已征服检查点':'Conquered Checkpoints','本轮已全部领取':'All Claimed','重置轮盘':'Reset Wheel','抽奖':'Spin','持有':'Owned','库存':'Stock','适配':'Fit','价值':'Value'
  });

  const REVERSE=Object.freeze(Object.fromEntries(Object.entries(EXACT).map(([zh,en])=>[en,zh])));
  const sourceByNode=new WeakMap();
  let observer=null,applying=false;

  const nameEn=s=>EXACT[s]||s;
  function replaceNames(text){
    let out=String(text);
    const keys=Object.keys(EXACT).sort((a,b)=>b.length-a.length);
    for(const zh of keys) if(out.includes(zh)) out=out.split(zh).join(EXACT[zh]);
    return out;
  }

  function equipmentName(text){
    const m=String(text).match(/^(普通|精良|稀有|史诗|传说)·(.+?)(?:\s*·\s*(锋鸣|收割|镇守|反击甲|清创|游猎|残影|决斗|危机脉搏|回路超频|凝息))?$/);
    if(!m)return null;
    return `${nameEn(m[1])} · ${nameEn(m[2])}${m[3]?` · ${nameEn(m[3])}`:''}`;
  }

  function translateEn(input){
    const src=String(input||'');if(!src)return src;
    if(EXACT[src])return EXACT[src];
    const eq=equipmentName(src);if(eq)return eq;
    let out=replaceNames(src);

    // stats / affixes / forging
    out=out
      .replace(/攻击 \+(\d+)/g,'ATK +$1').replace(/防御 \+(\d+)/g,'DEF +$1').replace(/生命 \+(\d+)/g,'HP +$1')
      .replace(/暴击 \+(\d+)%/g,'Crit +$1%').replace(/吸血 \+(\d+)%/g,'Leech +$1%').replace(/金币获取 \+(\d+)%/g,'Gold Find +$1%')
      .replace(/反伤 \+(\d+)/g,'Thorns +$1').replace(/击杀回复 \+(\d+)/g,'Kill Heal +$1')
      .replace(/强化 \+(\d+)/g,'Forge +$1').replace(/评分\s*(\d+)/g,'Score $1').replace(/价值\s*(\d+)/g,'Value $1')
      .replace(/适配\s*(\d+)/g,'Fit $1')
      .replace(/^卖\s*(\d+)G$/,'Sell $1G').replace(/^出售得\s*(\d+)\s*G$/,'Sell for $1 G')
      .replace(/^强化到 \+(\d+)，需 (\d+) G$/,'Forge to +$1 · $2 G').replace(/^已至 \+5 极致$/,'Maxed at +5')
      .replace(/^\+3 精炼：为【(.+)】定一个方向$/,'+3 Refinement: choose a path for [$1]')
      .replace(/^精炼不会失败，也不会毁坏装备。这个选择会在 \+5 时继续淬炼强化。$/,'Refinement cannot fail or destroy gear. Your choice is mastered again at +5.')
      .replace(/更稳定地走暴击路线。/g,'A steadier critical-strike path.')
      .replace(/用持续吸血换取推进续航。/g,'Trade toward sustained life-steal progression.')
      .replace(/把生存重心转向生命，而不是继续堆纯 DEF。/g,'Shift survival toward HP instead of stacking pure DEF.')
      .replace(/近战换血时获得更强反伤收益。/g,'Gain stronger thorns value while trading melee hits.')
      .replace(/扩大生命池，提高失误容错。/g,'Expand the HP pool for a larger mistake buffer.')
      .replace(/强化击杀后的长期续航。/g,'Improve long-run sustain after kills.')
      .replace(/以生命换取稳定推进。/g,'Build HP for steadier progression.')
      .replace(/轻量暴击方向，适合游侠\/刺客等主动拉扯构筑。/g,'A light Crit path for Ranger/Assassin kiting builds.')
      .replace(/把戒指定型为暴击核心。/g,'Shape the ring into a Crit core.')
      .replace(/把戒指定型为吸血续航核心。/g,'Shape the ring into a life-steal sustain core.')
      .replace(/直接强化攻击，适合高压输出路线。/g,'Directly raise ATK for high-pressure damage builds.')
      .replace(/把项链定型为暴击\/爆发方向。/g,'Shape the amulet toward Crit and burst.');

    // town checkpoints / wheel / commerce
    out=out
      .replace(/^最深到达 (\d+) 层 · 通过十层守卫后解锁下一段$/,'Deepest Floor $1 · Defeat each 10-floor guardian to unlock the next checkpoint')
      .replace(/^从第 1 层出发$/,'Depart from Floor 1')
      .replace(/^从已征服区 · 第 (\d+) 层出发$/,'Depart from conquered Floor $1')
      .replace(/^抽奖 (\d+) G$/,'Spin $1 G').replace(/^重置轮盘 (\d+) G$/,'Reset Wheel $1 G')
      .replace(/^本阶段实际抽奖成本 (\d+) G$/,'Actual spin cost this stage: $1 G')
      .replace(/^本阶段重摇全部八格，实际成本 (\d+) G$/,'Reroll all eight slots this stage: $1 G')
      .replace(/^重置轮盘后才能开启新一轮奖池$/,'Reset the wheel to begin a new prize pool')
      .replace(/^城镇阶段 (\d+) · 已领取 (\d+)\/8 格（(.+)）；已领取格再次停中不会重复发奖。$/,'Town Tier $1 · Claimed $2/8 slots ($3). Claimed slots cannot pay twice.')
      .replace(/^城镇阶段 (\d+) · 八格奖池每格最多领取一次；重置会整盘换新。$/,'Town Tier $1 · Each of the eight prize slots pays once; reset replaces the whole board.')
      .replace(/^这一轮八格都已经领取，先重置轮盘再继续。$/,'All eight slots are claimed. Reset the wheel before spinning again.')
      .replace(/^金币不足：本阶段抽奖需要 (\d+) G。$/,'Not enough Gold: this stage requires $1 G to spin.')
      .replace(/^金币不足：本阶段重置需要 (\d+) G。$/,'Not enough Gold: this stage requires $1 G to reset.')
      .replace(/持有 (\d+) · 库存 (\d+)/g,'Owned $1 · Stock $2')
      .replace(/^城镇阶段 (\d+) · 本轮补给库存固定；完成一次远征返回后刷新，不会因反复打开商店刷新。$/,'Town Tier $1 · Supply stock is fixed for this expedition cycle and refreshes only after a completed return.')
      .replace(/^价格按已征服的十层阶段成长；装备交易将在后续价值体系中接入。$/,'Prices scale with conquered 10-floor tiers. Gear trading follows the equipment value system.')
      .replace(/^(.+)本轮已经售罄。$/,'$1 is sold out for this cycle.')
      .replace(/^金币不足：(.+)需要 (\d+) G。$/,'Not enough Gold: $1 costs $2 G.')
      .replace(/^购入 (.+) ×1。$/,'Purchased $1 ×1.')
      .replace(/^附近仍有敌人逼近，商人拒绝交易。先把战斗解决掉。$/,'Enemies are still closing in. The merchant refuses to trade until the fight is over.')
      .replace(/^包扎伤口（回满 · 缺 (\d+)）$/,'Bind Wounds (Full heal · Missing $1)')
      .replace(/^包扎伤口（已满血）$/,'Bind Wounds (Already full HP)');

    // guardian telegraphs / outcomes
    out=out
      .replace(/寒气将在下一回合覆盖守卫周围 2 格。离开霜环范围。/g,'Cold will cover the 2-tile ring around the guardian next turn. Leave the frost ring.')
      .replace(/脚下地块已被点燃。下一回合前离开这个格子。/g,'Your tile is marked to ignite. Leave it before the next turn.')
      .replace(/守卫锁定了一条射击线。横向\/纵向侧移，或让地形挡住射线。/g,'The guardian locks a firing line. Sidestep perpendicular to it or break line of sight with terrain.')
      .replace(/守卫将在下一回合恢复大量生命。警告期间对它造成伤害即可打断。/g,'The guardian will restore a large amount of HP next turn. Damage it during the warning to interrupt.')
      .replace(/血链将在下一回合抽取近距离目标。与守卫拉开到 4 格以上。/g,'The blood tether drains nearby targets next turn. Create at least 4 tiles of distance.')
      .replace(/守卫将在自身横纵 3 格内震裂地面。离开十字形危险线。/g,'The guardian will rupture ground 3 tiles along its row and column. Leave the cross-shaped danger line.')
      .replace(/弹幕锁定你所在的短直线。沿垂直于亮线的方向侧移一格。/g,'The barrage locks a short line through you. Sidestep one tile perpendicular to the lit line.')
      .replace(/旧日爆裂标记再次出现。离开被锁定的地块。/g,'The old Ember Mark returns. Leave the locked tile.')
      .replace(/旧日猎杀线再次出现。侧移、离开射程或借墙断线。/g,'The old Hunter Line returns. Sidestep, leave range, or break line of sight with a wall.')
      .replace(/旧日霜环再次出现。离开守卫周围 2 格。/g,'The old Frost Ring returns. Leave the 2-tile ring around the guardian.')
      .replace(/渊主烙印你脚下的地块。下一回合前离开。/g,'The Abyss Lord marks your tile. Leave it before the next turn.')
      .replace(/渊主锁定整条行列。侧移或借墙切断射线。/g,'The Abyss Lord locks your entire row or column. Sidestep or use a wall to break the line.')
      .replace(/渊主将引爆周围 2 格。停止贪刀，立刻拉开距离。/g,'The Abyss Lord will detonate the 2-tile area around itself. Stop greed-attacking and create distance now.')
      .replace(/心爆落空：你在最后一刻拉开了距离。/g,'Heart Nova misses: you created distance at the last moment.')
      .replace(/范围爆发落空：你及时离开了危险区。/g,'Area burst misses: you left the danger zone in time.')
      .replace(/命中：警告区不能硬吃。/g,' hits: telegraphed danger zones must be avoided.')
      .replace(/命中：原地贪刀付出了代价。/g,' hits: greed-attacking on the marked tile has a cost.')
      .replace(/落空：你及时离开了锁定地块。/g,' misses: you left the marked tile in time.')
      .replace(/命中：下一次看见锁线时侧移或断线。/g,' hits: next time, sidestep or break the firing line.')
      .replace(/落空：你避开或切断了射线。/g,' misses: you dodged or broke the firing line.')
      .replace(/星蚀弹幕命中：短直线要沿垂直方向侧移。/g,'Eclipse Barrage hits: sidestep perpendicular to the short line.')
      .replace(/星蚀弹幕落空：你离开了锁定短线。/g,'Eclipse Barrage misses: you left the locked short line.')
      .replace(/愈合咏唱被打断：持续施压阻止了这次回复。/g,'Mending Channel interrupted: sustained pressure stopped the heal.')
      .replace(/愈合完成：守卫恢复了 (\d+) 点生命。/g,'Mending completes: the guardian restores $1 HP.')
      .replace(/血契抽取命中：下次在警告期间拉开到 4 格以上。/g,'Blood Tether hits: next time create at least 4 tiles of distance during the warning.')
      .replace(/血契断裂：你成功拉开了距离。/g,'Blood Tether breaks: you created enough distance.')
      .replace(/地脉震裂命中：十字线不能硬吃。/g,'Rupture Cross hits: do not tank the cross-shaped danger line.')
      .replace(/地脉震裂落空：你离开了横纵危险线。/g,'Rupture Cross misses: you left the row/column danger line.')
      .replace(/终焉渊主进入第二阶段：王座碎裂，虚空裁线开始。/g,'Lord of the Final Abyss enters Phase II: the throne shatters and Void Line begins.')
      .replace(/终焉渊主进入第三阶段：深渊之心暴露，心爆频率加快。/g,'Lord of the Final Abyss enters Phase III: the Abyss Heart is exposed and Heart Nova accelerates.');

    // common combat/log grammar
    out=out
      .replace(/^第 (\d+) 层$/,'Floor $1').replace(/第 (\d+) 层/g,'Floor $1')
      .replace(/获得 (\d+) 金币/g,'gained $1 Gold').replace(/拾取了?/g,'Picked up ')
      .replace(/造成 (\d+) 点伤害/g,'dealt $1 damage').replace(/受到 (\d+) 点伤害/g,'took $1 damage')
      .replace(/恢复 (\d+) 点生命/g,'restored $1 HP').replace(/治疗效果减半/g,'healing is halved')
      .replace(/陷入狂暴，攻势暴涨！/g,' becomes enraged — its attacks surge!')
      .replace(/伤口崩裂——短时间内/g,'Wounds reopen — temporarily ')
      .replace(/下一回合将射出破甲重击——离开视线或射程！/g,' is aiming an armor-break shot next turn — break line of sight or range!')
      .replace(/举起武器蓄力，下一回合将发动破甲重击——拉开距离！/g,' is charging an armor-break strike for next turn — create distance!')
      .replace(/ 锁定了你，/g,' locks onto you and ')
      .replace(/倒下了！/g,' falls!').replace(/崩解了。/g,' collapses.');

    // route/content profile copy
    out=out
      .replace(/^一百层深渊在脚下展开。选一条回响，杀穿 (\d+) 层，从 (.+) 手中夺回「(.+)」——或踏入无尽。$/,'A hundred-floor abyss opens below. Choose an echo, cut through $1 floors, reclaim “$3” from $2 — or descend forever.')
      .replace(/^(.+)封锁了最后的阶梯。击败它，夺回「(.+)」！$/,'$1 seals the final stairs. Defeat it and reclaim “$2”!')
      .replace(/^群星在头顶湮灭……(.+)就在这一层！$/,'The stars die overhead… $1 is on this floor!')
      .replace(/^你踏入了Floor (\d+)——这是深渊的尽头，世界在这里被掏空。$/,'You enter Floor $1 — the end of the abyss, where the world has been hollowed out.')
      .replace(/^(.+)falls!它守护的【(.+)】掉落了出来！$/,'$1 falls! The guarded [$2] drops to the ground!')
      .replace(/^Floor (\d+)的门后，(.+)挡住了去路。击败它仍可继续下潜。$/,'Beyond the door on Floor $1, $2 blocks the way. Defeat it to keep descending.')
      .replace(/^(.+)collapses.通往更深处的阶梯重新亮起。$/,'$1 collapses. The stairs to the depths flare back to life.')
      .replace(/^一位Masked Merchant在火把下摆开摊位。Gold能换来活路。$/,'A Masked Merchant opens a stall beneath the torchlight. Gold can buy another chance.')
      .replace(/^一处Ember Camp。你可以在此包扎伤口。$/,'An Ember Camp. You can bind your wounds here.')
      .replace(/^一座Nameless Shrine在黑暗中发着微光。触碰它，接受回响的赌注。$/,'A Nameless Shrine glows in the dark. Touch it and accept the echo’s wager.')
      .replace(/^你拒绝了归途。回响一层层叠上来——没有尽头，只有更深。$/,'You reject the way home. Echoes stack layer upon layer — no ending, only deeper.')
      .replace(/^本层已肃清。阶梯处金光大盛，你感到一笔清场赏金入袋。$/,'The floor is clear. Gold floods the stairs as the clear bonus enters your pouch.')
      .replace(/^墙面裂开，露出一间密室！$/,'The wall splits open, revealing a secret room!');

    // trait descriptions
    out=out
      .replace(/施放职业技能后，下一回合的下一次普攻伤害 \+(\d+)%。/g,'After using your class skill, your next basic attack next turn deals +$1% damage.')
      .replace(/普攻击杀敌人时额外返还 (\d+) 回合技能冷却。/g,'Basic-attack kills refund $1 extra turn(s) of skill cooldown.')
      .replace(/等待后，本轮下一次敌人直击伤害降低 (\d+)%。/g,'After waiting, the next direct enemy hit this round deals $1% less damage.')
      .replace(/被敌人直击后，下一回合近战普攻伤害 \+(\d+)%。/g,'After taking a direct hit, next-turn melee basic damage +$1%.')
      .replace(/喝药后额外缩短 (\d+) 回合重伤。/g,'Drinking a potion shortens Grievous Wounds by $1 extra turn.')
      .replace(/喝药后直接清除重伤。/g,'Drinking a potion clears Grievous Wounds.')
      .replace(/正常移动后，下一回合远程普攻伤害 \+(\d+)%。/g,'After a normal move, next-turn ranged basic damage +$1%.')
      .replace(/施放职业技能后，本轮下一次敌人直击伤害降低 (\d+)%。/g,'After using your class skill, the next direct enemy hit this round deals $1% less damage.')
      .replace(/只与 1 名相邻敌人缠斗时，近战普攻伤害 \+(\d+)%。/g,'While adjacent to exactly one enemy, melee basic damage +$1%.')
      .replace(/生命不高于 40% 时暴击率 \+(\d+)%。/g,'At 40% HP or lower, Crit +$1%.')
      .replace(/职业技能造成击杀时额外返还 (\d+) 回合冷却。/g,'Class-skill kills refund $1 extra turn(s) of cooldown.')
      .replace(/等待时额外恢复 (\d+) 回合技能冷却。/g,'Waiting restores $1 extra turn(s) of skill cooldown.');

    return out;
  }

  function translateNode(node){
    if(!node||node.nodeType!==3)return;
    const current=String(node.nodeValue||'');
    if(!current.trim())return;
    // Core modules always generate Chinese source. Store only text that actually contains CJK,
    // never our own English translation, so observer callbacks remain reversible/idempotent.
    if(/[\u3400-\u9fff]/.test(current))sourceByNode.set(node,current);
    const source=sourceByNode.get(node)||current;
    const wanted=L.isEnglish?translateEn(source):source;
    if(node.nodeValue!==wanted)node.nodeValue=wanted;
  }

  function translateTree(root){
    if(!root||applying)return;applying=true;
    try{
      if(root.nodeType===3){translateNode(root);return;}
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(translateNode);
    }finally{applying=false;}
  }

  function patchCanvas(){
    const canvas=document.getElementById('game');if(!canvas||canvas.__deI18nCanvasV2)return;
    const ctx=canvas.getContext('2d');if(!ctx||typeof ctx.fillText!=='function')return;
    const native=ctx.fillText.bind(ctx);
    ctx.fillText=function(text,...args){return native(L.isEnglish?translateEn(String(text)):text,...args)};
    canvas.__deI18nCanvasV2=true;
  }

  function refresh(){translateTree(document.body);patchCanvas();}
  observer=typeof MutationObserver!=='undefined'?new MutationObserver(records=>{
    if(applying)return;
    for(const r of records){
      if(r.type==='characterData')translateNode(r.target);
      for(const n of r.addedNodes||[])translateTree(n);
    }
  }):null;
  if(observer&&document.body)observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  window.addEventListener('de:languagechange',()=>requestAnimationFrame(refresh));
  refresh();

  window.__DE_I18N_CONTENT_V2={version:'v2',translateEn,replaceNames,equipmentName,refresh,exact:{...EXACT}};
})();
