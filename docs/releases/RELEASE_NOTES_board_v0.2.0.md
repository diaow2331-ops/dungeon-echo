# Board Trio v0.2.0 — Interaction Quality

This release keeps the v0.1.1 rule layer intact and improves how local two-player matches are operated.

- Preserve each in-page match when switching among Gomoku, Xiangqi and Go; Go sizes keep independent sessions.
- Add a precise hover/focus board cursor and keyboard play with arrow keys plus Enter/Space.
- Distinguish Xiangqi capture targets from ordinary legal destinations and surface illegal-move feedback.
- Guard restart behind a second click after play begins; disable unavailable undo/restart actions.
- Persist the sound preference locally and keep the current game/Go size in the URL.
- State Go's 7.5 komi and label two-pass scoring as an automatic current-position estimate.

No AI opponent, networking, account system or rule-engine rewrite is introduced in this release.
