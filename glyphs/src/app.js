/* Beetle Glyphs — app bootstrap. Loads the library, mounts the shell and wires
   the theme, the command palette and the mobile sheets. */
import * as E from './lib/engine.js';
import { h, ICO, isMac } from './lib/utils.js';
import { store } from './lib/store.js';
import { lib, loadLibrary, quickSearch, primsOf } from './lib/library.js';
import { Topbar } from './components/app/topbar.js';
import { Sidebar } from './components/app/sidebar.js';
import { IconGrid } from './components/app/icon-grid.js';
import { Inspector } from './components/app/inspector.js';
import { CommandPalette } from './components/ui/command.js';
import { openSheet } from './components/ui/sheet.js';
import { Card } from './components/ui/card.js';

const REPO = 'https://github.com/ibrahimweng/beetle-wallet/tree/main/glyphs';

/* ---------- theme: light, dark or system; the claude.ai host may stamp data-theme ---------- */
const media = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = store.get().theme;
  const host = document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t === 'system' && (host ? host === 'dark' : media.matches));
  document.documentElement.classList.toggle('dark', dark);
}
media.addEventListener('change', applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
const applySurface = () => { document.documentElement.dataset.surface = store.get().surface; };
store.subscribe((s, keys) => { if (keys.includes('theme')) applyTheme(); if (keys.includes('surface')) applySurface(); });
applyTheme(); applySurface();

/* ---------- shell ---------- */
const palette = CommandPalette({
  search: q => quickSearch(q, 40).map(e => ({ key: e.key, label: e.label, meta: e.set, icon: E.svg(primsOf(e.key, store.get()), store.get().P, { size: 20, uid: 'c' + e.key.replace(/[^a-z0-9]/gi, '') }) })),
  onPick: it => store.set({ sel: it.key }),
});
const sidebar = Sidebar();
const grid = IconGrid();
const inspector = Inspector();
const topbar = Topbar({
  onSearch: () => palette.open(),
  onMenu: () => { const nav = Sidebar(); nav.el.classList.add('in-sheet'); nav.render(); const close = openSheet({ side: 'left', title: 'Library', content: nav.el }); const un = store.subscribe((s, keys) => { if (keys.includes('filter')) { close(); un(); } }); },
  onInspector: () => { const box = h('div', { class: 'inspector in-sheet' }); box.append(inspector.el); openSheet({ side: 'right', title: 'Inspector', content: box }); },
  repo: REPO,
});
const aside = h('aside', { class: 'inspector', 'aria-label': 'Inspector' }, inspector.el);
const about = h('section', { class: 'about', id: 'about' },
  Card({ title: 'Engine', description: 'Polylines with per-vertex radius kinds, arcs, quadratic loops and SVG paths. Straight joins get true circular fillets. Quarter-circle corners in Lucide paths follow the box corner slider.' }),
  Card({ title: 'Solid weight', description: 'Closed shapes fill and inflate by S with round joins. Anything sitting inside a closed shape becomes a cut of S. Set any part by hand from the editor.' }),
  Card({ title: 'Exports', description: 'SVG keeps curves and the goo filter. Sprite and font flatten every primitive, offset it by S/2 with round joins and caps through Clipper, union and cut it.' }),
  Card({ title: 'Licenses', description: 'Lucide icons © Lucide Contributors, ISC license. Beetle glyphs from the Beetle wallet design. The engine and this site live in the beetle-wallet repository.' }));
grid.el.append(about);
const shell = h('div', { class: 'shell' }, sidebar.el, grid.el, aside);
document.body.append(topbar.el, shell);

/* mobile: the inspector's tabs live in a sheet; put the panel back when it closes */
const inspectorHome = aside;
new MutationObserver(() => { if (!document.body.contains(inspector.el)) inspectorHome.append(inspector.el); }).observe(document.body, { childList: true });

document.addEventListener('keydown', ev => {
  if ((ev.key === 'k' || ev.key === 'K') && (isMac ? ev.metaKey : ev.ctrlKey)) { ev.preventDefault(); palette.toggle(); }
  if (ev.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { ev.preventDefault(); palette.open(); }
});

/* ---------- go ---------- */
loadLibrary('data/icons.json').then(() => {
  if (!lib.byKey.has(store.get().sel)) store.set({ sel: 'param:card' });
  store.set({ ready: true });
  inspector.refresh();
}).catch(err => {
  grid.el.querySelector('.grid').innerHTML = `<div class="text-muted" style="grid-column:1/-1;padding:32px;text-align:center">The library did not load: ${err.message}</div>`;
});
