91hwl home mount · site v1.11.0

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. Playable game runtimes remain independently versioned under play.91hwl.cn.

Presented releases:
- Dungeon Echo v1.4.2 — a 100-floor browser-native turn-based roguelike with four classes, build choices and safe retreat.
- Clock Out Alive v1.26.5 — a four-minute office runner with readable desktop/fullscreen/mobile UI, four scenes and two endings.
- Board Trio / 方寸棋局 v0.1.0 — Gomoku, Xiangqi and Go in one responsive local two-player board-game shell.

site v1.11.0 replaces the old third-game placeholder with the live Board Trio release. The homepage hero, quick chooser and playable-games section now present all three games while preserving the accepted modern Chinese visual system.

Board Trio links directly to its playable route in this first site release; Dungeon Echo and Clock Out Alive retain their project-detail records. About, Privacy and Contact keep their distinct plain-language layouts and existing privacy, consent and feedback contracts.

The shared CSS and JavaScript now live under /assets/site-v1110/. Language and theme continue through explicit query parameters, non-sensitive .91hwl.cn preference cookies and localStorage. The chooser now supports all three games and random selection is three-way.

Release safety packages final static bytes plus isolated versioned assets, verifies SHA256 before writing, backs up all owned page and asset paths, validates Nginx, checks all public surfaces plus the three live game routes, and rolls back owned paths if validation fails.

- v1.11.0 adds Board Trio v0.1.0 to the product surface and removes the stale “next game” placeholder.
- v1.10.0 refreshed Clock Out Alive to v1.26.5 and added the current gameplay cover and restrained editorial ornament layer.