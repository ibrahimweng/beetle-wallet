/* build-library.mjs — turns Lucide's icon nodes and the Beetle app's own glyph
   set into one icons.json the engine renders, then validates every icon and
   writes contact sheets for a look. Figma is never touched: the Beetle set is
   read from the code mirror of the Icon component set (src/icons.js). */
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const E = require('./engine.js');
const CL = require('./clipper.js');
const ot = require('./opentype.min.js');
const { ICONS: BEETLE_SVG } = await import('/home/user/beetle-wallet/src/icons.js');

const LUCIDE_VERSION = '1.48.0';
const nodes = JSON.parse(readFileSync(resolve(here, 'lucide/icon-nodes.json'), 'utf8'));
const tags = JSON.parse(readFileSync(resolve(here, 'lucide/tags.json'), 'utf8'));
const cats = JSON.parse(readFileSync(resolve(here, 'lucide/categories.json'), 'utf8'));
const license = readFileSync(resolve(here, 'lucide/LICENSE'), 'utf8');
const P = { ...E.DEF };

/* ---------- Lucide ---------- */
const lucide = {};
const stats = { polys: 0, paths: 0, arcs: 0, fail: [] };
for (const [name, els] of Object.entries(nodes)) {
  const prims = E.fromNodes(els);
  for (const pr of prims) { if (pr.t === 'poly') stats.polys++; else if (pr.t === 'path') stats.paths++; else stats.arcs++; delete pr.segs; }
  lucide[name] = { c: cats[name] || ['other'], t: tags[name] || [], p: prims };
}

