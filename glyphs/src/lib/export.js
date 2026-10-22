/* Exports: SVG text, an SVG sprite, an icon font, JSON and a category as a
   ZIP, each plain, as drawn, and with goo. Saving goes through the viewer's
   save dialog when the page runs inside claude.ai and through a plain
   download link everywhere else, so the same file works on Vercel. */
import * as E from './engine.js';
import { exportName, search, primsOf, drawingsFor, entryOf } from './library.js';
import { STYLE_SLUG, STYLE_LABEL } from './utils.js';
import { zip } from './zip.js';

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
export const gooIconSVG = (prims, P, weight) => E.gooSvg(prims, P, { size: 24, weight: weight || P.weight });

/* goo takes a moment an icon: a long list is worked through in slices, with the
   page free to draw between them and progress(done, total) told as it goes */
export async function inSlices(list, fn, progress) {
  const out = [];
  let t = performance.now();
  for (let i = 0; i < list.length; i++) {
    out.push(fn(list[i], i));
    if (performance.now() - t > 40) { if (progress) progress(i + 1, list.length); await new Promise(r => setTimeout(r, 0)); t = performance.now(); }
  }
  return out;
}

const gooNote = P => `with goo ${P.goo}, paths only`;

const spriteDoc = (P, syms, goo) => `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Beetle Glyphs · S ${P.S} R ${P.R} fillet ${P.fillet} choke ${P.choke} · ${fileStem(P)}${goo ? ' · ' + gooNote(P) : ''} · core set under the ISC license, see LICENSE-core.txt; four-style set (Keyline Icons) under the MIT license, see LICENSE-keyline.txt -->\n${syms.join('\n')}\n</svg>`;
export const spriteOf = (entries, P, prims) => spriteDoc(P, entries.map(e => E.symbol(exportName(e.key), prims(e.key), P, {})));
export const gooSpriteOf = async (entries, P, prims, progress) => spriteDoc(P, await inSlices(entries, e => E.gooSymbol(exportName(e.key), prims(e.key), P), progress), true);

export function fontOf(entries, P, prims) {
  const { font, map } = E.buildFont(P, entries.map(e => ({ name: exportName(e.key), prims: prims(e.key) })), { weight: P.weight, family: 'Beetle Glyphs' }, window.ClipperLib, window.opentype);
  return { buf: font.toArrayBuffer(), map };
}
/* a font with goo is a family of its own, so it can sit beside the plain one */
export async function gooFontOf(entries, P, prims, progress) {
  const opts = { weight: P.weight, family: 'Beetle Glyphs Goo', goo: true };
  const list = await inSlices(entries, e => ({ name: exportName(e.key), paths: E.fontInk(prims(e.key), P, opts, window.ClipperLib) }), progress);
  const { font, map } = E.buildFont(P, list, opts, window.ClipperLib, window.opentype);
  return { buf: font.toArrayBuffer(), map };
}

export const jsonOf = (entries, P, prims) => JSON.stringify({ engine: 2, params: P, icons: Object.fromEntries(entries.map(e => [exportName(e.key), prims(e.key)])) });
/* with goo there are no primitives left: each icon is its layers of path data on the 24 grid, filled, a translucent one with its opacity */
export const gooJsonOf = async (entries, P, prims, progress) => JSON.stringify({ engine: 2, goo: P.goo, params: P, viewBox: '0 0 24 24',
  icons: Object.fromEntries(await inSlices(entries, e => [exportName(e.key), E.gooLayers(prims(e.key), P).map(l => (l.alpha < 1 ? { d: l.d, opacity: E.f2(l.alpha) } : { d: l.d }))], progress)) });

export const usageSnippet = (key, P) => {
  const n = exportName(key);
  return `<!-- from the sprite -->\n<svg width="24" height="24"><use href="beetle-glyphs-${fileStem(P)}-sprite.svg#${n}"/></svg>\n\n/* from the icon font */\n.icon-${n}::before { font-family: "Beetle Glyphs"; content: "\\E000"; /* see the codepoint map */ }`;
};

/* a category as a ZIP of SVGs: every icon in it, in the style, corners and
   parameters the grid shows, in the grid's colour when one is picked, with the
   licence notices of the sets it draws on. Inside, every file is
   category/icon-name.svg; with goo, the same names, the icons with goo. */
const LICENSES = { core: ['LICENSE-core.txt', 'The core set, under the ISC license.'], four: ['LICENSE-keyline.txt', 'The four-style set (Keyline Icons), under the MIT license.'], beetle: [null, 'The app glyphs belong to the Beetle wallet design.'] };
export async function categoryZip(cat, state, { goo = false, progress } = {}) {
  const { P } = state, color = state.view && state.view.color;
  await drawingsFor(P);
  const entries = search({ set: 'all', cat, q: '', box: 'all' });
  const folder = cat;
  const files = await inSlices(entries, e => {
    let svg = goo ? gooIconSVG(primsOf(e.key, state), P) : iconSVG(e.key, primsOf(e.key, state), P);
    if (color) svg = svg.replace(/currentColor/g, color);
    return { name: `${folder}/${exportName(e.key)}.svg`, data: svg + '\n' };
  }, progress);
  const sets = [...new Set(entries.map(e => { const b = e.base ? entryOf(e.base) : e; return b ? b.set : e.set; }))].filter(x => LICENSES[x]);
  for (const set of sets) {
    const [file] = LICENSES[set]; if (!file) continue;
    try { const r = await fetch(file); if (r.ok) files.push({ name: `${folder}/${file}`, data: await r.text() }); } catch {}
  }
  files.push({ name: `${folder}/README.txt`, data: [
    `Beetle Glyphs: ${cat.replace(/-/g, ' ')}, ${entries.length} icons.`,
    `${STYLE_LABEL[P.weight] || P.weight}, ${P.corners === 'sharp' ? 'sharp' : 'rounded'} corners, stroke ${P.S}, box corner ${P.R}, fillet ${P.fillet}, gap ${P.G}, choke ${P.choke}${color ? `, colour ${color}` : ', in currentColor'}.`,
    goo ? `With goo: every corner, inside and outside, rounded by ${P.goo} on the 24 grid, and parts closer than twice that fused. Each SVG is paths alone, 24 by 24.` : 'Each SVG is 24 by 24, as drawn.', '',
    ...sets.map(set => LICENSES[set][1] + (LICENSES[set][0] ? ` The notice is in ${LICENSES[set][0]} and stays with the icons.` : '')),
  ].join('\n') + '\n' });
  return { name: `beetle-glyphs-${cat}-${fileStem(P)}${goo ? '-goo' : ''}.zip`, blob: await zip(files), count: entries.length };
}
