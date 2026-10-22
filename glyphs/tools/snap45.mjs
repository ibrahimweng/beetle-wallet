/* snap45.mjs — the 45° pass of the library build.

   A straight line that sits close to a diagonal (within TOL degrees) is moved
   onto it exactly: onto 45° or 135°, which as directions are also 225° and
   315°. So is a pair of neighbouring dots that lines up close to one. Only
   the points move, and only as far as they must: the pass finds the smallest
   movement of every point (weighted, so a point that a curve or an arc hangs
   on moves less, and one an arc's end is drawn from not at all) under three
   conditions: every snapped line lies on its diagonal, every line that was
   already flat, upright or diagonal stays so, and points that coincided still
   coincide. Curves follow their ends, and a handle that ran on along a line
   turns with it, so a rounded corner stays smooth. Nothing is rotated as a
   whole and no transform is added: the coordinates themselves change.

   A snap is refused when it would move a point further than MAX_MOVE, take
   the icon out past its own box by more than PAD, shorten a line by half, or
   turn a line it did not set out to snap by more than FREE_TURN. Before giving
   up the pass drops the line furthest from its diagonal and tries again, so
   an icon keeps every snap it can, and the lines it could not take are
   reported with the reason. */
import * as E from '../src/lib/engine.js';

export const TOL = 12;         // degrees off a diagonal that still snaps
export const EXACT = 0.01;     // degrees: closer than this already is on it
export const MIN_LEN = 0.75;   // a shorter line is a join, not a line
export const MAX_MOVE = 0.75;  // no point moves further, on the 24 grid
export const PAD = 0.25;       // nor out past the icon's own box by more
export const FREE_TURN = 6;    // degrees a line that was not snapped may turn

/* Icons that keep their lines as drawn, and why. Matched against set:name. */
export const SKIP = [
  [/^beetle:mark$/, "the Beetle mark is the brand's own drawing"],
  [/^param:naira$/, 'the naira sign keeps the proportions of its letter'],
  [/^(core|four):(heading-\d|languages|(square-)?sigma|square-m|signature)$/, 'letters, numerals and handwriting keep the shapes of their type'],
  [/^(core|four):((circle|square)-)?asterisk$/, "an asterisk's arms are evenly spaced; snapping some of them would leave them uneven"],
];
export const skipped = key => (SKIP.find(([re]) => re.test(key)) || [])[1] || null;

const D2R = Math.PI / 180;
const W_CURVE = 4, W_ARC = 8, W_PIN = 1e6;
const f6 = v => { const r = Math.round(v * 1e6) / 1e6; return Object.is(r, -0) ? 0 : r; };

const angleOf = (dx, dy) => ((Math.atan2(dy, dx) / D2R) % 180 + 180) % 180;
const diagonalOff = a => Math.min(Math.abs(a - 45), Math.abs(a - 135));
const squareOff = a => Math.min(a, 180 - a, Math.abs(a - 90));
const nearestDir = a => {
  const dirs = [0, 45, 90, 135, 180];
  const d = dirs.reduce((b, x) => (Math.abs(a - x) < Math.abs(a - b) ? x : b));
  return [Math.cos(d * D2R), Math.sin(d * D2R)];
};
const diagonalDir = a => (Math.abs(a - 45) < Math.abs(a - 135) ? [Math.SQRT1_2, Math.SQRT1_2] : [-Math.SQRT1_2, Math.SQRT1_2]);

/* ---------- a figure: the points of an icon and the straight lines between them ---------- */
class Figure {
  constructor() { this.x = []; this.y = []; this.w = []; this.key = new Map(); this.lines = []; this.dots = []; this.loops = []; }
  point(x, y, w = 1) {
    const k = `${Math.round(x * 1000)},${Math.round(y * 1000)}`;
    let id = this.key.get(k);
    if (id === undefined) { id = this.x.length; this.key.set(k, id); this.x.push(x); this.y.push(y); this.w.push(w); }
    else this.w[id] = Math.max(this.w[id], w);
    return id;
  }
  /* a line, linked to the one before it in the same run so a flattened curve can be told from a corner */
  line(a, b, prev = null) {
    if (a === b) return prev;
    const l = { a, b, prev, next: null };
    if (prev) prev.next = l;
    this.lines.push(l);
    return l;
  }
}

/* ---------- reading the geometry in ---------- */

