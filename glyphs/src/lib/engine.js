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
  Roles: stroke | shape | detail | fill | flat.
  Styles (P.weight): outline (stroke) | two-tone | duotone | solid (fill). An
  icon drawn in a style of its own (n on every part) is drawn as it was drawn;
  every other icon derives the style from its centrelines.
  Corners (P.corners): rounded | sharp. Sharp squares every corner kind and
  draws butt ends. A part marked x keeps its corners exactly as drawn. */

const DEF = { S: 2.5, R: 2, G: 0.75, choke: 0, goo: 0, fillet: 0.5, weight: 'outline', corners: 'rounded' };
const WEIGHTS = ['outline', 'two-tone', 'duotone', 'solid'];
const TONE = 0.4; // the plate under a two-tone line, the body of a duotone
const PRESETS = {
  beetle: { S: 2.5, R: 2, G: 0.75, choke: 0, goo: 0, fillet: 0.5 },
  core: { S: 2, R: 1.5, G: 0.75, choke: 0, goo: 0, fillet: 0 },
};
const D2R = Math.PI / 180;
const f2 = v => Math.round(v * 100) / 100;
const f4 = v => Math.round(v * 10000) / 10000; // an imported drawing keeps its designers' precision
const num = v => (Object.is(v, -0) ? 0 : v);

