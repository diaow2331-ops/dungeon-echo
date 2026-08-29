from pathlib import Path

p=Path('game/core/game.js')
s=p.read_text(encoding='utf-8')

def r(old,new,label):
    global s
    count=s.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    s=s.replace(old,new,1)

r("    floater(player, '破甲重击!', '#e0a73a');", "    floater(player, ui('破甲重击!','ARMOR BREAK!'), '#e0a73a');", 'armor-break floater')
r("        floater(m, '蓄力落空', '#9b8d78');", "        floater(m, ui('蓄力落空','CHARGE MISSED'), '#9b8d78');", 'charge-missed floater')

r("""  showOverlay('dead',
    `你倒在了第 <b>${depth}</b> 层。<br>` +
    `${esc(classDef().name)} · 等级 <b>${player.lvl}</b> · 击杀 <b>${player.kills}</b> · 金币 <b>${player.gold}</b> · 回合 <b>${turns}</b><br>` +
    bestText());""", """  showOverlay('dead',
    ui(
      `你倒在了第 <b>${depth}</b> 层。<br>` +
        `${esc(classDef().name)} · 等级 <b>${player.lvl}</b> · 击杀 <b>${player.kills}</b> · 金币 <b>${player.gold}</b> · 回合 <b>${turns}</b><br>`,
      `You fell on Floor <b>${depth}</b>.<br>` +
        `${esc(classDef().name)} · Level <b>${player.lvl}</b> · Kills <b>${player.kills}</b> · Gold <b>${player.gold}</b> · Turns <b>${turns}</b><br>`) +
    bestText());""", 'death overlay')

r("""function bestText() {
  const b = loadBest();
  return `历史最深：<b>${b.bestDepth || 0}</b> 层 · 历史最高等级：<b>${b.bestLvl || 1}</b> · 历史最多击杀：<b>${b.bestKills || 0}</b> · 历史最多金币：<b>${b.bestGold || 0}</b>`;
}
function showOverlay(kind, bodyHtml) {
  const title = $('ov-title');
  title.textContent = kind === 'dead' ? '你死了' : '胜利！';""", """function bestText() {
  const b = loadBest();
  return ui(
    `历史最深：<b>${b.bestDepth || 0}</b> 层 · 历史最高等级：<b>${b.bestLvl || 1}</b> · 历史最多击杀：<b>${b.bestKills || 0}</b> · 历史最多金币：<b>${b.bestGold || 0}</b>`,
    `Deepest: <b>${b.bestDepth || 0}</b> · Highest Level: <b>${b.bestLvl || 1}</b> · Most Kills: <b>${b.bestKills || 0}</b> · Most Gold: <b>${b.bestGold || 0}</b>`);
}
function showOverlay(kind, bodyHtml) {
  const title = $('ov-title');
  title.textContent = kind === 'dead' ? ui('你死了','You Died') : ui('胜利！','Victory!');""", 'best/overlay copy')

r("""  if (metaEl) {
    const modeTag = greedyMode ? '贪婪远征' : '经典回响';
    metaEl.textContent = save
      ? `存档（${modeTag}）：${CLASSES[save.classId]?.name || '冒险者'} · 第 ${save.depth} 层 · 等级 ${save.player.lvl}`
      : `尚无中途存档（${modeTag}）。下楼、暂停或离开页面时会自动写入。`;
  }
""", """  if (metaEl) {
    const modeTag = greedyMode ? ui('贪婪远征','Greedy Expedition') : ui('经典回响','Classic Echo');
    const savedClass = CLASSES[save && save.classId]?.name || ui('冒险者','Adventurer');
    metaEl.textContent = save
      ? ui(`存档（${modeTag}）：${savedClass} · 第 ${save.depth} 层 · 等级 ${save.player.lvl}`,
        `Save (${modeTag}): ${savedClass} · Floor ${save.depth} · Level ${save.player.lvl}`)
      : ui(`尚无中途存档（${modeTag}）。下楼、暂停或离开页面时会自动写入。`,
        `No active save (${modeTag}). Progress is saved when descending, pausing, or leaving the page.`);
  }
""", 'title save metadata')
r("    gbtn.textContent = greedyMode ? '贪婪远征：开' : '贪婪远征：关';", "    gbtn.textContent = greedyMode ? ui('贪婪远征：开','Greedy Expedition: On') : ui('贪婪远征：关','Greedy Expedition: Off');", 'Greedy toggle')

