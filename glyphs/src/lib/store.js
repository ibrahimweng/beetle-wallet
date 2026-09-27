/* One observable store for the app. A subset persists in the viewer's browser
   as a convenience; the page renders correctly without it. */
import { DEF } from './engine.js';

const KEY = 'beetle-glyphs-v4';
const PERSIST = ['P', 'surface', 'theme', 'filter', 'sel', 'edits', 'tab'];

const initial = {
  P: { ...DEF },
  surface: 'red',
  theme: 'system',
  filter: { q: '', set: 'all', cat: 'all' },
  sel: 'param:card',
  edits: {},
  tab: 'edit',
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
  reset() { state = { ...initial, theme: state.theme, ready: state.ready }; persist(); for (const fn of listeners) fn(state, Object.keys(initial)); },
};
