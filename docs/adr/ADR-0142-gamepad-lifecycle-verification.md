# Gamepad lifecycle verification

Before closing the runtime-debt item, verify in a real browser:

- no controller connected: adapter stays idle (`running === false`)
- connect controller: sampling starts and badge appears
- disconnect controller: sampling stops and badge clears
- reconnect controller: sampling restarts
- background / foreground: sampling stops while hidden and resumes only with a connected pad
- D-pad / stick movement and menu focus
- A confirm / descend, B wait / back, X skill, Y potion, LB scroll, RT attack, RB fullscreen, Start pause
- View long-hold Return Scroll still emits a single return command per hold

This is a browser verification checklist, not a claimed browser PASS.
