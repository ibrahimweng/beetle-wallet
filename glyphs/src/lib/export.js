/* Exports: SVG text, an SVG sprite, an icon font, JSON. Saving goes through the
   viewer's save dialog when the page runs inside claude.ai and through a plain
   download link everywhere else, so the same file works on Vercel. */
import * as E from './engine.js';
import { exportName } from './library.js';
import { STYLE_SLUG } from './utils.js';

/* what a file is named after: the style, and sharp when the corners are */
export const fileStem = P => (STYLE_SLUG[P.weight] || P.weight) + (P.corners === 'sharp' ? '-sharp' : '');

export async function saveFile(name, data, type) {
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { const r = await dl.save({ filename: name, data }); return r.status === 'saved' ? 'Saved.' : 'Delivered.'; }
  } catch (e) { if (e && e.code === 'declined') return 'Not saved.'; }
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'Downloading.';
}

export async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; } catch { return false; }
}

export const iconSVG = (key, prims, P, weight) => E.svg(prims, P, { size: 24, uid: exportName(key), weight: weight || P.weight });

export function spriteOf(entries, P, prims) {
  const syms = entries.map(e => E.symbol(exportName(e.key), prims(e.key), P, {})).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Beetle Glyphs · S ${P.S} R ${P.R} fillet ${P.fillet} choke ${P.choke} · ${fileStem(P)} · core set under the ISC license, see LICENSE-core.txt; four-style set (Keyline Icons) under the MIT license, see LICENSE-keyline.txt -->\n${syms}\n</svg>`;
}

export function fontOf(entries, P, prims) {
  const { font, map } = E.buildFont(P, entries.map(e => ({ name: exportName(e.key), prims: prims(e.key) })), { weight: P.weight, family: 'Beetle Glyphs' }, window.ClipperLib, window.opentype);
  return { buf: font.toArrayBuffer(), map };
}

export const jsonOf = (entries, P, prims) => JSON.stringify({ engine: 2, params: P, icons: Object.fromEntries(entries.map(e => [exportName(e.key), prims(e.key)])) });

export const usageSnippet = (key, P) => {
  const n = exportName(key);
  return `<!-- from the sprite -->\n<svg width="24" height="24"><use href="beetle-glyphs-${fileStem(P)}-sprite.svg#${n}"/></svg>\n\n/* from the icon font */\n.icon-${n}::before { font-family: "Beetle Glyphs"; content: "\\E000"; /* see the codepoint map */ }`;
};
