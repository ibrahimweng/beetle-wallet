/* build-library.mjs — turns the core set's icon nodes and the Beetle app's own
   glyph set into data/icons.json, then validates every icon. Run from anywhere:

     node glyphs/tools/build-library.mjs          rebuild data/icons.json
     node glyphs/tools/build-library.mjs --check  rebuild and fail if it differs from the committed file

   Sources: glyphs/sources/core/ (the core set's node data, tags and category
   map, used under the ISC licence in glyphs/LICENSE-core.txt) and src/icons.js
   at the repository root, the code mirror of the Figma Icon set. Figma itself
   is never touched. A glyph drawn in both weights becomes one icon with p
   (outline) and ps (solid); a filled glyph without a drawn outline gets one
   derived from its solid. */
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as E from '../src/lib/engine.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const CL = require('../vendor/clipper.js');
const ot = require('../vendor/opentype.min.js');
const { ICONS: BEETLE_SVG } = await import(resolve(root, '..', 'src', 'icons.js'));
const check = process.argv.includes('--check');

const CORE_DIR = resolve(root, 'sources', 'core');
for (const name of ['icon-nodes.json', 'tags.json', 'categories.json']) if (!existsSync(resolve(CORE_DIR, name))) { console.error(`missing glyphs/sources/core/${name}: the core set's source data is part of the repository`); process.exit(1); }
const nodes = JSON.parse(readFileSync(resolve(CORE_DIR, 'icon-nodes.json'), 'utf8'));
const tags = JSON.parse(readFileSync(resolve(CORE_DIR, 'tags.json'), 'utf8'));
const cats = JSON.parse(readFileSync(resolve(CORE_DIR, 'categories.json'), 'utf8'));
const P = { ...E.DEF };

/* ---------- the core set ---------- */
const core = {};
const stats = { polys: 0, paths: 0, arcs: 0, fail: [] };
for (const [name, els] of Object.entries(nodes)) {
  const prims = E.fromNodes(els);
  for (const pr of prims) { if (pr.t === 'poly') stats.polys++; else if (pr.t === 'path') stats.paths++; else stats.arcs++; delete pr.segs; }
  core[name] = { c: cats[name] || ['other'], t: tags[name] || [], p: prims };
}

