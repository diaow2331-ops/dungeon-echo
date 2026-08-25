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

function replaceRegex(source, regex, replacement, label) {
  const matches = source.match(regex);
  if (!matches || matches.length !== 1) throw new Error(`${label}: expected exactly one match`);
  return source.replace(regex, replacement);
}

let game = read('game.js');

game = replaceRegex(
  game,
  /const AFFIX_LABEL = \{[\s\S]*?\n\};\n\n\/\/ ================= 音效（WebAudio 合成） =================/,
  `const AFFIX_LABEL = {\n  atk:   v => \`攻击 +\${v}\`,\n  def:   v => \`防御 +\${v}\`,\n  hp:    v => \`生命 +\${v}\`,\n  crit:  v => \`暴击 +\${v}%\`,\n  leech: v => \`吸血 +\${v}%\`,\n  gold:  v => \`金币获取 +\${v}%\`,\n  thorns: v => \`反伤 +\${v}\`,\n  regen:  v => \`击杀回复 +\${v}\`,\n};\n\n// Epic / Legendary 机制词缀：不增加新按键，只改变现有动作的决策价值。\n// 每个槽位拥有独立池，同一角色无法同时装备两个相同槽位，因此天然避免同机制叠层。\nconst MECHANIC_TRAITS = {\n  echo_edge: { name: '锋鸣', slots: ['weapon'], text: ['施放职业技能后，下一回合的下一次普攻伤害 +25%。', '施放职业技能后，下一回合的下一次普攻伤害 +40%。'] },\n  reaper: { name: '收割', slots: ['weapon'], text: ['普攻击杀敌人时额外返还 1 回合技能冷却。', '普攻击杀敌人时额外返还 2 回合技能冷却。'] },\n  brace: { name: '镇守', slots: ['armor'], text: ['等待后，本轮下一次敌人直击伤害降低 35%。', '等待后，本轮下一次敌人直击伤害降低 50%。'] },\n  reprisal: { name: '反击甲', slots: ['armor'], text: ['被敌人直击后，下一回合近战普攻伤害 +30%。', '被敌人直击后，下一回合近战普攻伤害 +50%。'] },\n  clarity: { name: '清创', slots: ['helmet'], text: ['喝药后额外缩短 1 回合重伤。', '喝药后直接清除重伤。'] },\n  skirmish: { name: '游猎', slots: ['boots'], text: ['正常移动后，下一回合远程普攻伤害 +25%。', '正常移动后，下一回合远程普攻伤害 +40%。'] },\n  afterimage: { name: '残影', slots: ['boots'], text: ['施放职业技能后，本轮下一次敌人直击伤害降低 25%。', '施放职业技能后，本轮下一次敌人直击伤害降低 40%。'] },\n  duelist: { name: '决斗', slots: ['ring'], text: ['只与 1 名相邻敌人缠斗时，近战普攻伤害 +20%。', '只与 1 名相邻敌人缠斗时，近战普攻伤害 +35%。'] },\n  crisis: { name: '危机脉搏', slots: ['ring'], text: ['生命不高于 40% 时暴击率 +12%。', '生命不高于 40% 时暴击率 +20%。'] },\n  overclock: { name: '回路超频', slots: ['amulet'], text: ['职业技能造成击杀时额外返还 1 回合冷却。', '职业技能造成击杀时额外返还 2 回合冷却。'] },\n  meditate: { name: '凝息', slots: ['amulet'], text: ['等待时额外恢复 1 回合技能冷却。', '等待时额外恢复 2 回合技能冷却。'] },\n};\nconst MECHANIC_POOLS = {\n  weapon: ['echo_edge', 'reaper'],\n  armor: ['brace', 'reprisal'],\n  helmet: ['clarity'],\n  boots: ['skirmish', 'afterimage'],\n  ring: ['duelist', 'crisis'],\n  amulet: ['overclock', 'meditate'],\n};\nfunction mechanicForFreshItem(slot, rarity, d, base, affixes) {\n  if (rarity < 3) return null;\n  const pool = MECHANIC_POOLS[slot] || [];\n  if (!pool.length) return null;\n  // 使用已有生成结果派生，不额外消耗战斗 RNG，避免高稀有掉落改变后续房间随机序列。\n  const sig = [RUN_SEED, slot, rarity, d, base && base.name,\n    (affixes || []).map(a => \`\${a.k}:\${a.v}\`).join(',')].join('|');\n  const id = pool[hashSeed(sig) % pool.length];\n  return { id, power: rarity >= 4 ? 2 : 1 };\n}\nfunction mechanicDescription(it) {\n  const def = it && MECHANIC_TRAITS[it.mechanic];\n  if (!def) return '';\n  const p = Math.max(1, Math.min(2, Number(it.mechanicPower) || 1));\n  return \`◆ \${def.name}：\${def.text[p - 1]}\`;\n}\n\n// ================= 音效（WebAudio 合成） =================`,
  'insert mechanic trait catalog'
);

