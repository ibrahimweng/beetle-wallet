/* Beetle glyph engine, v2. One geometry model for every icon: centreline
 primitives on a 24 grid, every radius and gap in stroke units. The same
 primitives render to SVG (curves kept), flatten to polygons for Clipper, and
 come out the far end as filled outlines for a sprite or a font.

 Primitives
   poly  { pts:[[x,y,kind?]...], closed }       kind: 'none' | 'soft' | 'box' | 'box:k' | 'fillet' | number
   arc   { c:[x,y], rx, ry, a0, a1 }            parametric angles in degrees, y down, 360 = full
   seq   { segs:[['M',x,y] | ['L',x,y] | ['A',cx,cy,rx,ry,a0,a1]] }
   quad  { pts:[p, ctrl, p, ctrl ...] }         closed quadratic loop
   path  { d } or { segs }                      SVG path data, straight joins get fillets
 Roles: stroke | shape | detail | fill | flat. */

const DEF = { S: 2.5, R: 2, G: 0.75, choke: 0, goo: 0, fillet: 0.5, weight: 'outline' };
const PRESETS = {
  beetle: { S: 2.5, R: 2, G: 0.75, choke: 0, goo: 0, fillet: 0.5 },
  lucide: { S: 2, R: 1.5, G: 0.75, choke: 0, goo: 0, fillet: 0 },
};
const D2R = Math.PI / 180;
const f2 = v => Math.round(v * 100) / 100;
const num = v => (Object.is(v, -0) ? 0 : v);

/* ---------- corners ---------- */
function radiusOf(k, P) {
  if (k == null || k === 'none') return 0;
  if (typeof k === 'number') return k;
  if (k === 'soft') return 0.5 * P.S;
  if (k === 'fillet' || k === 'letter') return Math.max(0, (P.fillet != null ? P.fillet : 0) * P.S);
  if (k === 'box') return Math.max(0, P.R * P.S - 0.5 * P.S);
  if (k.startsWith('box:')) return Math.max(0, (P.R * P.S - 0.5 * P.S) * parseFloat(k.slice(4)));
  return 0;
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = v => Math.hypot(v[0], v[1]);
const norm = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };

function corners(pts, closed, P) {
  const n = pts.length;
  return pts.map((V, i) => {
    const hasPrev = closed || i > 0, hasNext = closed || i < n - 1;
    const r0 = radiusOf(V[2], P);
    if (!hasPrev || !hasNext || r0 <= 0) return { p1: V, p2: V, r: 0 };
    const A = pts[(i - 1 + n) % n], B = pts[(i + 1) % n];
    const vA = sub(A, V), vB = sub(B, V);
    const lA = len(vA), lB = len(vB);
    if (lA < 1e-6 || lB < 1e-6) return { p1: V, p2: V, r: 0 };
    const u1 = norm(vA), u2 = norm(vB);
    const cos = Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]));
    const th = Math.acos(cos);
    if (th > Math.PI - 1e-3 || th < 1e-3) return { p1: V, p2: V, r: 0 };
    let t = r0 / Math.tan(th / 2);
    const tMax = Math.min(lA, lB) / 2;
    if (t > tMax) t = tMax;
    const r = t * Math.tan(th / 2);
    const p1 = [V[0] + u1[0] * t, V[1] + u1[1] * t];
    const p2 = [V[0] + u2[0] * t, V[1] + u2[1] * t];
    const cross = (-u1[0]) * u2[1] - (-u1[1]) * u2[0];
    const sweep = cross > 0 ? 1 : 0;
    const bis = norm([u1[0] + u2[0], u1[1] + u2[1]]);
    const dist = r / Math.sin(th / 2);
    const c = [V[0] + bis[0] * dist, V[1] + bis[1] * dist];
    return { p1, p2, r, c, sweep };
  });
}

