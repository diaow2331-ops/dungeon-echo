# Clock Out Alive v1.11.2 + 91hwl site v1.3.2

This is a cross-surface consistency and readability patch. Dungeon Echo gameplay remains frozen at v1.2.6.

## One language across the path

The previous site, project pages and games each owned separate local preferences. Because `91hwl.cn` and `play.91hwl.cn` are different origins, localStorage alone could not make a Chinese homepage reliably open a Chinese game.

v1.3.2/v1.11.2 establish one preference path:

1. explicit `?lang=zh|en` query;
2. non-sensitive `91hwl_lang` cookie scoped to `.91hwl.cn`;
3. localStorage fallback;
4. browser language fallback.

Homepage and project-page play links carry the active language explicitly. Clock Out Alive also writes its in-game language choice back to the shared preference. Dungeon Echo already honors `?lang=zh|en`, so its v1.2.6 gameplay/runtime boundary does not need to move.

## Theme continuity

The product site restores an explicit dark/light theme toggle. The selected `91hwl_theme` preference follows between the homepage and both project pages, and is also attached to outgoing play URLs for future-compatible context. Game rendering itself is not recolored by this site patch.

## Typography and control hierarchy

- Homepage hero headings are reduced to a more balanced scale.
- Language/theme controls are larger and use full, visible labels.
- Project-page body and card text move to a more consistent readable scale.
- Clock Out Alive result cards widen slightly and enlarge result body, coaching text and control hints.
- Clock Out Alive language/settings/fullscreen controls receive a larger common height and font scale.

## Preserved Clock Out Alive fixes

v1.11.2 keeps the accepted v1.11.1 presentation corrections:

- no active player focus halo;
- no floor dust on the airborne second jump;
- no drifting translucent coworker layer;
- short, stable result headings with distance/statistics in body copy.

`DAY_END_DISTANCE`, `PLAYER_HIT`, obstacle geometry, difficulty, endings and local-save behavior remain unchanged.

## Release safety

- Dungeon Echo tag `v1.2.6` remains pinned to `9443cf4755584a521f9c55a15b79fecfc9ecda78`.
- Clock Out Alive v1.11.2 reconstructs the accepted v1.11.0 source, verifies the accepted v1.11.1 intermediate runtime, applies the v1.11.2 patch, then syntax-checks the final runtime.
- site v1.3.2 derives its homepage overwrite guard from the actually deployed site v1.3.1 commit `830ebaf958e4bec71af085f0fa7897edbe8b007d`.
- both deployment paths retain checksums, origin/public health checks and rollback.
- GitHub Actions are not required for this release cycle.
