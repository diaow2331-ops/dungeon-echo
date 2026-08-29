# Dungeon Echo v1.3.2 上线后优化计划

> 基线：Dungeon Echo v1.3.2，cache generation 171，public revision `8618c213e633ed9ac79bb661062de5eb4a6da4ca`。
> 本文从 v1.3.2 开始取代旧的 v1.2.10 后维护路线，作为下一阶段产品优化的优先级依据。

## 1. 下一阶段目标

下一阶段不再做“大规模历史功能恢复”，而是把已经具备的 100 层框架打磨成更容易上手、更容易判断、更愿意重复玩的游戏。

核心目标只有四项：

1. 首次进入 5 分钟内能理解移动、攻击、技能、装备、下潜与回城风险。
2. 每次装备、锻造、精炼和城镇消费都能看懂“为什么值得/不值得”。
3. Boss、伤害与防御结果可读，死亡更多来自决策而不是信息不清。
4. 深层与无尽模式有明确成长边界，不依赖无限数值膨胀维持内容。

## 2. v1.3.2 已完成，不再重复建设

- Hero idle / attack / hurt / skill 四状态已进入 canonical Canvas renderer。
- 21 个 classic-100 主题已进入 core tile texture path；视觉 RNG 已与 gameplay RNG 隔离。
- 护甲与 fixed damage reduction 已拆分，远程与 armor-break 不再错误削减固定减伤。
- +3 deterministic refinement 与 +5 masterwork 已恢复到 core。
- 城镇装备列表已提供 class-aware fit 比较。
- 六场景自适应 BGM、装备 v13 图标、独立城镇 NPC atlas、guardian pressure、100 层流程均已通过当前门禁。
- current suite 24/24；1→100 + Endless 端到端 23/23。

## 3. 当前发现的真实缺口

### A. 文档与生产事实已经发生漂移

Issue #4 / #7 仍把当前控制描述为 J/K + Mana，但 v1.3.2 实际生产控制为 **C = Class Skill，J = Quick Dive**，当前 core 没有生产 Mana 状态。

这不是文案小问题：如果继续按旧 Issue 做优化，会把下一阶段带回已经退出生产的 v1.2 控制模型。因此任何新机制工作前必须先统一事实基线。

### B. 地牢内装备“适配评分”仍不是真正 class fit

城镇列表已经使用 `DE_INVENTORY_RULES_V130.classFitScore()`；但地牢 `tooltipHtml()` 仍把通用 `item.score` 标成“适配评分 / Build Fit”。

结果是同一件装备在地牢与城镇会出现两套“适配”语义。它会直接误导拾取、装备和丢弃决策，是下一轮最明确的 P0 产品缺陷。

### C. 首局教学仍主要依赖玩家主动打开 Help

当前有完整 Help、HUD hint 和背包详情，但没有渐进式首次远征引导。来自 X 的冷启动玩家很可能在理解“碰撞攻击 / C 技能 / Enter 下潜 / 贪婪远征 T 回城”之前离开。

### D. 音频只有 M 静音，没有生产音量设置 UI

自适应 BGM 已恢复，但玩家无法独立调节 Music / SFX。PC 浏览器长局中，这是高频体验项；应作为纯设置能力恢复，而不是重新引入旧 audio-director。

### E. 深层成长没有正式等级上限语义

progression rules 中存在 dormant `DEFAULT_LEVEL_CAP = 50`，但 core 的升级循环仍可继续增加 `player.lvl`。在 1→100 主线和 Endless 中，这会影响长期数值边界、HUD、旧存档迁移和技能/属性成长设计。

### F. Guardian / Floor-100 美术仍需要视觉证据，而不是版本号判断

历史 v3 boss/guardian 资产仍在 quarantine/source 体系里；当前生产使用 v11 baseline。只有并排视觉 QA 证明 v3 或重制版本明显更好，才允许替换；不因“v3”编号更高自动晋升。

## 4. 优先级总表

| 优先级 | 工作包 | 玩家收益 | 风险 | 计划版本 |
| --- | --- | --- | --- | --- |
| P0 | 事实基线与装备决策一致性 | 极高 | 低 | v1.3.3 |
| P0 | 首次远征渐进引导 | 极高 | 低-中 | v1.3.3 |
| P1 | Music / SFX 独立音量 | 高 | 低-中 | v1.3.3 |
| P1 | Guardian / Floor-100 可读性与视觉 QA | 高 | 中 | v1.3.4 |
| P1 | 装备构筑、精炼路线与掉落决策验证 | 高 | 中 | v1.3.4 |
| P2 | 城镇经济、检查点与轮盘长期价值 | 中-高 | 中 | v1.3.4 |
| P2 | Endless / 等级上限与后期成长设计 | 高 | 高 | v1.4.0 |
| P3 | J/K + Mana、方向直攻等战斗模型重构 | 潜在高 | 很高 | v1.4+，仅证据触发 |

