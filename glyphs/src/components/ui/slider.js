import { h } from '../../lib/utils.js';

/* Slider({ id, label, min, max, step, value, format, hint, onInput }) -> { el, set } */
export function Slider({ id, label, min, max, step, value, format = v => String(v), hint, onInput }) {
  const out = h('output', { for: id }, format(value));
  const input = h('input', { type: 'range', class: 'slider', id, min, max, step, value, 'aria-label': label });
  input.addEventListener('input', () => { out.textContent = format(+input.value); onInput && onInput(+input.value); });
  const el = h('div', { class: 'slider-row' }, h('label', { class: 'label', for: id }, label), out, input, hint ? h('div', { class: 'hint' }, hint) : null);
  return { el, set: v => { input.value = v; out.textContent = format(+v); } };
}
