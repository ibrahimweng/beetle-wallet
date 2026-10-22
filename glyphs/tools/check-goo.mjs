/* check-goo.mjs — goo as geometry, held to what it promises.

     node glyphs/tools/check-goo.mjs

   - A file with goo is paths alone: no filter, mask, clip path or image.
   - Goo never outgrows the icon: what it draws stays inside the plain icon's box.
   - Lines keep their weight: a straight stroke is as thick with goo as without,
     at any stroke, even with more goo than half the stroke.
   - Dots stay: every dot is there, the size it was.
   - The radius is the same everywhere: an outside corner and an inside corner,
     on small shapes and large, in different icons and places, are all rounded
     by the goo radius, in the icon's own units. */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as E from '../src/lib/engine.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const CL = require('../vendor/clipper.js');
E.useClipper(CL);
const lib = JSON.parse(readFileSync(resolve(root, 'data/icons.json'), 'utf8'));
const SC = 1000;
let failures = 0;
const check = (ok, what, detail = '') => { console.log(`  ${ok ? '✓' : '✗'} ${what}${ok || !detail ? '' : ' — ' + detail}`); if (!ok) failures++; };

const area = ps => Math.abs(CL.JS.AreaOfPolygons(ps)) / (SC * SC);
const bool = (type, a, b) => { const c = new CL.Clipper(); if (a.length) c.AddPaths(a, CL.PolyType.ptSubject, true); if (b.length) c.AddPaths(b, CL.PolyType.ptClip, true); const out = new CL.Paths(); c.Execute(type, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return out; };
const rect = (x0, y0, x1, y1) => [[{ X: x0 * SC, Y: y0 * SC }, { X: x1 * SC, Y: y0 * SC }, { X: x1 * SC, Y: y1 * SC }, { X: x0 * SC, Y: y1 * SC }]];
const box = ps => { const b = [Infinity, Infinity, -Infinity, -Infinity]; for (const p of ps) for (const q of p) { b[0] = Math.min(b[0], q.X / SC); b[1] = Math.min(b[1], q.Y / SC); b[2] = Math.max(b[2], q.X / SC); b[3] = Math.max(b[3], q.Y / SC); } return b; };
const ink = (prims, P, weight = P.weight) => E.inkLayers(prims, P, weight, CL);

/* ---------- paths only, inside the icon ---------- */
console.log('goo: paths only, inside the icon');
{
  const P = { ...E.DEF };
  const four = Object.fromEntries(Object.keys(lib.drawings).filter(k => k !== 'fills').map(k => [k, JSON.parse(readFileSync(resolve(root, lib.drawings[k]), 'utf8'))]));
  const sample = [];
  for (const [n, ic] of Object.entries(lib.sets.core)) if (sample.length < 400 && n.length % 9 === 0) for (const w of E.WEIGHTS) sample.push([`core:${n} ${w}`, ic.p, w]);
  for (const [n, ic] of Object.entries(lib.sets.beetle)) for (const w of E.WEIGHTS) sample.push([`beetle:${n} ${w}`, w === 'solid' && ic.ps ? ic.ps : ic.p, w]);
  for (const [file, icons] of Object.entries(four)) Object.keys(icons).filter((_, i) => i % 60 === 0).forEach(n => sample.push([`four:${n} ${file}`, E.drawn(icons[n]), file.split('-').slice(1).join('-')]));
  let bad = [], grew = [];
  for (const [name, prims, w] of sample) {
    const svg = E.gooSvg(prims, { ...P, weight: w });
    if (/<(filter|mask|clipPath|image|use|fe[A-Z])/.test(svg) || !svg.includes('<path')) bad.push(name);
    const plain = ink(prims, P, w).flatMap(l => l.paths), gooed = ink(prims, P, w).flatMap(l => E.gooPaths(l.paths, P, CL));
    const a = box(plain), b = box(gooed);
    if (gooed.length && (b[0] < a[0] - 0.02 || b[1] < a[1] - 0.02 || b[2] > a[2] + 0.02 || b[3] > a[3] + 0.02)) grew.push(name);
  }
  check(!bad.length, `${sample.length} icons and drawings with goo are paths alone, in every style`, bad.slice(0, 5).join(', '));
  check(!grew.length, 'and none grows past the plain icon', grew.slice(0, 5).join(', '));
  check(Math.max(...sample.map(([, prims, w]) => box(ink(prims, P, w).flatMap(l => E.gooPaths(l.paths, P, CL)))).flatMap(b => [-b[0], -b[1], b[2] - 24, b[3] - 24])) <= 1e-9, 'everything sits inside the 24 grid');
}

/* ---------- weight ---------- */
console.log('goo: lines and dots keep their weight');
for (const [S, goo] of [[2.5, 0.6], [2.5, 1.2], [1.5, 1.2], [1, 0.9]]) {
  const P = { ...E.DEF, S, goo };
  const w = E.widths(P).w;
  const line = E.gooPaths(ink(lib.sets.core.minus.p, P, 'outline')[0].paths, P, CL);
  const b = box(line);
  check(Math.abs((b[3] - b[1]) - w) < 0.02 * w, `stroke ${S}, goo ${goo}: a straight line stays ${w} thick (${(b[3] - b[1]).toFixed(3)})`);
  /* a dot drawn as a small ring at a thin stroke has its hole filled, as goo fills any hole narrower than twice its radius; its outside stays */
  const outers = ps => ps.filter(p => CL.Clipper.Orientation(p)).map(p => box([p])).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const plainDots = outers(ink(lib.sets.core.grip.p, P, 'outline')[0].paths), dots = outers(E.gooPaths(ink(lib.sets.core.grip.p, P, 'outline')[0].paths, P, CL));
  const same = dots.length === 9 && dots.every((d, i) => d.every((v, k) => Math.abs(v - plainDots[i][k]) < 0.02));
  check(same, `stroke ${S}, goo ${goo}: all 9 of grip's dots stay, each the size and in the place it was`, JSON.stringify(dots.slice(0, 2)));
}

/* ---------- the radius ---------- */
console.log('goo: one radius, everywhere');
/* the radius a file actually draws a corner with: the arcs it writes next to that corner */
const arcsNear = (svg, x, y, within) => {
  const out = [];
  for (const d of [...svg.matchAll(/ d="([^"]+)"/g)].map(m => m[1])) {
    let at = null;
    for (const seg of E.parsePath(d)) {
      if (seg.t === 'A' && at && Math.hypot(seg.p[0] - x, seg.p[1] - y) < within && Math.hypot(at[0] - x, at[1] - y) < within) out.push(seg.rx);
      if (seg.p) at = seg.p;
    }
  }
  return out;
};
const spread = list => list.length ? `${Math.min(...list).toFixed(3)} to ${Math.max(...list).toFixed(3)}, ${list.length} arcs` : 'no arcs';
{
  const P = { ...E.DEF, corners: 'sharp' }, r = E.gooRadius(P);
  const near = list => list.length > 0 && list.every(v => Math.abs(v - r) <= 0.02 * r + 0.01);
  /* outside corners: filled squares and oblongs of different sizes in different places */
  const outside = [];
  for (const [x0, y0, x1, y1] of [[3, 3, 21, 21], [2, 6, 22, 18], [9, 4, 15, 20], [5, 5, 9, 9]]) {
    const prims = [{ t: 'poly', closed: true, role: 'flat', roleLocked: true, pts: [[x0, y0, 'none'], [x1, y0, 'none'], [x1, y1, 'none'], [x0, y1, 'none']] }];
    const svg = E.gooSvg(prims, { ...P, weight: 'solid' });
    for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) { const a = arcsNear(svg, x, y, 1.5 * r); outside.push(...a); if (!a.length) outside.push(NaN); }
  }
  check(near(outside), `outside corners: 16 corners on 4 shapes of different sizes, every one an arc of radius ${r} (${spread(outside)})`);
  /* inside corners: an L of stroke at two sizes and two places */
  const inside = [];
  for (const [x, y, len] of [[4, 4, 16], [12, 10, 6]]) {
    const h = E.widths(P).w / 2;
    const svg = E.gooSvg([{ t: 'poly', pts: [[x, y, 'none'], [x, y + len, 'none'], [x + len, y + len, 'none']] }], { ...P, weight: 'outline' });
    const a = arcsNear(svg, x + h, y + len - h, 1.5 * r); inside.push(...a); if (!a.length) inside.push(NaN);
  }
  check(near(inside), `inside corners: rounded by the same ${r}, at any size and place (${spread(inside)})`);
  /* and on a real icon: the core set's square, stroked with sharp corners, at the four inside corners of its stroke */
  const plain = ink(lib.sets.core.square.p, P, 'outline')[0].paths, t = E.widths(P).w;
  const [bx0, by0, bx1, by1] = box(plain);
  const svg = E.gooSvg(lib.sets.core.square.p, { ...P, weight: 'outline' });
  const real = [[bx0 + t, by0 + t], [bx1 - t, by0 + t], [bx1 - t, by1 - t], [bx0 + t, by1 - t]].flatMap(([x, y]) => { const a = arcsNear(svg, x, y, 1.5 * r); return a.length ? a : [NaN]; });
  check(near(real), `and on the core set's square, every inside corner of its stroke the same (${spread(real)})`);
}

if (failures) { console.log(`\n${failures} check${failures === 1 ? '' : 's'} failed`); process.exit(1); }
console.log('\ngoo: all checks passed');