/* ---------- path data ---------- */
function parsePath(d) {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const segs = [];
  let i = 0, cmd = null, cur = [0, 0], start = [0, 0], prevC = null, prevQ = null;
  const n = () => parseFloat(tokens[i++]);
  const isNum = () => i < tokens.length && /^[-.\d]/.test(tokens[i]);
  /* arc flags are single characters and may be glued to what follows: "a2 2 0 001.5 3" */
  const flag = () => { const t = tokens[i] || '0'; const f = t[0] === '1' ? 1 : 0; if (t.length > 1) tokens[i] = t.slice(1); else i++; return f; };
  while (i < tokens.length) {
    const tok = tokens[i];
    if (/^[A-Za-z]$/.test(tok)) { cmd = tok; i++; if (cmd === 'Z' || cmd === 'z') { segs.push({ t: 'Z' }); cur = start.slice(); prevC = prevQ = null; continue; } }
    else if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'M') { const x = n(), y = n(); cur = rel ? [cur[0] + x, cur[1] + y] : [x, y]; start = cur.slice(); segs.push({ t: 'M', p: cur.slice() }); cmd = rel ? 'l' : 'L'; prevC = prevQ = null; }
    else if (C === 'L') { const x = n(), y = n(); cur = rel ? [cur[0] + x, cur[1] + y] : [x, y]; segs.push({ t: 'L', p: cur.slice() }); prevC = prevQ = null; }
    else if (C === 'H') { const x = n(); cur = [rel ? cur[0] + x : x, cur[1]]; segs.push({ t: 'L', p: cur.slice() }); prevC = prevQ = null; }
    else if (C === 'V') { const y = n(); cur = [cur[0], rel ? cur[1] + y : y]; segs.push({ t: 'L', p: cur.slice() }); prevC = prevQ = null; }
    else if (C === 'C') { const a = [n(), n()], b = [n(), n()], p = [n(), n()]; const o = rel ? cur : [0, 0]; const c1 = [o[0] + a[0], o[1] + a[1]], c2 = [o[0] + b[0], o[1] + b[1]]; cur = [o[0] + p[0], o[1] + p[1]]; segs.push({ t: 'C', c1, c2, p: cur.slice() }); prevC = c2; prevQ = null; }
    else if (C === 'S') { const b = [n(), n()], p = [n(), n()]; const o = rel ? cur : [0, 0]; const c1 = prevC ? [2 * cur[0] - prevC[0], 2 * cur[1] - prevC[1]] : cur.slice(); const c2 = [o[0] + b[0], o[1] + b[1]]; cur = [o[0] + p[0], o[1] + p[1]]; segs.push({ t: 'C', c1, c2, p: cur.slice() }); prevC = c2; prevQ = null; }
    else if (C === 'Q') { const a = [n(), n()], p = [n(), n()]; const o = rel ? cur : [0, 0]; const c1 = [o[0] + a[0], o[1] + a[1]]; cur = [o[0] + p[0], o[1] + p[1]]; segs.push({ t: 'Q', c1, p: cur.slice() }); prevQ = c1; prevC = null; }
    else if (C === 'T') { const p = [n(), n()]; const o = rel ? cur : [0, 0]; const c1 = prevQ ? [2 * cur[0] - prevQ[0], 2 * cur[1] - prevQ[1]] : cur.slice(); cur = [o[0] + p[0], o[1] + p[1]]; segs.push({ t: 'Q', c1, p: cur.slice() }); prevQ = c1; prevC = null; }
    else if (C === 'A') { const rx = Math.abs(n()), ry = Math.abs(n()), rot = n(); const large = flag(), sweep = flag(); const x = n(), y = n(); cur = rel ? [cur[0] + x, cur[1] + y] : [x, y]; segs.push({ t: 'A', rx, ry, rot, large, sweep, p: cur.slice() }); prevC = prevQ = null; }
    else { i++; }
    if (!isNum() && i < tokens.length && !/^[A-Za-z]$/.test(tokens[i])) i++;
  }
  return segs;
}
const pt = p => `${f2(num(p[0]))} ${f2(num(p[1]))}`;
function segsToString(segs) {
  let d = '';
  for (const s of segs) {
    if (s.t === 'M' || s.t === 'L') d += `${s.t}${pt(s.p)}`;
    else if (s.t === 'C') d += `C${pt(s.c1)} ${pt(s.c2)} ${pt(s.p)}`;
    else if (s.t === 'Q') d += `Q${pt(s.c1)} ${pt(s.p)}`;
    else if (s.t === 'A') d += `A${f2(s.rx)} ${f2(s.ry)} ${f2(s.rot || 0)} ${s.large ? 1 : 0} ${s.sweep ? 1 : 0} ${pt(s.p)}`;
    else if (s.t === 'Z') d += 'Z';
  }
  return d;
}
/* endpoint arc -> centre form: { c, rx, ry, rot, a0, da } degrees */
function arcCentre(p0, s) {
  let { rx, ry } = s; const phi = (s.rot || 0) * D2R, cp = Math.cos(phi), sp = Math.sin(phi);
  const x1 = p0[0], y1 = p0[1], x2 = s.p[0], y2 = s.p[1];
  if (rx < 1e-9 || ry < 1e-9) return null;
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const sign = s.large !== s.sweep ? 1 : -1;
  const numr = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = den < 1e-12 ? 0 : sign * Math.sqrt(Math.max(0, numr / den));
  const cxp = coef * rx * y1p / ry, cyp = coef * -ry * x1p / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => { const d = ux * vx + uy * vy, l = Math.hypot(ux, uy) * Math.hypot(vx, vy); let a = Math.acos(Math.max(-1, Math.min(1, d / l))) / D2R; if (ux * vy - uy * vx < 0) a = -a; return a; };
  const a0 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let da = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!s.sweep && da > 0) da -= 360; if (s.sweep && da < 0) da += 360;
  return { c: [cx, cy], rx, ry, rot: s.rot || 0, a0, da };
}
function arcPointRot(ac, a) { const t = a * D2R, phi = ac.rot * D2R; const x = ac.rx * Math.cos(t), y = ac.ry * Math.sin(t); return [ac.c[0] + x * Math.cos(phi) - y * Math.sin(phi), ac.c[1] + x * Math.sin(phi) + y * Math.cos(phi)]; }

/* ---------- subpaths ---------- */
function subpaths(segs) {
  const out = []; let cur = null;
  for (const s of segs) {
    if (s.t === 'M') { cur = { segs: [s], closed: false }; out.push(cur); }
    else if (!cur) { cur = { segs: [{ t: 'M', p: [0, 0] }], closed: false }; out.push(cur); cur.segs.push(s); }
    else if (s.t === 'Z') { cur.closed = true; cur = null; }
    else cur.segs.push(s);
  }
  return out.filter(sp => sp.segs.length > 1 || sp.closed);
}

/* A subpath made of straight edges and quarter-circle corners becomes a poly
   whose corners follow the sliders. Anything else stays a path. */
