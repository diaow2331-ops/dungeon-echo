# Dungeon Echo — X launch copy (standard account)

Prepared for the v1.2.2 launch line.

Do **not** publish the launch post until the updated 91hwl homepage/project page has passed the existing public deployment health check. Repository merge is not proof that the public site is updated.

## Platform constraint

This package intentionally targets a standard non-Premium X account:

- keep the main post inside the normal short-post limit;
- use up to four media items, preferably four strong images;
- do not depend on Articles or Premium longer-post features;
- re-check X Help immediately before publishing because platform limits can change.

## Recommended first post — English

Use this as the primary GitHub/global indie-dev launch post:

```text
Built Dungeon Echo — a 100-floor browser roguelike about builds, risk, retreat and greed.

4 classes · J/K + Mana · readable bosses · no install · open source

Play: https://play.91hwl.cn/dungeon-echo/
GitHub: https://github.com/diaow2331-ops/dungeon-echo
```

Keep the main post free of a long hashtag list. The product definition, Play link and GitHub link are more valuable than spending the remaining text budget on implementation history.

## Recommended first post — Chinese

Publish separately for the Chinese audience rather than translating the English post line by line:

```text
做了一个百层网页 Roguelike：《地牢回响》。

四职业、装备构筑、J/K + Mana、可读 Boss。核心选择：继续贪，还是带着战利品回城？

无需安装 / 无需账号 / 开源
试玩：https://play.91hwl.cn/dungeon-echo/
GitHub：https://github.com/diaow2331-ops/dungeon-echo
```

## Four-image launch set

Use the full four-image allowance when all four assets remain readable in the X media grid.

Recommended order:

1. **Cover / combat identity** — `https://play.91hwl.cn/dungeon-echo/art/title-backdrop.webp`
2. **Four classes** — `https://play.91hwl.cn/dungeon-echo/art/class-roster.webp`
3. **Town / return loop** — `https://play.91hwl.cn/dungeon-echo/art/town-backdrop-v11.webp`
4. **Floor-100 finale** — `https://play.91hwl.cn/dungeon-echo/art/final-boss-v11.png`

If a strong real gameplay screenshot is captured before launch, use it as image 1 and move the title backdrop out of the four-image set. Real gameplay is better proof than a second promotional illustration.

Image roles:

- image 1 answers **“what is this?”**;
- image 2 answers **“who can I play?”**;
- image 3 answers **“what happens between dungeon runs?”**;
- image 4 answers **“how far does the game go?”**.

Do not put dense feature text on all four images. The media should show the game, not become four miniature posters.

## Optional reply 1 — gameplay

English:

```text
The main loop is simple:

descend → fight → loot → decide whether to push deeper → return safely → secure the build → descend again

The return decision is the point. Greed is part of the build.
```

Chinese:

```text
核心循环其实很简单：

下潜 → 战斗 → 搜刮 → 决定继续贪还是回城 → 保住构筑 → 再下潜。

“什么时候撤退”本身就是玩法的一部分。
```

## Optional reply 2 — engineering / repository

English:

```text
Dungeon Echo is vanilla HTML/CSS/JS, static-first, MIT licensed, and has no runtime backend dependency for core play.

Saves stay in localStorage. The repo also documents the release/rollback path and AI-assisted engineering work.
```

Chinese:

```text
工程上它保持为原生 HTML/CSS/JS 静态游戏：核心玩法无运行时后端依赖，存档留在 localStorage，MIT 开源。

仓库里也保留了发布/回滚治理与 AI 协作记录。
```

## Optional reply 3 — bosses / progression

English:

```text
Every 10 floors introduces a guardian node with readable counterplay instead of hidden random punishment. Floor 100 is a three-phase finale.

Skills evolve at 20 / 40 / 60 / 80, while every class keeps the same J attack / K skill control language.
```

Chinese:

```text
每 10 层都有一个守卫节点，难度尽量来自可读、可反制的机制，而不是隐藏随机惩罚；第 100 层是三阶段终局。

职业技能在 20 / 40 / 60 / 80 层继续分化，但操作始终保持 J 攻击 / K 技能。
```

## Link policy

Use the same canonical links everywhere:

- Play — `https://play.91hwl.cn/dungeon-echo/`
- English — `https://play.91hwl.cn/dungeon-echo/?lang=en`
- GitHub — `https://github.com/diaow2331-ops/dungeon-echo`
- Project — `https://91hwl.cn/toys/dungeon-echo/`

The main launch post should normally contain Play + GitHub. Use the Project page in replies/profile/other posts rather than spending the main post's limited text budget on three or four URLs.

## Publishing order

1. Verify public 91hwl homepage and Dungeon Echo project page.
2. Verify Play and English Play links.
3. Confirm the four chosen media files render correctly when uploaded to X.
4. Publish the English or Chinese main post with four media items.
5. Add only the most useful follow-up replies; do not turn the launch into a wall of self-replies.
6. Reuse individual images later for engineering, boss-design and art-evolution posts instead of exhausting every story in the launch post.
