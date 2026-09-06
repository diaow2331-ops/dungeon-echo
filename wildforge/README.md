# 荒境熔炉 / Wildforge

Wildforge is an original browser-native 2D trade-survival sandbox designed landscape-first for desktop and touch devices. Terraria/Minecraft-like mining, building and combat are the physical language; regional trade, logistics and dangerous overland transport are the product core. The current v0.12.0 build is an incubation build, not a public production release.

## v0.12.0 playable incubation build

Core loop: Survive → Gather local inputs → Build depots/routes → Produce packaged cargo → Store/load within capacity → Physically transport cargo → Sell into distant demand → Reinvest → Expand the network.

- deterministic 480×144 destructible world;
- three authored biome families: Verdant Reach, Ember Wastes, Frostglass Shelf;
- caves, ore clusters, trees, glow moss and underground ruins;
- 20+ materials/placeables, four pick tiers, multiple weapon tiers and 23 recipes;
- six original enemy families, including the finale boss, with contact combat and resource drops;
- 180-second day/night cycle;
- Outpost ward, dawn salvage and camp-based damage mitigation;
- Persistent world memory: visited biomes receive permanent trail lights, opened relic sites gain permanent traces, and bound outposts leave a persistent marker;
- Persistent Frontier Beacon network for long-range return points and route memory; linked neighboring beacons now form bounded supply routes with a small travel-speed bonus, slightly lower night spawn pressure, and banked dawn utility supplies;
- Monotonic frontier evolution state persisted in the local save, forming the base for future route, ecology and aftermath systems;
- Ranged combat with craftable bows/arrows;
- Starcore Forge deep-rift finale: craft the forge, ignite it in the Starshard Rift, summon and defeat the Rift Behemoth, then continue in the completed world;
- backward-compatible loading of local saves from v0.9.0 back through v0.1.0;
- local browser save with explicit and automatic saves;
- desktop mouse/keyboard and landscape touch controls;
- portrait touch devices receive a rotate-to-landscape guard instead of a compressed alternate UI.

## Originality boundary

The project may take genre-level inspiration from block sandbox and side-scrolling survival games, but it must not copy Terraria or Minecraft characters, enemies, names, recipes, UI, music, textures, biome identities or other protected assets. Current visuals are procedural and repository-native.

## Source authority

`src/game.js` owns live state mutation, runtime input, physics, combat, inventory, crafting and persistence. `src/world.js` owns deterministic world generation/serialization. `src/data.js` is immutable content data. No other game source root is imported.


## v0.12.0
- 货运负重开始影响实际移动：超过轻载阈值后逐步降速，满载时约 -14%；商路会抵消大部分重载惩罚，使道路真正具备物流效率价值；
- 夜间携货且离开商路时，荒兽遭遇节奏会随载重提高，满载时最高约增加 18% 压力；
- 实际受击可能震落一件标准货物到世界中，货物不会直接销毁，并有短暂防磁吸时间，玩家可冒险追回；
- 熔火堆守护区、已建商路与货运背架都会显著降低震落概率；精英/首领不会获得额外隐藏伤害，只降低震落修正；
- HUD 对高载重显示“重载 / HEAVY”，让玩家在出发前能判断风险；新增 v0.11.0 → v0.12.0 存档迁移。

## v0.11.0
- 贸易货物从普通建材中分离：青藤货束、烬燃货箱、霜晶货匣成为真正的标准货物，不再用 99 个原材料模拟无限货舱；
- 每个边境路标获得 24 单位持久仓库，仓储内容随世界存档保存；仓库非空时禁止拆除路标，避免货物静默丢失；
- 路标附近存在工匠台时，可消耗当地原料生产本地标准货物，产物直接入库，每个据点每天有受限生产量；
- 玩家拥有 8 单位基础货运容量；制作“货运背架”后提升到 16，采购和仓库装货都受容量限制；
- 贸易页现在同时管理生产、仓储、装货、卸货与出售，HUD 显示实时货运占用；
- 新增 v0.10.0 → v0.11.0 存档迁移，旧路标自动获得空仓库，不破坏既有世界与贸易资金。

## v0.10.0
- 产品主轴正式锁定为“2D 贸易求生”：采掘、建造与战斗服务于跨地貌贸易，而非反过来；
- 行囊新增贸易页，靠近任意边境路标即可进入当地市场；路标配方前移到早期工匠台阶段，让贸易不再是冷铁之后的附属玩法；
- 青藤原、烬风荒地、霜晶台地拥有不同低价出口品；异地市场对外来货物给出更高收购价，形成真实的“买低—运输—卖高”闭环；
- 贸易使用独立“铸印”货币，每日本地库存与市场需求都有上限，日出刷新，避免无限原地套利；
- 已联网路标对异地需求成交提供小幅加成，既有路线速度与夜间减压直接成为物流价值；
- 新增 v0.9.2 → v0.10.0 存档迁移，旧世界获得基础贸易资金但保留原有地图、路标、库存与进度。

## v0.9.2
- 路网现在以低干扰信号线直接呈现在世界中，跨地貌链路使用更醒目的青绿色信号，不遮蔽采掘与战斗主体；
- 路网按已有路标坐标派生连通分量与地貌多样性，不新增地图或第二套持久状态；
- 跨地貌连通时，每层日出补给额外携带 1 份另一地貌的基础交换物资，仍受 3 层补给上限约束；
- HUD 与路标提示增加路网地貌数和货运信息；新增 v0.9.1 → v0.9.2 存档迁移。

## v0.9.1
- 相邻边境路标现在会派生为补给路线：沿线移动速度 +8%，夜间新荒兽生成节奏降低 18%，不改动精英/首领伤害与既有战斗规则；
- 已联网路标会在日出积累 1 层小型地貌补给（最多 3 层），靠近路标使用采/战键即可校准归点并领取；
- HUD、路标世界表现与目标提示新增“联网 / 孤立 / 补给”状态，路线无需另建地图或第二套状态机；
- 新增 v0.9.0 → v0.9.1 存档迁移，旧路标以 0 补给载入并立即参与派生路网。

## v0.9.0
- 新增边境路标网络：路标可制作、放置、校准，写入世界存档并作为远方归点；
- 新增持久世界记忆：探索大地貌会留下长期灯标，开启遗迹会改变遗迹原址，绑定前哨会留下永久痕迹；
- 世界进化采用单向纪元状态并写入本地存档：首次探索、三地贯通、三地遗迹共鸣、终局击破分别推动世界进入更深阶段；
- v0.8 使用独立存档键，同时继续迁移读取 v0.7.0 及更早版本存档。
- 日夜节律与守夜高压：夜幕提高荒兽刷新压力，并提高空洞微光出现权重。
- 熔火堆现在形成附近普通荒兽的守护区，同时夜间提供更快回复。
- 日出累计守夜次数，并在已绑定前哨时回收一份与当前地貌相关的夜间物资。
- 前哨守护区削弱普通伤害并拦截空洞微光的幽光弹。
- 继续保持横屏优先、离线存档与孵化隔离，不进入 `games.json`。
