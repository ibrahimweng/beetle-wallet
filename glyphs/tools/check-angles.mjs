/* check-angles.mjs — every straight line in the library, against the 45° pass.

     node glyphs/tools/check-angles.mjs

   Reads the built library (data/icons.json and the eight four-style drawings)
   and the parametric icons at several strokes and gaps, and measures the
   angle of every straight line and every pair of neighbouring dots. It fails
   if any still sits within the pass's tolerance of a diagonal without being
   on it, unless audit/45-degrees.json lists that line as refused, with its
   reason, or its icon as left as drawn. A line on a diagonal is on it to
   within 0.01°. */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as E from '../src/lib/engine.js';
import { stillOff, skipped, TOL, EXACT, MIN_LEN } from './snap45.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const lib = read('data/icons.json');
const report = read('audit/45-degrees.json');

/* every straight line, for the tally */
const tally = { lines: 0, flat: 0, diagonal: 0, other: 0 };
const D2R = Math.PI / 180;
function count(lines) {
  for (const [x1, y1, x2, y2] of lines) {
    if (Math.hypot(x2 - x1, y2 - y1) < MIN_LEN) continue;
    const a = ((Math.atan2(y2 - y1, x2 - x1) / D2R) % 180 + 180) % 180;
    tally.lines++;
    if (Math.min(a, 180 - a, Math.abs(a - 90)) < EXACT) tally.flat++;
    else if (Math.min(Math.abs(a - 45), Math.abs(a - 135)) < EXACT) tally.diagonal++;
    else tally.other++;
  }
}
function straight(segs) {
  const out = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  for (const s of segs) {
    if (s.t === 'M') { [x, y] = s.p; sx = x; sy = y; }
    else if (s.t === 'L') { out.push([x, y, ...s.p]); [x, y] = s.p; }
    else if (s.t === 'Z') { if (x !== sx || y !== sy) out.push([x, y, sx, sy]); x = sx; y = sy; }
    else if (s.p) [x, y] = s.p;
  }
  return out;
}
const linesOfPrims = prims => prims.flatMap(p => p.t === 'poly'
  ? p.pts.slice(1).map((q, i) => [p.pts[i][0], p.pts[i][1], q[0], q[1]]).concat(p.closed && p.pts.length > 2 ? [[p.pts.at(-1)[0], p.pts.at(-1)[1], p.pts[0][0], p.pts[0][1]]] : [])
  : p.t === 'path' ? straight(p.segs || E.parsePath(p.d)) : []);

/* a line still off its diagonal is allowed only where the report says why */
const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-4 && Math.abs(a[1] - b[1]) < 1e-4;
const failures = [];
function judge(key, drawing, off) {
  if (!off.length || skipped(key)) return;
  const allowed = (report.refused[key] || {})[drawing] || [];
  for (const l of off) {
    const ok = allowed.some(r => (near(r.from, l.from) && near(r.to, l.to)) || (near(r.from, l.to) && near(r.to, l.from)));
    if (!ok) failures.push(`${key} ${drawing}: ${l.from.map(v => +v.toFixed(3)).join(', ')} to ${l.to.map(v => +v.toFixed(3)).join(', ')} at ${l.angle.toFixed(2)}°`);
  }
}

let icons = 0;
for (const [name, ic] of Object.entries(lib.sets.core)) { icons++; count(linesOfPrims(ic.p)); judge(`core:${name}`, 'line', stillOff(ic.p)); }
for (const [name, ic] of Object.entries(lib.sets.beetle)) {
  icons++;
  count(linesOfPrims(ic.p)); judge(`beetle:${name}`, 'line', stillOff(ic.p));
  if (ic.ps) { count(linesOfPrims(ic.ps)); judge(`beetle:${name}`, 'solid', stillOff(ic.ps)); }
}
for (const [file, path] of Object.entries(lib.drawings)) {
  if (file === 'fills') continue;
  for (const [name, parts] of Object.entries(read(path))) {
    count(parts.flatMap(p => straight(E.parsePath(p.d))));
    judge(`four:${name}`, file, stillOff(null, parts));
  }
}
icons += Object.keys(lib.sets.four).length;
/* the parametric icons are drawn from the parameters: judged as they are
   drawn by default, and a line on a diagonal there has to stay on it at every
   stroke and gap */
const diagonals = prims => linesOfPrims(prims).map(([x1, y1, x2, y2]) => { const a = ((Math.atan2(y2 - y1, x2 - x1) / D2R) % 180 + 180) % 180; return Math.min(Math.abs(a - 45), Math.abs(a - 135)) < EXACT; });
for (const id of E.ICON_ORDER) {
  icons++;
  const base = E.ICONS[id].make({ ...E.DEF });
  count(linesOfPrims(base));
  judge(`param:${id}`, 'default', stillOff(base));
  const onIt = diagonals(base);
  for (const S of [1, 1.5, 2, 2.5, 3, 4]) for (const G of [0.5, 0.75, 1]) {
    const now = diagonals(E.ICONS[id].make({ ...E.DEF, S, G }));
    onIt.forEach((was, i) => { if (was && !now[i]) failures.push(`param:${id} at stroke ${S}, gap ${G}: line ${i + 1} leaves its diagonal`); });
  }
}

const refused = Object.values(report.refused).reduce((a, d) => a + Object.values(d).reduce((b, l) => b + l.length, 0), 0);
console.log(`${icons} icons, ${tally.lines} straight lines: ${tally.flat} flat or upright, ${tally.diagonal} on a diagonal, ${tally.other} at other angles`);
console.log(`within ${TOL}° of a diagonal and not on it: ${refused} lines the pass could not take (each with its reason in audit/45-degrees.md), ${Object.keys(report.skipped).length} icons left as drawn`);
if (failures.length) {
  console.error(`\n${failures.length} line${failures.length === 1 ? '' : 's'} near a diagonal with no reason given:\n  ${failures.slice(0, 30).join('\n  ')}${failures.length > 30 ? '\n  …' : ''}`);
  console.error('\nRun `node glyphs/tools/build-library.mjs` and commit the library and audit/45-degrees.json.');
  process.exit(1);
}
console.log('every line near a diagonal is on it, or has its reason');