/* centreline primitives: poly, path, arc (the core set, the app glyphs) */
function figureOfPrims(prims) {
  const fig = new Figure(), writes = [];
  /* an arc's ends are drawn from its centre and angles: a line that meets one cannot move there */
  for (const p of prims) if (p.t === 'arc') {
    const full = Math.abs((p.a1 ?? 360) - (p.a0 ?? 0)) >= 359.99;
    const r = Math.max(p.rx, p.ry ?? p.rx);
    if (full && r <= 1.01) { const id = fig.point(p.c[0], p.c[1]); fig.dots.push(id); writes.push(X => { p.c = [f6(X.x[id]), f6(X.y[id])]; }); }
    else if (!full) for (const a of [p.a0, p.a1]) fig.point(p.c[0] + p.rx * Math.cos(a * D2R), p.c[1] + (p.ry ?? p.rx) * Math.sin(a * D2R), W_PIN);
  }
  for (const p of prims) {
    if (p.t === 'poly') {
      const ids = p.pts.map(q => fig.point(q[0], q[1]));
      let prev = null, first = null;
      for (let i = 0; i + 1 < ids.length; i++) { prev = fig.line(ids[i], ids[i + 1], prev); if (!first) first = prev; }
      if (p.closed && ids.length > 2) { const last = fig.line(ids.at(-1), ids[0], prev); if (last && first && last !== first) { last.next = first; first.prev = last; } fig.loops.push(ids); }
      writes.push(X => { p.pts.forEach((q, i) => { q[0] = f6(X.x[ids[i]]); q[1] = f6(X.y[ids[i]]); }); });
    } else if (p.t === 'path') {
      const segs = p.segs ? p.segs : E.parsePath(p.d);
      readPath(fig, segs, false);
      writes.push(X => { writePath(segs, X); p.d = E.segsToString(segs, f6); if (p.segs) p.segs = segs; });
    }
  }
  return { fig, writes };
}

/* a four-style drawing: parts of SVG path data */
function figureOfParts(parts) {
  const fig = new Figure(), writes = [];
  for (const part of parts) {
    const segs = E.parsePath(part.d);
    readPath(fig, segs, !!part.f);
    writes.push(X => { writePath(segs, X); part.d = E.segsToString(segs, f6); });
  }
  return { fig, writes };
}

/* every end point of a path becomes a point of the figure; curves remember
   which points their handles hang from. A closed subpath, or any subpath of a
   filled part, is a loop that must not come to cross itself */
function readPath(fig, segs, filled) {
  let cur = null, start = null, prev = null, first = null, loop = null, closed = false;
  const end = () => { if (loop && loop.length > 2 && (closed || filled)) fig.loops.push(loop); };
  for (const s of segs) {
    if (s.t === 'M') { end(); cur = start = fig.point(s.p[0], s.p[1]); s._id = cur; prev = first = null; loop = [cur]; closed = false; }
    else if (s.t === 'L') { const id = fig.point(s.p[0], s.p[1]); s._id = id; s._from = cur; prev = fig.line(cur, id, prev); if (!first) first = prev; cur = id; loop && loop.push(id); }
    else if (s.t === 'C' || s.t === 'Q') { const id = fig.point(s.p[0], s.p[1], W_CURVE); fig.w[cur] = Math.max(fig.w[cur], W_CURVE); s._id = id; s._from = cur; cur = id; prev = null; loop && loop.push(id); }
    else if (s.t === 'A') { const id = fig.point(s.p[0], s.p[1], W_ARC); fig.w[cur] = Math.max(fig.w[cur], W_ARC); s._id = id; s._from = cur; cur = id; prev = null; loop && loop.push(id); }
    else if (s.t === 'Z') { if (cur !== start) { const l = fig.line(cur, start, prev); if (l && first && l !== first && first.a === start) { l.next = first; first.prev = l; } } cur = start; prev = first = null; closed = true; }
  }
  end();
}

/* how many times a loop's edges (a curve taken as its chord) cross each other */
function crossings(loop, x, y) {
  const ids = loop[0] === loop.at(-1) ? loop.slice(0, -1) : loop;
  const n = ids.length;
  let count = 0;
  const side = (a, b, c) => Math.sign((x[b] - x[a]) * (y[c] - y[a]) - (y[b] - y[a]) * (x[c] - x[a]));
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const [a, b, c, d] = [ids[i], ids[(i + 1) % n], ids[j], ids[(j + 1) % n]];
    if (a === c || a === d || b === c || b === d) continue;
    if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) count++;
  }
  return count;
}

