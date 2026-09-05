export const VERSION = '0.1.0';
export const TILE = Object.freeze({
  AIR:0, GRASS:1, SOIL:2, STONE:3, COAL:4, COPPER:5, IRON:6, CRYSTAL:7,
  SAND:8, SANDSTONE:9, ASH:10, BASALT:11, ICE:12, SNOW:13, WOOD:14,
  LEAF:15, CLAY:16, RUIN:17, GLOW_MOSS:18, PLANK:19, WORKBENCH:20,
  TORCH:21, CAMPFIRE:22, RELIC_CHEST:23, RUIN_SPIKE:24, RUIN_URN:25, ROPE:26, PLATFORM:27
});

export const BIOMES = Object.freeze([
  {id:'verdant', zh:'青藤原', en:'Verdant Reach', sky:'#6ea6b8', deep:'#193947', surface:TILE.GRASS, fill:TILE.SOIL, deepTile:TILE.STONE},
  {id:'ember', zh:'烬风荒地', en:'Ember Wastes', sky:'#b77a5f', deep:'#422529', surface:TILE.ASH, fill:TILE.SANDSTONE, deepTile:TILE.BASALT},
  {id:'frost', zh:'霜晶台地', en:'Frostglass Shelf', sky:'#87a7c7', deep:'#23334d', surface:TILE.SNOW, fill:TILE.ICE, deepTile:TILE.STONE}
]);

export const TILE_DEFS = Object.freeze({
  0:{id:'air', zh:'空气', en:'Air', solid:false, hardness:0, color:'transparent'},
  1:{id:'grass', zh:'青藤草皮', en:'Vinegrass', solid:true, hardness:.45, drop:'soil', color:'#5f8c49'},
  2:{id:'soil', zh:'沃土', en:'Loam', solid:true, hardness:.48, drop:'soil', place:'soil', color:'#74553e'},
  3:{id:'stone', zh:'灰岩', en:'Greyrock', solid:true, hardness:1.05, tier:0, drop:'stone', place:'stone', color:'#687078'},
  4:{id:'coal', zh:'幽煤', en:'Dusk Coal', solid:true, hardness:1.25, tier:1, drop:'coal', place:'coal', color:'#343941'},
  5:{id:'copper_ore', zh:'赤铜矿', en:'Red Copper Ore', solid:true, hardness:1.45, tier:1, drop:'copper_ore', place:'copper_ore', color:'#a35f42'},
  6:{id:'iron_ore', zh:'冷铁矿', en:'Cold Iron Ore', solid:true, hardness:1.75, tier:2, drop:'iron_ore', place:'iron_ore', color:'#879096'},
  7:{id:'crystal', zh:'星晶', en:'Star Crystal', solid:true, hardness:2.15, tier:3, drop:'crystal', place:'crystal', color:'#7f80d9', glow:true},
  8:{id:'sand', zh:'流砂', en:'Drift Sand', solid:true, hardness:.42, drop:'sand', place:'sand', color:'#b79b66'},
  9:{id:'sandstone', zh:'砂岩', en:'Sandstone', solid:true, hardness:.92, tier:0, drop:'sandstone', place:'sandstone', color:'#9c8053'},
  10:{id:'ash', zh:'灰烬土', en:'Ashsoil', solid:true, hardness:.42, drop:'ash', place:'ash', color:'#705553'},
  11:{id:'basalt', zh:'玄火岩', en:'Ember Basalt', solid:true, hardness:1.8, tier:2, drop:'basalt', place:'basalt', color:'#4f4147'},
  12:{id:'ice', zh:'霜冰', en:'Frost Ice', solid:true, hardness:.86, tier:0, drop:'ice', place:'ice', color:'#7daec6'},
  13:{id:'snow', zh:'冻雪', en:'Packed Snow', solid:true, hardness:.34, drop:'snow', place:'snow', color:'#d7e4e8'},
  14:{id:'wood', zh:'青芯木', en:'Greenheart Wood', solid:true, hardness:.62, drop:'wood', place:'wood', color:'#76543b'},
  15:{id:'leaf', zh:'藤叶', en:'Vineleaf', solid:false, hardness:.18, drop:'fiber', color:'#517849'},
  16:{id:'clay', zh:'深层黏土', en:'Deep Clay', solid:true, hardness:.55, drop:'clay', place:'clay', color:'#8c655b'},
  17:{id:'ruin_brick', zh:'遗迹砖', en:'Ruin Brick', solid:true, hardness:1.9, tier:2, drop:'ruin_brick', place:'ruin_brick', color:'#6a6075'},
  18:{id:'glow_moss', zh:'荧苔', en:'Glow Moss', solid:false, hardness:.16, drop:'moss_spore', color:'#58b99a', glow:true},
  19:{id:'plank', zh:'木板', en:'Plank', solid:true, hardness:.45, drop:'plank', place:'plank', color:'#a2784e'},
  20:{id:'workbench', zh:'工匠台', en:'Craft Table', solid:true, hardness:.68, drop:'workbench', place:'workbench', station:'workbench', color:'#9c6d45'},
  21:{id:'torch', zh:'火把', en:'Torch', solid:false, hardness:.12, drop:'torch', place:'torch', glow:true, color:'#e4ad53'},
  22:{id:'campfire', zh:'熔火堆', en:'Ember Pit', solid:false, hardness:.42, drop:'campfire', place:'campfire', station:'campfire', glow:true, color:'#cf6f42'},
  23:{id:'relic_chest', zh:'遗物箱', en:'Relic Cache', solid:true, hardness:99, tier:9, color:'#8b7047'},
  24:{id:'ruin_spike', zh:'遗迹尖刺', en:'Ruin Spikes', solid:false, hardness:.3, color:'#7d7480'},
  25:{id:'ruin_urn', zh:'遗迹陶罐', en:'Ruin Urn', solid:false, hardness:.28, color:'#8f745d'},
  26:{id:'rope', zh:'攀索', en:'Climbing Cord', solid:false, hardness:.12, drop:'rope', place:'rope', color:'#a8875a'},
  27:{id:'platform', zh:'青芯踏板', en:'Greenheart Platform', solid:false, hardness:.28, drop:'platform', place:'platform', platform:true, color:'#92704b'}
});

