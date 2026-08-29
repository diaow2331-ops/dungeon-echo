# Clock Out Alive / 摸鱼到下班 v1.12.2

v1.12.2 completes the first replay-feedback step after the v1.12.1 scene/risk patch. It adds no account system, RPG progression or permanent power.

## Last Run Summary

Every completed run now records and renders: outcome / cause, office clock and scene, score distance, peak Combo, near-misses, Perfect near-misses and discoveries unlocked during the run. The game-over card and both 18:00 ending cards also surface peak Combo and near-miss counts immediately.

## Local Top 5

The browser stores up to five completed runs. Ranking is deterministic: score distance first, then peak Combo, Perfect near-misses, total near-misses and recency. A separate last-run record remains visible even if that run did not enter the Top 5.

All data stays in localStorage; no login or server dependency is introduced. The ledger sits below the play surface so v1.12.0 viewport-first gameplay remains unchanged.

## Next boundary

The next P1 item is to evaluate a deterministic Daily Shift using a fixed daily seed and one office modifier. P2 fast-fall remains blocked on real human-play evidence.

## Focused acceptance

The candidate passed the canonical release contract and headless Chrome at 1600×761 desktop and 390×844 portrait mobile. A deterministic six-run browser probe verified Top 5 truncation and ranking, preservation of a separate last-run summary, responsive ledger rendering, no horizontal overflow and preservation of the v1.12.0 first-viewport game frame.
