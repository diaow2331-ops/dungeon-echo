# 摸鱼到下班 · Clock Out Alive

`moyu/index.html` is the production single-file Web Toy served at `https://play.91hwl.cn/moyu/`.

Current release: **v1.11.0**.

Release properties:

- Chinese / English UI with persistent language choice.
- Desktop keyboard/mouse and direct pointer-down mobile controls.
- Portrait/landscape responsive layout, safe-area handling and fullscreen support.
- Four office stages from 14:00 to 18:00.
- Office events, rare/hidden moments, discovery archive and two endings.
- Core run length, collision geometry and the existing ending rules stay compatible with the v1.10 line.

`SOURCE_SHA256` pins the exact accepted `index.html` bytes. The bundle builder refuses an untracked or checksum-mismatched source file.

The game remains static-first: no account is required. Optional end-of-run message submission uses the already-existing 91hwl endpoint when available and does not block play.
