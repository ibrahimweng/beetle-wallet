/* Goo, before and after: the icon as the grid and the plain exports draw it,
   beside it as the "with goo" exports draw it, at the same size, with the goo
   amount right under them. Goo is only ever added on the way out, so this is
   the one place it is seen before it is exported. */
import * as E from '../../lib/engine.js';
import { h } from '../../lib/utils.js';
import { TickSlider } from '../ui/tick-slider.js';
import { store } from '../../lib/store.js';
import { primsOf } from '../../lib/library.js';

export function GooPreview() {
  const before = h('div', { class: 'goo-art', role: 'img', 'aria-label': 'Without goo' });
  const after = h('div', { class: 'goo-art', role: 'img', 'aria-label': 'With goo' });
  const pair = h('div', { class: 'goo-pair' },
    h('figure', {}, before, h('figcaption', {}, 'Without')),
    h('figure', {}, after, h('figcaption', {}, 'With goo')));
  const slider = TickSlider({ id: 'goo-here', label: 'Goo', min: 0.1, max: 1.2, step: 0.05, value: store.get().P.goo, major: v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 && Math.round(v * 10) % 3 === 0, format: v => v.toFixed(2), fluid: true,
    onInput: v => store.set({ P: { ...store.get().P, goo: v } }) });
  const el = h('div', { class: 'stack', style: { gap: '10px' } }, pair,
    h('div', { class: 'field' }, h('label', { class: 'label', for: 'goo-here' }, 'Goo'), slider.el,
      h('div', { class: 'hint' }, 'The radius every inside and outside corner is rounded by, on the 24 grid; parts closer than twice it fuse. Lines and dots keep their weight. The same for the whole library.')));

  /* goo takes a moment to work out: at most once a frame, and only while it shows */
  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const s = store.get();
      if (!s.sel || !el.isConnected) return;
      const prims = primsOf(s.sel, s);
      before.innerHTML = E.svg(prims, s.P, { size: 72, uid: 'goo-b' });
      try { after.innerHTML = E.gooSvg(prims, s.P, { size: 72 }); } catch { after.innerHTML = ''; }
      slider.set(s.P.goo);
    });
  }
  store.subscribe((s, keys) => { if (keys.some(k => ['sel', 'P', 'edits', 'ready', 'scope'].includes(k))) refresh(); });
  return { el, refresh };
}
