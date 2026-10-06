/* Beetle Glyphs for Figma: the panel. It is the site, narrowed: the same store,
   library, toolbar, grid, sidebar and whole-library panel, read from glyphs/src
   by the build. What is the plugin's own is here: the data from inside the
   page, the bar that inserts, swaps and updates, the About sheet, and the
   messages to code.js, which does the work in the document. */
import * as E from '../../src/lib/engine.js';
import { h, ICO, fmtInt, debounce } from '../../src/lib/utils.js';
import { store } from '../../src/lib/store.js';
import { lib, loadLibrary, loadDrawings, drawingFile, primsOf, exportName, entryOf } from '../../src/lib/library.js';
import { IconGrid } from '../../src/components/app/icon-grid.js';
import { Sidebar } from '../../src/components/app/sidebar.js';
import { LibraryPanel } from '../../src/components/app/library-panel.js';
import { Segmented } from '../../src/components/ui/segmented.js';
import { Switch } from '../../src/components/ui/switch.js';
import { Button } from '../../src/components/ui/button.js';
import { openSheet } from '../../src/components/ui/sheet.js';
import { installData, DATA_URL } from './data.js';
import { figmaSvg } from './figma-svg.js';

const REPO = 'https://github.com/ibrahimweng/beetle-wallet';
const CHUNK = 50;
/* a batch stops here, so Figma stays responsive: a component set is 8 components */
const CAP = { frame: 2000, component: 2000, set: 200 };
const AS = [{ value: 'frame', label: 'Frame', title: 'A plain frame, one per icon' }, { value: 'component', label: 'Component', title: 'A component, one per icon' }, { value: 'set', label: 'Variants', title: 'A component set with Style and Corners variants' }];
const DRAW_KEYS = ['S', 'R', 'G', 'choke', 'fillet', 'weight', 'corners'];
const CORNERS = ['rounded', 'sharp'];

installData();

/* ---------- talking to code.js ---------- */
const post = msg => parent.postMessage({ pluginMessage: msg }, '*');
const waiting = new Map();
const reply = (type, id) => new Promise((resolve, reject) => waiting.set(type + ':' + id, { resolve, reject }));
let seq = 0;

/* the plugin's own state, beside the site's store */
const plug = { as: 'frame', swap: true, ticked: new Set(), selection: { count: 0, ours: [] }, busy: false, command: 'open' };

/* ---------- theme: Figma says light or dark on the root element ---------- */
const root = document.documentElement;
const applyTheme = () => root.classList.toggle('dark', root.classList.contains('figma-dark'));
new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ['class'] });
applyTheme();
document.body.classList.add('plugin');

/* ---------- drawing for Figma ---------- */
const pick = P => Object.fromEntries(DRAW_KEYS.map(k => [k, P[k]]));
const colorNow = () => store.get().view.color || '#000000';
async function drawn(key, P) {
  await loadDrawings(drawingFile(P.weight, P.corners)).catch(() => {});
  const prims = primsOf(key, { P, edits: store.get().edits || {} }, P.weight);
  return figmaSvg(prims, P, { CL: window.ClipperLib, color: colorNow(), uid: exportName(key) });
}
/* an icon as code.js takes it: its name, how it is drawn, and the SVG; for
   variants, the SVG in every style and both corners */
async function itemFor(key, as, over) {
  const P = { ...store.get().P, goo: 0, ...over };
  const item = { key, name: exportName(key), P: pick(P), color: colorNow() };
  if (as === 'set' || as === 'all') {
    item.variants = [];
    for (const corners of CORNERS) for (const weight of E.WEIGHTS) { const V = { ...P, weight, corners }; item.variants.push({ P: pick(V), svg: await drawn(key, V) }); }
  }
  if (as !== 'set') item.svg = await drawn(key, P);
  return item;
}

/* ---------- the shell ---------- */
const grid = IconGrid();
const tiles = grid.el.querySelector('.grid');
const status = h('div', { class: 'pg-status', role: 'status', 'aria-live': 'polite' });
const say = text => { status.textContent = text; };

const libraryBtn = Button({ variant: 'outline', size: 'sm', icon: ICO.menu, label: 'Library', title: 'Sets and categories', onClick: () => {
  const nav = Sidebar(); nav.el.classList.add('in-sheet'); nav.render();
  let un = () => {};
  const close = openSheet({ side: 'left', title: 'Library', content: nav.el, onClose: () => { nav.destroy(); un(); } });
  un = store.subscribe((s, keys) => { if (keys.includes('filter')) close(); });
} });
const settingsBtn = Button({ variant: 'outline', size: 'sm', icon: ICO.sliders, label: 'Settings', title: 'Box corner, fillet, gap and choke', onClick: () => {
  const panel = LibraryPanel();
  openSheet({ side: 'right', title: 'Whole library', content: h('div', { class: 'stack', style: { gap: '16px' } }, panel.el, h('p', { class: 'hint pg-note' }, 'Goo is left out of the plugin. It is a blur filter, and Figma cannot import SVG filters.')) });
} });
const aboutBtn = Button({ variant: 'ghost', size: 'sm', label: 'About', onClick: () => openAbout() });
const head = h('header', { class: 'pg-head' }, libraryBtn, settingsBtn, h('span', { class: 'pg-grow' }), aboutBtn);

