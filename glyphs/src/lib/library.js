/* The library: every entry the grid can show, with search and the edits the
   viewer made applied on top. Keys are 'lucide:<name>', 'beetle:<name>',
   'param:<id>' and 'scene:<scenario>'. */
import * as E from './engine.js';
import { clone } from './utils.js';

export const lib = { entries: [], byKey: new Map(), cats: [], sets: {}, meta: null, ready: false };

function add(e) { lib.entries.push(e); lib.byKey.set(e.key, e); }

export async function loadLibrary(url = 'data/icons.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`icons.json ${res.status}`);
  const data = await res.json();
  lib.meta = { version: data.version, license: data.license };
  for (const id of E.ICON_ORDER) add({ key: 'param:' + id, set: 'beetle', name: id, label: E.ICONS[id].name.toLowerCase(), tags: ['beetle', 'parametric', id], cats: ['beetle'], make: P => E.ICONS[id].make(P) });
  for (const [name, ic] of Object.entries(data.sets.beetle)) add({ key: 'beetle:' + name, set: 'beetle', name, label: name, tags: ic.t, cats: ic.c, make: () => clone(ic.p) });
  for (const [name, ic] of Object.entries(data.sets.lucide)) add({ key: 'lucide:' + name, set: 'lucide', name, label: name, tags: ic.t, cats: ic.c, make: () => clone(ic.p) });
  for (const sc of data.scenarios) {
    const base = lib.byKey.get(sc.key); if (!base) continue;
    add({ key: 'scene:' + sc.scenario, set: 'scenarios', name: sc.scenario, label: sc.scenario, tags: [sc.note, base.name], cats: ['scenarios'], base: base.key, make: P => base.make(P) });
  }
  const cats = new Map();
  for (const e of lib.entries) if (e.set !== 'scenarios') for (const c of e.cats) cats.set(c, (cats.get(c) || 0) + 1);
  lib.cats = [...cats].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  lib.sets = { all: lib.entries.filter(e => e.set !== 'scenarios').length, scenarios: lib.entries.filter(e => e.set === 'scenarios').length, beetle: lib.entries.filter(e => e.set === 'beetle').length, lucide: lib.entries.filter(e => e.set === 'lucide').length };
  lib.ready = true;
  return lib;
}

export function search(filter) {
  const q = (filter.q || '').trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  return lib.entries.filter(e => {
    if (filter.set === 'all' ? e.set === 'scenarios' : e.set !== filter.set) return false;
    if (filter.cat && filter.cat !== 'all' && !e.cats.includes(filter.cat)) return false;
    if (!words.length) return true;
    const hay = (e.name + ' ' + e.label + ' ' + e.tags.join(' ')).toLowerCase();
    return words.every(w => hay.includes(w));
  });
}

/* a quick ranked search for the command palette */
export function quickSearch(q, limit = 40) {
  const s = q.trim().toLowerCase();
  if (!s) return lib.entries.filter(e => e.set === 'scenarios').slice(0, limit);
  const scored = [];
  for (const e of lib.entries) {
    const name = e.label.toLowerCase();
    let score = 0;
    if (name === s) score = 100; else if (name.startsWith(s)) score = 60; else if (name.includes(s)) score = 40; else if (e.tags.some(t => t.toLowerCase().includes(s))) score = 20;
    if (score) scored.push([score, e]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label)).slice(0, limit).map(x => x[1]);
}

export const editKey = key => { const e = lib.byKey.get(key); return e && e.base ? e.base : key; };
export function primsOf(key, state) {
  const e = lib.byKey.get(key); if (!e) return [];
  const ek = editKey(key);
  const edits = state.edits || {};
  return edits[ek] ? clone(edits[ek]) : e.make(state.P);
}
export const labelOf = key => { const e = lib.byKey.get(key); return e ? e.label : key; };
export const fileName = key => key.replace(/^[a-z]+:/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
