# Dungeon Echo v1.8 — Town Character and Dialogue Art Audit

## Finding

Town growth already had contextual NPC writing, but the presentation hid it in the adventure log. The plaza still used the historical SVG NPC sheet and service interaction immediately changed panels without a character-led conversation beat. The result made residents mechanically useful but visually anonymous.

## Admitted character batch

- `art/town-npc-atlas-v180.webp`: 4 × 4, 314 px transparent cells for seven service NPCs, six unlockable residents and three action/prop variants.
- `art/town-npc-portraits-v180.webp`: the same 4 × 4 semantic order as authored bust portraits for the conversation surface.
- `art/source-atlases/runtime-maps/v180-town-character-art.map.json`: exact dimensions, alpha contract and shared cell order.

The scene atlas was generated against the current town backdrop, then passed through a dedicated background-extraction edit to restore true alpha. The portrait atlas referenced the corrected scene sheet so repeated variants remain the same people and dialogue portraits match their plaza silhouettes.

## Dialogue presentation

NPC interaction now opens a dedicated portrait card with speaker, occupation, contextual line and up to two live state chips. Project levels, town events, archive size, town tier and deepest floor are read from the existing state owners. The same authoritative `npcLine` / `residentLine` result is also retained in the adventure log, so dialogue history and accessibility do not regress.

The card is responsive, keyboard-safe, dismissible and reduced-motion aware. Both authored locale routes carry identical structure; English remains free of CJK copy.

## Authority and compatibility

`town-growth-rules-v180.js` remains the only owner of contextual dialogue content. Core maps existing character IDs to portrait cells and presentation-only role labels; it does not duplicate dialogue branches, unlock rules or persistence. The v1 SVG sheet remains as a loading fallback. No save fields, storage epoch, public version or release boundary changed.

