91hwl home mount · site v1.11.4

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. Playable game runtimes remain independently versioned under play.91hwl.cn.

Presented releases:
- Dungeon Echo v1.5.0 — a 100-floor browser-native turn-based roguelike with four classes, build choices and safe retreat.
- Clock Out Alive v1.26.5 — a four-minute office runner with readable desktop/fullscreen/mobile UI, four scenes and two endings.
- Board Trio / 方寸棋局 v0.2.1 — Gomoku, Xiangqi and Go in one responsive local two-player board-game shell.

site v1.11.4 keeps the current three-game composition, preserves Dungeon Echo v1.5.0 and refreshes Board Trio to v0.2.1 with explicit pointer-first move confirmation for Gomoku and Go. The hero, quick chooser and playable-games section present the same live three-game set.

Board Trio links directly to its playable route; Dungeon Echo and Clock Out Alive retain their project-detail records. About, Privacy and Contact keep their distinct plain-language layouts and existing privacy, consent and feedback contracts.

The shared CSS and JavaScript remain under /assets/site-v1110/ because this patch changes product/version content rather than the visual runtime. Language and theme continue through explicit query parameters, non-sensitive .91hwl.cn preference cookies and localStorage.

Release safety packages final static bytes plus isolated versioned assets, verifies SHA256 before writing, backs up all owned page and asset paths, validates Nginx, checks all public surfaces plus the three live game routes, and rolls back owned paths if validation fails.

- v1.11.4 refreshes Board Trio to v0.2.1 while preserving Dungeon Echo v1.5.0.
- v1.11.3 refreshes Board Trio to v0.2.0 while preserving Dungeon Echo v1.5.0.
- v1.11.2 refreshes Dungeon Echo to v1.5.0 while preserving Board Trio v0.1.1.
- v1.11.1 synchronizes the homepage with Board Trio v0.1.1.
- v1.11.0 introduced Board Trio as the third playable game and removed the old placeholder.
- v1.10.0 refreshed Clock Out Alive to v1.26.5 and its current gameplay cover.