game = replaceText(
  game,
  `  const spr = slot === 'weapon'\n    ? (WEAPON_SPR_BY_ICON[base.icon] || 'sword')\n    : slot === 'armor' ? 'armor' : slot === 'ring' ? 'ring' : 'trinket';\n  return {\n    slot, base, rarity, affixes, stats, spr, icon: base.icon,\n    name: \`\${RARITIES[rarity].name}·\${base.name}\`,\n    score: eqScoreOf(stats),\n  };\n}`,
  `  const spr = slot === 'weapon'\n    ? (WEAPON_SPR_BY_ICON[base.icon] || 'sword')\n    : slot === 'armor' ? 'armor' : slot === 'ring' ? 'ring' : 'trinket';\n  const mechanic = mechanicForFreshItem(slot, rarity, d, base, affixes);\n  const mechanicName = mechanic ? \` · \${MECHANIC_TRAITS[mechanic.id].name}\` : '';\n  return {\n    slot, base, rarity, affixes, stats, spr, icon: base.icon,\n    ...(mechanic ? { mechanic: mechanic.id, mechanicPower: mechanic.power } : {}),\n    name: \`\${RARITIES[rarity].name}·\${base.name}\${mechanicName}\`,\n    score: eqScoreOf(stats),\n  };\n}`,
  'attach mechanics to epic and legendary loot'
);

game = replaceText(
  game,
  `const eqStat = k => ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']\n  .reduce((s, sl) => s + (player.equip[sl] ? (player.equip[sl].stats[k] || 0) : 0), 0);`,
  `function mechanicPower(id) {\n  if (!player || !player.equip) return 0;\n  let best = 0;\n  for (const it of Object.values(player.equip)) {\n    if (!it || it.mechanic !== id) continue;\n    best = Math.max(best, Math.max(1, Math.min(2, Number(it.mechanicPower) || 1)));\n  }\n  return best;\n}\nfunction consumeTimedMechanic(field, id) {\n  if (!player || player[field] !== turns) return 0;\n  const p = mechanicPower(id);\n  player[field] = -1;\n  return p;\n}\nfunction clearMechanicWindows() {\n  if (!player) return;\n  player.echoEdgeTurn = -1;\n  player.reprisalTurn = -1;\n  player.skirmishTurn = -1;\n  player.braceTurn = -1;\n  player.afterimageTurn = -1;\n}\nfunction applyDirectHitMechanic(dmg) {\n  let out = Math.max(1, Math.round(dmg));\n  const after = player && player.afterimageTurn === turns ? mechanicPower('afterimage') : 0;\n  const brace = player && player.braceTurn === turns ? mechanicPower('brace') : 0;\n  if (after) {\n    player.afterimageTurn = -1;\n    out = Math.max(1, Math.round(out * (after >= 2 ? 0.60 : 0.75)));\n    floater(player, '残影卸力', '#9fd7ff');\n    msg(\`【残影】削减了这次直击伤害。\`, 'good');\n  } else if (brace) {\n    player.braceTurn = -1;\n    out = Math.max(1, Math.round(out * (brace >= 2 ? 0.50 : 0.65)));\n    floater(player, '镇守', '#f2d27b');\n    msg(\`【镇守】挡下了部分直击伤害。\`, 'good');\n  }\n  return out;\n}\nfunction armReprisal() {\n  if (player && player.hp > 0 && mechanicPower('reprisal')) player.reprisalTurn = turns;\n}\n\nconst eqStat = k => ['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet']\n  .reduce((s, sl) => s + (player.equip[sl] ? (player.equip[sl].stats[k] || 0) : 0), 0);`,
  'insert equipped mechanic helpers'
);

