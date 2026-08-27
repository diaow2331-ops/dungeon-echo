/* Repository event-safety guard for the public project.
 * External Issue/PR/discussion content is untrusted input and must never become a
 * production control plane. CI may be added later, but production deployment stays
 * an explicit maintainer action on an owner-controlled host.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');
const workflows = path.join(root, '.github', 'workflows');

const bannedEvents = [
  ['issue_comment', /^\s*issue_comment\s*:/mi],
  ['issues', /^\s*issues\s*:/mi],
  ['pull_request_target', /^\s*pull_request_target\s*:/mi],
  ['discussion', /^\s*discussion\s*:/mi],
  ['discussion_comment', /^\s*discussion_comment\s*:/mi],
  ['repository_dispatch', /^\s*repository_dispatch\s*:/mi],
  ['workflow_run', /^\s*workflow_run\s*:/mi],
];

const bannedProductionPaths = [
  ['workflow secret access', /\bsecrets\s*(?:\.|\[)/i],
  ['write-all workflow permission', /^\s*permissions\s*:\s*write-all\s*$/mi],
  ['SSH/SCP/rsync remote mutation', /^\s*(?:sudo\s+)?(?:ssh|scp|rsync)\s+/mi],
  ['remote deployment action', /^\s*uses\s*:\s*[^#\n]*(?:ssh-action|scp-action|ssh-agent|rsync-deploy|deploy-action)/mi],
  ['production deploy script', /\bops\/(?:home-mount|moyu-bundle|site-bundle)\/deploy\.sh\b/],
  ['service mutation', /\bsystemctl\s+(?:start|stop|restart|reload|enable|disable)\b/i],
];

function scanWorkflow(text, rel) {
  const findings = [];
  for (const [label, re] of bannedEvents) {
    if (re.test(text)) findings.push(`${rel}: untrusted trigger ${label}`);
  }
  for (const [label, re] of bannedProductionPaths) {
    if (re.test(text)) findings.push(`${rel}: ${label}`);
  }
  return findings;
}

function workflowFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) workflowFiles(abs, out);
    else if (ent.isFile() && /\.ya?ml$/i.test(ent.name)) out.push(abs);
  }
  return out;
}

const selfTests = [
  ['comment trigger', 'on:\n  issue_comment:\n    types: [created]\n'],
  ['privileged PR trigger', 'on:\n  pull_request_target:\n    types: [opened]\n'],
  ['secret access', 'on: push\njobs:\n  x:\n    env:\n      TOKEN: ${{ secrets.DEPLOY_TOKEN }}\n'],
  ['ssh command', 'on: push\njobs:\n  x:\n    steps:\n      - run: |\n          ssh host.example true\n'],
  ['deploy script', 'on: push\njobs:\n  x:\n    steps:\n      - run: sudo bash ops/site-bundle/deploy.sh\n'],
];

const findings = [];
for (const [label, fixture] of selfTests) {
  if (!scanWorkflow(fixture, `selftest/${label}`).length) findings.push(`guard self-test failed: ${label}`);
}
const safeFixture = 'on:\n  pull_request:\npermissions:\n  contents: read\njobs:\n  test:\n    steps:\n      - run: node test/production.cjs\n';
if (scanWorkflow(safeFixture, 'selftest/safe-ci').length) findings.push('guard self-test failed: safe pull_request CI was rejected');

const files = workflowFiles(workflows);
for (const abs of files) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  findings.push(...scanWorkflow(fs.readFileSync(abs, 'utf8'), rel));
}

if (findings.length) {
  console.error('REPOSITORY_EVENT_SAFETY: FAIL');
  for (const finding of findings) console.error(`  - ${finding}`);
  console.error('External repository events must not control production. Keep deployment manual and maintainer-initiated.');
  process.exit(1);
}

console.log(`REPOSITORY_EVENT_SAFETY: PASS (${files.length} workflow files checked; guard self-tests passed)`);
