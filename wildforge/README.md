# 荒境熔炉 / Wildforge

Wildforge is an original browser-native 2D sandbox survival game designed landscape-first for desktop and touch devices. The current v0.9.2 build is an incubation build, not a public production release.

## v0.9.2 playable incubation build

Core loop: Explore → Mine → Collect → Craft → Build → Fight → Upgrade → Explore deeper.

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
