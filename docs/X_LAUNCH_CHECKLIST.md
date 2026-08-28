# Dungeon Echo — X / Website / GitHub Launch Plan

This document is the current promotion authority for Dungeon Echo. The launch funnel is intentionally asymmetric:

**X creates discovery → the 91hwl project page explains and converts → the game creates play → GitHub provides source credibility, stars, issues and long-term trust.**

The package is designed for a **standard non-Premium X account**. Do not depend on X Articles, long-post entitlements or paid publishing features. Platform limits can change, so check the current composer before publishing.

## Current public product boundary

- Dungeon Echo: **v1.2.10**.
- Public runtime cache generation: **155**.
- Clock Out Alive: **v1.11.5**.
- 91hwl launch site artifact: **site v1.3.4**.
- Chinese game route: `https://play.91hwl.cn/dungeon-echo/`.
- English game route: `https://play.91hwl.cn/dungeon-echo/en/`.
- Canonical cold-traffic landing page: `https://91hwl.cn/toys/dungeon-echo/`.
- Repository: `https://github.com/diaow2331-ops/dungeon-echo`.

Do not reopen broad art, architecture or feature work merely because promotion is starting. Post-launch product changes are player-evidence driven.

## Funnel design

### 1. X — discovery

The main launch post has one job: make a stranger want to inspect the game.

Use one primary CTA only:

`https://91hwl.cn/toys/dungeon-echo/?utm_source=x&utm_medium=social&utm_campaign=dungeon_echo_launch`

The query string is intentionally conventional and survives normal static-site delivery, giving server/access-log analysis a clean campaign marker.

Do **not** make the GitHub repository the main launch destination. Developers can reach it from the project page and from a follow-up reply; ordinary players should not have to understand repository structure before deciding whether to play.

Do **not** make the raw game Canvas the only cold-traffic destination. Returning players can use the direct Play URL, but new visitors benefit from the project page's pitch, screenshots, platform information and source link before entering the game.

### 2. 91hwl project page — conversion

The Dungeon Echo project page is the canonical promotion landing page. Above the fold it should communicate:

- 100-floor browser roguelike;
- four classes and build decisions;
- risk / retreat / greed loop;
- no install, no account;
- PC + mobile;
- MIT open source;
- one prominent Play action;
- one visible GitHub / Source action.

Site v1.3.4 also owns the promotion-card contract for the homepage and Dungeon detail page: `summary_large_image`, explicit Open Graph URL/site/image-alt fields, explicit X title/description/image/image-alt fields and `max-image-preview:large`.

The site healthcheck must fail if the Dungeon launch page loses those fields, the source CTA or the open-source identity.

### 3. Game — play

The game surface should remain focused on playing rather than marketing.

- Do not add social popups, forced GitHub prompts or launch banners to the dungeon runtime.
- Keep fixed Chinese/English route identity and compatible browser saves unchanged.
- Project-page language preference can carry into the fixed game route.
- Returning players may be linked directly to Play in follow-up posts.

### 4. GitHub — credibility and retention

GitHub is the technical proof surface, not the primary cold-traffic landing page.

The public repository should continue to expose:

- a one-sentence pitch and live Play links at the top of README;
- the current v1.2.10 release fact;
- title artwork early in README;
- folder-first source map;
- MIT license;
- focused Issues / contribution path;
- public release and engineering history;
- AI-assisted development disclosure without implying OpenAI endorsement.

Repository About currently uses a direct playable homepage, which is useful for developer visitors who already understand the repository context.

## Promotion gates

### Gate A — repository

- [x] README is visitor-first and aligned to v1.2.10.
- [x] Repository description identifies a browser-native 100-floor roguelike.
- [x] Topics cover browser-game, roguelike, JavaScript, vanilla-js, open-source and AI-assisted development.
- [x] `main` is the only intended long-lived branch.
- [x] PR/commit-title governance is standardized for the public history.
- [ ] Historical remote branch pruning is physically complete and re-verified after the current cleanup run.
- [ ] GitHub `Automatically delete head branches` is enabled so short-lived branches do not accumulate again.
- [ ] GitHub Social Preview is manually set to a dedicated horizontal launch image if repository settings do not already provide one.

### Gate B — website

- [x] Site v1.3.4 source/build contract aligns homepage to Dungeon Echo v1.2.10 and Clock Out Alive v1.11.5.
- [x] Homepage presents both games as complete browser products.
- [x] Dungeon project page exposes Play and GitHub / Source.
- [x] Dungeon project page exposes MIT / open-source identity above the fold.
- [x] Homepage and Dungeon project page have explicit large social-card metadata in the v1.3.4 build.
- [x] Build and health contracts reject missing promotion metadata.
- [ ] Final site v1.3.4 immutable artifact is deployed.
- [ ] Origin and public health checks report PASS.
- [ ] Public homepage and Dungeon project page visibly report v1.2.10 rather than the older v1.2.7 copy.
- [ ] Desktop/mobile public pages receive one final visual check after deployment.