/* ---------- Beetle: the app's own glyphs, read from the code mirror ---------- */
function parseElements(markup) {
  const out = [];
  markup = markup.replace(/<defs>[\s\S]*?<\/defs>/g, '').replace(/<clipPath[\s\S]*?<\/clipPath>/g, '').replace(/<mask[\s\S]*?<\/mask>/g, '');
  const re = /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/?>/g;
  let m;
  while ((m = re.exec(markup))) {
    const attrs = {}; const ar = /([\w:-]+)="([^"]*)"/g; let a;
    while ((a = ar.exec(m[2]))) attrs[a[1]] = a[2];
    out.push([m[1], attrs]);
  }
  return out;
}
const beetle = {};
for (const [name, markup] of Object.entries(BEETLE_SVG)) {
  const els = parseElements(markup);
  // an element that is both filled and stroked contributes a flat fill and a stroke
  /* a light colour on the app's glyphs is a knockout or a track; a gradient is ink */
  const lum = v => { if (!v) return 0; if (/^white$/i.test(v)) return 1; const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return 0; let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join(''); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const sat = v => { const m = (v || '').match(/^#([0-9a-f]{6})$/i); if (!m) return 0; const c = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)); const mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
  const light = v => v && !/^url\(/.test(v) && !/currentColor/i.test(v) && lum(v) > 0.55 && sat(v) < 0.45;
  const prims = [];
  for (const [tag, a] of els) {
    const hasFill = a.fill && a.fill !== 'none';
    const hasStroke = a.stroke && a.stroke !== 'none';
    if (hasFill) { const p = E.fromNodes([[tag, { ...a, stroke: 'none' }]]); for (const pr of p) { pr.role = light(a.fill) ? 'knock' : 'flat'; prims.push(pr); } }
    if (hasStroke || !hasFill) { const p = E.fromNodes([[tag, { ...a, fill: 'none' }]], { ignoreFill: true }); for (const pr of p) { if (light(a.stroke)) pr.role = 'cut'; prims.push(pr); } }
  }
  for (const pr of prims) delete pr.segs;
  // a glyph drawn only in white was made for a dark button: read it as ink
  if (prims.length && prims.every(pr => pr.role === 'cut' || pr.role === 'knock')) for (const pr of prims) { if (pr.role === 'cut') delete pr.role; else pr.role = 'flat'; }
  beetle[name] = { c: ['beetle'], t: ['beetle', 'app', name.replace(/-/g, ' ')], p: prims, flat: prims.some(pr => pr.role === 'flat') };
}

/* ---------- Beetle: the app's scenarios, each mapped to a glyph ---------- */
/* [scenario, icon key, note] — keys are 'lucide:<name>', 'beetle:<name>' or 'param:<id>' */
const SCENARIOS = [
  ['Home', 'lucide:house', 'the wallet home'],
  ['Wallet balance', 'lucide:wallet', 'total balance'],
  ['Hide balance', 'lucide:eye-off', 'balance hidden'],
  ['Show balance', 'lucide:eye', 'balance shown'],
  ['Naira', 'param:naira', 'the currency'],
  ['Dollars', 'lucide:dollar-sign', 'keep some in dollars'],
  ['Convert', 'lucide:arrow-left-right', 'naira to dollars and back'],
  ['Pay from dollars', 'lucide:badge-dollar-sign', 'pay in naira from the dollar balance'],
  ['Send', 'lucide:send', 'sending money'],
  ['Request', 'lucide:hand-coins', 'asking to be paid'],
  ['Receive', 'lucide:arrow-down-to-line', 'be paid'],
  ['Account number', 'lucide:hash', 'copy your account number'],
  ['Copy', 'lucide:copy', 'copied'],
  ['Share', 'lucide:share-2', 'share a code or receipt'],
  ['My code', 'lucide:qr-code', 'the QR to be paid'],
  ['Scan', 'lucide:scan-line', 'point the camera at a code'],
  ['Camera', 'lucide:camera', 'take the photo'],
  ['Photo', 'lucide:image', 'a photo from the roll'],
  ['Flash', 'lucide:zap', 'torch on'],
  ['Found', 'lucide:scan-search', 'what the photo read'],
  ['Misread', 'lucide:scan-text', 'when it read it wrong'],
  ['Checking', 'lucide:shield-question-mark', 'when it is not sure'],
  ['Confirm', 'lucide:circle-check', 'confirmed'],
  ['Sent', 'lucide:circle-check-big', 'it went'],
  ['Pending', 'lucide:clock', 'still on its way'],
  ['Failed', 'lucide:circle-x', 'it did not go'],
  ['Reversed', 'lucide:undo-2', 'it came back'],
  ['Short', 'lucide:circle-alert', 'not enough in the balance'],
  ['Limit', 'lucide:gauge', 'a daily limit'],
  ['Limit reached', 'lucide:octagon-alert', 'the line is hit'],
  ['Wrong', 'lucide:flag', 'when it was wrong'],
  ['Recall', 'lucide:undo', 'ask for it back'],
  ['Amend', 'lucide:pencil', 'change what was read'],
  ['Dispute', 'lucide:scale', 'following a dispute'],
  ['Receipt', 'lucide:receipt', 'the receipt'],
  ['History', 'lucide:rotate-ccw-clock', 'look at what happened'],
  ['Money in', 'lucide:arrow-down-left', 'came in'],
  ['Money out', 'lucide:arrow-up-right', 'went out'],
  ['Insights', 'lucide:lightbulb', 'what I noticed'],
  ['Filter', 'lucide:list-filter', 'filter the feed'],
  ['Search', 'param:search', 'search'],
  ['Calendar', 'lucide:calendar', 'a date'],
  ['Bills', 'lucide:receipt-text', 'pay a bill'],
  ['Electricity', 'lucide:zap', 'power'],
  ['Meter', 'lucide:circle-gauge', 'the meter number'],
  ['Token', 'lucide:key-square', 'the token arrives'],
  ['Water', 'lucide:droplets', 'water'],
  ['Waste', 'lucide:trash', 'waste'],
  ['Internet', 'lucide:wifi', 'internet'],
  ['Data', 'lucide:signal', 'mobile data'],
  ['Airtime', 'lucide:smartphone', 'airtime'],
  ['TV', 'lucide:tv', 'television'],
  ['School', 'lucide:graduation-cap', 'school fees'],
  ['Betting', 'lucide:dices', 'betting'],
  ['Loan', 'lucide:hand-coins', 'a loan'],
  ['Services', 'lucide:layout-grid', 'the services drawer'],
  ['Merchant', 'lucide:store', 'a shop'],
  ['Bank', 'lucide:landmark', 'another bank'],
  ['Card', 'lucide:credit-card', 'the virtual card'],
  ['Freeze card', 'lucide:snowflake', 'freeze it'],
  ['Goal', 'lucide:target', 'putting money away'],
  ['Savings pot', 'lucide:piggy-bank', 'a pot'],
  ['Save rule', 'lucide:repeat', 'save on its own'],
  ['Paused', 'lucide:circle-pause', 'a rule paused'],
  ['Rules', 'lucide:calendar-sync', 'what runs on its own'],
  ['Money health', 'lucide:heart-pulse', 'how the habits add up'],
  ['Score', 'beetle:dial', 'the ring with the score'],
  ['Trend up', 'lucide:trending-up', 'up since last month'],
  ['Trend down', 'lucide:trending-down', 'down since last month'],
  ['Chat', 'lucide:message-circle', 'ask me anything'],
  ['Agent', 'lucide:sparkles', 'Beetle speaking'],
  ['Typed', 'lucide:keyboard', 'you typed'],
  ['Draft', 'lucide:pencil-line', 'a draft'],
  ['Actions', 'lucide:plus', 'the button'],
  ['Settings', 'lucide:settings', 'what you set'],
  ['Lock', 'lucide:lock', 'lock and privacy'],
  ['Face ID', 'lucide:scan-face', 'face first'],
  ['Passcode', 'lucide:asterisk', 'six digits'],
  ['Fingerprint', 'lucide:fingerprint-pattern', 'a fingerprint'],
  ['Devices', 'lucide:monitor-smartphone', 'signed in devices'],
  ['Keys and recovery', 'lucide:key-round', 'recovery keys'],
  ['Standing instructions', 'lucide:repeat-2', 'running instructions'],
  ['Notifications', 'lucide:bell', 'alerts'],
  ['Notifications off', 'lucide:bell-off', 'muted'],
  ['Referral', 'lucide:gift', 'invite a friend'],
  ['Favourites', 'lucide:star', 'saved'],
  ['Help', 'lucide:life-buoy', 'support'],
  ['Sign in', 'lucide:log-in', 'signing in again'],
  ['Sign out', 'lucide:log-out', 'signing out'],
  ['Phone number', 'lucide:phone', 'opening an account'],
  ['Code', 'lucide:message-square-text', 'the code by SMS'],
  ['New code', 'lucide:refresh-cw', 'send it again'],
  ['No match', 'lucide:triangle-alert', 'the digits do not match'],
  ['ID card', 'lucide:id-card', 'identity'],
  ['Income', 'lucide:banknote', 'what comes in'],
  ['Finish', 'lucide:badge-check', 'finishing setting up'],
  ['Ready', 'lucide:party-popper', 'ready'],
  ['Start', 'lucide:rocket', 'start'],
  ['First day', 'lucide:sunrise', 'the first day'],
  ['Empty', 'lucide:inbox', 'nothing here yet'],
  ['No network', 'lucide:wifi-off', 'when the network is not there'],
  ['Lost phone', 'lucide:smartphone-nfc', 'when the phone is gone'],
  ['Locked out', 'lucide:lock-keyhole', 'locked'],
  ['Time', 'lucide:clock', 'a time'],
  ['Location', 'lucide:map-pin', 'a place'],
  ['Person', 'lucide:user', 'somebody'],
  ['People', 'lucide:users', 'contacts'],
  ['Split', 'lucide:split', 'split a bill'],
  ['Download', 'lucide:download', 'save the receipt'],
  ['Print', 'lucide:printer', 'print it'],
  ['Mail', 'lucide:mail', 'email'],
  ['WhatsApp and SMS', 'lucide:message-square', 'on WhatsApp and SMS'],
  ['Back', 'lucide:arrow-left', 'go back'],
  ['Close', 'lucide:x', 'close'],
  ['More', 'lucide:ellipsis', 'more'],
  ['Chevron', 'lucide:chevron-right', 'go on'],
  ['Done', 'lucide:check', 'done'],
  ['Info', 'lucide:info', 'about this'],
  ['Warning', 'lucide:triangle-alert', 'careful'],
  ['Danger', 'lucide:octagon-x', 'stop'],
  ['Delete', 'lucide:delete', 'the keypad delete'],
  ['Keypad', 'lucide:grip', 'the number pad'],
  ['Slide to confirm', 'beetle:slide-arrow', 'slide'],
  ['Step done', 'beetle:step-done', 'a finished step'],
  ['Step to do', 'beetle:step-todo', 'a step ahead'],
  ['Step in progress', 'beetle:step-work', 'the current step'],
  ['Beetle mark', 'beetle:mark', 'the mark'],
];
const missing = SCENARIOS.filter(([, key]) => { const [set, name] = key.split(':'); return set === 'lucide' ? !lucide[name] : set === 'beetle' ? !beetle[name] : !E.ICONS[name]; });
if (missing.length) { console.log('scenario icons missing:', missing.map(m => m[1]).join(', ')); }

/* ---------- validate ---------- */
const check = (label, prims, roles) => {
  const s = E.svg(prims, P, { uid: 'v' }); if (/NaN|undefined|null/.test(s)) stats.fail.push(label + ' svg');
  const s2 = E.svg(prims, P, { uid: 'v', weight: 'solid' }); if (/NaN|undefined|null/.test(s2)) stats.fail.push(label + ' solid');
  for (const pr of prims) for (const part of E.flatten(pr, P)) for (const q of part.pts) if (!Number.isFinite(q[0]) || !Number.isFinite(q[1])) { stats.fail.push(label + ' flat'); return; }
};
for (const [n, ic] of Object.entries(lucide)) check('lucide:' + n, ic.p);
for (const [n, ic] of Object.entries(beetle)) check('beetle:' + n, ic.p);
// a sample of the library through Clipper and into a font
const t0 = Date.now();
const sample = Object.keys(lucide).filter((_, i) => i % 12 === 0).slice(0, 160).map(n => ({ name: n, prims: lucide[n].p }));
for (const [n, ic] of Object.entries(beetle)) sample.push({ name: 'beetle-' + n, prims: ic.p });
const { font } = E.buildFont(P, sample, { weight: 'outline', family: 'Beetle Glyphs' }, CL, ot);
const buf = font.toArrayBuffer();
const back = ot.parse(buf);
console.log(`font sample: ${sample.length} icons -> ${back.glyphs.length} glyphs, ${(buf.byteLength / 1024).toFixed(1)} KB, ${Date.now() - t0} ms`);

/* ---------- write ---------- */
const lib = { version: { lucide: LUCIDE_VERSION, engine: 2 }, license: { lucide: license.split('---')[0].trim() + ' Full text at https://lucide.dev/license', beetle: 'Beetle glyphs from the app, ISC-style use inside the product.' }, sets: { lucide, beetle }, scenarios: SCENARIOS.map(([scenario, key, note]) => ({ scenario, key, note })) };
const json = JSON.stringify(lib);
writeFileSync(resolve(here, 'icons.json'), json);
const categories = {}; for (const ic of Object.values(lucide)) for (const c of ic.c) categories[c] = (categories[c] || 0) + 1;
console.log(`lucide ${Object.keys(lucide).length} icons (polys ${stats.polys}, paths ${stats.paths}, arcs ${stats.arcs}); beetle ${Object.keys(beetle).length} glyphs; scenarios ${SCENARIOS.length}; failures ${stats.fail.length} ${stats.fail.slice(0, 6).join(', ')}`);
console.log(`icons.json ${(json.length / 1024).toFixed(0)} KB; categories ${Object.keys(categories).length}`);

/* ---------- contact sheets ---------- */
mkdirSync(resolve(here, 'sheets'), { recursive: true });
const sheet = (title, cells, cols = 16) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#ff2323;color:#000;font-family:system-ui;padding:20px}h1{font:600 14px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;margin:0 0 14px}.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px 6px}.c{display:flex;flex-direction:column;align-items:center;gap:4px}.c span{font:9px ui-monospace,monospace;opacity:.75;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}svg{width:40px;height:40px;display:block}</style></head><body><h1>${title}</h1><div class="g">${cells.join('')}</div></body></html>`;
const cell = (name, prims, opts) => `<div class="c">${E.svg(prims, opts.P || P, { uid: name.replace(/[^a-z0-9]/gi, '') + (opts.weight || ''), weight: opts.weight })}<span>${name}</span></div>`;
const names = Object.keys(lucide);
writeFileSync(resolve(here, 'sheets/lucide-a.html'), sheet(`Lucide through the engine · S 2.5 R 2 fillet 0.5 · icons 1–256 of ${names.length}`, names.slice(0, 256).map(n => cell(n, lucide[n].p, {}))));
writeFileSync(resolve(here, 'sheets/lucide-b.html'), sheet('Lucide preset · S 2 R 1.5 fillet 0 · same 256', names.slice(0, 256).map(n => cell(n, lucide[n].p, { P: { ...P, ...E.PRESETS.lucide } }))));
writeFileSync(resolve(here, 'sheets/lucide-solid.html'), sheet('Solid weight by the role heuristic · icons 1–192', names.slice(0, 192).map(n => cell(n, lucide[n].p, { weight: 'solid' }))));
const bcells = [];
for (const [n, ic] of Object.entries(beetle)) bcells.push(cell(n, ic.p, {}));
for (const id of E.ICON_ORDER) { bcells.push(cell(id + ' ·o', E.ICONS[id].make(P), {})); bcells.push(cell(id + ' ·s', E.ICONS[id].make(P), { weight: 'solid' })); }
writeFileSync(resolve(here, 'sheets/beetle.html'), sheet('Beetle set · the 95 app glyphs read from the code mirror, then the 12 parametric ones in both weights', bcells));
const scells = SCENARIOS.map(([sc, key]) => { const [set, name] = key.split(':'); const prims = set === 'lucide' ? lucide[name].p : set === 'beetle' ? beetle[name].p : E.ICONS[name].make(P); return cell(sc, prims, {}); });
writeFileSync(resolve(here, 'sheets/scenarios.html'), sheet(`Every scenario of the app · ${SCENARIOS.length} · outline`, scells, 14));
console.log('sheets written');
