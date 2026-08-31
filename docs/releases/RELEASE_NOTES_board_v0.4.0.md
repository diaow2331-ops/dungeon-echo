# Board Trio v0.4.0 — Records & Clocks

This release builds on v0.3.0 without changing the established board-game rule engines.

- All three games generate a local per-move record from the same canonical history snapshots used by undo and Go scoring.
- The record supports direct jump-to-move, previous/next navigation, return to live play, and branching from a historical position.
- Branching truncates later history instead of creating a second state authority.
- Optional time controls are available before the first move: unlimited, 5 minutes per side, or 10 minutes per side.
- Only the side to move loses time. Pending placement remains part of thinking time; review and Go scoring agreement pause both clocks.
- Clock values are included in history snapshots, so undo and branch-from-review restore the corresponding remaining time.
- Timeout is a terminal loss and reuses the same match-result path as guarded resignation.
- v0.3.0 Go dead-group scoring, sequential score confirmation, resume play, whole-board repetition prevention and all existing Xiangqi/Gomoku rules remain intact.

This release still does not add AI, networking, Renju forbidden moves, Xiangqi tournament repetition adjudication or byo-yomi. Those remain separate policy/architecture decisions.
