# 方寸棋局 · Board Trio

Three browser-native board games sharing one lightweight shell: Gomoku, Xiangqi and Go.

Current release: **v0.7.0**. Planned production route: `https://play.91hwl.cn/board-games/`.


## v0.7.0 dual-end experience release

- Reorganizes live match data into a stable HUD: current game/status and AI state on the left, move count and Go capture totals in the center, actions on the right, and clocks/audio/time controls in their own compact row.
- Desktop, portrait mobile and mobile landscape now use different density rules instead of stretching one layout across every viewport. Mobile uses one-line top navigation, compact game tabs, larger touch targets and a denser action grid.
- AI setup remains visible before a match, then collapses on mobile after Start so the board reaches the viewport sooner; Restart restores the setup gate. Local two-player setup remains visible.
- Notifications are overlayed above the board instead of entering document flow, eliminating layout jumps when selecting a point, starting a match, capturing, undoing or receiving rule feedback.
- Fullscreen and short landscape modes reserve board space from the real available height, while clocks, capture totals and primary actions remain readable. Reduced-motion users no longer receive capture/check animations.

## v0.6.3 Go capture feedback release

- Go captures now expose the exact removed-stone coordinates from the rule engine, allowing the UI to animate captured stones fading/lifting away from their original intersections.
- A local `提 N / Capture N` badge appears at the played point for a capture, while persistent Black/White capture counters remain visible beside the clocks, including fullscreen play.
- Rules remain Chinese area scoring with 7.5 komi, suicide prohibition, whole-board repetition prevention, two-pass scoring entry and dead-group confirmation. Capture counts are informational under area scoring and do not change the final score.

## v0.6.2 settings and audio control release

- AI matches now wait at a setup gate instead of letting a persisted “play second” preference trigger an immediate computer opening move. Choose mode, difficulty, side and clock first, then press Start match.
- A one-time match-settings schema migration discards pre-v0.6.2 side/mode preferences that could conflict with the new start flow.
- Clear data is a guarded two-click action scoped to `board-trio-*` storage; it also clears in-page saved matches and restores AI / Normal / play-first defaults.
- Background music now has a persistent 0–100% volume slider. The existing Music On/Off control remains, and move sounds follow the same volume level.
- Fullscreen keeps the setup row visible while an AI match is waiting to start, then returns to the compact immersive layout after Start match.

## v0.6.1 fullscreen / Xiangqi polish

- Fullscreen notices are now visual overlays instead of grid rows, so selecting a pending Gomoku/Go move no longer changes the fullscreen board height or makes the page jump.
- Xiangqi now draws the previous move source/target, animates a calligraphic `吃` at the captured square, and shows `将` on a non-capturing check.
- Xiangqi position identity is tracked with side-to-move; a third neutral repetition is a draw, while a third repeated checking position is treated as a perpetual-check violation by the checking side.
- Existing self-check, flying-general, checkmate, stalemate, clocks, replay and local AI behavior remain intact.

## v0.6.0 bilingual immersive release

- Complete Chinese / English UI switch covers setup, clocks, status, notices, review controls and accessibility labels; the language preference persists locally.
- A visible Home control returns directly to 91hwl.cn from the game interface.
- Fullscreen mode uses the browser Fullscreen API and collapses explanatory sections so the board, match controls and clocks receive the viewport.
- Canvas sizing becomes fullscreen-height-aware, including the taller Xiangqi board and narrow mobile screens.
- A low-volume procedural pentatonic background score provides a calm, classical atmosphere without downloading audio assets or calling an API; it starts only after user interaction and follows the persisted sound preference.

## v0.5.0 local AI release

- Human-versus-computer is the first-run default; same-device local two-player remains available from the match selector.
- All three games provide three browser-local difficulty levels: Easy / 入门, Normal / 标准 and Hard / 困难.
- Gomoku combines immediate win/block safety, line-shape scoring and a deeper reply-aware hard level.
- Xiangqi generates moves through the canonical rule engine and scales from tactical move choice to time-bounded alpha-beta search.
- Go evaluates captures, liberties, group rescue, atari pressure, eye filling and opening shape; Hard also predicts the opponent's best local reply.
- AI search runs in a Web Worker, so difficult Xiangqi and 19×19 Go thinking does not freeze pointer, touch or clock rendering.
- No API, account, model download or network request is used. AI mode supports playing either side and undo rolls back a complete human/computer round.

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
