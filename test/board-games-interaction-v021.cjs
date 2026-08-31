'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const html=read('board-games/index.html');
const game=read('board-games/game.js');
const css=read('board-games/style.css');
const version=read('board-games/VERSION').trim();

assert.strictEqual(version,'0.2.1','Board Trio semantic version must be 0.2.1');
assert(html.includes('<meta name="version" content="0.2.1">'),'HTML version marker missing');
assert(html.includes('style.css?v=021')&&html.includes('rules.js?v=021')&&html.includes('game.js?v=021'),'cache generation v021 incomplete');
assert(html.includes('id="notice"')&&html.includes('aria-live="polite"'),'live interaction feedback missing');
assert(html.includes('id="board"')&&html.includes('tabindex="0"'),'keyboard-focusable board missing');
assert(html.includes('id="sessionHint"'),'in-page session-preservation hint missing');
assert(html.includes('id="confirmBtn"')&&html.includes('disabled>落子</button>'),'explicit move-confirm button missing');
assert(html.includes('class="control-hint"')&&html.includes('先选落点，再点“落子”确认'),'pointer-first control guidance missing');

assert(game.includes('sessions=Object.create(null)'),'per-game in-page sessions missing');
assert(game.includes("return mode==='go'?`go:${sizeSelect.value}`:mode"),'Go-size session isolation missing');
assert(game.includes('saveSession()')&&game.includes('loadSession(activeKey)'),'game-switch session restore missing');
assert(game.includes('window.history.replaceState'),'URL deep-link synchronization missing');
assert(game.includes("localStorage.getItem('board-trio-sound-v1')")&&game.includes("localStorage.setItem('board-trio-sound-v1'"),'sound preference persistence missing');
assert(!game.includes('localStorage.setItem(\'board-trio-session'),'board history must not be persisted into localStorage');
assert(game.includes("restartBtn.classList.add('armed')")&&game.includes("restartBtn.textContent='再点一次重开'"),'guarded restart missing');
assert(game.includes("canvas.addEventListener('pointerup'")&&game.includes('selectPlacement(x,y)'),'pointer selection must not commit Gomoku/Go directly');
assert(game.includes('pending={x,y}')&&game.includes('function confirmPlacement()'),'pending placement/explicit confirmation flow missing');
assert(game.includes("confirmBtn.addEventListener('click',confirmPlacement)"),'confirm button is not wired to move commit');
assert(game.includes("if(pending){pending=null;sync();draw();showNotice('已取消待确认落点'"),'undo must cancel an unconfirmed placement before history rollback');
assert(game.includes("canvas.addEventListener('keydown'")&&game.includes("'ArrowLeft'")&&game.includes("'Enter'"),'secondary keyboard accessibility path missing');
assert(game.includes("canvas.addEventListener('pointermove'")&&game.includes('drawCursor(g)'),'precision pointer preview missing');
assert(game.includes('贴目 7.5')&&game.includes('终局估算'),'Go scoring language must expose komi and estimate semantics');
assert(game.includes("capture?'rgba(151,50,38,.2)'"),'Xiangqi capture-target distinction missing');
assert(game.includes("dataset.gameVersion='0.2.1'"),'runtime version marker missing');

assert(css.includes('.notice[data-tone="warn"]')&&css.includes('.notice[data-tone="ok"]'),'notice states missing');
assert(css.includes('.actions button.armed'),'restart warning style missing');
assert(css.includes('canvas:focus-visible'),'board focus treatment missing');
assert(css.includes('.actions button:disabled'),'disabled action treatment missing');
assert(css.includes('.actions #confirmBtn:not(:disabled)'),'active move-confirm treatment missing');

console.log('board_games_interaction_v021=PASS');
