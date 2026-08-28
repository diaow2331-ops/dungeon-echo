91hwl home mount · site v1.3.4

This package owns the product-facing static homepage and the two project detail pages only. It does not own either game runtime.

Presented releases:
- Dungeon Echo v1.2.10 — final pre-launch input/responsive release.
- Clock Out Alive v1.11.5 — language/runtime consistency plus final narrow-screen responsive release.

site v1.3.4 is the public launch surface for the two-game release. It keeps the v1.3.3 prepaint language/theme behavior, typography ladder and no-auto-translate contract, then updates the product-facing versions and release copy for both games.

The homepage now exposes three first-screen conversion paths: play Dungeon Echo, play Clock Out Alive, or open the public GitHub source. The product standards section also calls out the open repository so traffic from external promotion can move directly from the site to source/release notes/issues.

Dungeon Echo's detail page now presents v1.2.10 and its final desktop one-shot input guard, 901–1180px laptop layout pass and minimum mobile touch targets. Clock Out Alive's detail page presents v1.11.5 and the finalized language fallback, repeat-input, Canvas/layout and mobile safe-area work.

Language/theme links continue to carry `?lang=` / `?theme=` explicitly, backed by the non-sensitive `.91hwl.cn` preference cookies and localStorage fallbacks.

Release safety pins the overwrite guard to the accepted site v1.3.3 boundary, packages native v1.3.4 deploy/health scripts, validates Dungeon Echo v1.2.10 and Moyu v1.11.5 origin/public VERSION endpoints, backs up the homepage/toys tree and rolls it back if Nginx validation or health checks fail.
