# Board Trio v0.3.0 — Match Mechanics

This release preserves the v0.2.1 control model and closes the largest rules-loop gaps in local play.

- Go enters a scoring agreement phase after two consecutive passes instead of immediately declaring an estimated winner.
- Connected stone groups can be marked dead or restored; the live score preview uses the board after those agreed removals.
- Black and White confirm scoring in sequence. Any dead-group change restarts the approval cycle.
- Players can resume Go before final confirmation without consuming a move-history slot.
- Go rejects moves that recreate any earlier whole-board position in the current game, while retaining immediate-ko feedback for direct recapture.
- Gomoku, Xiangqi and Go all gain guarded resignation; the side to move resigns and the opponent receives the result.

This release intentionally does not add Renju forbidden moves, Xiangqi tournament repetition adjudication, AI opponents, networking, or clocks. Those require separate rule-policy decisions rather than opportunistic patches.
