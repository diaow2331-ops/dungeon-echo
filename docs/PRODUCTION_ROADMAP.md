# 地牢回响：v1.2.9 发布收尾与仓库维护路线图

> 当前仓库语义版本为 **Dungeon Echo v1.2.9**，静态资源 cache generation 为 **153**。固定中英文路线、共享存档、输入/运行时治理与最终 locale 收口已经进入当前发布边界。最近一次统一三包发布边界仍是 **Dungeon Echo v1.2.7 + 91hwl site v1.3.3 + Moyu v1.11.3**。

当前主线不再继续堆功能，而是：

**仓库目录收敛 → v1.2.9 部署/真实浏览器验收 → 仅根据真人证据做定点修复。**

## 已完成：运行时与双语架构

- ✅ `/` 固定中文、`/en/` 固定英文；同 gameplay/runtime graph、同存档命名空间。
- ✅ translation-after-render 生产栈已退出 runtime 与 release manifest。
- ✅ `game/locale/core-screen-owner-v153.js` 与 `game/locale/town-canvas-locale-v153.js` 只负责精确显示 sink。
- ✅ `game/locale/stable-item-id-migration-v150.js` 只增补稳定 ID，不改旧名称、不拆中英文存档。
- ✅ Return Scroll 已收敛为 Commerce 两阶段语义状态机；键盘连发被抑制，手柄委托同一 owner。
- ✅ 大部分永久 polling / 无意义 RAF / DOM follower 已迁为事件或生命周期驱动。
- ✅ 当前 cache generation 为 153；语义版本 1.2.9 与 cache generation 独立。

## 已完成：目录治理

仓库已经从“根目录散落大量运行时文件”收敛为 folder-first 结构。当前规则为：

- 根目录只保留入口页、版本/许可/贡献与安全文档，以及明确的项目目录；**不保留任何活跃 `.js` 文件**。
- `game/core/`：核心引擎、production bootstrap、save-integrity、runtime bootstrap 与当前 release stamp。
- `game/systems/`：装备、城镇、Commerce、锻造、成长、内容、压力、防御、风险收益等 gameplay owner。
- `game/input/`：键盘/手柄与 J/K + Mana 输入 owner。
- `game/locale/`：固定路线 locale data、稳定显示 ID、精确 screen/Canvas owner。
- `game/ui/`：视觉、商店表现、音频、手机 UX、新手引导、Help、Expedition Record 等 presentation follower。
- 退役 i18n / locale runtime 进入 `archive/runtime/`，不得重新进入生产加载链。
- 历史 v1.2.2–v1.2.8 release stamp 进入 `archive/release-stamps/`；当前 v1.2.9 stamp 与当前 runtime 一起放在 `game/core/`。
- 文档集中在 `docs/`，历史 release notes 集中在 `docs/releases/`。
- `index.html`、`en/index.html`、`dev.html` 直接引用上述新路径，不保留根级 compatibility copy。
- 目录迁移必须同步更新 `game/core/runtime-bootstrap.js`、`ops/release/static-files.txt` 与高价值测试；不能只移动文件制造 404。
- `test/repository-governance-v122.cjs` 明确把“根目录零 `.js`”作为当前治理契约，防止以后再次长回散乱结构。

根目录治理目标不是追求形式上的 `src/`，而是让新用户打开仓库后第一屏就能理解：入口在哪里、核心逻辑在哪里、玩法系统在哪里、输入在哪里、显示层在哪里、历史代码在哪里。

## 分支治理

长期分支只保留 `main`。短期 `fix/`、`refactor/`、`perf/`、`release/`、`chore/` 分支在合并后应删除；Git 历史和 PR 已足够承担追溯职责，不把分支列表当档案馆。

当前仓库仍存在大量历史工作分支，需要一次性清理。后续治理要求：

1. 新工作从当前 `main` 建短期分支；
2. 合并后不继续在旧分支上开发；
3. 已完全被 `main` 包含且无独立未合并提交的分支直接删除；
4. 有独立提交的旧分支先比较差异，再决定补 PR 或明确废弃；
5. 不保留多个同义 release/layout 分支；
6. `ops/repo/prune-merged-branches.sh` 默认 dry-run，`--apply` 只删除 tip 已被 `origin/main` 完全包含的远端分支。

分支清理与目录清理分开计账：目录治理完成不等于历史远端分支已经实际删除。

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

`VERSION=1.2.9` 是语义发布身份；`game/core/runtime-bootstrap.js` 的 `assetVersion=153` 是静态缓存 generation。

发布完成必须真实观察到构建、校验、服务器切换、origin/public health check 和双端浏览器验收结果。GitHub 合并、tag 或 Release 页面本身不等于已经上线。

## 停止条件

本轮治理关闭前需要满足：

- 固定中英文架构与运行时治理已合并；
- 根目录活跃 JavaScript 为 0，现役代码按 `core / systems / input / locale / ui` 分组；
- 历史 runtime / release stamp 已归档，且 archive 内容不进入生产加载链；
- 三个 HTML 入口、release manifest 与 runtime loader 只引用现役路径；
- 高价值 repository/release/production/fixed-locale/cache/input/runtime-debt 契约与当前目录一致；
- 历史工作分支完成一次性清理，只留下真正需要保留的分支；
- 从精确 v1.2.9 `main` revision 构建并完成服务器/public health checks；
- Return Scroll T×2、共享存档、中英文可见文本、PC/手机/手柄主流程完成真实浏览器验收；
- 没有新的 P0 冻结、存档损坏或明显语言泄漏。

之后进入“真人证据 → 定点修复”的维护模式，不再开启无边界的大型架构、美术或目录重写。