/* the bar: how icons arrive, what is selected, and what a click will do */
const asSeg = Segmented({ label: 'Insert as', value: plug.as, options: AS, onChange: v => { plug.as = v; saveSoon(); paintBar(); } });
const swapSwitch = Switch({ label: 'Swap on click', checked: plug.swap, onChange: v => { plug.swap = v; saveSoon(); paintBar(); } });
const insertBtn = Button({ size: 'sm', label: 'Insert', onClick: () => insertKeys([...plug.ticked]) });
const clearBtn = Button({ variant: 'ghost', size: 'sm', label: 'Clear', onClick: () => { plug.ticked.clear(); markTicks(); paintBar(); } });
const tickAllBtn = Button({ variant: 'outline', size: 'sm', label: 'Tick all', title: 'Tick every icon the grid shows, to insert them in one go', onClick: () => { for (const e of grid.results()) plug.ticked.add(e.key); markTicks(); paintBar(); } });
const syncSelBtn = Button({ variant: 'outline', size: 'sm', label: 'Update selection', title: 'Redraw the selected Beetle Glyphs icons at the current settings', onClick: () => startSync('selection') });
const syncPageBtn = Button({ variant: 'outline', size: 'sm', label: 'Update page', title: 'Redraw every Beetle Glyphs icon on this page at the current settings', onClick: () => startSync('page') });
const selLine = h('div', { class: 'pg-sel' });
const swapRow = h('label', { class: 'pg-swap' }, swapSwitch.el, h('span', {}, 'Swap on click'));
const bar = h('footer', { class: 'pg-bar' },
  h('div', { class: 'pg-row' }, h('span', { class: 'pg-label' }, 'Insert as'), asSeg.el),
  h('div', { class: 'pg-row' }, selLine, swapRow),
  h('div', { class: 'pg-row pg-actions' }, tickAllBtn, clearBtn, syncSelBtn, syncPageBtn, h('span', { class: 'pg-grow' }), insertBtn),
  status);
document.body.append(head, h('main', { class: 'pg-main' }, grid.el), bar);

function paintBar() {
  const n = plug.ticked.size, sel = plug.selection;
  insertBtn.textContent = n ? `Insert ${fmtInt(n)}` : 'Insert';
  insertBtn.disabled = !n || plug.busy;
  clearBtn.hidden = !n;
  for (const b of [tickAllBtn, syncSelBtn, syncPageBtn]) b.disabled = plug.busy;
  syncSelBtn.disabled = plug.busy || !sel.ours.length;
  const ours = sel.ours.length;
  swapRow.hidden = !ours;
  selLine.textContent = n ? `${fmtInt(n)} ticked. Click more icons to tick them, or insert them all.`
    : ours && plug.swap ? `${ours === 1 ? sel.ours[0].name : fmtInt(ours) + ' icons'} selected. Click an icon to swap ${ours === 1 ? 'it' : 'them'}.`
    : sel.count ? `${fmtInt(sel.count)} selected. Click an icon to insert it there. Shift-click to tick several.`
    : 'Click an icon to insert it. Shift-click to tick several, or drag one onto the canvas.';
}

/* ---------- the grid's tiles: click, tick, drag ---------- */
function markTicks() {
  for (const t of tiles.querySelectorAll('[data-key]')) {
    t.classList.toggle('ticked', plug.ticked.has(t.dataset.key));
    if (!t.draggable) t.draggable = true;
  }
}
new MutationObserver(markTicks).observe(tiles, { childList: true });
tiles.addEventListener('dragstart', ev => { const t = ev.target.closest && ev.target.closest('[data-key]'); if (t && ev.dataTransfer) ev.dataTransfer.setData('text/plain', t.dataset.key); });
/* the site's grid picks an icon for its inspector; here a click inserts, ticks or swaps, so the grid's own handler never runs */
tiles.addEventListener('click', ev => {
  const t = ev.target.closest('[data-key]'); if (!t) return;
  ev.stopPropagation();
  const key = t.dataset.key;
  if (plug.ticked.size || ev.shiftKey || ev.metaKey || ev.ctrlKey) {
    if (plug.ticked.has(key)) plug.ticked.delete(key); else plug.ticked.add(key);
    markTicks(); paintBar(); return;
  }
  if (plug.busy) return;
  if (plug.swap && plug.selection.ours.length) swapTo(key); else insertKeys([key]);
}, true);
tiles.addEventListener('dragend', async ev => {
  const t = ev.target.closest && ev.target.closest('[data-key]');
  const { clientX, clientY } = ev;
  /* let go inside the panel: not a drop on the canvas */
  if (!t || (clientX >= 0 && clientY >= 0 && clientX <= innerWidth && clientY <= innerHeight)) return;
  const item = await itemFor(t.dataset.key, plug.as);
  parent.postMessage({ pluginDrop: { clientX, clientY, items: [], dropMetadata: { source: 'beetle-glyphs', item, as: plug.as, size: store.get().view.size } } }, '*');
});

