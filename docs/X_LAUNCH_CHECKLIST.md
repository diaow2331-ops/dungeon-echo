# Dungeon Echo — X / GitHub Launch Checklist

This checklist exists to prevent promotion from outrunning product quality. The goal is not only traffic: it is to convert curious players into repeat players, useful feedback and GitHub stars.

## Gate A — Game quality before promotion

- [ ] Latest release candidate is deployed through the validated file-upload / checksum / atomic activation path.
- [ ] PC smoke play: start → fight → J attack → K skill/mana → loot → equip → descend → town return.
- [ ] Mobile portrait smoke play on a real touch device.
- [ ] Mobile landscape smoke play on a real touch device.
- [ ] No legacy equipment geometry or oversized ground-loot art remains.
- [ ] Music and SFX sliders both work from 0–100 and persist after refresh.
- [ ] Master mute works and does not desync the two sliders.
- [ ] Progressive tutorial can be completed, skipped and reset.
- [ ] Chinese mode is coherent.
- [ ] English mode is coherent for first-run shell, controls, onboarding, class cards and core combat feedback.
- [ ] Deep-floor human play confirms the challenge increase feels meaningful without becoming an HP sponge.
- [ ] Floor-40+ guardian armor-break warnings remain readable in both desktop and mobile layouts.
- [ ] Existing browser saves still load.

## Gate B — Repository conversion

- [ ] README begins with a one-sentence game pitch and a direct Play link.
- [ ] README includes a direct English link: `https://play.91hwl.cn/dungeon-echo/?lang=en`.
- [ ] README controls match the shipped J / K / mana contract.
- [ ] Current public release/tag matches what the README says is deployed.
- [ ] Release notes contain screenshots and a concise feature/change list.
- [ ] Repository topics cover the actual project, e.g. `roguelike`, `browser-game`, `javascript`, `game-development`, `turn-based`, `web-game`.
- [ ] GitHub social preview is configured. GitHub recommends 1280×640 for best rendering (minimum 640×320) and an image under 1 MB.
- [ ] Social preview contains the Dungeon Echo title, hero/final-boss visual identity and a small `100-floor browser roguelike` descriptor; avoid tiny UI text.
- [ ] Issues/Discussions route for player feedback is obvious from README or the project page.

## Gate C — X launch package

Prepare these before publishing so the first post is not edited around missing assets.

1. **15–30 second gameplay clip**
   - movement + J attack;
   - K skill and visible mana cost;
   - one loot/equipment moment;
   - one guardian telegraph/dodge;
   - final frame: game URL + GitHub repository.

2. **Four screenshots**
   - hero in a readable dungeon room;
   - equipment/build screen;
   - town;
   - guardian/final boss.

3. **Long-form story / X Article**
   - what Dungeon Echo is in one paragraph;
   - why it was built as a browser-native roguelike;
   - the 1→100 risk/retreat loop;
   - how human playtesting changed the balance;
   - art, audio, mobile and bilingual work;
   - transparent note on AI-assisted engineering;
   - Play CTA;
   - GitHub Star / feedback CTA.

4. **Short launch post**
   - strongest gameplay clip first;
   - one-sentence hook;
   - Play link;
   - GitHub link;
   - link to the longer Article if one is published.

## X platform note

X Articles currently support long-form formatted content plus images, video, GIFs, posts and links. Publishing Articles requires an eligible X Premium plan; readers do not need the publishing entitlement to read a public Article. If an Article is not available on the account, use a normal post / longer post plus a short thread and keep the same asset package.

## Success signals

Do not judge the launch only by impressions. Track:

- game visits;
- players who start a run;
- repeat visits;
- GitHub repository views;
- stars;
- issues / useful feedback;
- mobile vs desktop bug reports;
- Chinese vs English localization reports.

The first promotion should also be treated as a public playtest. High-quality bug reports are a successful outcome, not a failed launch.