const blockItems = {};
for (const [key, def] of Object.entries(TILE_DEFS)) {
  if (+key === TILE.AIR || !def.drop) continue;
  blockItems[def.drop] = {id:def.drop, zh:def.zh, en:def.en, stack:99, tile:+key, kind:'material'};
}

export const ITEMS = Object.freeze({
  ...blockItems,
  fiber:{id:'fiber',zh:'藤纤维',en:'Vine Fiber',stack:99,kind:'material'},
  moss_spore:{id:'moss_spore',zh:'荧苔孢子',en:'Glow Spore',stack:99,kind:'material'},
  rope:{id:'rope',zh:'攀索',en:'Climbing Cord',stack:99,kind:'material',tile:TILE.ROPE},
  copper_bar:{id:'copper_bar',zh:'赤铜锭',en:'Red Copper Bar',stack:99,kind:'material'},
  iron_bar:{id:'iron_bar',zh:'冷铁锭',en:'Cold Iron Bar',stack:99,kind:'material'},
  ancient_core:{id:'ancient_core',zh:'古代机芯',en:'Ancient Core',stack:99,kind:'material'},
  wood_pick:{id:'wood_pick',zh:'青芯镐',en:'Greenheart Pick',stack:1,kind:'pick',tier:1,power:1.35},
  stone_pick:{id:'stone_pick',zh:'灰岩镐',en:'Greyrock Pick',stack:1,kind:'pick',tier:2,power:1.75},
  copper_pick:{id:'copper_pick',zh:'赤铜镐',en:'Red Copper Pick',stack:1,kind:'pick',tier:3,power:2.3},
  iron_pick:{id:'iron_pick',zh:'冷铁镐',en:'Cold Iron Pick',stack:1,kind:'pick',tier:4,power:3.05},
  wood_blade:{id:'wood_blade',zh:'木脊短刃',en:'Woodspine Blade',stack:1,kind:'weapon',damage:5},
  stone_blade:{id:'stone_blade',zh:'岩牙刃',en:'Stonefang Blade',stack:1,kind:'weapon',damage:7},
  copper_blade:{id:'copper_blade',zh:'赤铜弯刃',en:'Red Copper Cutter',stack:1,kind:'weapon',damage:10},
  iron_blade:{id:'iron_blade',zh:'冷铁长刃',en:'Cold Iron Longblade',stack:1,kind:'weapon',damage:14},
  crystal_blade:{id:'crystal_blade',zh:'星晶裂刃',en:'Starshard Edge',stack:1,kind:'weapon',damage:19},
  delver_pick:{id:'delver_pick',zh:'遗迹掘星镐',en:'Relic Delver Pick',stack:1,kind:'pick',tier:3,power:2.7,rare:true},
  sentinel_blade:{id:'sentinel_blade',zh:'守望残刃',en:'Sentinel Shardblade',stack:1,kind:'weapon',damage:13,rare:true}
});