r("""        <span class="stats">生命 ${c.hpBase} · 攻击 ${c.atkBase} · 药水 ${c.potions} · 卷轴 ${c.scrolls}<br>技能：${esc(c.skill.name)}（冷却 ${c.skill.cd}）<br>${esc(c.skill.desc)}</span>""", """        <span class="stats">${ui(`生命 ${c.hpBase} · 攻击 ${c.atkBase} · 药水 ${c.potions} · 卷轴 ${c.scrolls}<br>技能：${esc(c.skill.name)}（冷却 ${c.skill.cd}）<br>${esc(c.skill.desc)}`, `HP ${c.hpBase} · ATK ${c.atkBase} · Potions ${c.potions} · Scrolls ${c.scrolls}<br>Skill: ${esc(c.skill.name)} (CD ${c.skill.cd})<br>${esc(c.skill.desc)}`)}</span>""", 'class card stats')

r("""function renderShop() {
  const goldEl = $('shop-gold');
  if (goldEl) goldEl.textContent = `金币 ${player.gold}`;
  const list = $('shop-list');
  if (!list) return;
  list.innerHTML = shopStock.map((row, i) => `
    <div class="shop-row">
      <span>${esc(row.name)}</span>
      <b>${row.price} G</b>
      <button type="button" data-buy="${i}">购买</button>
    </div>`).join('');
}""", """function visibleShopRowName(row) {
  if (!row) return '';
  if (row.item) return visibleItemName(row.item);
  if (row.id === 'escape') return ui('回城卷轴（按 T 回镇）','Return Scroll (T: return to town)');
  if (row.id === 'heal') return ui('包扎伤口（回满）','Bandage Wounds (full heal)');
  if (row.id === 'equip') return ui('精选装备','Featured Gear');
  return visibleWorldName(row.name);
}
function renderShop() {
  const goldEl = $('shop-gold');
  if (goldEl) goldEl.textContent = ui(`金币 ${player.gold}`, `Gold ${player.gold}`);
  const list = $('shop-list');
  if (!list) return;
  list.innerHTML = shopStock.map((row, i) => `
    <div class="shop-row">
      <span>${esc(visibleShopRowName(row))}</span>
      <b>${row.price} G</b>
      <button type="button" data-buy="${i}">${ui('购买','Buy')}</button>
    </div>`).join('');
}""", 'dungeon shop')

r("""  if (statsEl) statsEl.innerHTML = [
    ['最深到达', `${meta.bestDepth || 0} 层`],
    ['远征次数', `${meta.runs || 0}`],
    ['通关次数', `${meta.wins || 0}`],
    ['累计击杀', `${meta.totalKills || 0}`],
    ['死亡次数', `${meta.deaths || 0}`],
    ['金库金币', `${meta.gold || 0} G`],
    ['转盘总抽数', `${meta.wheelTotal || 0}`],
  ].map(([k, v]) => `<div class="shop-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');""", """  if (statsEl) statsEl.innerHTML = [
    [ui('最深到达','Deepest Floor'), ui(`${meta.bestDepth || 0} 层`, `Floor ${meta.bestDepth || 0}`)],
    [ui('远征次数','Expeditions'), `${meta.runs || 0}`],
    [ui('通关次数','Wins'), `${meta.wins || 0}`],
    [ui('累计击杀','Total Kills'), `${meta.totalKills || 0}`],
    [ui('死亡次数','Deaths'), `${meta.deaths || 0}`],
    [ui('金库金币','Vault Gold'), `${meta.gold || 0} G`],
    [ui('转盘总抽数','Wheel Spins'), `${meta.wheelTotal || 0}`],
  ].map(([k, v]) => `<div class="shop-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');""", 'achievement summary')

