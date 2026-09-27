/* The icon grid: toolbar with search, weight and surface; tiles in pages. */
import * as E from '../../lib/engine.js';
import { h, ICO, fmtInt, debounce } from '../../lib/utils.js';
import { Input } from '../ui/input.js';
import { ToggleGroup } from '../ui/toggle-group.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import { store } from '../../lib/store.js';
import { lib, search, primsOf } from '../../lib/library.js';

const PAGE = 240;

export function IconGrid() {
  let results = [], shown = 0, uid = 0;
  const q = Input({ type: 'search', id: 'q', placeholder: 'Filter by name or tag', 'aria-label': 'Filter icons', autocomplete: 'off', value: store.get().filter.q, style: { maxWidth: '360px' } });
  q.addEventListener('input', debounce(() => store.set({ filter: { ...store.get().filter, q: q.value } }), 120));
  const weight = ToggleGroup({ label: 'Weight', value: store.get().P.weight, options: [{ value: 'outline', label: 'Outline', icon: ICO.circle }, { value: 'solid', label: 'Solid', icon: ICO.disc }], onChange: v => store.set({ P: { ...store.get().P, weight: v } }) });
  const surface = ToggleGroup({ label: 'Preview surface', value: store.get().surface, options: [{ value: 'red', label: 'Red' }, { value: 'paper', label: 'Paper' }, { value: 'night', label: 'Night' }], onChange: v => store.set({ surface: v }) });
  const count = h('span', { class: 'count tabular' });
  const grid = h('div', { class: 'grid', role: 'list' });
  const more = Button({ variant: 'outline', size: 'sm', label: 'Show more', onClick: () => renderMore() });
  const foot = h('div', { class: 'grid-foot' }, more, h('span', { class: 'status' }));
  const title = h('h1', { class: 'page-title' }, 'Icon library');
  const desc = h('p', { class: 'page-desc' }, 'Every icon is centrelines on a 24 grid, re-derived from the parameters. Pick one to edit its points or export it.');
  const badges = h('div', { class: 'row wrap', style: { gap: '6px' } });
  const el = h('section', { class: 'main', id: 'library' },
    h('div', { class: 'page-head' }, title, desc, badges),
    h('div', { class: 'toolbar' }, q, weight.el, surface.el, count),
    grid, foot);

  const tile = e => { const s = store.get(); const svg = E.svg(primsOf(e.key, s), s.P, { size: 28, uid: 'g' + (++uid) }); return h('button', { type: 'button', class: 'tile', role: 'listitem', 'data-key': e.key, 'aria-pressed': e.key === s.sel ? 'true' : 'false', title: e.label, html: svg }, h('span', { class: 'truncate' }, e.label)); };
  function renderMore() {
    const slice = results.slice(shown, shown + PAGE);
    if (!shown && !slice.length) grid.append(h('div', { class: 'text-muted', style: { gridColumn: '1 / -1', padding: '32px', textAlign: 'center' } }, 'Nothing matches. Try another word.'));
    for (const e of slice) grid.append(tile(e));
    shown += slice.length;
    more.hidden = shown >= results.length;
    foot.querySelector('.status').textContent = results.length > PAGE ? `Showing ${fmtInt(shown)} of ${fmtInt(results.length)}` : '';
  }
  function run() {
    const s = store.get(); results = search(s.filter); shown = 0; grid.innerHTML = ''; renderMore();
    const f = s.filter; const setName = { all: 'All icons', scenarios: 'App scenarios', beetle: 'Beetle glyphs', lucide: 'Lucide' }[f.set] || 'Icons';
    title.textContent = f.cat && f.cat !== 'all' ? `${setName} · ${f.cat.replace(/-/g, ' ')}` : setName;
    count.textContent = `${fmtInt(results.length)} icons`;
  }
  function refresh() { const keep = Math.max(shown, Math.min(PAGE, results.length)); shown = 0; grid.innerHTML = ''; while (shown < keep) { const b = shown; renderMore(); if (shown === b) break; } }
  function markSel() { const k = store.get().sel; grid.querySelectorAll('[data-key]').forEach(t => t.setAttribute('aria-pressed', t.dataset.key === k ? 'true' : 'false')); }
  grid.addEventListener('click', ev => { const t = ev.target.closest('[data-key]'); if (t) store.set({ sel: t.dataset.key }); });
  store.subscribe((s, keys) => {
    if (keys.includes('ready')) { badges.innerHTML = ''; badges.append(Badge(`${fmtInt(lib.sets.all)} icons`, 'secondary'), Badge(`Lucide ${lib.meta.version.lucide}`, 'outline'), Badge(`${lib.sets.beetle} Beetle glyphs`, 'outline'), Badge(`${lib.sets.scenarios} scenarios`, 'outline')); run(); }
    if (keys.includes('filter')) { if (q.value !== s.filter.q) q.value = s.filter.q; run(); }
    if (keys.includes('P') || keys.includes('edits')) { weight.set(s.P.weight); refresh(); }
    if (keys.includes('surface')) surface.set(s.surface);
    if (keys.includes('sel')) markSel();
  });
  return { el, results: () => results };
}
