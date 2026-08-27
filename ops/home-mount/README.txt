91hwl home mount · site v1.3.1

This package owns the product-facing static homepage and the two project detail pages only. It does not own either game runtime.

Presented releases:
- Dungeon Echo v1.2.6 — frozen accepted game boundary.
- Clock Out Alive v1.11.1 — current visual cleanup release.

site v1.3.1 removes the public governance/development-log framing and presents the two games directly. Dungeon Echo uses shipped game art; Clock Out Alive uses its 14:00 → 18:00 route identity instead of an artificial character illustration.

The bundle derives its previous-homepage overwrite guard from the actually deployed site v1.3.0 commit `8d6b1a151621484a1a0d2a0655913066ea59aec4`. Deployment backs up the current homepage/toys tree and restores it if Nginx validation or public health checks fail.
