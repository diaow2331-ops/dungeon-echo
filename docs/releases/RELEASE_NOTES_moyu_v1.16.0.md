# Clock Out Alive / 摸鱼到下班 v1.16.0

v1.16.0 is a pacing and scene-life pass. It keeps the accepted movement and collision model while shortening the normal route and making each office scene feel active rather than static.

## Four-minute route

- Adds `RUN_PROGRESS_SCALE=.020` for normal running progression.
- The 2200 logical route evaluates to roughly 239 seconds from the baseline speed curve, down from roughly 398 seconds.
- Obstacle pixel speed, jump and Double Jump velocities, player body, collision rectangles and ending logic are unchanged.
- The four 550-distance office hours remain intact.

## Scene life

- Workstation: monitor scan activity and status LEDs.
- Meeting: restrained projector beams and screen activity.
- Pantry: coffee steam and machine display movement.
- Gym: treadmill belt motion and low-opacity mirror silhouettes.
- All new motion is draw-layer only and remains behind hazards.
