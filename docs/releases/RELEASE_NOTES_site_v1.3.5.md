# 91hwl site v1.3.5

91hwl site v1.3.5 is a homepage trust-and-discoverability patch. It keeps Dungeon Echo v1.2.11 and Clock Out Alive v1.11.5 unchanged.

## What changed

- Promotes About, Privacy and Contact from a tiny footer-only navigation into a full-width homepage information hub.
- Gives site identity, privacy/advertising behavior and contact channels normal reading hierarchy instead of 12px legal-link treatment.
- Shows `diaow2331@gmail.com` directly in the homepage Contact card while keeping GitHub Issues as the preferred public channel for reproducible game bugs.
- States clearly that the playable interfaces on `play.91hwl.cn` are not advertising surfaces.
- Keeps the visible hub bilingual and responsive: three columns on desktop, two on tablet and one on narrow screens.
- Retains the existing About, Privacy, Contact, `ads.txt`, AdSense client, social cards, language/theme carry and rollback-safe main-site deployment.

## Release boundary

- Site: v1.3.5
- Dungeon Echo: v1.2.11
- Clock Out Alive: v1.11.5
- Game runtime files are not changed by this site patch.

## Deployment contract

The immutable site bundle must contain final static bytes, `VERSION`, `REVISION`, `SHA256SUMS`, deploy logic and health checks. Production verifies checksums, backs up every site-owned path, atomically installs the bundle, validates Nginx and rolls back if the v1.3.5 public contract fails.
