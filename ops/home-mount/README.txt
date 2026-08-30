91hwl home mount · site v1.4.0

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. It does not own either playable game runtime.

Presented releases:
- Dungeon Echo v1.4.2 — fixed-viewport Echo Town with a larger 1120×460 walkable plaza and dedicated Plaza / Gear / Market / Tavern / Fortune / Depart pages.
- Clock Out Alive v1.17.0 — roughly four-minute pacing, four animated office scenes and a portrait-focused playfield that grows to 440px while physics stay unchanged.

site v1.4.0 keeps the accepted launch, social, AdSense and trust surfaces, then removes repetition from the product story. The first viewport now names the two games directly, shortens the lead, exposes current versions and follows with a compact choose-your-run comparison before the full project cards.

The playable interfaces on play.91hwl.cn remain outside the advertising surface. The homepage Privacy card links directly to the full privacy/consent explanation; reproducible game bugs continue to route to public GitHub Issues while site, collaboration and privacy matters can use email.

Language/theme links continue to carry `?lang=` / `?theme=` explicitly, backed by the non-sensitive `.91hwl.cn` preference cookies and localStorage fallbacks. The visible trust hub is bilingual and responsive, with a three-column desktop layout that collapses cleanly on tablet and mobile.

Release safety packages final static bytes only, verifies SHA256 before writing, backs up the currently live homepage/detail/trust paths, uses atomic file replacement, validates Nginx, checks the visible v1.4.0 trust hub plus Dungeon Echo v1.4.2 / Clock Out Alive v1.17.0 public contracts, and rolls back owned site paths if validation fails.
