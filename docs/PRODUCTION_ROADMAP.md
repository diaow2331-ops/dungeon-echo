# 地牢回响：v1.2.10 上线后维护路线图

> **Superseded for Dungeon Echo:** v1.3.2 之后的产品优化以 `docs/POST_LAUNCH_OPTIMIZATION_PLAN_v132.md` 为当前计划；本文保留为 v1.2.10 上线阶段历史记录。

> 当前公开集合：**Dungeon Echo v1.2.10 + Clock Out Alive v1.11.5 + 91hwl site v1.3.4**。Dungeon Echo 当前 public runtime cache generation 为 **155**，runtime owner 为 **v13**。

项目已经从“首发准备”进入：

**公开运营 → X 宣发 → 玩家证据 → 小补丁。**

## 已完成：首发与治理

- ✅ Dungeon Echo v1.2.10 已公开上线。
- ✅ Clock Out Alive v1.11.5 已公开上线。
- ✅ 91hwl site v1.3.4 已公开上线，并提供两个游戏与 GitHub / Source 的首屏入口。
- ✅ `/dungeon-echo/` 固定中文、`/dungeon-echo/en/` 固定英文，同 gameplay/save namespaces。
- ✅ translation-after-render 生产栈退出 runtime；浏览器二次翻译边界已加固。
- ✅ Return Scroll 收敛为 Commerce `arming → ready → completing` 状态机，真人浏览器验收完成。
- ✅ 城镇从纵向长页面收敛为固定视口工作台：Gear & Stash / Market / Fortune / Progress。
- ✅ 标题页与城镇 Progress 提供返回 91hwl 与进入 Clock Out Alive 的直接入口。
- ✅ PC 中宽窗口、手机触控目标与主要响应式断层已收口。
- ✅ 根目录零活跃 JavaScript；代码按 `game/core / systems / input / locale / ui` 分组。
- ✅ P0 浏览器验收 Issue #105 / #106 已完成并关闭。

## 发布治理：唯一标准路径

生产服务器不是构建机。

标准发布链固定为：

`当前工作环境或 CI 生成最终静态 ZIP → 用户上传 /tmp → 一条离线部署命令 → SHA256 → stage/backup → atomic switch → healthcheck → PASS`

生产服务器不得：

- `git fetch/pull/checkout/merge`；
- 运行 Node/npm builder；
- 应用 `patch` / `sed` / 临时文本变换；
- 从源码现场组装发布 ZIP；
- 用历史线上文件哈希作为接受新 immutable artifact 的前提。

规范见：`.agents/skills/91hwl-static-release/SKILL.md`。

## 当前产品状态

### Dungeon Echo v1.2.10

- 1 → 100 正式路线；四职业、六装备位、Mana、20/40/60/80 技能进化、十层守卫和三阶段终局。
- Greedy Expedition 使用安全仓库、有限市集、锻造/出售、Return Scroll 与检查点。
- Town workspace 已改为固定视口页签，不再把所有服务纵向展开。
- 中英文固定路线共享兼容存档。
- 当前阶段不主动做全局平衡重写或大规模美术返工。

### Clock Out Alive v1.11.5

- 约四分钟办公室跑酷，14:00 → 18:00 四场景与两个结局。
- 输入 auto-repeat、公平间距、Canvas 测量、语言一致性、safe-area 与窄屏导航已收口。
- 后续只根据真实玩家反馈做定点修正。

### 91hwl site v1.3.4

- 作为两款游戏的统一落地页。
- 首页首屏提供 Dungeon、Moyu、GitHub / Source 三个主要转化入口。
- 项目详情页说明玩法、平台和当前版本。
- 宣发流量优先落到主站，再按兴趣进入游戏或源码仓库。

## 上线后的开发规则

停止：

- 无玩家证据的大规模架构重写；
- 为了“发新版本”主动修改全局数值；
- 没有反馈支撑的全面美术返工；
- 再引入 whole-page translator、轮询、全局 observer 或多套输入 owner；
- 发布失败后回退到服务器现场 Git/build/patch。

接受：

**玩家证据 → 可复现 Issue → 最小修复 → 聚焦验证 → immutable ZIP 补丁。**

P0 优先级证据包括：冻结、存档损坏、移动端不可操作、明显语言泄漏、无法规避的障碍/首领、稳定套利、关键输入重复、严重浏览器兼容问题。

## 长期验证 Issue

仍开放的 #3 / #4 / #5 / #7 / #10 / #11 都属于**上线后质量研究**，不是已知 P0：

- #3 装备构筑与后期多样性；
- #4 四职业 20/40/60/80 技能路线；
- #5 十层守卫与 100 层终局可读性；
- #7 1→100 真人长局总审计；
- #10 城镇商业与检查点经济；
- #11 命运转盘生命周期与期望价值。

只有玩家/真人长局证据指出具体问题时，才进入修复。

## 宣发入口

- https://91hwl.cn/ — 两款游戏总入口；
- https://play.91hwl.cn/dungeon-echo/ — Dungeon Echo 中文；
- https://play.91hwl.cn/dungeon-echo/en/ — Dungeon Echo English；
- https://play.91hwl.cn/moyu/ — Clock Out Alive；
- https://github.com/diaow2331-ops/dungeon-echo — 源码、工程治理、Issue 与 AI-assisted development 记录。

首轮 X 宣发核心信息：

**browser-native · no install · PC + mobile · Chinese + English · open source · player-feedback patches**

## 当前阶段停止条件

首发工程已经完成。之后不再设“继续首发重构”的停止条件。

下一阶段成功标准改为：

- X 开始稳定引流；
- 玩家实际打开并体验两个游戏；
- GitHub 获得真实访问、Star/Issue/PR；
- 第一批可复现玩家反馈进入 Issue；
- 只针对真实反馈发布小补丁。
