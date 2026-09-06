# 荒境熔炉 / Wildforge

Wildforge is an original browser-native 2D trade-survival sandbox designed landscape-first for desktop and touch devices. Terraria/Minecraft-like mining, building and combat are the physical language; regional trade, logistics and dangerous overland transport are the product core. The current v0.16.0 build is an incubation build, not a public production release.

## v0.16.0 playable incubation build

Core loop: Survive → Gather local inputs → Build depots/routes → Produce packaged cargo → Store/load within capacity → Physically transport cargo → Sell into distant demand → Reinvest → Expand the network.

- deterministic 1920×144 destructible world, with v0.15-era 480×144 saves expanded in place rather than discarded;
- three authored biome families: Verdant Reach, Ember Wastes, Frostglass Shelf, repeated as 160-tile frontier bands so long-distance travel does not exhaust the map in under a minute;
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
- backward-compatible loading of local saves from v0.15.0 back through v0.1.0;
- local browser save with explicit and automatic saves;
- desktop mouse/keyboard and landscape touch controls;
- portrait touch devices receive a rotate-to-landscape guard instead of a compressed alternate UI.

## Single-file playtest export

Authoritative development stays modular (`index.html` + `style.css` + `src/*.js`). For review/share builds, generate a self-contained HTML without changing source authority:

```bash
node ops/release/build-wildforge-single-html.mjs /tmp/Wildforge-single.html
```

The exporter remains a release utility, but v0.16 development is intentionally modular while surface systems are being rebuilt. `wildforge/playtest.html` may therefore lag the modular source during this incubation pass and is never the source authority.

## Originality boundary

The project may take genre-level inspiration from block sandbox and side-scrolling survival games, but it must not copy Terraria or Minecraft characters, enemies, names, recipes, UI, music, textures, biome identities or other protected assets. Current visuals are original repository-native pixel art plus procedural fallback rendering; no third-party game assets are used.

## Source authority

`src/game.js` owns live state mutation, runtime input, physics, crafting and persistence. `src/world.js` owns deterministic world generation/serialization. `src/data.js` is immutable content data. v0.16 splits bounded presentation/tuning authority into `src/inventory-ui.js`, `src/combat-tuning.js`, and `src/surface-content.js`; `inventory-ui.css` owns the inventory/hotbar skin. These modules do not own a second game state. No other game source root is imported.



## v0.16.0
- 物品栏从“信息卡片列表”改为槽位优先的游戏内 UI：10 格快捷栏（1–9 / 0）、40 格主物品区、堆叠数角标、当前手持摘要、悬停属性提示、桌面拖放换栏与右键清空槽位；常用建材/货物优先复用现有原创像素图集，不再只靠文字卡片。
- 战斗加入真正的敌人受击位移：近战与箭矢按攻击方向施加冲量，普通敌人、飞行敌人、精英与首领拥有不同击退抗性；短暂击退窗口阻止 AI 加速度立刻吞掉受击反馈。
- 地表遭遇压力整体下调：白昼普通地表上限 5、夜间上限 7、地下上限 9；白昼生成间隔提高到约 6–10 秒，初始夜袭也显著放缓；无货运的新玩家在出生点附近还有额外白昼缓冲。
- 横向世界从 480 扩展到 1920 格。地貌以 160 格为一个带状单元循环，保留原前三地貌节奏，同时让长途运输真正拥有距离；旧 480 格存档会保留原地图并向右生成新边境。
- 新增独立 `surface-content.js`：按地貌在地表分布林地、小型残骸、荒地石柱/拱门、霜晶拱门/石冢等可直接经过、采集和利用的地标，先提升“水平面本身值得走”的密度，再继续扩地下。
- 本轮按模块开发，不更新生成式 `playtest.html` 单文件快照；等地表/物品栏/战斗模块稳定后再统一打包。

## v0.15.0
- 操控核心改为 120 Hz 固定物理步进，降低不同刷新率与掉帧情况下的加速、跳跃和碰撞手感漂移；
- 重调地面加速、刹车、反向转身与空中控制，保留载重/商路修正但让基础移动响应更接近原生横版沙盒；
- 重做可变跳跃：继续保留跳跃缓冲与土狼时间，轻点形成短跳、按住获得完整跳高，松键不再用瞬间速度乘法硬截断；
- 左键改为“当前物品主动作”：武器攻击、镐采掘、方块对空位放置；右键保留强制放置；弓现在可直接向空处射击；
- 近战增加小范围朝向容错，不再要求鼠标精确锁中敌人格；相机提高跟随响应并按像素对齐；
- 增加失焦/切后台输入清理与高分辨率滚轮门限，修复粘键和滚轮一次跳多格；新增 v0.14.0 → v0.15.0 存档迁移。

## v0.14.0
- 接入第一版原创像素运行时图集：青藤原基础地块、主角动作、苔壳爬兽、灰披劫徒、护卫、边境路标、遗物箱、工匠台与落地货包开始替换程序色块占位；
- 图集使用紧凑 WebP runtime atlas，Canvas 关闭插值以保持像素轮廓；素材缺失或尚未覆盖的对象继续回退到原程序绘制，不影响既有玩法；
- 单 HTML 导出器会把 runtime atlas 自动转成 data URI 内嵌，继续保持真正的单文件试玩；
- 新增 v0.13.1 → v0.14.0 存档迁移，贸易/仓储/货运/护卫状态不重置。

## v0.13.1
- 修复单 HTML 试玩版打包器对 `$$` 的错误替换，避免生成文件在脚本初始化阶段因重复 `$` 声明而无法创建世界；
- 单文件导出现在保留模块作用域，并加入可编译性与 `$` 保真回归门禁。

## v0.13.0
- 标准货物进入“占手”状态：随身携货时主角无法正常攻击，必须按 `R` / 手机“货包”键将整批货物放到地上后再战斗；
- 地面货包拥有耐久，可被敌方投射物、灰披劫徒近战和玩家自己的远程攻击误伤；耐久归零时随机报废 1 件货物，其余货物继续保留；
- 新增灰披劫徒：低货值夜运时出现概率极低，货值上升后伏击概率提高；商路、营火与护卫都会压低风险；
- 边境货站可使用铸印雇佣临时护卫。护卫会跟随玩家、主动攻击附近普通敌人，也能吸收部分正面压力；契约持续约 1.5 个昼夜或直至阵亡；
- 劫徒被击退后提供少量缉赏铸印，形成“护货—反击—继续运输”的正反馈，但不足以替代贸易利润；
- 货包与护卫契约写入本地存档；新增 v0.12.0 → v0.13.0 迁移。

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