/* ---------- corners ---------- */
function radiusOf(k, P) {
  if (k == null || k === 'none') return 0;
  if (typeof k === 'number') return k;
  if (P.corners === 'sharp') return 0;
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
    /* a fillet rounds a join, it does not cut a sharp tip off: the tip of an
       acute corner moves in by at most half a stroke (a bolt keeps its length) */
    let rr = r0;
    if (V[2] === 'fillet' || V[2] === 'letter') { const k = 1 / Math.sin(th / 2) - 1; if (k > 1e-6) rr = Math.min(r0, 0.5 * P.S / k); }
    let t = rr / Math.tan(th / 2);
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
const pt = (p, q = f2) => `${q(num(p[0]))} ${q(num(p[1]))}`;
function segsToString(segs, q = f2) {
  let d = '';
  for (const s of segs) {
    if (s.t === 'M' || s.t === 'L') d += `${s.t}${pt(s.p, q)}`;
    else if (s.t === 'C') d += `C${pt(s.c1, q)} ${pt(s.c2, q)} ${pt(s.p, q)}`;
    else if (s.t === 'Q') d += `Q${pt(s.c1, q)} ${pt(s.p, q)}`;
    else if (s.t === 'A') d += `A${q(s.rx)} ${q(s.ry)} ${q(s.rot || 0)} ${s.large ? 1 : 0} ${s.sweep ? 1 : 0} ${pt(s.p, q)}`;
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
/* a command straight after Z starts a new subpath where the closed one began,
   as SVG draws it ("…1-1za2.4 2.4 0 01…"), not at the origin */
function subpaths(segs) {
  const out = []; let cur = null, start = [0, 0];
  for (const s of segs) {
    if (s.t === 'M') { cur = { segs: [s], closed: false }; start = s.p; out.push(cur); }
    else if (s.t === 'Z') { if (cur) cur.closed = true; cur = null; }
    else { if (!cur) { cur = { segs: [{ t: 'M', p: start.slice() }], closed: false }; out.push(cur); } cur.segs.push(s); }
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
  if (pr.x) return segsToString(segsOf(pr), f4); // exact: the drawing as drawn
  const join = 'fillet';
  let d = '';
  for (const sp of subpaths(segsOf(pr))) {
    const segs = sp.segs;
    // group into runs: each run is either a list of straight points or a single curve
    let run = [segs[0].p]; let out = ''; let started = false;
    const flush = (closing) => {
      if (run.length >= 2) {
        const pts = run.map((p, i) => [p[0], p[1], i > 0 && i < run.length - 1 ? join : 'none']);
        const cs = corners(pts, false, P);
        if (!started) { out += `M${pt(pts[0])}`; started = true; }
        for (let i = 1; i < pts.length - 1; i++) out += `L${pt(cs[i].p1)}` + arcTo(cs[i]);
        out += `L${pt(pts[pts.length - 1])}`;
      } else if (!started) { out += `M${pt(run[0])}`; started = true; }
      run = [run[run.length - 1]];
    };
    if (sp.closed && segs.every(s => s.t === 'M' || s.t === 'L')) {
      const pts = segs.map(s => [s.p[0], s.p[1], join]);
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
  const join = pr.x ? 'none' : 'fillet';
  const parts = [];
  for (const sp of subpaths(segsOf(pr))) {
    const segs = sp.segs;
    if (sp.closed && segs.every(s => s.t === 'M' || s.t === 'L')) {
      const pts = segs.map(s => [s.p[0], s.p[1], join]);
      if (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-6) pts.pop();
      parts.push({ closed: true, pts: flatFilletRun(pts, true, P) }); continue;
    }
    const out = []; let run = [segs[0].p];
    const flush = () => {
      if (run.length >= 2) { const pts = run.map((p, i) => [p[0], p[1], i > 0 && i < run.length - 1 ? join : 'none']); const f = flatFilletRun(pts, false, P); if (out.length) f.shift(); out.push(...f); }
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
  /* a pill narrower than 2 S is a glyph (a digit's 0), drawn as a stroke, not a shape */
  const glyphPill = (pr, bb) => { if (pr.t !== 'poly' || !pr.closed || pr.pts.length !== 4) return false; const w = bb[2] - bb[0], h = bb[3] - bb[1], mn = Math.min(w, h), mx = Math.max(w, h); if (mn > 2 * P.S || mx < 1.3 * mn || mx > 1.75 * mn) return false; return pr.pts.every(p => typeof p[2] === 'string' && p[2].startsWith('box') && (p[2] === 'box' ? 2 : 2 * parseFloat(p[2].slice(4))) >= 0.45 * mn); };
  const info = prims.map(pr => {
    const parts = flatten(pr, P);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const part of parts) for (const p of part.pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const bb = [x0, y0, x1, y1];
    const faint = pr.alpha != null && pr.alpha < 1; const closed = isClosed(pr) && !faint && !glyphPill(pr, bb);
    const fills = !faint && (pr.role === 'flat' || pr.role === 'fill' || (closed && (!pr.role || pr.role === 'shape')));
    return { pr, closed, fills, bb, parts, shapeHost: fills && pr.role !== 'flat' && pr.role !== 'fill' };
  });
  const pip = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  /* inside the host's box, and most of its points inside the host's shape itself:
     a line that only crosses the box stays a stroke */
  const inside = (a, b, tol = 0.6) => {
    if (!(a.bb[0] >= b.bb[0] - tol && a.bb[1] >= b.bb[1] - tol && a.bb[2] <= b.bb[2] + tol && a.bb[3] <= b.bb[3] + tol && ((a.bb[2] - a.bb[0]) * (a.bb[3] - a.bb[1]) < (b.bb[2] - b.bb[0]) * (b.bb[3] - b.bb[1]) - 0.5))) return false;
    const polys = b.parts.filter(part => part.pts.length >= 3).map(part => part.pts); if (!polys.length) return false;
    let n = 0, hit = 0;
    const test = p => { n++; if (polys.some(poly => pip(p, poly))) hit++; };
    for (const part of a.parts) { // sampled along the edges, so a line that only touches the edge still counts as inside
      const pts = part.pts; if (pts.length === 1) { test(pts[0]); continue; }
      const m = part.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < m; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; const k = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.5)); for (let s = 0; s < k; s++) { const t = (s + 0.5) / k; test([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } }
    }
    return n > 0 && hit / n > 0.5;
  };
  return prims.map((pr, i) => {
    if (pr.role && pr.roleLocked) return pr.role;
    const me = info[i];
    if (pr.role === 'flat') { if (info.some((o, j) => j !== i && o.shapeHost && inside(me, o))) return 'punch'; return Math.min(me.bb[2] - me.bb[0], me.bb[3] - me.bb[1]) <= P.S ? 'fill' : 'flat'; } // a filled dot on a line shape punches a hole of its outline size; a filled dot on its own is a dot in both weights
    if (pr.role === 'fill' || pr.role === 'cut' || pr.role === 'knock' || pr.role === 'punch') return pr.role;
    if (pr.alpha != null && pr.alpha < 1) return 'stroke';
    const host = info.some((o, j) => j !== i && o.fills && inside(me, o));
    if (host) return 'detail';
    return me.closed ? 'shape' : 'stroke';
  });
}
/* shapes that partly overlap an earlier shape get a gap around them in the
   solid, the way a designer separates a stacked pair: j -> [k...] */
function halos(prims, roles, P) {
  const out = new Map();
  const bbs = prims.map((pr, i) => roles[i] === 'shape' ? bbox(pr, P) : null);
  const flats = prims.map((pr, i) => bbs[i] ? flatten(pr, P).filter(part => part.pts.length >= 3).map(part => part.pts) : null);
  const contains = (a, b, tol = 0.6) => a[0] <= b[0] + tol && a[1] <= b[1] + tol && a[2] >= b[2] - tol && a[3] >= b[3] - tol;
  const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const l2 = dx * dx + dy * dy || 1e-9; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  /* inside a polygon and further than m from its edge */
  const deepInside = (p, poly, m) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (segDist(p, a, b) < m) return false; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside; } return inside; };
  const meets = (A, B) => A.some(pa => B.some(pb => pb.some(p => deepInside(p, pa, 0.35)) || pa.some(p => deepInside(p, pb, 0.35))));
  for (let j = 0; j < prims.length; j++) {
    if (!bbs[j]) continue;
    for (let k = j + 1; k < prims.length; k++) {
      const a = bbs[j], b = bbs[k]; if (!b) continue;
      const boxes = a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;
      if (boxes && !contains(a, b) && !contains(b, a) && meets(flats[j], flats[k])) { if (!out.has(j)) out.set(j, []); out.get(j).push(k); }
    }
  }
  return out;
}

/* ---------- SVG ---------- */
const safeId = s => String(s == null ? 'g' : s).replace(/[^A-Za-z0-9_-]/g, '_');
/* a mask's region is the whole canvas: the default (a tenth round the masked
   bounding box, which leaves the stroke out) clipped the thick edge of a fill */
const MASK = 'maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32"';
const widths = P => ({ w: Math.max(0.2, P.S + 2 * (P.choke || 0)), wCut: Math.max(0.2, P.S - 2 * (P.choke || 0)) });
/* an icon drawn in a style of its own: every part carries n, and it is drawn
   the way it was drawn, fills filled and lines stroked, whatever the style */
const isNative = prims => prims.length > 0 && prims.every(pr => pr.n);
/* a subpath too short to have a direction is a dot: round in the rounded
   corners, square in the sharp ones, never a butt end that draws nothing */
const isDot = (pr, P) => { if (pr.t === 'arc' || pr.t === 'quad' || (pr.t === 'poly' && pr.closed)) return false; let l = 0; for (const part of flatten(pr, P)) { if (part.closed) return false; for (let i = 1; i < part.pts.length; i++) l += Math.hypot(part.pts[i][0] - part.pts[i - 1][0], part.pts[i][1] - part.pts[i - 1][1]); } return l < 0.1; };
/* a closed part narrower than the stroke that draws it (palette's wells, a die's
   pips at a heavy stroke): where the stroke's inner edge turns inside out, the
   browser leaves a hole in the middle, so the part is drawn instead as the area
   the stroke covers, filled. A circle is exact; any other part takes Clipper's
   offset when Clipper is there. Null when the stroke draws it whole */
function swallowed(pr, P, width) {
  if (pr.t === 'arc') {
    if (Math.abs(Math.abs(pr.a1 - pr.a0) - 360) > 1e-6 || Math.abs(pr.rx - pr.ry) > 1e-6 || width <= 2 * pr.rx) return null;
    const R = pr.rx + width / 2, [cx, cy] = pr.c;
    return `M${f2(cx - R)} ${f2(cy)}A${f2(R)} ${f2(R)} 0 1 0 ${f2(cx + R)} ${f2(cy)}A${f2(R)} ${f2(R)} 0 1 0 ${f2(cx - R)} ${f2(cy)}Z`;
  }
  if (!CLIPPER) return null;
  const parts = flatten(pr, P);
  if (!parts.length || !parts.every(p => p.closed && p.pts.length >= 3)) return null;
  const narrow = parts.some(p => { const xs = p.pts.map(q => q[0]), ys = p.pts.map(q => q[1]); return Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < width; });
  if (!narrow) return null;
  const CL = CLIPPER, co = new CL.ClipperOffset(2, 0.02 * SC), out = new CL.Paths();
  for (const p of parts) co.AddPath(p.pts.map(q => ({ X: Math.round(q[0] * SC), Y: Math.round(q[1] * SC) })), pr.join === 'miter' ? CL.JoinType.jtMiter : CL.JoinType.jtRound, CL.EndType.etClosedLine);
  co.Execute(out, (width / 2) * SC);
  return out.map(path => path.map((q, k) => `${k ? 'L' : 'M'}${f2(q.X / SC)} ${f2(q.Y / SC)}`).join('') + 'Z').join('');
}
/* ---------- the filled styles of a line icon, from its geometry ----------
   Wherever a line icon's ink closes round some space, that space is its body:
   two-tone lays a plate in it under the line, fill fills it, duotone shades it.
   A line that never reaches the body's edge (a pupil, a heart on a page) is a
   detail, and so is the deep part of a line that runs through the body (a
   globe's meridians): fill cuts the details out, duotone draws them in full.
   An icon that closes round nothing keeps its line in every style.
   The library analyses every line icon once, at build time and at the default
   parameters, and stores the result on the parts as prims.a; an icon that
   changed since (an edit, a parametric icon) is analysed when drawn. prims.a = 0
   means the parts are a designed solid and keep their own roles.
     a = { pl: [[x, y, x, y ...] ...] plates,  d: [i ...] details,  c: [[i, [x, y ...] ...] ...] cuts } */
const A_S0 = 2, A_MIN = 1.5, A_GROW = 0.75, A_TOL = 0.08;
/* Douglas-Peucker on [[x, y]...]: a plate sits under its line, so a simpler outline within A_TOL is invisible */
function simplify(pts, tol, closed) {
  if (pts.length < 4) return pts;
  if (closed) { let far = 0, fd = -1; for (let i = 1; i < pts.length; i++) { const dd = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (dd > fd) { fd = dd; far = i; } } return [...simplify(pts.slice(0, far + 1), tol, false).slice(0, -1), ...simplify([...pts.slice(far), pts[0]], tol, false).slice(0, -1)]; }
  const [a, b] = [pts[0], pts[pts.length - 1]]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-9;
  let idx = 0, dmax = 0; for (let i = 1; i < pts.length - 1; i++) { const dd = Math.abs((pts[i][0] - a[0]) * dy - (pts[i][1] - a[1]) * dx) / l; if (dd > dmax) { dmax = dd; idx = i; } }
  return dmax > tol ? [...simplify(pts.slice(0, idx + 1), tol, false).slice(0, -1), ...simplify(pts.slice(idx), tol, false)] : [a, b];
}
let CLIPPER = typeof globalThis !== 'undefined' && globalThis.ClipperLib ? globalThis.ClipperLib : null;
const useClipper = cl => { CLIPPER = cl; };
const flatD = (pts, close) => { let d = ''; for (let i = 0; i + 1 < pts.length; i += 2) d += `${i ? 'L' : 'M'}${f2(pts[i])} ${f2(pts[i + 1])}`; return d + (close ? 'Z' : ''); };
function analyse(prims, P, CL = CLIPPER, opts = {}) {
  if (!CL || !prims.length) return null;
  const toIP = pts => pts.map(p => ({ X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }));
  const flat = path => { const o = []; for (const q of simplify(path.map(q => [q.X / SC, q.Y / SC]), A_TOL, true)) o.push(f2(q[0]), f2(q[1])); return o; };
  const area = paths => Math.abs(CL.JS.AreaOfPolygons(paths)) / (SC * SC);
  const bool = (type, a, b, tree) => { const c = new CL.Clipper(); if (a.length) c.AddPaths(a, CL.PolyType.ptSubject, true); if (b && b.length) c.AddPaths(b, CL.PolyType.ptClip, true); const out = tree ? new CL.PolyTree() : new CL.Paths(); c.Execute(type, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return out; };
  const grow = (paths, d) => { const out = new CL.Paths(); if (!paths.length) return out; const co = new CL.ClipperOffset(2, 0.05 * SC); co.AddPaths(paths, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); co.Execute(out, d * SC); return out; };
  const R = autoRoles(prims, P);
  const live = prims.map(pr => !(pr.alpha != null && pr.alpha < 1));
  /* the ink of each part as the stroke style draws it, at a stroke of A_S0 */
  const inks = prims.map((pr, i) => {
    const out = new CL.Paths(); if (!live[i]) return out;
    const co = new CL.ClipperOffset(2, 0.02 * SC); let any = false;
    for (const part of flatten(pr, P)) {
      if (!part.pts.length) continue;
      if (R[i] === 'fill' && part.pts.length >= 3) { let ip = toIP(part.pts); if (!CL.Clipper.Orientation(ip)) ip.reverse(); co.AddPath(ip, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); }
      else co.AddPath(toIP(part.pts), CL.JoinType.jtRound, part.closed ? CL.EndType.etClosedLine : CL.EndType.etOpenRound);
      any = true;
    }
    if (any) co.Execute(out, (A_S0 / 2) * SC);
    return out;
  });
  const all = []; for (const k of inks) all.push(...k);
  const none = { pl: [], d: [], c: [] };
  if (!all.length) return none;
  /* an outline left open for a badge (heart-plus, bell-plus, clock-alert) closes
     across its gap, and the badge stays apart from the fill */
  const badges = new Set();
  let held0 = null; // the spaces closed before any gap is: a point in one is held
  const held = (x, y) => {
    if (!held0) { held0 = []; const t0 = bool(CL.ClipType.ctUnion, all, null, true); const w = n => { for (const ch of n.Childs()) { if (ch.IsHole() && area([ch.Contour()]) >= A_MIN) held0.push(ch.Contour().map(q => [q.X / SC, q.Y / SC])); w(ch); } }; w(t0); }
    let c = false; for (const poly of held0) for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) { const a = poly[k], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
    return c;
  };
  for (const [a, b, j] of opts.gaps === false ? [] : gapsClosed(prims, P, R, live, p => held(p[0], p[1]))) {
    for (const k of j) badges.add(k);
    const co = new CL.ClipperOffset(2, 0.02 * SC), out = new CL.Paths();
    co.AddPath(toIP([a, b]), CL.JoinType.jtRound, CL.EndType.etOpenRound); co.Execute(out, (A_S0 / 2) * SC); all.push(...out);
  }
  const tree = bool(CL.ClipType.ctUnion, all, null, true);
  const holes = [], outers = [];
  const walk = n => { for (const ch of n.Childs()) { (ch.IsHole() ? holes : outers).push(ch.Contour()); walk(ch); } };
  walk(tree);
  const big = holes.filter(h => area([h]) >= A_MIN);
  if (!big.length) return none;
  const plates = grow(big.map(h => h.slice().reverse()), A_GROW); // out to just short of the centrelines around them
  const sil = bool(CL.ClipType.ctUnion, outers);
  const deep = grow(sil, -A_S0);
  const band = bool(CL.ClipType.ctDifference, sil, deep);
  /* the deep part of a line, found by walking it in small steps (Clipper's own
     clipping of open lines can loop forever on some inputs, heart-pulse among them) */
  const deepPolys = deep.map(path => path.map(q => [q.X / SC, q.Y / SC]));
  const isDeep = (x, y) => { let inside = false; for (const poly of deepPolys) for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) { const a = poly[k], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside; } return inside; };
  const runLen = run => { let l = 0; for (let k = 1; k < run.length; k++) l += Math.hypot(run[k][0] - run[k - 1][0], run[k][1] - run[k - 1][1]); return l; };
  const deepRuns = pts => {
    const runs = []; let cur = null;
    /* every inside sample extends the run; a vertex stays as a point, and the last
       sample before the line leaves is the run's end */
    const visit = (x, y, vertex) => {
      if (isDeep(x, y)) {
        if (!cur) { cur = { pts: [[x, y]], last: null }; runs.push(cur); }
        else if (vertex) { cur.pts.push([x, y]); cur.last = null; }
        else cur.last = [x, y];
      } else if (cur) { if (cur.last) cur.pts.push(cur.last); cur = null; }
    };
    for (let k = 0; k + 1 < pts.length; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.1));
      for (let s = 0; s < n; s++) visit(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, s === 0);
    }
    if (pts.length) visit(pts[pts.length - 1][0], pts[pts.length - 1][1], true);
    return runs.map(r => r.pts).filter(r => r.length > 1 && runLen(r) > 0.6);
  };
  const d = [], c = [];
  prims.forEach((pr, i) => {
    if (!inks[i].length || badges.has(i)) return;
    const a = area(inks[i]); if (a < 1e-6) return;
    if (area(bool(CL.ClipType.ctIntersection, inks[i], band)) < 0.04 * a) { d.push(i); return; } // an island: it never reaches the edge
    if (R[i] === 'fill') return;
    const runs = [];
    for (const part of flatten(pr, P)) if (part.pts.length > 1) runs.push(...deepRuns(part.closed ? [...part.pts, part.pts[0]] : part.pts));
    if (runs.reduce((l, r) => l + runLen(r), 0) > 1.2) c.push([i, ...runs.map(r => simplify(r, 0.03, false).flatMap(p => [f2(p[0]), f2(p[1])]))]);
  });
  const res = { pl: plates.map(flat), d, c };
  if (badges.size) res.b = [...badges].sort((x, y) => x - y);
  return res;
}
/* the gaps an open outline leaves for a badge: the outline runs most of the way
   round (its ends closer than 0.45 of its length), and every part that sits in
   the gap (within reach of the middle of the line across it, or crossing it, and
   not merely joined at an end), with all that touches it, reaches no more than
   3.5 into what the closed outline holds and is short beside the outline; and
   nothing meets the outline's ends. An outline whose gap is empty
   (rotate-ccw, lightbulb) or holds something that runs on inside (power,
   circle-check-big) stays open */
function gapsClosed(prims, P, R, live, held) {
  const parts = prims.map((pr, i) => (live[i] ? flatten(pr, P).filter(p => p.pts.length) : []));
  const sample = i => { const o = []; for (const part of parts[i]) { const pts = part.closed ? [...part.pts, part.pts[0]] : part.pts; if (pts.length === 1) o.push(pts[0]); for (let k = 0; k + 1 < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25)); for (let q = 0; q <= n; q++) o.push([x0 + (x1 - x0) * q / n, y0 + (y1 - y0) * q / n]); } } return o; };
  const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1e-9))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const inside = (p, poly) => { let c = false; for (let k = 0, j = poly.length - 1; k < poly.length; j = k++) { const a = poly[k], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const len = pts => { let l = 0; for (let k = 1; k < pts.length; k++) l += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); return l; };
  const area = pts => { let s = 0; for (let k = 0, j = pts.length - 1; k < pts.length; j = k++) s += (pts[j][0] - pts[k][0]) * (pts[j][1] + pts[k][1]); return Math.abs(s / 2); };
  const crosses = pts => {
    const X = (p, q, r, t) => { const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); return d(p, q, r) * d(p, q, t) < 0 && d(r, t, p) * d(r, t, q) < 0; };
    for (let k = 0; k + 1 < pts.length; k++) for (let j = k + 2; j + 1 < pts.length; j++) if (X(pts[k], pts[k + 1], pts[j], pts[j + 1])) return true;
    return false;
  };
  const out = [];
  prims.forEach((pr, i) => {
    if (R[i] === 'fill') return;
    for (const part of parts[i]) {
      const pts = part.pts; if (part.closed || pts.length < 3) continue;
      const a = pts[0], b = pts[pts.length - 1], chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (chord < 1.5 || chord > 0.45 * len(pts) || area(pts) < 12) continue;
      /* a line that crosses itself is a letter or a rune (ruble, lira, bluetooth),
         and one inside a space already closed is a mark within it (circle-power) */
      if (crosses(pts) || pts.filter(p => held(p)).length > 0.5 * pts.length) continue;
      const m0 = [a[0] + (b[0] - a[0]) * 0.2, a[1] + (b[1] - a[1]) * 0.2], m1 = [a[0] + (b[0] - a[0]) * 0.8, a[1] + (b[1] - a[1]) * 0.8];
      const S = prims.map((q, j) => (j === i || !parts[j].length ? null : sample(j)));
      /* a gap, not a join: nothing else meets either end (a lock's shackle, a door) */
      if (S.some(pj => pj && pj.some(p => Math.hypot(p[0] - a[0], p[1] - a[1]) < 1.5 || Math.hypot(p[0] - b[0], p[1] - b[1]) < 1.5))) continue;
      const group = new Set();
      S.forEach((pj, j) => { if (pj && pj.some(p => Math.hypot(p[0] - a[0], p[1] - a[1]) > 1.5 && Math.hypot(p[0] - b[0], p[1] - b[1]) > 1.5 && segDist(p, m0, m1) < 2)) group.add(j); });
      if (!group.size) continue;
      /* the badge is everything that touches what sits in the gap (both arms of a plus) */
      for (let grew = true; grew;) { grew = false; S.forEach((pj, j) => { if (pj && !group.has(j) && [...group].some(k => S[k].some(p => pj.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5)))) { group.add(j); grew = true; } }); }
      /* and it may reach only a little way into what the outline holds */
      const all = [...group].flatMap(j => S[j]), inn = all.filter(p => inside(p, pts));
      if (inn.length > 0.6 * all.length || inn.some(p => segDist(p, a, b) > 3.5)) continue;
      /* and a badge is small beside the outline it sits in */
      if ([...group].reduce((l, j) => l + parts[j].reduce((m, part) => m + len(part.closed ? [...part.pts, part.pts[0]] : part.pts), 0), 0) > 0.6 * len(pts)) continue;
      out.push([a, b, [...group]]);
    }
  });
  return out;
}
/* an icon's analysis: stored, worked out now for parts that changed, or none */
const analysisCache = new Map();
function analysisOf(prims, P) {
  if (prims.a !== undefined) return prims.a || null;
  if (!CLIPPER || prims.some(pr => pr.roleLocked)) return null; // roles set by hand keep the solid they describe
  const key = JSON.stringify(prims) + '|' + [P.S, P.R, P.fillet, P.corners].join();
  if (!analysisCache.has(key)) { if (analysisCache.size > 400) analysisCache.clear(); analysisCache.set(key, analyse(prims, P)); }
  return analysisCache.get(key);
}
/* for each part, whether at least half of it runs within reach of a plate's edge */
function bordering(prims, P, pl) {
  const segs = [];
  for (const p of pl) for (let k = 0, n = p.length / 2; k < n; k++) { const j = (k + 1) % n; segs.push([p[2 * k], p[2 * k + 1], p[2 * j], p[2 * j + 1]]); }
  const near = (x, y) => {
    for (const [ax, ay, bx, by] of segs) { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1e-9))); if (Math.hypot(x - ax - t * dx, y - ay - t * dy) < 0.6) return true; }
    return false;
  };
  return prims.map(pr => {
    if (pr.alpha != null && pr.alpha < 1) return true;
    let n = 0, m = 0;
    for (const part of flatten(pr, P)) {
      const pts = part.closed ? [...part.pts, part.pts[0]] : part.pts;
      for (let k = 0; k + 1 < pts.length; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], s = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25));
        for (let q = 0; q < s; q++) { m++; if (near(x0 + (x1 - x0) * q / s, y0 + (y1 - y0) * q / s)) n++; }
      }
    }
    return m === 0 || n >= 0.5 * m;
  });
}
function analysed(prims, P, opts, weight, A) {
  const { w, wCut } = widths(P);
  const id = safeId(opts.uid || 'g');
  const cap = P.corners === 'sharp' ? 'butt' : 'round';
  const R = autoRoles(prims, P);
  const line = layers(prims, P, { ...opts, roles: R, uid: id + '-l' }, 'outline'); // the line, as the stroke style draws it
  if (!A.pl.length) return line.body + line.lines + line.faint;
  /* the line of some of the parts only */
  const some = (keep, tag) => { const ps = [], rs = []; prims.forEach((pr, i) => { if (keep(i)) { ps.push(pr); rs.push(R[i]); } }); const L = layers(ps, P, { ...opts, roles: rs, uid: id + tag }, 'outline'); return L.body + L.lines; };
  const B = new Set(A.b || []);
  const ink = B.size ? some(i => !B.has(i), '-i') : line.body + line.lines;
  const badges = B.size ? some(i => B.has(i), '-b') : '';
  /* a badge in the gap of an outline keeps the gap's width clear around it */
  const haloW = w + 2 * (P.G != null ? P.G : 0.75) * P.S, haloOf = [...B].map(i => [i, swallowed(prims[i], P, haloW)]);
  const halo = B.size ? (haloOf.some(([, sw]) => !sw) ? `<path d="${haloOf.filter(([, sw]) => !sw).map(([i]) => pathOf(prims[i], P)).join('')}" fill="none" stroke="#000" stroke-width="${f2(haloW)}" stroke-linecap="${cap}" stroke-linejoin="round"/>` : '')
    + (haloOf.some(([, sw]) => sw) ? `<path d="${haloOf.filter(([, sw]) => sw).map(([, sw]) => sw).join('')}" fill="#000"/>` : '') : '';
  const plates = `<path d="${A.pl.map(p => flatD(p, true)).join('')}" fill="currentColor"/>`;
  const masked = (cut, inner, attrs = '') => cut ? `<mask id="k-${id}" ${MASK}><rect x="-4" y="-4" width="32" height="32" fill="#fff"/>${cut}</mask><g mask="url(#k-${id})"${attrs}>${inner}</g>` : attrs ? `<g${attrs}>${inner}</g>` : inner;
  const faint = ` opacity="${TONE}"`;
  if (weight === 'two-tone') return masked(halo, plates, faint) + ink + badges + line.faint;
  const detLine = [], detFill = [], detDot = [], detCut = [], detFull = [];
  for (const i of A.d) {
    const d = pathOf(prims[i], P); if (!d) continue;
    const sc = swallowed(prims[i], P, wCut), sf = swallowed(prims[i], P, w);
    if (sc || sf) { detCut.push(sc || d); detFull.push(sf || d); continue; }
    (R[i] === 'fill' ? detFill : P.corners === 'sharp' && isDot(prims[i], P) ? detDot : detLine).push(d);
  }
  for (const [, ...polys] of A.c) for (const p of polys) detLine.push(flatD(p, false));
  if (weight === 'duotone' && !detLine.length && !detFill.length && !detDot.length && !detCut.length && !B.size) {
    /* nothing inside to set apart: what runs along a plate goes faint with it and
       the rest (a handle, a tail, a mark of its own) stays in full; when every
       part runs along one, the line stays in full over the faint plate */
    const near = bordering(prims, P, A.pl);
    if (!near.some(x => !x)) return `<g${faint}>${plates}</g>` + ink + line.faint;
    return `<g${faint}>${plates}${some(i => near[i], '-n')}</g>${some(i => !near[i], '-f')}${line.faint}`;
  }
  const cut = (detLine.length ? `<path d="${detLine.join('')}" fill="none" stroke="#000" stroke-width="${f2(wCut)}" stroke-linecap="${cap}" stroke-linejoin="round"/>` : '')
    + (detFill.length ? `<path d="${detFill.join('')}" fill="#000" stroke="#000" stroke-width="${f2(wCut)}" stroke-linejoin="round"/>` : '')
    + (detDot.length ? `<path d="${detDot.join('')}" fill="none" stroke="#000" stroke-width="${f2(wCut)}" stroke-linecap="square"/>` : '')
    + (detCut.length ? `<path d="${detCut.join('')}" fill="#000"/>` : '') + halo;
  const body = masked(cut, plates + ink, weight === 'duotone' ? faint : '');
  if (weight !== 'duotone') return body + badges + line.faint;
  return body
    + (detLine.length ? `<path d="${detLine.join('')}" fill="none" stroke="currentColor" stroke-width="${f2(w)}" stroke-linecap="${cap}" stroke-linejoin="round"/>` : '')
    + (detFill.length ? `<path d="${detFill.join('')}" fill="currentColor" stroke="currentColor" stroke-width="${f2(w)}" stroke-linejoin="round"/>` : '')
    + (detDot.length ? `<path d="${detDot.join('')}" fill="none" stroke="currentColor" stroke-width="${f2(w)}" stroke-linecap="square"/>` : '')
    + (detFull.length ? `<path d="${detFull.join('')}" fill="currentColor"/>` : '')
    + badges + line.faint;
}
function svgInner(prims, P, opts = {}) {
  const weight = opts.weight || P.weight;
  if (weight !== 'outline' && !isNative(prims)) { const A = analysisOf(prims, P); if (A) return analysed(prims, P, opts, weight, A); }
  if (weight === 'two-tone' && !isNative(prims)) {
    /* the line over a plate: what the solid would fill, at TONE */
    const plate = layers(prims, P, { ...opts, uid: (opts.uid || 'g') + '-p' }, 'solid');
    return (plate.body ? `<g opacity="${TONE}">${plate.body}</g>` : '') + svgInner(prims, P, { ...opts, weight: 'outline' });
  }
  const L = layers(prims, P, opts, isNative(prims) ? 'drawn' : weight === 'solid' || weight === 'duotone' ? weight : 'outline');
  return L.body + L.lines + L.faint;
}
/* mode: outline | solid | duotone (the solid's body at TONE, its details and
   lines in full) | drawn (an icon's own drawing of the style) */
