import { h } from '../../lib/utils.js';

/* ToggleGroup({ options: [{ value, label, icon }], value, onChange, label }) -> { el, set } */
export function ToggleGroup({ options, value, onChange, label }) {
  const buttons = options.map(o => {
    const b = h('button', { type: 'button', 'data-value': o.value, 'data-state': o.value === value ? 'on' : 'off', 'aria-pressed': o.value === value ? 'true' : 'false', title: o.title || o.label });
    if (o.icon) b.insertAdjacentHTML('beforeend', o.icon);
    if (o.label) b.append(document.createTextNode(o.label));
    b.addEventListener('click', () => { set(o.value); onChange && onChange(o.value); });
    return b;
  });
  const el = h('div', { class: 'toggle-group', role: 'group', 'aria-label': label }, buttons);
  function set(v) { for (const b of buttons) { const on = b.dataset.value === v; b.dataset.state = on ? 'on' : 'off'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); } }
  return { el, set };
}