function polyfy(sp) {
  const segs = sp.segs;
  const edges = []; // { t:'L', a, b } | { t:'A', a, b, ac }
  let prev = segs[0].p;
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    if (s.t === 'L') { if (Math.hypot(s.p[0] - prev[0], s.p[1] - prev[1]) > 1e-6) edges.push({ t: 'L', a: prev, b: s.p }); }
    else if (s.t === 'A') { const ac = arcCentre(prev, s); if (!ac) return null; edges.push({ t: 'A', a: prev, b: s.p, ac }); }
    else return null;
    prev = s.p;
  }
  const first = segs[0].p, last = prev;
  const closesItself = Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6;
  const closed = sp.closed || closesItself;
  if (closed && !closesItself) edges.push({ t: 'L', a: last, b: first });
  if (!edges.length) return null;
  const m = edges.length;
  const dir = e => norm(sub(e.b, e.a));
  // every arc must be a quarter circle flanked by tangent straights
  for (let i = 0; i < m; i++) {
    const e = edges[i]; if (e.t !== 'A') continue;
    const { ac } = e;
    if (Math.abs(ac.rx - ac.ry) > 1e-3 || Math.abs(Math.abs(ac.da) - 90) > 3 || (ac.rot || 0) !== 0) return null;
    const pe = edges[(i - 1 + m) % m], ne = edges[(i + 1) % m];
    if (!closed && (i === 0 || i === m - 1)) return null;
    if (pe.t !== 'L' || ne.t !== 'L') return null;
    const ra = norm(sub(e.a, ac.c)), rb = norm(sub(e.b, ac.c));
    const d1 = dir(pe), d2 = dir(ne);
    if (Math.abs(d1[0] * ra[0] + d1[1] * ra[1]) > 0.08 || Math.abs(d2[0] * rb[0] + d2[1] * rb[1]) > 0.08) return null;
  }
  const pts = [];
  if (!closed) pts.push([edges[0].a[0], edges[0].a[1], 'none']);
  for (let i = 0; i < m; i++) {
    const e = edges[i];
    if (e.t === 'A') { const { ac } = e; const corner = [e.a[0] + e.b[0] - ac.c[0], e.a[1] + e.b[1] - ac.c[1]]; const k = ac.rx / 2; pts.push([f2(corner[0]), f2(corner[1]), Math.abs(k - 1) < 0.01 ? 'box' : 'box:' + f2(k)]); }
    else {
      const ne = edges[(i + 1) % m];
      const isLast = !closed && i === m - 1;
      if (isLast) pts.push([e.b[0], e.b[1], 'none']);
      else if (ne.t === 'L') pts.push([e.b[0], e.b[1], 'fillet']);
      // an L followed by an A contributes the corner through the arc
    }
  }
  if (pts.length < 2) return null;
  return { t: 'poly', pts, closed };
}

/* ---------- rendering ---------- */
function arcPoint(c, rx, ry, a) { return [c[0] + rx * Math.cos(a * D2R), c[1] + ry * Math.sin(a * D2R)]; }
const arcTo = c => c.r > 0 ? `A${f2(c.r)} ${f2(c.r)} 0 0 ${c.sweep} ${pt(c.p2)}` : '';
function pathPoly(pts, closed, P) {
  if (pts.length === 1) return `M${pt(pts[0])}L${pt(pts[0])}`;
  const cs = corners(pts, closed, P);
  let d = '';
  if (closed) {
    d += `M${pt(cs[0].p2)}`;
    for (let i = 1; i < pts.length; i++) d += `L${pt(cs[i].p1)}` + arcTo(cs[i]);
    d += `L${pt(cs[0].p1)}` + arcTo(cs[0]) + 'Z';
  } else {
    d += `M${pt(pts[0])}`;
    for (let i = 1; i < pts.length - 1; i++) d += `L${pt(cs[i].p1)}` + arcTo(cs[i]);
    d += `L${pt(pts[pts.length - 1])}`;
  }
  return d;
}
function pathArc(c, rx, ry, a0, a1, withMove) {
  const total = a1 - a0;
  if (Math.abs(total) < 1e-6) return '';
  let d = withMove ? `M${pt(arcPoint(c, rx, ry, a0))}` : '';
  const sweep = total > 0 ? 1 : 0;
  if (Math.abs(total) >= 360 - 1e-6) {
    const mid = a0 + total / 2;
    d += `A${f2(rx)} ${f2(ry)} 0 1 ${sweep} ${pt(arcPoint(c, rx, ry, mid))}A${f2(rx)} ${f2(ry)} 0 1 ${sweep} ${pt(arcPoint(c, rx, ry, a1))}`;
  } else d += `A${f2(rx)} ${f2(ry)} 0 ${Math.abs(total) > 180 ? 1 : 0} ${sweep} ${pt(arcPoint(c, rx, ry, a1))}`;
  return d;
}
function pathSeq(segs) {
  let d = '', cur = null;
  for (const s of segs) {
    if (s[0] === 'M') { d += `M${pt([s[1], s[2]])}`; cur = [s[1], s[2]]; }
    else if (s[0] === 'L') { d += `L${pt([s[1], s[2]])}`; cur = [s[1], s[2]]; }
    else if (s[0] === 'A') { const [, cx, cy, rx, ry, a0, a1] = s; const start = arcPoint([cx, cy], rx, ry, a0); if (!cur) d += `M${pt(start)}`; else if (Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 0.01) d += `L${pt(start)}`; d += pathArc([cx, cy], rx, ry, a0, a1, false); cur = arcPoint([cx, cy], rx, ry, a1); }
  }
  return d;
}
function pathQuad(pts) {
  let d = `M${pt(pts[0])}`;
  for (let i = 1; i + 1 < pts.length; i += 2) d += `Q${pt(pts[i])} ${pt(pts[i + 1])}`;
  d += `Q${pt(pts[pts.length - 1])} ${pt(pts[0])}Z`;
  return d;
}
const segsOf = pr => pr.segs || (pr.segs = parsePath(pr.d || ''));
/* a path: straight runs get fillets at their interior joins */
function pathPath(pr, P) {
  let d = '';
  for (const sp of subpaths(segsOf(pr))) {
    const segs = sp.segs;
    // group into runs: each run is either a list of straight points or a single curve
    let run = [segs[0].p]; let out = ''; let started = false;
    const flush = (closing) => {
      if (run.length >= 2) {
        const pts = run.map((p, i) => [p[0], p[1], i > 0 && i < run.length - 1 ? 'fillet' : 'none']);
        const cs = corners(pts, false, P);
        if (!started) { out += `M${pt(pts[0])}`; started = true; }
        for (let i = 1; i < pts.length - 1; i++) out += `L${pt(cs[i].p1)}` + arcTo(cs[i]);
        out += `L${pt(pts[pts.length - 1])}`;
      } else if (!started) { out += `M${pt(run[0])}`; started = true; }
      run = [run[run.length - 1]];
    };
    if (sp.closed && segs.every(s => s.t === 'M' || s.t === 'L')) {
      const pts = segs.map(s => [s.p[0], s.p[1], 'fillet']);
      if (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-6) pts.pop();
      d += pathPoly(pts, true, P); continue;
    }
    for (let i = 1; i < segs.length; i++) {
      const s = segs[i];
      if (s.t === 'L') run.push(s.p);
      else {
        flush();
        if (!started) { out += `M${pt(run[0])}`; started = true; }
        if (s.t === 'C') out += `C${pt(s.c1)} ${pt(s.c2)} ${pt(s.p)}`;
        else if (s.t === 'Q') out += `Q${pt(s.c1)} ${pt(s.p)}`;
        else if (s.t === 'A') out += `A${f2(s.rx)} ${f2(s.ry)} ${f2(s.rot || 0)} ${s.large ? 1 : 0} ${s.sweep ? 1 : 0} ${pt(s.p)}`;
        run = [s.p];
      }
    }
    flush();
    d += out + (sp.closed ? 'Z' : '');
  }
  return d;
}
function pathOf(pr, P) {
  switch (pr.t) {
    case 'poly': return pathPoly(pr.pts, !!pr.closed, P);
    case 'arc': return pathArc(pr.c, pr.rx, pr.ry, pr.a0, pr.a1, true);
    case 'seq': return pathSeq(pr.segs);
    case 'quad': return pathQuad(pr.pts);
    case 'path': return pathPath(pr, P);
    default: return '';
  }
}