game = replaceText(
  game,
  `const pCrit  = () => 5 + (classDef().critBase || 0) + (player.critBase || 0) + eqStat('crit');`,
  `const pCrit  = () => {\n  const crisis = mechanicPower('crisis');\n  const crisisBonus = crisis && player.hp <= pMaxHp() * 0.40 ? (crisis >= 2 ? 20 : 12) : 0;\n  return 5 + (classDef().critBase || 0) + (player.critBase || 0) + eqStat('crit') + crisisBonus;\n};`,
  'add crisis crit window'
);

game = replaceRegex(
  game,
  /function playerAttack\(m\) \{[\s\S]*?\n\}\n\/\/ 沿玩家面向方向/,
  `function playerAttack(m) {\n  lunge(player, m.x, m.y);\n  let dmg = Math.max(1, pAtk() + ri(-1, 1) - m.def);\n  let mult = 1;\n  const echo = consumeTimedMechanic('echoEdgeTurn', 'echo_edge');\n  if (echo) mult *= echo >= 2 ? 1.40 : 1.25;\n  const reprisal = consumeTimedMechanic('reprisalTurn', 'reprisal');\n  if (reprisal) mult *= reprisal >= 2 ? 1.50 : 1.30;\n  const duel = mechanicPower('duelist');\n  if (duel) {\n    const adjacent = monsters.filter(x => Math.abs(x.x - player.x) + Math.abs(x.y - player.y) === 1).length;\n    if (adjacent === 1) mult *= duel >= 2 ? 1.35 : 1.20;\n  }\n  dmg = Math.max(1, Math.round(dmg * mult));\n  const crit = rng() * 100 < pCrit();\n  if (crit) dmg = Math.round(dmg * pCritMul());\n  const wasAlive = m.hp > 0;\n  applyDamageToMonster(m, dmg, crit);\n  if (wasAlive && m.hp <= 0) {\n    const reaper = mechanicPower('reaper');\n    if (reaper && player.skillCd > 0) {\n      const refund = reaper >= 2 ? 2 : 1;\n      player.skillCd = Math.max(0, player.skillCd - refund);\n      msg(\`【收割】斩杀返还 \${refund} 回合技能冷却。\`, 'good');\n    }\n  }\n  if (m.hp > 0) msg(\`\${crit ? '暴击！' : ''}你击中\${m.name}，造成 \${dmg} 点伤害。\`);\n}\n// 沿玩家面向方向`,
  'replace melee basic attack mechanics'
);