r("""function wheelSlotText(s) {
  switch (s.kind) {
    case 'gold': return `${s.amount} G`;
    case 'potion': return '治疗药水';
    case 'scroll': return '传送卷轴';
    case 'key': return '锈蚀钥匙';
    case 'escape': return '回城卷轴';
    case 'insurance': return '保险符';
    case 'equip': return `${s.item.name} ${s.item.score}分`;
    default: return '空门';
  }
}""", """function wheelSlotText(s) {
  switch (s.kind) {
    case 'gold': return `${s.amount} G`;
    case 'potion': return ui('治疗药水','Healing Potion');
    case 'scroll': return ui('传送卷轴','Teleport Scroll');
    case 'key': return ui('锈蚀钥匙','Rusty Key');
    case 'escape': return ui('回城卷轴','Return Scroll');
    case 'insurance': return ui('保险符','Insurance Charm');
    case 'equip': return ui(`${visibleItemName(s.item)} ${s.item.score}分`, `${visibleItemName(s.item)} · Score ${s.item.score}`);
    default: return ui('空门','Empty');
  }
}""", 'wheel long labels')

r("""function wheelSlotShort(s) {
  switch (s.kind) {
    case 'gold': return `${s.amount}G`;
    case 'potion': return '药水';
    case 'scroll': return '卷轴';
    case 'key': return '钥匙';
    case 'escape': return '回城';
    case 'insurance': return '保险符';
    case 'equip': return s.item.name.length > 5 ? s.item.name.slice(0, 4) + '…' : s.item.name;
    default: return '空门';
  }
}""", """function wheelSlotShort(s) {
  switch (s.kind) {
    case 'gold': return `${s.amount}G`;
    case 'potion': return ui('药水','Potion');
    case 'scroll': return ui('卷轴','Scroll');
    case 'key': return ui('钥匙','Key');
    case 'escape': return ui('回城','Return');
    case 'insurance': return ui('保险符','Insurance');
    case 'equip': {
      const name = visibleItemName(s.item);
      return name.length > 8 ? name.slice(0, 7) + '…' : name;
    }
    default: return ui('空门','Empty');
  }
}""", 'wheel short labels')

r("  ctx.fillText(`回响小镇 · 阶段 ${tier}`, 20, 23);", "  ctx.fillText(ui(`回响小镇 · 阶段 ${tier}`, `Echo Town · Tier ${tier}`), 20, 23);", 'town canvas stage')
r("""  const bld = [
    { n: '仓库', c: '#3a3230', roof: '#57453a', h: 74 },
    { n: '锻造', c: '#33261d', roof: '#6b3b28', h: 66, forge: true },
    { n: '市集', c: '#3d3226', roof: '#7a5a2c', h: 58, stall: true },
    { n: '客栈', c: '#38291f', roof: '#5f4732', h: 84, lantern: true },
    { n: '转盘', c: '#2f2333', roof: '#5a3a63', h: 62, tent: true },
  ];""", """  const bld = [
    { n: ui('仓库','Stash'), c: '#3a3230', roof: '#57453a', h: 74 },
    { n: ui('锻造','Forge'), c: '#33261d', roof: '#6b3b28', h: 66, forge: true },
    { n: ui('市集','Market'), c: '#3d3226', roof: '#7a5a2c', h: 58, stall: true },
    { n: ui('客栈','Inn'), c: '#38291f', roof: '#5f4732', h: 84, lantern: true },
    { n: ui('转盘','Wheel'), c: '#2f2333', roof: '#5a3a63', h: 62, tent: true },
  ];""", 'town canvas buildings')

