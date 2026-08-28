# 地牢回响：v1.2.10 发布与上线后维护路线图

> 当前发布集合：**Dungeon Echo v1.2.10 + Clock Out Alive v1.11.5 + 91hwl site v1.3.4**。Dungeon Echo 静态资源 cache generation 为 **154**，runtime owner 仍为 **v13**。

当前阶段已经从“继续重构”切换为：

**正式发布 → PC/手机真人验收 → X 宣发 → 玩家证据驱动的小补丁。**

## 已完成：仓库与运行时治理

- ✅ 根目录不再散落活跃 JavaScript；现役代码按 `game/core / systems / input / locale / ui` 分组。
- ✅ 历史 i18n / locale runtime 与旧 release stamp 已归档，不进入 production runtime 或 release manifest。
- ✅ `/dungeon-echo/` 固定中文、`/dungeon-echo/en/` 固定英文；同 gameplay/runtime graph、同存档命名空间。
- ✅ translation-after-render 生产栈退出 runtime。
- ✅ Return Scroll 收敛为 Commerce `arming → ready → completing` 状态机；键盘/触控/手柄委托同一语义 owner。
- ✅ 桌面一次性动作禁止 OS key repeat；WASD / 方向键仍保留移动连发。
- ✅ v1.2.10 新增 901–1180px PC/笔记本布局收口与手机 44px 最小次要触控目标。
- ✅ semantic version 与 cache generation 分离：`VERSION=1.2.10`，public generation `154`。

## 当前发布集合

### Dungeon Echo v1.2.10

- 1 → 100 正式路线、四职业、六装备位、Mana、技能进化、城镇和终局保持不变。
- 不重置 `de-run-v6`、`de-greedy-meta-v1` 等兼容存档。
- 固定中英文路线共享同一存档。
- 本次只收口输入完整性与 PC/手机响应式，不做平衡或美术大改。

### Clock Out Alive v1.11.5

- 修正首屏语言与运行时语言选择的一致性。
- 防止 Space / ↑ / P / Esc / R / F / M / S 等一次性键位被 OS repeat 重复触发。
- Canvas 尺寸改为按需测量，presentation DOM 写入做 memoization。
- 长型 BUG 预留真实碰撞宽度，避免后期组合障碍偷吃安全净空。
- 手机增加 safe-area 与窄屏顶部操作收口。

### 91hwl site v1.3.4

- 首页与两个项目详情页同步当前游戏版本。
- 首页首屏同时提供 Dungeon、Moyu 与 GitHub / Source 三个转化入口。
- 保留 v1.3.3 的首屏语言/主题预解析、统一字号阶梯和 `notranslate` 契约。
- 项目页明确展示本次 PC/手机质量修复，便于外部宣传流量快速理解项目。

## 正式部署

生产服务器从最终 `main` revision 执行：

```bash
sudo bash ops/release/deploy-dual-public.sh
```

编排器按以下顺序执行：

1. 构建 Dungeon Echo v1.2.10 immutable bundle；
2. 构建 Moyu v1.11.5 immutable bundle；
3. 构建 site v1.3.4 immutable bundle；
4. 部署 Dungeon；
5. 部署 Moyu；
6. 最后部署主站，因为主站 healthcheck 要求两款游戏的 VERSION endpoint 已经更新；
7. 再检查 public VERSION 与首页 v1.3.4 / GitHub CTA。

最终成功标记：

```text
dual_public_release=PASS
```

各组件仍保留自己的 healthcheck 与 rollback；GitHub merge 本身不等于线上已经发布。

## 上线验收：PC 与手机

### Dungeon Echo

- 大屏桌面与 901–1180px 普通笔记本窗口都能清晰看到地牢主体，不被侧栏过度挤压。
- J / K / T / Enter / Esc 按住不重复执行一次性动作；WASD/方向键仍可持续移动。
- 手机竖屏 Attack / Skill / Potion / Return / Descend 可稳定触达，横屏布局不遮挡核心画面。
- 中英文切换共享同一 run/meta/equipment 进度。
- Greedy Expedition 连续执行 T×2 回城，多次重复不冻结、不重复消耗。
- 英文标题、HUD、战斗日志、装备 tooltip、商店、Town、轮盘、Pause、死亡/胜利没有明显中文泄漏。

### Clock Out Alive

- PC 空格/↑ 二段跳、P/Esc 暂停、M 静音、18:00 下班窗口没有按键连发误触。
- 手机点击跳跃、窄屏顶部导航、safe-area、设置弹层和结果卡均可正常使用。
- 语言选择在刷新/返回/跨 91hwl 页面时不出现英文首屏后又回中文的闪切。
- 变异 BUG、老板、会议、临时需求等组合仍保持可读、可解。

## 发布后的开发策略

正式发布后停止以下工作：

- 无证据的大规模架构重写；
- 为了“版本更新”而主动改平衡；
- 没有玩家反馈支撑的全面美术返工；
- 再次引入轮询、全局 observer、whole-page translation 或多套输入 owner。

后续只接受：

**真人/玩家证据 → 可复现 Issue → 最小修复 → 聚焦验证 → 小版本补丁。**

优先证据：冻结、存档损坏、移动端不可操作、明显语言泄漏、无法规避的障碍/首领、经济断层、关键输入重复、浏览器兼容性。

美术优化可以继续，但不阻塞首发；应以玩家最常看到的角色、首领、城镇或视觉识别问题为单位做定点补丁。

## 宣发入口

上线通过后立即进入 X 宣发，主要落点：

- `https://91hwl.cn/` — 两款游戏总入口；
- `https://play.91hwl.cn/dungeon-echo/` — Dungeon Echo；
- `https://play.91hwl.cn/moyu/` — Clock Out Alive；
- `https://github.com/diaow2331-ops/dungeon-echo` — 源码、Release Notes、Issue 与 AI-assisted engineering 过程。

首轮宣发重点不是承诺“完美游戏”，而是强调：**浏览器打开即玩、PC+手机、中英双语、公开源码、持续根据玩家反馈更新。**

## 本阶段停止条件

- 最终 release PR 合并到 `main`；
- 服务器执行 `deploy-dual-public.sh` 并出现 `dual_public_release=PASS`；
- 线上 VERSION 分别为 Dungeon `1.2.10`、Moyu `1.11.5`；
- 91hwl 首页显示 site `1.3.4` 与 GitHub / Source 首屏入口；
- PC/手机完成一轮真人冒烟验收；
- 没有新的 P0 冻结、存档损坏、不可操作或明显语言泄漏。

达到以上条件后，项目正式进入“公开运营 + 玩家反馈补丁”模式。
