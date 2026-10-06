/* The library: every entry the grid can show, with search and the edits the
   viewer made applied on top. Keys are 'core:<name>', 'beetle:<name>',
   'param:<id>' and 'scene:<scenario>'. A Beetle icon the designer drew in both
   weights carries its own solid (ps); its old '-filled' name is an alias. */
import * as E from './engine.js';
import { clone } from './utils.js';

export const lib = { entries: [], byKey: new Map(), names: new Map(), cats: [], sets: {}, meta: null, ready: false };

/* an entry by key, aliases included; the entry's own key is the canonical one */
export const entryOf = key => lib.byKey.get(key);

function add(e) { lib.entries.push(e); lib.byKey.set(e.key, e); }

export async function loadLibrary(url = 'data/icons.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`icons.json ${res.status}`);
  const data = await res.json();
  lib.meta = { version: data.version, license: data.license };
  for (const id of E.ICON_ORDER) add({ key: 'param:' + id, set: 'beetle', name: id, label: E.ICONS[id].name.toLowerCase(), tags: ['beetle', 'parametric', id], cats: ['beetle'], make: P => E.ICONS[id].make(P) });
  for (const [name, ic] of Object.entries(data.sets.beetle)) {
    const e = { key: 'beetle:' + name, set: 'beetle', name, label: name, tags: ic.t, cats: ic.c, make: () => clone(ic.p), makeSolid: ic.ps ? () => clone(ic.ps) : null, derived: !!ic.d, aliases: ic.a || [] };
    add(e);
    for (const a of e.aliases) lib.byKey.set('beetle:' + a, e);
  }
  for (const [name, ic] of Object.entries(data.sets.core)) add({ key: 'core:' + name, set: 'core', name, label: name, tags: ic.t, cats: ic.c, make: () => clone(ic.p) });
  for (const sc of data.scenarios) {
    const base = lib.byKey.get(sc.key); if (!base) continue;
    add({ key: 'scene:' + sc.scenario, set: 'scenarios', name: sc.scenario, label: sc.scenario, tags: [sc.note, base.name], cats: ['scenarios'], base: base.key, make: P => base.make(P), makeSolid: base.makeSolid, derived: base.derived });
  }
  const cats = new Map();
  for (const e of lib.entries) if (e.set !== 'scenarios') for (const c of e.cats) cats.set(c, (cats.get(c) || 0) + 1);
  lib.cats = [...cats].sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  lib.sets = { all: lib.entries.filter(e => e.set !== 'scenarios').length, scenarios: lib.entries.filter(e => e.set === 'scenarios').length, beetle: lib.entries.filter(e => e.set === 'beetle').length, core: lib.entries.filter(e => e.set === 'core').length };
  nameEntries();
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

/* where an icon's edits live: its canonical key, with '#solid' for the solid
   weight of an icon that has parts of its own for it */
export const editKey = (key, weight) => { const e = lib.byKey.get(key); const k = e ? (e.base || e.key) : key; return weight === 'solid' && e && e.makeSolid ? k + '#solid' : k; };
export const hasOwnSolid = key => { const e = lib.byKey.get(key); return !!(e && e.makeSolid); };
export function primsOf(key, state, weight) {
  const e = lib.byKey.get(key); if (!e) return [];
  weight = weight || state.P.weight;
  const ek = editKey(key, weight);
  const edits = state.edits || {};
  if (edits[ek]) return clone(edits[ek]);
  return weight === 'solid' && e.makeSolid ? e.makeSolid(state.P) : e.make(state.P);
}
export const labelOf = key => { const e = lib.byKey.get(key); return e ? e.label : key; };
export const fileName = key => key.replace(/^[a-z]+:/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();

/* the id an icon goes by in a sprite, a font or JSON. Its own name, unless
   another icon shares it (card is an app glyph and a parametric icon; search is
   in all three sets): then the set goes in front, param-card, beetle-card. The
   scenarios are named among themselves, since no view mixes them with the rest. */
function nameEntries() {
  lib.names.clear();
  for (const group of [lib.entries.filter(e => e.set !== 'scenarios'), lib.entries.filter(e => e.set === 'scenarios')]) {
    const count = new Map();
    for (const e of group) { const n = fileName(e.key); count.set(n, (count.get(n) || 0) + 1); }
    const taken = new Set();
    for (const e of group) {
      const n = fileName(e.key);
      let id = count.get(n) > 1 ? `${e.key.split(':')[0]}-${n}` : n;
      for (let i = 2; taken.has(id) || (id !== n && count.has(id)); i++) id = `${e.key.split(':')[0]}-${n}-${i}`;
      taken.add(id); lib.names.set(e.key, id);
    }
  }
}
export const exportName = key => { const e = lib.byKey.get(key); return (e && lib.names.get(e.key)) || fileName(key); };
