/* Public-repository hygiene guard.
 * Scans the checked-out tree for credential artifacts, common live-secret shapes,
 * and personal email addresses. It deliberately does not scan Git object history.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const root = process.env.DE_ROOT || path.resolve(__dirname, '..');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'release-out', 'coverage']);
const BINARY_EXT = new Set([
  '.png', '.webp', '.jpg', '.jpeg', '.gif', '.ico', '.bmp', '.avif',
  '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.ogg', '.wav', '.zip', '.pdf',
]);

const forbiddenPaths = [
  ['dotenv file', /(^|\/)\.env(?:$|\.(?!example$)[^/]+$)/i],
  ['private-key file', /(^|\/)(?:id_rsa|id_ed25519)(?:\.|$)/i],
  ['private-key file', /\.(?:pem|key|p12|pfx|keystore)$/i],
  ['credential export', /(^|\/)(?:credentials?|service[-_]?account)[^/]*\.json$/i],
  ['cookie export', /(^|\/)cookies?[^/]*\.(?:json|txt)$/i],
  ['credential config', /(^|\/)(?:\.npmrc|\.netrc)$/i],
];

const secretRules = [
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['OpenAI API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ['literal bearer credential', /\bBearer\s+[A-Za-z0-9._~+/-]{24,}\b/i],
];

const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
function allowedEmail(address) {
  const email = String(address).toLowerCase();
  if (email.endsWith('@users.noreply.github.com')) return true;
  if (email === 'noreply@github.com') return true;
  if (email.endsWith('@example.com') || email.endsWith('@example.org') || email.endsWith('@example.net')) return true;
  return false;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory() && SKIP_DIRS.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (ent.isFile()) out.push(abs);
  }
  return out;
}

const findings = [];
for (const abs of walk(root)) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (rel === 'test/public-repo-safety.cjs') continue;

  for (const [label, re] of forbiddenPaths) {
    if (re.test(rel)) findings.push(`${label}: ${rel}`);
  }

  const ext = path.extname(rel).toLowerCase();
  if (BINARY_EXT.has(ext)) continue;
  let buf;
  try { buf = fs.readFileSync(abs); } catch (e) { continue; }
  if (buf.length > 4 * 1024 * 1024 || buf.includes(0)) continue;
  const text = buf.toString('utf8');

  for (const [label, re] of secretRules) {
    if (re.test(text)) findings.push(`${label}: ${rel}`);
  }

  for (const match of text.matchAll(emailRe)) {
    if (!allowedEmail(match[0])) findings.push(`personal/non-example email: ${rel}`);
  }
}

const unique = [...new Set(findings)].sort();
if (unique.length) {
  console.error('PUBLIC_REPO_SAFETY: FAIL');
  for (const item of unique) console.error(`  - ${item}`);
  console.error('Remove the material from the working tree. If it was a real credential, rotate/revoke it before any history cleanup.');
  process.exit(1);
}

console.log('PUBLIC_REPO_SAFETY: PASS');
