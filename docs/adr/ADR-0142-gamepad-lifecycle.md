# ADR-0142: Gate Gamepad sampling to connected pads

## Context

`desktop-controls.js` previously kept a `requestAnimationFrame` sampling loop alive whenever the Gamepad API existed, including the common case where no gamepad was connected. The loop is legitimate while a controller is active, but idle sampling is unnecessary runtime work and conflicts with the repository-wide move away from permanent follower loops.

## Decision

The gamepad adapter owns an explicit `startLoop()` / `stopLoop()` lifecycle.

- Sampling starts only when `navigator.getGamepads()` exposes a connected pad.
- `gamepadconnected` starts sampling.
- `gamepaddisconnected`, `pagehide`, and hidden-page transitions stop sampling.
- Returning to a visible page probes for an already-connected pad and resumes only when one exists.
- If a pad disappears without a usable event, the next sample self-terminates instead of scheduling another frame.
- Controller mappings and keyboard events remain unchanged.

## Consequences

Desktop users without a controller no longer pay a permanent RAF cost. Connected controllers keep frame-based polling because the Gamepad API requires sampling for buttons/axes. This is lifecycle gating, not removal of required controller polling.
