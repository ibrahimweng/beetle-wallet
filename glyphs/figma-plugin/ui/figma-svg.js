/* The SVG the plugin hands to figma.createNodeFromSvg. It is the engine's own
   SVG, drawn by the same layers() the site uses, with three changes:

   - A filled body that the site cuts with a <mask> (a cut, a knockout, a
     punched hole or the gap around a stacked shape) is drawn instead as one
     plain shape with holes, from the engine's outline(), as the icon font is.
     Figma reads an SVG mask by its alpha, not its brightness, so the white
     sheet with black cuts that the site uses would hide nothing. Open lines
     stay live strokes, so their weight can still be changed in Figma.
   - Goo is left out. Figma cannot import an SVG filter.
   - currentColor becomes the chosen colour, because Figma cannot read it.

   No DOM: the build's check runs this in Node over every icon. */
import * as E from '../../src/lib/engine.js';

/* the roles that layers() puts in the filled body, and so under its mask */
const BODY = new Set(['fill', 'flat', 'cut', 'knock', 'punch', 'shape', 'detail']);

const pathData = paths => {
  let d = '';
  for (const poly of paths) {
    if (poly.length < 3) continue;
    poly.forEach((q, i) => { d += (i ? 'L' : 'M') + E.f2(q.X / 1000) + ' ' + E.f2(q.Y / 1000); });
    d += 'Z';
  }
  return d;
};

/* the masked body as one shape: the same parts, the same roles, through Clipper */
function outlinedBody(prims, P, CL) {
  const roles = E.autoRoles(prims, P);
  const keep = prims.map((pr, i) => BODY.has(roles[i]) && !(pr.alpha != null && pr.alpha < 1));
  const sub = prims.filter((_, i) => keep[i]);
  const subRoles = roles.filter((_, i) => keep[i]);
  const d = pathData(E.outline(sub, P, 'solid', CL, subRoles));
  return d ? `<path d="${d}" fill="currentColor" fill-rule="evenodd"/>` : '';
}

/* one layer stack, as svgInner() builds it, with a masked body outlined */
function body(prims, P, mode, uid, CL) {
  const L = E.layers(prims, P, { uid }, mode);
  let b = L.body;
  if (b.includes('<mask')) { b = outlinedBody(prims, P, CL); if (b && mode === 'duotone') b = `<g opacity="${E.TONE}">${b}</g>`; }
  return { body: b, lines: L.lines, faint: L.faint };
}

function inner(prims, P, weight, uid, CL) {
  if (weight === 'two-tone' && !E.isNative(prims)) {
    const plate = body(prims, P, 'solid', uid + '-p', CL);
    return (plate.body ? `<g opacity="${E.TONE}">${plate.body}</g>` : '') + inner(prims, P, 'outline', uid, CL);
  }
  const mode = E.isNative(prims) ? 'drawn' : weight === 'solid' || weight === 'duotone' ? weight : 'outline';
  const L = body(prims, P, mode, uid, CL);
  return L.body + L.lines + L.faint;
}

/* figmaSvg(prims, P, { color, CL, uid }) -> an SVG string at 24 by 24 */
export function figmaSvg(prims, P, opts = {}) {
  const Q = { ...P, goo: 0 };
  const color = opts.color || '#000000';
  const uid = E.safeId(opts.uid || 'g');
  const markup = inner(prims, Q, Q.weight, uid, opts.CL).replace(/currentColor/g, color).replace(/ class="faint"/g, '');
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
