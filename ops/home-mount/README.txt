91hwl home mount · site v1.3.5

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. It does not own either playable game runtime.

Presented releases:
- Dungeon Echo v1.2.12 — complete art-closeout hot update: guardians/final boss, terrain materials, town NPCs, directional combat FX and four-facing hero art, with gameplay/save contracts preserved.
- Clock Out Alive v1.11.5 — language/runtime consistency plus the finalized narrow-screen responsive release.

site v1.3.5 keeps the v1.3.4 launch, social-card, AdSense and trust-page work, then promotes About / Privacy / Contact from a tiny footer-only navigation into a visible homepage information hub. The homepage now explains site identity, privacy/advertising behavior and contact channels at normal reading size, including the public contact email diaow2331@gmail.com.

The playable interfaces on play.91hwl.cn remain outside the advertising surface. The homepage Privacy card links directly to the full privacy/consent explanation; reproducible game bugs continue to route to public GitHub Issues while site, collaboration and privacy matters can use email.

Language/theme links continue to carry `?lang=` / `?theme=` explicitly, backed by the non-sensitive `.91hwl.cn` preference cookies and localStorage fallbacks. The visible trust hub is bilingual and responsive, with a three-column desktop layout that collapses cleanly on tablet and mobile.

Release safety packages final static bytes only, verifies SHA256 before writing, backs up the currently live homepage/detail/trust paths, uses atomic file replacement, validates Nginx, checks the visible v1.3.5 trust hub plus Dungeon Echo v1.2.12 / Clock Out Alive v1.11.5 public contracts, and rolls back owned site paths if validation fails.