game = replaceRegex(
  game,
  /function playerRangedAttack\(m\) \{[\s\S]*?\n\}\nfunction monsterAttack/,
  `function playerRangedAttack(m) {\n  fireArrow(player.x, player.y, m.x, m.y);\n  let dmg = Math.max(1, pAtk() + ri(-1, 1) - m.def);\n  let mult = 1;\n  const echo = consumeTimedMechanic('echoEdgeTurn', 'echo_edge');\n  if (echo) mult *= echo >= 2 ? 1.40 : 1.25;\n  const skirmish = consumeTimedMechanic('skirmishTurn', 'skirmish');\n  if (skirmish) mult *= skirmish >= 2 ? 1.40 : 1.25;\n  dmg = Math.max(1, Math.round(dmg * mult));\n  const crit = rng() * 100 < pCrit();\n  if (crit) dmg = Math.round(dmg * pCritMul());\n  const wasAlive = m.hp > 0;\n  applyDamageToMonster(m, dmg, crit);\n  if (wasAlive && m.hp <= 0) {\n    const reaper = mechanicPower('reaper');\n    if (reaper && player.skillCd > 0) {\n      const refund = reaper >= 2 ? 2 : 1;\n      player.skillCd = Math.max(0, player.skillCd - refund);\n      msg(\`【收割】远射斩杀返还 \${refund} 回合技能冷却。\`, 'good');\n    }\n  }\n  if (m.hp > 0) msg(\`\${crit ? '暴击！' : ''}你射中\${m.name}，造成 \${dmg} 点伤害。\`);\n}\nfunction monsterAttack`,
  'replace ranged basic attack mechanics'
);

game = replaceText(
  game,
  `  const dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - pDef());`,
  `  let dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - pDef());\n  dmg = applyDirectHitMechanic(dmg);`,
  'apply defensive mechanic to melee hits'
);

game = replaceText(
  game,
  `  const dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - effDef);`,
  `  let dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - effDef);\n  dmg = applyDirectHitMechanic(dmg);`,
  'apply defensive mechanic to ranged hits'
);

const hitNeedle = `  player.hp -= dmg;\n  floater(player, \`-\${dmg}\`, '#ff6b6b');`;
const hitReplacement = `  player.hp -= dmg;\n  armReprisal();\n  floater(player, \`-\${dmg}\`, '#ff6b6b');`;
const hitCount = game.split(hitNeedle).length - 1;
if (hitCount !== 2) throw new Error(`arm reprisal on hits: expected 2 matches, got ${hitCount}`);
game = game.split(hitNeedle).join(hitReplacement);

game = replaceText(
  game,
  `  player.hp += heal;\n  player.poison = 0;\n  floater(player, \`+\${heal}\`, '#7dd87d');`,
  `  player.hp += heal;\n  player.poison = 0;\n  const clarity = mechanicPower('clarity');\n  if (clarity && player.grievous > 0) {\n    const before = player.grievous;\n    player.grievous = clarity >= 2 ? 0 : Math.max(0, player.grievous - 1);\n    msg(clarity >= 2 ? '【清创】药力洗净了重伤。' : \`【清创】重伤缩短 \${before - player.grievous} 回合。\`, 'good');\n  }\n  floater(player, \`+\${heal}\`, '#7dd87d');`,
  'add potion clarity mechanic'
);

game = replaceText(
  game,
  `  const sk = classDef().skill;\n  let used = false;`,
  `  const sk = classDef().skill;\n  const mobsBeforeSkill = monsters.length;\n  let used = false;`,
  'capture skill kill count'
);

game = replaceText(
  game,
  `  if (!used) return;\n  player.skillCd = Math.max(2, sk.cd - (player.skillHaste || 0));\n  if (state !== 'playing') { updateHud(); return; }\n  endTurn();`,
  `  if (!used) return;\n  const echo = mechanicPower('echo_edge');\n  if (echo) player.echoEdgeTurn = turns + 1;\n  const afterimage = mechanicPower('afterimage');\n  if (afterimage) player.afterimageTurn = turns + 1;\n  player.skillCd = Math.max(2, sk.cd - (player.skillHaste || 0));\n  const overclock = mechanicPower('overclock');\n  if (overclock && monsters.length < mobsBeforeSkill) {\n    const refund = overclock >= 2 ? 2 : 1;\n    player.skillCd = Math.max(0, player.skillCd - refund);\n    msg(\`【回路超频】技能击杀返还 \${refund} 回合冷却。\`, 'good');\n  }\n  if (state !== 'playing') { updateHud(); return; }\n  endTurn();`,
  'arm post-skill mechanics and overclock'
);

