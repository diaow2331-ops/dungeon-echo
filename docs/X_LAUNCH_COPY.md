# Dungeon Echo — X launch copy (standard account)

Prepared for the **v1.2.3** launch line.

Do **not** publish the launch post until the v1.2.3 game and the updated 91hwl homepage/project page have passed their normal public deployment checks. Repository source being current is not proof that the public URLs are current.

## Publishing constraint

This package targets a standard non-Premium X account:

- keep the main post short enough for the normal post composer;
- use the full four-image set when the media grid remains readable;
- do not depend on Articles or paid long-post features;
- re-check X's current standard text/media rules immediately before publishing.

The main post should define the game and provide the CTA. The images should carry most of the explanation.

## Primary launch post — English

```text
Built Dungeon Echo — a 100-floor browser roguelike about builds, risk, retreat and greed.

4 classes · readable bosses · no install · open source

Play: https://play.91hwl.cn/dungeon-echo/
GitHub: https://github.com/diaow2331-ops/dungeon-echo
```

Do not spend the remaining text budget on a long hashtag list or implementation history.

## Primary launch post — Chinese

```text
做了一个百层网页 Roguelike：《地牢回响》。

四职业、装备构筑、可读 Boss。最重要的选择不是打不打，而是：继续贪，还是带着战利品回城？

无需安装 / 无需账号 / 开源
试玩：https://play.91hwl.cn/dungeon-echo/
GitHub：https://github.com/diaow2331-ops/dungeon-echo
```

Chinese and English posts are separate audience-specific posts, not sentence-by-sentence translations.

## Recommended four-image launch set

### Preferred set after v1.2.3 is deployed

1. **Fresh real gameplay screenshot** — post-v1.2.3, showing the dungeon, hero, enemy and useful UI in one frame.
2. **Four classes** — `art/class-roster.webp`.
3. **Town / return loop** — `art/town-backdrop-v11.webp`.
4. **Floor-100 finale** — `art/final-boss-v11.png`.

If a clean post-v1.2.3 gameplay screenshot is not ready, use `art/title-backdrop.webp` for image 1 instead. Do not delay the whole launch solely to manufacture a decorative screenshot.

### Image roles

- image 1: **what does it actually look like to play?**
- image 2: **who can I play?**
- image 3: **what happens between dungeon runs?**
- image 4: **how far does the game go?**

Use no dense feature-text overlays. Let the media show the product.

### Screenshot quarantine

Do **not** use pre-v1.2.3 screenshots that show either of these retired defects:

- the mobile D-pad center Wait target;
- the old always-on/mispositioned player halo or skill-ready ring.

Those screenshots are bug evidence, not launch media. Capture any real gameplay promo screenshot only after the v1.2.3 public build is confirmed.

## Optional reply 1 — gameplay

English:

```text
The loop is simple:

descend → fight → loot → decide whether to push deeper → return safely → secure the build → descend again

The retreat decision is the point. Greed is part of the build.
```

Chinese:

```text
核心循环很简单：

下潜 → 战斗 → 搜刮 → 决定继续贪还是回城 → 保住构筑 → 再下潜。

“什么时候撤退”本身就是玩法的一部分。
```

## Optional reply 2 — engineering

English:

```text
Dungeon Echo is vanilla HTML/CSS/JS, static-first, MIT licensed, and has no runtime backend dependency for core play.

Saves stay in localStorage. The repo also documents release/rollback governance and the AI-assisted engineering process.
```

Chinese:

```text
工程上它保持为原生 HTML/CSS/JS 静态游戏：核心玩法无运行时后端依赖，存档留在 localStorage，MIT 开源。

仓库里也公开了发布/回滚治理与 AI 协作记录。
```

## Optional reply 3 — bosses / progression

English:

```text
Every 10 floors introduces a guardian node built around readable counterplay instead of hidden random punishment. Floor 100 is a three-phase finale.

Skills evolve at 20 / 40 / 60 / 80, while every class keeps the same J attack / K skill language.
```

Chinese:

```text
每 10 层都有一个守卫节点，难度尽量来自可读、可反制的机制，而不是隐藏随机惩罚；第 100 层是三阶段终局。

职业技能在 20 / 40 / 60 / 80 层继续分化，但操作始终保持 J 攻击 / K 技能。
```

## Optional reply 4 — v1.2.3 device polish

Use only if device polish becomes part of the discussion; it is not the main launch hook.

English:

```text
The final v1.2.3 pass came from real device testing: steadier non-fullscreen mobile layout, faster touch response, a four-way D-pad without the accidental center Wait target, and cleanup of the old player halo.
```

Chinese:

```text
最后的 v1.2.3 收尾来自真机测试：手机非全屏更稳定、触控响应更快、方向盘去掉中央误触等待键，同时清掉了旧的主角光圈残留。
```

## Link policy

Canonical links:

- Play — `https://play.91hwl.cn/dungeon-echo/`
- English — `https://play.91hwl.cn/dungeon-echo/?lang=en`
- GitHub — `https://github.com/diaow2331-ops/dungeon-echo`
- Project — `https://91hwl.cn/toys/dungeon-echo/`

The main launch post should normally use **Play + GitHub** only. Put the Project page and English direct link in replies/profile/secondary posts when useful.

## Publishing order

1. Deploy and verify the v1.2.3 playable game.
2. Deploy and verify the v1.2.3 91hwl homepage/project page.
3. Capture one fresh post-v1.2.3 real gameplay screenshot if it is stronger than the title art.
4. Confirm the final four media files render cleanly in the X composer.
5. Publish one main post with four media items.
6. Add only the most useful follow-up replies; do not create a wall of self-replies.
7. Reuse individual images later for gameplay, engineering, boss-design and art-evolution posts.
