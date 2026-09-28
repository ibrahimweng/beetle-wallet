/* The whole way in, driven through a browser against the exported web bundle,
   which is the same JavaScript the phone runs. It opens an account from the
   first loading screen to home, comes back to find the session kept, signs
   out, tries the doors that should be shut, and signs back in with the number
   the design is drawn around. Every screen on the way is photographed,
   including the ones that say no. Anything the page logs as an error fails
   the run.

     npx expo export --platform web --output-dir dist
     node test/flow.mjs dist            # the pictures land in shots/
*/
import { createServer } from 'http';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', process.argv[2] || 'dist');
const SHOTS = resolve(here, '..', process.env.SHOTS || 'shots');
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

/* The bundle is a single page, so every address serves index.html and the
   router reads the address once it is up — the same as any static host. */
const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(ROOT, url);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(ROOT, 'index.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
await mkdir(SHOTS, { recursive: true });

/* What this build accepts: see src/services. */
const CODE = '123456';
const NIN = '12345678900';
const DEMO_PHONE = '08032144471';
const NEW_PHONE = '08123456789';
const PASSCODE = '402917';

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', e => errors.push(`page: ${e.message}`));
page.on('console', m => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const t0 = Date.now();
const steps = [];
let n = 0;
async function shot(name, settle = 700) {
  await page.waitForTimeout(settle);
  const file = `${String(++n).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: join(SHOTS, file) });
  steps.push({ file, at: page.url().slice(base.length) || '/', t: Date.now() - t0 });
  console.log(`  ${file}`);
}
const see = text => page.getByText(text).first().waitFor();
/* the moment a screen's words are in the page at all, before it has arrived —
   what a trace of the arrival has to start from */
const arrives = text => page.waitForFunction(t => (document.body.innerText || '').includes(t), text, { polling: 16, timeout: 15000 });
const button = name => page.getByRole('button', { name, exact: true }).first();
const tap = name => button(name).click();
const type = async digits => {
  for (const d of digits) await tap(d);
};
const wipe = async count => {
  for (let i = 0; i < count; i++) await tap('Delete');
};
const at = path => {
  const now = page.url().slice(base.length).split('?')[0] || '/';
  if (now !== path) throw new Error(`Expected to be at ${path}, but the address is ${now}`);
};
/* How the screen is moving: every 40ms for `ms`, the opacity and blur of the
   first (or, `deep`, the innermost) element carrying a filter whose text
   includes `match`, and how many marks are still on their way in. The panes,
   swaps and resolving figures all carry a filter; the marks a scale. */
const motion = {};
async function trace(name, ms, matches, { since = Date.now(), picture } = {}) {
  const samples = [];
  const t0 = since;
  let taken = false;
  while (Date.now() - t0 < ms) {
    if (picture && !taken && Date.now() - t0 >= picture.at) {
      taken = true;
      await shot(picture.name, 0);
    }
    const s = await page.evaluate(ms => {
      const out = {};
      for (const [key, match, deep] of ms) {
        let found = null;
        for (const el of document.querySelectorAll('[style*="filter"]')) {
          if (!(el.innerText || '').replace(/\s+/g, ' ').includes(match)) continue;
          found = { opacity: +getComputedStyle(el).opacity, blur: +((el.style.filter.match(/blur\(([\d.]+)px\)/) || [])[1] || 0) };
          if (!deep) break;
        }
        out[key] = found;
      }
      let pending = 0;
      const what = [];
      for (const el of document.querySelectorAll('[style*="scale"]')) {
        const cs = getComputedStyle(el);
        if (+cs.opacity >= 0.99) continue;
        /* a screen underneath the one showing keeps its last look; only what is showing counts */
        if (el.closest('[aria-hidden="true"]') || !el.offsetParent) continue;
        pending++;
        if (what.length < 3) what.push(`${(el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24) || el.tagName} opacity ${cs.opacity} ${el.style.transform}`);
      }
      out.pending = pending;
      out.what = what;
      return out;
    }, matches);
    samples.push({ t: Date.now() - t0, ...s });
    await page.waitForTimeout(40);
  }
  motion[name] = samples;
  return samples;
}
const firstAt = (samples, key, test) => samples.find(x => x[key] && test(x[key]));
const must = (ok, what) => {
  if (!ok) throw new Error(`The motion is not as the motion file says: ${what}`);
};

/* The screen scrolls inside the page, so the bottom needs the list itself moved. */
const toBottom = () =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll('div')) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 4) el.scrollTop = el.scrollHeight;
    }
  });

try {
  console.log('Opening an account');
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByText('Beetle', { exact: true }).first().waitFor();
  await shot('boot', 250);
  await see('Open an account');
  await shot('welcome');

  /* the whole change traced from the tap, with a frame mid-way: the welcome
     softens out in 280ms, the number step sharpens in over 520ms */
  const tapped = Date.now();
  await tap('Open an account');
  const change = await trace('welcome-to-number', 1400, [['welcome', 'Open an account', false], ['number', 'Your number', false]], { since: tapped, picture: { at: 120, name: 'welcome-leaving' } });
  const gone = firstAt(change, 'welcome', w => w.opacity < 0.15);
  must(gone && gone.t <= 600, 'the welcome should be gone within 600ms of the tap');
  const soft = firstAt(change, 'number', n => n.blur > 1);
  must(soft, 'the number step should arrive out of a blur');
  const sharp = firstAt(change, 'number', n => n.opacity > 0.98 && n.blur < 0.05);
  must(sharp && sharp.t <= 1400, 'the number step should be sharp and whole within 1.4s');
  console.log(`  welcome gone at ${gone.t}ms, number step first seen ${soft.number.blur.toFixed(1)}px soft at ${soft.t}ms, sharp at ${sharp.t}ms`);
  await see('I will text you six digits');
  await shot('phone');
  await type('01234567890');
  await see('That is not a Nigerian mobile number');
  await shot('phone-not-nigerian');
  await wipe(11);
  await type(NEW_PHONE.slice(0, 10));
  await shot('phone-typed', 300);
  await type(NEW_PHONE.slice(10));

  await see('a moment ago');
  at('/code');
  await shot('code');
  await type('111111');
  await see('did not match');
  await shot('code-wrong');
  await type(CODE);

  await see('whichever you know');
  at('/identity');
  await shot('identity');
  await type('12340000123');
  await see('Nothing came back');
  await shot('no-match');
  await tap('Try again');
  await see('whichever you know');
  at('/identity');
  await type(NIN);

  await see('Ibrahim Musa');
  at('/confirm');
  await shot('confirm');
  await tap('Yes, that is me');
  await shot('confirm-leaving', 120);

  await see('Hold still and look at the camera');
  at('/face');
  await shot('face');
  await tap('Take it');
  await button('Hold still…').waitFor();
  await shot('face-checking', 100);

  await see('pick something nobody watching could guess');
  at('/passcode');
  await shot('passcode');
  await type('111');
  await shot('passcode-typing', 300);
  await type('111');
  await page.getByText(/too easy to guess|Not the same digit six times/).first().waitFor();
  await shot('passcode-weak');
  await type(PASSCODE);
  await see('The same six, to be sure');
  await shot('passcode-again');
  await type('402918');
  await see('They did not match');
  await shot('passcode-mismatch');
  await type(PASSCODE);
  await see('The same six, to be sure');
  await type(PASSCODE);

  await arrives('Your account is ready');
  at('/ready');
  const ticks = await trace('ready-ticks', 1300, [['ready', 'Your account is ready', false]], { picture: { at: 330, name: 'ready-landing' } });
  const early = ticks[0];
  const late = ticks[ticks.length - 1];
  must(early && early.pending >= 2, `the ticks should still be on their way at ${early?.t}ms (${early?.pending} pending)`);
  must(late && late.pending === 0, `every tick should have landed by ${late?.t}ms (${late?.pending} pending: ${late?.what?.join('; ')})`);
  const landed = ticks.map(x => x.pending);
  must(landed.every((v, i) => i === 0 || v <= landed[i - 1]), 'the ticks should land one after another, never un-land');
  must(new Set(landed).size >= 3, `the ticks should land one after another, not all at once (${landed.join(' ')})`);
  console.log(`  ${early.pending} marks on their way at ${early.t}ms, the last landed by ${ticks.find(x => x.pending === 0).t}ms (${ticks.map(x => `${x.t}:${x.pending}`).join(' ')})`);
  await shot('ready');
  await tap('Take me in');

  await see('Nothing has moved yet');
  at('/home');
  await shot('home-new');
  await toBottom();
  await shot('home-new-bottom');

  console.log('Coming back');
  /* opening the app again starts at the loading screen, which reads the
     session back and goes straight home */
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByText('Beetle', { exact: true }).first().waitFor();
  await shot('boot-again', 250);
  await see('Nothing has moved yet');
  at('/home');
  /* a step of the way in is not for somebody who is already in */
  await page.goto(`${base}/phone`, { waitUntil: 'load' });
  await see('Nothing has moved yet');
  at('/home');

  console.log('Signing out');
  await tap('Settings');
  await see('Open an account');
  at('/welcome');
  /* and home, or a later step, is not for somebody who is not */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('Open an account');
  at('/welcome');
  await page.goto(`${base}/passcode`, { waitUntil: 'load' });
  await see('Open an account');
  at('/welcome');

  console.log('Signing in');
  await tap('Sign in');
  await see('Welcome back');
  at('/sign-in');
  await shot('sign-in');
  await type('09020000000');
  await see('I do not know this number yet');
  await shot('sign-in-unknown');
  await wipe(11);
  await type(DEMO_PHONE);
  await see('On a phone I already know');
  at('/sign-in-code');
  await shot('sign-in-code');
  await type(CODE);

  await arrives('Money health');
  at('/home');
  const balance = await trace('home-balance', 1100, [['balance', '595,320', true]], { picture: { at: 220, name: 'home-resolving' } });
  const blurry = firstAt(balance, 'balance', b => b.blur > 1);
  const clear = firstAt(balance, 'balance', b => b.blur < 0.05 && b.opacity > 0.98);
  must(blurry, `the balance should resolve from a blur (first samples: ${balance.slice(0, 4).map(x => JSON.stringify(x)).join(' ')})`);
  must(clear && clear.t <= 1100, 'the balance should be clear within 1.1s');
  console.log(`  balance ${blurry.balance.blur.toFixed(1)}px soft at ${blurry.t}ms, clear at ${clear.t}ms`);
  await shot('home');
  await tap('In');
  await shot('home-in', 400);
  await tap('All');
  await toBottom();
  await shot('home-bottom');
} catch (e) {
  await page.screenshot({ path: join(SHOTS, '00-failed.png') }).catch(() => {});
  const text = await page.evaluate(() => document.body.innerText || '').catch(() => '');
  console.error(`\nStopped at ${page.url().slice(base.length) || '/'}: ${e.message}`);
  console.error(`On screen: ${text.replace(/\s+/g, ' ').slice(0, 400)}`);
  if (errors.length) console.error('The page logged:\n' + errors.map(x => '  ' + x).join('\n'));
  await b.close();
  server.close();
  process.exit(1);
}

await b.close();
server.close();

const real = errors.filter(e => !/favicon|React DevTools/i.test(e));
await writeFile(join(SHOTS, 'index.json'), JSON.stringify({ steps, motion, errors: real }, null, 2));
console.log(`\n${steps.length} screens in ${((Date.now() - t0) / 1000).toFixed(1)}s, in ${SHOTS}`);
if (real.length) {
  console.error('The page logged errors:\n' + real.map(e => '  ' + e).join('\n'));
  process.exit(1);
}
console.log('Nothing logged as an error.');
