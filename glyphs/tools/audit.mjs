/* audit.mjs — what every icon in the library is made of, and where its lines
   sit against the diagonals. Read-only: it reads the built library and writes
   the report into glyphs/audit/.

     node glyphs/tools/audit.mjs

   structure.md   every icon, grouped by its first category, with its parts
   structure.csv  the same, one row per icon, for a spreadsheet
   angles.csv     every straight line within 15° of a diagonal but not on one,
                  and every run of dots that lines up near a diagonal

   The four-style set is read from all eight of its drawings; the core set and
   the app glyphs from their centrelines (and an app glyph's drawn solid). */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as E from '../src/lib/engine.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'audit');
const lib = JSON.parse(readFileSync(resolve(root, 'data/icons.json'), 'utf8'));
const DRAWINGS = Object.keys(lib.drawings);
const four = Object.fromEntries(DRAWINGS.map(k => [k, JSON.parse(readFileSync(resolve(root, lib.drawings[k]), 'utf8'))]));

/* ---------- geometry ---------- */
const DIAG = [45, 135];
const NEAR = 15;      // how far off a diagonal a line is still listed
const EXACT = 0.05;   // closer than this already is one
const MIN_LEN = 0.75; // shorter than this is a join, not a line

const angleOf = (x1, y1, x2, y2) => ((Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) % 180 + 180) % 180;
const offDiagonal = a => Math.min(...DIAG.map(d => Math.abs(a - d)));
const square = a => Math.min(a, 180 - a, Math.abs(a - 90)) < EXACT;

/* the straight pieces of a path, as [x1, y1, x2, y2] */
function pathLines(segs) {
  const lines = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  for (const s of segs) {
    if (s.t === 'M') { [x, y] = s.p; sx = x; sy = y; }
    else if (s.t === 'L') { lines.push([x, y, s.p[0], s.p[1]]); [x, y] = s.p; }
    else if (s.t === 'Z') { if (x !== sx || y !== sy) lines.push([x, y, sx, sy]); x = sx; y = sy; }
    else if (s.p) [x, y] = s.p;
  }
  return lines;
}
const countPath = segs => {
  const c = { subpaths: 0, lines: 0, curves: 0, arcs: 0, closed: 0 };
  for (const s of segs) {
    if (s.t === 'M') c.subpaths++;
    else if (s.t === 'L') c.lines++;
    else if (s.t === 'C' || s.t === 'Q' || s.t === 'S' || s.t === 'T') c.curves++;
    else if (s.t === 'A') c.arcs++;
    else if (s.t === 'Z') c.closed++;
  }
  return c;
};
const isRect = pts => pts.length === 4 && pts.every((p, i) => { const q = pts[(i + 1) % 4]; return Math.abs(p[0] - q[0]) < 1e-6 || Math.abs(p[1] - q[1]) < 1e-6; });

/* what one subpath of path data is drawn as: a line, a polyline, a rect (its
   corners square or rounded), a polygon, a circle or dot, or a free path */
function splitSubpaths(segs) {
  const subs = [];
  for (const s of segs) { if (s.t === 'M' || !subs.length) subs.push([]); subs.at(-1).push(s); }
  return subs;
}
function kindOf(sub) {
  const ends = sub.filter(s => s.p).map(s => s.p);
  const closed = sub.some(s => s.t === 'Z') || (ends.length > 2 && Math.hypot(ends[0][0] - ends.at(-1)[0], ends[0][1] - ends.at(-1)[1]) < 1e-3);
  const draws = sub.filter(s => s.t !== 'M' && s.t !== 'Z');
  const straight = draws.filter(s => s.t === 'L');
  const curved = draws.length - straight.length;
  if (!curved) {
    if (!closed) return straight.length === 1 ? 'lines' : 'polylines';
    const pts = ends.slice(0, ends.length - (Math.hypot(ends[0][0] - ends.at(-1)[0], ends[0][1] - ends.at(-1)[1]) < 1e-3 ? 1 : 0));
    return isRect(pts) ? 'rects' : 'polygons';
  }
  if (closed && !straight.length) {
    const xs = ends.map(p => p[0]), ys = ends.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rs = ends.map(p => Math.hypot(p[0] - cx, p[1] - cy));
    const r = Math.max(...rs);
    if (r > 0 && Math.min(...rs) / r > 0.98) return r <= 1.01 ? 'dots' : 'circles';
    return 'paths';
  }
  /* straight sides joined by quarter turns, all square to the grid: a rounded rect */
  if (closed && straight.length === 4 && curved === 4 && straight.every(s => { const i = sub.indexOf(s); const prev = sub.slice(0, i).reverse().find(x => x.p); return prev && (Math.abs(prev.p[0] - s.p[0]) < 1e-6 || Math.abs(prev.p[1] - s.p[1]) < 1e-6); })) return 'rects';
  return 'paths';
}

