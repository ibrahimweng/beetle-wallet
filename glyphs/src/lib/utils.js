/* Small DOM and formatting helpers shared by every component. */
export const cn = (...parts) => parts.flat().filter(Boolean).join(' ');

/* h(tag, props, ...children): props may hold class, style (string or object),
   html (innerHTML), on<Event> handlers, data-* and aria-* attributes, and any
   other attribute. Children may be strings, nodes, arrays or null. */
export function h(tag, props = {}, ...children) {
  const el = tag.includes(':svg') ? document.createElementNS('http://www.w3.org/2000/svg', tag.replace(':svg', '')) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', Array.isArray(v) ? cn(v) : v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}
export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
export const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const clone = v => JSON.parse(JSON.stringify(v));
export const fmtInt = n => n.toLocaleString('en-US');
export const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
/* the library's weights by the names the toolbar gives them */
export const STYLE_LABEL = { outline: 'Stroke', 'two-tone': 'Two-tone', duotone: 'Duotone', solid: 'Fill' };
export const STYLE_SLUG = { outline: 'stroke', 'two-tone': 'two-tone', duotone: 'duotone', solid: 'fill' };
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the interface's own small icons, drawn in the same language */
const ico = (paths) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
export const ICO = {
  search: ico('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  x: ico('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  sun: ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  moon: ico('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  laptop: ico('<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>'),
  menu: ico('<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>'),
  check: ico('<path d="M20 6 9 17l-5-5"/>'),
  copy: ico('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  download: ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
  sliders: ico('<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>'),
  pen: ico('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>'),
  github: ico('<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>'),
  rotate: ico('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'),
  panel: ico('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>'),
  circle: ico('<circle cx="12" cy="12" r="10"/>'),
  chevron: ico('<path d="m9 18 6-6-6-6"/>'),
  chevronDown: ico('<path d="m6 9 6 6 6-6"/>'),
  gear: ico('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  shapeAll: ico('<rect x="3" y="3" width="7" height="7" rx="1.5"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M6.5 14v7M3 17.5h7"/><rect x="14" y="14" width="7" height="7" rx="3.5"/>'),
  shapeRegular: ico('<path d="M12 5v14M5 12h14"/>'),
  shapeSquare: ico('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>'),
  shapeCircle: ico('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  disc: ico('<circle cx="12" cy="12" r="10" fill="currentColor"/>'),
  sparkle: ico('<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>'),
};
