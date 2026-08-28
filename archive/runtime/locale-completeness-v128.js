/* Dungeon Echo v1.2.8 locale completeness layer.
 * Keeps English sessions English when existing UI nodes are rewritten in place.
 * Scope is presentation only: no gameplay state, timers, RNG, save data or balance changes.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined' || window.__DE_LOCALE_COMPLETENESS_V128) return;

  const base = window.DE_I18N;
  const urlLang = (() => { try { return String(new URL(location.href).searchParams.get('lang') || '').toLowerCase(); } catch (_e) { return ''; } })();
  const english = !!(base ? base.isEnglish : urlLang === 'en');
  const CJK = /[\u3400-\u9fff]/;

  const baseTranslate = value => {
    const src = String(value ?? '');
    if (!english || !src || !CJK.test(src)) return src;
    try { return base && typeof base.translate === 'function' ? String(base.translate(src)) : src; }
    catch (_e) { return src; }
  };

  const name = value => baseTranslate(String(value ?? '')).trim();

  function translateDynamic(value) {
    const src = String(value ?? '');
    if (!english || !src || !CJK.test(src)) return src;
    let m;

    // Production-control copy: normalize legacy core wording to the actual J/K owner semantics.
    if ((m = src.match(/^你选择了(.+?)。技能「(.+?)」按 C 释放。撞向敌人即攻击。(?:面朝敌人所在直线（射程\s*(\d+)\s*格内、无遮挡）移动即可射箭。)?$/))) {
      const ranged = m[3] ? ` Ranged attacks can reach up to ${m[3]} tiles in your facing line.` : '';
      return `You chose ${name(m[1])}. Press J to attack in your facing direction. Press K to use ${name(m[2])}.${ranged}`;
    }
    if ((m = src.match(/^>\s*Enter 下潜 · J 快速下潜（[^）]*）$/))) return '> Enter Descend · J Attack · K Skill';
    if (/^>\s*站在楼梯上按 Enter 下潜 · 点击已探索地块移动 · C 技能$/.test(src)) return '> Stand on stairs and press Enter to descend · click explored tiles to move · J Attack · K Skill';
    if (/^>\s*撞向商人即可交易$/.test(src)) return '> Walk into the merchant to trade';
    if (/^>\s*撞向神龛即可祈祷$/.test(src)) return '> Walk into the shrine to pray';
    if (/^>\s*撞向营地即可包扎$/.test(src)) return '> Walk into the camp to rest';
    if (/^>\s*击败本层首领才能离开。?$/.test(src)) return '> Defeat the floor boss before leaving.';
    if (src === '面向敌人后按 J 攻击') return 'Face an enemy and press J to attack';
    if (src === '技能热键已改为 K') return 'Skill hotkey is K';
    if (src === 'J 攻击 · K 技能') return 'J Attack · K Skill';
    if ((m = src.match(/^蓝量不足：\s*(\d+)\/(\d+)\s*·\s*原地等待可更快恢复$/))) return `Not enough mana: ${m[1]}/${m[2]} · wait/focus to recover faster`;
    if ((m = src.match(/^凝神 \+(\d+) 蓝量$/))) return `Focus +${m[1]} mana`;
    if ((m = src.match(/^(.+?)\s*−(\d+)\s*蓝量$/))) return `${name(m[1])} −${m[2]} mana`;

    // Runtime shell rewrites.
    if ((m = src.match(/^第\s*(\d+)\s*层\s*·\s*(.+?)\s*·\s*进度已写入本地。$/))) return `Floor ${m[1]} · ${name(m[2])} · Progress saved locally.`;
    if ((m = src.match(/^存档（(.+?)）：(.+?)\s*·\s*第\s*(\d+)\s*层\s*·\s*等级\s*(\d+)$/))) return `Save (${name(m[1])}): ${name(m[2])} · Floor ${m[3]} · Level ${m[4]}`;
    if ((m = src.match(/^尚无中途存档（(.+?)）。下楼、暂停或离开页面时会自动写入。$/))) return `No mid-run save yet (${name(m[1])}). Progress saves automatically when descending, pausing or leaving the page.`;
    if (src === '贪婪远征：开') return 'Greedy Expedition: On';
    if (src === '贪婪远征：关') return 'Greedy Expedition: Off';
    if ((m = src.match(/^(\d+)回合$/))) return `CD ${m[1]}`;

    // Casks, pickups and chest interactions.
    if ((m = src.match(/^你踩上了陷阱，受到\s*(\d+)\s*点伤害[！!]$/))) return `You stepped on a trap and took ${m[1]} damage!`;
    if ((m = src.match(/^(?:木桶|Cask)裂开[，,]\s*滚出\s*(\d+)\s*(?:枚金币|枚?Gold)[。.]?$/))) return `The cask split open and spilled ${m[1]} Gold.`;
    if (/^(?:木桶|Cask)里藏着一眼(?:治疗药水|Healing Potion)[！!]$/.test(src)) return 'A Healing Potion was hidden in the cask!';
    if ((m = src.match(/^(?:木桶|Cask)里藏着【(.+)】[，,]但它掉落在了地上[。.]$/))) return `The cask held [${name(m[1])}], but it fell to the ground.`;
    if ((m = src.match(/^(?:木桶|Cask)里藏着【(.+)】[！!]$/))) return `The cask held [${name(m[1])}]!`;
    if (/^(?:木桶|Cask)碎片下空空如也[。.]$/.test(src)) return 'Nothing but splinters inside the cask.';
    if (/^(?:木桶|Cask)里积满了陈年灰尘[。.]$/.test(src)) return 'The cask was filled with ancient dust.';
    if (/^(?:你捡起了|Picked up)\s*(?:一瓶)?(?:治疗药水|Healing Potion)[。.]$/.test(src)) return 'Picked up a Healing Potion.';
    if (/^(?:你捡起了|Picked up)\s*(?:一张)?(?:传送卷轴|Teleport Scroll)[。.]$/.test(src)) return 'Picked up a Teleport Scroll.';
    if (/^(?:你捡起了|Picked up)\s*(?:一张)?(?:回城卷轴|Return Scroll)——按 T 即可带着战利品平安回镇[！!]$/.test(src)) return 'Picked up a Return Scroll — press T to bring your loot safely back to town!';
    if (/^(?:你捡起了|Picked up)\s*(?:一把)?(?:锈蚀钥匙|Rusty Key)[。.]$/.test(src)) return 'Picked up a Rusty Key.';
    if ((m = src.match(/^(?:你捡起了|Picked up)\s*(\d+)\s*(?:枚金币|枚?Gold)[。.]$/))) return `Picked up ${m[1]} Gold.`;
    if ((m = src.match(/^拾取【(.+)】$/))) return `Picked up [${name(m[1])}]`;
    if (src === '背包已满，无法拾取装备！') return 'Backpack full — cannot pick up gear!';
    if (src === '背包已满，无法卸下装备！') return 'Backpack full — cannot unequip this item!';
    if (src === '宝箱锁着。你需要一把钥匙。') return 'The chest is locked. You need a key.';
    if ((m = src.match(/^你打开宝箱，【(.+)】掉在地上。$/))) return `You opened the chest. [${name(m[1])}] fell to the ground.`;
    if ((m = src.match(/^你打开宝箱，获得【(.+)】。$/))) return `You opened the chest and obtained [${name(m[1])}].`;
    if (src === '箱底还有一撮金币。') return 'There is more Gold at the bottom of the chest.';
    if ((m = src.match(/^你装备了【(.+)】。$/))) return `You equipped [${name(m[1])}].`;
    if ((m = src.match(/^你把【(.+)】丢在了地上。$/))) return `You dropped [${name(m[1])}] on the ground.`;

    // Floor flow and Greedy Expedition lifecycle.
    if ((m = src.match(/^本层有\s*(\d+)\s*个(?:敌人|Enemies?)、\s*(\d+)\s*处物资[。.]$/i))) return `This floor has ${m[1]} enemies and ${m[2]} loot spots.`;
    if ((m = src.match(/^本层有\s*(\d+)\s*个(?:敌人|Enemies?)、\s*(\d+)\s*处物资[。.]站上楼梯按 Enter 下潜[。.]$/i))) return `This floor has ${m[1]} enemies and ${m[2]} loot spots. Stand on the stairs and press Enter to descend.`;
    if ((m = src.match(/^第\s*(\d+)\s*次下潜：搜刮战利品，用(?:回城卷轴|Return Scroll)（T）把一切平安带回小镇——死在这里就会失去背包和(?:金币|Gold)[！!]$/))) return `Descent ${m[1]}: loot what you can, then use Return Scroll (T) to bring it safely back to town — dying here loses your backpack and carried Gold!`;
    if ((m = src.match(/^你沿着螺旋阶梯下到了第\s*(\d+)\s*层——(.+)[。.]$/))) return `You descended the spiral stairs to Floor ${m[1]} — ${name(m[2])}.`;
    if ((m = src.match(/^回响第\s*(\d+)\s*层——(.+)[。.]怪物随着深度一同苏醒[。.]$/))) return `Echo Floor ${m[1]} — ${name(m[2])}. The monsters awaken with the depth.`;
    if ((m = src.match(/^你向回响支付了\s*(\d+)\s*G，沿捷径直坠\s*(\d+)\s*层——来到第\s*(\d+)\s*层[。.]$/))) return `You paid the Echo ${m[1]} G and plunged ${m[2]} floors down the shortcut — arriving at Floor ${m[3]}.`;
    if ((m = src.match(/^(?:金币|Gold)不够——向回响支付\s*(\d+)\s*G\s*才能直坠\s*(\d+)\s*层[。.]$/))) return `Not enough Gold — the Echo demands ${m[1]} G to dive ${m[2]} floors.`;
    if ((m = src.match(/^你撕开(?:回城卷轴|Return Scroll)，平安回到小镇。\s*(\d+)\s*(?:金币|Gold)落入金库。$/))) return `You tore open a Return Scroll and reached town safely. ${m[1]} Gold was deposited in the vault.`;
    if ((m = src.match(/^你倒在第\s*(\d+)\s*层……失去了背包里的\s*(\d+)\s*件物品和随身\s*(\d+)\s*(?:金币|Gold)。$/))) return `You fell on Floor ${m[1]} and lost ${m[2]} backpack items and ${m[3]} carried Gold.`;
    if (src === '好在穿在身上的装备还在。整备一番，再下去！') return 'Your equipped gear survived. Prepare and descend again!';

    // Combat and recovery.
    if ((m = src.match(/^(暴击！)?你击中(.+)，造成\s*(\d+)\s*点伤害[。.]$/))) return `${m[1] ? 'Critical! ' : ''}You hit ${name(m[2])} for ${m[3]} damage.`;
    if ((m = src.match(/^(暴击！)?你射中(.+)，造成\s*(\d+)\s*点伤害[。.]$/))) return `${m[1] ? 'Critical! ' : ''}You shot ${name(m[2])} for ${m[3]} damage.`;
    if ((m = src.match(/^(.+)击中你，造成\s*(\d+)\s*点伤害[！!]$/))) return `${name(m[1])} hit you for ${m[2]} damage!`;
    if ((m = src.match(/^(.+)\s*远程袭击你，造成\s*(\d+)\s*点伤害[！!]$/))) return `${name(m[1])} hit you from range for ${m[2]} damage!`;
    if ((m = src.match(/^(.+)被消灭了[！!]（\+(\d+)\s*(?:经验|XP)）$/))) return `${name(m[1])} was slain! (+${m[2]} XP)`;
    if ((m = src.match(/^(.+)\s*陷入狂暴，攻势暴涨[！!]$/))) return `${name(m[1])} became enraged!`;
    if ((m = src.match(/^(.+)的攻击被你灵巧闪开[。.]$/))) return `You dodged ${name(m[1])}'s attack.`;
    if ((m = src.match(/^(.+)\s*的蓄力破甲命中，造成\s*(\d+)\s*点无视护甲伤害[！!]$/))) return `${name(m[1])}'s Armor Break hit for ${m[2]} armor-piercing damage!`;
    if ((m = src.match(/^(.+)\s*的蓄力射击命中，造成\s*(\d+)\s*点无视护甲伤害[！!]$/))) return `${name(m[1])}'s charged shot hit for ${m[2]} armor-piercing damage!`;
    if ((m = src.match(/^你避开了(.+)的破甲重击窗口。$/))) return `You avoided ${name(m[1])}'s Armor Break window.`;
    if (src === '毒素渗进伤口。') return 'Poison seeps into the wound.';
    if ((m = src.match(/^毒素发作，失去\s*(\d+)\s*点生命。$/))) return `Poison deals ${m[1]} damage.`;
    if (src === '伤口崩裂——短时间内治疗效果减半！') return 'Wounds reopen — healing is temporarily halved!';
    if ((m = src.match(/^你喝下药水，恢复了\s*(\d+)\s*点生命[。.]$/))) return `You drank a potion and restored ${m[1]} HP.`;
    if (src === '你没有药水了。') return 'You have no potions left.';
    if (src === '你现在状态很好，不需要喝药水。') return 'You are already healthy enough; no potion needed.';
    if (src === '你没有卷轴了。') return 'You have no scrolls left.';
    if (src === '卷轴的光芒将你传送到了未知之处……') return 'The scroll carries you to an unknown place…';
    if ((m = src.match(/^技能冷却中（(\d+)\s*回合）[。.]$/))) return `Skill cooldown: ${m[1]} turns.`;
    if ((m = src.match(/^你升到了\s*(\d+)\s*级[！!]攻击\+1，生命上限\+6[。.]$/))) return `Level ${m[1]}! ATK +1, Max HP +6.`;
    if (src === '你原地观察四周。') return 'You wait and watch your surroundings.';

    // Class skill feedback.
    if (src === '附近没有可以横扫的敌人。') return 'No adjacent enemies to Cleave.';
    if ((m = src.match(/^横扫命中\s*(\d+)\s*个敌人[！!]$/))) return `Cleave hit ${m[1]} enemies!`;
    if (src === '这个方向无法疾步。') return 'Dash is blocked in that direction.';
    if ((m = src.match(/^疾步穿过\s*(\d+)\s*个敌人。$/))) return `Dash crossed ${m[1]} enemies.`;
    if (src === '你向前疾步。') return 'You dash forward.';
    if (src === '视野内没有可以点射的敌人。') return 'No visible target for Arcane Bolt.';
    if ((m = src.match(/^奥术弹击中(.+)，造成\s*(\d+)\s*点伤害。$/))) return `Arcane Bolt hit ${name(m[1])} for ${m[2]} damage.`;
    if (src === '视野内没有可以偷袭的目标。') return 'No visible target for Shadowstrike.';
    if (src === '目标周围没有落脚点，偷袭失败。') return 'No safe landing tile beside the target; Shadowstrike failed.';
    if ((m = src.match(/^你欺入(.+)身侧，偷袭暴击造成\s*(\d+)\s*点伤害[！!]$/))) return `Shadowstrike hits ${name(m[1])} for ${m[2]} critical damage!`;

    // Rest, shrine and secrets.
    if (src === '墙面裂开，露出一间密室！') return 'The wall splits open, revealing a secret room!';
    if (src === '余烬已经冷了。') return 'The embers have gone cold.';
    if ((m = src.match(/^你在营地包扎伤口，恢复了\s*(\d+)\s*点生命。$/))) return `You rest at camp and recover ${m[1]} HP.`;
    if (src === '神龛已经沉寂。') return 'The shrine has gone silent.';
    if (src === '祈祷可能赐福，也可能索取代价。你要碰它吗？') return 'Prayer may grant a blessing or demand a price. Touch the shrine?';

    let out = baseTranslate(src);
    if (!CJK.test(out)) return out;

    // Last-mile normalization for text the stable owner already translated partially.
    out = out
      .replace(/^(?:木桶|Cask)裂开[，,]\s*滚出\s*(\d+)\s*(?:枚)?Gold[。.]?$/, 'The cask split open and spilled $1 Gold.')
      .replace(/^Picked up\s+(?:一瓶)?Healing Potion[。.]?$/, 'Picked up a Healing Potion.')
      .replace(/^Picked up\s+(?:一张)?Teleport Scroll[。.]?$/, 'Picked up a Teleport Scroll.')
      .replace(/^Picked up\s+(?:一把)?Rusty Key[。.]?$/, 'Picked up a Rusty Key.')
      .replace(/^第\s*(\d+)\s*次下潜：搜刮战利品，用Return Scroll（T）把一切平安带回小镇——死在这里就会失去背包和Gold[！!]$/, 'Descent $1: loot what you can, then use Return Scroll (T) to bring it safely back to town — dying here loses your backpack and carried Gold!')
      .replace(/^本层有\s*(\d+)\s*个敌人、\s*(\d+)\s*处物资[。.]?$/, 'This floor has $1 enemies and $2 loot spots.')
      .replace(/站上楼梯按 Enter 下潜[。.]?$/, 'Stand on the stairs and press Enter to descend.')
      .replace(/J 快速下潜（[^）]*）/g, 'J Attack · K Skill')
      .replace(/C 技能/g, 'J Attack · K Skill');

    return out;
  }

  function translateTextNode(node) {
    if (!english || !node || node.nodeType !== Node.TEXT_NODE) return false;
    const before = String(node.nodeValue || '');
    if (!CJK.test(before)) return false;
    const after = translateDynamic(before);
    if (after === before) return false;
    node.nodeValue = after;
    return true;
  }

  function translateTree(root) {
    if (!english || !root) return 0;
    let changed = 0;
    if (root.nodeType === Node.TEXT_NODE) return translateTextNode(root) ? 1 : 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) if (translateTextNode(node)) changed++;
    return changed;
  }

  const SLOT_LABELS = Object.freeze({
    weapon:'Weapon', armor:'Armor', helmet:'Helmet', boots:'Boots', ring:'Ring', amulet:'Amulet'
  });
  const EMPTY_SLOT_ZH = Object.freeze({
    weapon:'武器', armor:'护甲', helmet:'头盔', boots:'靴子', ring:'戒指', amulet:'项链'
  });

  function enforceEquipmentLabels() {
    if (!english) return 0;
    let changed = 0;
    for (const [slot, label] of Object.entries(SLOT_LABELS)) {
      const el = document.querySelector(`#eq-${slot} .eqname`);
      if (!el) continue;
      const current = String(el.textContent || '').trim();
      const wanted = !current || current === EMPTY_SLOT_ZH[slot] || current === label ? label : name(current);
      if (wanted && current !== wanted) { el.textContent = wanted; changed++; }
    }
    const classEl = document.getElementById('st-class');
    if (classEl && CJK.test(classEl.textContent || '')) {
      const translated = name(classEl.textContent);
      if (translated && translated !== classEl.textContent) { classEl.textContent = translated; changed++; }
    }
    return changed;
  }

  function cleanEnglishHeader() {
    if (!english) return false;
    const sub = document.querySelector('header h1 .sub');
    if (!sub) return false;
    sub.textContent = '';
    sub.hidden = true;
    sub.style.display = 'none';
    sub.setAttribute('aria-hidden', 'true');
    return true;
  }

  const ROOT_SELECTORS = Object.freeze([
    '#stats', '#equipbar', '#stage', '#touch', '#log', '#bag', '#bagdetail', '#tooltip', '#hint', '#help',
    '#title-screen', '#class-screen', '#pause-screen', '#overlay', '#shop-screen', '#talent-screen',
    '#town-screen', '#shrine-screen', '#echo-screen'
  ]);

  const observers = [];
  const observed = new WeakSet();
  function observeRoot(root) {
    if (!english || !root || observed.has(root) || typeof MutationObserver === 'undefined') return;
    observed.add(root);
    translateTree(root);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') translateTextNode(record.target);
        for (const node of record.addedNodes || []) translateTree(node);
      }
      if (root.id === 'equipbar') enforceEquipmentLabels();
    });
    observer.observe(root, { childList:true, characterData:true, subtree:true });
    observers.push(observer);
  }

  function attachKnownRoots() {
    for (const selector of ROOT_SELECTORS) {
      const root = document.querySelector(selector);
      if (root) observeRoot(root);
    }
  }

  function apply() {
    if (!english) return false;
    cleanEnglishHeader();
    enforceEquipmentLabels();
    attachKnownRoots();
    return true;
  }

  apply();
  window.__DE_LOCALE_COMPLETENESS_V128 = {
    version:'v2', english, translateDynamic, translateTree, enforceEquipmentLabels,
    roots:ROOT_SELECTORS, observers, attachKnownRoots
  };
})();
