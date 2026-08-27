# 摸鱼到下班 · Clock Out Alive

Current release: **v1.11.0**. Production route: `https://play.91hwl.cn/moyu/`.

The source is governed as three responsibilities rather than one 160 KB HTML blob:

- `index.html` — product shell, HUD and accessibility structure.
- `style.css` — desktop/mobile presentation, safe areas and touch ergonomics.
- `src/game.part01.js` … `game.part15.js` — ordered source slices of one runtime. They are concatenated byte-for-byte by the release builder into the single production `game.js`; browsers never load the slices individually.

`SOURCE_SHA256` pins the accepted HTML and reconstructed runtime. `build-moyu-bundle.sh` refuses checksum drift, untracked release sources, a wrong source-part count, missing cache fingerprints or changed core run geometry.

Release properties:

- Chinese / English UI with persistent language choice.
- Desktop keyboard/mouse and immediate pointer-down mobile controls.
- Portrait/landscape responsive layout, safe-area handling and fullscreen support.
- Four office stages from 14:00 to 18:00, double jump and two endings.
- Office events, rare/hidden moments, discovery archive and original 8-bit audio.
- Core run length and collision geometry remain compatible with the v1.10 line.

The game remains static-first and requires no account. Optional end-of-run message submission remains non-blocking and only activates when a configured endpoint exists.