/* ---------- flatten ---------- */
const STEP = 6;
function flatArc(c, rx, ry, a0, a1, out) { const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / STEP)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push(arcPoint(c, rx, ry, a)); } }
function flatFilletRun(pts, closed, P) {
  if (pts.length === 1) return [pts[0].slice(0, 2)];
  const cs = corners(pts, closed, P);
  const out = [];
  const fillet = c => {
    if (c.r <= 0) { out.push(c.p1.slice(0, 2)); return; }
    let a0 = Math.atan2(c.p1[1] - c.c[1], c.p1[0] - c.c[0]) / D2R;
    let a1 = Math.atan2(c.p2[1] - c.c[1], c.p2[0] - c.c[0]) / D2R;
    if (c.sweep === 1) { while (a1 < a0) a1 += 360; } else { while (a1 > a0) a1 -= 360; }
    flatArc(c.c, c.r, c.r, a0, a1, out);
  };
  const first = closed ? 0 : 1, last = closed ? pts.length - 1 : pts.length - 2;
  if (!closed) out.push(pts[0].slice(0, 2));
  for (let i = first; i <= last; i++) fillet(cs[i]);
  if (!closed) out.push(pts[pts.length - 1].slice(0, 2));
  return out;
}
function flatSeq(segs) {
  const runs = []; let cur = [];
  const push = () => { if (cur.length) runs.push(cur); cur = []; };
  for (const s of segs) {
    if (s[0] === 'M') { push(); cur.push([s[1], s[2]]); }
    else if (s[0] === 'L') cur.push([s[1], s[2]]);
    else if (s[0] === 'A') { const [, cx, cy, rx, ry, a0, a1] = s; const tmp = []; flatArc([cx, cy], rx, ry, a0, a1, tmp); if (cur.length && Math.hypot(cur[cur.length - 1][0] - tmp[0][0], cur[cur.length - 1][1] - tmp[0][1]) < 0.01) tmp.shift(); cur.push(...tmp); }
  }
  push();
  return runs;
}
function flatQuad(pts) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i += 2) { const p0 = pts[i], c = pts[(i + 1) % n], p1 = pts[(i + 2) % n]; for (let k = 0; k < 10; k++) { const t = k / 10, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } }
  return out;
}
function flatPath(pr, P) {
  const parts = [];
  for (const sp of subpaths(segsOf(pr))) {
    const segs = sp.segs;
    if (sp.closed && segs.every(s => s.t === 'M' || s.t === 'L')) {
      const pts = segs.map(s => [s.p[0], s.p[1], 'fillet']);
      if (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-6) pts.pop();
      parts.push({ closed: true, pts: flatFilletRun(pts, true, P) }); continue;
    }
    const out = []; let run = [segs[0].p];
    const flush = () => {
      if (run.length >= 2) { const pts = run.map((p, i) => [p[0], p[1], i > 0 && i < run.length - 1 ? 'fillet' : 'none']); const f = flatFilletRun(pts, false, P); if (out.length) f.shift(); out.push(...f); }
      else if (!out.length) out.push(run[0].slice());
      run = [run[run.length - 1]];
    };
    for (let i = 1; i < segs.length; i++) {
      const s = segs[i];
      if (s.t === 'L') { run.push(s.p); continue; }
      flush();
      const p0 = run[0];
      if (s.t === 'C') { for (let k = 1; k <= 12; k++) { const t = k / 12, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * s.c1[0] + 3 * u * t * t * s.c2[0] + t * t * t * s.p[0], u * u * u * p0[1] + 3 * u * u * t * s.c1[1] + 3 * u * t * t * s.c2[1] + t * t * t * s.p[1]]); } }
      else if (s.t === 'Q') { for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * s.c1[0] + t * t * s.p[0], u * u * p0[1] + 2 * u * t * s.c1[1] + t * t * s.p[1]]); } }
      else if (s.t === 'A') { const ac = arcCentre(p0, s); if (ac) { const n = Math.max(2, Math.ceil(Math.abs(ac.da) / STEP)); for (let k = 1; k <= n; k++) out.push(arcPointRot(ac, ac.a0 + ac.da * k / n)); } else out.push(s.p.slice()); }
      run = [s.p];
    }
    flush();
    parts.push({ closed: sp.closed, pts: out });
  }
  return parts;
}
function flatten(pr, P) {
  switch (pr.t) {
    case 'poly': return [{ closed: !!pr.closed, pts: flatFilletRun(pr.pts, !!pr.closed, P) }];
    case 'arc': { const out = []; flatArc(pr.c, pr.rx, pr.ry, pr.a0, pr.a1, out); const full = Math.abs(pr.a1 - pr.a0) >= 360 - 1e-6; if (full) out.pop(); return [{ closed: full, pts: out }]; }
    case 'seq': return flatSeq(pr.segs).map(pts => ({ closed: false, pts }));
    case 'quad': return [{ closed: true, pts: flatQuad(pr.pts) }];
    case 'path': return flatPath(pr, P);
    default: return [];
  }
}

