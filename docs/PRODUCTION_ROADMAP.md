# 地牢回响：v1.2.8 之后的产品路线图

> 当前语义版本仍为 **Dungeon Echo v1.2.8**。固定中英文路线、共享存档、输入/运行时治理与最终 locale 收口已经进入 `main`；缓存 generation 已推进到 153。最近一次统一三包发布边界仍是 **Dungeon Echo v1.2.7 + 91hwl site v1.3.3 + Moyu v1.11.3**。

Dungeon Echo 已具备四职业、六装备栏、Greedy Expedition、城镇整备、10/20/…/90 守卫链、100 层三阶段终局、20/40/60/80 技能进化、J/K + Mana、固定中文/English 路线、PC/手机/手柄操作与正式美术基线。

当前主线不再是继续堆功能，而是：

**真实浏览器验收 → 发布/部署 → 仓库治理 → 仅根据真人证据做定点修复。**

## 已完成：运行时与双语架构收口

当前生产架构已经完成以下关键治理：

- ✅ `/` 固定中文、`/en/` 固定英文；两者同源、同 gameplay/runtime graph、同存档命名空间。
- ✅ `locale-event-owner-v130.js`、`locale-runtime-v122.js`、`locale-completeness-v128.js` 已退出生产加载链和 release manifest。
- ✅ 动态英文改为业务 owner / 精确 screen owner 源头输出，不再做 whole-document DOM 翻译。
- ✅ `town-canvas-locale-v153.js` 只处理城镇与转盘两个 Canvas 文本 sink，不修改全局 Canvas prototype。
- ✅ `stable-item-id-migration-v150.js` 为旧装备非破坏性补充 `baseId / rarityId / slotId`，不改旧名称、不拆中英文存档。
- ✅ Return Scroll 已收敛到 Commerce 两阶段语义状态机；手柄不再合成键盘 T。
- ✅ 城镇、装备、成长、战斗压力、Guardian、视觉层、新手引导等大部分常驻 polling / 无意义 RAF / DOM follower 已移除或改为生命周期驱动。
- ✅ 游戏手柄采样只在真实连接且页面可见时运行。
- ✅ 当前生产静态资源 cache generation 为 153。

这些结构性修改的目标是减少冻结、后台无效工作、输入 owner 冲突和中英文混杂，而不是改变战斗数值或经济平衡。

## 当前 P0：真实浏览器验收与发布

源码和仓库契约不能替代真实浏览器。当前需要人工确认的高价值场景为：

1. Greedy Expedition 持有 Return Scroll 时连续执行两阶段 T 回城，重复多次不冻结、不重复消耗。
2. `/` 与 `/en/` 相互切换后，`de-run-v6`、`de-greedy-meta-v1`、背包/装备/金库进度连续可见。
3. 英文代表性流程不存在明显中文泄漏：标题、职业、HUD、战斗日志、装备 tooltip、地下商店、Town、轮盘、Pause、死亡/胜利 Overlay。
4. PC 键盘、Gamepad、手机触控的 Attack / Skill / Return / Descend / Pause 行为一致。
5. 页面后台/恢复、长时间运行、城镇停留和 Boss telegraph 不出现新的持续 CPU/DOM churn。

本月 GitHub Actions 额度已用完，因此当前治理周期不把 Actions 作为前置条件，也不再重复查询 Actions 状态。任何 PASS 都必须对应实际执行过的源码检查、部署检查或人工浏览器验证。

## 当前 P1：仓库可读性与治理

游戏代码已经基本收尾，仓库开始从“高速迭代工作台”收敛为“游客容易理解的公开项目”。当前治理原则：

- `README.md`、`LICENSE`、`SECURITY.md`、`CONTRIBUTING.md`、`VERSION` 保持根目录可见。
- 活跃生产入口和运行时 JavaScript 暂时保持根目录，避免在收尾阶段做高风险的纯路径大迁移。
- 工程/维护/平衡/AI 协作文档统一进入 `docs/`。
- 历史 release notes 统一进入 `docs/releases/`。
- 被替代的松散文档进入 `docs/archive/`。
- README 首页提供明确的 source map，让游客直接找到 `game.js`、主要 system owner、中英文入口和开发文档。
- 后续只有在路径迁移能带来明确维护收益时，才考虑把活跃 JS 进一步移动到 `src/`；不为了“目录看起来漂亮”承担生产 URL、release manifest 和大量测试引用同时变更的风险。

## 当前 P2：真人 1→100 证据

下一轮真正影响玩法的调整，应优先来自真人长局，而不是继续凭静态阅读猜数值。

代表性记录至少覆盖：

- 1–10、20–30、50–60、80–90、91–100；
- 四职业主要死亡原因和承伤；
- 药水、卷轴、回城卷轴消耗；
- 回城时机与背包风险；
- 金币收入、商店支出和锻造支出；
- 装备替换与 Epic/Legendary 机制选择；
- Mana、J/K 与技能进化的真实使用节奏；
- 守卫提示是否清晰、是否被地图几何放大或削弱。

只有这些证据指出具体问题时，再做定点数值、美术或交互修复。

## 发布边界

v1.2.8 仍使用 `ops/release/build-site-bundle.sh` 构建 Dungeon Echo 单包，并只覆盖 `/dungeon-echo/`，保留当前 site 与 Moyu 内容。`build-web-toys-release.sh` 继续作为 v1.2.7 的历史统一三包边界，不为当前游戏治理改标。

发布完成需要真实观察到构建、校验、服务器切换、origin/public health check 和双端浏览器验收结果。GitHub 合并、tag 或 Release 页面本身不等于已经上线。

## 停止条件

满足以下条件后，本轮 Dungeon Echo 治理可以关闭：

- 固定中英文架构与运行时治理已合并；
- 仓库根目录完成文档/历史文件收敛并保持生产路径稳定；
- Return Scroll T×2、共享存档、中英文可见文本、PC/手机/手柄主流程完成真实浏览器验收；
- 从精确 `main` revision 构建并完成服务器/public health checks；
- 没有新的 P0 冻结、存档损坏或明显语言泄漏。

之后进入“真人证据 → 定点修复”的维护模式，不再开启无边界的大型架构或美术重做。