function writePath(segs, X) {
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s._id === undefined) continue;
    if (s.t === 'C') {
      let c1 = [s.c1[0] + X.dx[s._from], s.c1[1] + X.dy[s._from]];
      let c2 = [s.c2[0] + X.dx[s._id], s.c2[1] + X.dy[s._id]];
      /* a handle that ran on along a line turns with the line, keeping its length */
      const before = segs[i - 1], after = segs[i + 1];
      if (before && before.t === 'L') c1 = alongLine(c1, s.c1, s._from, before._from, X);
      if (after && after.t === 'L') c2 = alongLine(c2, s.c2, s._id, after._id, X);
      s._c1 = c1; s._c2 = c2;
    } else if (s.t === 'Q') {
      const k = s.c ? 'c' : 'c1';
      s['_' + k] = [s[k][0] + (X.dx[s._from] + X.dx[s._id]) / 2, s[k][1] + (X.dy[s._from] + X.dy[s._id]) / 2];
    }
  }
  for (const s of segs) {
    if (s._id === undefined) continue;
    for (const k of ['c', 'c1', 'c2']) if (s['_' + k]) { s[k] = [f6(s['_' + k][0]), f6(s['_' + k][1])]; delete s['_' + k]; }
    s.p = [f6(X.x[s._id]), f6(X.y[s._id])];
  }
  for (const s of segs) { delete s._id; delete s._from; }
}

/* the handle at anchor `at` (now moved to `moved`), if it ran along the line
   from `at` to `other`, lies along that line's new direction at its old length */
function alongLine(moved, handle, at, other, X) {
  if (other === undefined) return moved;
  const ho = [handle[0] - X.x0[at], handle[1] - X.y0[at]];
  const lo = [X.x0[other] - X.x0[at], X.y0[other] - X.y0[at]];
  const hl = Math.hypot(ho[0], ho[1]), ll = Math.hypot(lo[0], lo[1]);
  if (hl < 1e-9 || ll < 1e-9) return moved;
  if (Math.abs(ho[0] * lo[1] - ho[1] * lo[0]) / (hl * ll) > Math.sin(3 * D2R)) return moved;
  const sign = ho[0] * lo[0] + ho[1] * lo[1] >= 0 ? 1 : -1;
  const ln = [X.x[other] - X.x[at], X.y[other] - X.y[at]];
  const nl = Math.hypot(ln[0], ln[1]);
  if (nl < 1e-9) return moved;
  return [X.x[at] + sign * ln[0] / nl * hl, X.y[at] + sign * ln[1] / nl * hl];
}

/* ---------- which lines snap ---------- */

/* a line short and barely turning from its neighbours is a piece of a flattened curve */
function curvePiece(l, fig, len) {
  if (len >= 2) return false;
  const nb = [l.prev, l.next].filter(Boolean);
  if (!nb.length) return false;
  const dir = m => Math.atan2(fig.y[m.b] - fig.y[m.a], fig.x[m.b] - fig.x[m.a]);
  return nb.every(m => { let t = Math.abs(dir(m) - dir(l)) / D2R % 360; if (t > 180) t = 360 - t; return t < 20; });
}

/* the lines (and neighbouring dot pairs) of a figure, each with what is asked of it */
function plan(fig, x, y, dropped) {
  const out = [];
  const add = (a, b, kind, l) => {
    const dx = x[b] - x[a], dy = y[b] - y[a], len = Math.hypot(dx, dy);
    if (len < 1e-6) return;
    const ang = angleOf(dx, dy), off = diagonalOff(ang);
    if (squareOff(ang) < EXACT || off < EXACT) { out.push({ a, b, u: nearestDir(ang), role: 'keep', len, ang }); return; }
    if (len < MIN_LEN || (l && curvePiece(l, fig, len))) { out.push({ a, b, role: 'free', len, ang }); return; }
    const key = `${a}-${b}`;
    if (off < TOL && !dropped.has(key)) out.push({ a, b, u: diagonalDir(ang), role: 'snap', len, ang, off, key, kind });
    else out.push({ a, b, role: 'free', len, ang, off, key, kind, refused: dropped.get(key) });
  };
  for (const l of fig.lines) add(l.a, l.b, 'line', l);
  /* dots: each with its nearest neighbours, so a grid of dots keeps its rows */
  const ds = fig.dots;
  for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
    const d = (p, q) => Math.hypot(x[p] - x[q], y[p] - y[q]);
    const near = p => Math.min(...ds.filter(q => q !== p).map(q => d(p, q)));
    if (d(ds[i], ds[j]) <= 1.5 * Math.min(near(ds[i]), near(ds[j])) + 1e-9) add(ds[i], ds[j], 'dots', null);
  }
  return out;
}

