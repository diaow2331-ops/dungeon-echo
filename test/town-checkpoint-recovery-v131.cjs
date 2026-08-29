'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('game/core/game.js'),zh=read('index.html'),en=read('en/index.html'),css=read('style.css');
const staged=require(path.join(root,'game/domain/town/town-rules-v130.js'));
assert.deepEqual([...staged.CHECKPOINTS],[1,11,21,31,41,51,61,71,81,91]);
assert(core.includes('const TOWN_CHECKPOINTS = Object.freeze([1, 11, 21, 31, 41, 51, 61, 71, 81, 91]);'));
assert(core.includes("return TOWN_CHECKPOINTS.filter(d => d === 1 || best >= d);"));
assert(core.includes("if (!unlockedTownCheckpoints().includes(checkpointDepth)) return false;"),'forged/locked selection rejected');
assert(core.includes('function departTown(targetDepth = selectedTownCheckpoint)'));
assert(core.includes('const startDepth = unlocked.includes(requested) ? requested : 1;'),'depart revalidates selection');
assert(core.includes("depth = startDepth; turns = 0; state = 'playing';"));
assert(core.includes("e.target.closest('[data-checkpoint]')"),'core remains town event owner');
assert(core.includes("document.createElement('button')")&&core.includes("button.disabled = !open;"),'checkpoint UI uses bounded direct DOM rendering');
assert(!core.includes("localStorage.setItem('de-town-checkpoint")&&!core.includes('meta.selectedTownCheckpoint'),'selection is transient');
for(const [route,html] of [['zh',zh],['en',en]]) {
  assert.equal((html.match(/id="town-checkpoints"/g)||[]).length,1,`${route}: one checkpoint panel`);
  assert(!html.includes('game/domain/town/town-rules-v130.js'),`${route}: staged town rules remain unshipped`);
  assert(!html.includes('town-system.js'),`${route}: archived town wrapper remains unshipped`);
}
assert(!zh.includes('所有角色都从第 1 层出发。'));
assert(!en.includes('Every character starts on Floor 1.'));
assert(en.includes('Your first expedition starts on Floor 1.'));
assert(css.includes('.checkpoint-panel')&&css.includes('.checkpoint-grid button.active')&&css.includes('.checkpoint-grid button.locked'));
console.log('town_checkpoint_recovery_v131=PASS');
