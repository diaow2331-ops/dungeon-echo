91hwl home mount · site v1.3.2

This package owns the product-facing static homepage and the two project detail pages only. It does not own either game runtime.

Presented releases:
- Dungeon Echo v1.2.6 — frozen accepted game boundary.
- Clock Out Alive v1.11.2 — current language/readability release.

site v1.3.2 keeps the product-first two-game presentation while unifying language and theme preferences across the homepage and project pages. Play links propagate the active language into each game route, so a Chinese site session opens a Chinese game session and an English site session opens an English one. A parent-domain preference cookie provides a non-sensitive cross-subdomain fallback while each page retains localStorage and URL-query fallbacks.

The site restores an explicit dark/light theme switch and normalizes the type scale: hero headings are less oversized, navigation and preference controls are easier to notice, and body/card text is more readable.

The bundle derives its previous-homepage overwrite guard from the actually deployed site v1.3.1 commit `830ebaf958e4bec71af085f0fa7897edbe8b007d`. Deployment backs up the current homepage/toys tree and restores it if Nginx validation or origin/public health checks fail.
