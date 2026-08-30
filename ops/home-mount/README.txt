91hwl home mount · site v1.5.0

This package owns the product-facing 91hwl.cn homepage, project detail pages and public trust surfaces. It does not own either playable game runtime.

Presented releases:
- Dungeon Echo v1.4.2 — fixed-viewport Echo Town with a larger 1120×460 walkable plaza and dedicated Plaza / Gear / Market / Tavern / Fortune / Depart pages.
- Clock Out Alive v1.22.0 — expanded four-scene 8-bit music, route pickups, clearer jump/hazard presentation and corrected English-mode keyboard behavior.

site v1.5.0 recasts the homepage as a restrained Chinese editorial folio: warm paper, ink, cinnabar seals, Song-style typography and square-framed controls replace the generic product-card language. The first viewport becomes a compact game index; the main game shelf presents both playable releases and a deliberate third "敬请期待" slot for the next title.

The playable interfaces on play.91hwl.cn remain outside the advertising surface. The homepage Privacy card links directly to the full privacy/consent explanation; reproducible game bugs continue to route to public GitHub Issues while site, collaboration and privacy matters can use email.

Language/theme links continue to carry `?lang=` / `?theme=` explicitly, backed by the non-sensitive `.91hwl.cn` preference cookies and localStorage fallbacks. The bilingual editorial layout keeps its hierarchy on desktop, collapses the two live games plus future slot cleanly on smaller screens, and leaves About / Privacy / Contact visible before the closing footer.

Release safety packages final static bytes only, verifies SHA256 before writing, backs up the currently live homepage/detail/trust paths, uses atomic file replacement, validates Nginx, checks the v1.5.0 Chinese editorial homepage and future-game slot plus Dungeon Echo v1.4.2 / Clock Out Alive v1.22.0 public contracts, and rolls back owned site paths if validation fails.
