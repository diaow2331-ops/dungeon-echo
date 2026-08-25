/* classic-20 内容 Profile（schemaVersion 2）
 * 1–10 层沿用 classic-10 数值；11–20 层为霜骨墓园 / 沉没圣堂 / 虚空裂隙。
 * 第 10 层中层 Boss 仍可下楼；第 20 层封顶，必须击败虚空君王并拾取地牢之心。
 */
window.DE_PROFILES = window.DE_PROFILES || {};
window.DE_PROFILES['classic-20'] = {
  schemaVersion: 2,
  profileId: 'classic-20',
  title: '回响加深 · 二十层',

  floorRules: {
    maxDepth: 20,
    themeBandSize: 3,
    baseMonsterCount: 5,
    monsterPerDepth: 1,
    maxMonsters: 18,
    eliteChance: 0.14,
    eliteHpMult: 1.8,
    eliteAtkMult: 1.3,
    depthScaleMax: 0.28,
    lootChances: { scroll: 0.42, equip1: 0.50, equip2: 0.32 },
    killLoot: { gold: 0.52, potion: 0.66, equip: 0.78 },
    lootCounts: {
      potionLo: 1, potionHi: 2,
      goldLo: 2, goldHi: 4,
      floorGoldLo: 5, floorGoldHi: 15, floorGoldPerDepth: 3,
      killGoldLo: 3, killGoldHi: 10, killGoldPerDepth: 2,
    },
  },

  consumables: {
    potion: { icon: 'healing-potion', name: '治疗药水' },
    scroll: { icon: 'teleport-scroll', name: '传送卷轴' },
    gold:   { icon: 'gold-pile', name: '金币' },
    key:    { icon: 'dungeon-key', name: '锈蚀钥匙' },
  },

  themes: [
    { name: '石砌地窟', fl: '#262c38', fl2: '#222734', sp1: '#1c212c', sp2: '#2f3644', wa: '#3d4356', wl: '#262b38', wh: 'rgba(255,255,255,.08)' },
    { name: '苔湿洞穴', fl: '#243026', fl2: '#202a23', sp1: '#182018', sp2: '#2d3b2d', wa: '#3a4a3c', wl: '#232e24', wh: 'rgba(220,255,220,.07)' },
    { name: '血色深渊', fl: '#33232a', fl2: '#2d1f26', sp1: '#22161c', sp2: '#3d2b33', wa: '#4a3038', wl: '#301e24', wh: 'rgba(255,220,220,.07)' },
    { name: '地狱核心', fl: '#301c22', fl2: '#2a181e', sp1: '#1e1216', sp2: '#3a232b', wa: '#452a30', wl: '#2c1a1f', wh: 'rgba(255,200,160,.08)' },
    { name: '霜骨墓园', fl: '#1c2834', fl2: '#182430', sp1: '#121c26', sp2: '#2a3a48', wa: '#3a4e5e', wl: '#1e2c38', wh: 'rgba(180,220,255,.08)' },
    { name: '沉没圣堂', fl: '#1e2c2c', fl2: '#1a2626', sp1: '#121c1c', sp2: '#2c3e3a', wa: '#3a524c', wl: '#1c2c28', wh: 'rgba(180,230,210,.08)' },
    { name: '虚空裂隙', fl: '#1a1624', fl2: '#16121e', sp1: '#100e18', sp2: '#2a2438', wa: '#3a3450', wl: '#1e1a2c', wh: 'rgba(200,190,255,.08)' },
  ],

  monsters: [
    { sprite: 'rat',      name: '巨鼠',     color: '#b58900', hp: 4,  atk: 2,  def: 0, xp: 2,  min: 1, max: 3 },
    { sprite: 'bat',      name: '蝙蝠',     color: '#93a1a1', hp: 5,  atk: 2,  def: 0, xp: 3,  min: 1, max: 5, erratic: true },
    { sprite: 'goblin',   name: '哥布林',   color: '#859900', hp: 9,  atk: 4,  def: 1, xp: 6,  min: 1, max: 6 },
    { sprite: 'skeleton', name: '骷髅',     color: '#eee8d5', hp: 13, atk: 5,  def: 2, xp: 9,  min: 2, max: 8 },
    { sprite: 'orc',      name: '兽人',     color: '#cb4b16', hp: 17, atk: 7,  def: 2, xp: 13, min: 3, max: 10 },
    { sprite: 'ghost',    name: '幽魂',     color: '#6c71c4', hp: 15, atk: 8,  def: 3, xp: 16, min: 4, max: 12 },
    { sprite: 'troll',    name: '巨魔',     color: '#2aa198', hp: 26, atk: 10, def: 3, xp: 24, min: 5, max: 12 },
    { sprite: 'demon',    name: '深渊恶魔', color: '#dc322f', hp: 36, atk: 13, def: 4, xp: 38, min: 7, max: 14 },
    { sprite: 'wraith',   name: '霜怨灵',   color: '#7ec8e3', hp: 28, atk: 12, def: 2, xp: 28, min: 11, max: 16, poison: true },
    { sprite: 'golem',    name: '墓石魔像', color: '#8a94a8', hp: 48, atk: 14, def: 6, xp: 36, min: 12, max: 18, slow: true },
    { sprite: 'vampire',  name: '血爵',     color: '#c8452c', hp: 40, atk: 16, def: 4, xp: 42, min: 13, max: 19, leech: 0.25 },
    { sprite: 'lich',     name: '墓园巫妖', color: '#bc8ee9', hp: 34, atk: 18, def: 3, xp: 48, min: 15, max: 20, ranged: 3 },
    { sprite: 'dragonkin',name: '裂隙龙裔', color: '#e0a73f', hp: 55, atk: 20, def: 5, xp: 60, min: 17, max: 20 },
  ],

  midBoss: { sprite: 'boss', name: '深渊领主', color: '#dc322f', hp: 120, atk: 15, def: 5, xp: 160, depth: 10 },
  boss:    { sprite: 'voidlord', name: '虚空君王', color: '#8b7ec8', hp: 220, atk: 22, def: 8, xp: 320 },

  shopFloors: [4, 8, 12, 16],
  chestChance: 0.55,
  keyChance: 0.22,

  rarities: [
    { name: '普通', color: '#c9d4e3', affixes: 0, w: 50 },
    { name: '精良', color: '#7dd87d', affixes: 1, w: 27 },
    { name: '稀有', color: '#5aa7e8', affixes: 2, w: 14 },
    { name: '史诗', color: '#b07de8', affixes: 3, w: 7 },
    { name: '传说', color: '#eda23a', affixes: 4, w: 2 },
  ],
  weaponBases: [
    { name: '铁剑',     icon: 'iron-sword', atk: 2, min: 1, cls: 'warrior' },
    { name: '阔剑',     icon: 'broad-sword', atk: 4, min: 3, cls: 'warrior' },
    { name: '战斧',     icon: 'battle-axe', atk: 6, min: 5, cls: 'warrior' },
    { name: '符文之刃', icon: 'rune-blade', atk: 9, min: 7, cls: 'warrior' },
    { name: '裂隙之刃', icon: 'rune-blade', atk: 12, min: 14, cls: 'warrior' },
    { name: '猎弓',     icon: 'hunting-bow', atk: 2, min: 1, cls: 'ranger' },
    { name: '强弓',     icon: 'hunting-bow', atk: 4, min: 3, cls: 'ranger' },
    { name: '鹰眼长弓', icon: 'hunting-bow', atk: 6, min: 5, cls: 'ranger' },
    { name: '追猎之弓', icon: 'hunting-bow', atk: 9, min: 7, cls: 'ranger' },
    { name: '裂空之弓', icon: 'hunting-bow', atk: 12, min: 14, cls: 'ranger' },
    { name: '学徒法杖', icon: 'arcane-staff', atk: 2, min: 1, cls: 'mage' },
    { name: '秘纹法杖', icon: 'arcane-staff', atk: 4, min: 3, cls: 'mage' },
    { name: '星光法杖', icon: 'arcane-staff', atk: 6, min: 5, cls: 'mage' },
    { name: '奥术权杖', icon: 'arcane-staff', atk: 9, min: 7, cls: 'mage' },
    { name: '虚空法杖', icon: 'arcane-staff', atk: 12, min: 14, cls: 'mage' },
    { name: '匕首',     icon: 'dagger', atk: 2, min: 1, cls: 'assassin' },
    { name: '淬毒匕首', icon: 'dagger', atk: 4, min: 3, cls: 'assassin' },
    { name: '暗影匕首', icon: 'dagger', atk: 6, min: 5, cls: 'assassin' },
    { name: '夜刃',     icon: 'dagger', atk: 9, min: 7, cls: 'assassin' },
    { name: '裂魂匕首', icon: 'dagger', atk: 12, min: 14, cls: 'assassin' },
  ],
  armorBases: [
    { name: '皮甲',   icon: 'leather-armor', def: 1, min: 1 },
    { name: '锁子甲', icon: 'chain-mail', def: 2, min: 3 },
    { name: '板甲',   icon: 'plate-armor', def: 4, min: 5 },
    { name: '秘银铠', icon: 'mithril-armor', def: 6, min: 7 },
    { name: '虚空甲', icon: 'mithril-armor', def: 8, min: 14 },
  ],
  ringBases: [
    { name: '铜戒指',   icon: 'copper-ring', hp: 5,  min: 1 },
    { name: '红宝石戒', icon: 'ruby-ring', hp: 9,  min: 3 },
    { name: '守护之戒', icon: 'guardian-ring', hp: 14, min: 6 },
    { name: '永夜之戒', icon: 'guardian-ring', hp: 20, min: 13 },
  ],
  affixRanges: {
    thorns:{ lo: 1, hiGrow: 1, growDiv: 4 },
    regen: { lo: 2, hiGrow: 3, growDiv: 4 },
    atk:   { lo: 1, hiGrow: 2, growDiv: 3 },
    def:   { lo: 1, hiGrow: 2, growDiv: 3 },
    hp:    { lo: 4, hi: 8, flatPerDepth: 1 },
    crit:  { lo: 2, hi: 5 },
    leech: { lo: 3, hi: 8 },
    gold:  { lo: 10, hi: 25 },
  },

  terminalReward: {
    kind: 'amulet',
    icon: 'dungeon-heart',
    name: '地牢之心',
    bossGoldBase: 240,
    bossGoldPerDepth: 12,
  },

  shop: {
    potionPrice: 16,
    scrollPrice: 28,
    keyPrice: 22,
    healPrice: 24,
    equipMult: 3,
  },

  texts: {
    intro: '三道回响在入口处低语。选一条路，杀穿 {maxDepth} 层，从 {boss} 手中夺回「{heart}」。',
    bossGate: '{boss}封锁了最后的阶梯。击败它，夺回「{heart}」！',
    bossFloorArrive: '空气撕裂开来……{boss}就在这一层！',
    maxDepthArrive: '你踏入了第 {maxDepth} 层——世界在这里被掏空。',
    bossDeath: '{boss}倒下了！它守护的【{heart}】掉落了出来！',
    winBody: '你取得了<b>{heart}</b>，二十层地牢在身后轰然崩塌！<br>',
    midBossArrive: '第 {depth} 层的熔岩门后，{midBoss}挡住了去路。击败它仍可继续下潜。',
    midBossDeath: '{midBoss}崩解了。通往更深处的阶梯重新亮起。',
    shopArrive: '一位蒙面商人在火把下摆开摊位。金币能换来活路。',
  },
};
