# Dungeon Echo — X / GitHub Launch Checklist

This checklist prevents promotion from outrunning product quality. The goal is to convert curious visitors into players, useful feedback and GitHub stars.

The launch package is designed for a **standard non-Premium X account**. Do not depend on X Articles, long-post entitlements or other paid publishing features. Re-check the platform's current standard text/media limits immediately before publishing because those limits can change.

## Gate A — Game/repository quality

- [x] Game/art broad-polish line is closed at v1.2.2 unless a concrete defect is found.
- [x] Production controls are J Attack / K Skill + Mana.
- [x] Legacy character-equipment overlay paths are suppressed in v1.2.2.
- [x] Current localization architecture is the stable per-page v1.2.2 runtime rather than the retired observer/polling chain.
- [ ] Repository Release/tag history matches the intended immutable version boundaries.
- [ ] Merged branch debt is pruned after release-boundary refs are secured.
- [ ] Current Issues describe current validation/work rather than obsolete implementation state.

## Gate B — Website conversion

Do not launch broadly until the website can carry the traffic.

- [ ] 91hwl.cn homepage clearly explains the Web Toys/project identity.
- [ ] Dungeon Echo has a modern project page with Play / English / GitHub paths.
- [ ] Desktop uses the available width well.
- [ ] Mobile first screen is compact and readable.
- [ ] Chinese / English site navigation and metadata are coherent.
- [ ] Project page includes representative screenshots/GIFs.
- [ ] Open Graph / Twitter Card / canonical / hreflang / sitemap are aligned.
- [ ] Social preview uses dedicated artwork rather than a generic page capture.

## Gate C — GitHub conversion

- [x] README begins with a one-sentence game pitch and direct Play/English links.
- [x] README controls match the shipped J / K / Mana contract.
- [x] README identifies the v1.2.2 repository release line.
- [ ] Current public Release/tag matches the intended deployed version boundary.
- [ ] README includes 3–6 useful screenshots/GIFs rather than relying mainly on text.
- [ ] Repository About / homepage / topics match the current project.
- [ ] GitHub Social Preview uses a dedicated horizontal image with the title, hero/final-boss identity and a short descriptor such as `100-floor browser roguelike`.
- [ ] Feedback path is obvious from README/project page.

## Gate D — Standard-account X asset package

Text space is limited. The media should explain the game; the post text should establish identity and provide the CTA.

### Preferred four-image set

1. **Dungeon combat** — hero, enemies and readable environment in one strong frame.
2. **Build/equipment** — inventory/equipment choices that make the roguelike depth obvious.
3. **Town** — shows the Greedy Expedition return/preparation loop.
4. **Guardian/finale** — strongest boss/telegraph image, preferably visually distinct from screenshot 1.

Each image should work when seen alone in the X media grid. Avoid tiny unreadable UI labels as the main point of an image.

### Optional short clip / GIF

Target 15–30 seconds:

`move → J attack → K skill/Mana → loot → guardian tell/dodge → Play + GitHub end frame`

The clip is useful but not required if a four-image post communicates the product more clearly.

## Launch-post writing rule

The main post should normally contain only:

- one hook / product definition;
- one or two strongest differentiators;
- Play link;
- GitHub link;
- at most a small number of useful hashtags, if any.

Do not spend the main post explaining the full development history, every feature, AI collaboration or every control. Put those into follow-up posts, the project page and README.

### English positioning candidates

Keep the eventual copy compact around concepts such as:

- `100-floor browser roguelike`
- `build / risk / retreat`
- `no install / no account`
- `vanilla JavaScript`
- `open source`

### Chinese positioning candidates

Keep the eventual copy compact around concepts such as:

- `百层网页 Roguelike`
- `构筑 / 贪念 / 撤退`
- `打开即玩`
- `开源`

Chinese and English posts should be written independently for their audiences, not translated line by line.

## Follow-up post options

After the main launch post, use separate short posts for:

1. **Gameplay** — why deciding when to retreat matters.
2. **Engineering** — vanilla JS, static deployment, rollback and no backend dependency.
3. **Art evolution** — v1.0 → v1.1 → v1.2.2 visual progression with before/after images.
4. **AI-assisted engineering** — transparent factual note with the repository disclosure link, without implying OpenAI endorsement.
5. **Boss design** — readable guardian telegraphs and the floor-100 finale.

This is preferable to an overloaded launch post.

## Core links

Keep one canonical set everywhere:

- Play: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- GitHub: `https://github.com/diaow2331-ops/dungeon-echo`
- Project: `https://91hwl.cn/toys/dungeon-echo/`

## Success signals

Do not judge the launch only by impressions. Track:

- game visits;
- players who start a run;
- repeat visits;
- GitHub repository views/stars;
- useful issues/feedback;
- mobile vs desktop reports;
- Chinese vs English localization/site reports.

Treat the first promotion as a public playtest as well as a launch. High-quality bug reports are a useful outcome.
