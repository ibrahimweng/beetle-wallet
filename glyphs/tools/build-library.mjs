/* build-library.mjs — turns Lucide's icon nodes and the Beetle app's own glyph
   set into data/icons.json, then validates every icon. Run from anywhere:

     node glyphs/tools/build-library.mjs          rebuild data/icons.json
     node glyphs/tools/build-library.mjs --check  rebuild and fail if it differs from the committed file

   Sources: glyphs/lucide/ (Lucide 1.48.0 node data, tags and the category map;
   fetched once if missing) and src/icons.js at the repository root, the code
   mirror of the Figma Icon set. Figma itself is never touched. A glyph drawn in
   both weights becomes one icon with p (outline) and ps (solid); a filled glyph
   without a drawn outline gets one derived from its solid. */
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

const LUCIDE_VERSION = '1.48.0';
const LUCIDE_DIR = resolve(root, 'lucide');
const SOURCES = {
  'icon-nodes.json': `https://cdn.jsdelivr.net/npm/lucide-static@${LUCIDE_VERSION}/icon-nodes.json`,
  'tags.json': `https://cdn.jsdelivr.net/npm/lucide-static@${LUCIDE_VERSION}/tags.json`,
  'categories.json': 'https://lucide.dev/api/categories',
  'LICENSE': `https://cdn.jsdelivr.net/npm/lucide-static@${LUCIDE_VERSION}/LICENSE`,
};
mkdirSync(LUCIDE_DIR, { recursive: true });
for (const [name, url] of Object.entries(SOURCES)) {
  const path = resolve(LUCIDE_DIR, name);
  if (existsSync(path)) continue;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  writeFileSync(path, await res.text());
  console.log('fetched', name);
}
const nodes = JSON.parse(readFileSync(resolve(LUCIDE_DIR, 'icon-nodes.json'), 'utf8'));
const tags = JSON.parse(readFileSync(resolve(LUCIDE_DIR, 'tags.json'), 'utf8'));
const cats = JSON.parse(readFileSync(resolve(LUCIDE_DIR, 'categories.json'), 'utf8'));
const license = readFileSync(resolve(LUCIDE_DIR, 'LICENSE'), 'utf8');
const P = { ...E.DEF };

