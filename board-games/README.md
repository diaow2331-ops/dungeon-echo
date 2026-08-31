# 方寸棋局 · Board Trio

Three browser-native board games sharing one lightweight shell: Gomoku, Xiangqi and Go.

Current release: **v0.2.0**. Planned production route: `https://play.91hwl.cn/board-games/`.

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
