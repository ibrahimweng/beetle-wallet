/* Sidebar navigation: sets and categories, with counts; each category downloads
   as a ZIP of SVGs in the style the grid shows, plain or with goo (goo: false
   leaves the one with goo out). */
import { h, fmtInt, ICO } from '../../lib/utils.js';
import { store } from '../../lib/store.js';
import { lib } from '../../lib/library.js';
import { categoryZip, saveFile } from '../../lib/export.js';

const SETS = [['all', 'All icons'], ['scenarios', 'App scenarios'], ['beetle', 'App glyphs'], ['four', 'Four-style set'], ['core', 'Core set']];

const busy = new Set(); // downloads being zipped (the category, and :goo for one with goo), kept across re-renders

export function Sidebar({ goo = true } = {}) {
  const el = h('nav', { class: 'sidebar', 'aria-label': 'Library' });
  const status = h('div', { class: 'sr-only', role: 'status' });
  async function download(cat, goo, btn) {
    const job = cat + (goo ? ':goo' : '');
    if (busy.has(job)) return;
    const label = cat.replace(/-/g, ' ') + (goo ? ' with goo' : '');
    busy.add(job); btn.setAttribute('aria-busy', 'true'); status.textContent = `Preparing ${label}…`;
    try {
      const { name, blob, count } = await categoryZip(cat, store.get(), { goo, progress: goo ? (n, total) => { status.textContent = `Adding goo to ${cat.replace(/-/g, ' ')}: ${fmtInt(n)} of ${fmtInt(total)} icons…`; } : null });
      status.textContent = `${await saveFile(name, blob, 'application/zip')} ${fmtInt(count)} icons in ${label}.`;
    } catch (e) { status.textContent = `Could not prepare ${label}: ${e.message}`; }
    busy.delete(job); el.querySelectorAll('.nav-dl[aria-busy]').forEach(b => { if (!busy.has(b.dataset.job)) b.removeAttribute('aria-busy'); });
  }
  const catRow = c => {
    const label = c.name.replace(/-/g, ' ');
    const dl = goo => {
      const job = c.name + (goo ? ':goo' : '');
      const b = h('button', { type: 'button', class: ['nav-dl', goo && 'nav-dl-goo'], 'data-job': job, 'aria-label': `Download ${label} as SVGs${goo ? ' with goo' : ''}`,
        title: goo ? `Download ${label} with goo (${fmtInt(c.count)} SVGs, paths alone)` : `Download ${label} (${fmtInt(c.count)} SVGs, in the grid's style)`, html: goo ? ICO.downloadGoo : ICO.download, 'aria-busy': busy.has(job) ? 'true' : null });
      b.addEventListener('click', () => download(c.name, goo, b));
      return b;
    };
    return h('div', { class: 'nav-row' },
      h('button', { type: 'button', class: 'nav-item', 'aria-current': store.get().filter.cat === c.name ? 'true' : null, onClick: () => store.set({ filter: { ...store.get().filter, cat: c.name, set: store.get().filter.set === 'scenarios' ? 'all' : store.get().filter.set } }) }, h('span', { class: 'truncate' }, label), h('span', { class: 'count' }, fmtInt(c.count))),
      h('div', { class: 'nav-dls' }, dl(false), goo ? dl(true) : null));
  };
  function render() {
    const f = store.get().filter;
    el.innerHTML = '';
    el.append(h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, 'Sets'), ...SETS.map(([v, label]) => h('button', { type: 'button', class: 'nav-item', 'aria-current': f.set === v ? 'true' : null, onClick: () => store.set({ filter: { ...store.get().filter, set: v, cat: 'all' } }) }, h('span', { class: 'truncate' }, label), h('span', { class: 'count' }, fmtInt(lib.sets[v] || 0))))));
    el.append(h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, 'Categories'),
      h('button', { type: 'button', class: 'nav-item', 'aria-current': f.cat === 'all' ? 'true' : null, onClick: () => store.set({ filter: { ...store.get().filter, cat: 'all' } }) }, h('span', {}, 'All categories')),
      ...lib.cats.map(catRow)));
    el.append(status);
  }
  const destroy = store.subscribe((s, keys) => { if (keys.includes('filter') || keys.includes('ready')) render(); });
  return { el, render, destroy };
}
