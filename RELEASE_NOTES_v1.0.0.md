# Dungeon Echo v1.0.0 — First Public Release

Dungeon Echo v1.0.0 is the first public static-site release of the complete **1 → 100 floor** production journey.

This release marks the point where the project became a coherent, deployable game rather than a collection of depth profiles and experimental systems: one public route, persistent long-run risk/reward progression, a deterministic release contract and a backend-free deployment path.

## What shipped

- One production journey from floor 1 through the floor-100 finale.
- Warrior, Ranger, Arcanist and Assassin, each with distinct combat rules, build preferences, selection art and in-dungeon silhouettes.
- Greedy Expedition: descend, collect loot, decide when to retreat, secure valuables in town, improve the build and push deeper again.
- Six equipment slots with class-aware generation/value, affixes and build-defining Epic/Legendary mechanic traits.
- Deterministic forging with a bounded +3 refinement choice and +5 masterwork completion.
- Conquered-depth checkpoints that reward progress without allowing unexplored content to be skipped.
- Town storage/bank, finite chapter-scaled supplies and a fortune-wheel lifecycle designed to avoid repeat-reward exploits.
- Ten-floor guardian cadence, late-floor themes and a complete final-heart / endless-echo resolution.
- Keyboard, mouse/touch and browser Gamepad API controls.
- Local, backend-free saves.
- First public title, class-selection, HUD, equipment and town visual pass.

## Release gates at v1.0.0

- Public production entry contract: **24/24**.
- Deterministic floor 1→100 victory chain: **13/13**.
- Historical gameplay and save regression suite: **525/525**.
- Static release allowlist and local-resource closure checks.
- Deployment staging, content verification and rollback checks.

These checks are engineering evidence for the release contract; they are not presented as a substitute for real-player balance and usability testing.

## Save compatibility

The game keeps compatible local saves in the browser. Invalid or incompatible run data fails closed instead of being executed as game state.

Clearing site data, using a different browser profile/device, or changing to a different storage origin can remove or isolate local progress. v1.0.0 does not provide cloud accounts or server-side save backup.

## Known limitations at release

- Save data is local to one browser profile/device.
- Long-run balance continues to be tuned from real-player evidence; simulation bots do not model every retreat, shopping and kiting decision.
- Milestone skill evolution remains post-launch work.
- Several ten-floor guardians still rely on combinations of shared mechanics rather than fully bespoke encounter state machines.
- The town contains the required economy/storage loop but still needs a stronger progression-hub identity.
- The first art pass is functional and coherent, but characters, enemies, bosses, equipment feedback and town presentation remain major post-launch polish targets.
- Gamepad support uses the browser Gamepad API and may vary by controller/browser mapping.

## Deployment

v1.0.0 is deployed as a dependency-free static game:

- **Play:** https://play.91hwl.cn/dungeon-echo/
- **Project page:** https://91hwl.cn/toys/dungeon-echo/

The repository deployment path uses immutable/static staging, expected-content verification and rollback-oriented health checks while preserving the existing Web Toys site tree.

## Development process note

Dungeon Echo was developed with AI-assisted engineering as part of the workflow. OpenAI ChatGPT was used for tasks including repository review, architecture reasoning, debugging, test strategy, gameplay/economy analysis, deployment review and documentation refinement. Product direction, acceptance decisions, merges and deployment remained under the repository maintainer's control.

This is an independent project and is not an OpenAI product or endorsement.