/* ---------- insert, swap, update ---------- */
async function busy(fn) {
  plug.busy = true; paintBar();
  try { await fn(); } catch (err) { say(err.message || String(err)); } finally { plug.busy = false; paintBar(); }
}
function insertKeys(keys) {
  return busy(async () => {
    const as = plug.as, cap = CAP[as];
    if (!keys.length) return;
    const list = keys.slice(0, cap);
    const id = 'i' + (++seq), size = store.get().view.size;
    for (let i = 0; i < list.length; i += CHUNK) {
      const items = [];
      for (const k of list.slice(i, i + CHUNK)) items.push(await itemFor(k, as));
      const last = i + CHUNK >= list.length;
      const done = reply('inserted', id);
      post({ type: 'insert', id, as, size, total: list.length, items, last });
      const r = await done;
      if (list.length > 1) say(`Inserted ${fmtInt(r.count)} of ${fmtInt(list.length)}`);
    }
    say(list.length < keys.length ? `Inserted the first ${fmtInt(cap)}. A batch stops there so Figma keeps up.` : list.length === 1 ? `Inserted ${exportName(list[0])}` : `Inserted ${fmtInt(list.length)} icons`);
    if (list.length > 1) { plug.ticked.clear(); markTicks(); }
  });
}
function swapTo(key) {
  return busy(async () => {
    const done = reply('swapped', 0);
    post({ type: 'swap', item: await itemFor(key, 'all') });
    const r = await done;
    say(r.count ? `Swapped for ${exportName(key)}` : 'Nothing to swap');
  });
}
function startSync(scope) { return busy(() => { const job = 's' + (++seq); const done = reply('sync-done', job); post({ type: 'sync', scope, job }); return done; }); }
/* code.js lists the icons it found; each is drawn at the current settings, a
   variant keeping its own style and corners */
async function runSync(msg) {
  const list = msg.targets.filter(t => entryOf(t.key));
  let count = 0;
  for (let i = 0; i < list.length || i === 0; i += CHUNK) {
    const items = [];
    for (const t of list.slice(i, i + CHUNK)) {
      const over = t.kind === 'variant' && t.P ? { weight: t.P.weight, corners: t.P.corners } : {};
      const it = await itemFor(t.key, 'frame', over);
      items.push({ id: t.id, svg: it.svg, P: it.P, color: it.color });
    }
    const last = i + CHUNK >= list.length;
    const done = reply('synced', msg.job);
    post({ type: 'sync-apply', job: msg.job, items, last });
    count = (await done).count;
  }
  say(count ? `Updated ${fmtInt(count)} ${count === 1 ? 'icon' : 'icons'} to the current settings` : msg.scope === 'page' ? 'No Beetle Glyphs icons on this page' : 'No Beetle Glyphs icons in the selection');
  const w = waiting.get('sync-done:' + msg.job); if (w) { waiting.delete('sync-done:' + msg.job); w.resolve({ count }); }
}

