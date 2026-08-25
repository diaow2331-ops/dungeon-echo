const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);

function replaceText(source, oldText, newText, label) {
  const first = source.indexOf(oldText);
  if (first < 0 || source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`${label}: expected exactly one text match`);
  }
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

let game = read('game.js');

game = replaceText(
  game,
  `const forgeCost = it => 30 + Math.round((eqScoreOf(it.stats || {}) || 0) * 1.2) * ((it.forge || 0) + 1);\nconst sellPrice = it => Math.max(4, Math.round((it.score || 0) * .45) + (it.forge || 0) * 15);`,
  `// 经济价值与战斗适配评分分离：score/fitScore 继续回答“这件装备适不适合当前职业”，\n// itemValueScore 回答“这件物品本身值多少”。机制词缀进入后者，但不会吞掉属性维度。\nfunction mechanicValueBonus(it, statScore = eqScoreOf((it && it.stats) || {})) {\n  if (!it || !it.mechanic || !MECHANIC_TRAITS[it.mechanic]) return 0;\n  const power = Math.max(1, Math.min(2, Number(it.mechanicPower) || 1));\n  const ratio = power >= 2 ? 0.30 : 0.18;\n  const floor = power >= 2 ? 22 : 12;\n  return Math.max(floor, Math.round(Math.max(0, statScore) * ratio));\n}\nfunction itemValueScore(it) {\n  if (!it || typeof it !== 'object') return 0;\n  const statScore = Math.max(0, eqScoreOf(it.stats || {}));\n  return statScore + mechanicValueBonus(it, statScore);\n}\nconst forgeCost = it => 30 + Math.round(itemValueScore(it) * 1.2) * ((it.forge || 0) + 1);\nconst sellPrice = it => Math.max(4, Math.round(itemValueScore(it) * .45) + (it.forge || 0) * 15);`,
  'add intrinsic item value model'
);

game = replaceText(
  game,
  `  eq.name = eq.item.name;\n  eq.price = Math.max(18, eq.item.score * (SHOP.equipMult || 3));`,
  `  eq.name = eq.item.name;\n  eq.price = Math.max(18, itemValueScore(eq.item) * (SHOP.equipMult || 3));`,
  'price shop equipment by intrinsic value'
);

game = replaceText(
  game,
  `  const mechanicText = mechanicDescription(it);\n  if (mechanicText) html += \`<div class="affix">\${esc(mechanicText)}</div>\`;\n  html += \`<div style="color:\${r.color}">评分 \${it.score}</div>\`;\n  if (compareSlot) {\n    const cur = player.equip[compareSlot];\n    if (cur) {\n      const d = it.score - cur.score;\n      html += d > 0\n        ? \`<div class="cmp-up">▲ 比当前装备高 \${d} 分</div>\`\n        : d < 0\n          ? \`<div class="cmp-down">▼ 比当前装备低 \${-d} 分</div>\`\n          : '<div>＝ 与当前装备同评分</div>';\n    }\n  }`,
  `  const mechanicText = mechanicDescription(it);\n  if (mechanicText) html += \`<div class="affix">\${esc(mechanicText)}</div>\`;\n  const fit = Number(it.score) || 0;\n  const value = itemValueScore(it);\n  html += \`<div style="color:\${r.color}">适配评分 \${fit} · 内在价值 \${value}</div>\`;\n  if (compareSlot) {\n    const cur = player.equip[compareSlot];\n    if (cur) {\n      const fitDelta = fit - (Number(cur.score) || 0);\n      const valueDelta = value - itemValueScore(cur);\n      html += fitDelta > 0\n        ? \`<div class="cmp-up">▲ 适配 +\${fitDelta}</div>\`\n        : fitDelta < 0\n          ? \`<div class="cmp-down">▼ 适配 \${fitDelta}</div>\`\n          : '<div>＝ 适配评分持平</div>';\n      html += valueDelta > 0\n        ? \`<div class="cmp-up">◆ 价值 +\${valueDelta}</div>\`\n        : valueDelta < 0\n          ? \`<div class="cmp-down">◇ 价值 \${valueDelta}</div>\`\n          : '<div>◇ 内在价值持平</div>';\n    }\n  }`,
  'show fit and intrinsic value separately'
);