/* ---------- roles for the solid weight ---------- */
function isClosed(pr) {
  if (pr.t === 'poly') return !!pr.closed;
  if (pr.t === 'arc') return Math.abs(pr.a1 - pr.a0) >= 360 - 1e-6;
  if (pr.t === 'quad') return true;
  if (pr.t === 'path') { const sps = subpaths(segsOf(pr)); return sps.length > 0 && sps.every(sp => { if (sp.closed) return true; const a = sp.segs[0].p, b = sp.segs[sp.segs.length - 1].p; return Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6; }); }
  return false;
}
function bbox(pr, P) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const part of flatten(pr, P || DEF)) for (const p of part.pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  return [x0, y0, x1, y1];
}
/* closed shapes are 'shape'; anything sitting inside a closed shape is a
   'detail' (a cut in the solid); the rest are strokes */
function autoRoles(prims, P) {
  const info = prims.map(pr => ({ pr, closed: isClosed(pr) && !(pr.alpha != null && pr.alpha < 1), bb: bbox(pr, P) }));
  const inside = (a, b, tol = 0.6) => a.bb[0] >= b.bb[0] - tol && a.bb[1] >= b.bb[1] - tol && a.bb[2] <= b.bb[2] + tol && a.bb[3] <= b.bb[3] + tol && ((a.bb[2] - a.bb[0]) * (a.bb[3] - a.bb[1]) < (b.bb[2] - b.bb[0]) * (b.bb[3] - b.bb[1]) - 0.5);
  return prims.map((pr, i) => {
    if (pr.role && pr.roleLocked) return pr.role;
    if (pr.role === 'flat' || pr.role === 'fill' || pr.role === 'cut' || pr.role === 'knock') return pr.role;
    const me = info[i];
    if (pr.alpha != null && pr.alpha < 1) return 'stroke';
    const host = info.some((o, j) => j !== i && o.closed && inside(me, o));
    if (host) return 'detail';
    return me.closed ? 'shape' : 'stroke';
  });
}

/* ---------- SVG ---------- */
const widths = P => ({ w: Math.max(0.2, P.S + 2 * (P.choke || 0)), wCut: Math.max(0.2, P.S - 2 * (P.choke || 0)) });
function svgInner(prims, P, opts = {}) {
  const { w, wCut } = widths(P);
  const id = opts.uid || 'g';
  const solid = (opts.weight || P.weight) === 'solid';
  const roles = opts.roles || autoRoles(prims, P);
  const STROKE = `fill="none" stroke="currentColor" stroke-width="${f2(w)}" stroke-linecap="round" stroke-linejoin="round"`;
  const FILL = `fill="currentColor" stroke="currentColor" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="round"`;
  const CUT = `fill="none" stroke="#000" stroke-width="${f2(wCut)}" stroke-linecap="round" stroke-linejoin="round"`;
  const strokes = [], fills = [], flats = [], cuts = [], knocks = [], shapes = [], faint = [];
  prims.forEach((pr, i) => {
    const d = pathOf(pr, P); if (!d) return;
    const role = roles[i];
    const a = pr.alpha != null ? pr.alpha : 1;
    if (a < 1) { // a translucent part draws on its own, above the mask, in the outline style it was drawn in
      const attrs = role === 'flat' || role === 'fill' ? `fill="currentColor" fill-rule="${pr.evenodd ? 'evenodd' : 'nonzero'}"` : STROKE;
      faint.push(`<path d="${d}" ${attrs} opacity="${f2(a)}"/>`); return;
    }
    if (role === 'fill') fills.push(d);
    else if (role === 'flat') flats.push(`<path d="${d}" fill="currentColor" fill-rule="${pr.evenodd ? 'evenodd' : 'nonzero'}"/>`);
    else if (role === 'cut') cuts.push(d);
    else if (role === 'knock') knocks.push(d);
    else if (!solid) strokes.push(d);
    else if (role === 'shape') shapes.push(d);
    else if (role === 'detail') cuts.push(pr.cut ? pathOf(pr.cut, P) : d);
    else strokes.push(d);
  });
  let body = '';
  if (solid && shapes.length) body += `<path d="${shapes.join('')}" ${FILL}/>`;
  if (fills.length) body += `<path d="${fills.join('')}" ${FILL}/>`;
  body += flats.join('');
  let out = '';
  if (body && (cuts.length || knocks.length)) {
    out += `<mask id="cut-${id}"><rect x="-4" y="-4" width="32" height="32" fill="#fff"/>${cuts.length ? `<path d="${cuts.join('')}" ${CUT}/>` : ''}${knocks.length ? `<path d="${knocks.join('')}" fill="#000"/>` : ''}</mask><g mask="url(#cut-${id})">${body}</g>`;
  } else out += body;
  if (strokes.length) out += `<path d="${strokes.join('')}" ${STROKE}/>`;
  out += faint.join('');
  return out;
}
function gooFilter(P, id) {
  if (!(P.goo > 0)) return '';
  return `<filter id="goo-${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${f2(P.goo)}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -9"/></filter>`;
}
function svg(prims, P, opts = {}) {
  const id = opts.uid || 'g', size = opts.size || 24;
  const inner = svgInner(prims, P, opts);
  const goo = gooFilter(P, id);
  const body = goo ? `<defs>${goo}</defs><g filter="url(#goo-${id})">${inner}</g>` : inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width || size}" height="${opts.height || size}" viewBox="${opts.viewBox || '0 0 24 24'}"${opts.attrs ? ' ' + opts.attrs : ''}>${body}</svg>`;
}
/* a symbol for a sprite */
function symbol(id, prims, P, opts = {}) {
  const inner = svgInner(prims, P, { ...opts, uid: id });
  return `<symbol id="${id}" viewBox="0 0 24 24">${inner}</symbol>`;
}

