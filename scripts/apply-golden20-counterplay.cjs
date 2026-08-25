const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(root, p), s);

function replaceRegex(source, regex, replacement, label) {
  const matches = source.match(regex);
  if (!matches || matches.length !== 1) {
    throw new Error(`${label}: expected exactly one match`);
  }
  return source.replace(regex, replacement);
}

function replaceText(source, oldText, newText, label) {
  const first = source.indexOf(oldText);
  if (first < 0 || source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`${label}: expected exactly one text match`);
  }
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

let game = read('game.js');

game = replaceRegex(
  game,
  /\/\/ —— 平衡反制机制（对抗「神装无敌」）——[\s\S]*?function pierceChanceOf\(atk, def\) \{[\s\S]*?\n\}\n/,
  `// —— 可读反制：隐藏随机穿甲已移除 ——\n// 普通攻击永远按护甲结算；高 DEF 不再提高任何隐藏的无视护甲概率。\n// 保留旧测试 API 名称并固定返回 0，避免外部调试脚本因接口消失而崩溃。\nfunction pierceChanceOf() { return 0; }\n\nfunction beginArmorBreak(m, mode) {\n  if (!m || !m.armorBreak || (m.armorBreakCooldown || 0) > 0 || (m.armorBreakCharge || 0) > 0) return false;\n  m.armorBreakCharge = 1;\n  m.armorBreakMode = mode === 'ranged' ? 'ranged' : 'melee';\n  floater(m, '破甲蓄力', '#e0a73a');\n  msg(m.armorBreakMode === 'ranged'\n    ? \`\${m.name} 锁定了你，下一回合将射出破甲重击——离开视线或射程！\`\n    : \`\${m.name} 举起武器蓄力，下一回合将发动破甲重击——拉开距离！\`, 'bad');\n  sfx.skill();\n  return true;\n}\n`,
  'replace random pierce rule'
);

game = replaceText(
  game,
  `    enrage: !!base.enrage || traits.includes('enrage'),\n    enraged: false,\n    alert: 0, skip: 0,`,
  `    enrage: !!base.enrage || traits.includes('enrage'),\n    enraged: false,\n    armorBreak: !!base.armorBreak || traits.includes('armorBreak'),\n    armorBreakCharge: 0, armorBreakMode: null, armorBreakCooldown: 0,\n    alert: 0, skip: 0,`,
  'add armor-break monster state'
);

game = replaceRegex(
  game,
  /function monsterAttack\(m\) \{[\s\S]*?\n\}\nfunction dropAt/,
  `function monsterAttack(m, armorBreak = false) {\n  lunge(m, player.x, player.y);\n  // 游侠被动「灵巧」：一成几率闪开近战攻击（不挡远程——远程是游侠的克制面）\n  if (classId === 'ranger' && player.hp > 0 && rng() < 0.10) {\n    floater(player, '闪避', '#7ec8e3');\n    msg(\`\${m.name}的攻击被你灵巧闪开。\`);\n    return;\n  }\n  const raw = m.atk + ri(-1, 1);\n  const dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - pDef());\n  if (armorBreak) {\n    floater(player, '破甲重击!', '#e0a73a');\n    msg(\`\${m.name} 的蓄力破甲命中，造成 \${dmg} 点无视护甲伤害！\`, 'bad');\n  } else {\n    msg(\`\${m.name}击中你，造成 \${dmg} 点伤害！\`, 'bad');\n  }\n  player.hp -= dmg;\n  floater(player, \`-\${dmg}\`, '#ff6b6b');\n  addTrauma(armorBreak ? 0.48 : 0.35); sfx.hurt();\n  if (m.poison) {\n    player.poison = Math.max(player.poison || 0, 3);\n    msg('毒素渗进伤口。', 'bad');\n  }\n  if ((m.elite || m.boss || m.midBoss) && player.hp > 0) applyGrievous();\n  if (m.leech) {\n    const heal = Math.max(1, Math.round(dmg * m.leech));\n    m.hp = Math.min(m.maxHp, m.hp + heal);\n  }\n  const th = pThorns();\n  if (th > 0 && m.hp > 0 && player.hp > 0) {\n    m.hp -= th; m.hurtT = 1;\n    floater(m, \`-\${th}\`, '#c9a7ff');\n    burst(m.fx, m.fy, '#c9a7ff', 4);\n    if (m.hp <= 0) {\n      msg(\`\${m.name} 撞上荆棘，被反噬而死！\`, 'good');\n      killMonster(m);\n    } else {\n      msg(\`荆棘反噬\${m.name} \${th} 点。\`);\n    }\n  }\n  if (player.hp <= 0) die();\n}\nfunction dropAt`,
  'replace melee damage path'
);

