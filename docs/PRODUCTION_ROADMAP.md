# 地牢回响：v1.2.9 发布收尾与仓库维护路线图

> 当前仓库语义版本为 **Dungeon Echo v1.2.9**，静态资源 cache generation 为 **153**。固定中英文路线、共享存档、输入/运行时治理与最终 locale 收口已经进入当前发布边界。最近一次统一三包发布边界仍是 **Dungeon Echo v1.2.7 + 91hwl site v1.3.3 + Moyu v1.11.3**。

当前主线不再继续堆功能，而是：

**仓库目录收敛 → v1.2.9 部署/真实浏览器验收 → 仅根据真人证据做定点修复。**

## 已完成：运行时与双语架构

- ✅ `/` 固定中文、`/en/` 固定英文；同 gameplay/runtime graph、同存档命名空间。
- ✅ translation-after-render 生产栈已退出 runtime 与 release manifest。
- ✅ `core-screen-owner-v153.js` 与 `town-canvas-locale-v153.js` 只负责精确显示 sink。
- ✅ `stable-item-id-migration-v150.js` 只增补稳定 ID，不改旧名称、不拆中英文存档。
- ✅ Return Scroll 已收敛为 Commerce 两阶段语义状态机；键盘连发被抑制，手柄委托同一 owner。
- ✅ 大部分永久 polling / 无意义 RAF / DOM follower 已迁为事件或生命周期驱动。
- ✅ 当前 cache generation 为 153；语义版本 1.2.9 与 cache generation 独立。

## 已完成：目录治理方向纠偏

仓库不再把“所有活跃 JS 都留在根目录”作为长期策略。当前规则改为：

- 根目录只保留生产入口、版本/许可文件，以及当前仍由 HTML 同步直载的核心 engine / gameplay / input owner。
- 固定路线与 display ownership 进入 `game/locale/`。
- 动态 presentation follower 进入 `game/ui/`。
- 退役 i18n / locale runtime 进入 `archive/runtime/`，不得重新进入生产加载链。
- 历史 v1.2.x release stamp 进入 `archive/release-stamps/`；当前 stamp 因部署契约仍保持根级可发现。
- 文档集中在 `docs/`，历史 release notes 集中在 `docs/releases/`。
- 新增 presentation/localization 文件默认不得重新堆回根目录。
- 目录迁移必须同时更新 runtime loader、release manifest 与受影响的高价值测试；不能只移动文件制造 404。

根目录治理目标不是追求形式上的 `src/`，而是让新用户打开仓库后能在第一屏快速理解：入口在哪里、核心逻辑在哪里、现役扩展在哪里、历史代码在哪里。

## 分支治理

长期分支只保留 `main`。短期 `fix/`、`refactor/`、`perf/`、`release/`、`chore/` 分支在合并后应删除；Git 历史和 PR 已足够承担追溯职责，不把分支列表当档案馆。

当前仓库存在大量历史工作分支，需要一次性清理。后续治理要求：

1. 新工作从当前 `main` 建短期分支；
2. 合并后不继续在旧分支上开发；
3. 已完全被 `main` 包含且无独立未合并提交的分支直接删除；
4. 有独立提交的旧分支先比较差异，再决定补 PR 或明确废弃；
5. 不保留多个同义 release/layout 分支。

## 当前 P0：部署与真实浏览器验收

源码和仓库契约不能替代真实浏览器。v1.2.9 部署后需要确认：

1. Greedy Expedition 连续执行两阶段 T 回城，重复多次不冻结、不重复消耗。
2. `/` 与 `/en/` 相互切换后，`de-run-v6`、`de-greedy-meta-v1`、背包/装备/金库进度连续可见。
3. 英文代表性流程不存在明显中文泄漏：标题、职业、HUD、战斗日志、装备 tooltip、地下商店、Town、轮盘、Pause、死亡/胜利 Overlay。
4. PC 键盘、Gamepad、手机触控的 Attack / Skill / Return / Descend / Pause 行为一致。
5. 页面后台/恢复、长时间运行、城镇停留和 Boss telegraph 不出现新的持续 CPU/DOM churn。

任何 PASS 都必须对应实际执行过的源码检查、部署检查或人工浏览器验证。

## P1：真人 1→100 证据

下一轮真正影响玩法的调整，应优先来自真人长局，而不是继续凭静态阅读猜数值。重点记录：1–10、20–30、50–60、80–90、91–100；四职业主要死亡原因；药水/卷轴/回城卷轴消耗；金币与锻造支出；装备替换；Mana、J/K 和技能进化；守卫提示可读性。

只有这些证据指出具体问题时，再做定点数值、美术或交互修复。

## v1.2.9 发布边界

v1.2.9 使用 `ops/release/build-site-bundle.sh` 构建 Dungeon Echo 单包，只覆盖 `/dungeon-echo/`，保留当前 site 与 Moyu 内容。`build-web-toys-release.sh` 继续作为 v1.2.7 的历史统一三包边界。

`VERSION=1.2.9` 是语义发布身份；`runtime-bootstrap.js` 的 `assetVersion=153` 是静态缓存 generation。

发布完成必须真实观察到构建、校验、服务器切换、origin/public health check 和双端浏览器验收结果。GitHub 合并、tag 或 Release 页面本身不等于已经上线。

## 停止条件

本轮治理关闭前需要满足：

- 固定中英文架构与运行时治理已合并；
- 根目录零散历史/runtime 文件已归档，现役 presentation/locale 已按目录分组；
- release manifest 与 runtime loader 只引用现役路径；
- 高价值仓库治理/release/fixed-locale/runtime-debt 契约与当前目录一致；
- 历史工作分支完成一次性清理，只留下真正需要保留的分支；
- 从精确 v1.2.9 `main` revision 构建并完成服务器/public health checks；
- Return Scroll T×2、共享存档、中英文可见文本、PC/手机/手柄主流程完成真实浏览器验收；
- 没有新的 P0 冻结、存档损坏或明显语言泄漏。

之后进入“真人证据 → 定点修复”的维护模式，不再开启无边界的大型架构、美术或目录重写。
