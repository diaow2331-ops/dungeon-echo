# Board Trio v0.2.1 — Pointer Confirm

This patch corrects the primary control model introduced in v0.2.0 without changing board-game rules.

- Gomoku and Go: select an empty intersection first, then press `落子` to commit the move.
- The pending stone is a preview only; it does not advance turns or enter history until confirmed.
- `悔棋` cancels a pending selection before it rolls back a confirmed move.
- Xiangqi keeps the standard two-click flow: select a piece, then select a legal destination.
- Keyboard controls remain a secondary accessibility path and are no longer presented as the normal way to play.
- Existing in-page session preservation, sound preference, URL deep links, rule integrity and guarded restart remain intact.
