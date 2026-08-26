# Dungeon Echo · 地牢回响

**A browser-native 100-floor turn-based roguelike about builds, risk, retreat and greed.**

[Play Dungeon Echo](https://play.91hwl.cn/dungeon-echo/) · [Play in English](https://play.91hwl.cn/dungeon-echo/?lang=en) · [Project page](https://91hwl.cn/toys/dungeon-echo/)

> **Status:** v1.1.0 is the current public release. `main` may contain post-v1.1 release-candidate UX, balance and localization work that has not been deployed yet. Existing browser saves remain compatible unless a release note explicitly says otherwise.

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
- Adaptive procedural BGM plus independent **Music / SFX 0–100%** controls.
- Desktop keyboard/mouse, native Gamepad API and mobile-first touch controls.
- Progressive onboarding that teaches mechanics when they become relevant.
- Chinese / English localization with automatic browser-language selection and an in-game language switch.

The project deliberately favors readable counterplay over hidden punishment, human playtesting over bot-only balance claims, and rollback-capable static releases over unnecessary infrastructure.

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
| Master mute | `M` | Sound settings |
| Fullscreen | `F` | Fullscreen |

Skills use mana. Each class has a different mana capacity, skill cost and recovery rhythm, so active skills are tactical resources rather than free cooldown buttons.

## Language

The production UI supports **中文 / English**.

- `?lang=en` opens the English presentation directly.
- `?lang=zh` opens Chinese directly.
- Without a language parameter, the browser language is used on first visit.
- A manual language switch is persisted locally.

Localization has one language owner (`i18n.js`) with dynamic followers rather than scattered language conditionals. Shell UI, controls, onboarding, sound settings, class identity, equipment, monsters, guardians/finale, town commerce, forging and high-value combat messages all follow the same reversible display-only contract; save/profile identities remain unchanged.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Repository layout

```text
.
├── index.html                  # production entry
├── game.js                     # core state / map / turn engine
├── combat-pressure.js          # readable deep-floor / guardian pressure
├── challenge-pressure.js       # mild human-play attack-pressure follow-up
├── combat-controls.js          # J/K controls + mana resource
├── i18n.js                     # Chinese / English language owner
├── i18n-runtime.js             # dynamic shell/help/accessibility follower
├── i18n-content.js             # display-only gameplay/content localization
├── audio-director.js           # adaptive BGM + Music/SFX mixer
├── mobile-ux.js                # mobile-first control layout
├── equipment-system.js         # equipment generation / fit / value
├── progression-system.js       # talents + skill evolution
├── town-system.js              # town progression / checkpoints
├── commerce-system.js          # finite supply stock and pricing
├── forge-system.js             # refinement / masterwork
├── content-system.js           # late-floor themes + guardian/finale states
├── visual-polish.js            # atmosphere + equipment/town presentation
├── profiles/                   # production + deterministic fixtures
├── art/                        # production art assets
├── test/                       # targeted deterministic contracts
├── docs/                       # focused gameplay / governance docs
└── ops/                        # file-upload release and rollback tooling
```

## Validation philosophy

Engineering checks protect contracts; they do **not** replace human playtesting.

High-value checks cover production entry, 1→100 descent, guardian state machines, skill evolution, save compatibility, deployment boundaries, input/mana, equipment art, mobile UX, localization and human-play pressure. GitHub Actions is not treated as the only release path; production uses a prepared file-upload / staging / checksum / atomic activation / rollback flow.

## Save compatibility

Progress is stored in browser `localStorage`. Normal static-file updates and hard refreshes do not remove saves. Clearing site data, changing browser profile/device, or changing storage origin can make local saves unavailable.

## AI-assisted development

OpenAI ChatGPT has been used as an AI engineering collaborator for repository inspection, systems analysis, debugging, regression strategy, gameplay/economy reasoning, deployment review, documentation, art integration, localization architecture and release governance.

The current refinement work was assisted by **GPT-5.6 Sol**. Product direction, acceptance decisions, deployment and final quality judgment remain human-controlled. Dungeon Echo is an independent project and is not an OpenAI product or endorsement.

See [`AI_COLLABORATION.md`](AI_COLLABORATION.md) for the collaboration record.

## Contributing

Focused issues and pull requests are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before large changes and [`MAINTENANCE.md`](MAINTENANCE.md) for the production contract.

## License

MIT — see [`LICENSE`](LICENSE).
