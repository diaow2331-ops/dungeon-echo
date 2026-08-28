# Historical runtime archive

This directory is provenance only. Files under `archive/` are not loaded by production and are not included in `ops/release/static-files.txt`.

## `runtime/`

Retired translation-after-render and compatibility layers kept so repository history remains easy to inspect without cluttering the project root. They must not be referenced by `index.html`, `en/index.html` or `runtime-bootstrap.js`.

## `release-stamps/`

Visible release stamp scripts from older v1.2.x releases. The current release stamp remains at the repository root because the deployment contract derives its path directly from `VERSION`.

Do not restore archived files to production simply because they still exist here. Git history and this archive preserve provenance; active behavior belongs in the current engine, system owners, `game/locale/` or `game/ui/`.
