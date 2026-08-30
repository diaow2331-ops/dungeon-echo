# 摸鱼到下班 / Clock Out Alive v1.12 产品补强计划

基线：Moyu v1.11.5。目标不是把它改成第二个 Dungeon Echo，而是保留“一看就会、一次只需要跳跃”的办公室跑酷身份，同时把显示、风险决策、场景差异和重玩价值补到可长期留在 91hwl 首页的水平。

实施状态（2026-08-30）：**P0/P1 与 Daily Shift 已完成，并进入 v1.13.0 Playfield First 体验整理**——canonical `moyu/game.js`、PC/手机 viewport-first、场景专属判断、风险拾取、分层 near-miss、本地跑局记录与按日期固定 seed 的 Daily Shift 均保留；v1.13.0 进一步移除活跃跑局中的 brochure chrome、压缩 HUD、减少重复提示并提升角色可读性。P2 fast-fall 仍后置，避免在没有明确落点控制证据时继续增加输入。

## 1. 真实试玩结论

v1.11.5 的优点已经成立：办公室题材鲜明；14:00→18:00 四场景路线清楚；老板、会议、BUG、临时需求等障碍有辨识度；二段跳、近失误、Combo、稀有事件、13 项发现档案和双结局都已经可玩；死亡后还会按死因给出有针对性的操作建议。

但当前体验存在四个结构性短板：

1. **游戏画面没有优先占据视口。** 1600×900 浏览器外窗下，实际 viewport 约 1600×761，而 game frame 底部约 892px、整页约 1210px；玩家需要滚动页面才能完整看到跑酷画面和路线。390×844 手机外窗下，Canvas 约 353×182，作为动作游戏过小。
2. **一局中的决策仍偏单薄。** 核心几乎只有“何时跳 / 是否用第二段”，Coffee 是唯一常规拾取。四场景更多依赖障碍权重和背景变化，而不是四段不同的风险语言。
3. **重玩目标偏弱。** 当前主要是 Best、Combo、13 discoveries 和两个结局；缺少能让玩家今天再开一局的可读目标，但又不需要 RPG 数值养成。
4. **源码维护链过重。** 生产 runtime 由 15 个 source slice + v1111/v1112 patch + v1113/v1114/v1115 build/patch adapter 重建。它能稳定发布，但不适合作为下一阶段频繁产品迭代的开发基线。

## 2. 公开实现参考

实现前优先查公开 GitHub 仓库，只吸收设计原则，不复制许可证不兼容的运行时代码。

- Chromium T-Rex / `wayou/t-rex-runner`：证明极少输入也能靠速度、间距、障碍解锁和节奏曲线形成长期手感。我们保留“简单输入，复杂节奏”的方向。
- `misterpaul4/Demon-Runner`：同类 runner 通过不同敌人行为、逐距离解锁、风险拾取、near-miss combo、可选 fast-fall 和统一难度曲线增加技巧深度。我们优先借鉴“风险换收益”和“场景/敌人行为不同”，而不是照搬 Phaser 架构。
- `itskokeh/my-runner-game`：结构化 token pattern、power-up 和 obstacle factory 说明拾取物应该主动制造路线决策，而不是只作为随机奖励。
- `DrTsunamy/Blue-run`：near-miss、combo、power-up、里程碑和本地高分共同构成短局重玩目标。我们可借鉴本地记录/挑战层，不引入账号依赖。

## 3. 不可破坏边界

1. 保留跑酷身份：自动前进，Jump / Double Jump 仍是第一核心操作。
2. 不做装备、等级、长线属性养成；不要把 Moyu 变成 RPG。
3. 任何新机制都必须在手机上可理解；可选高级动作不得让基础玩家无法通关。
4. 一次发布只允许一个 canonical gameplay runtime。v1.12 开始必须结束“多轮 patch 才得到真实 game.js”的维护方式。
5. 本地记录优先；无账号也必须拥有完整核心体验。
6. 先提升画面可见性与跑酷决策，再做主页营销包装。

## 4. P0 — v1.12.0 开发基线正本清源

### 4.1 Canonical runtime

把当前 v1.11.5 构建出的、已通过 release contract 的 `game.js` 固化为 `moyu/game.js` 唯一生产源码。

旧 `src/game.part*.js`、runtime patch 和旧 build adapter 进入 archive，只保留恢复证据，不再参与生产构建。发布器直接复制/校验 canonical runtime，不在 release-time 改写玩法源码。

验收：
- `moyu/game.js` 是生产唯一 gameplay source；
- release bundle 的 `game.js` 与 tracked canonical bytes 一致；
- v1.11.5 行为基线在切换前后无变化；
- 旧 patch/slice 链无法意外进入发布包。