## 5. v1.3.3 — 首局与决策清晰度

### 5.1 装备评分统一

- 地牢 tooltip、背包详情、城镇列表统一调用同一 `classFitScore()`。
- `item.score` 只表示通用 stat score；不再使用“适配评分”名称混淆两者。
- 保留 intrinsic item value 作为经济价值，禁止用 class fit 决定售价。
- 比较当前已装备同 slot 时显示 class-fit delta，必要时同时保留 value delta。

验收：同一装备在地牢、背包、城镇显示的 class fit 数值一致；出售价格不随职业变化。

### 5.2 首次远征渐进引导

不做强制教程关，也不增加第二套状态机。只在 canonical core 已知事件发生时显示一次性、可忽略的短提示：

1. 第一次移动前：方向键 / WASD / 点击已探索地块。
2. 第一次接近敌人：碰撞敌人即普通攻击；C 是职业技能。
3. 第一次拾到装备：选择背包物品可比较并装备，不自动替换。
4. 第一次站上楼梯：Enter 下潜；J 只用于符合条件的 Quick Dive。
5. Greedy Expedition 第一次获得 Return Scroll：T 回城保住战利品。

约束：不阻断回合、不捕获额外 gameplay input、不使用轮询、不引入第二 gameplay storage writer。

验收：新存档 1→3 层能自然出现关键提示；老存档和重复游玩不会持续弹相同提示；关闭/忽略提示不会改变游戏结果。

### 5.3 音频设置

- 恢复独立 Music / SFX 音量控制，默认目标保持 Music 30%、SFX 85%。
- Adaptive BGM 继续只拥有自己的 WebAudio music graph；core SFX 不被 monkey patch。
- 设置状态使用独立 presentation preference namespace，不进入 run/meta save。
- M 保留为总静音快捷键，音量滑杆与 M 状态必须可预测地协同。

验收：刷新页面后音量偏好可恢复；Mute 不改变玩法存档；无 AudioNode prototype 拦截。

## 6. v1.3.4 — 战斗可读性与构筑验证

### 6.1 Guardian / Floor-100 视觉 QA

- 对 v11 与历史 v3/候选素材做同尺寸并排截图比较。
- 评价轮廓辨识、背景对比、职业/主题一致性、攻击预警可读性，而不是只看像素数量。
- 只有明显优于 v11 的资产才直接替换；否则设计新的 canonical asset，不晋升旧 v3。
- 攻击预警继续由 core encounter state 驱动；不允许 UI follower 根据画面猜 Boss 状态。
- 机制数值只有 Issue #5 的真人证据证明存在不可读/不可避问题时才调整。

验收：代表性 10/50/90/100 层在正常缩放下能迅速区分 Boss、本体、危险区域与安全移动空间。

### 6.2 构筑与精炼路线验证

围绕 Issue #3 做真人代表性构筑，不先增加更多词缀数量：

- 每职业至少检查两条中后期装备方向。
- +3 两个 refinement path 应改变选择，而不是一个永远更优。
- +5 masterwork 应强化已选择方向，不制造突然失控的属性跳跃。
- mechanic traits 与 refinement 的组合不能形成永久无敌、无限吸血或自动清房。
- 地牢拾取、背包比较、城镇锻造三个界面必须讲同一种装备价值语言。

只有发现具体 dominant combination 时做定点 nerf/buff，不进行全装备表重算。

### 6.3 城镇经济与 Fortune Wheel

以 Issue #10 / #11 为证据轨：

- 验证 buy→sell、forge→sell、checkpoint farming、wheel reset 不存在稳定套利。
- 检查 1–20、40–60、80–100 三段补给可负担性。
- Wheel 必须始终是可忽略的娱乐/金币 sink，不得成为最佳装备生产线。
- Quick Dive 成本与检查点价值一起看，避免两个“跳过地牢”工具互相叠加成主策略。

## 7. v1.4.0 — 后期成长边界，只在设计完成后实施

### 7.1 等级上限 / Endless

在写代码前先回答：50 级以后玩家靠什么成长？

候选方向：主线 1→100 使用有限等级成长；Endless 把继续成长转移到装备、精炼、回响或有限重复奖励，而不是无限 `lvl++`。

必须同时设计：旧存档 >50 级迁移、XP HUD 的 MAX 状态、属性 clamp、Endless 难度缩放与技能 milestone 行为。禁止只把 `xpThreshold` 改成 Infinity 之类的半修复。

### 7.2 J/K + Mana / 方向直攻

这是潜在的 v1.4+ 战斗模型变化，不是 v1.3.3 修复项。

当前生产是：移动/碰撞攻击 + C Class Skill + J Quick Dive。历史 J Attack / K Skill + Mana 只能作为设计参考，旧 `combat-controls.js` 永久保持 quarantine。

