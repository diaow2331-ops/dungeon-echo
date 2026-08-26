# Dungeon Echo — X / GitHub Launch Checklist

This checklist prevents promotion from outrunning product quality. The goal is to convert curious visitors into players, useful feedback and GitHub stars.

The launch package is designed for a **standard non-Premium X account**. Do not depend on X Articles, long-post entitlements or other paid publishing features. Re-check the platform's current standard text/media limits immediately before publishing because those limits can change.

## Gate A — Game/repository quality

- [x] Broad game/art polish is closed; v1.2.3 only fixed concrete device/presentation defects found in human testing.
- [x] Production controls are J Attack / K Skill + Mana.
- [x] Legacy character-equipment overlay paths remain suppressed.
- [x] PC/mobile always-on player halo and skill-ready ring are removed.
- [x] Mobile visual overlays are camera-aware for the 15×15 / 17×17 viewport.
- [x] Mobile D-pad is four-way; the center Wait mis-tap target is not exposed on touch.
- [x] Current localization architecture is the stable per-page locale runtime rather than the retired observer/polling chain.
- [x] Exact v1.1.0 through v1.2.3 mainline tag targets are encoded in guarded tooling.
- [ ] Repository tags / GitHub Release pages are physically published.
- [ ] 67 ordinary merged/historical branch refs are physically pruned.
- [ ] Final four temporary release refs are pruned after tag verification.

## Gate B — Website conversion

Source candidate is now v1.2.3. Broad promotion still waits for public deployment verification.

- [x] 91hwl.cn homepage source clearly explains the Web Toys identity.
- [x] Dungeon Echo source has a modern v1.2.3 project page with Play / English / GitHub paths.
- [x] Desktop source uses the available width well.
- [x] Mobile source collapses to a compact readable single-column layout.
- [x] Chinese / English navigation and metadata are present.
- [x] Project page uses representative shipped art for classes / town / finale.
- [x] Open Graph / Twitter Card / canonical / hreflang are present.
- [x] `SITE_VERSION` is explicitly v1.2.3 and independent from accidental game-only relabeling.
- [ ] v1.2.3 homepage/project-page bundle is deployed.
- [ ] Public health checks return the expected PASS markers.
- [ ] Public page screenshots are reviewed on both desktop and mobile after deployment.

## Gate C — GitHub conversion

- [x] README begins with a one-sentence game pitch and direct Play/English links.
- [x] README controls match J / K / Mana and the four-way mobile D-pad decision.
- [x] README identifies v1.2.3 as the repository release line.
- [x] Release notes exist for v1.2.3.
- [ ] Current public Release/tag matches the deployed v1.2.3 boundary.
- [ ] README includes 3–6 useful screenshots/GIFs rather than relying mainly on text.
- [ ] Repository About / homepage / topics match the current project.
- [ ] GitHub Social Preview uses a dedicated horizontal image with title + short descriptor.
- [ ] Feedback path is obvious from README/project page.

## Gate D — standard-account X asset package

Text space is limited. The media should explain the game; the post text should establish identity and provide the CTA.

### Preferred four-image set

1. **Fresh post-v1.2.3 gameplay screenshot** — hero + enemy + dungeon + useful UI in one frame.
2. **Four classes** — `art/class-roster.webp`.
3. **Town** — `art/town-backdrop-v11.webp`.
4. **Floor-100 finale** — `art/final-boss-v11.png`.

Fallback for image 1: `art/title-backdrop.webp` if a clean real gameplay frame is not ready.

Do not use old screenshots that still show the retired mobile center Wait target or the old player halo. Those are defect evidence, not launch media.

Each image should work when seen alone in the X media grid. Avoid tiny unreadable UI labels as the main subject and avoid dense text overlays.

### Optional short clip / GIF

Target 15–30 seconds:

`move → J attack → K skill/Mana → loot → guardian tell/dodge → Play + GitHub end frame`

A clip is useful but not required if the four-image post communicates the game better.

## Launch-post writing rule

The main post should normally contain only:

- one hook / product definition;
- one or two strongest differentiators;
- Play link;
- GitHub link;
- at most a small number of useful hashtags, if any.

Do not spend the main post explaining the full development history, every feature, AI collaboration or every control. Put those into follow-up posts, the project page and README.

### English positioning

- `100-floor browser roguelike`
- `build / risk / retreat`
- `no install / no account`
- `open source`

### Chinese positioning

- `百层网页 Roguelike`
- `构筑 / 贪念 / 撤退`
- `打开即玩`
- `开源`

Chinese and English posts should be written independently for their audiences.

## Follow-up post options

After the main launch post, use separate short posts for:

1. **Gameplay** — why deciding when to retreat matters.
2. **Engineering** — vanilla JS, static deployment, rollback and no backend dependency.
3. **Boss design** — readable guardian telegraphs and the floor-100 finale.
4. **Device polish** — what real mobile/PC testing changed in v1.2.3.
5. **Art evolution** — selected before/after comparisons without presenting old defects as current gameplay.
6. **AI-assisted engineering** — factual disclosure without implying OpenAI endorsement.

## Core links

- Play: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- GitHub: `https://github.com/diaow2331-ops/dungeon-echo`
- Project: `https://91hwl.cn/toys/dungeon-echo/`

## Success signals

Track more than impressions:

- game visits;
- players who start a run;
- repeat visits;
- GitHub repository views/stars;
- useful issues/feedback;
- mobile vs desktop reports;
- Chinese vs English localization/site reports.

Treat the first promotion as a public playtest as well as a launch. High-quality bug reports are a useful outcome.