/* ---------- Lucide ---------- */
const lucide = {};
const stats = { polys: 0, paths: 0, arcs: 0, fail: [] };
for (const [name, els] of Object.entries(nodes)) {
  const prims = E.fromNodes(els);
  for (const pr of prims) { if (pr.t === 'poly') stats.polys++; else if (pr.t === 'path') stats.paths++; else stats.arcs++; delete pr.segs; }
  lucide[name] = { c: cats[name] || ['other'], t: tags[name] || [], p: prims };
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
  ['Home', 'lucide:house', 'the wallet home'], ['Wallet balance', 'lucide:wallet', 'total balance'], ['Hide balance', 'lucide:eye-off', 'balance hidden'], ['Show balance', 'lucide:eye', 'balance shown'],
  ['Naira', 'param:naira', 'the currency'], ['Dollars', 'lucide:dollar-sign', 'keep some in dollars'], ['Convert', 'lucide:arrow-left-right', 'naira to dollars and back'], ['Pay from dollars', 'lucide:badge-dollar-sign', 'pay in naira from the dollar balance'],
  ['Send', 'lucide:send', 'sending money'], ['Request', 'lucide:hand-coins', 'asking to be paid'], ['Receive', 'lucide:arrow-down-to-line', 'be paid'], ['Account number', 'lucide:hash', 'copy your account number'],
  ['Copy', 'lucide:copy', 'copied'], ['Share', 'lucide:share-2', 'share a code or receipt'], ['My code', 'lucide:qr-code', 'the QR to be paid'], ['Scan', 'lucide:scan-line', 'point the camera at a code'],
  ['Camera', 'lucide:camera', 'take the photo'], ['Photo', 'lucide:image', 'a photo from the roll'], ['Flash', 'lucide:zap', 'torch on'], ['Found', 'lucide:scan-search', 'what the photo read'],
  ['Misread', 'lucide:scan-text', 'when it read it wrong'], ['Checking', 'lucide:shield-question-mark', 'when it is not sure'], ['Confirm', 'lucide:circle-check', 'confirmed'], ['Sent', 'lucide:circle-check-big', 'it went'],
  ['Pending', 'lucide:clock', 'still on its way'], ['Failed', 'lucide:circle-x', 'it did not go'], ['Reversed', 'lucide:undo-2', 'it came back'], ['Short', 'lucide:circle-alert', 'not enough in the balance'],
  ['Limit', 'lucide:gauge', 'a daily limit'], ['Limit reached', 'lucide:octagon-alert', 'the line is hit'], ['Wrong', 'lucide:flag', 'when it was wrong'], ['Recall', 'lucide:undo', 'ask for it back'],
  ['Amend', 'lucide:pencil', 'change what was read'], ['Dispute', 'lucide:scale', 'following a dispute'], ['Receipt', 'lucide:receipt', 'the receipt'], ['History', 'lucide:rotate-ccw-clock', 'look at what happened'],
  ['Money in', 'lucide:arrow-down-left', 'came in'], ['Money out', 'lucide:arrow-up-right', 'went out'], ['Insights', 'lucide:lightbulb', 'what I noticed'], ['Filter', 'lucide:list-filter', 'filter the feed'],
  ['Search', 'param:search', 'search'], ['Calendar', 'lucide:calendar', 'a date'], ['Bills', 'lucide:receipt-text', 'pay a bill'], ['Electricity', 'lucide:zap', 'power'],
  ['Meter', 'lucide:circle-gauge', 'the meter number'], ['Token', 'lucide:key-square', 'the token arrives'], ['Water', 'lucide:droplets', 'water'], ['Waste', 'lucide:trash', 'waste'],
  ['Internet', 'lucide:wifi', 'internet'], ['Data', 'lucide:signal', 'mobile data'], ['Airtime', 'lucide:smartphone', 'airtime'], ['TV', 'lucide:tv', 'television'],
  ['School', 'lucide:graduation-cap', 'school fees'], ['Betting', 'lucide:dices', 'betting'], ['Loan', 'lucide:hand-coins', 'a loan'], ['Services', 'lucide:layout-grid', 'the services drawer'],
  ['Merchant', 'lucide:store', 'a shop'], ['Bank', 'lucide:landmark', 'another bank'], ['Card', 'lucide:credit-card', 'the virtual card'], ['Freeze card', 'lucide:snowflake', 'freeze it'],
  ['Goal', 'lucide:target', 'putting money away'], ['Savings pot', 'lucide:piggy-bank', 'a pot'], ['Save rule', 'lucide:repeat', 'save on its own'], ['Paused', 'lucide:circle-pause', 'a rule paused'],
  ['Rules', 'lucide:calendar-sync', 'what runs on its own'], ['Money health', 'lucide:heart-pulse', 'how the habits add up'], ['Score', 'beetle:dial', 'the ring with the score'], ['Trend up', 'lucide:trending-up', 'up since last month'],
  ['Trend down', 'lucide:trending-down', 'down since last month'], ['Chat', 'lucide:message-circle', 'ask me anything'], ['Agent', 'lucide:sparkles', 'Beetle speaking'], ['Typed', 'lucide:keyboard', 'you typed'],
  ['Draft', 'lucide:pencil-line', 'a draft'], ['Actions', 'lucide:plus', 'the button'], ['Settings', 'lucide:settings', 'what you set'], ['Lock', 'lucide:lock', 'lock and privacy'],
  ['Face ID', 'lucide:scan-face', 'face first'], ['Passcode', 'lucide:asterisk', 'six digits'], ['Fingerprint', 'lucide:fingerprint-pattern', 'a fingerprint'], ['Devices', 'lucide:monitor-smartphone', 'signed in devices'],
  ['Keys and recovery', 'lucide:key-round', 'recovery keys'], ['Standing instructions', 'lucide:repeat-2', 'running instructions'], ['Notifications', 'lucide:bell', 'alerts'], ['Notifications off', 'lucide:bell-off', 'muted'],
  ['Referral', 'lucide:gift', 'invite a friend'], ['Favourites', 'lucide:star', 'saved'], ['Help', 'lucide:life-buoy', 'support'], ['Sign in', 'lucide:log-in', 'signing in again'],
  ['Sign out', 'lucide:log-out', 'signing out'], ['Phone number', 'lucide:phone', 'opening an account'], ['Code', 'lucide:message-square-text', 'the code by SMS'], ['New code', 'lucide:refresh-cw', 'send it again'],
  ['No match', 'lucide:triangle-alert', 'the digits do not match'], ['ID card', 'lucide:id-card', 'identity'], ['Income', 'lucide:banknote', 'what comes in'], ['Finish', 'lucide:badge-check', 'finishing setting up'],
  ['Ready', 'lucide:party-popper', 'ready'], ['Start', 'lucide:rocket', 'start'], ['First day', 'lucide:sunrise', 'the first day'], ['Empty', 'lucide:inbox', 'nothing here yet'],
  ['No network', 'lucide:wifi-off', 'when the network is not there'], ['Lost phone', 'lucide:smartphone-nfc', 'when the phone is gone'], ['Locked out', 'lucide:lock-keyhole', 'locked'], ['Time', 'lucide:clock', 'a time'],
  ['Location', 'lucide:map-pin', 'a place'], ['Person', 'lucide:user', 'somebody'], ['People', 'lucide:users', 'contacts'], ['Split', 'lucide:split', 'split a bill'],
  ['Download', 'lucide:download', 'save the receipt'], ['Print', 'lucide:printer', 'print it'], ['Mail', 'lucide:mail', 'email'], ['WhatsApp and SMS', 'lucide:message-square', 'on WhatsApp and SMS'],
  ['Back', 'lucide:arrow-left', 'go back'], ['Close', 'lucide:x', 'close'], ['More', 'lucide:ellipsis', 'more'], ['Chevron', 'lucide:chevron-right', 'go on'],
  ['Done', 'lucide:check', 'done'], ['Info', 'lucide:info', 'about this'], ['Warning', 'lucide:triangle-alert', 'careful'], ['Danger', 'lucide:octagon-x', 'stop'],
  ['Delete', 'lucide:delete', 'the keypad delete'], ['Keypad', 'lucide:grip', 'the number pad'], ['Slide to confirm', 'beetle:slide-arrow', 'slide'], ['Step done', 'beetle:step-done', 'a finished step'],
  ['Step to do', 'beetle:step-todo', 'a step ahead'], ['Step in progress', 'beetle:step-work', 'the current step'], ['Beetle mark', 'beetle:mark', 'the mark'],
];
const missing = SCENARIOS.filter(([, key]) => { const [set, name] = key.split(':'); return set === 'lucide' ? !lucide[name] : set === 'beetle' ? !beetle[name] : !E.ICONS[name]; });
if (missing.length) { console.error('scenario icons missing:', missing.map(m => m[1]).join(', ')); process.exit(1); }