r("""  const clsName = CLASSES[meta.classId] ? CLASSES[meta.classId].name : '冒险者';
  if (head) head.textContent =
    `${clsName} · 等级 ${meta.lvl} · 金库 ${meta.gold} G · 最深 ${meta.bestDepth || 0} 层 · 远征 ${meta.runs || 0} 次`;
  const growth = $('town-growth');
  if (growth) {
    const tier = townTierForArt();
    const next = tier >= 10 ? '小镇已完成最终扩建' : `再征服第 ${tier * 10} 层守卫，进入阶段 ${tier + 1}`;
    const ready = (meta.potions || 0) >= 2 && (meta.escapes || 0) >= 1;
    growth.innerHTML =
      `<div><b>城镇阶段 ${tier}/10</b><span>${next}</span></div>` +
      `<div class="town-readiness ${ready ? 'ready' : 'warn'}"><b>${ready ? '远征整备完成' : '补给仍有缺口'}</b>` +
      `<span>药水 ${meta.potions || 0} · 回城卷轴 ${meta.escapes || 0} · 钥匙 ${meta.keys || 0}</span></div>` +
      `<div><b>本阶段设施</b><span>安全仓库 · 限量市集 · 锻造强化 · 已征服区出发</span></div>`;
  }
  const itemTag = it => {
    const f = it.forge || 0;
    const forgeTag = f ? ` +${f}` : '';
    return `${esc(it.name)}${forgeTag}<small>${it.score} 分</small>`;
  };""", """  const clsName = CLASSES[meta.classId] ? CLASSES[meta.classId].name : ui('冒险者','Adventurer');
  if (head) head.textContent = ui(
    `${clsName} · 等级 ${meta.lvl} · 金库 ${meta.gold} G · 最深 ${meta.bestDepth || 0} 层 · 远征 ${meta.runs || 0} 次`,
    `${clsName} · Level ${meta.lvl} · Vault ${meta.gold} G · Deepest Floor ${meta.bestDepth || 0} · Expeditions ${meta.runs || 0}`);
  const growth = $('town-growth');
  if (growth) {
    const tier = townTierForArt();
    const next = tier >= 10
      ? ui('小镇已完成最终扩建','Town expansion complete')
      : ui(`再征服第 ${tier * 10} 层守卫，进入阶段 ${tier + 1}`, `Defeat the Floor ${tier * 10} guardian to reach Tier ${tier + 1}`);
    const ready = (meta.potions || 0) >= 2 && (meta.escapes || 0) >= 1;
    growth.innerHTML =
      `<div><b>${ui(`城镇阶段 ${tier}/10`, `Town Tier ${tier}/10`)}</b><span>${next}</span></div>` +
      `<div class="town-readiness ${ready ? 'ready' : 'warn'}"><b>${ready ? ui('远征整备完成','Expedition Ready') : ui('补给仍有缺口','Supplies Missing')}</b>` +
      `<span>${ui(`药水 ${meta.potions || 0} · 回城卷轴 ${meta.escapes || 0} · 钥匙 ${meta.keys || 0}`, `Potions ${meta.potions || 0} · Return Scrolls ${meta.escapes || 0} · Keys ${meta.keys || 0}`)}</span></div>` +
      `<div><b>${ui('本阶段设施','Current Facilities')}</b><span>${ui('安全仓库 · 限量市集 · 锻造强化 · 已征服区出发','Safe Stash · Limited Market · Forge Upgrades · Conquered-Depth Departures')}</span></div>`;
  }
  const itemTag = it => {
    const f = it.forge || 0;
    const forgeTag = f ? ` +${f}` : '';
    return `${esc(visibleItemName(it))}${forgeTag}<small>${ui(`${it.score} 分`, `Score ${it.score}`)}</small>`;
  };""", 'town header/growth/item')

r("""    return `<span class="row-actions">` +
      `<button type="button" data-forge="${where}:${i}"${(maxed || meta.gold < fc) ? ' disabled' : ''}` +
      ` title="${maxed ? '已至 +5 极致' : `强化到 +${(it.forge || 0) + 1}，需 ${fc} G`}">强化</button>` +
      `<button type="button" data-sell="${where}:${i}" title="出售得 ${sellPrice(it)} G">卖 ${sellPrice(it)}G</button>` +
      `</span>`;""", """    return `<span class="row-actions">` +
      `<button type="button" data-forge="${where}:${i}"${(maxed || meta.gold < fc) ? ' disabled' : ''}` +
      ` title="${maxed ? ui('已至 +5 极致','Maxed at +5') : ui(`强化到 +${(it.forge || 0) + 1}，需 ${fc} G`, `Forge to +${(it.forge || 0) + 1} for ${fc} G`)}">${ui('强化','Forge')}</button>` +
      `<button type="button" data-sell="${where}:${i}" title="${ui(`出售得 ${sellPrice(it)} G`, `Sell for ${sellPrice(it)} G`)}">${ui(`卖 ${sellPrice(it)}G`, `Sell ${sellPrice(it)}G`)}</button>` +
      `</span>`;""", 'town trade actions')