game = replaceText(
  game,
  `    } else if (walkable(nx, ny)) {\n      player.x = nx; player.y = ny;\n      triggerTrap(nx, ny);`,
  `    } else if (walkable(nx, ny)) {\n      player.x = nx; player.y = ny;\n      if (mechanicPower('skirmish')) player.skirmishTurn = turns + 1;\n      triggerTrap(nx, ny);`,
  'arm skirmish on normal movement'
);

game = replaceText(
  game,
  `function waitTurn() {\n  if (state !== 'playing') return;\n  msg('你原地观察四周。');\n  endTurn();\n}`,
  `function waitTurn() {\n  if (state !== 'playing') return;\n  const brace = mechanicPower('brace');\n  if (brace) {\n    player.braceTurn = turns + 1;\n    msg('【镇守】你稳住架势，准备承受下一次直击。', 'good');\n  }\n  const meditate = mechanicPower('meditate');\n  if (meditate && player.skillCd > 0) {\n    const refund = meditate >= 2 ? 2 : 1;\n    player.skillCd = Math.max(0, player.skillCd - refund);\n    msg(\`【凝息】额外恢复 \${refund} 回合技能冷却。\`, 'good');\n  }\n  msg('你原地观察四周。');\n  endTurn();\n}`,
  'make wait action build-relevant'
);

game = replaceText(
  game,
  `  player.equip[it.slot] = it;\n  player.inv.splice(i, 1);`,
  `  player.equip[it.slot] = it;\n  clearMechanicWindows();\n  player.inv.splice(i, 1);`,
  'clear combat windows on equip swap'
);

game = replaceText(
  game,
  `  player.equip[slot] = null;\n  player.inv.push(it);`,
  `  player.equip[slot] = null;\n  clearMechanicWindows();\n  player.inv.push(it);`,
  'clear combat windows on unequip'
);

game = replaceText(
  game,
  `  for (const a of it.affixes) html += \`<div class="affix">\${esc(AFFIX_LABEL[a.k](a.v))}</div>\`;\n  html += \`<div style="color:\${r.color}">评分 \${it.score}</div>\`;`,
  `  for (const a of (it.affixes || [])) {\n    const label = AFFIX_LABEL[a.k];\n    if (label) html += \`<div class="affix">\${esc(label(a.v))}</div>\`;\n  }\n  const mechanicText = mechanicDescription(it);\n  if (mechanicText) html += \`<div class="affix">\${esc(mechanicText)}</div>\`;\n  html += \`<div style="color:\${r.color}">评分 \${it.score}</div>\`;`,
  'show mechanic behavior in tooltip'
);

game = replaceText(
  game,
  `    pThorns, pKillHeal, pMaxHp, pDef, eqScoreOf, pierceChanceOf,`,
  `    pThorns, pKillHeal, pMaxHp, pDef, pCrit, eqScoreOf, pierceChanceOf,\n    MECHANIC_TRAITS, mechanicPower, mechanicDescription, applyDirectHitMechanic,`,
  'expose mechanic test hooks'
);

write('game.js', game);