game = replaceText(
  game,
  `    pThorns, pKillHeal, pMaxHp, pDef, pCrit, eqScoreOf, pierceChanceOf,\n    MECHANIC_TRAITS, mechanicPower, mechanicDescription, applyDirectHitMechanic,`,
  `    pThorns, pKillHeal, pMaxHp, pDef, pCrit, eqScoreOf, itemValueScore, mechanicValueBonus, forgeCost, sellPrice, pierceChanceOf,\n    MECHANIC_TRAITS, mechanicPower, mechanicDescription, applyDirectHitMechanic,`,
  'expose value test hooks'
);
write('game.js', game);

let equip = read('equipment-system.js');
equip = replaceText(
  equip,
  `        const mult = (profile.shop && profile.shop.equipMult) || 3;\n        row.price = Math.max(18, row.item.score * mult);`,
  `        const mult = (profile.shop && profile.shop.equipMult) || 3;\n        const value = typeof api.itemValueScore === 'function' ? api.itemValueScore(row.item) : row.item.score;\n        row.price = Math.max(18, value * mult);`,
  'production shop uses intrinsic value'
);
write('equipment-system.js', equip);

let forge = read('forge-system.js');
forge = replaceText(
  forge,
  `        const forgeTag = item.forge ? \` +\${item.forge}\` : '';\n        label.innerHTML = \`\${esc(item.name)}\${forgeTag}<small>\${Number(item.score) || 0} 分</small>\`;`,
  `        const forgeTag = item.forge ? \` +\${item.forge}\` : '';\n        const value = typeof api.itemValueScore === 'function' ? api.itemValueScore(item) : (Number(item.score) || 0);\n        label.innerHTML = \`\${esc(item.name)}\${forgeTag}<small>适配 \${Number(item.score) || 0} · 价值 \${value}</small>\`;`,
  'town rows show fit and value'
);
write('forge-system.js', forge);

let smoke = read('test/smoke.cjs');
smoke = replaceText(
  smoke,
  `}\n\nconsole.log('\\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');\nprocess.exit(fail ? 1 : 0);`,
  `}\n\n// ---------- 22. 装备内在价值：机制与经济统一口径 ----------\nsection('22 装备价值：适配评分 / 内在价值 / 经济');\n{\n  const plain = { slot: 'weapon', name: '无机制测试刃', rarity: 2, stats: { atk: 10 }, score: 30, affixes: [] };\n  const epic = { ...plain, name: '史诗测试刃', rarity: 3, mechanic: 'echo_edge', mechanicPower: 1 };\n  const legend = { ...plain, name: '传说测试刃', rarity: 4, mechanic: 'echo_edge', mechanicPower: 2 };\n  const raw = T.eqScoreOf(plain.stats);\n  ok(T.itemValueScore(plain) === raw, '无机制装备的内在价值等于属性价值');\n  ok(T.itemValueScore(epic) > T.itemValueScore(plain), 'Epic 机制进入内在价值但不改写属性评分');\n  ok(T.itemValueScore(legend) > T.itemValueScore(epic), 'Legendary 强化机制拥有更高内在价值');\n  ok(epic.score === plain.score && legend.score === plain.score, '机制价值与适配/属性评分保持双轴，不伪装成纯数值战力');\n  ok(T.sellPrice(epic) > T.sellPrice(plain) && T.sellPrice(legend) > T.sellPrice(epic), '出售价格统一识别机制价值');\n  ok(T.forgeCost(epic) > T.forgeCost(plain) && T.forgeCost(legend) > T.forgeCost(epic), '锻造成本统一识别机制价值');\n  const legacy = { slot: 'armor', name: '旧档甲', rarity: 2, stats: { def: 4, hp: 10 }, score: T.eqScoreOf({ def: 4, hp: 10 }), affixes: [] };\n  ok(T.itemValueScore(legacy) === T.eqScoreOf(legacy.stats), '旧档无机制装备价值稳定，无需迁移字段');\n}\n\nconsole.log('\\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');\nprocess.exit(fail ? 1 : 0);`,
  'append intrinsic value regression'
);
write('test/smoke.cjs', smoke);

console.log('golden20_item_value=APPLIED');
