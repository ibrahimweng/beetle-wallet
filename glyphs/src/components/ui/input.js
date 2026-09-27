import { h } from '../../lib/utils.js';

export const Label = (text, forId) => h('label', { class: 'label', for: forId }, text);
export const Input = (attrs = {}) => h('input', { class: 'input', ...attrs });

/* Select({ options: [{ value, label }], value, onChange, ...attrs }) -> { el, set } */
export function Select({ options, value, onChange, ...attrs }) {
  const el = h('select', { class: 'select', ...attrs, onChange: () => onChange && onChange(el.value) });
  const fill = (opts, v) => { el.innerHTML = ''; for (const o of opts) el.append(h('option', { value: o.value, selected: o.value === v }, o.label)); };
  fill(options, value);
  return { el, set: v => { el.value = v; }, options: (opts, v) => fill(opts, v) };
}