/* ---------- converters: SVG element nodes -> primitives ---------- */
const numAttr = (a, k, dflt = 0) => { const v = parseFloat(a[k]); return Number.isFinite(v) ? v : dflt; };
function fromNodes(nodes, hints = {}) {
  const prims = [];
  for (const [tag, a] of nodes) {
    const filled = a.fill && a.fill !== 'none' && !hints.ignoreFill;
    const role = filled ? 'flat' : undefined;
    const alpha = ['opacity', filled ? 'fill-opacity' : 'stroke-opacity'].reduce((v, k) => v * (a[k] != null && Number.isFinite(parseFloat(a[k])) ? parseFloat(a[k]) : 1), 1);
    const add = pr => { if (role) pr.role = role; if (alpha < 1) pr.alpha = f2(alpha); prims.push(pr); };
    if (tag === 'path') {
      const segs = parsePath(a.d || '');
      if (filled) { const pr = { t: 'path', d: segsToString(segs) }; if (a['fill-rule'] === 'evenodd') pr.evenodd = true; add(pr); }
      else for (const sp of subpaths(segs)) {
        const poly = polyfy(sp);
        if (poly) add(poly);
        else { const s = sp.segs.slice(); if (sp.closed) s.push({ t: 'Z' }); add({ t: 'path', d: segsToString(s) }); }
      }
    } else if (tag === 'circle') add({ t: 'arc', c: [numAttr(a, 'cx'), numAttr(a, 'cy')], rx: numAttr(a, 'r'), ry: numAttr(a, 'r'), a0: 0, a1: 360 });
    else if (tag === 'ellipse') add({ t: 'arc', c: [numAttr(a, 'cx'), numAttr(a, 'cy')], rx: numAttr(a, 'rx'), ry: numAttr(a, 'ry'), a0: 0, a1: 360 });
    else if (tag === 'rect') {
      const x = numAttr(a, 'x'), y = numAttr(a, 'y'), w = numAttr(a, 'width'), h = numAttr(a, 'height');
      const rx = numAttr(a, 'rx', numAttr(a, 'ry', 0));
      const k = rx <= 0 ? 'fillet' : Math.abs(rx / 2 - 1) < 0.01 ? 'box' : 'box:' + f2(rx / 2);
      let pts = [[x, y, k], [x + w, y, k], [x + w, y + h, k], [x, y + h, k]];
      const m = a.transform && a.transform.match(/rotate\(\s*(-?[\d.]+)(?:[ ,]+(-?[\d.]+)[ ,]+(-?[\d.]+))?\s*\)/);
      if (m) { const ang = parseFloat(m[1]) * D2R, cx = m[2] != null ? parseFloat(m[2]) : x + w / 2, cy = m[3] != null ? parseFloat(m[3]) : y + h / 2; pts = pts.map(p => [f2(cx + (p[0] - cx) * Math.cos(ang) - (p[1] - cy) * Math.sin(ang)), f2(cy + (p[0] - cx) * Math.sin(ang) + (p[1] - cy) * Math.cos(ang)), p[2]]); }
      add({ t: 'poly', pts, closed: true });
    } else if (tag === 'line') add({ t: 'poly', pts: [[numAttr(a, 'x1'), numAttr(a, 'y1')], [numAttr(a, 'x2'), numAttr(a, 'y2')]] });
    else if (tag === 'polyline' || tag === 'polygon') {
      const nums = (a.points || '').match(/-?(?:\d+\.?\d*|\.\d+)/g) || [];
      const pts = []; for (let i = 0; i + 1 < nums.length; i += 2) pts.push([parseFloat(nums[i]), parseFloat(nums[i + 1]), 'fillet']);
      if (pts.length) { pts[0][2] = tag === 'polygon' ? 'fillet' : 'none'; pts[pts.length - 1][2] = tag === 'polygon' ? 'fillet' : 'none'; add({ t: 'poly', pts, closed: tag === 'polygon' }); }
    }
  }
  return prims;
}

