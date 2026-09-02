# Repository governance log — 2026-09-02

## Dungeon Echo v1.9.0 promotion

Baseline production release: v1.8.1 / cache generation 183.

Source work promoted into the release line:
- PR #339: living-town return-loop depth.
- PR #340: authored Echo Town environment art.

The release promotion advances the semantic version to v1.9.0 and cache generation to 190 while keeping storage epoch v130.

## Boundary decisions

- `game/core/game.js` remains the sole gameplay-state, persistence, input and Canvas writer.
- `game/domain/town/town-growth-rules-v180.js` remains the pure town-growth/event policy owner.
- New environment art is presentation-only and introduces no new state owner.
- Old `town-backdrop-v11.webp` remains a runtime fallback.
- Only current release stamp `release-stamp-v190.js` ships in the allowlist; the historical v1.8.1 stamp may remain in source history but is not booted.
## Release gates

Before promotion, the town-art candidate passed:
- authored town-art contract;
- living-town contract;
- single-authority audit;
- game repository boundary audit;
- current repository suite: 61 / 61;
- desktop/mobile Chromium smoke review with no browser errors.

The release pointer change must be committed before bundle tests because the builder intentionally packages only files present in the committed source revision.

Public deployment remains atomic and rollback-capable through the existing `/srv/91hwl-play/current` release-root workflow. Moyu and Board Games are preserved rather than rebuilt or replaced by this Dungeon Echo release.
