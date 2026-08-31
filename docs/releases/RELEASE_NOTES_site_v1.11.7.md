# 91hwl site v1.11.7

Security and authority-governance release.

- Removes personal contact identifiers from the public site/source tree.
- Routes sensitive vulnerability reports through the repository Security Policy; ordinary reproducible reports remain on GitHub Issues.
- Reads Dungeon Echo, Clock Out Alive and Board Trio versions from their canonical `VERSION` files instead of maintaining copied release literals in the site release chain.
- Carries component versions into the immutable home bundle as verification snapshots for deploy/health checks.
- Adds the shared play-release root allowlist so component deployments preserve only approved public siblings rather than cloning arbitrary prior-root files.

No gameplay rules are changed by this site/security release.
