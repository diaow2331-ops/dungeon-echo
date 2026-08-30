# Clock Out Alive / 摸鱼到下班 v1.15.0

v1.15.0 is a whole-game presentation and playability pass driven by production browser review. No obstacle geometry, route length, scoring rules or jump velocities are changed.

## Mobile camera

- Portrait active play no longer shrinks the complete 1200×620 world into a ~197px-tall surface.
- The frame becomes ~322px tall on a 390×844 viewport and crops the unchanged logical canvas horizontally, giving the runner and hazards materially more readable screen space.
- Physics and collision coordinates remain authoritative in the original world.

## Product hierarchy

- Menu-state brochure, archive, route and footer panels stop competing with the game on first load.
- Desktop menu card is quieter and the playfield remains visible as the primary visual.
- Hero display size increases from 92 to 104 pixels while its 44×66 physics body stays unchanged.

## Motion depth

- Adds restrained far/near motion planes and edge depth to stop office scenes reading as static background images.
- Existing hazard readability remains above the new atmosphere layer.
