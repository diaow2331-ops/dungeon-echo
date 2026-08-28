'use strict';

/* Test-only path bridge for the v1.2.9 repository layout migration.
 *
 * Production and current release/governance contracts use the organized game/* paths directly.
 * Older gameplay regression files are intentionally kept reviewable with their historical source
 * text; this preload maps only their filesystem/module lookups from the former root names to the
 * current ownership folders. It never runs in the browser or release bundle.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const moved = Object.freeze({
  'game.js': 'game/core/game.js',
  'production-bootstrap.js': 'game/core/production-bootstrap.js',
  'runtime-bootstrap.js': 'game/core/runtime-bootstrap.js',
  'save-integrity-system.js': 'game/core/save-integrity-system.js',
  'release-stamp-v129.js': 'game/core/release-stamp-v129.js',
  'locale-data-v134.js': 'game/locale/locale-data-v134.js',
  'core-locale-data-v139.js': 'game/locale/core-locale-data-v139.js',
  'npc-stability-system.js': 'game/systems/npc-stability-system.js',
  'equipment-system.js': 'game/systems/equipment-system.js',
  'town-system.js': 'game/systems/town-system.js',
  'commerce-system.js': 'game/systems/commerce-system.js',
  'forge-system.js': 'game/systems/forge-system.js',
  'progression-system.js': 'game/systems/progression-system.js',
  'progression-guard-system.js': 'game/systems/progression-guard-system.js',
  'content-system.js': 'game/systems/content-system.js',
  'combat-pressure.js': 'game/systems/combat-pressure.js',
  'gameplay-tuning.js': 'game/systems/gameplay-tuning.js',
  'defense-system.js': 'game/systems/defense-system.js',
  'challenge-pressure.js': 'game/systems/challenge-pressure.js',
  'risk-reward-system.js': 'game/systems/risk-reward-system.js',
  'desktop-controls.js': 'game/input/desktop-controls.js',
  'combat-controls.js': 'game/input/combat-controls.js',
  'visual-polish.js': 'game/ui/visual-polish.js',
  'equipment-shop-ui.js': 'game/ui/equipment-shop-ui.js',
});

function mappedPath(value) {
  if (typeof value !== 'string' && !Buffer.isBuffer(value)) return value;
  const raw = Buffer.isBuffer(value) ? value.toString() : value;
  const absolute = path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(root, raw);
  const relative = path.relative(root, absolute).replace(/\\/g, '/');
  const next = moved[relative];
  return next ? path.join(root, next) : value;
}

for (const name of ['readFileSync', 'existsSync', 'statSync', 'lstatSync', 'accessSync', 'openSync']) {
  if (typeof fs[name] !== 'function') continue;
  const original = fs[name].bind(fs);
  fs[name] = function patchedPathLookup(first, ...rest) {
    return original(mappedPath(first), ...rest);
  };
}

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (typeof request === 'string' && parent && parent.filename && (request.startsWith('.') || path.isAbsolute(request))) {
    const absolute = path.isAbsolute(request) ? request : path.resolve(path.dirname(parent.filename), request);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');
    if (moved[relative]) return resolveFilename.call(this, path.join(root, moved[relative]), parent, isMain, options);
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

global.__DE_TEST_LAYOUT_COMPAT = Object.freeze({ version: 'v156', root, moved });
