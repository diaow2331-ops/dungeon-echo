'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'forge-system.js'), 'utf8');
assert(!/setInterval\s*\(/.test(source), 'forge-system must not keep a polling interval');
assert(source.includes('schedulePendingScan'), 'event-driven pending scan owner missing');
assert(source.includes('Fit ${fit} · Value ${value}'), 'explicit English forge metric missing');

const listeners = { document: {}, window: {} };
const nodes = new Map();
const headChildren = [];
const bodyChildren = [];

function makeNode(tag='div') {
  return {
    tagName: tag.toUpperCase(), id: '', innerHTML: '', textContent: '', title: '', dataset: {}, children: [],
    appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); },
    remove() { if (this.id) nodes.delete(this.id); },
    setAttribute() {},
    querySelector() { return null; },
    closest() { return null; },
  };
}

const label = makeNode('div');
const sell = makeNode('button');
const row = makeNode('div');
row.children = [label];
row.querySelector = sel => sel === '[data-sell]' ? sell : null;
const forgeBtn = makeNode('button');
forgeBtn.dataset.forge = 'bag:0';
forgeBtn.closest = sel => sel === '.town-row' ? row : null;

const pendingItem = {
  name: '铁剑', slot: 'weapon', forge: 3, refinePending: true, stats: { atk: 1 }, score: 1,
};
const meta = { bag: [pendingItem], stash: [] };
const api = {
  profileId: 'classic-100', state: 'town', meta,
  itemValueScore: () => 4,
  sellPrice: () => 7,
  forgeCost: () => 12,
  eqScoreOf: () => 1,
};

global.queueMicrotask = fn => fn();
global.setInterval = () => { throw new Error('polling interval must not be created'); };
global.localStorage = { setItem() {} };
global.document = {
  head: { appendChild(el) { headChildren.push(el); if (el.id) nodes.set(el.id, el); } },
  body: { appendChild(el) { bodyChildren.push(el); if (el.id) nodes.set(el.id, el); } },
  getElementById(id) { return nodes.get(id) || null; },
  querySelectorAll(sel) { return sel === '[data-forge]' ? [forgeBtn] : []; },
  createElement(tag) { return makeNode(tag); },
  addEventListener(type, fn) { (listeners.document[type] ||= []).push(fn); },
};
global.window = {
  DE_TEST: api,
  DE_I18N: {
    isEnglish: true,
    translate(value) { return String(value) === '铁剑' ? 'Iron Sword' : String(value); },
  },
  addEventListener(type, fn) { (listeners.window[type] ||= []).push(fn); },
};

vm.runInThisContext(source, { filename: 'forge-system.js' });

assert.equal(window.__DE_FORGE_SYSTEM, 'v2', 'forge v2 owner must boot');
assert(window.DE_FORGE_REFINEMENT, 'forge refinement API missing');
assert((listeners.document.keydown || []).length >= 1, 'keydown lifecycle sync missing');
assert((listeners.document.click || []).length >= 3, 'forge/refine + lifecycle click owners missing');
assert((listeners.window.focus || []).length === 1, 'focus lifecycle sync missing');

const modal = nodes.get('de-forge-refine');
assert(modal, 'restored +3 pending item should reopen refinement without polling');
assert(modal.innerHTML.includes('+3 Refinement'), 'English refinement title missing');
assert(modal.innerHTML.includes('Keen'), 'English refinement path label missing');
assert(!modal.innerHTML.includes('+3 精炼'), 'English refinement modal leaked Chinese heading');

window.DE_FORGE_REFINEMENT.syncTownRows();
assert(label.innerHTML.includes('Iron Sword'), 'town forge row must localize the item at render boundary');
assert(label.innerHTML.includes('Fit 1 · Value 4'), 'town forge row must render a complete English metric');
assert.equal(sell.textContent, 'Sell 7G', 'English sell button copy mismatch');
assert.equal(forgeBtn.title, 'Forge to +4 · Cost 12 G', 'English forge tooltip mismatch');

console.log('forge_event_locale_v130=PASS');