### Gate C — game

- [x] Dungeon Echo v1.2.10 is the current repository release line.
- [x] Fixed Chinese/English routes are the production language model.
- [x] Shared compatible browser saves remain intact across the two routes.
- [x] Return Scroll extraction uses one guarded state-machine owner.
- [x] Town is a bounded workspace rather than a long mixed presentation page.
- [x] Representative desktop/mobile launch acceptance is recorded.
- [x] No new promotion-specific runtime code is required.

## X asset package

Media should explain the product; text should provide identity and one CTA.

Preferred four-image set:

1. **Fresh gameplay frame** — hero, enemy, dungeon and useful UI in one readable shot.
2. **Four classes** — `art/class-roster.webp`.
3. **Town** — `art/town-backdrop-v11.webp`.
4. **Floor-100 finale** — `art/final-boss-v11.png`.

Fallback for image 1: `art/title-backdrop.webp`.

Do not use historical defect screenshots that show retired translation artifacts, the old player halo, the removed center Wait touch target or pre-workspace town layout.

Optional short video target: roughly 15–30 seconds.

Suggested sequence:

`move → J attack → K skill / Mana → loot → guardian telegraph / dodge → town / retreat → title artwork + Play URL`

A clean four-image post is preferable to a weak clip.

## Main X launch post

Use English as the first broad-discovery post unless the account is intentionally targeting a Chinese-only audience. Keep the first post short enough that the media and product idea remain dominant.

Recommended launch copy:

> Dungeon Echo is live — a 100-floor turn-based roguelike that runs directly in your browser.
>
> Four classes. Build-driven gear. Readable bosses. Push deeper, or return safely before greed costs the run.
>
> No install. No account. PC + mobile. Open source.
>
> https://91hwl.cn/toys/dungeon-echo/?utm_source=x&utm_medium=social&utm_campaign=dungeon_echo_launch

Do not add the GitHub URL to the same main post. The project page already exposes Source, and a separate reply gives developers a cleaner second path.

## Launch reply stack

Reply 1 — direct play:

> Want to skip the overview and descend now?
>
> Play: https://play.91hwl.cn/dungeon-echo/
> English: https://play.91hwl.cn/dungeon-echo/en/

Reply 2 — source / engineering:

> Source is public too: vanilla HTML/CSS/JavaScript, MIT licensed, with the release and engineering history kept in the repo.
>
> https://github.com/diaow2331-ops/dungeon-echo

Reply 3 — Chinese discovery:

> 《地牢回响》现已开放：一款打开浏览器就能玩的百层回合制 Roguelike。
>
> 四职业、装备构筑、Mana、可读 Boss，以及“继续贪还是安全回城”的长线抉择。无需安装、无需注册，电脑和手机都能玩，源码公开。
>
> https://91hwl.cn/toys/dungeon-echo/?utm_source=x&utm_medium=social&utm_campaign=dungeon_echo_launch_zh

## Follow-up content sequence

Do not dump every feature on launch day. Reuse one strong product idea per post.

1. **Risk / retreat** — why the Return Scroll and carried loot make retreat timing matter.
2. **Boss readability** — show a guardian telegraph and the movement counterplay.
3. **Build identity** — four classes, six equipment slots, Epic/Legendary mechanics and 20/40/60/80 skill evolution.
4. **Town** — show the bounded workspace and how a safe return converts risk into progress.
5. **Browser-native engineering** — vanilla JS, local saves, static deployment, immutable artifacts and rollback.
6. **AI-assisted engineering** — factual collaboration/process disclosure, never an endorsement claim.
7. **Player evidence** — useful public feedback, fixes or balance findings after launch.

## Measurement

Evaluate the funnel, not just impressions.

Primary signals:

- requests to the project page carrying `utm_source=x`;
- clicks/visits to the direct game route after campaign traffic;
- new runs and repeat browser visits where available from existing site/server telemetry;
- GitHub repository views and stars;
- useful Issues / reproducible feedback;
- Chinese vs English and desktop vs mobile reports.

The first promotion is also a public playtest. A high-quality bug report is a successful outcome, not a failed launch.

## Stop rule

Once site v1.3.4 is publicly verified and the first launch post is published, stop changing launch infrastructure unless real traffic exposes a concrete problem. Promotion should then become **content → player evidence → targeted product fix**, not another open-ended repository redesign.
