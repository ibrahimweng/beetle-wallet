import { h } from '../../lib/utils.js';

/* TickSlider({ label, min, max, step, value, major, unit, format, onInput, fluid })
   -> { el, set }. A row of ticks, one per step, the major ones taller; every tick
   up to the value in ink and the rest faint, and a white capsule riding on top.
   A real range input lies over it, invisible, so the keyboard, a click that
   jumps and a drag all behave as a slider does; its thumb is the capsule's size,
   so the value the browser reads is the one under the capsule. fluid fills the
   row it sits in; otherwise the ticks keep a fixed pitch. */
const PITCH = 6, INSET = 14;
export function TickSlider({ label, min, max, step, value, major = () => false, unit = '', format = v => String(v), onInput, fluid = false, id }) {
  const n = Math.round((max - min) / step) + 1;
  const at = i => +(min + i * step).toFixed(6);
  const ticks = Array.from({ length: n }, (_, i) => h('span', { class: ['tick', major(at(i)) && 'major'] }));
  const knob = h('span', { class: 'tick-knob', 'aria-hidden': 'true' });
  const input = h('input', { type: 'range', class: 'tick-input', min, max, step, value, 'aria-label': label, id: id || null });
  const num = h('span', { class: 'tick-num' });
  const track = h('div', { class: 'tick-track', style: fluid ? null : { width: `${(n - 1) * PITCH + 2 + 2 * INSET}px` } }, h('div', { class: 'tick-row' }, ticks), knob, input);
  const el = h('div', { class: ['tick-slider', fluid && 'fluid'] }, track, h('span', { class: 'tick-value' }, num, unit ? h('span', { class: 'tick-unit' }, unit) : null));
  function paint(v) {
    const f = max > min ? (v - min) / (max - min) : 0;
    knob.style.left = `calc(${INSET}px + ${f} * (100% - ${2 * INSET}px))`;
    ticks.forEach((t, i) => t.classList.toggle('on', at(i) <= v + 1e-9));
    num.textContent = format(v);
    input.setAttribute('aria-valuetext', format(v) + (unit ? ' ' + unit : ''));
  }
  input.addEventListener('input', () => { const v = +input.value; paint(v); onInput && onInput(v); });
  paint(+value);
  return { el, input, set: v => { input.value = v; paint(+v); } };
}
