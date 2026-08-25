/* classic-10 内容 Profile（schemaVersion 1）
 * 数据来源：自 main@33ef818 的 game.js 内嵌常量逐字迁移，数值未做任何调整。
 * 本文件必须在 game.js 之前通过 <script> 加载（file:// 环境无 fetch/server）。
 * 校验规则见 game.js 内 validateProfile；校验失败将 fail-closed 终止启动。
 */
window.DE_PROFILES = window.DE_PROFILES || {};
window.DE_PROFILES['classic-10'] = {
  schemaVersion: 1,
  profileId: 'classic-10',
  title: '经典十层 · 石砌地窟到地狱核心',

  // 楼层规则
  floorRules: {
    maxDepth: 10,          // 第 10 层封顶：无楼梯，必须击败 Boss
    themeBandSize: 3,      // 每 3 层切换一次主题
    baseMonsterCount: 5,   // 每层基础怪物数：5 + depth * monsterPerDepth
    monsterPerDepth: 2,
    maxMonsters: 16,
    eliteChance: 0.13,     // 精英怪概率
    eliteHpMult: 1.8,
    eliteAtkMult: 1.3,
    depthScaleMax: 0.25,   // 同层深度梯度上限 +25%

    // 每层固定刷新的掉落概率 / 数量 / 价值（原内嵌字面量逐字迁移）
    lootChances: { scroll: 0.40, equip1: 0.55, equip2: 0.35 },
    killLoot: { gold: 0.50, potion: 0.65, equip: 0.79 },
    lootCounts: {
      potionLo: 1, potionHi: 2,
      goldLo: 2, goldHi: 4,
      floorGoldLo: 5, floorGoldHi: 15, floorGoldPerDepth: 3,
      killGoldLo: 3, killGoldHi: 10, killGoldPerDepth: 2,
    },
  },

  // 消耗品与货币身份（icon 必须在图集身份表内）
  consumables: {
    potion: { icon: 'healing-potion', name: '治疗药水' },
    scroll: { icon: 'teleport-scroll', name: '传送卷轴' },
    gold:   { icon: 'gold-pile', name: '金币' },
  },

  // 楼层主题（每 3 层换一段）
  themes: [
    { name: '石砌地窟', fl: '#262c38', fl2: '#222734', sp1: '#1c212c', sp2: '#2f3644', wa: '#3d4356', wl: '#262b38', wh: 'rgba(255,255,255,.08)' },
    { name: '苔湿洞穴', fl: '#243026', fl2: '#202a23', sp1: '#182018', sp2: '#2d3b2d', wa: '#3a4a3c', wl: '#232e24', wh: 'rgba(220,255,220,.07)' },
    { name: '血色深渊', fl: '#33232a', fl2: '#2d1f26', sp1: '#22161c', sp2: '#3d2b33', wa: '#4a3038', wl: '#301e24', wh: 'rgba(255,220,220,.07)' },
    { name: '地狱核心', fl: '#301c22', fl2: '#2a181e', sp1: '#1e1216', sp2: '#3a232b', wa: '#452a30', wl: '#2c1a1f', wh: 'rgba(255,200,160,.08)' },
  ],

  // 普通怪物（按出现楼层区间分层）
  monsters: [
    { sprite: 'rat',      name: '巨鼠',   color: '#b58900', hp: 4,  atk: 2,  def: 0, xp: 2,  min: 1, max: 3 },
    { sprite: 'bat',      name: '蝙蝠',   color: '#93a1a1', hp: 5,  atk: 2,  def: 0, xp: 3,  min: 1, max: 5, erratic: true },
    { sprite: 'goblin',   name: '哥布林', color: '#859900', hp: 9,  atk: 4,  def: 1, xp: 6,  min: 1, max: 6 },
    { sprite: 'skeleton', name: '骷髅',   color: '#eee8d5', hp: 13, atk: 5,  def: 2, xp: 9,  min: 2, max: 8 },
    { sprite: 'orc',      name: '兽人',   color: '#cb4b16', hp: 17, atk: 7,  def: 2, xp: 13, min: 3, max: 9 },
    { sprite: 'ghost',    name: '幽魂',   color: '#6c71c4', hp: 20, atk: 9,  def: 3, xp: 16, min: 4, max: 10 },
    { sprite: 'troll',    name: '巨魔',   color: '#2aa198', hp: 38, atk: 12, def: 3, xp: 24, min: 5, max: 10 },
    { sprite: 'demon',    name: '深渊恶魔', color: '#dc322f', hp: 56, atk: 15, def: 4, xp: 38, min: 7, max: 10 },
  ],

  // 终局 Boss（第 maxDepth 层）
  boss: { sprite: 'boss', name: '深渊领主', color: '#dc322f', hp: 210, atk: 20, def: 7, xp: 200 },

  // 掉落系统
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
    { name: '猎弓',     icon: 'hunting-bow', atk: 2, min: 1, cls: 'ranger' },
    { name: '强弓',     icon: 'hunting-bow', atk: 4, min: 3, cls: 'ranger' },
    { name: '鹰眼长弓', icon: 'hunting-bow', atk: 6, min: 5, cls: 'ranger' },
    { name: '追猎之弓', icon: 'hunting-bow', atk: 9, min: 7, cls: 'ranger' },
    { name: '学徒法杖', icon: 'arcane-staff', atk: 2, min: 1, cls: 'mage' },
    { name: '秘纹法杖', icon: 'arcane-staff', atk: 4, min: 3, cls: 'mage' },
    { name: '星光法杖', icon: 'arcane-staff', atk: 6, min: 5, cls: 'mage' },
    { name: '奥术权杖', icon: 'arcane-staff', atk: 9, min: 7, cls: 'mage' },
    { name: '匕首',     icon: 'dagger', atk: 2, min: 1, cls: 'assassin' },
    { name: '淬毒匕首', icon: 'dagger', atk: 4, min: 3, cls: 'assassin' },
    { name: '暗影匕首', icon: 'dagger', atk: 6, min: 5, cls: 'assassin' },
    { name: '夜刃',     icon: 'dagger', atk: 9, min: 7, cls: 'assassin' },
  ],
  armorBases: [
    { name: '皮甲',   icon: 'leather-armor', def: 1, min: 1 },
    { name: '锁子甲', icon: 'chain-mail', def: 2, min: 3 },
    { name: '板甲',   icon: 'plate-armor', def: 4, min: 5 },
    { name: '秘银铠', icon: 'mithril-armor', def: 6, min: 7 },
  ],
  ringBases: [
    { name: '铜戒指',   icon: 'copper-ring', hp: 5,  min: 1 },
    { name: '红宝石戒', icon: 'ruby-ring', hp: 9,  min: 3 },
    { name: '守护之戒', icon: 'guardian-ring', hp: 14, min: 6 },
  ],
  // 词缀数值区间 [min, max]（genAffix 按当前深度取值）
  affixRanges: {
    thorns:{ lo: 1, hiGrow: 1, growDiv: 4 },
    regen: { lo: 2, hiGrow: 3, growDiv: 4 },
    atk:   { lo: 1, hiGrow: 2, growDiv: 3 },   // ri(1,2)+floor(depth/3)
    def:   { lo: 1, hiGrow: 2, growDiv: 3 },
    hp:    { lo: 4, hi: 8, flatPerDepth: 1 },   // ri(4,8)+depth
    crit:  { lo: 2, hi: 5 },
    leech: { lo: 3, hi: 8 },
    gold:  { lo: 10, hi: 25 },
  },

  // 终局奖励（type/icon/name/文本均由运行时消费）
  terminalReward: {
    kind: 'amulet',
    icon: 'dungeon-heart',
    name: '地牢之心',
    bossGoldBase: 200,
    bossGoldPerDepth: 10,
  },

  // 内容文案模板（占位符：{boss} {heart} {depth} {maxDepth}）
  texts: {
    intro: '你在冰冷的地牢入口醒来。杀穿 {maxDepth} 层，从 {boss} 手中夺回「{heart}」。',
    bossGate: '{boss}封锁了最后的阶梯。击败它，夺回「{heart}」！',
    bossFloorArrive: '空气中弥漫着灼热的腥风……{boss}就在这一层！',
    maxDepthArrive: '你踏入了第 {maxDepth} 层——深渊之心。这里灼热得像巨兽的咽喉。',
    bossDeath: '{boss}倒下了！它守护的【{heart}】掉落了出来！',
    winBody: '你取得了<b>{heart}</b>，地牢在身后轰然崩塌！<br>',
  },
};
