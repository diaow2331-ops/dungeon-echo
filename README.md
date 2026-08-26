# Dungeon Echo · 地牢回响

**A browser-native 100-floor turn-based roguelike about builds, risk, retreat and greed.**

[Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Play in English](https://play.91hwl.cn/dungeon-echo/?lang=en) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Status:** v1.2.3 is the current repository release line. Public deployment is only considered complete after the normal file-upload, version-endpoint and health checks pass. Existing compatible browser saves remain valid.

Dungeon Echo is a vanilla HTML/CSS/JavaScript roguelike built around one continuous journey from **floor 1 to floor 100**.

`descend → fight → loot → decide whether to push deeper → return safely → secure the build → descend again`

No account is required. Saves live in the browser. The production game is static and has no runtime backend dependency.

## Why play it?

- One production route: **1 → 100**, with conquered-depth checkpoints instead of paid skips.
- Four classes: **Warrior, Ranger, Arcanist, Assassin**.
- Six equipment slots with tier-specific art, rarity, affixes and build tradeoffs.
- Greedy Expedition town loop with safe storage, finite supplies, forging and commerce.
- Skill evolution at **20 / 40 / 60 / 80**.
- Ten guardian/finale nodes with readable movement, interrupt and armor-break counterplay.
- A three-phase floor-100 finale.
- Explicit **J Attack / K Skill** combat with class-specific mana capacity, skill cost and recovery rhythm.
- Adaptive procedural BGM plus independent **Music / SFX 0–100%** controls and persistent master mute.
- Desktop keyboard/mouse, native Gamepad API and portrait/landscape touch controls.
- Progressive onboarding that teaches mechanics without covering the mobile action deck.
- Chinese / English sessions with automatic browser-language selection, direct language URLs and a title-screen language selector.
- v1.2.3 final device/presentation cleanup: no always-on player halo, lower-cost mobile overlay work, steadier non-fullscreen browser layout and faster pointer-down touch response.

The project favors readable counterplay over hidden punishment, human playtesting over bot-only balance claims, and rollback-capable static releases over unnecessary infrastructure.

## Controls

| Action | Keyboard | Mobile |
| --- | --- | --- |
| Move / face | Arrow keys / WASD | Left D-pad |
| Attack | `J` | Attack |
| Class skill | `K` | Skill |
| Wait / focus | Space / `.` | Center D-pad |
| Potion | `Q` | Potion |
| Scroll | `E` | Scroll |
| Return to town | `T` | Return |
| Descend | `Enter` | Descend |
| Pause | `Esc` | Pause |
| Master mute | `M` | Sound |
| Fullscreen | `F` | Fullscreen |

Skills use mana. Each class has a different mana capacity, skill cost and recovery rhythm. Mana mutations are persisted through the existing run-save path so refreshing the page cannot restore a pre-cost or pre-recovery snapshot.

## Language

The production UI supports **中文 / English**.

- `?lang=en` opens the English presentation directly.
- `?lang=zh` opens Chinese directly.
- Without a language parameter, the browser language is used on first visit.
- Manual language choice lives on the **title screen** and reloads into the selected locale instead of translating a live dungeon session in place.
- `locale-runtime-v122.js` is the stable per-page locale owner. The retired layered `i18n.js` / `i18n-runtime.js` / `i18n-content.js` / `ux-hotfix-v121.js` production chain is no longer shipped.

Localization keeps gameplay/save identities language-independent. Shell UI, controls, onboarding, sound settings, class identity, equipment, monsters, guardians/finale, town commerce, forging and high-value combat messages use display-only localization; saved item/profile identities remain unchanged.

## Run locally

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
http://localhost:8000/dev.html
```

`index.html` is the production 1→100 route. `dev.html` is an internal short-profile harness and must track the same current runtime/control contract without entering the production release package.

## Repository layout

```text
.
├── index.html                     # production entry
├── dev.html                       # internal multi-profile development harness
├── game.js                        # core state / map / turn engine
├── production-bootstrap.js        # production-only profile/runtime guards
├── equipment-system.js            # equipment generation / fit / value
├── town-system.js                 # town progression / checkpoints
├── commerce-system.js             # finite supply stock and pricing
├── forge-system.js                # refinement / masterwork
├── progression-system.js          # talents + skill evolution
├── content-system.js              # late-floor themes + guardian/finale states
├── combat-pressure.js             # readable deep-floor / guardian pressure
├── visual-polish.js               # atmosphere + equipment/town presentation
├── equipment-shop-ui.js           # equipment/town presentation bridge
├── gameplay-tuning.js             # production gameplay tuning
├── defense-system.js              # defense semantics / mitigation layer
├── desktop-controls.js            # desktop + gamepad input adapter
├── combat-controls.js             # J/K controls + mana resource
├── challenge-pressure.js          # mild human-play pressure follow-up
├── runtime-bootstrap.js           # late presentation/runtime followers
├── release-stamp-v123.js          # visible v1.2.3 release marker
├── locale-runtime-v122.js         # stable zh/en per-page locale runtime
├── character-art-cleanup-v122.js  # presentation-only hero cleanup
├── world-loot-polish-v122.js      # visible ground-loot presentation
├── forge-feedback-v122.js         # post-result forge feedback
├── audio-director.js              # adaptive BGM + Music/SFX mixer
├── mobile-ux.js                   # base mobile control/layout follower
├── mobile-visual-final-v123.js     # final mobile latency/layout + player-light cleanup
├── profiles/                      # production + deterministic fixtures
├── art/                           # production art assets
├── test/                          # targeted deterministic contracts
├── docs/                          # focused gameplay / governance docs
└── ops/                           # file-upload release and rollback tooling
```

## Validation philosophy

Engineering checks protect contracts; they do **not** replace human playtesting.

High-value checks cover production entry, 1→100 descent, guardian state machines, skill evolution, save compatibility, deployment boundaries, input/mana, equipment art, mobile UX, localization, repository release alignment and human-play pressure.

The v1.2 release line does not claim a fresh complete GitHub Actions suite because the Actions quota was unavailable during this release line. Changes are kept as focused reviewable diffs with targeted static/deterministic contracts and human browser verification where feel or presentation matters.

## Save compatibility

Progress is stored in browser `localStorage`. Normal static-file updates and hard refreshes do not remove saves. Clearing site data, changing browser profile/device, or changing storage origin can make local saves unavailable.

v1.2.3 keeps the existing `de-run-v6` version-2 run save and `de-greedy-meta-v1` town/meta save. It does not require a migration or progress reset.

## Release boundary

`VERSION` is authoritative for the repository release version. The production package is controlled by `ops/release/static-files.txt`. Deployment verification checks the HTML route and the deployed `/dungeon-echo/VERSION` endpoint separately before activation.

Release notes: [`RELEASE_NOTES_v1.2.3.md`](RELEASE_NOTES_v1.2.3.md).

## AI-assisted development

OpenAI ChatGPT has been used as an AI engineering collaborator for repository inspection, systems analysis, debugging, regression strategy, gameplay/economy reasoning, deployment review, documentation, art integration, localization architecture and release governance.

The current refinement work was assisted by **GPT-5.6 Sol**. Product direction, acceptance decisions, deployment and final quality judgment remain human-controlled. Dungeon Echo is an independent project and is not an OpenAI product or endorsement.

See [`AI_COLLABORATION.md`](AI_COLLABORATION.md) for the collaboration record.

## Contributing

Focused issues and pull requests are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before large changes and [`MAINTENANCE.md`](MAINTENANCE.md) for the production contract.

## License

MIT — see [`LICENSE`](LICENSE).
