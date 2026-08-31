# 方寸棋局 · Board Trio

Three browser-native board games sharing one lightweight shell: Gomoku, Xiangqi and Go.

Current release: **v0.4.0**. Planned production route: `https://play.91hwl.cn/board-games/`.

## v0.4.0 record and clock release

- Gomoku, Xiangqi and Go now generate a per-move local record from the same canonical history snapshots used for undo and scoring.
- Players can jump to prior positions, step backward/forward, return to the live position, or branch from a historical move; branching truncates the later record instead of creating a second board authority.
- Optional time controls are available before the first move: unlimited, 5 minutes per side, or 10 minutes per side.
- Only the side to move loses clock time. Pending placement still consumes thinking time; review and Go scoring agreement pause both clocks.
- Clock values are stored in history snapshots, so undo and branch-from-review restore the corresponding remaining time.
- Timeout is a terminal loss and uses the same result flow as resignation; existing v0.3.0 Go scoring/repetition rules remain intact.

## v0.3.0 game-mechanics release

- Go no longer ends immediately after two passes. It enters a scoring phase where connected dead groups can be marked or restored.
- Black and White confirm the scoring position in sequence; any dead-group change resets the approval cycle.
- Either side can resume play before final score confirmation without consuming a move-history slot.
- Go rejects recreation of any earlier whole-board position in the current game, while preserving the immediate-ko explanation for direct recapture.
- All three games now support guarded resignation; the side to move resigns and the opponent receives the result.
- The v0.2.1 pointer-first placement model remains unchanged for Gomoku and Go; Xiangqi remains piece-then-destination.

## v0.2.1 pointer-confirm patch

- Gomoku and Go now use an explicit two-step move flow: select an intersection first, then press `落子` to commit it.
- The selected point remains a visible pending preview and does not enter move history until confirmed.
- Undo cancels an unconfirmed selection first; only confirmed moves count as actual history.
- Xiangqi keeps its natural piece-first flow: select a piece, then select a legal destination. No extra confirmation click is added.
- Keyboard input remains available as a secondary accessibility path, but is no longer advertised as the primary control model.


## v0.2.0 interaction quality release

- Switching among Gomoku, Xiangqi and Go now preserves each in-page match instead of silently resetting it; Go board sizes keep separate sessions.
- Mouse/pen hover and keyboard focus expose a precise board cursor; arrow keys move it and Enter/Space plays at the focused point.
- Xiangqi legal destinations distinguish normal moves from captures, while illegal attempts and terminal states receive visible feedback.
- Undo/restart availability is explicit, and restart uses a bounded second-click guard once a match has begun.
- Go status now states 7.5 komi and labels the automatic two-pass result as a current-position estimate.
- Sound preference persists locally, and the URL follows the selected game/Go board size for reloadable deep links.

## v0.1.1 rule integrity patch

- Xiangqi stalemate / 困毙 is now correctly a loss for the side with no legal move, not a draw.
- Gomoku now resolves a completely filled board without a five-in-a-row as a draw.
- Existing movement, Go capture/ko/scoring and responsive controls are unchanged.

## v0.1.0 rules

- Gomoku: 15×15 freestyle; first line of five or more wins.
- Xiangqi: full basic piece movement, horse-leg and elephant-eye blocking, cannon screens, palace/river constraints, flying generals and self-check rejection.
- Go: selectable 9×9 / 13×13 / 19×19 boards, captures, suicide prevention, simple ko, pass, two-pass finish and Chinese-area scoring with 7.5 komi.
- Shared: local two-player play, undo, guarded restart, responsive pointer/touch/keyboard input and lightweight procedural move sound.

The implementation is original to this repository. Design and rules layering were informed by established public projects including `official-pikafish/Pikafish`, `xqbase/xqwlight`, `SabakiHQ/Sabaki`, `aprescott/tenuki` and `junxiaosong/AlphaZero_Gomoku`; no source files are vendored from them.
