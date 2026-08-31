# Current public releases

This file is the repository-level pointer to the releases currently presented by 91hwl. Component version files remain the machine-readable authorities.

| Surface | Current version | Canonical version file | Canonical builder |
| --- | --- | --- | --- |
| Dungeon Echo | v1.4.2 | `VERSION` | `ops/release/build-site-bundle.sh` |
| Clock Out Alive / 摸鱼到下班 | v1.26.5 | `moyu/VERSION` | `ops/release/build-moyu-bundle.sh` |
| 91hwl public site | v1.10.0 | `ops/home-mount/SITE_VERSION` | `ops/release/build-home-mount-bundle.sh` |

`ops/release/build-web-toys-release.sh` and `ops/release/build-public-release-zip.sh` are aggregate entry points. They read the three canonical version files instead of owning duplicate release numbers.

Historical builders such as `build-home-v140.cjs`, `build-home-v150.cjs`, `build-site-v180.cjs` and `build-site-v190.cjs` are ordered migration stages used to transform the accepted static-site baseline. Their older embedded versions are historical inputs, not current release authority.

Production is an artifact activation target, not a build machine. Build and checksum the component bundles first; deployment scripts activate those exact bytes and run their own health contracts.