# Dungeon Echo v1.2.1 — Language & Hint Stability Hotfix

v1.2.1 is a focused post-v1.2.0 UX hotfix. It does not change combat numbers, mana values, loot, economy, save schema, art assets or the 1→100 route.

## Language selection is now title-screen only

v1.2.0 allowed the language owner to hot-switch a live run. Human testing showed that translating the active HUD, log, Canvas text and dynamic systems at the same time could stall the interface.

v1.2.1 changes the player-facing contract:

- language choice appears on the game title screen as **中文 / English**;
- the old in-run header language button is hidden and removed from normal keyboard navigation;
- choosing a language persists the preference, updates `?lang=en` / `?lang=zh`, and reloads the page into that locale;
- the current run/save remains in browser storage and is not migrated or rewritten;
- public callers of the language setter follow the same reload semantics.

This deliberately favors a stable single-language page session over live whole-run translation.

## English consistency fixes

Human screenshots exposed high-frequency mixed strings such as translated monster/equipment names embedded inside untranslated Chinese log grammar.

The hotfix adds a narrow display-only repair follower for:

- incoming/outgoing hit messages;
- equipment actions;
- Gold pickup lines;
- elite/kill/XP lines;
- empty equipment-slot labels;
- the persistent descend/movement hint.

The repair operates on displayed text only. Saved item names, monster IDs, profile IDs and run/meta objects remain unchanged.

## Skill tutorial and routine feedback

- the first real successful skill-cost feedback explicitly completes the tutorial Skill step;
- repeated successful skill-cost toasts are suppressed after the first one;
- mana bar, skill cooldown and insufficient-mana feedback remain visible and authoritative;
- completed J/K onboarding no longer needs repeated routine hotkey reminders.

## Compatibility

- Existing `de-run-v6` version-2 run saves remain compatible.
- Existing `de-greedy-meta-v1` town/meta saves remain compatible.
- No storage reset or migration is required.
- Public URLs remain unchanged.

## Validation note

This hotfix is intentionally narrow and includes targeted static contracts for title-only language routing, mixed-log repair, release-manifest inclusion and repeated skill-feedback suppression. No fresh complete GitHub Actions suite is claimed.

## Deployment target

- Game: `https://play.91hwl.cn/dungeon-echo/`
- English: `https://play.91hwl.cn/dungeon-echo/?lang=en`
- Project: `https://91hwl.cn/toys/dungeon-echo/`
- Version: **1.2.1**
