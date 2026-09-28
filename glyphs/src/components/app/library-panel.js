/* The whole-library panel: the six parameters every icon is derived from,
   presets, the weight the grid shows and the preview surface. Everything here
   applies to all icons at once; the inspector says so above it. */
import * as E from '../../lib/engine.js';
import { h, ICO } from '../../lib/utils.js';
import { Slider } from '../ui/slider.js';
import { ToggleGroup } from '../ui/toggle-group.js';
import { Button } from '../ui/button.js';
import { store } from '../../lib/store.js';

const SPEC = [
  ['S', 'Stroke', 1, 4.5, 0.25, v => v.toFixed(2) + ' px', 'Every radius and gap below is a multiple of it.'],
  ['R', 'Box corner', 0.5, 4, 0.25, v => v.toFixed(2) + ' S', 'Outer radius of rounded rectangles.'],
  ['fillet', 'Corner fillet', 0, 3, 0.1, v => v.toFixed(1) + ' S', 'Rounds every sharp join between straight segments.'],
  ['G', 'Gap', 0, 1.5, 0.05, v => v.toFixed(2) + ' S', 'Space where separate parts meet, and around a stacked shape in the solid.'],
  ['choke', 'Choke', -0.9, 0.9, 0.05, v => (v > 0 ? '+' : '') + v.toFixed(2), 'Negative erodes every edge, positive dilates. Baked into exports.'],
  ['goo', 'Goo', 0, 1.2, 0.05, v => v.toFixed(2), 'Blur then threshold. Rounds corners and fuses near parts. Preview and SVG only.'],
];

export function LibraryPanel() {
  const sliders = {};
  const rows = SPEC.map(([k, label, min, max, step, format, hint]) => {
    const s = Slider({ id: 'p-' + k, label, min, max, step, value: store.get().P[k], format, hint, onInput: v => store.set({ P: { ...store.get().P, [k]: v } }) });
    sliders[k] = s; return s.el;
  });
  const weight = ToggleGroup({ label: 'Weight the grid shows', value: store.get().P.weight, options: [{ value: 'outline', label: 'Outline', icon: ICO.circle }, { value: 'solid', label: 'Solid', icon: ICO.disc }], onChange: v => store.set({ P: { ...store.get().P, weight: v } }) });
  const surface = ToggleGroup({ label: 'Preview surface', value: store.get().surface, options: [{ value: 'auto', label: 'Theme' }, { value: 'paper', label: 'Paper' }, { value: 'ink', label: 'Ink' }], onChange: v => store.set({ surface: v }) });
  const presets = h('div', { class: 'row wrap' },
    ...Object.keys(E.PRESETS).map(name => Button({ variant: 'outline', size: 'xs', label: name[0].toUpperCase() + name.slice(1), title: `The ${name} preset`, onClick: () => store.set({ P: { ...store.get().P, ...E.PRESETS[name] } }) })),
    Button({ variant: 'ghost', size: 'xs', icon: ICO.rotate, label: 'Reset parameters', onClick: () => store.resetParams() }));
  const field = (label, control, hint) => h('div', { class: 'field' }, h('div', { class: 'label' }, label), control, hint ? h('div', { class: 'hint' }, hint) : null);
  const el = h('div', { class: 'stack', style: { gap: '16px' } },
    field('Weight the grid shows', weight.el, 'The same switch as the one on the icon.'),
    field('Preview surface', surface.el, 'Where the icons sit: the page, white paper or black ink.'),
    h('div', { class: 'separator' }),
    ...rows,
    field('Presets', presets));
  store.subscribe((s, keys) => { if (keys.includes('P')) { for (const k of Object.keys(sliders)) sliders[k].set(s.P[k]); weight.set(s.P.weight); } if (keys.includes('surface')) surface.set(s.surface); });
  return { el };
}