r("""        `<div class="town-row"><span>${itemTag(it)}</span>` +
        `<span class="row-actions"><button type="button" data-deposit="${i}">存入</button>${tradeBtns('bag', i, it)}</span></div>`).join('')
      : '<p class="dim-note">背包空空如也。下潜搜刮，或从仓库取出。</p>') +
    (meta.bag.length
      ? `<div class="town-row"><span></span><span class="row-actions"><button type="button" data-depositall="1">全部存入仓库</button></span></div>`
      : '');""", """        `<div class="town-row"><span>${itemTag(it)}</span>` +
        `<span class="row-actions"><button type="button" data-deposit="${i}">${ui('存入','Store')}</button>${tradeBtns('bag', i, it)}</span></div>`).join('')
      : `<p class="dim-note">${ui('背包空空如也。下潜搜刮，或从仓库取出。','Backpack empty. Explore the dungeon or withdraw gear from the stash.')}</p>`) +
    (meta.bag.length
      ? `<div class="town-row"><span></span><span class="row-actions"><button type="button" data-depositall="1">${ui('全部存入仓库','Store All')}</button></span></div>`
      : '');""", 'town bag')

r("""      `<div class="town-row"><span>${itemTag(it)}</span>` +
      `<span class="row-actions"><button type="button" data-withdraw="${i}"${meta.bag.length >= BAG_CAP ? ' disabled' : ''}>取出</button>${tradeBtns('stash', i, it)}</span></div>`).join('')
    : '<p class="dim-note">仓库是空的。把装备「存入」这里，死亡也夺不走。</p>';
  const shopEl = $('town-shop');
  if (shopEl) shopEl.innerHTML = [
    { id: 'potion', name: `治疗药水 ×1（带 ${meta.potions}）`, price: SHOP.potionPrice },
    { id: 'escape', name: `回城卷轴 ×1（带 ${meta.escapes}）`, price: SHOP.escapePrice || 26 },
    { id: 'key', name: `锈蚀钥匙 ×1（带 ${meta.keys}）`, price: SHOP.keyPrice },
    { id: 'insurance', name: `保险符 ×1 死亡保背包（带 ${meta.insurance || 0}）`, price: SHOP.insurancePrice || 120 },
  ].map(r =>
    `<div class="shop-row"><span>${esc(r.name)}</span><b>${r.price} G</b>` +
    `<button type="button" data-townbuy="${r.id}"${meta.gold < r.price ? ' disabled' : ''}>购买</button></div>`).join('');""", """      `<div class="town-row"><span>${itemTag(it)}</span>` +
      `<span class="row-actions"><button type="button" data-withdraw="${i}"${meta.bag.length >= BAG_CAP ? ' disabled' : ''}>${ui('取出','Withdraw')}</button>${tradeBtns('stash', i, it)}</span></div>`).join('')
    : `<p class="dim-note">${ui('仓库是空的。把装备「存入」这里，死亡也夺不走。','The stash is empty. Store gear here to keep it safe from death.')}</p>`;
  const shopEl = $('town-shop');
  if (shopEl) shopEl.innerHTML = [
    { id: 'potion', name: ui(`治疗药水 ×1（带 ${meta.potions}）`, `Healing Potion ×1 (carrying ${meta.potions})`), price: SHOP.potionPrice },
    { id: 'escape', name: ui(`回城卷轴 ×1（带 ${meta.escapes}）`, `Return Scroll ×1 (carrying ${meta.escapes})`), price: SHOP.escapePrice || 26 },
    { id: 'key', name: ui(`锈蚀钥匙 ×1（带 ${meta.keys}）`, `Rusty Key ×1 (carrying ${meta.keys})`), price: SHOP.keyPrice },
    { id: 'insurance', name: ui(`保险符 ×1 死亡保背包（带 ${meta.insurance || 0}）`, `Insurance Charm ×1 · protects backpack on death (carrying ${meta.insurance || 0})`), price: SHOP.insurancePrice || 120 },
  ].map(r =>
    `<div class="shop-row"><span>${esc(r.name)}</span><b>${r.price} G</b>` +
    `<button type="button" data-townbuy="${r.id}"${meta.gold < r.price ? ' disabled' : ''}>${ui('购买','Buy')}</button></div>`).join('');""", 'town stash/shop')

