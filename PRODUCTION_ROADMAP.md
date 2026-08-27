# 地牢回响：v1.2.7 之后的产品路线图

> 当前统一发布边界：**Dungeon Echo v1.2.7 + 91hwl site v1.3.3 + Clock Out Alive / 摸鱼到下班 v1.11.3**。
>
> 当前游戏仍是固定 **1 → 100** 正式路线；本轮没有重做战斗数值、经济、掉落、守卫、技能进化、存档 schema 或正式美术。

Dungeon Echo 已具备四职业、六装备栏、Greedy Expedition、城镇整备、10/20/…/90 守卫链、100 层三阶段终局、20/40/60/80 技能进化、J/K + Mana、中文 / English、PC/手机操作与完整正式美术。

当前主线不再是“继续堆功能”，而是：

**明确机制 owner → 真人 1→100 证据 → 定点修复 → 发布/展示事实持续一致**

## 已完成：机制所有权第一阶段

历史版本最大的代码风险不是缺功能，而是同一机制可能由多个 follower、事件监听、轮询或 monkey-patch 同时维护。v1.2.7 前后的治理已经完成以下收拢：

- ✅ `equipment-system.js`：地牢内换装耗回合的唯一生产 owner。
- ✅ `risk-reward-system.js`：神龛赌注与木桶负面事件的明确 owner。
- ✅ `progression-guard-system.js`：永久等级/HP/ATK 上限与动作期 XP 暂存的明确 owner。
- ✅ `npc-stability-system.js`：一次性 shrine/rest 清理与 utility NPC 防堵路的明确 owner。
- ✅ `production-bootstrap.js`：退出实际玩法职责，只保留正式入口策略与旧装备图集兼容桥。
- ✅ 永久成长守卫由 150ms 常驻轮询改为初始同步 + 玩家动作后的微任务同步。
- ✅ 生产入口、发布白名单、部署门禁和回归契约均认识上述 owner。

治理原则继续保持：

1. 每个玩家可见机制只有一个生产 owner；
2. fallback 只能服务隔离开发/测试，权威 owner 存在时不得并行执行；
3. 不用新的第三层补丁掩盖旧重复所有权；
4. 先修结构性歧义，再根据真人证据调数值；
5. 每次只改可以独立说明、验证和回滚的边界。

## 当前 P0：完成统一发布与真实部署验证

代码仓库的统一版本事实已经收口到：

- Dungeon Echo **v1.2.7**；
- 91hwl site **v1.3.3**；
- Clock Out Alive **v1.11.3**。

`build-web-toys-release.sh` 必须从同一个精确 `v1.2.7` tag revision 构建三份 bundle。仓库合并、tag 或 GitHub Release 页面本身不等于已上线。

发布完成必须观察到：

- Dungeon Echo bundle 构建成功；
- Moyu bundle 构建成功；
- site/home-mount bundle 构建成功；
- 服务器部署脚本完成且未回滚；
- origin health check PASS；
- public health check PASS；
- PC 和手机真人确认主要页面、语言、主题、游戏入口和控制正常。

GitHub Actions 当前额度不可用时，不把 Actions 作为发布前置条件，也不得伪造 CI PASS。

## 当前 P1：真人 1→100 证据

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

现有 Issue #3/#4/#5/#7/#10/#11 继续作为这些证据的归档入口，不为“看起来更忙”重新造一套重复 Issue。

## 当前 P2：剩余代码债

### 1. `game.js` HTML escaping

核心 `game.js` 的旧 `esc()` helper 对 `& < > "` 的转义仍不完整，而它被多个 `innerHTML` 路径使用。这是明确的 correctness / hardening 债。

修复原则：必须通过安全的核心文件编辑路径完成，并补一个针对文本与 attribute context 的聚焦回归；在无法可靠 checkout/定点 patch 时，不为了五个字符冒险整文件覆写。

### 2. `equipment-system.js` 状态轮询

装备系统仍保留周期同步。后续应审查哪些状态已经可以由装备动作、载入和显式事件驱动，逐步减少“靠轮询维持正确”的部分。

### 3. `gameplay-tuning.js` 继续瘦身

它仍同时覆盖职业 baseline、守卫完整性以及若干兼容逻辑。下一步只在找到明确重复 owner 时继续拆，不做一次大型重写。

### 4. `game.js` 旧核心假设

逐步删除与正式 1→100 契约不一致的旧入口假设和重复逻辑；每次保持小 diff、可回滚。

## 美术与内容策略

v1.2.7 不重新开启“为了版本号而全面重做美术”。现有主角、怪物、守卫、终局、装备和城镇已经构成正式基线。

只有真人 1→100 证据显示某个画面影响：

- 机制辨识；
- 战斗 telegraph；
- 装备判断；
- UI 层级；
- PC 网页沉浸感；

才进行定点美术/视觉修复。

## 站点与 Moyu

site v1.3.3 与 Moyu v1.11.3 已完成首屏 locale/theme prepaint、浏览器自动翻译抑制、字体/控件尺度收口及相应构建/部署契约。

后续网站工作同样遵循“证据驱动”：先完成真实部署和双端验收，再根据实际问题迭代，不把已经完成的 v1.3.3/v1.11.3 工作重新写成未来任务。

## 停止条件

满足以下条件后，v1.2.7 这一治理周期结束：

- 统一 release PR 合并；
- `v1.2.7` tag / GitHub Release 与合并 revision 一致；
- 三份 bundle 从该 revision 构建；
- 服务器部署和 origin/public health checks 有真实 PASS；
- PC/手机主要流程人工验收完成；
- Issue #33 记录最终证据后关闭。

之后再进入下一轮真人长局与定点玩法优化。
