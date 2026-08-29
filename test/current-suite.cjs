'use strict';

/* Current high-value repository/release suite.
 * Runs each test in a fresh Node process with the test-only v156 path bridge preloaded.
 * Historical wrapper tests stay in the repository as recovery evidence, but are not current gates.
 * Use focused individual tests during normal iteration; this entry is the explicit full gate.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const compat = path.join(__dirname, 'layout-compat.cjs');
const tests = [
  'repository-event-safety.cjs',
  'current-production-entry-v132.cjs',
  'equipment-art-recovery-v131.cjs',
  'static-art-polish-v131.cjs',
  'hero-action-ui-recovery-v131.cjs',
  'final-core-polish-v133.cjs',
  'theme-atmosphere-v131.cjs',
  'town-npc-distinct-v132.cjs',
  'resource-pressure-v132.cjs',
  'guardian-pressure-v132.cjs',
  'descent100.cjs',
  'current-save-contract-v132.cjs',
  'current-control-contract-v132.cjs',
  'decision-clarity-v133.cjs',
  'core-balance-v140.cjs',
  'single-authority-v140.cjs',
  'postlaunch-ux-v140.cjs',
  'postlaunch-gameplay-regressions-v134.cjs',
  'record-art-polish-v135.cjs',
  'english-fresh-locale-v136.cjs',
  'control-copy-v132.cjs',
  'adaptive-bgm-v132.cjs',
  'audio-mix-v133.cjs',
  'forge-feedback-v132.cjs',
  'current-runtime-contract-v132.cjs',
  'wheel-death-reroll.cjs',
  'guardian-content.cjs',
  'skill-evolution.cjs',
  'fixed-locale-routes-v131.cjs',
  'cache-bust-v140.cjs',
  'release.cjs',
  'current-repository-governance-v133.cjs',
];

let failed = 0;
for (const name of tests) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(process.execPath, ['-r', compat, path.join(__dirname, name)], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    failed++;
    console.error(`FAILED: ${name} (exit ${result.status})`);
  }
}

console.log(`\nCURRENT_SUITE ${tests.length - failed} passed / ${failed} failed`);
process.exit(failed ? 1 : 0);