r("""    wheelEl.innerHTML =
      '<canvas id="wheel-canvas" width="240" height="240"></canvas>' +
      '<p class="dim-note wheel-hint">转盘停在哪格，就开哪格——空门也是命运。</p>' +
      `<div class="row-actions"><button type="button" data-wheelspin="1"${(meta.gold < sc || wheelBusy) ? ' disabled' : ''}` +
      ` title="转动轮盘，下一抽 ${sc} G">抽奖 ${sc} G</button>` +
      `<button type="button" data-wheelreset="1"${(meta.gold < rc || wheelBusy) ? ' disabled' : ''}` +
      ` title="重摇全部八格，需 ${rc} G">重置轮盘 ${rc} G</button></div>`;""", """    wheelEl.innerHTML =
      '<canvas id="wheel-canvas" width="240" height="240"></canvas>' +
      `<p class="dim-note wheel-hint">${ui('转盘停在哪格，就开哪格——空门也是命运。','The wheel opens the slot it lands on — Empty is part of the odds.')}</p>` +
      `<div class="row-actions"><button type="button" data-wheelspin="1"${(meta.gold < sc || wheelBusy) ? ' disabled' : ''}` +
      ` title="${ui(`转动轮盘，下一抽 ${sc} G`, `Spin the wheel for ${sc} G`)}">${ui(`抽奖 ${sc} G`, `Spin ${sc} G`)}</button>` +
      `<button type="button" data-wheelreset="1"${(meta.gold < rc || wheelBusy) ? ' disabled' : ''}` +
      ` title="${ui(`重摇全部八格，需 ${rc} G`, `Reroll all eight slots for ${rc} G`)}">${ui(`重置轮盘 ${rc} G`, `Reset Wheel ${rc} G`)}</button></div>`;""", 'town wheel')

r("""  button.innerHTML = active
    ? '<span aria-hidden="true">⛶</span> 退出全屏 <kbd>F</kbd>'
    : '<span aria-hidden="true">⛶</span> 全屏 <kbd>F</kbd>';""", """  button.innerHTML = active
    ? ui('<span aria-hidden="true">⛶</span> 退出全屏 <kbd>F</kbd>', '<span aria-hidden="true">⛶</span> Exit Fullscreen <kbd>F</kbd>')
    : ui('<span aria-hidden="true">⛶</span> 全屏 <kbd>F</kbd>', '<span aria-hidden="true">⛶</span> Fullscreen <kbd>F</kbd>');""", 'fullscreen button')
r("  if (copy) copy.textContent = `第 ${depth} 层 · ${classDef().name} · 进度已写入本地。`;", "  if (copy) copy.textContent = ui(`第 ${depth} 层 · ${classDef().name} · 进度已写入本地。`, `Floor ${depth} · ${classDef().name} · Progress saved locally.`);", 'pause copy')
r("if (seedLabel) seedLabel.textContent = RUN_SEED + '（' + PROFILE_ID + '）';", "if (seedLabel) seedLabel.textContent = RUN_SEED + ui('（' + PROFILE_ID + '）', ' (' + PROFILE_ID + ')');", 'seed label')

p.write_text(s,encoding='utf-8')
print('english_visible_copy_patch=PASS')