/* ---------- validate ---------- */
const validate = (label, prims) => {
  for (const weight of ['outline', 'solid']) { const s = E.svg(prims, P, { uid: 'v', weight }); if (/NaN|undefined|null/.test(s)) stats.fail.push(`${label} ${weight}`); }
  for (const pr of prims) for (const part of E.flatten(pr, P)) for (const q of part.pts) if (!Number.isFinite(q[0]) || !Number.isFinite(q[1])) { stats.fail.push(label + ' flatten'); return; }
};
for (const [n, ic] of Object.entries(lucide)) validate('lucide:' + n, ic.p);
for (const [n, ic] of Object.entries(beetle)) { validate('beetle:' + n, ic.p); if (ic.ps) validate('beetle:' + n + ' solid', ic.ps); }
const t0 = Date.now();
const sample = Object.keys(lucide).filter((_, i) => i % 12 === 0).slice(0, 160).map(n => ({ name: n, prims: lucide[n].p }));
for (const [n, ic] of Object.entries(beetle)) { sample.push({ name: 'beetle-' + n, prims: ic.p }); if (ic.ps) sample.push({ name: 'beetle-' + n + '-solid', prims: ic.ps }); }
const { font } = E.buildFont(P, sample, { weight: 'outline', family: 'Beetle Glyphs' }, CL, ot);
const parsed = ot.parse(font.toArrayBuffer());
if (parsed.glyphs.length !== sample.length + 1) stats.fail.push('font sample glyph count');
console.log(`font sample: ${sample.length} icons -> ${parsed.glyphs.length} glyphs in ${Date.now() - t0} ms`);

/* ---------- write ---------- */
const lib = {
  version: { lucide: LUCIDE_VERSION, engine: 2 },
  license: { lucide: license.split('---')[0].trim() + ' Full text at https://lucide.dev/license', beetle: 'Beetle glyphs from the app, ISC-style use inside the product.' },
  sets: { lucide, beetle },
  scenarios: SCENARIOS.map(([scenario, key, note]) => ({ scenario, key, note })),
};
const json = JSON.stringify(lib);
const out = resolve(root, 'data', 'icons.json');
console.log(`lucide ${Object.keys(lucide).length} icons (polys ${stats.polys}, paths ${stats.paths}, arcs ${stats.arcs}); beetle ${Object.keys(beetle).length} glyphs (${Object.values(beetle).filter(ic => ic.ps).length} with a solid of their own); scenarios ${SCENARIOS.length}; failures ${stats.fail.length} ${stats.fail.slice(0, 6).join(', ')}`);
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
