import { h } from '../../lib/utils.js';

/* Segmented({ label, options: [{ value, label, title }], value, onChange, onPrefetch })
   -> { el, set }. A row of buttons on a muted track; the one that is on lifts
   out of it in the page's colour. onPrefetch runs on pointer-enter or focus of
   an option that is not on, so whatever it needs can start loading early. */
export function Segmented({ label, options, value, onChange, onPrefetch, class: klass }) {
  const buttons = options.map(o => {
    const b = h('button', { type: 'button', class: 'seg-item', 'data-value': o.value, 'aria-pressed': o.value === value ? 'true' : 'false', title: o.title || null }, o.label);
    b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') === 'true') return; set(o.value); onChange && onChange(o.value); });
    if (onPrefetch) { const pre = () => { if (b.getAttribute('aria-pressed') !== 'true') onPrefetch(o.value); }; b.addEventListener('pointerenter', pre); b.addEventListener('focus', pre); }
    return b;
  });
  const el = h('div', { class: ['segmented', klass], role: 'group', 'aria-label': label }, buttons);
  function set(v) { for (const b of buttons) b.setAttribute('aria-pressed', b.dataset.value === v ? 'true' : 'false'); }
  return { el, set };
}
