/* Dungeon Echo stable locale runtime v1.2.2.
 * One locale is selected per page load. Title-screen language changes persist and reload.
 * Dynamic translation is event-driven: added nodes and a few narrow status nodes only.
 * No polling loop, no global characterData observer, no live whole-run hot switch.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_LOCALE_V122) return;

  const api = window.DE_TEST;
  if (!api) return;

  const STORAGE_KEY = 'de-language-v1';
  const url = new URL(location.href);
  const q = String(url.searchParams.get('lang') || '').toLowerCase();
  let saved = '';
  try { saved = localStorage.getItem(STORAGE_KEY) || ''; } catch (_e) {}
  const browser = String(navigator.language || '').toLowerCase();
  const lang = q === 'en' ? 'en' : (q === 'zh' || q === 'zh-cn') ? 'zh-CN' : (saved === 'en' || saved === 'zh-CN') ? saved : browser.startsWith('zh') ? 'zh-CN' : 'en';
  const en = lang === 'en';

  const T = Object.freeze({
    'zh-CN': {
      game:'地牢回响', sub:'Dungeon Echo', floor:'楼层', level:'等级', atk:'攻击', def:'防御', crit:'暴击', gold:'金币', potions:'药水', scrolls:'卷轴', keys:'钥匙', ret:'回城', enemies:'敌人', skill:'技能',
      weapon:'武器', armor:'护甲', helmet:'头盔', boots:'靴子', ring:'戒指', amulet:'项链', class:'职业', backpack:'背包', log:'冒险日志',
      fullscreen:'全屏', attack:'攻击', potion:'药水', scroll:'卷轴', descend:'下楼', pause:'暂停', sound:'声音',
      title:'地牢回响', lede:'从第 1 层开始，穿过十个阶段与九位深层守卫，直到第 100 层终局。装备、回城与贪念决定你能走多深。', route:'正式旅程固定为 1 → 100 层。不存在开局选择深度，也不能付费跳过未征服区域。',
      continue:'继续冒险', newRun:'新的冒险', greedyOn:'贪婪远征：开', greedyOff:'贪婪远征：关', help:'玩法说明', record:'远征录', back:'返回', leave:'离开',
      classKicker:'选择回响', classTitle:'你是谁', classLede:'选择你的战斗节奏。每个职业都能抵达第 100 层，但会用完全不同的方式承担风险。',
      tutorial:'新手提示', skip:'跳过教学', reset:'重置教学',
      moveDesktop:'移动 · WASD / 方向键移动，同时改变面向', moveMobile:'移动 · 用左侧方向盘移动；朝向也会跟着改变', attackDesktop:'攻击 · 面向敌人后按 J', attackMobile:'攻击 · 面向敌人后点「攻击」', skillDesktop:'技能 · K 释放，会消耗蓝量', skillMobile:'技能 · 点「技能」释放，会消耗蓝量',
      soundTitle:'声音设置', music:'背景音乐', sfx:'游戏音效', recommended:'恢复推荐 30 / 85', masterOn:'总开关：开', masterOff:'总开关：关', soundNote:'音乐与音效独立保存 · M 快速静音/恢复'
    },
    en: {
      game:'Dungeon Echo', sub:'地牢回响', floor:'Floor', level:'Level', atk:'ATK', def:'DEF', crit:'Crit', gold:'Gold', potions:'Potions', scrolls:'Scrolls', keys:'Keys', ret:'Return', enemies:'Enemies', skill:'Skill',
      weapon:'Weapon', armor:'Armor', helmet:'Helmet', boots:'Boots', ring:'Ring', amulet:'Amulet', class:'Class', backpack:'Backpack', log:'Adventure Log',
      fullscreen:'Fullscreen', attack:'Attack', potion:'Potion', scroll:'Scroll', descend:'Descend', pause:'Pause', sound:'Sound',
      title:'Dungeon Echo', lede:'Start on Floor 1, cross ten stages and nine deep guardians, then face the Floor-100 finale. Gear, retreat timing and greed decide how deep you survive.', route:'The production journey is always Floor 1 → 100. There is no paid skip and no starting beyond unconquered ground.',
      continue:'Continue', newRun:'New Run', greedyOn:'Greedy Expedition: On', greedyOff:'Greedy Expedition: Off', help:'How to Play', record:'Expedition Record', back:'Back', leave:'Leave',
      classKicker:'Choose Your Echo', classTitle:'Who Are You?', classLede:'Choose your combat rhythm. Every class can reach Floor 100, but each accepts risk in a different way.',
      tutorial:'Tutorial', skip:'Skip Tutorial', reset:'Reset Tutorial',
      moveDesktop:'Move · WASD / arrow keys move and change facing', moveMobile:'Move · Use the left D-pad; movement also changes facing', attackDesktop:'Attack · Face an enemy and press J', attackMobile:'Attack · Face an enemy and tap Attack', skillDesktop:'Skill · Press K; skills consume mana', skillMobile:'Skill · Tap Skill; skills consume mana',
      soundTitle:'Sound Settings', music:'Music', sfx:'SFX', recommended:'Recommended 30 / 85', masterOn:'Master: On', masterOff:'Master: Off', soundNote:'Music and SFX save separately · M toggles mute'
    }
  });
  const tr = key => (T[lang] && T[lang][key]) || T['zh-CN'][key] || key;
  const setText = (el, value) => { if (el && el.textContent !== value) el.textContent = value; };
  const setAttr = (el, name, value) => { if (el && el.getAttribute(name) !== value) el.setAttribute(name, value); };

  const CLASS_EN = Object.freeze({
    warrior:{name:'Warrior',blurb:'Durable melee fighter. Armor scales with level; Cleave controls adjacent packs.',skill:'Cleave'},
    ranger:{name:'Ranger',blurb:'Line-of-sight archer with ranged attacks and agile close-range defense.',skill:'Dash'},
    mage:{name:'Arcanist',blurb:'Fragile ranged caster. Arcane Bolt pressures armored targets and controls space.',skill:'Arcane Bolt'},
    assassin:{name:'Assassin',blurb:'Fragile burst melee class with innate critical chance and positional pressure.',skill:'Shadowstrike'}
  });

  const EXACT = Object.freeze({
    '普通':'Common','精良':'Fine','稀有':'Rare','史诗':'Epic','传说':'Legendary',
    '治疗药水':'Healing Potion','传送卷轴':'Teleport Scroll','回城卷轴':'Return Scroll','保险符':'Insurance Charm','金币':'Gold','锈蚀钥匙':'Rusty Key','终焉之心':'Heart of the End',
    '皮甲':'Leather Armor','锁子甲':'Chainmail','板甲':'Plate Armor','秘银铠':'Mithril Armor','虚空甲':'Void Armor','星骸甲':'Starbone Armor','陨星甲':'Meteor Armor','无光铠':'Lightless Armor','终焉甲':'End Armor','星蚀圣铠':'Eclipse Plate','混沌重甲':'Chaos Heavy Armor',
    '布帽':'Cloth Hood','铁盔':'Iron Helm','骑士头盔':'Knight Helm','龙冠':'Dragon Crown','草鞋':'Cloth Sandals','皮靴':'Leather Boots','钢胫甲':'Steel Greaves','疾风之靴':'Gale Boots',
    '铜戒指':'Copper Ring','红宝石戒':'Ruby Ring','守护之戒':'Guardian Ring','永夜之戒':'Evernight Ring','星骸之戒':'Starbone Ring','陨星之戒':'Meteor Ring','深渊之戒':'Abyss Ring','终焉之戒':'End Ring','星蚀之戒':'Eclipse Ring','混沌之戒':'Chaos Ring',
    '铜坠链':'Copper Pendant','月石坠':'Moonstone Pendant','守护圣符':'Guardian Talisman','深渊之眼':'Eye of the Abyss',
    '铁剑':'Iron Sword','阔剑':'Broadsword','战斧':'Battle Axe','符文之刃':'Runeblade','骑士阔剑':'Knight Broadsword','裂隙之刃':'Riftblade','碎甲战斧':'Sunder Axe','熔火之刃':'Molten Blade','陨星战斧':'Meteor Axe','无光巨刃':'Lightless Greatblade','终焉之刃':'Endblade','虚空斩裂刃':'Void Cleaver','湮灭巨剑':'Annihilation Greatsword',
    '猎弓':'Hunting Bow','强弓':'War Bow','鹰眼长弓':'Eagle-Eye Longbow','追猎之弓':'Stalker Bow','猎手长弓':'Hunter Longbow','裂空之弓':'Skycleaver Bow','幻影猎弓':'Phantom Bow','星辰猎弓':'Starhunter Bow','陨星长弓':'Meteor Longbow','无光猎弓':'Lightless Bow','终焉之弓':'Endbow','霜陨长弓':'Frostfall Longbow','虚空之弓':'Void Bow',
    '学徒法杖':'Apprentice Staff','秘纹法杖':'Runed Staff','星光法杖':'Starlight Staff','奥术权杖':'Arcane Scepter','贤者法杖':'Sage Staff','虚空法杖':'Void Staff','星辉法杖':'Astral Staff','星骸法杖':'Starbone Staff','深渊权杖':'Abyssal Scepter','陨星法杖':'Meteor Staff','终焉法杖':'Endstaff','星蚀法杖':'Eclipse Staff','混沌之杖':'Chaos Staff',
    '匕首':'Dagger','淬毒匕首':'Venom Dagger','暗影匕首':'Shadow Dagger','夜刃':'Nightblade','双刃匕首':'Twin Dagger','裂魂匕首':'Soulripper Dagger','血牙匕首':'Bloodfang Dagger','星骸夜刃':'Starbone Nightblade','陨星匕首':'Meteor Dagger','无光夜刃':'Lightless Nightblade','终焉匕首':'End Dagger','霜陨夜刃':'Frostfall Nightblade','虚空夜刃':'Void Nightblade',
    '锋鸣':'Echo Edge','收割':'Reaper','镇守':'Brace','反击甲':'Reprisal','清创':'Clarity','游猎':'Skirmish','残影':'Afterimage','决斗':'Duelist','危机脉搏':'Crisis Pulse','回路超频':'Overclock','凝息':'Meditate','锋锐':'Keen','饮血':'Blooded','壁垒':'Bastion','荆棘':'Barbed','生息':'Vitality','回春':'Restoration','稳步':'Stout','猎步':'Hunterstep','洞察':'Insight','血契':'Blood Pact','狂意':'Fury','凝神':'Focus','淬炼':'Masterwork',
    '巨鼠':'Dire Rat','蝙蝠':'Cave Bat','哥布林':'Goblin','墓穴蛛':'Crypt Spider','骷髅':'Skeleton','兽人':'Orc','幽魂':'Ghost','血教徒':'Blood Cultist','巨魔':'Troll','深渊恶魔':'Abyss Demon','霜怨灵':'Frost Wraith','霜语法师':'Frostspeaker','墓石魔像':'Gravestone Golem','血爵':'Blood Baron','墓园巫妖':'Graveyard Lich','缝合憎恶':'Stitched Abomination','裂隙龙裔':'Rift Dragonkin','陨星使':'Fallen-Star Herald','虚空幼体':'Void Spawn',
    '腐血伯爵':'Rotblood Count','深渊巫魔':'Abyss Warlock','熔岩龙裔':'Lava Dragonkin','深渊真形':'Abyssal Trueform','堕落陨星使':'Fallen Star Herald','虚空爬行者':'Void Crawler','永冬怨灵':'Everfrost Wraith','深渊铸魔像':'Abyss-Forged Golem','血月主教':'Bloodmoon Bishop','寒冥术士':'Netherfrost Mage','石髓古魔':'Stone-Marrow Ancient','深渊执行者':'Abyss Executioner','回响狱魂':'Echoed Damned','末层狂战士':'Depth Berserker',
    '无光怨灵':'Lightless Wraith','星骸构装体':'Starbone Construct','深渊主教':'Abyss Bishop','虚灵死主':'Ethereal Deathlord','熔核龙裔':'Corefire Dragonkin','脓疱憎恶':'Blight Abomination','虚空吞噬者':'Void Devourer','永霜怨灵':'Eternal Frost Wraith','星蚀天使':'Eclipse Angel','血祖':'Blood Progenitor','深渊宰执':'Abyss Regent','星霜龙裔':'Starfrost Dragonkin','虚空君主':'Void Sovereign','末刃天使':'Endblade Angel','深渊回响':'Abyss Echo','聚合体':'Amalgam','终焉龙裔':'End Dragonkin','虚空彼方':'Beyond the Void',
    '深渊领主':'Abyss Lord','霜骨暴君':'Frostbone Tyrant','熔核战神':'Molten Warlord','虚空执政官':'Void Archon','星骸圣裁':'Starbone Judicator','熔心龙帝':'Moltenheart Dragon Emperor','无光泰坦':'Lightless Titan','星蚀圣座':'Eclipse Seraph','深渊化身':'Abyss Incarnate','终焉渊主':'Lord of the Final Abyss',
    '石砌地窟':'Stone Crypt','苔湿洞穴':'Moss Cavern','血色深渊':'Crimson Abyss','地狱核心':'Infernal Core','霜骨墓园':'Frostbone Graveyard','沉没圣堂':'Sunken Sanctum','虚空裂隙':'Void Rift','熔岩锻炉':'Lava Forge','蛛丝墓穴':'Webbed Tomb','星骸神殿':'Starbone Temple','碎裂回廊':'Shattered Gallery','深红祭坛':'Crimson Altar','永冻深渊':'Everfrozen Abyss','熔核裂谷':'Molten Rift','虚空回声':'Void Echo','亡语圣殿':'Deathwhisper Sanctum','星尘残骸':'Stardust Ruins','无光深渊':'Lightless Abyss','终焉回廊':'Final Gallery','虚空核心':'Void Core','永夜之城':'Evernight City',
    '就绪':'Ready','破甲蓄力':'Armor Break','狂暴!':'ENRAGED!','装备':'Equip','丢弃':'Drop','购买':'Buy','出售':'Sell','售罄':'Sold Out','祈祷':'Pray','离开':'Leave','已征服检查点':'Conquered Checkpoints','抽奖':'Spin','持有':'Owned','库存':'Stock','适配':'Fit','价值':'Value',
    '声音设置':'Sound Settings','背景音乐':'Music','游戏音效':'SFX','恢复推荐 30 / 85':'Recommended 30 / 85','总开关：开':'Master: On','总开关：关':'Master: Off','音乐与音效独立保存 · M 快速静音/恢复':'Music and SFX save separately · M toggles mute'
  });
  const NAME_KEYS = Object.keys(EXACT).sort((a,b) => b.length - a.length);
  const replaceNames = input => {
    let out = String(input || '');
    for (const zh of NAME_KEYS) if (out.includes(zh)) out = out.split(zh).join(EXACT[zh]);
    return out;
  };

  function translateEn(input) {
    const src = String(input || '');
    if (!src || !/[\u3400-\u9fff]/.test(src)) return src;
    if (EXACT[src]) return EXACT[src];
    let out = src;
    out = out
      .replace(/^第\s*(\d+)\s*层$/g,'Floor $1').replace(/第\s*(\d+)\s*层/g,'Floor $1')
      .replace(/攻击 \+(\d+)/g,'ATK +$1').replace(/防御 \+(\d+)/g,'DEF +$1').replace(/生命 \+(\d+)/g,'HP +$1').replace(/暴击 \+(\d+)%/g,'Crit +$1%').replace(/吸血 \+(\d+)%/g,'Leech +$1%').replace(/反伤 \+(\d+)/g,'Thorns +$1').replace(/击杀回复 \+(\d+)/g,'Kill Heal +$1')
      .replace(/强化 \+(\d+)/g,'Forge +$1').replace(/评分\s*(\d+)/g,'Score $1').replace(/价值\s*(\d+)/g,'Value $1').replace(/适配\s*(\d+)/g,'Fit $1')
      .replace(/^强化到 \+(\d+)，需 (\d+) G$/,'Forge to +$1 · $2 G').replace(/^已至 \+5 极致$/,'Maxed at +5')
      .replace(/^\+3 精炼：为【(.+)】定一个方向$/,'+3 Refinement: choose a path for [$1]')
      .replace(/^精炼不会失败，也不会毁坏装备。这个选择会在 \+5 时继续淬炼强化。$/,'Refinement cannot fail or destroy gear. This path gains another masterwork bonus at +5.')
      .replace(/更稳定地走暴击路线。/g,'A stable critical-strike path.').replace(/用持续吸血换取推进续航。/g,'Trade for sustained leech and expedition endurance.').replace(/把生存重心转向生命，而不是继续堆纯 DEF。/g,'Shift survival toward HP instead of pure DEF.').replace(/近战换血时获得更强反伤收益。/g,'Gain stronger thorns value in melee trades.').replace(/扩大生命池，提高失误容错。/g,'Expand the HP pool for more mistake tolerance.').replace(/强化击杀后的长期续航。/g,'Improve long-run sustain after kills.').replace(/以生命换取稳定推进。/g,'Trade toward HP for steadier progress.').replace(/轻量暴击方向，适合游侠\/刺客等主动拉扯构筑。/g,'A light Crit path for mobile Ranger/Assassin builds.').replace(/把戒指定型为暴击核心。/g,'Turn the ring into a Crit core.').replace(/把戒指定型为吸血续航核心。/g,'Turn the ring into a leech-sustain core.').replace(/直接强化攻击，适合高压输出路线。/g,'Directly strengthen ATK for high-pressure damage builds.').replace(/把项链定型为暴击\/爆发方向。/g,'Shape the amulet toward Crit and burst.')
      .replace(/^你Gear了\s*/,'You equipped ').replace(/^你装备了\s*/,'You equipped ').replace(/^你捡起了?\s*/,'Picked up ')
      .replace(/^你击中([^，,]+)[，,]\s*(?:造成\s*)?(\d+)\s*点伤害[。！!]?$/,'You hit $1 for $2 damage.').replace(/^你击中([^，,]+)[，,]\s*dealt\s*(\d+)\s*damage[。！!]?$/i,'You hit $1 for $2 damage.')
      .replace(/^([^，,。！!]+)击中你[，,]\s*(?:造成\s*)?(\d+)\s*点伤害[。！!]?$/,'$1 hits you for $2 damage.').replace(/^([^，,。！!]+)击中你[，,]\s*dealt\s*(\d+)\s*damage[。！!]?$/i,'$1 hits you for $2 damage.')
      .replace(/你捡起了?\s*(\d+)\s*枚\s*金币/g,'Picked up $1 Gold').replace(/(\d+)\s*枚\s*金币/g,'$1 Gold').replace(/(\d+)\s*枚\s*Gold/gi,'$1 Gold')
      .replace(/被消灭了！?/g,' was slain!').replace(/被击败了！?/g,' was defeated!').replace(/\(\+(\d+)\s*经验\)/g,'(+$1 XP)').replace(/\+(\d+)\s*经验/g,'+$1 XP')
      .replace(/^蓝量不足：/,'Not enough mana: ').replace(/原地等待可更快恢复/g,'Wait/focus to recover faster').replace(/^凝神 \+(\d+) 蓝量$/,'Focus +$1 mana').replace(/ −(\d+) 蓝量$/,' −$1 mana')
      .replace(/^冷却\s*(\d+)$/,'CD $1')
      .replace(/站在楼梯上按 Enter 下潜/g,'Stand on stairs and press Enter to descend').replace(/点击已探索地块可移动/g,'click explored tiles to move').replace(/J 攻击/g,'J Attack').replace(/K 技能/g,'K Skill')
      .replace(/破甲大招 · 命中无视护甲/g,'Armor-break special · Hit ignores armor')
      .replace(/一百层深渊在脚下展开。选一条回响，杀穿 100 层，从终焉渊主手中夺回「终焉之心」——或踏入无尽。/g,'A hundred-floor abyss opens below. Choose an echo, cut through 100 floors, reclaim the Heart of the End from the Lord of the Final Abyss — or descend forever.')
      .replace(/，/g,', ').replace(/。/g,'.').replace(/！/g,'!').replace(/\s{2,}/g,' ');
    return replaceNames(out);
  }

  function translateTree(root) {
    if (!en || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      const raw = String(root.nodeValue || '');
      const wanted = translateEn(raw);
      if (wanted !== raw) root.nodeValue = wanted;
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const raw = String(node.nodeValue || '');
      const wanted = translateEn(raw);
      if (wanted !== raw) node.nodeValue = wanted;
    }
  }

  function setPrefix(childId, label) {
    const child = document.getElementById(childId), parent = child && child.parentElement;
    if (!parent) return;
    let node = Array.from(parent.childNodes).find(n => n.nodeType === Node.TEXT_NODE && String(n.nodeValue || '').trim());
    const wanted = label + ' ';
    if (node) { if (node.nodeValue !== wanted) node.nodeValue = wanted; }
    else parent.insertBefore(document.createTextNode(wanted), child);
  }

  function setAction(act, label, hotkey) {
    const el = document.querySelector(`#actions [data-act="${act}"]`);
    if (!el) return;
    let hk = el.querySelector('span');
    if (!hk) { hk = document.createElement('span'); el.appendChild(hk); }
    hk.textContent = hotkey;
    let node = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
    if (!node) { node = document.createTextNode(''); el.insertBefore(node, el.firstChild); }
    node.nodeValue = label + ' ';
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = en ? 'Dungeon Echo · 100-Floor Browser Roguelike' : '地牢回响 · Dungeon Echo';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = en ? 'Dungeon Echo is a browser-native 100-floor turn-based roguelike about builds, risk, retreat and guardians.' : '地牢回响 Dungeon Echo——从第 1 层一路深入第 100 层的离线单机网页 Roguelike。四职业、装备构筑、贪婪远征与无尽回响。';
    const h1 = document.querySelector('header h1');
    if (h1) h1.innerHTML = `${tr('game')} <span class="sub">${tr('sub')}</span>`;
    [['st-depth','floor'],['st-lvl','level'],['st-atk','atk'],['st-def','def'],['st-crit','crit'],['st-gold','gold'],['st-potion','potions'],['st-scroll','scrolls'],['st-key','keys'],['st-escape','ret'],['st-mobs','enemies'],['st-skill','skill']].forEach(([id,key]) => setPrefix(id,tr(key)));
    [['weapon','weapon'],['armor','armor'],['helmet','helmet'],['boots','boots'],['ring','ring'],['amulet','amulet']].forEach(([slot,key]) => setText(document.querySelector(`#eq-${slot} .eqname`),tr(key)));
    setText(document.querySelector('#logbox .boxtitle'),tr('log'));
    setPrefix('bagcount',tr('backpack'));
    setAction('attack',tr('attack'),'J'); setAction('skill',tr('skill'),'K'); setAction('potion',tr('potion'),'Q'); setAction('scroll',tr('scroll'),'E'); setAction('escape',tr('ret'),'T'); setAction('descend',tr('descend'),'Enter'); setAction('pause',tr('pause'),'Esc'); setAction('mute',tr('sound'),'M');
    const full = document.getElementById('fullscreen-toggle');
    if (full) { const k = full.querySelector('kbd'); full.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.nodeValue = ' ' + tr('fullscreen') + ' '; }); if (k) k.textContent = 'F'; }
    setText(document.querySelector('#title-screen h2'),tr('title')); setText(document.querySelector('#title-screen .title-card>.lede'),tr('lede'));
    const depth = document.querySelector('#title-screen .depth-picker'); if (depth) { setText(depth.querySelector('.kicker'), en ? '100-Floor Expedition' : '百层远征'); setText(depth.querySelector('.lede'),tr('route')); }
    setText(document.getElementById('btn-continue'),tr('continue')); setText(document.getElementById('btn-new'),tr('newRun')); setText(document.getElementById('btn-help'),tr('help')); setText(document.getElementById('btn-achv'),tr('record'));
    const greedy = document.getElementById('btn-greedy'); if (greedy) setText(greedy,tr(greedy.getAttribute('aria-pressed') === 'true' ? 'greedyOn' : 'greedyOff'));
    setText(document.querySelector('#class-screen .kicker'),tr('classKicker')); setText(document.querySelector('#class-screen h2'),tr('classTitle')); setText(document.querySelector('#class-screen .class-lede'),tr('classLede')); setText(document.getElementById('btn-class-back'),tr('back'));
    setAttr(document.getElementById('game'),'aria-label',en?'Dungeon map: WASD / arrows move and face, J attacks, K uses skills':'地牢地图：WASD / 方向键移动与转向，J 攻击，K 技能');
    translateTree(document.body);
  }

  function syncClasses() {
    if (!en || !api.CLASSES) return;
    for (const [id, row] of Object.entries(CLASS_EN)) {
      const c = api.CLASSES[id]; if (!c) continue;
      c.name = row.name; c.blurb = row.blurb; if (c.skill) c.skill.name = row.skill;
    }
    const root = document.getElementById('class-grid');
    if (root) for (const card of root.querySelectorAll('[data-class]')) {
      const c = api.CLASSES[card.dataset.class]; if (!c) continue;
      setText(card.querySelector('h3'),c.name); setText(card.querySelector('p'),c.blurb);
    }
    const id = api.classId || (api.meta && api.meta.classId), c = id && api.CLASSES[id];
    if (c) setText(document.getElementById('st-class'),c.name);
  }

  function navigate(next) {
    const targetLang = String(next).toLowerCase() === 'en' ? 'en' : 'zh-CN';
    try { localStorage.setItem(STORAGE_KEY,targetLang); } catch (_e) {}
    const target = new URL(location.href); target.searchParams.set('lang',targetLang === 'en' ? 'en' : 'zh');
    location.replace(target.href);
    return true;
  }

  function installLanguageEntry() {
    const title = document.querySelector('#title-screen .title-card'); if (!title) return;
    let box = document.getElementById('de-title-language');
    if (!box) {
      box = document.createElement('div'); box.id = 'de-title-language'; box.setAttribute('aria-label','Language / 语言');
      box.innerHTML = '<span>Language / 语言</span><button type="button" data-lang="zh-CN">中文</button><button type="button" data-lang="en">English</button>';
      const actions = title.querySelector('.title-actions'); actions ? title.insertBefore(box,actions) : title.appendChild(box);
      box.addEventListener('click',e => { const btn = e.target.closest && e.target.closest('button[data-lang]'); if (btn && btn.dataset.lang !== lang) { e.preventDefault(); navigate(btn.dataset.lang); } });
    }
    for (const btn of box.querySelectorAll('button[data-lang]')) { const active = btn.dataset.lang === lang; btn.classList.toggle('active',active); btn.setAttribute('aria-pressed',active?'true':'false'); }
    if (!document.getElementById('de-locale-v122-style')) {
      const style = document.createElement('style'); style.id = 'de-locale-v122-style'; style.textContent = '#de-lang-toggle{display:none!important}#de-title-language{display:flex;align-items:center;justify-content:center;gap:7px;margin:13px 0 5px;color:#9ba9bd;font:600 11px/1.2 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}#de-title-language>span{margin-right:3px}#de-title-language button{min-width:70px;border:1px solid rgba(132,157,196,.32);border-radius:7px;background:rgba(8,12,19,.78);color:#b9c6d7;padding:6px 10px;cursor:pointer}#de-title-language button.active{border-color:rgba(224,167,58,.58);background:rgba(60,42,18,.62);color:#f2d695}@media(max-width:700px){#de-title-language{flex-wrap:wrap}#de-title-language>span{width:100%;text-align:center;margin:0}}'; document.head.appendChild(style);
    }
  }

  function syncNarrowStatus() {
    if (!en) return;
    const skill = document.getElementById('st-skill'); if (skill) { const raw = skill.textContent.trim(); if (/^冷却\s*\d+/.test(raw)) skill.textContent = raw.replace(/^冷却\s*/,'CD '); else if (raw === '就绪') skill.textContent = 'Ready'; }
    const hint = document.getElementById('hint'); if (hint) { const raw = hint.textContent, wanted = translateEn(raw); if (wanted !== raw) hint.textContent = wanted; }
    const feedback = document.getElementById('de-combat-feedback'); if (feedback) { const raw = feedback.textContent, wanted = translateEn(raw); if (wanted !== raw) feedback.textContent = wanted; }
    syncClasses();
  }

  window.DE_I18N = { version:'v122', t:key => tr(key), setLang:navigate, apply:applyStatic, translate:translateEn, get lang(){return lang}, get isEnglish(){return en} };
  applyStatic(); syncClasses(); installLanguageEntry(); syncNarrowStatus();

  // One event-driven observer: added DOM only. No polling and no global characterData scan.
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes || []) translateTree(node);
      syncNarrowStatus(); installLanguageEntry();
    }).observe(document.body,{childList:true,subtree:true});
    for (const id of ['st-skill','hint','de-combat-feedback']) {
      const el = document.getElementById(id); if (!el) continue;
      new MutationObserver(syncNarrowStatus).observe(el,{childList:true,subtree:true,characterData:true});
    }
  }

  window.__DE_LOCALE_V122 = { version:'v1', lang, translateEn, translateTree, sync:syncNarrowStatus, navigate };
})();