/* ---------- what an icon is made of ---------- */
function blank() { return { lines: 0, polylines: 0, rects: 0, polygons: 0, circles: 0, ellipses: 0, dots: 0, arcs: 0, paths: 0, strokes: 0, fills: 0 }; }

/* centreline primitives: the core set, the app glyphs, the parametric icons */
function fromPrims(prims, k = blank(), lines = [], dots = []) {
  for (const p of prims || []) {
    const filled = p.role && p.role !== 'stroke' && p.role !== 'shape' && p.role !== 'detail';
    if (filled) k.fills++; else k.strokes++;
    if (p.t === 'poly') {
      const pts = p.pts;
      if (!p.closed) k[pts.length === 2 ? 'lines' : 'polylines']++;
      else k[isRect(pts) ? 'rects' : 'polygons']++;
      for (let i = 0; i + 1 < pts.length; i++) lines.push([pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]]);
      if (p.closed && pts.length > 2) lines.push([pts.at(-1)[0], pts.at(-1)[1], pts[0][0], pts[0][1]]);
    } else if (p.t === 'arc') {
      const full = Math.abs((p.a1 ?? 360) - (p.a0 ?? 0)) >= 359.99;
      const r = Math.max(p.rx, p.ry ?? p.rx);
      if (full && r <= 1.01) { k.dots++; dots.push(p.c); }
      else if (full) k[Math.abs(p.rx - (p.ry ?? p.rx)) < 1e-6 ? 'circles' : 'ellipses']++;
      else k.arcs++;
    } else if (p.t === 'path') {
      const segs = p.segs || E.parsePath(p.d);
      for (const sub of splitSubpaths(segs)) k[kindOf(sub)]++;
      lines.push(...pathLines(segs));
    } else if (p.t === 'seq') {
      k.paths++;
      let x = 0, y = 0;
      for (const s of p.segs) { if (s[0] === 'L') lines.push([x, y, s[1], s[2]]); if (s[0] !== 'A') { x = s[1]; y = s[2]; } }
    } else if (p.t === 'quad') {
      k.polygons++;
    }
  }
  return { k, lines, dots };
}

/* a four-style drawing: SVG path data, f marks a fill, a its opacity */
function fromDrawing(items, k = blank(), lines = []) {
  for (const it of items || []) {
    const segs = E.parsePath(it.d);
    const subs = splitSubpaths(segs);
    for (const sub of subs) k[kindOf(sub)]++;
    if (it.f) k.fills += subs.length; else k.strokes += subs.length;
    lines.push(...pathLines(segs));
  }
  return { k, lines };
}

const describe = k => Object.entries(k).filter(([n, v]) => v && n !== 'strokes' && n !== 'fills')
  .map(([n, v]) => `${v} ${v === 1 ? n.replace(/s$/, '').replace(/ellipse$/, 'ellipse') : n}`).join(', ') || 'nothing drawn';