/* ---------- About ---------- */
function openAbout() {
  const text = id => document.getElementById(id).textContent;
  openSheet({ side: 'right', title: 'About Beetle Glyphs', content: h('div', { class: 'stack pg-about', style: { gap: '14px' } },
    h('p', {}, `${fmtInt(lib.sets.all)} icons and ${lib.sets.scenarios} app scenarios, drawn by the same engine as the Beetle Glyphs site: the four-style set (${fmtInt(lib.sets.four)} icons in stroke, two-tone, duotone and fill, rounded and sharp), the core set (${fmtInt(lib.sets.core)}), and the app's own ${lib.sets.beetle} glyphs and parametric icons.`),
    h('p', {}, 'The toolbar is the site\'s own. Size is the size an icon arrives at, and Color is its colour, black when none is picked. Everything is inside the plugin, and it never uses the network.'),
    h('p', {}, 'Lines stay live strokes, so you can still change their weight in Figma. A filled part with a cut in it arrives as one shape with a hole. Goo is left out, because Figma cannot import SVG filters.'),
    h('p', {}, 'Each icon remembers its name and settings. Select one and use Update selection, or the button in the right panel, to redraw it at the current settings.'),
    h('p', {}, h('a', { href: REPO, target: '_blank', rel: 'noopener' }, 'Source and support on GitHub')),
    h('h3', { class: 'font-semibold' }, 'The core set: ISC licence'),
    h('pre', { class: 'pg-licence' }, text('licence-core')),
    h('h3', { class: 'font-semibold' }, 'The four-style set: MIT licence'),
    h('pre', { class: 'pg-licence' }, text('licence-four')),
    h('p', { class: 'hint' }, 'The app glyphs and the parametric icons belong to the Beetle wallet design.')) });
}

/* ---------- settings: kept by Figma on this computer ---------- */
const saveSoon = debounce(() => { const s = store.get(); post({ type: 'save', settings: { P: s.P, view: s.view, filter: s.filter, as: plug.as, swap: plug.swap } }); }, 300);
store.subscribe((s, keys) => {
  if (keys.includes('P') && s.P.goo) { store.set({ P: { ...s.P, goo: 0 } }); return; } // no goo in Figma
  if (keys.some(k => ['P', 'view', 'filter'].includes(k)) && s.ready) saveSoon();
  if (keys.includes('P') && s.ready) loadDrawings(drawingFile(s.P.weight, s.P.corners)).catch(() => {});
});
function restore(saved) {
  if (!saved || typeof saved !== 'object') return {};
  const s = store.get(), out = {};
  if (saved.P && typeof saved.P === 'object') {
    const P = { ...E.DEF, ...saved.P, goo: 0 };
    if (!E.WEIGHTS.includes(P.weight)) P.weight = E.DEF.weight;
    if (!CORNERS.includes(P.corners)) P.corners = E.DEF.corners;
    for (const k of ['S', 'R', 'G', 'choke', 'fillet']) if (!Number.isFinite(+P[k])) P[k] = E.DEF[k];
    out.P = P;
  }
  if (saved.view && typeof saved.view === 'object') {
    const v = { ...s.view, ...saved.view };
    v.size = Math.min(48, Math.max(16, +v.size || s.view.size));
    v.color = /^#[0-9a-f]{6}$/i.test(v.color || '') ? v.color : null;
    v.names = v.names !== false;
    out.view = v;
  }
  if (saved.filter && typeof saved.filter === 'object') out.filter = { ...s.filter, ...saved.filter };
  if (AS.some(a => a.value === saved.as)) plug.as = saved.as;
  if (typeof saved.swap === 'boolean') plug.swap = saved.swap;
  return out;
}

/* ---------- messages from code.js ---------- */
window.addEventListener('message', ev => {
  const m = ev.data && ev.data.pluginMessage; if (!m || !m.type) return;
  if (m.type === 'init') {
    plug.command = m.command;
    const patch = restore(m.saved);
    plug.selection = m.selection || plug.selection;
    /* opened from an icon's own button: the panel takes that icon's settings */
    const from = m.command === 'open' && plug.selection.ours.length === 1 ? plug.selection.ours[0] : null;
    if (from && from.P) { patch.P = { ...(patch.P || store.get().P), ...from.P, goo: 0 }; if (from.color && from.color !== '#000000') patch.view = { ...(patch.view || store.get().view), color: from.color }; }
    asSeg.set(plug.as); swapSwitch.set(plug.swap);
    store.set({ ...patch, sel: '' });
    const P = store.get().P;
    loadDrawings(drawingFile(P.weight, P.corners)).catch(() => {}).then(() => { store.set({ ready: true }); paintBar(); });
  } else if (m.type === 'selection') { plug.selection = m.selection; paintBar(); }
  else if (m.type === 'run-sync') startSync(m.scope);
  else if (m.type === 'sync-need') runSync(m).catch(err => { say(err.message); post({ type: 'notify', text: err.message, error: true }); });
  else if (m.type === 'error') {
    for (const [k, w] of waiting) { waiting.delete(k); w.reject(new Error(m.message)); }
  } else {
    const id = m.type === 'swapped' ? 0 : m.id != null ? m.id : m.job;
    const w = waiting.get(m.type + ':' + id); if (w) { waiting.delete(m.type + ':' + id); w.resolve(m); }
  }
});

/* ---------- go ---------- */
say('Loading the library');
paintBar();
loadLibrary(DATA_URL).then(() => { say(''); post({ type: 'ready' }); }, err => { say('The library did not load: ' + err.message); });
