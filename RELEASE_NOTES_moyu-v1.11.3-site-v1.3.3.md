# 91hwl site v1.3.3 + Clock Out Alive v1.11.3

This web release is paired with Dungeon Echo v1.2.7 so the public project pages, game endpoints and deployment bundles share one repository revision.

## 91hwl site v1.3.3

- Resolve persisted/query/browser locale before first paint to avoid a visible Chinese→English language flash.
- Resolve theme before first paint using the same shared preference contract.
- Mark public pages as `notranslate` / `translate="no"` so browser auto-translation does not compete with the site's own bilingual UI.
- Normalize homepage, game-detail and supporting-copy typography/control sizing.
- Keep locale/theme propagation on cross-surface links.
- Update Dungeon Echo project metadata and visible version copy to **v1.2.7**.
- Preserve deterministic home-page overwrite protection against the accepted site v1.3.2 boundary.

## Clock Out Alive / 摸鱼到下班 v1.11.3

- Add locale/theme prepaint and explicit browser-translation ownership.
- Add the v1.11.3 visual/type-scale layer.
- Keep the existing v1.11.1 and v1.11.2 runtime patches, then build v1.11.3 deterministically from the tracked 15-part source.
- Preserve checksum verification for the base and intermediate runtime.
- Preserve locale propagation back to the 91hwl home surface.
- Keep deployment rollback plus origin/public health checks.

## Unified release builder

`ops/release/build-web-toys-release.sh` now requires:

- Dungeon Echo **v1.2.7**;
- Clock Out Alive **v1.11.3**;
- 91hwl site **v1.3.3**;
- the `v1.2.7` tag to point at the exact checked-out revision.

Only then does it build the Dungeon Echo, Moyu and site bundles together.

## Completion rule

Repository merge/tag is not treated as deployment evidence. Release hygiene remains open until the deployment host builds the bundles, deploys them, produces real origin/public PASS markers and the public desktop/mobile surfaces are checked by a human.