export const RECIPES = Object.freeze([
  {id:'plank',out:{id:'plank',n:4},need:{wood:1}},
  {id:'rope',out:{id:'rope',n:2},need:{fiber:3}},
  {id:'platform',out:{id:'platform',n:3},need:{plank:1}},
  {id:'torch',out:{id:'torch',n:4},need:{wood:1,coal:1}},
  {id:'workbench',out:{id:'workbench',n:1},need:{plank:8}},
  {id:'campfire',out:{id:'campfire',n:1},need:{stone:6,wood:2}},
  {id:'wood_pick',out:{id:'wood_pick',n:1},need:{plank:6,rope:1}},
  {id:'wood_blade',out:{id:'wood_blade',n:1},need:{plank:5,rope:1}},
  {id:'stone_pick',out:{id:'stone_pick',n:1},need:{stone:8,wood:2},station:'workbench'},
  {id:'stone_blade',out:{id:'stone_blade',n:1},need:{stone:6,wood:2},station:'workbench'},
  {id:'copper_bar',out:{id:'copper_bar',n:1},need:{copper_ore:2,coal:1},station:'campfire'},
  {id:'iron_bar',out:{id:'iron_bar',n:1},need:{iron_ore:2,coal:1},station:'campfire'},
  {id:'copper_pick',out:{id:'copper_pick',n:1},need:{copper_bar:5,wood:2},station:'workbench'},
  {id:'copper_blade',out:{id:'copper_blade',n:1},need:{copper_bar:4,wood:1},station:'workbench'},
  {id:'iron_pick',out:{id:'iron_pick',n:1},need:{iron_bar:5,wood:2},station:'workbench'},
  {id:'iron_blade',out:{id:'iron_blade',n:1},need:{iron_bar:4,wood:1},station:'workbench'},
  {id:'crystal_blade',out:{id:'crystal_blade',n:1},need:{crystal:5,iron_bar:1},station:'workbench'},
  {id:'delver_pick',out:{id:'delver_pick',n:1},need:{ancient_core:1,copper_bar:3,wood:2},station:'workbench'},
  {id:'sentinel_blade',out:{id:'sentinel_blade',n:1},need:{ancient_core:1,iron_bar:2},station:'workbench'}
]);

export const ENEMY_TYPES = Object.freeze({
  moss_crawler:{zh:'苔壳爬兽',en:'Moss Crawler',hp:18,damage:4,speed:1.6,color:'#6d9357',biome:'verdant'},
  ash_scuttler:{zh:'灰烬疾足',en:'Ash Scuttler',hp:23,damage:5,speed:2.15,color:'#b35f4b',biome:'ember'},
  shardback:{zh:'霜晶脊兽',en:'Shardback',hp:29,damage:6,speed:1.35,color:'#79a8c5',biome:'frost'},
  hollow_wisp:{zh:'空洞微光',en:'Hollow Wisp',hp:16,damage:5,speed:1.7,color:'#66c7ae',underground:true,flying:true},
  ruin_sentinel:{zh:'遗迹守望者',en:'Ruin Sentinel',hp:42,damage:8,speed:1.15,color:'#8b729b',underground:true}
});

export const itemName = (id, lang='zh') => (ITEMS[id] && ITEMS[id][lang]) || id;
export const tileName = (id, lang='zh') => (TILE_DEFS[id] && TILE_DEFS[id][lang]) || '—';
