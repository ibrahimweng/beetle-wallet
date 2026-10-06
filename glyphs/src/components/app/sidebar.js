/* Sidebar navigation: sets and categories, with counts. */
import { h, fmtInt } from '../../lib/utils.js';
import { store } from '../../lib/store.js';
import { lib } from '../../lib/library.js';

const SETS = [['all', 'All icons'], ['scenarios', 'App scenarios'], ['beetle', 'App glyphs'], ['four', 'Four-style set'], ['core', 'Core set']];

export function Sidebar() {
  const el = h('nav', { class: 'sidebar', 'aria-label': 'Library' });
  function render() {
    const f = store.get().filter;
    el.innerHTML = '';
    el.append(h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, 'Sets'), ...SETS.map(([v, label]) => h('button', { type: 'button', class: 'nav-item', 'aria-current': f.set === v ? 'true' : null, onClick: () => store.set({ filter: { ...store.get().filter, set: v, cat: 'all' } }) }, h('span', { class: 'truncate' }, label), h('span', { class: 'count' }, fmtInt(lib.sets[v] || 0))))));
    el.append(h('div', { class: 'nav-group' }, h('div', { class: 'nav-title' }, 'Categories'),
      h('button', { type: 'button', class: 'nav-item', 'aria-current': f.cat === 'all' ? 'true' : null, onClick: () => store.set({ filter: { ...store.get().filter, cat: 'all' } }) }, h('span', {}, 'All categories')),
      ...lib.cats.map(c => h('button', { type: 'button', class: 'nav-item', 'aria-current': f.cat === c.name ? 'true' : null, onClick: () => store.set({ filter: { ...store.get().filter, cat: c.name, set: store.get().filter.set === 'scenarios' ? 'all' : store.get().filter.set } }) }, h('span', { class: 'truncate' }, c.name.replace(/-/g, ' ')), h('span', { class: 'count' }, fmtInt(c.count))))));
  }
  const destroy = store.subscribe((s, keys) => { if (keys.includes('filter') || keys.includes('ready')) render(); });
  return { el, render, destroy };
}
