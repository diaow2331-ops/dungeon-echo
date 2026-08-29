# Persistence quarantine

These files are historical persistence helpers kept for reference only. They must never write production gameplay storage directly.

Current rule:

- live run/meta persistence belongs to `game/core/game.js`;
- `game/core/production-bootstrap.js` may only clear obsolete Dungeon Echo storage before core boot for a storage-epoch reset;
- save validation/migration logic, if restored, must be integrated into the sole persistence owner rather than executed as a second writer.