/* ---------- Beetle: the app's own glyphs ---------- */
function parseElements(markup) {
  const out = [];
  markup = markup.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/<clipPath[\s\S]*?<\/clipPath>/g, '').replace(/<mask[\s\S]*?<\/mask>/g, '');
  const re = /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/?>/g;
  let m;
  while ((m = re.exec(markup))) { const attrs = {}; const ar = /([\w:-]+)="([^"]*)"/g; let a; while ((a = ar.exec(m[2]))) attrs[a[1]] = a[2]; out.push([m[1], attrs]); }
  return out;
}
const lum = v => { if (!v) return 0; if (/^white$/i.test(v)) return 1; const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return 0; let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join(''); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const sat = v => { const m = (v || '').match(/^#([0-9a-f]{6})$/i); if (!m) return 0; const c = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)); const mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
/* a light, unsaturated colour on the app's glyphs is a knockout or a track; a gradient is ink */
const light = v => v && !/^url\(/.test(v) && !/currentColor/i.test(v) && lum(v) > 0.55 && sat(v) < 0.45;
const beetle = {};
for (const [name, markup] of Object.entries(BEETLE_SVG)) {
  const prims = [];
  for (const [tag, a] of parseElements(markup)) {
    const hasFill = a.fill && a.fill !== 'none';
    const hasStroke = a.stroke && a.stroke !== 'none';
    if (hasFill) for (const pr of E.fromNodes([[tag, { ...a, stroke: 'none' }]])) { pr.role = light(a.fill) ? 'knock' : 'flat'; prims.push(pr); }
    if (hasStroke || !hasFill) for (const pr of E.fromNodes([[tag, { ...a, fill: 'none' }]], { ignoreFill: true })) { if (light(a.stroke)) pr.role = 'cut'; prims.push(pr); }
  }
  // a glyph drawn only in white was made for a dark button: read it as ink
  if (prims.length && prims.every(pr => pr.role === 'cut' || pr.role === 'knock')) for (const pr of prims) { if (pr.role === 'cut') delete pr.role; else pr.role = 'flat'; }
  // a light stroke with nothing to cut into is a track (a progress ring's rail): translucent ink in both weights
  else if (!prims.some(pr => pr.role === 'flat')) for (const pr of prims) if (pr.role === 'cut') { delete pr.role; pr.alpha = 0.26; }
  for (const pr of prims) delete pr.segs;
  beetle[name] = { c: ['beetle'], t: ['beetle', 'app', name.replace(/-/g, ' ')], p: prims, flat: prims.some(pr => pr.role === 'flat') };
}
/* A line glyph and its filled version are one icon in two weights: the designer
   drew the pair, so the outline is the solid's own replica (p and ps, the old
   name kept as an alias). Every other filled glyph keeps its solid and gets an
   outline derived from it through Clipper. */
const TWIN = { 'warn-filled': 'alert' };
const merged = [], derived = [];
for (const name of Object.keys(beetle)) {
  const base = TWIN[name] || name.replace(/-(filled|tone)$/, '');
  if (base === name || !beetle[base]) continue;
  const line = beetle[base], fill = beetle[name];
  if (line.flat || !fill.flat) continue;
  line.ps = fill.p; line.a = [...(line.a || []), name]; line.t = [...new Set([...line.t, ...fill.t])];
  delete beetle[name]; merged.push(name);
}
/* a glyph that is chunky by design gets its line version drawn from the solid's
   own geometry: undo-filled is a band 3.8 wide on a circle of 7.5 about (12, 14),
   from the top clockwise to the lower left, with a chevron head 3.8 thick */
const OUTLINES = {
  'undo-filled': [{ t: 'arc', c: [12, 14], rx: 7.5, ry: 7.5, a0: -90, a1: 170 }, { t: 'poly', pts: [[10.05, 5.55, 'none'], [5.25, 10.35, 'fillet'], [10.05, 15.15, 'none']] }],
};
for (const [name, ic] of Object.entries(beetle)) {
  if (ic.flat && !ic.ps) { ic.ps = ic.p; ic.p = OUTLINES[name] || E.deriveOutline(ic.ps, P, CL); ic.d = true; derived.push(name); }
  delete ic.flat;
}
console.log(`beetle: ${merged.length} drawn pairs merged, ${derived.length} outlines derived (${derived.join(', ')})`);

/* ---------- Beetle: every scenario of the app, mapped to a glyph ---------- */
const SCENARIOS = [
  ['Home', 'core:house', 'the wallet home'], ['Wallet balance', 'core:wallet', 'total balance'], ['Hide balance', 'core:eye-off', 'balance hidden'], ['Show balance', 'core:eye', 'balance shown'],
  ['Naira', 'param:naira', 'the currency'], ['Dollars', 'core:dollar-sign', 'keep some in dollars'], ['Convert', 'core:arrow-left-right', 'naira to dollars and back'], ['Pay from dollars', 'core:badge-dollar-sign', 'pay in naira from the dollar balance'],
  ['Send', 'core:send', 'sending money'], ['Request', 'core:hand-coins', 'asking to be paid'], ['Receive', 'core:arrow-down-to-line', 'be paid'], ['Account number', 'core:hash', 'copy your account number'],
  ['Copy', 'core:copy', 'copied'], ['Share', 'core:share-2', 'share a code or receipt'], ['My code', 'core:qr-code', 'the QR to be paid'], ['Scan', 'core:scan-line', 'point the camera at a code'],
  ['Camera', 'core:camera', 'take the photo'], ['Photo', 'core:image', 'a photo from the roll'], ['Flash', 'core:zap', 'torch on'], ['Found', 'core:scan-search', 'what the photo read'],
  ['Misread', 'core:scan-text', 'when it read it wrong'], ['Checking', 'core:shield-question-mark', 'when it is not sure'], ['Confirm', 'core:circle-check', 'confirmed'], ['Sent', 'core:circle-check-big', 'it went'],
  ['Pending', 'core:clock', 'still on its way'], ['Failed', 'core:circle-x', 'it did not go'], ['Reversed', 'core:undo-2', 'it came back'], ['Short', 'core:circle-alert', 'not enough in the balance'],
  ['Limit', 'core:gauge', 'a daily limit'], ['Limit reached', 'core:octagon-alert', 'the line is hit'], ['Wrong', 'core:flag', 'when it was wrong'], ['Recall', 'core:undo', 'ask for it back'],
  ['Amend', 'core:pencil', 'change what was read'], ['Dispute', 'core:scale', 'following a dispute'], ['Receipt', 'core:receipt', 'the receipt'], ['History', 'core:rotate-ccw-clock', 'look at what happened'],
  ['Money in', 'core:arrow-down-left', 'came in'], ['Money out', 'core:arrow-up-right', 'went out'], ['Insights', 'core:lightbulb', 'what I noticed'], ['Filter', 'core:list-filter', 'filter the feed'],
  ['Search', 'param:search', 'search'], ['Calendar', 'core:calendar', 'a date'], ['Bills', 'core:receipt-text', 'pay a bill'], ['Electricity', 'core:zap', 'power'],
  ['Meter', 'core:circle-gauge', 'the meter number'], ['Token', 'core:key-square', 'the token arrives'], ['Water', 'core:droplets', 'water'], ['Waste', 'core:trash', 'waste'],
  ['Internet', 'core:wifi', 'internet'], ['Data', 'core:signal', 'mobile data'], ['Airtime', 'core:smartphone', 'airtime'], ['TV', 'core:tv', 'television'],
  ['School', 'core:graduation-cap', 'school fees'], ['Betting', 'core:dices', 'betting'], ['Loan', 'core:hand-coins', 'a loan'], ['Services', 'core:layout-grid', 'the services drawer'],
  ['Merchant', 'core:store', 'a shop'], ['Bank', 'core:landmark', 'another bank'], ['Card', 'core:credit-card', 'the virtual card'], ['Freeze card', 'core:snowflake', 'freeze it'],
  ['Goal', 'core:target', 'putting money away'], ['Savings pot', 'core:piggy-bank', 'a pot'], ['Save rule', 'core:repeat', 'save on its own'], ['Paused', 'core:circle-pause', 'a rule paused'],
  ['Rules', 'core:calendar-sync', 'what runs on its own'], ['Money health', 'core:heart-pulse', 'how the habits add up'], ['Score', 'beetle:dial', 'the ring with the score'], ['Trend up', 'core:trending-up', 'up since last month'],
  ['Trend down', 'core:trending-down', 'down since last month'], ['Chat', 'core:message-circle', 'ask me anything'], ['Agent', 'core:sparkles', 'Beetle speaking'], ['Typed', 'core:keyboard', 'you typed'],
  ['Draft', 'core:pencil-line', 'a draft'], ['Actions', 'core:plus', 'the button'], ['Settings', 'core:settings', 'what you set'], ['Lock', 'core:lock', 'lock and privacy'],
  ['Face ID', 'core:scan-face', 'face first'], ['Passcode', 'core:asterisk', 'six digits'], ['Fingerprint', 'core:fingerprint-pattern', 'a fingerprint'], ['Devices', 'core:monitor-smartphone', 'signed in devices'],
  ['Keys and recovery', 'core:key-round', 'recovery keys'], ['Standing instructions', 'core:repeat-2', 'running instructions'], ['Notifications', 'core:bell', 'alerts'], ['Notifications off', 'core:bell-off', 'muted'],
  ['Referral', 'core:gift', 'invite a friend'], ['Favourites', 'core:star', 'saved'], ['Help', 'core:life-buoy', 'support'], ['Sign in', 'core:log-in', 'signing in again'],
  ['Sign out', 'core:log-out', 'signing out'], ['Phone number', 'core:phone', 'opening an account'], ['Code', 'core:message-square-text', 'the code by SMS'], ['New code', 'core:refresh-cw', 'send it again'],
  ['No match', 'core:triangle-alert', 'the digits do not match'], ['ID card', 'core:id-card', 'identity'], ['Income', 'core:banknote', 'what comes in'], ['Finish', 'core:badge-check', 'finishing setting up'],
  ['Ready', 'core:party-popper', 'ready'], ['Start', 'core:rocket', 'start'], ['First day', 'core:sunrise', 'the first day'], ['Empty', 'core:inbox', 'nothing here yet'],
  ['No network', 'core:wifi-off', 'when the network is not there'], ['Lost phone', 'core:smartphone-nfc', 'when the phone is gone'], ['Locked out', 'core:lock-keyhole', 'locked'], ['Time', 'core:clock', 'a time'],
  ['Location', 'core:map-pin', 'a place'], ['Person', 'core:user', 'somebody'], ['People', 'core:users', 'contacts'], ['Split', 'core:split', 'split a bill'],
  ['Download', 'core:download', 'save the receipt'], ['Print', 'core:printer', 'print it'], ['Mail', 'core:mail', 'email'], ['WhatsApp and SMS', 'core:message-square', 'on WhatsApp and SMS'],
  ['Back', 'core:arrow-left', 'go back'], ['Close', 'core:x', 'close'], ['More', 'core:ellipsis', 'more'], ['Chevron', 'core:chevron-right', 'go on'],
  ['Done', 'core:check', 'done'], ['Info', 'core:info', 'about this'], ['Warning', 'core:triangle-alert', 'careful'], ['Danger', 'core:octagon-x', 'stop'],
  ['Delete', 'core:delete', 'the keypad delete'], ['Keypad', 'core:grip', 'the number pad'], ['Slide to confirm', 'beetle:slide-arrow', 'slide'], ['Step done', 'beetle:step-done', 'a finished step'],
  ['Step to do', 'beetle:step-todo', 'a step ahead'], ['Step in progress', 'beetle:step-work', 'the current step'], ['Beetle mark', 'beetle:mark', 'the mark'],
];
const missing = SCENARIOS.filter(([, key]) => { const [set, name] = key.split(':'); return set === 'core' ? !core[name] : set === 'beetle' ? !beetle[name] : !E.ICONS[name]; });
if (missing.length) { console.error('scenario icons missing:', missing.map(m => m[1]).join(', ')); process.exit(1); }

/* ---------- validate ---------- */
/* a command after Z picks up where the closed subpath began; it once started at
   the origin and drew a line in from the corner of calendar-fold, mop and scale */
{ const sp = E.subpaths(E.parsePath('M4 4h6v6za2 2 0 012 2')); if (sp.length !== 2 || sp[1].segs[0].p.join() !== '4,4') stats.fail.push('engine: a subpath after Z does not start where the closed one began'); }
const validate = (label, prims) => {
  for (const weight of ['outline', 'solid']) { const s = E.svg(prims, P, { uid: 'v', weight }); if (/NaN|undefined|null/.test(s)) stats.fail.push(`${label} ${weight}`); }
  for (const pr of prims) for (const part of E.flatten(pr, P)) for (const q of part.pts) {
    if (!Number.isFinite(q[0]) || !Number.isFinite(q[1])) { stats.fail.push(label + ' flatten'); return; }
    if (q[0] < -0.5 || q[0] > 24.5 || q[1] < -0.5 || q[1] > 24.5) { stats.fail.push(`${label} leaves the 24 grid at ${q.map(v => v.toFixed(1)).join(', ')}`); return; }
  }
};
for (const [n, ic] of Object.entries(core)) validate('core:' + n, ic.p);
for (const [n, ic] of Object.entries(beetle)) { validate('beetle:' + n, ic.p); if (ic.ps) validate('beetle:' + n + ' solid', ic.ps); }
const t0 = Date.now();
const sample = Object.keys(core).filter((_, i) => i % 12 === 0).slice(0, 160).map(n => ({ name: n, prims: core[n].p }));
for (const [n, ic] of Object.entries(beetle)) { sample.push({ name: 'beetle-' + n, prims: ic.p }); if (ic.ps) sample.push({ name: 'beetle-' + n + '-solid', prims: ic.ps }); }
const { font } = E.buildFont(P, sample, { weight: 'outline', family: 'Beetle Glyphs' }, CL, ot);
const parsed = ot.parse(font.toArrayBuffer());
if (parsed.glyphs.length !== sample.length + 1) stats.fail.push('font sample glyph count');
console.log(`font sample: ${sample.length} icons -> ${parsed.glyphs.length} glyphs in ${Date.now() - t0} ms`);

/* ---------- write ---------- */
const lib = {
  version: { engine: 2, library: 3 },
  license: { core: 'ISC. The notice is in LICENSE-core.txt beside this site and stays with the icons.', beetle: 'The app glyphs belong to the Beetle wallet design.' },
  sets: { core, beetle },
  scenarios: SCENARIOS.map(([scenario, key, note]) => ({ scenario, key, note })),
};
const json = JSON.stringify(lib);
const out = resolve(root, 'data', 'icons.json');
console.log(`core ${Object.keys(core).length} icons (polys ${stats.polys}, paths ${stats.paths}, arcs ${stats.arcs}); beetle ${Object.keys(beetle).length} glyphs (${Object.values(beetle).filter(ic => ic.ps).length} with a solid of their own); scenarios ${SCENARIOS.length}; failures ${stats.fail.length} ${stats.fail.slice(0, 6).join(', ')}`);
if (stats.fail.length) process.exit(1);
if (check) {
  const current = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (current !== json) { console.error('data/icons.json is stale: run `node glyphs/tools/build-library.mjs` and commit it'); process.exit(1); }
  console.log('data/icons.json matches its sources');
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, json);
  console.log(`wrote data/icons.json (${(json.length / 1024).toFixed(0)} KB)`);
}