game = replaceRegex(
  game,
  /function monsterRangedAttack\(m\) \{[\s\S]*?\n\}\nfunction monstersTurn\(\) \{/,
  `function monsterRangedAttack(m, armorBreak = false) {\n  fireArrow(m.x, m.y, player.x, player.y);\n  const raw = Math.round(m.atk * 0.8) + ri(-1, 1);\n  const effDef = Math.floor(pDef() / 2);\n  const dmg = armorBreak ? Math.max(1, raw) : Math.max(1, raw - effDef);\n  if (armorBreak) {\n    floater(player, '破甲重击!', '#e0a73a');\n    msg(\`\${m.name} 的蓄力射击命中，造成 \${dmg} 点无视护甲伤害！\`, 'bad');\n  } else {\n    msg(\`\${m.name} 远程袭击你，造成 \${dmg} 点伤害！\`, 'bad');\n  }\n  player.hp -= dmg;\n  floater(player, \`-\${dmg}\`, '#ff6b6b');\n  addTrauma(armorBreak ? 0.45 : 0.32); sfx.hurt();\n  if ((m.elite || m.boss || m.midBoss) && player.hp > 0) applyGrievous();\n  if (m.poison) {\n    player.poison = Math.max(player.poison || 0, 3);\n    msg('毒素渗进伤口。', 'bad');\n  }\n  if (player.hp <= 0) die();\n}\nfunction monstersTurn() {`,
  'replace ranged damage path'
);

game = replaceRegex(
  game,
  /function monstersTurn\(\) \{[\s\S]*?\n\}\n\nfunction lungeOff/,
  `function monstersTurn() {\n  for (const m of [...monsters]) {\n    if (m.slow) {\n      m.skip = 1 - (m.skip || 0);\n      if (m.skip) continue;\n    }\n    if (m.regen && m.hp > 0 && m.hp < m.maxHp) {\n      const r = Math.max(1, Math.round(m.maxHp * 0.05));\n      m.hp = Math.min(m.maxHp, m.hp + r);\n      floater(m, \`+\${r}\`, '#7dd87d');\n    }\n    if ((m.armorBreakCooldown || 0) > 0) m.armorBreakCooldown--;\n    const cheb = Math.max(Math.abs(m.x - player.x), Math.abs(m.y - player.y));\n    const adj = Math.abs(m.x - player.x) + Math.abs(m.y - player.y) === 1;\n\n    // 已经亮出破甲蓄力：下一回合只有目标仍在原攻击条件内才会命中。\n    // 玩家拉开距离/脱离视线会让这一整回合落空，形成明确的可操作反制。\n    if ((m.armorBreakCharge || 0) > 0) {\n      const rangedBreak = m.armorBreakMode === 'ranged';\n      const valid = rangedBreak\n        ? !!(m.ranged && canSeePlayer(m) && cheb <= m.ranged)\n        : adj;\n      m.armorBreakCharge = 0;\n      m.armorBreakMode = null;\n      if (valid) {\n        if (rangedBreak) monsterRangedAttack(m, true);\n        else monsterAttack(m, true);\n        m.armorBreakCooldown = 3;\n        if (state !== 'playing') return;\n      } else {\n        m.armorBreakCooldown = 1;\n        floater(m, '蓄力落空', '#9b8d78');\n        msg(\`你避开了\${m.name}的破甲重击窗口。\`, 'good');\n      }\n      continue;\n    }\n\n    // 特定敌人才具备破甲能力；先给完整一回合预警，不再用隐藏概率惩罚高防。\n    if (m.armorBreak && (m.armorBreakCooldown || 0) <= 0) {\n      if (adj && beginArmorBreak(m, 'melee')) continue;\n      if (m.ranged && canSeePlayer(m) && cheb <= m.ranged && beginArmorBreak(m, 'ranged')) continue;\n    }\n\n    if (adj) {\n      monsterAttack(m);\n      if (state !== 'playing') return;\n      continue;\n    }\n    if (m.ranged && canSeePlayer(m) && cheb <= m.ranged) {\n      monsterRangedAttack(m);\n      if (state !== 'playing') return;\n      continue;\n    }\n    if (canSeePlayer(m)) {\n      m.alert = AI_MEM;\n      if (m.erratic && rng() < 0.5) randomStep(m);\n      else stepToward(m);\n    } else if (m.alert > 0) {\n      m.alert--;\n      stepToward(m);\n    } else if (rng() < 0.25) {\n      randomStep(m);\n    }\n  }\n}\n\nfunction lungeOff`,
  'replace monster turn armor-break state machine'
);

game = replaceRegex(
  game,
  /function drawEntity\(e, spr, size, now\) \{[\s\S]*?\n  return \[px, py\];\n\}/,
  `function drawEntity(e, spr, size, now) {\n  const [lox, loy] = lungeOff(e);\n  const bob = Math.sin(now * 2.6 + e.x * 7 + e.y * 5) * 1.3;\n  const px = e.fx * TILE + TILE / 2 + lox;\n  const py = e.fy * TILE + TILE / 2 + bob + loy;\n  drawShadow(e.fx * TILE + TILE / 2, e.fy * TILE + TILE - 4, size * .3, size * .11);\n  ctx.drawImage(spr.img, px - size / 2, py - size / 2, size, size);\n  if (e.hurtT > 0) {\n    ctx.globalAlpha = Math.min(1, e.hurtT);\n    ctx.drawImage(spr.white, px - size / 2, py - size / 2, size, size);\n    ctx.globalAlpha = 1;\n  }\n  if ((e.armorBreakCharge || 0) > 0) {\n    ctx.save();\n    ctx.strokeStyle = '#e0a73a';\n    ctx.lineWidth = 2;\n    ctx.globalAlpha = .9;\n    ctx.beginPath();\n    ctx.arc(px, py, size * .58, 0, Math.PI * 2);\n    ctx.stroke();\n    ctx.fillStyle = '#f2d27b';\n    ctx.font = \`bold \${Math.max(14, Math.round(size * .42))}px \"Segoe UI\",sans-serif\`;\n    ctx.textAlign = 'center';\n    ctx.textBaseline = 'middle';\n    ctx.fillText('!', px, py - size * .72);\n    ctx.restore();\n  }\n  return [px, py];\n}`,
  'add armor-break visual cue'
);

game = replaceText(
  game,
  `    makeMonster, applyDamageToMonster, monsterRangedAttack, monsterAttack, spawnCasks, endTurn,\n    pThorns, pKillHeal, pMaxHp, pDef, eqScoreOf, pierceChanceOf,`,
  `    makeMonster, applyDamageToMonster, monsterRangedAttack, monsterAttack, monstersTurn, beginArmorBreak, spawnCasks, endTurn,\n    pThorns, pKillHeal, pMaxHp, pDef, eqScoreOf, pierceChanceOf,`,
  'expose counterplay test hooks'
);

write('game.js', game);

let content = read('content-system.js');
content = replaceText(
  content,
  `    10: { enrage: true },`,
  `    // 第一位守卫是破甲教学：先亮出蓄力，再给玩家一整回合拉开距离。\n    10: { armorBreak: true },`,
  'make floor-10 guardian teach armor break'
);
content = replaceText(
  content,
  ` * gives each ten-floor guardian a distinct behavior combination using mechanics the\n * core already understands. Final bespoke boss phases can replace this bridge later.`,
  ` * gives each ten-floor guardian a distinct behavior combination using mechanics the\n * core already understands. Floor 10 now teaches the first telegraphed counterplay rule;\n * later bespoke boss phases can replace the remaining interim combinations.`,
  'update content module contract comment'
);
write('content-system.js', content);

let equip = read('equipment-system.js');
equip = replaceText(
  equip,
  `  // DEF affinity is deliberately conservative. The current core still has a random\n  // anti-armor pierce rule, so production builds are steered toward HP/recovery/utility\n  // until that combat rule is replaced by telegraphed armor-break behavior.`,
  `  // DEF affinity stays deliberately conservative until the next human-play pass.\n  // High DEF is now honest mitigation; selected enemies counter it through a visible\n  // armor-break wind-up instead of hidden random full bypass. HP/recovery remain separate\n  // survival axes rather than a workaround for a broken defense rule.`,
  'refresh equipment defense doctrine comment'
);
equip = replaceText(
  equip,
  `  // Armor gets HP as a second survival axis. This deliberately reduces the incentive\n  // for warrior to solve every problem by stacking DEF into the anti-armor pierce wall.`,
  `  // Armor keeps HP as a second survival axis so Warrior still chooses between stable\n  // mitigation and a larger error buffer instead of solving every encounter with one stat.`,
  'refresh armor doctrine comment'
);
equip = replaceText(
  equip,
  `  // survivability comes from HP/recovery so current random pierce cannot dominate builds.`,
  `  // survivability still mixes HP/recovery with DEF so no single stat dominates builds.`,
  'refresh deep loot doctrine comment'
);
write('equipment-system.js', equip);

let smoke = read('test/smoke.cjs');
const newSection16 = `// ---------- 16. 平衡反制：可读破甲 + 重伤 ----------\nsection('16 平衡反制：可读破甲 / 重伤');\n\n// 16.1 旧隐藏随机穿甲接口固定归零：高防不再反向提高受穿甲概率\nok(T.pierceChanceOf(10, 10) === 0, '同攻防时隐藏穿甲率为 0');\nok(T.pierceChanceOf(10, 25) === 0, '高防时隐藏穿甲率仍为 0');\nok(T.pierceChanceOf(10, 100) === 0, '极端高防也不会触发隐藏随机穿甲');\n\n// 16.2 普通怪物面对高防只能按正常护甲公式造成地板伤害\nT.setSeed('honest-defense');\nT.newGame('warrior');\nT.player.equip.armor = { slot: 'armor', name: '城墙板甲', score: 999, icon: 'iron-armor',\n  rarity: 4, stats: { def: 200 }, base: { name: '城墙板甲' }, affixes: [], spr: 'armor', forge: 5 };\n{\n  const v = T.monsters.find(x => !x.boss && !x.midBoss);\n  v.x = T.player.x + 1; v.y = T.player.y;\n  v.maxHp = 99999; v.hp = 99999; v.atk = 10; v.poison = 0; v.leech = 0;\n  v.boom = 0; v.enrage = 0; v.elite = false; v.armorBreak = false; v.xp = 0;\n  let maxDmg = 0;\n  for (let i = 0; i < 120; i++) {\n    T.player.hp = 99999;\n    const before = T.player.hp;\n    T.monsterAttack(v);\n    maxDmg = Math.max(maxDmg, before - T.player.hp);\n  }\n  ok(maxDmg === 1, \`普通攻击尊重高防：120 次最高单击 \${maxDmg}\`);\n}\n\n// 16.3 破甲敌人先蓄力；玩家离开攻击范围后重击落空\nT.setSeed('armor-break-telegraph');\nT.newGame('warrior');\nT.player.equip.armor = { slot: 'armor', name: '城墙板甲', score: 999, icon: 'iron-armor',\n  rarity: 4, stats: { def: 200 }, base: { name: '城墙板甲' }, affixes: [], spr: 'armor', forge: 5 };\n{\n  T.monsters.splice(0, T.monsters.length);\n  const m = T.makeMonster({\n    name: '破甲教官', sprite: 'skeleton', color: '#fff', hp: 99999, atk: 12, def: 0, xp: 0,\n    min: 1, max: 100, armorBreak: true,\n  }, { x: T.player.x + 1, y: T.player.y });\n  T.monsters.push(m);\n  T.player.hp = 500;\n  const before = T.player.hp;\n  T.monstersTurn();\n  ok(T.player.hp === before && m.armorBreakCharge === 1, '破甲第一回合只蓄力，不偷伤害');\n  T.player.x += 2;\n  T.monstersTurn();\n  ok(T.player.hp === before && m.armorBreakCharge === 0, '离开近战范围后蓄力落空');\n}\n\n// 16.4 若玩家留在窗口内，下一回合才结算无视护甲的明确重击\nT.setSeed('armor-break-resolve');\nT.newGame('warrior');\nT.player.equip.armor = { slot: 'armor', name: '城墙板甲', score: 999, icon: 'iron-armor',\n  rarity: 4, stats: { def: 200 }, base: { name: '城墙板甲' }, affixes: [], spr: 'armor', forge: 5 };\n{\n  T.monsters.splice(0, T.monsters.length);\n  const m = T.makeMonster({\n    name: '破甲教官', sprite: 'skeleton', color: '#fff', hp: 99999, atk: 12, def: 0, xp: 0,\n    min: 1, max: 100, armorBreak: true,\n  }, { x: T.player.x + 1, y: T.player.y });\n  T.monsters.push(m);\n  T.player.hp = 500;\n  T.monstersTurn();\n  const before = T.player.hp;\n  T.monstersTurn();\n  const dmg = before - T.player.hp;\n  ok(dmg >= 11, \`破甲重击只在第二回合结算且无视护甲（实际 \${dmg}）\`);\n  ok(m.armorBreakCooldown === 3, '破甲命中后进入 3 回合冷却，不会连续蓄力');\n}\n\n// 16.5 第 10 层守卫是生产路线里的第一只破甲教学敌人\n{\n  const contentSource = fs.readFileSync(__dirname + '/../content-system.js', 'utf8');\n  ok(contentSource.includes('10: { armorBreak: true }'), '第 10 层守卫显式启用 armorBreak 教学机制');\n}\n\n// 16.6 重伤：精英/Boss 命中施加，普通怪物不施加\nT.setSeed('grievous');\nT.newGame('warrior');\n{\n  const e = T.monsters.find(x => !x.boss && !x.midBoss);\n  e.x = T.player.x + 1; e.y = T.player.y;\n  e.maxHp = 99999; e.hp = 99999; e.atk = 1; e.poison = 0; e.leech = 0;\n  e.boom = 0; e.enrage = 0; e.elite = true; e.armorBreak = false;\n  T.player.hp = 500;\n  T.monsterAttack(e);\n  ok(T.player.grievous === 3, '精英命中施加重伤 3 回合');\n}\n{\n  T.player.grievous = 0;\n  const n = T.monsters.find(x => !x.boss && !x.midBoss);\n  n.x = T.player.x + 1; n.y = T.player.y;\n  n.maxHp = 99999; n.hp = 99999; n.atk = 1; n.poison = 0; n.leech = 0;\n  n.boom = 0; n.enrage = 0; n.elite = false; n.armorBreak = false;\n  T.player.hp = 500;\n  T.monsterAttack(n);\n  ok((T.player.grievous || 0) === 0, '普通怪物命中不施加重伤');\n}\n\n// 16.7 重伤期间治疗减半：药水（清空怪物以隔离 usePotion 末尾的 endTurn 反击）\n{\n  const depth = T.depth;\n  const fullHeal = Math.round((14 + depth * 2) * 0.5);\n  T.monsters.splice(0, T.monsters.length);\n  T.player.grievous = 3;\n  T.player.potions = 1;\n  T.player.hp = 5;\n  T.usePotion();\n  ok(T.player.hp === 5 + fullHeal, \`重伤药水治疗减半（+\${fullHeal}，实际 \${T.player.hp - 5}）\`);\n}\n{\n  T.player.grievous = 0;\n  T.player.potions = 1;\n  T.player.hp = 5;\n  T.usePotion();\n  const fullHeal = Math.round(14 + T.depth * 2);\n  ok(T.player.hp === 5 + fullHeal, '无重伤时药水治疗正常');\n}\n\n// 16.8 重伤期间吸血减半（使用构造的假怪物，避免依赖场上刷怪）\n{\n  const mkFake = () => ({ name: '测试靶子', x: 1, y: 1, fx: 1, fy: 1, color: '#fff',\n    maxHp: 99999, hp: 99999, atk: 1, def: 0, xp: 0, sprite: 'rat',\n    poison: false, leech: 0, boom: false, enrage: false, enraged: false,\n    elite: false, boss: false, midBoss: false, regen: false, slow: false, erratic: false,\n    armorBreak: false, armorBreakCharge: 0, armorBreakMode: null, armorBreakCooldown: 0,\n    traits: [], alert: 0, skip: 0, hurtT: 0, lungeT: 0, ldx: 0, ldy: 0 });\n  T.player.equip.ring = { slot: 'ring', name: '百吸戒', score: 999, icon: 'copper-ring',\n    rarity: 4, stats: { leech: 100 }, base: { name: '百吸戒' }, affixes: [], spr: 'ring', forge: 0 };\n  T.player.grievous = 3;\n  T.player.hp = 5;\n  T.applyDamageToMonster(mkFake(), 20, false);\n  ok(T.player.hp === 15, \`重伤吸血减半（20 伤 → 回 10，实际 \${T.player.hp - 5}）\`);\n  T.player.grievous = 0;\n  T.player.hp = 5;\n  T.applyDamageToMonster(mkFake(), 20, false);\n  ok(T.player.hp === 25, '无重伤时吸血全额（回 20）');\n}\n\n`;
smoke = replaceRegex(
  smoke,
  /\/\/ ---------- 16\. 平衡反制：破甲一击 \+ 重伤 ----------[\s\S]*?(?=\/\/ ---------- 17\.)/,
  newSection16,
  'replace smoke counterplay section'
);
write('test/smoke.cjs', smoke);

console.log('golden20_counterplay_patch=APPLIED');