/* ---------- outlines through Clipper, glyphs through opentype ---------- */
const SC = 1000;
function outline(prims, P, weight, CL, roles) {
  const { w, wCut } = widths(P);
  const solid = weight === 'solid';
  const R = roles || autoRoles(prims, P);
  const toIP = pts => pts.map(p => ({ X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }));
  const body = new CL.ClipperOffset(2, 0.03 * SC), cutter = new CL.ClipperOffset(2, 0.03 * SC);
  const flat = new CL.Paths(), knock = new CL.Paths();
  let hasBody = false, hasCut = false, hasFlat = false, hasKnock = false;
  prims.forEach((pr, i) => {
    const role = R[i];
    if (pr.alpha != null && pr.alpha < 0.5) return;
    const parts = flatten(pr, P);
    const addStroke = (part, co) => { if (part.pts.length) co.AddPath(toIP(part.pts), CL.JoinType.jtRound, part.closed ? CL.EndType.etClosedLine : CL.EndType.etOpenRound); };
    const addPolygon = part => { if (part.pts.length < 3) return; let ip = toIP(part.pts); if (!CL.Clipper.Orientation(ip)) ip.reverse(); body.AddPath(ip, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); };
    if (role === 'fill') { for (const part of parts) addPolygon(part); hasBody = true; }
    else if (role === 'flat') { const c = new CL.Clipper(); let any = false; for (const part of parts) { if (part.pts.length >= 3) { c.AddPath(toIP(part.pts), CL.PolyType.ptSubject, true); any = true; } } if (any) { const u = new CL.Paths(); const ft = pr.evenodd ? CL.PolyFillType.pftEvenOdd : CL.PolyFillType.pftNonZero; c.Execute(CL.ClipType.ctUnion, u, ft, ft); for (const q of u) flat.push(q); hasFlat = true; } }
    else if (role === 'knock') { for (const part of parts) { if (part.pts.length >= 3) { knock.push(toIP(part.pts)); hasKnock = true; } } }
    else if (role === 'cut') { for (const part of parts) addStroke(part, cutter); hasCut = true; }
    else if (solid && role === 'shape') { for (const part of parts) addPolygon(part); hasBody = true; }
    else if (solid && role === 'detail') { const cp = pr.cut ? flatten(pr.cut, P) : parts; for (const part of cp) addStroke(part, cutter); hasCut = true; }
    else { for (const part of parts) addStroke(part, body); hasBody = true; }
  });
  let union = new CL.Paths();
  if (hasBody) {
    const grown = new CL.Paths(); body.Execute(grown, (w / 2) * SC);
    const c = new CL.Clipper(); c.AddPaths(grown, CL.PolyType.ptSubject, true);
    c.Execute(CL.ClipType.ctUnion, union, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  }
  if (hasFlat) {
    const c = new CL.Clipper(); c.AddPaths(union, CL.PolyType.ptSubject, true); c.AddPaths(flat, CL.PolyType.ptClip, true);
    const u = new CL.Paths(); c.Execute(CL.ClipType.ctUnion, u, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); union = u;
  }
  if (!hasCut && !hasKnock) return union;
  const cuts = new CL.Paths(); if (hasCut) cutter.Execute(cuts, (wCut / 2) * SC);
  const c2 = new CL.Clipper(); c2.AddPaths(union, CL.PolyType.ptSubject, true); if (hasCut) c2.AddPaths(cuts, CL.PolyType.ptClip, true); if (hasKnock) c2.AddPaths(knock, CL.PolyType.ptClip, true);
  const out = new CL.Paths(); c2.Execute(CL.ClipType.ctDifference, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  return out;
}
const BASE = 21;
function fontPath(paths, ot) {
  const k = 1000 / 24 / SC;
  const p = new ot.Path();
  for (const poly of paths) {
    if (poly.length < 3) continue;
    poly.forEach((q, i) => { const x = Math.round(q.X * k), y = Math.round((BASE * SC - q.Y) * k); if (i === 0) p.moveTo(x, y); else p.lineTo(x, y); });
    p.close();
  }
  return p;
}
/* entries: [{ name, prims, roles? }] -> opentype Font; icons sit at U+E000 upward in order */
function buildFont(P, entries, opts, CL, ot) {
  const weight = opts.weight || P.weight;
  const list = [new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: 500, path: new ot.Path() })];
  const map = [];
  entries.forEach((e, i) => {
    const paths = outline(e.prims, P, weight, CL, e.roles);
    const cp = 0xE000 + i;
    map.push({ name: e.name, cp });
    list.push(new ot.Glyph({ name: e.name.replace(/[^A-Za-z0-9._-]/g, '_'), unicode: cp, advanceWidth: 1000, path: fontPath(paths, ot) }));
  });
  const font = new ot.Font({ familyName: opts.family || 'Beetle Glyphs', styleName: weight === 'solid' ? 'Solid' : 'Outline', unitsPerEm: 1000, ascender: 800, descender: -200, glyphs: list });
  return { font, map };
}

