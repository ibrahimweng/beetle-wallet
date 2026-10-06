/* The toolbar over the grid: the style and the corners every icon is drawn in,
   their size and stroke, which shapes to show, a colour, the grid's own
   settings, a reset, and how many icons are shown. On a narrow screen the
   controls fold into a drawer behind one Browse button. */
import { h, ICO, fmtInt, STYLE_LABEL } from '../../lib/utils.js';
import { DEF } from '../../lib/engine.js';
import { Segmented } from '../ui/segmented.js';
import { TickSlider } from '../ui/tick-slider.js';
import { Switch } from '../ui/switch.js';
import { Menu } from '../ui/menu.js';
import { openSheet } from '../ui/sheet.js';
import { store, VIEW } from '../../lib/store.js';
import { loadDrawings, drawingFile } from '../../lib/library.js';

const BOXES = [['all', 'All shapes', '', ICO.shapeAll], ['regular', 'Regular', 'No container', ICO.shapeRegular], ['square', 'Square', 'In a rounded square', ICO.shapeSquare], ['circle', 'Circle', 'In a circle', ICO.shapeCircle]];
const BOX_LABEL = { all: 'All', regular: 'Regular', square: 'Square', circle: 'Circle' };

export function Toolbar() {
  const P = () => store.get().P, V = () => store.get().view, F = () => store.get().filter;
  const setP = patch => store.set({ P: { ...P(), ...patch } });
  const setV = patch => store.set({ view: { ...V(), ...patch } });
  const setF = patch => store.set({ filter: { ...F(), ...patch } });

  const style = Segmented({ label: 'Style', value: P().weight, options: Object.entries(STYLE_LABEL).map(([value, label]) => ({ value, label })), onChange: v => setP({ weight: v }), onPrefetch: v => { loadDrawings(drawingFile(v, P().corners)).catch(() => {}); if (v !== 'outline') loadDrawings('fills').catch(() => {}); } });
  const corners = Segmented({ label: 'Corners', value: P().corners, options: [{ value: 'rounded', label: 'Rounded' }, { value: 'sharp', label: 'Sharp' }], onChange: v => setP({ corners: v }), onPrefetch: v => loadDrawings(drawingFile(P().weight, v)).catch(() => {}) });
  const size = TickSlider({ label: 'Icon size', min: 16, max: 48, step: 1, value: V().size, major: v => v % 8 === 0, unit: 'px', onInput: v => setV({ size: v }) });
  const stroke = TickSlider({ label: 'Stroke', min: 1, max: 4, step: 0.25, value: P().S, major: v => Number.isInteger(v), unit: 'px', format: v => String(+v.toFixed(2)), onInput: v => setP({ S: v }) });
  size.el.title = 'Icon size'; stroke.el.title = 'Stroke, on the 24 grid';

  /* shape: every icon, or only those drawn plain, in a square, or in a circle */
  const boxValue = h('span', { class: 'text-muted' });
  const boxTrigger = h('button', { type: 'button', class: 'pill raised' }, h('span', {}, 'Shape'), boxValue, h('span', { class: 'chev', html: ICO.chevronDown }));
  const boxCounts = {};
  const boxRows = BOXES.map(([v, label, hint, icon]) => {
    const count = h('span', { class: 'menu-count' });
    const row = h('button', { type: 'button', class: 'menu-row', role: 'menuitemradio', 'data-close': '', 'data-value': v, onClick: () => setF({ box: v }) },
      h('span', { class: 'menu-chip', html: icon }), h('span', { class: 'menu-text' }, h('span', {}, label), hint ? h('span', { class: 'menu-hint' }, hint) : null), count, h('span', { class: 'menu-check', html: ICO.check }));
    boxCounts[v] = count; return row;
  });
  const boxMenu = Menu({ trigger: boxTrigger, label: 'Shape', content: h('div', { class: 'menu-list', role: 'menu' }, boxRows), class: 'menu-shape' });

  /* colour: the system's own picker behind a swatch; none means the theme's ink */
  const swatch = h('span', { class: 'swatch' });
  const colorInput = h('input', { type: 'color', class: 'color-input', 'aria-label': 'Icon colour', value: V().color || '#000000' });
  colorInput.addEventListener('input', () => setV({ color: colorInput.value }));
  const color = h('label', { class: 'pill color-pill', title: 'Icon colour' }, swatch, h('span', { class: 'color-label' }, 'Color'), colorInput);

  /* the grid's own settings: names under the icons, and how many to a row */
  const names = Switch({ label: 'Icon names', checked: V().names, onChange: v => setV({ names: v }) });
  const colsAuto = h('button', { type: 'button', class: 'linkish', onClick: () => setV({ cols: 0 }) }, 'Fit');
  const cols = TickSlider({ label: 'Grid columns', min: 4, max: 16, step: 1, value: V().cols || 4, major: v => v % 4 === 0, fluid: true, format: v => String(v), onInput: v => setV({ cols: v }) });
  const colsValue = h('span', { class: 'text-muted text-sm tabular' });
  const gearTrigger = h('button', { type: 'button', class: 'pill raised square', 'aria-label': 'Grid settings', title: 'Grid settings', html: ICO.gear });
  const gear = Menu({ trigger: gearTrigger, align: 'start', label: 'Grid settings', class: 'menu-settings', content: h('div', { class: 'stack', style: { gap: '0' } },
    h('div', { class: 'setting' }, h('div', { class: 'stack', style: { gap: '2px' } }, h('span', { class: 'font-medium text-sm' }, 'Icon names'), h('span', { class: 'menu-hint' }, 'The label under each glyph')), names.el),
    h('div', { class: 'separator', style: { margin: '12px 0' } }),
    h('div', { class: 'setting' }, h('span', { class: 'font-medium text-sm' }, 'Grid columns'), h('span', { class: 'row', style: { gap: '8px' } }, colsValue, colsAuto)),
    h('div', { style: { marginTop: '8px' } }, cols.el)) });

  const reset = h('button', { type: 'button', class: 'btn btn-ghost btn-icon reset-btn', 'aria-label': 'Reset to defaults', title: 'Reset to defaults', html: ICO.rotate, onClick: () => {
    store.set({ P: { ...P(), weight: DEF.weight, corners: DEF.corners, S: DEF.S }, view: { ...V(), size: VIEW.size, color: null }, filter: { ...F(), q: '', cat: 'all', box: 'all' } });
  } });

  const controls = h('div', { class: 'tb-controls' }, style.el, corners.el, size.el, stroke.el, boxMenu.el, color, gear.el, reset);
  const count = h('span', { class: 'tb-count', role: 'status' });
  const dot = h('span', { class: 'tb-dot', hidden: true });
  const browse = h('button', { type: 'button', class: 'btn btn-outline tb-browse', onClick: () => {
    const home = controls.parentNode, next = controls.nextSibling;
    openSheet({ side: 'bottom', title: 'Browse', content: controls, onClose: () => home.insertBefore(controls, next) });
  } }, 'Browse', dot);
  const el = h('div', { class: 'tb' }, controls, browse, count);
  /* the bar stays under the top bar while the grid scrolls: a hairline once it has
     left the page's flow, and the page scrolls focus clear of it */
  const stick = () => { el.classList.toggle('stuck', scrollY > 0 && el.getBoundingClientRect().top <= (parseFloat(getComputedStyle(el).top) || 0) + 0.5); };
  let frame = 0;
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; stick(); }); }, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => document.documentElement.style.setProperty('--tb-h', el.offsetHeight + 'px')).observe(el);

  const atDefaults = () => { const s = store.get(); return s.P.weight === DEF.weight && s.P.corners === DEF.corners && s.P.S === DEF.S && s.view.size === VIEW.size && !s.view.color && !s.filter.q && s.filter.cat === 'all' && s.filter.box === 'all'; };
  function sync() {
    const s = store.get();
    style.set(s.P.weight); corners.set(s.P.corners); size.set(s.view.size); stroke.set(Math.min(4, Math.max(1, s.P.S)));
    boxValue.textContent = BOX_LABEL[s.filter.box] || 'All';
    for (const r of boxRows) r.setAttribute('aria-checked', r.dataset.value === s.filter.box ? 'true' : 'false');
    swatch.style.background = s.view.color || 'currentColor';
    color.classList.toggle('picked', !!s.view.color);
    if (s.view.color && colorInput.value !== s.view.color) colorInput.value = s.view.color;
    names.set(s.view.names); cols.set(s.view.cols || 4); colsValue.textContent = s.view.cols ? `${s.view.cols} per row` : 'As many as fit'; colsAuto.hidden = !s.view.cols;
    const plain = atDefaults(); reset.disabled = plain; dot.hidden = plain;
  }
  store.subscribe((s, keys) => { if (keys.some(k => ['P', 'view', 'filter'].includes(k))) sync(); });
  sync();
  /* shown: the icons the grid has; byBox: how many of them each shape would leave */
  function setCounts(shown, byBox) {
    count.innerHTML = ''; count.append(fmtInt(shown), h('span', { class: 'sr-only' }, ' icons'), ' shown');
    for (const [v] of BOXES) boxCounts[v].textContent = fmtInt(byBox[v] || 0);
  }
  return { el, setCounts };
}