let smoke = read('test/smoke.cjs');
smoke = replaceText(
  smoke,
  `  ok(dirty.totalKills === 0 && dirty.wins === 0 && dirty.wheelTotal === 0, '计数器脏值归零修复');\n}\nT.setGreedy(false);\n\nconsole.log('\\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');`,
  `  ok(dirty.totalKills === 0 && dirty.wins === 0 && dirty.wheelTotal === 0, '计数器脏值归零修复');\n}\nT.setGreedy(false);\n\n// ---------- 21. Epic / Legendary 机制装备 ----------\nsection('21 构筑装备：机制词缀 / 确定性 / 旧档兼容');\nT.newGame('warrior');\nT.setSeed('mechanic-generation');\n{\n  const rows = Array.from({ length: 700 }, () => T.genEquip(80));\n  const high = rows.filter(it => it.rarity >= 3);\n  ok(high.length > 0, \`深层样本出现 Epic/Legendary（\${high.length}/700）\`);\n  ok(high.every(it => !!it.mechanic && !!T.MECHANIC_TRAITS[it.mechanic]), 'Epic/Legendary 全部带合法机制词缀');\n  ok(high.every(it => T.MECHANIC_TRAITS[it.mechanic].slots.includes(it.slot)), '机制词缀严格遵守槽位身份');\n  ok(high.every(it => it.mechanicPower === (it.rarity >= 4 ? 2 : 1)), 'Epic=一级机制、Legendary=强化机制');\n  ok(rows.filter(it => it.rarity < 3).every(it => !it.mechanic), '普通/优秀/稀有装备不混入机制词缀');\n  ok(new Set(high.map(it => it.mechanic)).size >= 8, \`样本覆盖至少 8 种机制（实际 \${new Set(high.map(it => it.mechanic)).size}）\`);\n}\nT.setSeed('mechanic-sequence');\nconst mechSeq1 = Array.from({ length: 120 }, () => { const it = T.genEquip(70); return [it.slot, it.rarity, it.mechanic || '-', it.mechanicPower || 0].join(':'); });\nT.setSeed('mechanic-sequence');\nconst mechSeq2 = Array.from({ length: 120 }, () => { const it = T.genEquip(70); return [it.slot, it.rarity, it.mechanic || '-', it.mechanicPower || 0].join(':'); });\nok(JSON.stringify(mechSeq1) === JSON.stringify(mechSeq2), '机制生成不额外破坏固定种子确定性');\n{\n  const legacyItem = { slot: 'ring', name: '旧档戒指', score: 8, rarity: 2, stats: { hp: 8 }, affixes: [], icon: 'copper-ring', base: { name: '旧档戒指' }, spr: 'ring' };\n  const legacy = T.sanitizeMeta({ v: 1, classId: 'warrior', bag: [legacyItem] });\n  ok(legacy.bag.length === 1 && !legacy.bag[0].mechanic, '旧装备无需 destructive migration 仍可加载');\n}\n{\n  const armor = { slot: 'armor', name: '测试镇守甲', rarity: 3, mechanic: 'brace', mechanicPower: 1, stats: {}, affixes: [] };\n  T.player.equip.armor = armor;\n  T.player.braceTurn = T.turns;\n  ok(T.applyDirectHitMechanic(20) === 13, 'Epic 镇守将 20 点直击压到 13');\n  T.player.equip.armor = null;\n  const boots = { slot: 'boots', name: '测试残影靴', rarity: 4, mechanic: 'afterimage', mechanicPower: 2, stats: {}, affixes: [] };\n  T.player.equip.boots = boots;\n  T.player.afterimageTurn = T.turns;\n  ok(T.applyDirectHitMechanic(20) === 12, 'Legendary 残影将 20 点直击压到 12');\n  T.player.equip.boots = null;\n  const ring = { slot: 'ring', name: '测试危机戒', rarity: 4, mechanic: 'crisis', mechanicPower: 2, stats: {}, affixes: [] };\n  T.player.equip.ring = ring;\n  T.player.hp = Math.max(1, Math.floor(T.pMaxHp() * .4));\n  ok(T.pCrit() >= 25, \`Legendary 危机脉搏低血时提高暴击（实际 \${T.pCrit()}%）\`);\n}\n\nconsole.log('\\nRESULT  ' + pass + ' 通过 / ' + fail + ' 失败');`,
  'append mechanic regression suite'
);
write('test/smoke.cjs', smoke);

console.log('golden20_build_traits=APPLIED');
