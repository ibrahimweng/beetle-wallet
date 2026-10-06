/* One observable store for the app. A subset persists in the viewer's browser
   as a convenience; the page renders correctly without it. */
import { DEF, WEIGHTS } from './engine.js';

const KEY = 'beetle-glyphs-v5';
const PERSIST = ['P', 'surface', 'theme', 'filter', 'sel', 'edits', 'scope', 'view'];
/* how the grid shows the icons: their size in px, a colour or none (the theme's), names under them, columns (0 = as many as fit) */
export const VIEW = { size: 28, color: null, names: true, cols: 0 };

const initial = {
  P: { ...DEF },
  surface: 'auto',        // auto (follows the theme) | paper (white) | ink (black)
  theme: 'system',
  filter: { q: '', set: 'all', cat: 'all', box: 'all' },
  view: { ...VIEW },
  sel: 'param:card',
  edits: {},
  scope: 'icon',          // what the inspector edits: this icon | the whole library
  page: 1,
  status: '',
  ready: false,
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!saved || typeof saved !== 'object') return {};
    const out = {};
    for (const k of PERSIST) if (saved[k] != null) out[k] = saved[k];
    if (out.P) out.P = { ...DEF, ...out.P };
    if (out.filter) out.filter = { ...initial.filter, ...out.filter };
    if (!['auto', 'paper', 'ink'].includes(out.surface)) delete out.surface;
    if (!['icon', 'library'].includes(out.scope)) delete out.scope;
    if (out.P && !WEIGHTS.includes(out.P.weight)) out.P.weight = DEF.weight;
    if (out.P && !['rounded', 'sharp'].includes(out.P.corners)) out.P.corners = DEF.corners;
    if (out.filter && !['all', 'regular', 'square', 'circle'].includes(out.filter.box)) out.filter.box = 'all';
    if (out.view) { const v = { ...VIEW, ...out.view }; v.size = Math.min(48, Math.max(16, +v.size || VIEW.size)); v.cols = [0, ...Array.from({ length: 13 }, (_, i) => i + 4)].includes(+v.cols) ? +v.cols : 0; v.names = v.names !== false; v.color = /^#[0-9a-f]{6}$/i.test(v.color || '') ? v.color : null; out.view = v; }
    return out;
  } catch { return {}; }
}

let state = { ...initial, ...load() };
const listeners = new Set();
let saveTimer = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { const out = {}; for (const k of PERSIST) out[k] = state[k]; localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* storage unavailable */ }
  }, 150);
}

export const store = {
  get: () => state,
  set(patch) {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
    persist();
    for (const fn of listeners) fn(state, Object.keys(next));
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  /* how many listeners are live: a panel that comes and goes must leave this where it found it */
  get listeners() { return listeners.size; },
  /* the parameters only: edits and the selection stay */
  resetParams() { this.set({ P: { ...DEF, weight: state.P.weight, corners: state.P.corners } }); },
};