### 4.2 Viewport-first

桌面普通浏览器必须在首屏看到完整 game frame，不要求页面滚动才能玩。Route / records 可以在游戏后方，但 Canvas 本身必须按 `min(width constraint, height constraint)` fit。

手机：优先让动作画面占据可用高度；窄竖屏允许压缩非必要顶部信息，并提供明确的横屏/全屏增强提示，但不能只剩 180px 高的跑酷区域。

验收：
- 1600×900、1920×1080：game frame 完整落在 viewport；
- 390×844：Canvas 明显高于当前 182px，并保持 1200:620 比例；
- 无横向溢出；
- collision/physics 坐标不因 CSS 尺寸变化而改变。

## 5. P1 — 场景差异与风险决策

不增加复杂按钮，先让“什么时候跳”变得更有内容。

### 5.1 四场景拥有不同风险语言

- 工位区：老板巡查 + BUG 变异，强调读预警与保留第二段。
- 会议室：门/桌/摄像头组合，强调精准穿缝与节奏变化。
- 茶水间：可选高价值拾取与滑面/地面风险，强调“为了奖励是否多跳一次”。
- 健身房：更强速度与动态障碍，强调提前规划落点。

不是简单把同一个障碍池换皮；每段至少有一个只有这一段才成立的动作判断。

### 5.2 风险拾取

Coffee 不再是唯一常规决策物。新增最多 2–3 种短期 run pickup，必须通过跳跃路线选择获得；不能自动吸附、不能形成永久数值成长。

候选原则：
- 一个保命型临时效果；
- 一个得分/Combo 型高风险效果；
- Coffee 保持即时收益或短时节奏变化。

最终具体效果必须在实现前做数值/可读性验证，避免“见到就拿”的无脑最优。

### 5.3 Near-miss 成为真正得分路线

现有 near-miss 和 Combo 已经有基础，下一步让“安全跳过”和“危险擦边”形成明确得分差，而不是只有提示文字。

目标：高手可以主动走高风险得分路线，新玩家仍能用保守路线看到 18:00。

## 6. P1 — 重玩价值，不做数值 grind

新增本地 top-run history（建议 5 条）和清晰 run summary：距离、Combo、near-miss、发现、死因、到达场景。

随后再评估一个**本地 deterministic Daily Shift**：每天固定 seed + 一个办公室 modifier，例如 Meeting Marathon / Buggy Build / Coffee Shortage。Daily 不影响普通模式通关资格，也不要求账号。

Daily 的价值是“今天再开一局”和未来 X 开发日志/挑战内容，而不是每日签到奖励。

## 7. P2 — 高级操作只做可选层

参考成熟 runner，可评估 `↓ / S` fast-fall + 手机向下滑。只有在真实测试证明落点控制不足时才加入。

要求：
- 不会 fast-fall 的玩家仍可通关；
- 它只提高高手的修正能力、near-miss 与拾取路线控制；
- 不增加第三套输入 owner。

## 8. 音画与反馈

当前办公室文案和场景氛围是资产，应保留。后续重点不是堆更多 UI，而是：

- 危险预警、拾取、near-miss、Combo、场景切换使用清晰且不同的视觉/音效语言；
- 审查现有单 `beep()` 系 SFX，参考 Dungeon Echo 已验证的分层 WebAudio 做法，但不要直接复制不适合 runner 的声音；
- 音乐/SFX 独立音量继续保留；默认混音需真实试听后再定。

## 9. 发布节奏

v1.12.0：canonical source + viewport + 第一批跑酷决策补强。

后续小版本：场景/拾取/记录与 Daily Shift，必须按真实试玩证据分批落地，不在一个 PR 里堆所有设想。

每个产品 PR 都必须：

`公开实现参考 → focused branch → focused behavior/browser gate → PR → main → exact-main bundle → deploy → public browser acceptance`

不手动 dispatch 当前不可用的 hosted Actions。

## 10. 完成标准

本阶段完成时，Moyu 应达到：

- PC 与手机打开后第一眼就是“游戏”，而不是先和网页布局搏斗；
- 保守玩家理解一个核心操作即可通关；
- 熟练玩家能通过风险拾取、near-miss 和 Combo 主动追求更高成绩；
- 四个办公室时段在动作判断上有明显区别；
- 一局结束后有明确的“下一局为什么值得再玩”；
- 源码和发布链足够简单，后续模型/维护者不需要先考古五个历史 build adapter 才能改一个障碍。