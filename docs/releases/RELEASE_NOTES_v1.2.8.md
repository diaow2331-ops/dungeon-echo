# Dungeon Echo v1.2.8

v1.2.8 is an English-locale completeness and pre-deployment robustness hotfix on top of v1.2.7.

## Fixed

- English dungeon sessions no longer allow equipment slot labels to fall back to Chinese after the core renderer updates the existing slot nodes.
- Dynamic Adventure Log, status, combat feedback, title/save summary and pause text now stay in the selected English locale after in-place runtime rewrites.
- Mixed fragments such as `Cask裂开，滚出 10 Gold.` and `Picked up 一瓶Healing Potion.` are normalized into complete English sentences.
- Legacy core hints are normalized to the actual production controls: **J Attack / K Skill**, not the retired C-skill / J-quick-dive wording.
- The English gameplay header no longer appends the Chinese `地牢回响` subtitle beside `Dungeon Echo`.
- Malformed or HTML-like Dungeon Echo run/meta blobs are rejected before `game.js` restores them, preventing corrupted local saves from reaching legacy HTML interpolation paths or invalid map/coordinate state.
- The core `game.js` HTML escaping helper now encodes ampersands, angle brackets and quotes correctly across Adventure Log, backpack labels, shops, achievements and town inventory rendering.
- Greedy Expedition town saves now restore the internal `town` state as well as the visible screen, sanitize the meta economy before rendering, and write the repaired meta back immediately.
- PC gamepads now expose **RT Attack**, matching the authoritative keyboard **J Attack** path instead of leaving controller users unable to attack after facing an enemy; connection and hold-to-return feedback also follows the selected Chinese/English locale.
- The floor-100 leave/stay choice is state-guarded: leaving wins, staying persists Endless Echo and enters floor 101, and delayed duplicate choices cannot resurrect or overwrite the settled state.

## Implementation

- Adds `locale-completeness-v128.js` after the stable `locale-runtime-v122.js` owner.
- Watches only dynamic presentation roots such as stats, stage feedback, equipment, Adventure Log, backpack, title/pause screens and town/service panels.
- Observes `characterData` as well as newly inserted nodes so in-place renderer updates cannot reintroduce Chinese text.
- Keeps empty equipment labels explicitly English while equipped items retain their localized item names.
- Adds `save-integrity-system.js` as a synchronous pre-game owner between the production profile and `game.js`.
- The integrity guard only inspects `de-run-v6`, `de-greedy-meta-v1` and the Greedy toggle; valid compatible saves remain byte-for-byte untouched.
- Legacy v2 classic saves without a `mode` field remain supported, and arbitrary safe run seeds remain allowed because seeds do not enter HTML sinks.
- Keeps the integrity guard as structural defense in depth while fixing the shared `esc()` helper at the actual rendering boundary.
- Rejects impossible classic-mode `town` blobs while preserving compatible Greedy town saves.
- Extends focused production/endgame/input coverage to town reload repair, both floor-100 outcomes, floor 101, RT attack edge semantics and current touch hold cadence.
- Neither v1.2.8 owner uses polling.

## Release contract

- Production cache generation is `128`.
- The release bundle must contain both `locale-completeness-v128.js` and `save-integrity-system.js`.
- The save-integrity owner must load before `game.js`; the locale-completeness owner must load after the stable locale owner.
- Deployment rejects a v1.2.8 package if these ordering, runtime-scope, town-resume, core escaping or gamepad attack/English-status contracts are absent.
- `v1.2.7` remains immutable; v1.2.8 receives its own release stamp and tag.

## Verification required

Repository/static checks are not human-browser evidence. Focused deterministic Node contracts are the recorded repository evidence; no GitHub Actions PASS is claimed while the current Actions allowance is unavailable. Before calling v1.2.8 complete, run the focused save/localization tests and release tests on the deployment host, then verify a real `?lang=en` session on desktop and mobile, including equipment labels and several newly generated Adventure Log messages.
