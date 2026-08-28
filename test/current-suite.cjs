'use strict';

/* Current high-value repository/release suite.
 * Runs each test in a fresh Node process with the test-only v156 path bridge preloaded.
 * Use focused individual tests during normal iteration; this entry is the explicit full gate.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const compat = path.join(__dirname, 'layout-compat.cjs');
const tests = [
  'public-repo-safety.cjs',
  'repository-event-safety.cjs',
  'production.cjs',
  'descent100.cjs',
  'save-integrity-v128.cjs',
  'combat-controls-v1.cjs',
  'extraction-channel.cjs',
  'dungeon-service-safety.cjs',
  'wheel-death-reroll.cjs',
  'guardian-content.cjs',
  'skill-evolution.cjs',
  'progression-commitment.cjs',
  'disposable-interactions.cjs',
  'interaction-pathing.cjs',
  'risk-reward-interactions.cjs',
  'final-fixed-locale-v153.cjs',
  'fixed-locale-routes-v131.cjs',
  'cache-bust-v140.cjs',
  'runtime-debt-contract-v141.cjs',
  'release.cjs',
  'repository-governance-v122.cjs',
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