function layers(prims, P, opts, mode) {
  const { w, wCut } = widths(P);
  const id = safeId(opts.uid || 'g');
  const solid = mode !== 'outline';
  const sharp = P.corners === 'sharp';
  const cap = sharp ? 'butt' : 'round';
  const roles = opts.roles || autoRoles(prims, P);
  const STROKE = `fill="none" stroke="currentColor" stroke-width="${f2(w)}" stroke-linecap="${cap}" stroke-linejoin="round"`;
  const FILL = `fill="currentColor" stroke="currentColor" stroke-width="${f2(w)}" stroke-linejoin="round" stroke-linecap="${cap}"`;
  const CUT = `fill="none" stroke="#000" stroke-width="${f2(wCut)}" stroke-linecap="${cap}" stroke-linejoin="round"`;
  const strokes = [], dots = [], mitred = [], fills = [], flats = [], cuts = [], cutDots = [], knocks = [], punches = [], shapes = [], faint = [], haloed = [];
  const cutDiscs = [], lineDiscs = [], bodyDiscs = [];
  const cut = (pr, d) => { const sw = swallowed(pr, P, wCut); if (sw) cutDiscs.push(sw); else (sharp && isDot(pr, P) ? cutDots : cuts).push(d); }; // a butt end on a dot cuts nothing
  const H = solid && mode !== 'drawn' ? halos(prims, roles, P) : new Map();
  const ds = prims.map(pr => pathOf(pr, P));
  const strokeOf = pr => pr.join === 'miter' ? STROKE.replace('stroke-linejoin="round"', 'stroke-linejoin="miter"') : STROKE;
  const line = (pr, d) => { const sw = swallowed(pr, P, w); if (sw) lineDiscs.push(sw); else if (pr.join === 'miter') mitred.push(d); else if (sharp && isDot(pr, P)) dots.push(d); else strokes.push(d); };
  prims.forEach((pr, i) => {
    const d = ds[i]; if (!d) return;
    const role = roles[i];
    const a = pr.alpha != null ? pr.alpha : 1;
    if (a < 1) { // a translucent part draws on its own, above the mask
      const attrs = role === 'fill' || (solid && role === 'flat') ? `fill="currentColor" fill-rule="${pr.evenodd ? 'evenodd' : 'nonzero'}"` : strokeOf(pr);
      faint.push(`<path d="${d}" ${attrs} opacity="${f2(a)}"/>`); return;
    }
    if (role === 'fill') { const sw = swallowed(pr, P, w); if (sw) bodyDiscs.push(sw); else fills.push(d); }
    else if (!solid && (role === 'flat' || role === 'knock' || role === 'cut' || role === 'punch')) line(pr, d); // the outline weight of a filled glyph: its contours, stroked
    else if (role === 'flat') flats.push(`<path d="${d}" fill="currentColor" fill-rule="${pr.evenodd ? 'evenodd' : 'nonzero'}"/>`);
    else if (role === 'cut') cut(pr, d);
    else if (role === 'knock') knocks.push(d);
    else if (role === 'punch') { const sw = swallowed(pr, P, wCut); if (sw) cutDiscs.push(sw); else punches.push(d); }
    else if (!solid) line(pr, d);
    else if (role === 'shape') { if (H.has(i)) haloed.push([i, d]); else shapes.push(d); }
    else if (role === 'detail') { if (pr.cut) cut(pr.cut, pathOf(pr.cut, P)); else cut(pr, d); if (mode === 'duotone') line(pr, d); }
    else line(pr, d);
  });
  let body = '', defs = '';
  if (solid && shapes.length) body += `<path d="${shapes.join('')}" ${FILL}/>`;
  for (const [i, d] of haloed) { const gap = f2(w + 2 * (P.G != null ? P.G : 0.75) * P.S); defs += `<mask id="halo-${id}-${i}" ${MASK}><rect x="-4" y="-4" width="32" height="32" fill="#fff"/><path d="${H.get(i).map(k => ds[k]).join('')}" fill="none" stroke="#000" stroke-width="${gap}" stroke-linejoin="round" stroke-linecap="${cap}"/></mask>`; body += `<g mask="url(#halo-${id}-${i})"><path d="${d}" ${FILL}/></g>`; }
  if (fills.length) body += `<path d="${fills.join('')}" ${FILL}/>`;
  if (bodyDiscs.length) body += `<path d="${bodyDiscs.join('')}" fill="currentColor"/>`;
  body += flats.join('');
  let out = defs;
  if (body && (cuts.length || cutDots.length || cutDiscs.length || knocks.length || punches.length)) {
    out += `<mask id="cut-${id}" ${MASK}><rect x="-4" y="-4" width="32" height="32" fill="#fff"/>${cuts.length ? `<path d="${cuts.join('')}" ${CUT}/>` : ''}${cutDots.length ? `<path d="${cutDots.join('')}" ${CUT.replace('stroke-linecap="butt"', 'stroke-linecap="square"')}/>` : ''}${cutDiscs.length ? `<path d="${cutDiscs.join('')}" fill="#000"/>` : ''}${knocks.length ? `<path d="${knocks.join('')}" fill="#000"/>` : ''}${punches.length ? `<path d="${punches.join('')}" fill="#000" stroke="#000" stroke-width="${f2(wCut)}" stroke-linejoin="round"/>` : ''}</mask><g mask="url(#cut-${id})">${body}</g>`;
  } else out += body;
  if (mode === 'duotone' && out) out = `<g opacity="${TONE}">${out}</g>`;
  let lines = '';
  if (strokes.length) lines += `<path d="${strokes.join('')}" ${STROKE}/>`;
  if (mitred.length) lines += `<path d="${mitred.join('')}" ${strokeOf({ join: 'miter' })}/>`;
  if (dots.length) lines += `<path d="${dots.join('')}" ${STROKE.replace('stroke-linecap="butt"', 'stroke-linecap="square"')}/>`;
  if (lineDiscs.length) lines += `<path d="${lineDiscs.join('')}" fill="currentColor"/>`;
  return { body: out, lines, faint: faint.length ? `<g class="faint">${faint.join('')}</g>` : '' };
}
function gooFilter(P, id) {
  if (!(P.goo > 0)) return '';
  id = safeId(id);
  return `<filter id="goo-${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${f2(P.goo)}"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -9"/></filter>`;
}
function svg(prims, P, opts = {}) {
  const id = safeId(opts.uid || 'g'), size = opts.size || 24;
  let inner = svgInner(prims, P, opts);
  const goo = gooFilter(P, id);
  let faint = ''; // translucent parts stay out of the goo filter, whose threshold would drop them
  if (goo) { const at = inner.indexOf('<g class="faint">'); if (at >= 0) { faint = inner.slice(at); inner = inner.slice(0, at); } }
  const body = goo ? `<defs>${goo}</defs><g filter="url(#goo-${id})">${inner}</g>${faint}` : inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width || size}" height="${opts.height || size}" viewBox="${opts.viewBox || '0 0 24 24'}"${opts.attrs ? ' ' + opts.attrs : ''}>${body}</svg>`;
}
/* a symbol for a sprite */
function symbol(id, prims, P, opts = {}) {
  id = safeId(id);
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
    const add = pr => { if (role) pr.role = role; if (alpha < 1) pr.alpha = f2(alpha); if (!filled && a['stroke-linejoin'] === 'miter') pr.join = 'miter'; prims.push(pr); };
    if (tag === 'path') {
      const segs = parsePath(a.d || '');
      if (filled) { const pr = { t: 'path', d: segsToString(segs) }; if (a['fill-rule'] === 'evenodd') pr.evenodd = true; add(pr); }
      else for (const sp of subpaths(segs)) {
        /* exact: the drawing's own corners, curves and joins, untouched by the corner sliders */
        if (hints.exact) { const s = sp.segs.slice(); if (sp.closed) s.push({ t: 'Z' }); add({ t: 'path', d: segsToString(s), x: 1 }); continue; }
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
/* a line icon's fill and duotone in one colour: the line and its plates, the details cut out */
function outlineAnalysed(prims, P, CL, A) {
  const { wCut } = widths(P);
  const sharp = P.corners === 'sharp';
  const toIP = pts => pts.map(p => ({ X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }));
  const flatIP = p => { const ip = []; for (let i = 0; i + 1 < p.length; i += 2) ip.push({ X: Math.round(p[i] * SC), Y: Math.round(p[i + 1] * SC) }); return ip; };
  const plates = A.pl.map(flatIP).map(ip => (CL.Clipper.Orientation(ip) ? ip : ip.reverse()));
  const R = autoRoles(prims, P);
  const B = new Set(A.b || []);
  const lineOf = keep => { const ps = [], rs = []; prims.forEach((pr, i) => { if (keep(i)) { ps.push(pr); rs.push(R[i]); } }); return ps.length ? outline(ps, P, 'outline', CL, rs) : new CL.Paths(); };
  const u = new CL.Clipper(); u.AddPaths(B.size ? lineOf(i => !B.has(i)) : outline(prims, P, 'outline', CL), CL.PolyType.ptSubject, true); u.AddPaths(plates, CL.PolyType.ptClip, true);
  let body = new CL.Paths(); u.Execute(CL.ClipType.ctUnion, body, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  const end = sharp ? CL.EndType.etOpenButt : CL.EndType.etOpenRound;
  if (B.size) {
    /* a badge in the gap of an outline: the gap's width kept clear round it, then the badge */
    const { w } = widths(P), ho = new CL.ClipperOffset(2, 0.03 * SC), halo = new CL.Paths();
    for (const i of B) for (const part of flatten(prims[i], P)) if (part.pts.length) ho.AddPath(toIP(part.pts), CL.JoinType.jtRound, part.closed ? CL.EndType.etClosedLine : end);
    ho.Execute(halo, (w / 2 + (P.G != null ? P.G : 0.75) * P.S) * SC);
    const c = new CL.Clipper(); c.AddPaths(body, CL.PolyType.ptSubject, true); c.AddPaths(halo, CL.PolyType.ptClip, true);
    const cleared = new CL.Paths(); c.Execute(CL.ClipType.ctDifference, cleared, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
    const v = new CL.Clipper(); v.AddPaths(cleared, CL.PolyType.ptSubject, true); v.AddPaths(lineOf(i => B.has(i)), CL.PolyType.ptClip, true);
    body = new CL.Paths(); v.Execute(CL.ClipType.ctUnion, body, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  }
  const co = new CL.ClipperOffset(2, 0.03 * SC); let any = false;
  for (const i of A.d) for (const part of flatten(prims[i], P)) {
    if (!part.pts.length) continue; any = true;
    if (R[i] === 'fill' && part.pts.length >= 3) { let ip = toIP(part.pts); if (!CL.Clipper.Orientation(ip)) ip.reverse(); co.AddPath(ip, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); }
    else co.AddPath(toIP(part.pts), CL.JoinType.jtRound, part.closed ? CL.EndType.etClosedLine : sharp && isDot(prims[i], P) ? CL.EndType.etOpenSquare : end);
  }
  for (const [, ...polys] of A.c) for (const p of polys) { co.AddPath(flatIP(p), CL.JoinType.jtRound, end); any = true; }
  if (!any) return body;
  const cut = new CL.Paths(); co.Execute(cut, (wCut / 2) * SC);
  const c = new CL.Clipper(); c.AddPaths(body, CL.PolyType.ptSubject, true); c.AddPaths(cut, CL.PolyType.ptClip, true);
  const out = new CL.Paths(); c.Execute(CL.ClipType.ctDifference, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  return out;
}
function outline(prims, P, weight, CL, roles) {
  if (!isNative(prims) && (weight === 'solid' || weight === 'duotone')) {
    if (!CLIPPER) CLIPPER = CL;
    const A = analysisOf(prims, P);
    if (A) return A.pl.length ? outlineAnalysed(prims, P, CL, A) : outline(prims, P, 'outline', CL, roles);
  }
  const { w, wCut } = widths(P);
  /* a font has one colour: two-tone keeps its line, duotone its body, and an
     icon's own drawing is cut the way it was drawn; translucent plates drop out */
  const drawn = isNative(prims);
  const solid = drawn || weight === 'solid' || weight === 'duotone';
  const sharp = P.corners === 'sharp';
  const R = roles || autoRoles(prims, P);
  const toIP = pts => pts.map(p => ({ X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }));
  const body = new CL.ClipperOffset(2, 0.03 * SC), cutter = new CL.ClipperOffset(2, 0.03 * SC);
  const flat = new CL.Paths(), knock = new CL.Paths(), extra = new CL.Paths();
  const H = solid ? halos(prims, R, P) : new Map();
  let hasBody = false, hasCut = false, hasFlat = false, hasKnock = false;
  prims.forEach((pr, i) => {
    const role = R[i];
    if (pr.alpha != null && pr.alpha < 0.5) return;
    const parts = flatten(pr, P);
    const end = !sharp ? CL.EndType.etOpenRound : isDot(pr, P) ? CL.EndType.etOpenSquare : CL.EndType.etOpenButt;
    const join = pr.join === 'miter' ? CL.JoinType.jtMiter : CL.JoinType.jtRound;
    const addStroke = (part, co) => { if (part.pts.length) co.AddPath(toIP(part.pts), join, part.closed ? CL.EndType.etClosedLine : end); };
    const addPolygon = part => { if (part.pts.length < 3) return; let ip = toIP(part.pts); if (!CL.Clipper.Orientation(ip)) ip.reverse(); body.AddPath(ip, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); };
    if (role === 'fill') { for (const part of parts) { if (part.pts.length >= 3) addPolygon(part); else addStroke(part, body); } hasBody = true; }
    else if (!solid && (role === 'flat' || role === 'knock' || role === 'cut' || role === 'punch')) { for (const part of parts) addStroke(part, body); hasBody = true; }
    else if (role === 'flat') { const c = new CL.Clipper(); let any = false; for (const part of parts) { if (part.pts.length >= 3) { c.AddPath(toIP(part.pts), CL.PolyType.ptSubject, true); any = true; } } if (any) { const u = new CL.Paths(); const ft = pr.evenodd ? CL.PolyFillType.pftEvenOdd : CL.PolyFillType.pftNonZero; c.Execute(CL.ClipType.ctUnion, u, ft, ft); for (const q of u) flat.push(q); hasFlat = true; } }
    else if (role === 'knock') { for (const part of parts) { if (part.pts.length >= 3) { knock.push(toIP(part.pts)); hasKnock = true; } } }
    else if (role === 'punch') { const co = new CL.ClipperOffset(2, 0.03 * SC); let any = false; for (const part of parts) { if (part.pts.length < 3) continue; let ip = toIP(part.pts); if (!CL.Clipper.Orientation(ip)) ip.reverse(); co.AddPath(ip, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); any = true; } if (any) { const grown = new CL.Paths(); co.Execute(grown, (wCut / 2) * SC); for (const q of grown) knock.push(q); hasKnock = true; } }
    else if (role === 'cut') { for (const part of parts) addStroke(part, cutter); hasCut = true; }
    else if (solid && !drawn && role === 'shape') {
      if (H.has(i)) { // grown on its own, then the later shapes' gaps taken out of it
        const co = new CL.ClipperOffset(2, 0.03 * SC); let any = false;
        for (const part of parts) { if (part.pts.length < 3) continue; let ip = toIP(part.pts); if (!CL.Clipper.Orientation(ip)) ip.reverse(); co.AddPath(ip, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); any = true; }
        if (any) {
          const grown = new CL.Paths(); co.Execute(grown, (w / 2) * SC);
          const hc = new CL.ClipperOffset(2, 0.03 * SC);
          for (const k of H.get(i)) for (const part of flatten(prims[k], P)) if (part.pts.length) hc.AddPath(toIP(part.pts), CL.JoinType.jtRound, part.closed ? CL.EndType.etClosedLine : CL.EndType.etOpenRound);
          const gap = new CL.Paths(); hc.Execute(gap, (w / 2 + (P.G != null ? P.G : 0.75) * P.S) * SC);
          const c = new CL.Clipper(); c.AddPaths(grown, CL.PolyType.ptSubject, true); c.AddPaths(gap, CL.PolyType.ptClip, true);
          const left = new CL.Paths(); c.Execute(CL.ClipType.ctDifference, left, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
          for (const q of left) extra.push(q);
        }
      } else { for (const part of parts) addPolygon(part); hasBody = true; }
    }
    else if (solid && role === 'detail') { const cp = pr.cut ? flatten(pr.cut, P) : parts; for (const part of cp) addStroke(part, cutter); hasCut = true; }
    else { for (const part of parts) addStroke(part, body); hasBody = true; }
  });
  let union = new CL.Paths();
  if (hasBody || extra.length) {
    const grown = new CL.Paths(); if (hasBody) body.Execute(grown, (w / 2) * SC);
    const c = new CL.Clipper(); c.AddPaths(grown, CL.PolyType.ptSubject, true); if (extra.length) c.AddPaths(extra, CL.PolyType.ptSubject, true);
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

/* ---------- the outline weight of a filled glyph, derived ----------
   A native solid (flats minus knocks) becomes a line icon. Fat parts of the
   silhouette are drawn as a stroke sitting just inside their edge, so the
   outline covers exactly the solid's footprint. Parts thinner than about
   1.2 S collapse to a line along their middle, small discs to a dot. A hole
   gets a ring on its edge, moved inside the hole when the ring would crowd
   the outer stroke, or a line or a dot when the hole is a slit or a pinhole.
   Cuts, plain strokes and translucent parts pass through. Needs Clipper. */
function deriveOutline(prims, P, CL) {
  const S = P.S;
  const toIP = pts => pts.map(p => ({ X: Math.round(p[0] * SC), Y: Math.round(p[1] * SC) }));
  const area = paths => Math.abs(CL.JS.AreaOfPolygons(paths)) / (SC * SC);
  const boolOp = (type, subj, clip, tree) => { const c = new CL.Clipper(); if (subj.length) c.AddPaths(subj, CL.PolyType.ptSubject, true); if (clip && clip.length) c.AddPaths(clip, CL.PolyType.ptClip, true); const out = tree ? new CL.PolyTree() : new CL.Paths(); c.Execute(type, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero); return out; };
  const offset = (paths, d) => { const out = new CL.Paths(); if (!paths.length) return out; const co = new CL.ClipperOffset(2, 0.03 * SC); co.AddPaths(paths, CL.JoinType.jtRound, CL.EndType.etClosedPolygon); co.Execute(out, d * SC); return out; };
  const inradius = paths => { let lo = 0, hi = 12; for (let i = 0; i < 11; i++) { const mid = (lo + hi) / 2; if (area(offset(paths, -mid)) > 0.01) lo = mid; else hi = mid; } return lo; };
  /* an outer contour with its holes; islands inside holes are components of their own */
  const components = tree => { const out = []; const walk = n => { for (const ch of n.Childs()) { if (!ch.IsHole()) out.push({ outer: ch.Contour(), holes: ch.Childs().filter(h => h.IsHole()).map(h => h.Contour()) }); walk(ch); } }; walk(tree); return out; };
  const asTree = paths => boolOp(CL.ClipType.ctUnion, paths, null, true);
  const polyOf = (contour, role) => { const pts = CL.Clipper.CleanPolygon(contour, 0.012 * SC).map(q => [f2(q.X / SC), f2(q.Y / SC)]); return pts.length >= 3 ? { t: 'poly', pts, closed: true, role } : null; };
  const centroid = paths => { let x = 0, y = 0, n = 0; for (const p of paths) for (const q of p) { x += q.X; y += q.Y; n++; } return n ? [f2(x / n / SC), f2(y / n / SC)] : null; };
  const out = [];
  const push = pr => { if (pr) out.push(pr); };
  /* a thin piece becomes a line along its middle: erode it to a sliver, then
     fill and stroke the sliver; a piece too small for that becomes a dot */
  const midline = paths => { const r = inradius(paths); if (r < 0.28) return; const sl = offset(paths, -Math.max(0, r - 0.12)); let any = false; for (const q of sl) { const pr = polyOf(q, 'fill'); if (pr) { push(pr); any = true; } } if (!any) { const c = centroid(paths); if (c) push({ t: 'poly', pts: [c], role: 'fill' }); } };

  const flatPaths = new CL.Paths(), knockPaths = new CL.Paths();
  for (const pr of prims) {
    const role = pr.role, a = pr.alpha != null ? pr.alpha : 1;
    if ((role === 'flat' || role === 'knock') && a >= 0.5) {
      const parts = flatten(pr, P).filter(part => part.pts.length >= 3).map(part => toIP(part.pts));
      if (!parts.length) continue;
      const c = new CL.Clipper(); c.AddPaths(parts, CL.PolyType.ptSubject, true); const u = new CL.Paths();
      const ft = pr.evenodd ? CL.PolyFillType.pftEvenOdd : CL.PolyFillType.pftNonZero; c.Execute(CL.ClipType.ctUnion, u, ft, ft);
      for (const q of u) (role === 'flat' ? flatPaths : knockPaths).push(q);
    } else { const cp = JSON.parse(JSON.stringify(pr)); delete cp.segs; out.push(cp); }
  }
  if (!flatPaths.length) return out;
  /* the ink of the parts that pass through, to keep clear of */
  const passInk = new CL.Paths();
  { const co = new CL.ClipperOffset(2, 0.03 * SC); let any = false; for (const pr of out) { if (pr.alpha != null && pr.alpha < 1) continue; for (const part of flatten(pr, P)) if (part.pts.length) { co.AddPath(toIP(part.pts), CL.JoinType.jtRound, part.closed ? CL.EndType.etClosedLine : CL.EndType.etOpenRound); any = true; } } if (any) co.Execute(passInk, (S / 2) * SC); }
  const R = boolOp(CL.ClipType.ctDifference, flatPaths, knockPaths, true);
  for (const comp of components(R)) {
    const C = [comp.outer, ...comp.holes];
    let E = offset(C, -S / 2);            // where a stroke of S fits: its centreline sits here
    if (area(E) < 0.2) E = new CL.Paths();  // a speck: the whole part is thin
    const F = offset(E, S / 2);           // the fat part of the component
    const thin = boolOp(CL.ClipType.ctDifference, C, F, true);
    const thinInk = new CL.Paths();
    for (const piece of components(thin)) { const pp = [piece.outer, ...piece.holes]; if (area(pp) >= 0.45) { midline(pp); for (const q of offset(pp, 0.1)) thinInk.push(q); } }
    if (!E.length) continue;
    const Ft = asTree(F);
    const outers = components(Ft).map(c => c.outer);
    /* the holes: a ring on the edge, or a line or dot when the hole is a slit or a pinhole */
    const holes = [];
    for (const c of components(Ft)) for (const H of c.holes) { const Hp = [H.slice().reverse()]; const rh = inradius(Hp); holes.push({ H, Hp, rh, thin: rh <= 0.6 * S, ringC: rh > 0.6 * S ? boolOp(CL.ClipType.ctDifference, offset(Hp, S / 2), offset(Hp, -S / 2)) : offset(offset(Hp, -Math.max(0, rh - 0.12)), S / 2) }); }
    /* the outer stroke sits inside the edge, unless the interior is crowded and there
       is room in the box: then it sits on the edge, as the designer's own pairs do */
    const insetBand = boolOp(CL.ClipType.ctDifference, outers, offset(outers, -S));
    const near = offset(insetBand, 0.3 * S);
    let crowded = false;
    for (const h of holes) if (area(boolOp(CL.ClipType.ctIntersection, h.ringC, near)) > 0.1) crowded = true;
    if (!crowded && passInk.length && area(boolOp(CL.ClipType.ctIntersection, passInk, near)) > 0.1) crowded = true;
    if (!crowded && thinInk.length && area(boolOp(CL.ClipType.ctIntersection, thinInk, near)) > 0.1) crowded = true;
    const bb = CL.JS.BoundsOfPaths(outers);
    const fits = bb.left / SC >= S / 2 - 0.05 && bb.top / SC >= S / 2 - 0.05 && bb.right / SC <= 24 - S / 2 + 0.05 && bb.bottom / SC <= 24 - S / 2 + 0.05;
    const centred = crowded && fits;
    const Et = asTree(E);
    for (const c of components(Et)) {
      const piece = [c.outer, ...c.holes];
      if (inradius(piece) < 0.8 * S) { for (const q of piece) push(polyOf(q, 'fill')); continue; } // a hollow that would be a hairline: solid instead
      if (!centred) push(polyOf(c.outer, 'stroke'));
    }
    if (centred) for (const o of outers) push(polyOf(o, 'stroke'));
    const band = centred ? offset(boolOp(CL.ClipType.ctDifference, offset(outers, S / 2), offset(outers, -S / 2)), 0.3 * S) : near;
    for (const h of holes) {
      if (h.thin) { midline(h.Hp); continue; }
      if (area(boolOp(CL.ClipType.ctIntersection, h.ringC, band)) < 0.1) { push(polyOf(h.H, 'stroke')); continue; }
      const Hi = offset(h.Hp, -S / 2);
      if (Hi.length && inradius(Hi) >= 0.35 * S) { for (const q of Hi) push(polyOf(q, 'stroke')); continue; }
      push(polyOf(h.H, 'stroke'));
    }
  }
  return out;
}
/* an icon's parts for a weight: a native solid when the library has one */
const primsFor = (ic, weight) => (weight === 'solid' && ic.ps ? ic.ps : ic.p);

/* an imported drawing as the library stores it, [{ d, f filled, a alpha, e even-odd,
   m mitred }], as parts drawn the way they were drawn: lines keep their own corners
   and follow the stroke and corner settings, fills stay as they are */
const drawn = parts => parts.map(q => { const pr = { t: 'path', d: q.d, x: 1, role: q.f ? 'flat' : 'stroke', roleLocked: true, n: 1 }; if (q.a != null) pr.alpha = q.a; if (q.e) pr.evenodd = true; if (q.m) pr.join = 'miter'; return pr; });

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

export { DEF, WEIGHTS, TONE, PRESETS, ICONS, ICON_ORDER, BASE, corners, radiusOf, parsePath, segsToString, subpaths, polyfy, arcCentre, pathOf, flatten, isClosed, bbox, autoRoles, svg, svgInner, symbol, gooFilter, widths, fromNodes, outline, buildFont, deriveOutline, primsFor, halos, safeId, f2, f4, isNative, layers, drawn, analyse, analysisOf, useClipper  };
