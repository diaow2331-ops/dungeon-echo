# Historical and quarantined runtime archive

Everything under `archive/` is **inactive provenance**. Production must never load or package this directory.

## `quarantine-v130/`

The v1.3.0 authority cleanup moved previously completed but ownership-conflicting work here instead of discarding it. It is organized by responsibility:

- gameplay systems;
- UI/workspace followers;
- input handlers;
- locale/runtime interceptors;
- persistence/migration/reset helpers;
- overlay art runtime code;
- overlay art assets.

Use `quarantine-v130/RESPONSIBILITY_INDEX.md` to decide where a feature belongs before restoring it. Restoration means porting useful behavior/data/art into the sole current owner; it does not mean re-loading the archived wrapper.

## `runtime/`

Older translation-after-render and compatibility layers retained for provenance.

## `release-stamps/`

Historical visible release stamp scripts.

## Production boundary

`ops/release/static-files.txt` is the only production allowlist. It must never contain an `archive/` path. `index.html`, `en/index.html` and `game/core/runtime-bootstrap.js` must never reference this directory.

See `docs/ARCHITECTURE_SINGLE_AUTHORITY.md` and `docs/authority-map-v130.json` for the active ownership model.
