/* The whole-library panel: the six parameters every icon is derived from,
   presets, the style and corners the grid shows, and the preview surface.
   Everything here applies to all icons at once; the inspector says so above it. */
import * as E from '../../lib/engine.js';
import { h, ICO, STYLE_LABEL } from '../../lib/utils.js';
import { TickSlider } from '../ui/tick-slider.js';
import { Segmented } from '../ui/segmented.js';
import { Button } from '../ui/button.js';
import { store } from '../../lib/store.js';
import { loadDrawings, drawingFile } from '../../lib/library.js';

/* key, label, min, max, step, which ticks are major, unit, format, hint */
const SPEC = [
  ['S', 'Stroke', 1, 4.5, 0.25, v => Number.isInteger(v), 'px', v => v.toFixed(2), 'Every radius and gap below is a multiple of it.'],
  ['R', 'Box corner', 0.5, 4, 0.25, v => Number.isInteger(v), 'S', v => v.toFixed(2), 'Outer radius of rounded rectangles.'],
  ['fillet', 'Corner fillet', 0, 3, 0.1, v => Number.isInteger(+v.toFixed(1)), 'S', v => v.toFixed(1), 'Rounds every sharp join between straight segments.'],
  ['G', 'Gap', 0, 1.5, 0.05, v => Math.abs(v * 2 - Math.round(v * 2)) < 1e-6, 'S', v => v.toFixed(2), 'Space where separate parts meet, and around a stacked shape in the solid.'],
  ['choke', 'Choke', -0.9, 0.9, 0.05, v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 && Math.round(v * 10) % 3 === 0, '', v => (v > 0 ? '+' : '') + v.toFixed(2), 'Negative erodes every edge, positive dilates. Baked into exports.'],
  ['goo', 'Goo', 0, 1.2, 0.05, v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 && Math.round(v * 10) % 3 === 0, '', v => v.toFixed(2), 'Blur then threshold. Rounds corners and fuses near parts. Preview and SVG only.'],
];

export function LibraryPanel() {
  const sliders = {};
  const rows = SPEC.map(([k, label, min, max, step, major, unit, format, hint]) => {
    const s = TickSlider({ id: 'p-' + k, label, min, max, step, value: store.get().P[k], major, unit, format, fluid: true, onInput: v => store.set({ P: { ...store.get().P, [k]: v } }) });
    sliders[k] = s;
    return h('div', { class: 'field' }, h('label', { class: 'label', for: 'p-' + k }, label), s.el, h('div', { class: 'hint' }, hint));
  });
  const P = () => store.get().P;
  const weight = Segmented({ label: 'Style the grid shows', value: P().weight, options: Object.entries(STYLE_LABEL).map(([value, label]) => ({ value, label })), onChange: v => store.set({ P: { ...P(), weight: v } }), onPrefetch: v => loadDrawings(drawingFile(v, P().corners)).catch(() => {}) });
  const corners = Segmented({ label: 'Corners', value: P().corners, options: [{ value: 'rounded', label: 'Rounded' }, { value: 'sharp', label: 'Sharp' }], onChange: v => store.set({ P: { ...P(), corners: v } }), onPrefetch: v => loadDrawings(drawingFile(P().weight, v)).catch(() => {}) });
  const surface = Segmented({ label: 'Preview surface', value: store.get().surface, options: [{ value: 'auto', label: 'Theme' }, { value: 'paper', label: 'Paper' }, { value: 'ink', label: 'Ink' }], onChange: v => store.set({ surface: v }) });
  const presets = h('div', { class: 'row wrap' },
    ...Object.keys(E.PRESETS).map(name => Button({ variant: 'outline', size: 'xs', label: name[0].toUpperCase() + name.slice(1), title: `The ${name} preset`, onClick: () => store.set({ P: { ...P(), ...E.PRESETS[name] } }) })),
    Button({ variant: 'ghost', size: 'xs', icon: ICO.rotate, label: 'Reset parameters', onClick: () => store.resetParams() }));
  const field = (label, control, hint) => h('div', { class: 'field' }, h('div', { class: 'label' }, label), control, hint ? h('div', { class: 'hint' }, hint) : null);
  const el = h('div', { class: 'stack', style: { gap: '16px' } },
    field('Style the grid shows', weight.el, 'The same switch as the one on the icon and above the grid.'),
    field('Corners', corners.el, 'Sharp squares every corner and cuts the line ends off flat.'),
    field('Preview surface', surface.el, 'Where the icons sit: the page, white paper or black ink.'),
    h('div', { class: 'separator' }),
    ...rows,
    field('Presets', presets, 'Core draws the core set and the four-style set exactly as their designers did.'));
  store.subscribe((s, keys) => { if (keys.includes('P')) { for (const k of Object.keys(sliders)) sliders[k].set(s.P[k]); weight.set(s.P.weight); corners.set(s.P.corners); } if (keys.includes('surface')) surface.set(s.surface); });
  return { el };
}
