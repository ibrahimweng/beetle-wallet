import { h } from '../../lib/utils.js';

/* Tabs({ tabs: [{ value, label, content }], value, onChange }) -> { el, set } */
export function Tabs({ tabs, value, onChange }) {
  const triggers = tabs.map(t => h('button', { type: 'button', role: 'tab', 'data-value': t.value, 'data-state': t.value === value ? 'active' : 'inactive', 'aria-selected': t.value === value ? 'true' : 'false', onClick: () => { set(t.value); onChange && onChange(t.value); } }, t.label));
  const panels = tabs.map(t => h('div', { class: 'tabs-content', role: 'tabpanel', 'data-value': t.value, hidden: t.value !== value }, t.content));
  const el = h('div', { class: 'tabs' }, h('div', { class: 'tabs-list', role: 'tablist' }, triggers), panels);
  function set(v) {
    triggers.forEach(b => { const on = b.dataset.value === v; b.dataset.state = on ? 'active' : 'inactive'; b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    panels.forEach(p => { p.hidden = p.dataset.value !== v; });
  }
  return { el, set };
}
