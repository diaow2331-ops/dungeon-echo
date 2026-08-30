# Clock Out Alive / 摸鱼到下班 v1.17.0

v1.17.0 is a portrait focus pass. It uses the unused vertical room on phones without changing the accepted desktop presentation or gameplay physics.

## Portrait playfield

- Expands the active 390×844 portrait frame from a 322px cap to a responsive `54svh` surface capped at 440px.
- Scales the unchanged 1200×620 logical canvas by height, avoiding non-uniform stretching.
- Offsets the visual crop slightly left so the runner sits nearer the edge and the route keeps useful forward reaction distance.
- Keeps the compact HUD, tutorial, progress bar and touch target inside the enlarged playfield.
- Leaves desktop frame fitting, route pacing, jump velocities, hitboxes, collision geometry, endings and local saves unchanged.

## Centered-stage hotfix

- Restores a centered, wider opening card on desktop so the game starts with a deliberate focal point instead of a left-side utility panel.
- Uses a balanced radial veil and centered actions while keeping the office scene visible behind the menu.
- Centers the compact portrait menu as well; gameplay geometry remains unchanged.
- Repairs the offline artifact runner to execute the packaged `ops/deploy.sh` path used by every release bundle.
