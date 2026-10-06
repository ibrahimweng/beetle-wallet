import { h } from '../../lib/utils.js';

/* Switch({ label, checked, onChange }) -> { el, set }. A track with the white
   capsule of the sliders riding in it. */
export function Switch({ label, checked = false, onChange }) {
  const el = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': checked ? 'true' : 'false', 'aria-label': label }, h('span', { class: 'switch-knob' }));
  el.addEventListener('click', () => { const v = el.getAttribute('aria-checked') !== 'true'; set(v); onChange && onChange(v); });
  function set(v) { el.setAttribute('aria-checked', v ? 'true' : 'false'); }
  return { el, set };
}