/* ---------- the smallest weighted movement that meets every condition ---------- */
function solve(fig, rows) {
  const n = fig.x.length, m = rows.length;
  const X0 = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) { X0[2 * i] = fig.x[i]; X0[2 * i + 1] = fig.y[i]; }
  /* each condition: the line's direction crossed with its target is zero */
  const A = rows.map(r => { const [ux, uy] = r.u; return [[2 * r.a, -uy], [2 * r.a + 1, ux], [2 * r.b, uy], [2 * r.b + 1, -ux]]; });
  const D = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) D[2 * i] = D[2 * i + 1] = 1 / fig.w[i];
  const res = A.map(row => row.reduce((s, [k, c]) => s + c * X0[k], 0));
  /* M = A D A^T, solved with partial pivoting; a dependent condition drops out */
  const M = Array.from({ length: m }, () => new Float64Array(m));
  const byVar = new Map();
  A.forEach((row, i) => row.forEach(([k, c]) => { if (!byVar.has(k)) byVar.set(k, []); byVar.get(k).push([i, c]); }));
  for (const [k, list] of byVar) for (const [i, ci] of list) for (const [j, cj] of list) M[i][j] += ci * D[k] * cj;
  const rhs = Float64Array.from(res);
  const scale = Math.max(1e-12, ...M.map((r, i) => Math.abs(r[i])));
  const live = new Array(m).fill(true);
  for (let c = 0; c < m; c++) {
    let p = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-10 * scale) { live[c] = false; continue; }
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; [rhs[p], rhs[c]] = [rhs[c], rhs[p]]; }
    for (let r = c + 1; r < m; r++) {
      const f = M[r][c] / M[c][c];
      if (!f) continue;
      for (let k = c; k < m; k++) M[r][k] -= f * M[c][k];
      rhs[r] -= f * rhs[c];
    }
  }
  const lam = new Float64Array(m);
  for (let c = m - 1; c >= 0; c--) {
    if (!live[c]) continue;
    let s = rhs[c];
    for (let k = c + 1; k < m; k++) s -= M[c][k] * lam[k];
    lam[c] = s / M[c][c];
  }
  const lambda = lam;
  const delta = new Float64Array(2 * n);
  A.forEach((row, i) => row.forEach(([k, c]) => { delta[k] -= D[k] * c * lambda[i]; }));
  const x = [], y = [];
  for (let i = 0; i < n; i++) { x.push(X0[2 * i] + delta[2 * i]); y.push(X0[2 * i + 1] + delta[2 * i + 1]); }
  return { x, y };
}

/* ---------- the pass ---------- */
function bbox(xs, ys) { return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }

