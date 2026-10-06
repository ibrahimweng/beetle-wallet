/* The SVG the plugin hands to figma.createNodeFromSvg. It is the engine's own
   svgInner(), exactly as the site draws it, with three changes:

   - Every masked group becomes one plain shape with holes. The site cuts a
     filled body with a <mask>: a white sheet with black cuts. Figma reads an
     SVG mask by its alpha, not its brightness, so those cuts would not show.
     Here each masked group is worked out with Clipper: what its paths cover,
     strokes grown by half their width with their own caps and joins, less
     what the mask's black parts cover. It knows nothing of how the engine
     chose its masks, so whatever the site draws, the plugin draws the same.
     Lines outside a mask stay live strokes, so their weight can still change
     in Figma.
   - Goo is left out. Figma cannot import an SVG filter.
   - currentColor becomes the chosen colour, because Figma cannot read it.

   No DOM: the build's check runs this in Node over every icon. */
import * as E from '../../src/lib/engine.js';

const SC = 1000;
const WHITE = /^(#fff|#ffffff|white)$/i;

/* ---------- a small reader for the engine's own SVG ---------- */
function parse(src) {
  const root = { tag: '#root', attrs: {}, children: [] }, stack = [root];
  const re = /<(\/?)([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;
  let m, at = 0;
  while ((m = re.exec(src))) {
    if (src.slice(at, m.index).trim()) throw new Error('text in an icon SVG');
    at = re.lastIndex;
    if (m[1]) { if (stack.pop().tag !== m[2]) throw new Error('an icon SVG that does not nest'); continue; }
    const attrs = {}; for (const a of m[3].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    const node = { tag: m[2], attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!m[4]) stack.push(node);
  }
  if (stack.length !== 1 || src.slice(at).trim()) throw new Error('an icon SVG that does not close');
  return root;
}
const write = n => n.tag === '#root' ? n.children.map(write).join('')
  : `<${n.tag}${Object.entries(n.attrs).map(([k, v]) => ` ${k}="${v}"`).join('')}${n.children.length ? `>${n.children.map(write).join('')}</${n.tag}>` : '/>'}`;

/* ---------- what an element covers, as Clipper polygons ---------- */
function covers(CL, P, node) {
  const a = node.attrs, out = new CL.Paths();
  const toIP = pts => pts.map(p => ({ X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }));
  const union = (paths, ft = CL.PolyFillType.pftNonZero) => { const c = new CL.Clipper(); c.AddPaths(paths, CL.PolyType.ptSubject, true); const u = new CL.Paths(); c.Execute(CL.ClipType.ctUnion, u, ft, ft); return u; };
  if (node.tag === 'rect') {
    const x = +a.x || 0, y = +a.y || 0, w = +a.width, h = +a.height;
    out.push(toIP([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]));
    return out;
  }
  if (node.tag !== 'path') throw new Error(`a <${node.tag}> under a mask`);
  if (a.opacity != null && +a.opacity !== 1) throw new Error('a translucent part under a mask');
  const parts = E.flatten({ t: 'path', d: a.d, x: 1 }, P);
  if (a.fill && a.fill !== 'none') {
    const polys = parts.filter(p => p.pts.length >= 3).map(p => toIP(p.pts));
    for (const q of union(polys, a['fill-rule'] === 'evenodd' ? CL.PolyFillType.pftEvenOdd : CL.PolyFillType.pftNonZero)) out.push(q);
  }
  const sw = parseFloat(a['stroke-width']);
  if (a.stroke && a.stroke !== 'none' && sw > 0) {
    const join = a['stroke-linejoin'] === 'miter' ? CL.JoinType.jtMiter : CL.JoinType.jtRound;
    const cap = a['stroke-linecap'];
    const end = cap === 'round' ? CL.EndType.etOpenRound : cap === 'square' ? CL.EndType.etOpenSquare : CL.EndType.etOpenButt; // one of these is 0, so no || here
    const co = new CL.ClipperOffset(2, 0.03 * SC);
    /* a loop drawn back to its start without a Z (a circle in two arcs) is joined there, not capped */
    const loop = p => p.pts.length > 2 && Math.hypot(p.pts[0][0] - p.pts[p.pts.length - 1][0], p.pts[0][1] - p.pts[p.pts.length - 1][1]) < 1e-3;
    for (const p of parts) if (p.pts.length) co.AddPath(toIP(p.pts), join, p.closed || loop(p) ? CL.EndType.etClosedLine : end);
    const grown = new CL.Paths(); co.Execute(grown, (sw / 2) * SC);
    for (const q of grown) out.push(q);
  }
  return union(out);
}
const op = (CL, type, subj, clip) => { const c = new CL.Clipper(); c.AddPaths(subj, CL.PolyType.ptSubject, true); c.AddPaths(clip, CL.PolyType.ptClip, true); const r = new CL.Paths(); c.Execute(type, r, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return r; };
/* the mask's white parts less its black ones, in order */
function maskArea(CL, P, mask) {
  let area = new CL.Paths();
  for (const ch of mask.children) {
    const paint = ch.attrs.fill && ch.attrs.fill !== 'none' ? ch.attrs.fill : ch.attrs.stroke;
    const c = covers(CL, P, ch);
    area = op(CL, WHITE.test(paint || '') ? CL.ClipType.ctUnion : CL.ClipType.ctDifference, area, c);
  }
  return area;
}
const pathData = paths => {
  let d = '';
  for (const poly of paths) {
    if (poly.length < 3) continue;
    poly.forEach((q, i) => { d += (i ? 'L' : 'M') + E.f2(q.X / SC) + ' ' + E.f2(q.Y / SC); });
    d += 'Z';
  }
  return d;
};

/* every masked group, innermost first, becomes one shape */
function resolve(CL, P, node, masks) {
  node.children = node.children.filter(ch => ch.tag !== 'mask');
  for (const ch of node.children) resolve(CL, P, ch, masks);
  node.children = node.children.map(ch => {
    const ref = ch.tag === 'g' && /^url\(#([^)]+)\)$/.exec(ch.attrs.mask || '');
    if (!ref) return ch;
    const mask = masks.get(ref[1]); if (!mask) throw new Error('a mask that is not there: ' + ref[1]);
    let ink = new CL.Paths(), color = null;
    const walk = n => { for (const k of n.children) { if (k.tag === 'g') { if (k.attrs.opacity != null && +k.attrs.opacity !== 1) throw new Error('a translucent group under a mask'); walk(k); continue; } color = color || (k.attrs.fill !== 'none' && k.attrs.fill) || k.attrs.stroke; ink = op(CL, CL.ClipType.ctUnion, ink, covers(CL, P, k)); } };
    walk(ch);
    const d = pathData(op(CL, CL.ClipType.ctIntersection, ink, maskArea(CL, P, mask)));
    const { mask: _, ...rest } = ch.attrs;
    const shape = { tag: 'path', attrs: { d, fill: color || 'currentColor', 'fill-rule': 'evenodd' }, children: [] };
    if (!d) return null;
    return Object.keys(rest).length ? { tag: 'g', attrs: rest, children: [shape] } : shape;
  }).filter(Boolean);
}
function collectMasks(node, out = new Map()) { for (const ch of node.children) { if (ch.tag === 'mask') out.set(ch.attrs.id, ch); collectMasks(ch, out); } return out; }

/* figmaSvg(prims, P, { color, CL, uid }) -> an SVG string at 24 by 24 */
export function figmaSvg(prims, P, opts = {}) {
  const Q = { ...P, goo: 0 };
  const CL = opts.CL || globalThis.ClipperLib;
  const tree = parse(E.svgInner(prims, Q, { uid: E.safeId(opts.uid || 'g'), weight: Q.weight }));
  const masks = collectMasks(tree);
  if (masks.size) resolve(CL, Q, tree, masks);
  const color = opts.color || '#000000';
  const markup = write(tree).replace(/currentColor/g, color).replace(/ class="faint"/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">${markup}</svg>`;
}

/* what an SVG must never hold by the time it reaches Figma */
export function problems(svg) {
  const out = [];
  if (/NaN|Infinity|undefined/.test(svg)) out.push('a number that is not a number');
  if (/currentColor/.test(svg)) out.push('currentColor left in');
  if (/<mask|<filter|url\(#/.test(svg)) out.push('a mask or a filter left in');
  return out;
}
