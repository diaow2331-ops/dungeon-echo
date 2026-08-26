# Human 1→100 Playtest Baseline

This document defines the manual-play evidence format for the post-v1.1 stabilization audit tracked by Issue #7.

Automated regression, deterministic guardian tests and simulations remain engineering evidence. They do not replace real-player observations about retreat timing, resource pressure, readability, build decisions or long-run fatigue.

## Test boundary

Record the exact public version and commit when known. Do not mix observations from different commits into one baseline without labeling the boundary.

Preferred desktop evidence targets:

- 1920×1080 keyboard/mouse;
- 1366×768 keyboard/mouse;
- a current Chromium-family browser;
- Gamepad evidence only when specifically validating controller behavior.

Other browsers/displays are useful, but should be identified explicitly.

## Minimum class coverage

Before closing the umbrella audit, collect representative manual evidence for all four classes:

| Class | 1–10 | 20–30 | 50–60 | 80–90 | 91–100 | Full-run conclusion |
| --- | --- | --- | --- | --- | --- | --- |
| Warrior | pending | pending | pending | pending | pending | pending |
| Ranger | pending | pending | pending | pending | pending | pending |
| Arcanist | pending | pending | pending | pending | pending | pending |
| Assassin | pending | pending | pending | pending | pending | pending |

A single full 1→100 run may supply several bands, but focused reruns are expected when a breakpoint is found.

## What to record

For each run or focused band, record:

1. Version/commit, browser, display, input method and seed when available.
2. Class, key equipment mechanic traits, forge/refinement route and milestone skill choices.
3. Potions, normal scrolls and return scrolls consumed.
4. Gold earned, major purchases, forge spend and other meaningful sinks.
5. Return-to-town timing and why the player chose to return or continue.
6. Major damage spikes, deaths and primary failure causes.
7. Guardian tells that were clear, unclear, avoidable, unavoidable or geometry-sensitive.
8. Tactics/builds that became mandatory, irrelevant, effectively invulnerable, infinite-sustain or automatic-clear.
9. Any buy→sell, forge→sell, checkpoint-farm, death-reset or wheel-reset behavior that looks more profitable than normal exploration.
10. One short conclusion: what decision felt good, and what breakpoint most needs repair.

Use the dedicated `Human 1→100 playtest evidence` issue form for individual reports.

## Decision rules

- Fix structural breakpoints before changing global player/enemy numbers.
- Prefer targeted floor/class/mechanic fixes over broad repeated nerfs or buffs.
- Do not tune from one anomalous seed without reproducing the underlying pattern.
- Do not add a new currency, reroll layer, hotkey or save migration merely to solve a local balance defect.
- Keep `classic-100`, current run/meta save compatibility and the static deployment contract stable unless the evidence proves they are the blocker.
- Treat simulation as supporting diagnosis only; a bot win rate is not evidence that retreat timing, shop decisions or guardian telegraphs feel good to a human.

## Umbrella acceptance

Issue #7 can close only when:

- all four classes have representative long-run manual evidence;
- Issues #3, #4, #5, #10 and #11 are closed or have explicitly accepted residual limitations;
- no stable economy exploit dominates ordinary exploration;
- no common build/skill route trivializes the guardian chain;
- guardian counterplay remains readable and plausible under generated geometry;
- 30 / 60 / 90 / 100 do not contain unexplained difficulty cliffs;
- returning to town remains situational and meaningful rather than rote or irrelevant;
- the final validated commit/release candidate is recorded.

## Final baseline summary

When the audit is complete, replace `pending` cells in the coverage matrix with links to the corresponding playtest issues or comments, then add a compact final section covering:

- strongest and weakest class-specific findings;
- economy findings;
- guardian/readability findings;
- equipment and skill-route findings;
- targeted patches made;
- accepted residual risks;
- exact commit/release candidate validated.