function snapFigure(fig) {
  const dropped = new Map(); // line key -> why it was refused
  const x0 = fig.x.slice(), y0 = fig.y.slice();
  if (!fig.x.length) return null;
  const box0 = bbox(x0, y0);
  for (let attempt = 0; attempt < 40; attempt++) {
    let x = x0, y = y0, rows = plan(fig, x0, y0, dropped);
    if (!rows.some(r => r.role === 'snap')) return { x: x0, y: y0, snapped: [], dropped };
    let ok = true, why = '';
    /* a snap can bring another line into range: up to three rounds */
    let asked = rows;
    for (let round = 0; round < 3; round++) {
      const conds = asked.filter(r => r.role !== 'free');
      ({ x, y } = solve(fig, conds));
      const again = plan(fig, x, y, dropped);
      const newly = again.filter(r => r.role === 'snap' && !asked.some(q => q.a === r.a && q.b === r.b && q.role !== 'free'));
      if (!newly.length) break;
      asked = asked.map(r => { const n = newly.find(q => q.a === r.a && q.b === r.b); return n ? { ...n, u: n.u } : r; });
    }
    const snaps = asked.filter(r => r.role === 'snap');
    /* every condition met */
    for (const r of asked) if (r.role !== 'free') {
      const dx = x[r.b] - x[r.a], dy = y[r.b] - y[r.a], len = Math.hypot(dx, dy);
      if (len < 1e-9 || Math.abs(dx * r.u[1] - dy * r.u[0]) / len > 1e-7) { ok = false; why = 'the lines around it hold it off its diagonal'; break; }
    }
    /* how far it moved */
    let move = 0;
    for (let i = 0; i < x.length; i++) move = Math.max(move, Math.hypot(x[i] - x0[i], y[i] - y0[i]));
    if (ok && move > MAX_MOVE) { ok = false; why = `it would move a point ${move.toFixed(2)} (the most is ${MAX_MOVE})`; }
    if (ok) { const b = bbox(x, y); if (b[0] < box0[0] - PAD || b[1] < box0[1] - PAD || b[2] > box0[2] + PAD || b[3] > box0[3] + PAD) { ok = false; why = 'it would push the icon out past its own box'; } }
    if (ok && fig.loops.some(l => crossings(l, x, y) > crossings(l, x0, y0))) { ok = false; why = 'it would make the shape cross itself'; }
    if (ok) for (const r of asked) {
      const dx = x[r.b] - x[r.a], dy = y[r.b] - y[r.a], len = Math.hypot(dx, dy);
      if (len < 0.5 * r.len) { ok = false; why = 'it would shorten a line by half'; break; }
      if (r.role === 'free' && r.len >= MIN_LEN) { let t = Math.abs(angleOf(dx, dy) - r.ang); t = Math.min(t, 180 - t); if (t > FREE_TURN) { ok = false; why = `it would turn a line it was not snapping by ${t.toFixed(1)}°`; break; } }
    }
    if (ok) return { x, y, snapped: snaps, dropped };
    /* give up the line furthest from its diagonal and try again */
    const worst = snaps.reduce((a, b) => (b.off > a.off ? b : a));
    dropped.set(worst.key, why);
  }
  return { x: x0, y: y0, snapped: [], dropped };
}

function apply(fig, writes, result) {
  const X = {
    x: result.x, y: result.y, x0: fig.x, y0: fig.y,
    dx: result.x.map((v, i) => v - fig.x[i]), dy: result.y.map((v, i) => v - fig.y[i]),
  };
  for (const w of writes) w(X);
}

function report(fig, result) {
  /* a snapped line as it was drawn; a refused one where it ends up, since a snapped neighbour may have moved its ends */
  const lines = (r, x = fig.x, y = fig.y) => ({ from: [f6(x[r.a]), f6(y[r.a])], to: [f6(x[r.b]), f6(y[r.b])], angle: Math.round(r.ang * 100) / 100, kind: r.kind });
  const left = plan(fig, result.x, result.y, new Map()).filter(r => r.role === 'snap');
  let move = 0;
  for (let i = 0; i < fig.x.length; i++) move = Math.max(move, Math.hypot(result.x[i] - fig.x[i], result.y[i] - fig.y[i]));
  return {
    snapped: result.snapped.map(lines),
    refused: left.map(r => ({ ...lines(r, result.x, result.y), why: result.dropped.get(r.key) || 'it could not be met with the lines around it' })),
    moved: Math.round(move * 1000) / 1000,
  };
}

/* Snap centreline primitives in place. Returns what was snapped and refused. */
export function snapPrims(prims) {
  const { fig, writes } = figureOfPrims(prims);
  const result = snapFigure(fig);
  if (!result) return { snapped: [], refused: [], moved: 0 };
  const r = report(fig, result);
  if (r.snapped.length) apply(fig, writes, result);
  return r;
}

/* Snap one four-style drawing (its parts of path data) in place. */
export function snapDrawing(parts) {
  const { fig, writes } = figureOfParts(parts);
  const result = snapFigure(fig);
  if (!result) return { snapped: [], refused: [], moved: 0 };
  const r = report(fig, result);
  if (r.snapped.length) apply(fig, writes, result);
  return r;
}

/* What the check reads: every line of a figure still near a diagonal and meant to snap. */
export function stillOff(prims, parts) {
  const { fig } = prims ? figureOfPrims(prims) : figureOfParts(parts);
  return plan(fig, fig.x, fig.y, new Map()).filter(r => r.role === 'snap')
    .map(r => ({ from: [fig.x[r.a], fig.y[r.a]], to: [fig.x[r.b], fig.y[r.b]], angle: r.ang, off: r.off, kind: r.kind }));
}
