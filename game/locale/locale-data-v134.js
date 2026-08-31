/* Dungeon Echo fixed-route locale data catalog v1.3.4.
 * Data-level localization only: no DOM observers, no polling and no save namespace changes.
 * Canonical gameplay/save objects may still carry legacy Chinese-era names; visible labels are
 * derived from stable gameplay ids where available and exact legacy names only as migration fallback.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.DE_LOCALE_DATA) return;

  const routeLang = String(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.deLocale || '').toLowerCase();
  const isEnglish = routeLang === 'en';
  const locale = isEnglish ? 'en' : 'zh-CN';
  const pick = (zh, en) => isEnglish ? en : zh;

  const RARITY = Object.freeze([
    { id:'common', zh:'普通', en:'Common' },
    { id:'fine', zh:'精良', en:'Fine' },
    { id:'rare', zh:'稀有', en:'Rare' },
    { id:'epic', zh:'史诗', en:'Epic' },
    { id:'legendary', zh:'传说', en:'Legendary' },
  ]);

  const CLASS = Object.freeze({
    warrior:['战士','Warrior'], ranger:['游侠','Ranger'], mage:['秘术师','Arcanist'], assassin:['刺客','Assassin'],
  });
  const SLOT = Object.freeze({
    weapon:['武器','Weapon'], armor:['护甲','Armor'], helmet:['头盔','Helmet'], boots:['靴子','Boots'], ring:['戒指','Ring'], amulet:['项链','Amulet'],
  });
  const AFFIX = Object.freeze({
    atk:['攻击','ATK',''], def:['防御','DEF',''], hp:['生命','HP',''], crit:['暴击','Crit','%'],
    leech:['吸血','Leech','%'], gold:['金币获取','Gold Find','%'], thorns:['反伤','Thorns',''], regen:['击杀回复','Kill Heal',''],
  });

  // [stable base id, English label]. Canonical Chinese names are compatibility lookup keys only.
  const BASE = Object.freeze({
    '铁剑':['weapon.warrior.iron-sword','Iron Sword'],'阔剑':['weapon.warrior.broadsword','Broadsword'],'战斧':['weapon.warrior.battle-axe','Battle Axe'],
    '符文之刃':['weapon.warrior.runeblade','Runeblade'],'骑士阔剑':['weapon.warrior.knight-broadsword','Knight Broadsword'],'裂隙之刃':['weapon.warrior.riftblade','Riftblade'],
    '碎甲战斧':['weapon.warrior.sunder-axe','Sunder Axe'],'熔火之刃':['weapon.warrior.molten-blade','Molten Blade'],'陨星战斧':['weapon.warrior.meteor-axe','Meteor Axe'],
    '无光巨刃':['weapon.warrior.lightless-greatblade','Lightless Greatblade'],'终焉之刃':['weapon.warrior.endblade','Endblade'],'虚空斩裂刃':['weapon.warrior.void-cleaver','Void Cleaver'],'湮灭巨剑':['weapon.warrior.annihilation-greatsword','Annihilation Greatsword'],
    '猎弓':['weapon.ranger.hunting-bow','Hunting Bow'],'强弓':['weapon.ranger.war-bow','War Bow'],'鹰眼长弓':['weapon.ranger.eagle-eye-longbow','Eagle-Eye Longbow'],'追猎之弓':['weapon.ranger.stalker-bow','Stalker Bow'],
    '猎手长弓':['weapon.ranger.hunter-longbow','Hunter Longbow'],'裂空之弓':['weapon.ranger.skycleaver-bow','Skycleaver Bow'],'幻影猎弓':['weapon.ranger.phantom-bow','Phantom Bow'],'星辰猎弓':['weapon.ranger.starhunter-bow','Starhunter Bow'],
    '陨星长弓':['weapon.ranger.meteor-longbow','Meteor Longbow'],'无光猎弓':['weapon.ranger.lightless-bow','Lightless Bow'],'终焉之弓':['weapon.ranger.endbow','Endbow'],'霜陨长弓':['weapon.ranger.frostfall-longbow','Frostfall Longbow'],'虚空之弓':['weapon.ranger.void-bow','Void Bow'],
    '学徒法杖':['weapon.mage.apprentice-staff','Apprentice Staff'],'秘纹法杖':['weapon.mage.runed-staff','Runed Staff'],'星光法杖':['weapon.mage.starlight-staff','Starlight Staff'],'奥术权杖':['weapon.mage.arcane-scepter','Arcane Scepter'],
    '贤者法杖':['weapon.mage.sage-staff','Sage Staff'],'虚空法杖':['weapon.mage.void-staff','Void Staff'],'星辉法杖':['weapon.mage.astral-staff','Astral Staff'],'星骸法杖':['weapon.mage.starbone-staff','Starbone Staff'],
    '深渊权杖':['weapon.mage.abyssal-scepter','Abyssal Scepter'],'陨星法杖':['weapon.mage.meteor-staff','Meteor Staff'],'终焉法杖':['weapon.mage.endstaff','Endstaff'],'星蚀法杖':['weapon.mage.eclipse-staff','Eclipse Staff'],'混沌之杖':['weapon.mage.chaos-staff','Chaos Staff'],
    '匕首':['weapon.assassin.dagger','Dagger'],'淬毒匕首':['weapon.assassin.venom-dagger','Venom Dagger'],'暗影匕首':['weapon.assassin.shadow-dagger','Shadow Dagger'],'夜刃':['weapon.assassin.nightblade','Nightblade'],
    '双刃匕首':['weapon.assassin.twin-dagger','Twin Dagger'],'裂魂匕首':['weapon.assassin.soulripper-dagger','Soulripper Dagger'],'血牙匕首':['weapon.assassin.bloodfang-dagger','Bloodfang Dagger'],'星骸夜刃':['weapon.assassin.starbone-nightblade','Starbone Nightblade'],
    '陨星匕首':['weapon.assassin.meteor-dagger','Meteor Dagger'],'无光夜刃':['weapon.assassin.lightless-nightblade','Lightless Nightblade'],'终焉匕首':['weapon.assassin.end-dagger','End Dagger'],'霜陨夜刃':['weapon.assassin.frostfall-nightblade','Frostfall Nightblade'],'虚空夜刃':['weapon.assassin.void-nightblade','Void Nightblade'],
    '皮甲':['armor.leather','Leather Armor'],'锁子甲':['armor.chain-mail','Chain Mail'],'板甲':['armor.plate','Plate Armor'],'秘银铠':['armor.mithril','Mithril Armor'],'虚空甲':['armor.void','Void Armor'],
    '星骸甲':['armor.starbone','Starbone Armor'],'陨星甲':['armor.meteor','Meteor Armor'],'无光铠':['armor.lightless','Lightless Armor'],'终焉甲':['armor.end','End Armor'],'星蚀圣铠':['armor.eclipse','Eclipse Plate'],'混沌重甲':['armor.chaos','Chaos Plate'],
    '铜戒指':['ring.copper','Copper Ring'],'红宝石戒':['ring.ruby','Ruby Ring'],'守护之戒':['ring.guardian','Guardian Ring'],'永夜之戒':['ring.eternal-night','Eternal Night Ring'],'星骸之戒':['ring.starbone','Starbone Ring'],
    '陨星之戒':['ring.meteor','Meteor Ring'],'深渊之戒':['ring.abyss','Abyss Ring'],'终焉之戒':['ring.end','End Ring'],'星蚀之戒':['ring.eclipse','Eclipse Ring'],'混沌之戒':['ring.chaos','Chaos Ring'],
    '布帽':['helmet.cloth','Cloth Hood'],'铁盔':['helmet.iron','Iron Helm'],'骑士头盔':['helmet.knight','Knight Helm'],'龙冠':['helmet.dragon-crown','Dragon Crown'],
    '草鞋':['boots.straw','Straw Sandals'],'皮靴':['boots.leather','Leather Boots'],'钢胫甲':['boots.steel-greaves','Steel Greaves'],'疾风之靴':['boots.gale','Gale Boots'],
    '铜坠链':['amulet.copper','Copper Pendant'],'月石坠':['amulet.moonstone','Moonstone Pendant'],'守护圣符':['amulet.guardian','Guardian Talisman'],'深渊之眼':['amulet.eye-of-abyss','Eye of the Abyss'],
  });

  const MECHANIC = Object.freeze({
    echo_edge:{zh:'锋鸣',en:'Echo Edge',zhText:['施放职业技能后，下一回合的下一次普攻伤害 +25%。','施放职业技能后，下一回合的下一次普攻伤害 +40%。'],enText:['After using your class skill, the next basic attack on the following turn deals +25% damage.','After using your class skill, the next basic attack on the following turn deals +40% damage.']},
    reaper:{zh:'收割',en:'Reaper',zhText:['普攻击杀敌人时额外返还 1 回合技能冷却。','普攻击杀敌人时额外返还 2 回合技能冷却。'],enText:['Basic-attack kills refund 1 extra turn of skill cooldown.','Basic-attack kills refund 2 extra turns of skill cooldown.']},
    brace:{zh:'镇守',en:'Brace',zhText:['等待后，本轮下一次敌人直击伤害降低 35%。','等待后，本轮下一次敌人直击伤害降低 50%。'],enText:['After waiting, the next direct enemy hit this round deals 35% less damage.','After waiting, the next direct enemy hit this round deals 50% less damage.']},
    reprisal:{zh:'反击甲',en:'Reprisal',zhText:['被敌人直击后，下一回合近战普攻伤害 +30%。','被敌人直击后，下一回合近战普攻伤害 +50%。'],enText:['After taking a direct hit, your next-turn melee basic attack deals +30% damage.','After taking a direct hit, your next-turn melee basic attack deals +50% damage.']},
    clarity:{zh:'清创',en:'Clarity',zhText:['喝药后额外缩短 1 回合重伤。','喝药后直接清除重伤。'],enText:['Drinking a potion shortens Grievous Wounds by 1 extra turn.','Drinking a potion clears Grievous Wounds immediately.']},
    skirmish:{zh:'游猎',en:'Skirmish',zhText:['正常移动后，下一回合远程普攻伤害 +25%。','正常移动后，下一回合远程普攻伤害 +40%。'],enText:['After a normal move, your next-turn ranged basic attack deals +25% damage.','After a normal move, your next-turn ranged basic attack deals +40% damage.']},
    afterimage:{zh:'残影',en:'Afterimage',zhText:['施放职业技能后，本轮下一次敌人直击伤害降低 25%。','施放职业技能后，本轮下一次敌人直击伤害降低 40%。'],enText:['After using your class skill, the next direct enemy hit this round deals 25% less damage.','After using your class skill, the next direct enemy hit this round deals 40% less damage.']},
    duelist:{zh:'决斗',en:'Duelist',zhText:['只与 1 名相邻敌人缠斗时，近战普攻伤害 +20%。','只与 1 名相邻敌人缠斗时，近战普攻伤害 +35%。'],enText:['When exactly one enemy is adjacent, melee basic attacks deal +20% damage.','When exactly one enemy is adjacent, melee basic attacks deal +35% damage.']},
    crisis:{zh:'危机脉搏',en:'Crisis Pulse',zhText:['生命不高于 40% 时暴击率 +12%。','生命不高于 40% 时暴击率 +20%。'],enText:['At 40% HP or lower, gain +12% Crit.','At 40% HP or lower, gain +20% Crit.']},
    overclock:{zh:'回路超频',en:'Overclock',zhText:['职业技能造成击杀时额外返还 1 回合冷却。','职业技能造成击杀时额外返还 2 回合冷却。'],enText:['Class-skill kills refund 1 extra turn of cooldown.','Class-skill kills refund 2 extra turns of cooldown.']},
    meditate:{zh:'凝息',en:'Meditate',zhText:['等待时额外恢复 1 回合技能冷却。','等待时额外恢复 2 回合技能冷却。'],enText:['Waiting restores 1 extra turn of skill cooldown.','Waiting restores 2 extra turns of skill cooldown.']},
  });

  const REFINE = Object.freeze({
    keen:['锋锐','Keen'],blooded:['饮血','Blooded'],bastion:['壁垒','Bastion'],barbed:['荆棘','Barbed'],vital:['生息','Vital'],restoring:['回春','Restoring'],
    stout:['稳步','Stout'],hunter:['猎步','Hunter'],precision:['洞察','Precision'],sanguine:['血契','Sanguine'],fury:['狂意','Fury'],focus:['凝神','Focus'],
  });

  const WORLD_NAME_EN = Object.freeze({
    '治疗药水':'Healing Potion','传送卷轴':'Teleport Scroll','回城卷轴':'Return Scroll','保险符':'Insurance Charm','金币':'Gold','锈蚀钥匙':'Rusty Key','终焉之心':'Heart of the End',
    '上锁的宝箱':'Locked Chest','木桶':'Cask','无名神龛':'Nameless Shrine','余烬营地':'Ember Camp','蒙面商人':'Masked Merchant',
    '巨鼠':'Dire Rat','蝙蝠':'Cave Bat','哥布林':'Goblin','墓穴蛛':'Crypt Spider','骷髅':'Skeleton','兽人':'Orc','幽魂':'Ghost','血教徒':'Blood Cultist','巨魔':'Troll','深渊恶魔':'Abyss Demon',
    '霜怨灵':'Frost Wraith','霜语法师':'Frostspeaker','墓石魔像':'Gravestone Golem','血爵':'Blood Baron','墓园巫妖':'Graveyard Lich','缝合憎恶':'Stitched Abomination','裂隙龙裔':'Rift Dragonkin','陨星使':'Fallen-Star Herald','虚空幼体':'Void Spawn',
    '腐血伯爵':'Rotblood Count','深渊巫魔':'Abyss Warlock','熔岩龙裔':'Lava Dragonkin','深渊真形':'Abyssal Trueform','堕落陨星使':'Fallen Star Herald','虚空爬行者':'Void Crawler','永冬怨灵':'Everfrost Wraith','深渊铸魔像':'Abyss-Forged Golem','血月主教':'Bloodmoon Bishop','寒冥术士':'Netherfrost Mage','石髓古魔':'Stone-Marrow Ancient','深渊执行者':'Abyss Executioner','回响狱魂':'Echoed Damned','末层狂战士':'Depth Berserker',
    '无光怨灵':'Lightless Wraith','星骸构装体':'Starbone Construct','深渊主教':'Abyss Bishop','虚灵死主':'Ethereal Deathlord','熔核龙裔':'Corefire Dragonkin','脓疱憎恶':'Blight Abomination','虚空吞噬者':'Void Devourer','永霜怨灵':'Eternal Frost Wraith','星蚀天使':'Eclipse Angel','阴谋之舌':'Tongue of Conspiracy','血祖':'Blood Progenitor','凋零构装':'Withered Construct','深渊宰执':'Abyss Regent','星霜龙裔':'Starfrost Dragonkin','虚空君主':'Void Sovereign','末刃天使':'Endblade Angel','深渊回响':'Abyss Echo','聚合体':'Amalgam','终焉龙裔':'End Dragonkin','虚空彼方':'Beyond the Void',
    '深渊领主':'Abyss Lord','霜骨暴君':'Frostbone Tyrant','熔核战神':'Molten Warlord','虚空执政官':'Void Archon','星骸圣裁':'Starbone Judicator','熔心龙帝':'Moltenheart Dragon Emperor','无光泰坦':'Lightless Titan','星蚀圣座':'Eclipse Seraph','深渊化身':'Abyss Incarnate','终焉渊主':'Lord of the Final Abyss',
    '石砌地窟':'Stone Crypt','苔湿洞穴':'Moss Cavern','血色深渊':'Crimson Abyss','地狱核心':'Infernal Core','霜骨墓园':'Frostbone Graveyard','沉没圣堂':'Sunken Sanctum','虚空裂隙':'Void Rift','熔岩锻炉':'Lava Forge','蛛丝墓穴':'Webbed Tomb','星骸神殿':'Starbone Temple','碎裂回廊':'Shattered Gallery','深红祭坛':'Crimson Altar','永冻深渊':'Everfrozen Abyss','熔核裂谷':'Molten Rift','虚空回声':'Void Echo','亡语圣殿':'Deathwhisper Sanctum','星尘残骸':'Stardust Ruins','无光深渊':'Lightless Abyss','终焉回廊':'Final Gallery','虚空核心':'Void Core','永夜之城':'Evernight City',
  });

  function baseLegacyName(item) {
    if (!item) return '';
    if (item.base && typeof item.base.name === 'string' && item.base.name) return item.base.name;
    const src = String(item.refineBaseName || item.name || '');
    const names = Object.keys(BASE).sort((a,b)=>b.length-a.length);
    return names.find(name => src.includes(name)) || src.replace(/^(?:普通|精良|稀有|史诗|传说)·/,'').split(' · ')[0].trim();
  }
  function baseId(item) {
    const row = BASE[baseLegacyName(item)];
    return row ? row[0] : `legacy.${String(item && item.slot || 'item')}.${String(baseLegacyName(item) || 'unknown')}`;
  }
  function baseName(item) {
    const legacy = baseLegacyName(item), row = BASE[legacy];
    return isEnglish && row ? row[1] : legacy;
  }
  function rarityId(index) { return (RARITY[Math.max(0,Math.min(4,Number(index)||0))] || RARITY[0]).id; }
  function rarityName(index) {
    const row = RARITY[Math.max(0,Math.min(4,Number(index)||0))] || RARITY[0];
    return isEnglish ? row.en : row.zh;
  }
  function slotName(id) { const row=SLOT[id]; return row ? (isEnglish?row[1]:row[0]) : String(id||''); }
  function className(id) { const row=CLASS[id]; return row ? (isEnglish?row[1]:row[0]) : String(id||''); }
  function affixText(key, value) {
    const row=AFFIX[key]; if(!row)return `${key} +${value}`;
    return `${isEnglish?row[1]:row[0]} +${value}${row[2]}`;
  }
  function mechanicName(id) { const row=MECHANIC[id]; return row ? (isEnglish?row.en:row.zh) : String(id||''); }
  function mechanicText(item) {
    const row=item&&MECHANIC[item.mechanic]; if(!row)return '';
    const power=Math.max(1,Math.min(2,Number(item.mechanicPower)||1));
    const body=isEnglish?row.enText[power-1]:row.zhText[power-1];
    return `◆ ${isEnglish?row.en:row.zh}: ${body}`;
  }
  function refineName(id) { const row=REFINE[id]; return row ? (isEnglish?row[1]:row[0]) : String(id||''); }
  function worldName(value) {
    const raw=String(value||'');
    if(!isEnglish||!raw)return raw;
    const prefixes=[['狂怒·','Frenzied · '],['吸血·','Vampiric · '],['爆裂·','Volatile · '],['精英·','Elite · '],['回响·','Echo · ']];
    for(const [zh,en] of prefixes)if(raw.startsWith(zh))return en+worldName(raw.slice(zh.length));
    return WORLD_NAME_EN[raw]||raw;
  }
  function itemName(item) {
    if(!item)return '';
    const parts=[`${rarityName(item.rarity)}·${baseName(item)}`];
    if(item.mechanic)parts.push(mechanicName(item.mechanic));
    if(item.refinePath)parts.push(refineName(item.refinePath));
    if(item.masterworked)parts.push(pick('淬炼','Masterwork'));
    return parts.filter(Boolean).join(' · ');
  }

  window.DE_LOCALE_DATA = Object.freeze({
    version:'v134', locale, isEnglish, pick,
    baseId, baseName, rarityId, rarityName, slotName, className, affixText,
    mechanicName, mechanicText, refineName, itemName, worldName,
    catalogs:Object.freeze({rarity:RARITY,class:CLASS,slot:SLOT,base:BASE,mechanic:MECHANIC,refine:REFINE,worldName:WORLD_NAME_EN}),
  });
})();
