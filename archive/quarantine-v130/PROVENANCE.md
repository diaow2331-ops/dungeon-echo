# Quarantine provenance

The v1.3.0 quarantine preserves code and assets from the last layered v1.2/v1.3 transition state before the authority-baseline cleanup.

Primary snapshots:

- Active pre-cleanup gameplay/input/UI/locale snapshot: `main` at `3d1958084f8266c086e9d0ade602b83de4ce3dd5`.
- Retired art-overlay snapshot: `3bf2f3c11261f55b3ab56ac21b9e5015fd115065`.

Files are copied by Git object identity where possible, so the archived bytes are identical to their source revision. The quarantine is deliberately outside `ops/release/static-files.txt` and must never be referenced from production entries.

Use `docs/ARCHITECTURE_SINGLE_AUTHORITY.md` and `docs/authority-map-v130.json` before restoring anything.