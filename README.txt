地牢回响 Dungeon Echo v1.1.0
============================

纯静态、离线优先的单机网页 Roguelike。
正式旅程从第 1 层开始，直至第 100 层终局；核心玩法不依赖账号、后端或数据库。

在线试玩
--------
https://play.91hwl.cn/dungeon-echo/

项目页面
--------
https://91hwl.cn/toys/dungeon-echo/

核心内容
--------
- 四职业：战士、游侠、秘术师、刺客；战斗节奏与构筑方向不同。
- 六装备栏：武器、护甲、头盔、靴子、戒指、项链。
- 史诗/传说机制词缀，不只提升面板，也会改变移动、等待、技能、喝药与普攻决策。
- +1～+5 锻造；+3 选择精炼方向，+5 完成对应淬炼。
- 贪婪远征：下潜搜刮 → 判断是否继续冒险 → 回城保住战利品 → 仓库/金库/市集/锻造整备 → 再次深入。
- 已征服检查点：只有真正通过上一阶段守卫后，才会解锁更深的回返点。
- 城镇有限补给、章节价格、幸运转盘与死亡风险共同构成长局经济。
- 10→100 守卫/终局节点拥有可读预警、反制和阶段机制；第 100 层为三阶段终局战。
- 四职业在 20 / 40 / 60 / 80 层获得二选一主动技能进化，仍只使用 C 键释放职业技能。
- v1.1.0 主线加入四职业地牢形象、16 类普通怪物、9 位独立守卫、终局 Boss 美术、装备稀有度反馈与十阶段城镇视觉成长。

操作
----
移动       方向键 / WASD / 点击已探索地块
等待       空格 或 .
药水       Q
卷轴       E
回城       T（贪婪远征）
职业技能   C
下楼       Enter（站在楼梯上）
暂停       Esc
静音       M
全屏       F
重开       死亡或胜利后按 R

存档
----
进度保存在当前浏览器的 localStorage 中，不会上传到云端。
清除站点数据、使用另一浏览器配置/设备，或更换存储来源可能导致进度不可用；
v1.1.0 保留现有 run/meta 存档结构，不要求迁移或清档，也不提供云存档。

本地运行
--------
在本目录运行：

  python3 -m http.server 8000

然后访问：

  http://localhost:8000/

index.html 为正式 1→100 路线；dev.html 与短 Profile 仅用于开发测试。

发布验证
--------
  node --check game.js
  node --check content-system.js
  node --check progression-system.js
  node test/production.cjs
  node test/descent100.cjs
  node test/guardian-content.cjs
  node test/skill-evolution.cjs
  node test/smoke.cjs
  node test/release.cjs

AI 协作说明
----------
本项目开发过程中使用 OpenAI ChatGPT 作为 AI 工程协作者，参与仓库审查、架构分析、
调试、测试策略、玩法/经济推理、部署审查、文档整理、Boss 状态机与技能进化整合。
产品方向、取舍、合并与部署由仓库维护者最终决定。项目为独立作品，不代表 OpenAI 官方产品或背书。

许可：MIT（见 LICENSE）。
