91hwl home mount · site v1.7.0

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. It does not own either playable game runtime.

Presented releases:
- Dungeon Echo v1.4.2 — a 100-floor browser-native turn-based roguelike with four classes, build choices and safe retreat.
- Clock Out Alive v1.22.0 — a four-minute office escape with four scenes, two endings and browser-local discoveries.

site v1.7.0 turns the Chinese styling into a complete cross-site design language. The homepage now uses a public-domain 1668 Wang Jian landscape leaf, folio structure, title slips, cinnabar seals and restrained pattern bands, plus an interactive mood-based game chooser. The two live games remain equally weighted and the third “敬请期待” place remains deliberately open.

About, Privacy and Contact are rebuilt as bilingual records rather than generic cards. Privacy distinguishes 91hwl.cn preferences from play.91hwl.cn game saves, exposes the current preference state, and provides a narrowly scoped preference reset. Contact now routes reproducible reports, private matters and public discussion separately, with a safe copy-email action.

The shared CSS and JavaScript live under /assets/site-v170/. Language and theme continue to carry through explicit query parameters, non-sensitive .91hwl.cn preference cookies and localStorage. Scroll progress, back-to-top, the homepage chooser and trust-page controls are keyboard reachable and retain the no-account contract.

Release safety packages final static bytes plus isolated versioned assets, verifies SHA256 before writing, backs up all owned page and asset paths, validates Nginx, checks every public page and asset contract, and rolls back owned paths if validation fails.
