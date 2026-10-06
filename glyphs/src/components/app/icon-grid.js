/* The icon grid: the filter, the toolbar, and tiles in pages. The tiles take
   their size, colour, names and columns from the toolbar's view; with the names
   off, one shared label glides from tile to tile under the pointer. */
import * as E from '../../lib/engine.js';
import { h, fmtInt, debounce, reducedMotion } from '../../lib/utils.js';
import { Input } from '../ui/input.js';
import { Button } from '../ui/button.js';
import { Badge } from '../ui/badge.js';
import { store } from '../../lib/store.js';
import { lib, search, primsOf, onDrawings, drawingFile } from '../../lib/library.js';
import { Toolbar } from './toolbar.js';

const PAGE = 240;
const SET_NAME = { all: 'All icons', scenarios: 'App scenarios', beetle: 'App glyphs', core: 'Core set', four: 'Four-style set' };

export function IconGrid() {
  let results = [], shown = 0, uid = 0;
  const q = Input({ type: 'search', id: 'q', placeholder: 'Filter by name or tag', 'aria-label': 'Filter icons', autocomplete: 'off', value: store.get().filter.q, style: { maxWidth: '360px' } });
  q.addEventListener('input', debounce(() => store.set({ filter: { ...store.get().filter, q: q.value } }), 120));
  const toolbar = Toolbar();
  const grid = h('div', { class: 'grid', role: 'list' });
  const tip = h('div', { class: 'grid-tip', 'aria-hidden': 'true', hidden: true }, h('span', { class: 'grid-tip-text' }), h('span', { class: 'grid-tip-arrow' }));
  const gridWrap = h('div', { class: 'grid-wrap' }, grid, tip);
  const more = Button({ variant: 'outline', size: 'sm', label: 'Show more', onClick: () => renderMore() });
  const foot = h('div', { class: 'grid-foot' }, more, h('span', { class: 'status' }));
  const title = h('h1', { class: 'page-title' }, 'Icon library');
  const desc = h('p', { class: 'page-desc' }, 'Every icon is drawn on a 24 grid and re-derived from the settings above it. Pick one: the panel on the right is about that icon; switch it to the whole library to change every icon at once.');
  const badges = h('div', { class: 'row wrap', style: { gap: '6px' } });
  const el = h('section', { class: 'main', id: 'library' },
    h('div', { class: 'page-head' }, title, desc, badges, q),
    toolbar.el,
    gridWrap, foot);

  const tile = e => { const s = store.get(); const svg = E.svg(primsOf(e.key, s), s.P, { size: s.view.size, uid: 'g' + (++uid) }); return h('button', { type: 'button', class: 'tile', role: 'listitem', 'data-key': e.key, 'aria-pressed': e.key === s.sel ? 'true' : 'false', 'aria-label': e.label, html: svg }, h('span', { class: 'truncate' }, e.label)); };
  function renderMore() {
    const slice = results.slice(shown, shown + PAGE);
    if (!shown && !slice.length) grid.append(h('div', { class: 'text-muted', style: { gridColumn: '1 / -1', padding: '32px', textAlign: 'center' } }, 'Nothing matches. Try another word.'));
    for (const e of slice) grid.append(tile(e));
    shown += slice.length;
    more.hidden = shown >= results.length;
    foot.querySelector('.status').textContent = results.length > PAGE ? `Showing ${fmtInt(shown)} of ${fmtInt(results.length)}` : '';
  }
  function run() {
    const s = store.get(); const f = s.filter;
    const unboxed = search({ ...f, box: 'all' });
    results = f.box && f.box !== 'all' ? unboxed.filter(e => (e.box || 'regular') === f.box) : unboxed;
    const byBox = { all: unboxed.length, regular: 0, square: 0, circle: 0 };
    for (const e of unboxed) byBox[e.box || 'regular']++;
    toolbar.setCounts(results.length, byBox);
    shown = 0; grid.innerHTML = ''; hideTip(true); renderMore();
    const setName = SET_NAME[f.set] || 'Icons';
    title.textContent = f.cat && f.cat !== 'all' ? `${setName} · ${f.cat.replace(/-/g, ' ')}` : setName;
  }
  function refresh() { const keep = Math.max(shown, Math.min(PAGE, results.length)); shown = 0; grid.innerHTML = ''; while (shown < keep) { const b = shown; renderMore(); if (shown === b) break; } }
  function applyView() {
    const v = store.get().view;
    grid.style.setProperty('--icon-size', v.size + 'px');
    grid.style.color = v.color || '';
    grid.classList.toggle('picked', !!v.color);
    grid.classList.toggle('no-names', !v.names);
    grid.style.gridTemplateColumns = v.cols ? `repeat(${v.cols}, minmax(0, 1fr))` : '';
    grid.classList.toggle('cols', !!v.cols);
  }
  function markSel() { const k = store.get().sel; grid.querySelectorAll('[data-key]').forEach(t => t.setAttribute('aria-pressed', t.dataset.key === k ? 'true' : 'false')); }
  grid.addEventListener('click', ev => { const t = ev.target.closest('[data-key]'); if (t) store.set({ sel: t.dataset.key }); });

  /* the shared label: it moves from tile to tile, fades where it stands when the
     pointer leaves, and a fresh one appears in place rather than flying in */
  const tipText = tip.querySelector('.grid-tip-text'), tipArrow = tip.querySelector('.grid-tip-arrow');
  let tipOn = false;
  function showTip(t) {
    if (!grid.classList.contains('no-names')) return;
    const g = gridWrap.getBoundingClientRect(), r = t.getBoundingClientRect();
    tipText.textContent = t.getAttribute('aria-label');
    tip.hidden = false;
    const w = tip.offsetWidth, cx = r.left - g.left + r.width / 2;
    const x = Math.max(0, Math.min(g.width - w, cx - w / 2)), y = r.top - g.top - tip.offsetHeight - 6;
    if (!tipOn) { tip.classList.add('instant'); void tip.offsetWidth; }
    tip.style.translate = `${x}px ${y}px`; tipArrow.style.left = `${cx - x}px`;
    tip.classList.add('on');
    if (!tipOn) { void tip.offsetWidth; tip.classList.remove('instant'); }
    tipOn = true;
  }
  function hideTip(now) { tipOn = false; tip.classList.remove('on'); if (now || reducedMotion()) tip.hidden = true; }
  grid.addEventListener('pointerover', ev => { const t = ev.target.closest('[data-key]'); if (t && ev.pointerType !== 'touch') showTip(t); });
  gridWrap.addEventListener('pointerleave', () => hideTip());

  /* a style or corners whose drawings were still on their way: draw again once they are here */
  onDrawings(file => { const s = store.get(); if (file === drawingFile(s.P.weight, s.P.corners) || (file === 'fills' && s.P.weight !== 'outline')) refresh(); });
  store.subscribe((s, keys) => {
    if (keys.includes('ready')) { badges.innerHTML = ''; badges.append(Badge(`${fmtInt(lib.sets.all)} icons`, 'secondary'), Badge(`${fmtInt(lib.sets.four)} four-style`, 'outline'), Badge(`${fmtInt(lib.sets.core)} core`, 'outline'), Badge(`${lib.sets.beetle} app glyphs`, 'outline'), Badge(`${lib.sets.scenarios} scenarios`, 'outline')); run(); }
    if (keys.includes('filter')) { if (q.value !== s.filter.q) q.value = s.filter.q; run(); }
    if (keys.includes('view')) applyView();
    if (keys.includes('P') || keys.includes('edits')) refresh();
    if (keys.includes('sel')) markSel();
  });
  applyView();
  return { el, results: () => results };
}