只有真人证据证明“碰撞攻击 + C 技能”的战斗决策深度不足，才进入设计阶段。若进入，必须一次性明确：

- 普通攻击是否继续允许 bump；
- Ranger/Mage 的方向攻击如何瞄准；
- Mana 最大值、消耗、回复来源；
- J Quick Dive 改到哪里；
- Gamepad / mobile 对应关系；
- save schema 与旧存档缺省 Mana 的迁移。

不得把旧 wrapper 重新接回 production，也不得同时存在 C/J 与 J/K 两套 gameplay owner。

## 8. 发布后证据与反馈

X 已开始对外引流。优化判断优先使用以下证据：

1. 可复现玩家反馈与截图/种子。
2. 人工代表性 1→100 长局记录。
3. 服务器现有匿名访问日志中的页面/入口趋势，只用于判断是否有人进入游戏，不新增隐私追踪。
4. 当前 deterministic harness 用于防回归，不用 bot 胜率代替真人操作感。

遇到 P0：冻结、存档损坏、无法操作、稳定套利、Boss 无法规避、严重语言泄漏，直接插队修复。

## 9. 每个优化 PR 的硬性约束

- `game/core/game.js` 继续是 sole gameplay / Canvas / keyboard-touch / persistence authority。
- 不恢复 overlay Canvas、monkey patch、第二 input owner、第二 gameplay storage writer。
- Presentation follower 可以读公开状态并装饰 DOM，但不能提交 gameplay outcome。
- 任何视觉随机必须独立于 gameplay RNG。
- 发布只从 exact main 构建 immutable ZIP，执行 healthcheck 与 rollback；生产服务器不做现场 patch。
- 日常验证只跑聚焦测试；版本发布前跑 current suite + 100 层关键 E2E。Hosted Actions 不作为日常门禁。

### 9.1 公开实现优先规则

遇到非本项目独有的问题，不先闭门设计。优先搜索 2–3 个成熟公开 GitHub 仓库，记录“采用的设计原则”和“明确不复制的旧拓扑/实现”。只有找不到合适先例，或先例与当前 single-authority 架构冲突时，才自行设计。

本轮已采用的公开参考：

- `00-Evan/shattered-pixel-dungeon/.../windows/WndInfoItem.java`：物品信息先解释对象本身，再让玩家做装备/使用决策；据此保持 Class Fit 与 Item Value 分离。
- `00-Evan/shattered-pixel-dungeon/.../levels/rooms/standard/entrance/EntranceRoom.java` 与 `items/journal/Guidebook.java`：教程绑定早期真实事件，并用“已看过”状态避免重复；据此采用 event-driven、once-only 首局引导。
- `00-Evan/shattered-pixel-dungeon/.../SPDSettings.java`：Music 与 SFX 分开持久化；据此作为 v1.3.3 独立音量设置的参考边界。

引用只用于设计对照，不复制 GPL runtime 代码到本项目。

## 10. 实施顺序与停止条件

固定顺序：

`事实基线 → 装备决策一致性 → 首局引导 → 音频设置 → Guardian视觉/可读性 → 构筑/经济真人验证 → Endless成长边界 → 仅在证据触发时评估新战斗模型`

每一阶段必须满足上一阶段退出条件后再进入下一阶段。不要并行开启多个会改变 core gameplay 的大分支。

### v1.3.3 退出条件

- 地牢/背包/城镇 class fit 语义一致。
- 新玩家关键操作可以在首次远征中自然学会，不依赖主动打开 Help。
- Music/SFX 可分别调节且不污染 gameplay save。
- current control truth 在 docs / Issues / UI 中一致：C Skill / J Quick Dive。

### v1.3.4 退出条件

- Guardian / Floor-100 视觉方案通过并排 QA。
- Issue #3 / #5 / #10 / #11 至少获得代表性真人证据，任何数值改动均能指向具体证据。
- 不存在已知稳定经济套利或常见无敌构筑。

### v1.4.0 进入条件

只有等级/Endless 的长期证据足够明确时才进入。Mana / 方向直攻不与等级上限同时大改；二者必须拆成独立设计与发布周期。

## 11. 立即执行的第一工作包

本计划落库后，第一轮代码只做 **P0 Decision Clarity**：

1. 修正 dungeon/backpack 的 class-fit 计算与标签，使其与 town 一致。
2. 更新 Issue #4 / #7 等陈旧的 J/K + Mana 描述到 v1.3.2 真实控制基线。
3. 为首次远征渐进提示写 focused contract；先完成事件与文案设计，再接入 core。
4. 不在这一 PR 顺手做 Boss、美术、数值、Mana 或 level cap。

这保证下一轮是小而确定的体验提升，而不是再次扩大范围。