/* every line near a diagonal, and every run of three or more dots on one */
function nearLines(lines) {
  const found = [];
  for (const line of lines) {
    const [x1, y1, x2, y2] = line;
    if (Math.hypot(x2 - x1, y2 - y1) < MIN_LEN) continue;
    const a = angleOf(x1, y1, x2, y2);
    if (square(a)) continue;
    const off = offDiagonal(a);
    if (off >= EXACT && off < NEAR) found.push({ x1, y1, x2, y2, a, off, drawing: line.drawing });
  }
  return found;
}
const exactDiagonals = lines => lines.filter(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1) >= MIN_LEN && offDiagonal(angleOf(x1, y1, x2, y2)) < EXACT).length;
function dotRuns(dots) {
  const runs = [];
  for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
    const [a, b] = [dots[i], dots[j]];
    const ang = angleOf(a[0], a[1], b[0], b[1]);
    if (square(ang)) continue;
    const off = offDiagonal(ang);
    if (off < NEAR) runs.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], a: ang, off });
  }
  return runs;
}

/* ---------- every icon ---------- */
const rows = [];
const P = { ...E.DEF };
for (const id of E.ICON_ORDER) {
  const { k, lines, dots } = fromPrims(E.ICONS[id].make(P));
  rows.push({ set: 'param', name: id, cats: ['beetle'], k, solid: null, lines, dots, drawings: null });
}
for (const [name, ic] of Object.entries(lib.sets.beetle)) {
  const { k, lines, dots } = fromPrims(ic.p);
  const solid = ic.ps ? fromPrims(ic.ps) : null;
  rows.push({ set: 'beetle', name, cats: ic.c, k, solid: solid && solid.k, lines: lines.concat(solid ? solid.lines : []), dots, drawings: null });
}
for (const [name, ic] of Object.entries(lib.sets.core)) {
  const { k, lines, dots } = fromPrims(ic.p);
  rows.push({ set: 'core', name, cats: ic.c, k, solid: null, lines, dots, drawings: null });
}
for (const [name, ic] of Object.entries(lib.sets.four)) {
  const drawings = {}, lines = [];
  for (const dname of DRAWINGS) {
    const r = fromDrawing(four[dname][name]);
    drawings[dname] = r.k;
    lines.push(...r.lines.map(l => Object.assign(l, { drawing: dname })));
  }
  rows.push({ set: 'four', name, cats: ic.c, k: drawings['rounded-outline'], solid: drawings['rounded-solid'], lines, dots: [], drawings });
}

for (const r of rows) {
  r.near = nearLines(r.lines);
  r.exact = exactDiagonals(r.lines);
  r.runs = dotRuns(r.dots);
}

/* ---------- write ---------- */
mkdirSync(out, { recursive: true });
const SETS = { param: 'parametric', beetle: 'app glyph', core: 'core set', four: 'four-style set' };
const csvCell = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const fmt = v => Math.round(v * 100) / 100;

const keys = Object.keys(blank());
writeFileSync(resolve(out, 'structure.csv'), [
  ['set', 'icon', 'categories', ...keys, 'solid', 'straight lines', 'exact diagonals', 'near a diagonal', 'furthest off (deg)', 'dot runs near a diagonal'].join(','),
  ...rows.map(r => [SETS[r.set], r.name, r.cats.join(' '), ...keys.map(n => r.k[n]), r.solid ? describe(r.solid) : '', r.lines.length, r.exact, r.near.length,
    r.near.length ? fmt(Math.max(...r.near.map(l => l.off))) : '', r.runs.length].map(csvCell).join(',')),
].join('\n') + '\n');

writeFileSync(resolve(out, 'angles.csv'), [
  'set,icon,drawing,kind,x1,y1,x2,y2,angle,off diagonal',
  ...rows.flatMap(r => [
    ...r.near.map(l => [SETS[r.set], r.name, l.drawing || 'centreline', 'line', l.x1, l.y1, l.x2, l.y2, fmt(l.a), fmt(l.off)]),
    ...r.runs.map(l => [SETS[r.set], r.name, 'centreline', 'dots', l.x1, l.y1, l.x2, l.y2, fmt(l.a), fmt(l.off)]),
  ].map(c => c.map(csvCell).join(','))),
].join('\n') + '\n');

