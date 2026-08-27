91hwl home mount · site v1.3.3

This package owns the product-facing static homepage and the two project detail pages only. It does not own either game runtime.

Presented releases:
- Dungeon Echo v1.2.7 — current ownership/release-coherence boundary.
- Clock Out Alive v1.11.3 — current first-paint/typography release.

site v1.3.3 removes the remaining first-paint inconsistency. Language and theme preferences are resolved in the document head before the main CSS/UI paints, so a stored or explicit English/light choice no longer first flashes the default Chinese/dark state. The pages also carry `translate="no"` / `notranslate` markers so browser auto-translation does not rewrite a deliberately selected English page back into Chinese.

The homepage and both detail pages share one typography ladder: small supporting copy, navigation/controls, body copy, card headings, section headings and hero headings each use a bounded scale instead of ad-hoc sizes. The light theme uses the same hierarchy rather than relying on browser/default contrast.

Language/theme links continue to carry `?lang=` / `?theme=` explicitly, backed by the non-sensitive `.91hwl.cn` preference cookies and localStorage fallbacks.

Release safety deliberately reuses the field-tested site v1.3.2 deploy/health template. The builder deterministically adapts the final bundle's release markers to site v1.3.3, Dungeon Echo v1.2.7 and Moyu v1.11.3, updates the v1.3.3 42px control-size health contract, syntax-checks the bundled scripts, and derives the homepage overwrite guard from the actually deployed site v1.3.2 commit `e15ac9959687dbd47457cd650a0e96f008c151c5`. Deployment still backs up the homepage/toys tree and rolls it back if Nginx validation or origin/public health checks fail.