/* ---------- the app's own parametric icons ---------- */
const ICONS = {
  card: { name: 'Card', make: P => { const s = P.S, h = s / 2, y = 4 + 2.5 * s; return [
    { role: 'shape', t: 'poly', closed: true, pts: [[2 + h, 4 + h, 'box'], [22 - h, 4 + h, 'box'], [22 - h, 20 - h, 'box'], [2 + h, 20 - h, 'box']] },
    { role: 'detail', t: 'poly', pts: [[2 + h, y], [22 - h, y]], cut: { t: 'poly', pts: [[0, y], [24, y]] } } ]; } },
  home: { name: 'Home', make: P => { const h = P.S / 2; return [
    { role: 'shape', t: 'poly', closed: true, pts: [[12, 2 + h], [20.75 - h, 10.75], [20.75 - h, 22 - h, 'box'], [3.25 + h, 22 - h, 'box'], [3.25 + h, 10.75]] },
    { role: 'detail', t: 'poly', pts: [[12, 22 - h], [12, 16.5 - h]], cut: { t: 'poly', pts: [[12, 24], [12, 16.5 - h]] } } ]; } },
  bag: { name: 'Bag', make: P => { const h = P.S / 2; return [
    { role: 'shape', t: 'poly', closed: true, pts: [[3 + h, 8.25, 'soft'], [21 - h, 8.25, 'soft'], [19.5 - h, 22 - h, 'box'], [4.5 + h, 22 - h, 'box']] },
    { role: 'stroke', t: 'poly', pts: [[8.75, 8.25], [8.75, 3.25 + h + 2, 3.25], [15.25, 3.25 + h + 2, 3.25], [15.25, 8.25]] } ]; } },
  search: { name: 'Search', make: P => { const s = P.S, h = s / 2, g = P.G * s, k = Math.SQRT1_2; const c = 10.25, d0 = (8 + g + h) * k, e = 22 - h * k; return [
    { role: 'shape', t: 'arc', c: [c, c], rx: 8 - h, ry: 8 - h, a0: 0, a1: 360 },
    { role: 'stroke', t: 'poly', pts: [[c + d0, c + d0], [e, e]] } ]; } },
  target: { name: 'Target', shared: true, make: P => { const s = P.S, h = s / 2, g = P.G * s; const phi = Math.asin(Math.min(0.9, (h + g) / 8)) / D2R; const out = [];
    for (let q = 0; q < 4; q++) out.push({ role: 'stroke', t: 'arc', c: [12, 12], rx: 8, ry: 8, a0: q * 90 + phi, a1: (q + 1) * 90 - phi });
    out.push({ role: 'stroke', t: 'poly', pts: [[12, 2.25], [12, 7.5]] }, { role: 'stroke', t: 'poly', pts: [[12, 16.5], [12, 21.75]] }, { role: 'stroke', t: 'poly', pts: [[2.25, 12], [7.5, 12]] }, { role: 'stroke', t: 'poly', pts: [[16.5, 12], [21.75, 12]] });
    return out; } },
  globe: { name: 'Globe', make: P => { const s = P.S, h = s / 2, R = 11 - h, rin = 11 - s, q = rin - h, ry = R, rx = 4.5; const t0 = Math.asin(Math.min(1, q / ry)) / D2R; return [
    { role: 'shape', t: 'arc', c: [12, 12], rx: R, ry: R, a0: 0, a1: 360 },
    { role: 'detail', t: 'arc', c: [12, 12], rx, ry, a0: 0, a1: 360, cut: { t: 'seq', segs: [['A', 12, 12, rx, ry, 180 + t0, 180 - t0], ['A', 12, 12, rx, ry, -t0, t0]] } },
    { role: 'detail', t: 'poly', pts: [[1 + h, 12], [23 - h, 12]], cut: { t: 'poly', pts: [[12 - q, 12], [12 + q, 12]] } } ]; } },
  send: { name: 'Send', make: P => { const h = P.S / 2; return [
    { role: 'shape', t: 'poly', closed: true, pts: [[12, 2 + h], [20, 22 - h], [12, 16], [4, 22 - h]] } ]; } },
  person: { name: 'Person', make: P => { const s = P.S, h = s / 2, g = P.G * s, yb = 10.5 + g + h; return [
    { role: 'shape', t: 'poly', closed: true, pts: [[9, 2 + h, 2.25], [15, 2 + h, 2.25], [15, 10.5 - h, 2.25], [9, 10.5 - h, 2.25]] },
    { role: 'shape', t: 'poly', closed: true, pts: [[9.25, yb, 'soft'], [14.75, yb, 'soft'], [21.75 - h, 22 - h, 'box'], [2.25 + h, 22 - h, 'box']] } ]; } },
  star: { name: 'Star', shared: true, make: P => { const h = P.S / 2, r = 10 - h, k = 2.1; return [
    { role: 'fill', t: 'quad', pts: [[12, 12 - r], [12 + k, 12 - k], [12 + r, 12], [12 + k, 12 + k], [12, 12 + r], [12 - k, 12 + k], [12 - r, 12], [12 - k, 12 - k]] } ]; } },
  plus: { name: 'Plus', shared: true, make: P => { const h = P.S / 2; return [
    { role: 'stroke', t: 'poly', pts: [[12, 2 + h], [12, 22 - h]] }, { role: 'stroke', t: 'poly', pts: [[2 + h, 12], [22 - h, 12]] },
    { role: 'flat', t: 'quad', pts: [[12, 7], [12.9, 11.1], [17, 12], [12.9, 12.9], [12, 17], [11.1, 12.9], [7, 12], [11.1, 11.1]] } ]; } },
  arrow: { name: 'Arrow', shared: true, make: P => [
    { role: 'stroke', t: 'poly', pts: [[4.5, 19.5], [18, 6]] }, { role: 'stroke', t: 'poly', pts: [[8.5, 6], [18, 6], [18, 15.5]] } ] },
  naira: { name: 'Naira', shared: true, make: P => { const h = P.S / 2; return [
    { role: 'stroke', t: 'poly', pts: [[6.5, 21 - h], [6.5, 3 + h], [17.5, 21 - h], [17.5, 3 + h]] },
    { role: 'stroke', t: 'poly', pts: [[3 + h, 9.5], [21 - h, 9.5]] }, { role: 'stroke', t: 'poly', pts: [[3 + h, 14.5], [21 - h, 14.5]] } ]; } },
};
const ICON_ORDER = ['card', 'home', 'bag', 'search', 'globe', 'send', 'person', 'target', 'star', 'plus', 'arrow', 'naira'];

export { DEF, PRESETS, ICONS, ICON_ORDER, BASE, corners, radiusOf, parsePath, segsToString, subpaths, polyfy, arcCentre, pathOf, flatten, isClosed, bbox, autoRoles, svg, svgInner, symbol, gooFilter, widths, fromNodes, outline, buildFont, f2 };