/* the report: totals first, then every icon under its first category */
const bySet = s => rows.filter(r => r.set === s);
const bands = [[EXACT, 2], [2, 5], [5, 10], [10, NEAR]];
const total = (list, n) => list.reduce((a, r) => a + r.k[n], 0);
const md = [];
md.push('# Beetle Glyphs: structure audit', '');
md.push(`Generated by \`node glyphs/tools/audit.mjs\` from the built library (engine ${lib.version.engine}, library ${lib.version.library}). ${rows.length} icons. Each icon is listed once, under its first category; the others it counts in are beside it.`, '');
md.push('Parts are counted from the centrelines for the parametric icons, the app glyphs and the core set (an app glyph drawn in both weights shows its solid too), and from the rounded outline drawing for the four-style set, with its rounded solid beside it. A dot is a full circle of radius 1 or less.', '');
md.push('## Totals', '');
md.push('| Set | Icons | Lines | Polylines | Rects | Polygons | Circles | Ellipses | Dots | Arcs | Paths |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const s of Object.keys(SETS)) { const l = bySet(s); md.push(`| ${SETS[s]} | ${l.length} | ${['lines', 'polylines', 'rects', 'polygons', 'circles', 'ellipses', 'dots', 'arcs', 'paths'].map(n => total(l, n)).join(' | ')} |`); }
md.push('', '## Lines against the diagonals', '');
md.push(`A straight line counts if it is at least ${MIN_LEN} long and not already flat or upright. For the four-style set every one of its eight drawings is counted.`, '');
md.push('| Set | Icons with an exact diagonal | ' + bands.map(([a, b]) => `${a === EXACT ? 0 : a}–${b}° off: lines (icons)`).join(' | ') + ' |', '| --- | ---: | ' + bands.map(() => '---:').join(' | ') + ' |');
for (const s of Object.keys(SETS)) {
  const l = bySet(s);
  const cells = bands.map(([a, b]) => { const hits = l.map(r => r.near.filter(x => x.off >= a && x.off < b).length); return `${hits.reduce((x, y) => x + y, 0)} (${hits.filter(Boolean).length})`; });
  md.push(`| ${SETS[s]} | ${l.filter(r => r.exact).length} | ${cells.join(' | ')} |`);
}
const runIcons = rows.filter(r => r.runs.length);
md.push('', `Dots that line up near a diagonal: ${runIcons.reduce((a, r) => a + r.runs.length, 0)} pairs in ${runIcons.length} icons (${runIcons.map(r => `${SETS[r.set]} ${r.name}`).slice(0, 40).join(', ')}${runIcons.length > 40 ? ', …' : ''}).`, '');
md.push('Every line and dot pair is in `angles.csv`, with its drawing, its ends and how far off it is.', '');

md.push('## Every icon, by category', '');
const groups = new Map();
for (const r of rows) { const c = r.cats[0] || 'other'; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(r); }
for (const c of [...groups.keys()].sort()) {
  const list = groups.get(c).sort((a, b) => a.name.localeCompare(b.name) || a.set.localeCompare(b.set));
  md.push(`### ${c.replace(/-/g, ' ')} (${list.length})`, '');
  md.push('| Icon | Set | Parts | Stroked / filled | Near 45° | Also in |', '| --- | --- | --- | --- | ---: | --- |');
  for (const r of list) {
    const parts = describe(r.k) + (r.solid ? `; solid: ${describe(r.solid)}` : '');
    md.push(`| ${r.name} | ${SETS[r.set]} | ${parts} | ${r.k.strokes} / ${r.k.fills} | ${r.near.length || ''} | ${r.cats.slice(1).join(', ')} |`);
  }
  md.push('');
}
writeFileSync(resolve(out, 'structure.md'), md.join('\n'));

console.log(`${rows.length} icons audited into glyphs/audit/`);
for (const s of Object.keys(SETS)) { const l = bySet(s); console.log(`  ${SETS[s]}: ${l.length} icons, ${l.filter(r => r.near.length).length} with lines near a diagonal (${l.reduce((a, r) => a + r.near.length, 0)} lines)`); }
