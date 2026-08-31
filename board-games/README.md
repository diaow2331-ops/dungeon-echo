# 方寸棋局 · Board Trio

Three browser-native board games sharing one lightweight shell: Gomoku, Xiangqi and Go.

Current release: **v0.1.0**. Planned production route: `https://play.91hwl.cn/board-games/`.

## v0.1.0 rules

- Gomoku: 15×15 freestyle; first line of five or more wins.
- Xiangqi: full basic piece movement, horse-leg and elephant-eye blocking, cannon screens, palace/river constraints, flying generals and self-check rejection.
- Go: selectable 9×9 / 13×13 / 19×19 boards, captures, suicide prevention, simple ko, pass, two-pass finish and Chinese-area scoring with 7.5 komi.
- Shared: local two-player play, undo, restart, responsive mouse/touch input and lightweight procedural move sound.

The implementation is original to this repository. Design and rules layering were informed by established public projects including `official-pikafish/Pikafish`, `xqbase/xqwlight`, `SabakiHQ/Sabaki`, `aprescott/tenuki` and `junxiaosong/AlphaZero_Gomoku`; no source files are vendored from them.
