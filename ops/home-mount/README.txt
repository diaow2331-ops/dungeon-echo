91hwl home mount · site v1.10.0

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. It does not own either playable game runtime.

Presented releases:
- Dungeon Echo v1.4.2 — a 100-floor browser-native turn-based roguelike with four classes, build choices and safe retreat.
- Clock Out Alive v1.26.5 — a four-minute office runner with unified perspective, readable desktop/fullscreen/mobile UI, four scenes and two endings.

site v1.10.0 keeps the accepted modern Chinese layout and updates the product surface to the current games. Clock Out Alive now uses a real v1.26.5 run capture across the homepage, project details and About; restrained divider, corner and seal-like ornaments add finish without returning to faux-classical copy or ornamental clutter.

About, Privacy and Contact use plain-language Chinese labels and distinct layouts. About is anchored by the two real game images; Privacy is a compact data explanation; Contact is a straightforward support panel. The underlying privacy, consent and feedback contracts are unchanged.

The shared CSS, JavaScript and homepage art live under /assets/site-v1100/. Language and theme continue to carry through explicit query parameters, non-sensitive .91hwl.cn preference cookies and localStorage. Scroll progress, back-to-top, the homepage chooser and trust-page controls are keyboard reachable and retain the no-account contract.

Release safety packages final static bytes plus isolated versioned assets, verifies SHA256 before writing, backs up all owned page and asset paths, validates Nginx, checks every public page and asset contract, and rolls back owned paths if validation fails.

- v1.10.0 refreshes Clock Out Alive to v1.26.5 everywhere, replaces the stale gameplay cover with a real current run capture, and adds a restrained editorial ornament layer while preserving the v1.9.0 information architecture.
- v1.8.0 added the mobile directory drawer, real Clock Out Alive gameplay cover and distinct record-page identities.
