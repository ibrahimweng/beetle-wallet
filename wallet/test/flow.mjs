/* The whole way in, driven through a browser against the exported web bundle,
   which is the same JavaScript the phone runs. It opens as the app does — the
   boot, then the welcome — opens an account from there to home, comes back
   to find the session kept, opens the lab from the version line in Settings
   and leaves it again, signs out, tries the doors that should be shut, signs
   back in with the number the design is drawn around, and then uses the lab
   to open a step deep in the way in and home on its own. Every screen on the way is
   photographed, including the ones that say no. Anything the page logs as an
   error fails the run.

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
const DEMO_PHONE = '08030000001';
const NEW_PHONE = '08123456789';
/* the owner's password since Round 30: the lab's own, which the demo account opens with too */
const PASSWORD = 'beetle321';
/* the owner's passcode since Round 32, again: the code backwards, which this build lets through */
const PASSCODE = '654321';

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
/* the app locks when it opens with an account signed in (Round 23); the walk opens it again and again, so the lab
   leaves the lock off for it, except where the walk looks at the lock itself */
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('beetle.walk.lock')) window.__BEETLE_NO_LOCK__ = true;
});
/* Sentient comes from Fontshare on a phone (src/design/fonts.ts); the checks stay off the network, so Beetle Sans
   stands in under its name, which is what a phone that cannot reach Fontshare draws anyway */
await ctx.route('https://cdn.fontshare.com/**', r =>
  r.fulfill({ path: join(here, '..', 'assets', 'fonts', 'BeetleSans-Regular.ttf'), contentType: 'font/ttf', headers: { 'access-control-allow-origin': '*' } }),
);
/* the details pane copies the account number; a browser has to be told that is allowed */
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
const page = await ctx.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', e => errors.push(`page: ${e.message}`));
/* while the walk has the browser offline, a resource that cannot load is the point, not an error */
let offline = false;
page.on('console', m => {
  if (m.type() === 'error' && !offline) errors.push(`console: ${m.text()}`);
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
/* the words, where they can be seen: a screen underneath the one showing keeps its words in the page, hidden */
const see = text => page.getByText(text).filter({ visible: true }).first().waitFor();
/* a sheet comes up on its curve, on the web as on the phone (Round 18): what is measured on one waits until the top
   sheet's grabber has stood still for a few frames */
const sheetStill = () =>
  page
    .waitForFunction(
      () => {
        const g = [...document.querySelectorAll('[data-testid="sheet-grabber"]')].pop();
        if (!g) return false;
        const y = Math.round(g.getBoundingClientRect().y);
        const same = window.__sheetY === y;
        window.__sheetY = y;
        window.__sheetSame = same ? (window.__sheetSame || 0) + 1 : 0;
        return window.__sheetSame >= 4;
      },
      null,
      { polling: 'raf', timeout: 3000 },
    )
    .catch(() => {});
/* the same, for words that are a thing's whole name: a card's title, where Beetle's own lines may carry the words too */
const seeExactly = text => page.getByText(text, { exact: true }).filter({ visible: true }).first().waitFor();
/* the moment a screen's words are in the page at all, before it has arrived —
   what a trace of the arrival has to start from */
const arrives = text => page.waitForFunction(t => (document.body.innerText || '').includes(t), text, { polling: 16, timeout: 15000 });
/* a receipt: the receipt sheet, up from the bottom over where it was paid from, the whole of it (Round 19) */
const receiptSheet = () => page.getByTestId('receipt-sheet').filter({ visible: true }).first().waitFor();
/* the passcode before money leaves, and where the payment goes past the day's line (the demo's day, as its frames
   draw it, has ₦84,000 out already; Round 23 keeps the caps), the three words typed in full after it, as What
   happens at the line shows */
const pay = async () => {
  /* the six digits again since Round 32 (the owner's word), behind the face or the fingerprint where there is one */
  for (const d of PASSCODE) await tap(d);
  const words = page.getByTestId('past-limit').filter({ visible: true }).first();
  const gone = page
    .getByTestId('passcode')
    .first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .then(
      () => 'gone',
      () => 'stuck',
    );
  const asked = words.waitFor({ timeout: 8000 }).then(
    () => 'words',
    () => 'none',
  );
  if ((await Promise.race([gone, asked])) !== 'words') return false;
  await page.getByTestId('past-limit-words').filter({ visible: true }).first().fill('Confirm this transaction');
  await words.getByRole('button', { name: /^Confirm / }).click();
  return true;
};
/* and put away with Done: the sheet goes down, then back to where the paying started */
const receiptDone = async () => {
  await page.getByTestId('receipt-sheet').getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByTestId('receipt-sheet').waitFor({ state: 'detached' });
  await page.waitForTimeout(400);
};
/* a line on Activities, opened in place (Round 17), put away: a tap on the frost above it, near the top of the screen
   (the frost lies in the page's column, round the line, so where its box starts depends on how far it has scrolled) */
const closeInPlace = async () => {
  await page.getByTestId('in-place-away').filter({ visible: true }).first().waitFor();
  await page.mouse.click(200, 60);
  await page.waitForTimeout(700);
};
/* a covered page keeps its buttons in the page, hidden: only the one that can be seen is pressed */
const button = name => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
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
/* Home, Activities and Settings are three pages side by side at /home: the one showing */
const showing = () =>
  page.evaluate(
    () =>
      ['home', 'activities', 'settings'].find(t => {
        const e = document.querySelector(`[data-testid="page-${t}"]`);
        return e && getComputedStyle(e).display !== 'none' && e.getAttribute('aria-hidden') !== 'true';
      }) ?? null,
  );
const onPage = async tab => {
  /* pages slide now: the one going can still be in sight while the address moves on */
  for (let i = 0; i < 40 && (page.url().slice(base.length).split('?')[0] || '/') !== '/home'; i++) await page.waitForTimeout(100);
  at('/home');
  for (let i = 0; i < 20; i++) {
    if ((await showing()) === tab) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`Expected the ${tab} page to be showing, but it is ${await showing()}`);
};
/* a finger across the screen, in steps, then a beat for whatever it moved to settle */
const drag = async (x0, y0, x1, y1, steps = 14) => {
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(800);
};
/* the words each home shows: the demo's Loan card, and a new account's Savings card */
const DEMO_HOME = 'Borrow up to';
const NEW_HOME = 'Start a goal';
/* Home on the bar, under the open chat: the card goes back up */
const backToHome = async () => {
  await page.getByTestId('glyph-home').click();
  const closed = await page
    .waitForFunction(() => (document.querySelector('[data-testid="card"]')?.getBoundingClientRect().height ?? 999) < 420, null, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  must(closed, 'Home on the bar should close the open chat');
};
/* the amount picker: the figure tapped, and the amount typed in place */
const typeAmount = async figure => {
  await page.getByTestId('amount-figure').filter({ visible: true }).first().click();
  const field = page.getByTestId('amount-field').filter({ visible: true }).first();
  await field.fill(String(figure));
  await field.press('Enter');
  await page.waitForTimeout(300);
};
/* the chat showing beside the drawer, tapped: the drawer goes back out */
const closeChats = async () => {
  const beside = button('Back to the chat');
  const box = await beside.boundingBox();
  must(box, 'the chat beside the drawer should answer a tap');
  await beside.click({ position: { x: box.width - 24, y: box.height / 2 } });
  await page.getByTestId('chats-drawer').getByRole('button', { name: 'New chat', exact: true }).waitFor({ state: 'hidden' });
};
/* the chats drawer, in from the open chat's left edge */
const openChats = async () => {
  await tap('Your chats');
  await page.getByTestId('chats-drawer').getByRole('button', { name: 'New chat', exact: true }).waitFor();
  await page.waitForTimeout(500);
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
    /* the picture mid-way, once there is a sample to stand before it: a
       picture can take longer than the movement, and must not leave the
       trace without its start */
    if (picture && !taken && samples.length && Date.now() - t0 >= picture.at) {
      taken = true;
      await shot(picture.name, 0);
    }
    const s = await page.evaluate(ms => {
      const out = {};
      const look = el => ({
        opacity: +getComputedStyle(el).opacity,
        blur: +((el.style.filter.match(/blur\(([\d.]+)px\)/) || [])[1] || 0),
        height: el.getBoundingClientRect().height,
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
        size: parseFloat(getComputedStyle(el).fontSize),
      });
      for (const [key, match, deep] of ms) {
        let found = null;
        if (match.startsWith('[')) {
          /* a selector: the element itself; ending ':last', the last of them in the page (the screen on top) */
          const el = match.endsWith(':last') ? [...document.querySelectorAll(match.slice(0, -5))].pop() : document.querySelector(match);
          found = el ? look(el) : null;
        } else {
          for (const el of document.querySelectorAll('[style*="filter"]')) {
            if (!(el.innerText || '').replace(/\s+/g, ' ').includes(match)) continue;
            found = look(el);
            if (!deep) break;
          }
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
const firstAt = (samples, key, test, after = -1) => samples.find(x => x.t > after && x[key] && test(x[key]));
const must = (ok, what) => {
  if (!ok) throw new Error(`The motion is not as the motion file says: ${what}`);
};

/* The screen scrolls inside the page, so the bottom needs the list itself moved. */
/* a switch on the page, once it reads as on or off */
const switched = (name, on) =>
  page.waitForFunction(([n, w]) => [...document.querySelectorAll(`[role="switch"][aria-label="${n}"]`)].pop()?.getAttribute('aria-checked') === w, [name, String(on)], { timeout: 5000 });
const toTop = () =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll('div')) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollTop > 0) el.scrollTop = 0;
    }
  });
const toBottom = () =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll('div')) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 4) el.scrollTop = el.scrollHeight;
    }
  });

try {
  console.log('The front door');
  /* the app opens as itself: the boot, and on a new phone the welcome */
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByTestId('boot').first().waitFor();
  await shot('boot', 250);

  console.log('Opening an account');
  await see('Sign up');
  await see('Log in');
  at('/way-in');
  await shot('welcome');

  /* the whole change traced from the tap, with a frame mid-way: the welcome
     softens out in 280ms, the number step sharpens in over 520ms */
  const tapped = Date.now();
  await tap('Sign up');
  /* the welcome's buttons leave (the first thing on its way out), and the
     new title arrives out of a blur */
  const change = await trace(
    'welcome-to-number',
    1400,
    [
      ['welcome', '[data-testid="leaving"]', false],
      ['number', '[data-testid="title"]', false],
    ],
    { since: tapped, picture: { at: 120, name: 'welcome-leaving' } },
  );
  /* gone: faded to nothing, or already taken down after fading (the picture
     mid-way can take longer than the fade itself, so the first sample may
     come after it has gone: it was there for the tap, and the picture has it
     leaving) */
  const seen = change.findIndex(x => x.welcome);
  const gone = change.find((x, i) => i > seen && (!x.welcome || x.welcome.opacity < 0.15));
  must(
    gone && gone.t <= 600,
    `the welcome should be gone within 600ms of the tap (samples: ${change
      .slice(0, 12)
      .map(x => `${x.t}:${x.welcome ? x.welcome.opacity.toFixed(2) + '/' + x.welcome.blur.toFixed(1) : '-'}`)
      .join(' ')})`,
  );
  const soft = firstAt(change, 'number', n => n.blur > 1);
  must(soft, 'the number step should arrive out of a blur');
  const sharp = firstAt(change, 'number', n => n.opacity > 0.98 && n.blur < 0.05, soft.t);
  must(sharp && sharp.t <= 1400, 'the number step should be sharp and whole within 1.4s');
  console.log(`  welcome gone at ${gone.t}ms, number step first seen ${soft.number.blur.toFixed(1)}px soft at ${soft.t}ms, sharp at ${sharp.t}ms`);
  /* every step is named for what it asks (Round 30) */
  await seeExactly('Enter mobile number');
  await see('I will text it a code');
  /* every Back is at the bottom left (Round 31, the owner's word): on a step that types digits it is the pad's own corner */
  const backAt = await page.getByTestId('back').filter({ visible: true }).first().boundingBox();
  must(backAt && backAt.x < 120 && backAt.y > 600, `Back should be at the bottom left (${JSON.stringify(backAt)})`);
  must((await page.getByRole('button', { name: 'Back', exact: true }).filter({ visible: true }).count()) === 1, 'there should be one Back, not one at the top as well');
  await shot('phone');
  /* the privacy notice before anything is kept (Round 32), a page to read, and Back to where it was */
  await page.getByRole('link', { name: 'Privacy notice' }).first().click();
  await see('Your rights');
  await see('ndpc.gov.ng');
  await shot('privacy-notice', 600);
  await tap('Back');
  await seeExactly('Enter mobile number');
  /* the email instead, and back */
  await tap('Use email instead');
  await seeExactly('Enter email');
  await page.getByTestId('email').first().fill('not an email');
  must(await button('Send the code').isDisabled(), 'Send the code should wait for an email');
  await page.getByTestId('email').first().fill('ibrahim.musa@example.com');
  await tap('Send the code');
  await see('This email already has a Beetle account');
  await button('Log in with this email').waitFor();
  await shot('email-taken');
  await tap('Use mobile number instead');
  await seeExactly('Enter mobile number');
  /* Google, as a stand-in for its own sheet: a name and a checked email, and back */
  await tap('Google');
  await seeExactly('Continue with Google');
  await see('Continue as Ibrahim');
  await shot('provider-google');
  await tap('Back');
  await seeExactly('Enter mobile number');
  await type('01234567890');
  await see('That is not a Nigerian mobile number');
  await shot('phone-not-nigerian');
  await wipe(11);
  await type(NEW_PHONE.slice(0, 10));
  await shot('phone-typed', 300);
  await type(NEW_PHONE.slice(10));

  await seeExactly('OTP verification');
  await see('Enter the six digits sent to 0812 345 6789');
  at('/way-in');
  await shot('code');
  await type('111111');
  await see('did not match');
  await shot('code-wrong');
  await type(CODE);

  /* your details, typed as they are on the BVN or NIN (Round 32): nothing on the record is shown to whoever types */
  await seeExactly('Your details');
  at('/way-in');
  await shot('details');
  must(await button('Continue').isDisabled(), 'Continue should wait for a name and a date');
  await page.getByTestId('full-name').first().fill('Ibrahim Musa');
  await page.getByTestId('dob').first().fill('14062016');
  must((await page.getByTestId('dob').first().inputValue()) === '14/06/2016', 'the date should be shown as DD/MM/YYYY as it is typed');
  await tap('Continue');
  await see('18 or older');
  await shot('details-young');
  await page.getByTestId('dob').first().fill('14061996');
  await shot('details-typed', 300);
  await tap('Continue');

  /* the BVN or the NIN, picked; held to the details, and a miss said without saying why */
  await seeExactly('BVN number');
  at('/way-in');
  await shot('bvn');
  await page.getByRole('radio', { name: 'NIN', exact: true }).first().click();
  await seeExactly('NIN number');
  await page.getByRole('radio', { name: 'BVN', exact: true }).first().click();
  await seeExactly('BVN number');
  await type('12340000123');
  await seeExactly('Nothing matched');
  await see('2 more tries');
  /* nothing on the record is shown for a miss: not the name as the register writes it, not the birthday */
  must(
    (await page
      .getByText(/MUSA IBRAHIM|Born 14/)
      .filter({ visible: true })
      .count()) === 0,
    'a miss should give nobody’s details away',
  );
  await shot('no-match');
  /* the shortcut: a photo of a NIN slip or a voter's card, held to the same details */
  await tap('Use a photo of my NIN slip or voter’s card');
  await seeExactly('NIN slip or voter’s card');
  await shot('document');
  await page.getByRole('radio', { name: 'Voter’s card' }).first().click();
  await tap('Take a photo');
  await seeExactly('Password');
  await see('Voter’s card');
  await shot('password-after-document');
  /* and back, to the BVN, the way most come */
  await tap('Back');
  await seeExactly('BVN number');
  await type(NIN);

  /* a password: the rules tick as they are met, a weak one is refused, a good one goes on */
  await seeExactly('Password');
  at('/way-in');
  await shot('password');
  must(await button('Continue').isDisabled(), 'Continue should wait for a password that meets the rules');
  await page.getByTestId('password').first().fill('ibrahim1996');
  await shot('password-typing', 300);
  await tap('Continue');
  await see('Not your name');
  await shot('password-weak');
  await page.getByTestId('password').first().fill(PASSWORD);
  await tap('Continue');

  /* the passcode (Round 32): six digits, twice, the weak ones refused, right before the face scan */
  await seeExactly('Create passcode');
  at('/way-in');
  await shot('passcode');
  await type('111');
  await shot('passcode-typing', 300);
  await type('111');
  await page
    .getByText(/too easy to guess|Not the same digit six times/)
    .first()
    .waitFor();
  await shot('passcode-weak');
  await type(PASSCODE);
  await seeExactly('Confirm passcode');
  await shot('passcode-again');
  await type('654322');
  await see('They did not match');
  await shot('passcode-mismatch');
  await type(PASSCODE);
  await seeExactly('Confirm passcode');
  await type(PASSCODE);

  /* the last step: the yes to the scan, the face and the username on one screen */
  await seeExactly('Face scan and username');
  at('/way-in');
  await see('$ibrahimmusa is yours to take');
  await shot('finish');
  /* and back from it, to the passcode and on again (Round 31: there was no way back from here) */
  await tap('Back');
  await seeExactly('Create passcode');
  await type(PASSCODE);
  await type(PASSCODE);
  await seeExactly('Face scan and username');
  await see('$ibrahimmusa is yours to take');
  must(await button('Open my account').isDisabled(), 'Open my account should wait for the face');
  await page.getByTestId('username').first().fill('tobi');
  await see('$tobi is taken');
  await page.getByTestId('username').first().fill('ibrahimmusa');
  await see('$ibrahimmusa is yours to take');
  /* a face is sensitive data: the scan waits for the yes */
  await tap('Scan my face');
  await see('Tick the box first');
  await page.getByTestId('face-consent').first().click();
  await tap('Scan my face');
  await see('Face scanned');
  await shot('finish-ready', 300);
  await tap('Open my account');

  await arrives('Your account is ready');
  at('/way-in');
  const ticks = await trace('ready-ticks', 1300, [['ready', 'Your account is ready', false]], { picture: { at: 330, name: 'ready-landing' } });
  const early = ticks[0];
  const late = ticks[ticks.length - 1];
  must(early && early.pending >= 2, `the ticks should still be on their way at ${early?.t}ms (${early?.pending} pending)`);
  must(late && late.pending === 0, `every tick should have landed by ${late?.t}ms (${late?.pending} pending: ${late?.what?.join('; ')})`);
  const landed = ticks.map(x => x.pending);
  must(
    landed.every((v, i) => i === 0 || v <= landed[i - 1]),
    'the ticks should land one after another, never un-land',
  );
  must(new Set(landed).size >= 3, `the ticks should land one after another, not all at once (${landed.join(' ')})`);
  console.log(`  ${early.pending} marks on their way at ${early.t}ms, the last landed by ${ticks.find(x => x.pending === 0).t}ms (${ticks.map(x => `${x.t}:${x.pending}`).join(' ')})`);
  await shot('ready');
  await tap('Take me in');

  /* done (Round 28): the steps leave, the coin comes to the middle and breathes for two seconds while the account
     is opened and home is put together under the dark; then the dark opens onto home in an oval, and a new
     account's tour begins */
  await page.getByTestId('cover').first().waitFor();
  await shot('home-arriving', 1200);
  must((await page.getByTestId('tour').count()) === 0, 'the tour should wait for the dark to open onto home');
  await page.getByTestId('tour-tip').first().waitFor({ timeout: 8000 });
  must((await page.getByTestId('cover').count()) === 0, 'the dark should be gone once the tour begins');
  await see(NEW_HOME);
  await onPage('home');
  await shot('tour-card');
  for (const [step, name] of [
    ['2 of 4', 'tour-send-receive'],
    ['3 of 4', 'tour-activities'],
    ['4 of 4', 'tour-ask'],
  ]) {
    must(await page.getByTestId('tour-skip').isVisible(), 'Skip should be at the top on every step of the tour');
    await tap('Next');
    await see(step);
    await shot(name, name === 'tour-ask' ? 1500 : 800);
  }
  /* Skip, from the last step: the chat the tour opened closes, and home is as it was */
  await tap('Skip');
  await page.getByTestId('tour').waitFor({ state: 'detached' });
  await shot('home-new');

  console.log('Coming back');
  /* opening the app again starts at the loading screen; the session was
     kept, so it goes home, and the way in is not for somebody who is already
     in: it sends them home too */
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByTestId('boot').first().waitFor();
  await shot('boot-again', 250);
  await see(NEW_HOME);
  await onPage('home');
  await page.goto(`${base}/way-in`, { waitUntil: 'load' });
  await see(NEW_HOME);
  await onPage('home');

  console.log('The lab, behind the version line');
  /* the card carries no mark (Settings is the gear on the bar) and, since the owner's Round 14 frame, no word Wallet */
  must((await page.getByTestId('mark').count()) === 0, 'the card should carry no mark: Settings is on the bar');
  must((await page.getByTestId('wallet').count()) === 0, 'the card should carry no word Wallet (Round 14)');
  /* Send and Receive are white pills, 100 by 36, 24 apart (Round 14) */
  /* both measured in the same moment: the page may still be sliding in */
  const pills = await page.evaluate(() =>
    ['send-pill', 'receive-pill'].map(id => {
      const r = document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect();
      return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
    }),
  );
  must(
    pills.every(p => p && Math.round(p.width) === 100 && Math.round(p.height) === 36),
    `Send and Receive should be 100 by 36 pills (${JSON.stringify(pills)})`,
  );
  must(pills[0] && pills[1] && Math.round(pills[1].x - pills[0].x - pills[0].width) === 24, 'with 24 between them');
  /* the gear on the bar turns to Settings; a long press on the version line
     at its foot opens the lab, and the tab back to it comes with it; Leave
     the lab puts the tab away and goes back into the app */
  await tap('Settings');
  await see('What keeps the money yours');
  await onPage('settings');
  must((await page.getByRole('button', { name: 'Back to the lab', exact: true }).count()) === 0, 'nothing of the lab should show before it is opened');
  await page.getByTestId('version').click({ delay: 900 });
  await see('Beetle Lab');
  at('/lab');
  await shot('lab');
  await tap('Leave the lab');
  await see(NEW_HOME);
  await onPage('home');
  must((await page.getByRole('button', { name: 'Back to the lab', exact: true }).count()) === 0, 'the tab should go with Leave the lab');

  console.log('Signing out');
  /* Sign out is in Settings */
  await tap('Settings');
  await see('What keeps the money yours');
  await onPage('settings');
  await tap('Sign out');
  /* it asks first: what signing out does, Sign out in red, and Cancel */
  await see('Sign out of Beetle?');
  await shot('sign-out-ask');
  await page.getByTestId('confirm-sign-out').getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByText('Sign out of Beetle?').waitFor({ state: 'hidden' });
  await onPage('settings');
  await tap('Sign out');
  await page.getByTestId('confirm-sign-out').getByRole('button', { name: 'Sign out', exact: true }).click();
  await see('Sign up');
  at('/way-in');
  /* and home, or a later step, is not for somebody who is not */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('Sign up');
  at('/way-in');
  /* and an address that is not a screen goes back to the start: the boot, and the way in */
  await page.goto(`${base}/passcode`, { waitUntil: 'load' });
  await see('Sign up');
  at('/way-in');

  console.log('Logging in');
  await page.goto(`${base}/way-in`, { waitUntil: 'load' });
  await see('Sign up');
  await tap('Log in');
  /* this phone knows the account opened on it a moment ago: Face ID alone, or another account */
  await see('Welcome back, Ibrahim');
  await button('Log in with your passkey').waitFor();
  at('/way-in');
  await shot('log-in-known');
  await tap('Use another account');
  await seeExactly('Log in');
  await see('A code comes next, then your password');
  await shot('sign-in');
  await type('09020000000');
  await see('There is no account on this number yet');
  await shot('sign-in-unknown');
  await wipe(11);
  await type(DEMO_PHONE);
  await seeExactly('OTP verification');
  at('/way-in');
  await shot('sign-in-code');
  await type(CODE);
  /* the password, and on a phone the account has not been on, the face once */
  await seeExactly('Enter password');
  await shot('sign-in-password');
  await page.getByTestId('password').first().fill('wrongpass1');
  await tap('Log in');
  await see('That is not the password');
  await shot('sign-in-password-wrong');
  await page.getByTestId('password').first().fill(PASSWORD);
  await tap('Log in');
  await seeExactly('Face scan');
  await see('This phone is new to your account');
  await shot('sign-in-face');
  await tap('Scan my face');

  await arrives(DEMO_HOME);
  at('/home');
  /* signed in, the coin breathes in the middle and the dark opens onto home (Round 28); the balance comes into focus
     as it opens, so it is seen */
  await page.getByTestId('cover').first().waitFor();
  await page.getByTestId('arrival-opening').waitFor({ timeout: 10000 });
  const balance = await trace('home-balance', 1100, [['balance', '595,320', true]], { picture: { at: 220, name: 'home-resolving' } });
  const blurry = firstAt(balance, 'balance', b => b.blur > 1);
  const clear = firstAt(balance, 'balance', b => b.blur < 0.05 && b.opacity > 0.98);
  must(
    blurry,
    `the balance should resolve from a blur (first samples: ${balance
      .slice(0, 4)
      .map(x => JSON.stringify(x))
      .join(' ')})`,
  );
  must(clear && clear.t <= 1100, 'the balance should be clear within 1.1s');
  console.log(`  balance ${blurry.balance.blur.toFixed(1)}px soft at ${blurry.t}ms, clear at ${clear.t}ms`);
  await shot('home');
  /* the bar (Round 13): no white under it; Home, Activities and Settings in a rounded pill of frosted glass that hugs them, the plus beside it */
  const bar = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="bar"]');
    const pill = document.querySelector('[data-testid="bar-pill"]')?.getBoundingClientRect();
    return { ground: el ? getComputedStyle(el).backgroundColor : null, pill: pill ? { w: Math.round(pill.width), h: Math.round(pill.height) } : null };
  });
  must(bar.ground === 'rgba(0, 0, 0, 0)', `the bar should have no white under it (${bar.ground})`);
  must(bar.pill && bar.pill.h === 56 && bar.pill.w === 144, `the glyphs should sit in a 144 by 56 pill (${JSON.stringify(bar.pill)})`);
  /* under the black card, four cards two by two, Fuse's way: Savings with its ring and how it is going, Loan, Card, and Services */
  await see('Holiday · 33%');
  await see('A fortnight ahead');
  await see('•••• 4471');
  /* the Services card starts on All services (Round 13) */
  await see('Bills, airtime, data and more');
  must((await page.getByText('See all').count()) === 0, 'the record should have left home for Activities');
  must((await page.getByTestId('grid-savings').boundingBox())?.height === 152, 'the cards are 152 tall');
  /* the offers, inside the black card since Round 15: 36 under Send and Receive, the grabber 24 under them and 16 over the
     card's edge, the card 392 tall; one at a time, with its dots; a swipe across it brings the next, and the pages stay */
  const promo = await page.getByTestId('promo-card').boundingBox();
  const grid = await page.getByTestId('grid-savings').boundingBox();
  const offersAt = await page.evaluate(() => {
    const r = sel => document.querySelector(sel)?.getBoundingClientRect();
    const card = r('[data-testid="card"]'),
      pill = r('[data-testid="send-pill"]'),
      offer = r('[data-testid="promo-card"]'),
      grab = r('[data-testid="grabber"]');
    return card && pill && offer && grab
      ? { card: Math.round(card.height), under: Math.round(offer.y - pill.bottom), grab: Math.round(grab.y - offer.bottom), foot: Math.round(card.bottom - grab.bottom) }
      : null;
  });
  must(
    offersAt && offersAt.card === 392 && offersAt.under === 36 && offersAt.grab === 24 && offersAt.foot === 16,
    `the offers should sit in the black card as the frame has them (${JSON.stringify(offersAt)})`,
  );
  must(promo && grid && Math.round(grid.y - (promo.y + promo.height)) === 24 + 4 + 16 + 24, 'and the four cards 24 under the card');
  /* the four cards 24 apart both ways (Round 15) */
  const apart = await page.evaluate(() => {
    const r = id => document.querySelector(`[data-testid="grid-${id}"]`)?.getBoundingClientRect();
    const a = r('savings'),
      b = r('loan'),
      c = r('card');
    return a && b && c ? { across: Math.round(b.x - a.right), down: Math.round(c.y - a.bottom) } : null;
  });
  must(apart && apart.across === 24 && apart.down === 24, `the four cards should be 24 apart both ways (${JSON.stringify(apart)})`);
  /* on the dark card: the title in the paper and the line under it in a soft shade of the offer's own colour, both 12 on 16 */
  const offerWords = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="promo-save"] *')]
      .filter(e => e.childElementCount === 0 && e.textContent.trim())
      .map(e => {
        const c = getComputedStyle(e);
        return `${c.fontSize}/${c.lineHeight} ${c.color}`;
      }),
  );
  must(offerWords[0] === '12px/16px rgb(251, 239, 227)' && offerWords[1] === '12px/16px rgb(90, 153, 96)', `the offer's words should be the paper over its soft green (${offerWords})`);
  /* its dots inside it at its bottom right, and its × at its top right (Round 14) */
  const promoDots = await page.getByTestId('promo-dots').boundingBox();
  must(
    promoDots && promoDots.y + promoDots.height <= promo.y + promo.height && promoDots.x + promoDots.width <= promo.x + promo.width && promoDots.x > promo.x + promo.width / 2,
    'the promo card should carry its dots inside, at its bottom right',
  );
  const promoX = await page.getByTestId('promo-close').boundingBox();
  must(promoX && promoX.y < promo.y + promo.height / 2 && promoX.x > promo.x + promo.width / 2, 'and its × at its top right');
  await see('Save in four taps');
  const promoLabel = () => page.getByTestId('promo-card').getAttribute('aria-label');
  await drag(promo.x + promo.width - 12, promo.y + promo.height / 2, promo.x + 12, promo.y + promo.height / 2 + 2);
  await onPage('home');
  must((await promoLabel()) === 'Borrow up to ₦250,000', `a swipe across the promo card should bring the next (it says ${await promoLabel()})`);
  await shot('home-promo-next', 300);
  /* the × puts the offers away until Beetle next opens, and the empty card takes their place, so the black card keeps
     its shape and nothing under it moves (Round 16, the owner's word) */
  const gridBefore = (await page.getByTestId('grid-savings').boundingBox())?.y ?? 0;
  await page.getByTestId('promo-close').click();
  await page.waitForTimeout(900);
  must((await page.getByTestId('promos').count()) === 0, 'the × should put the offers away');
  await see('No promos');
  const gridAfter = (await page.getByTestId('grid-savings').boundingBox())?.y ?? 0;
  must(Math.round(gridBefore) === Math.round(gridAfter), `and nothing under the card should move (${gridBefore} to ${gridAfter})`);
  const kept = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="card"]')?.getBoundingClientRect(),
      empty = document.querySelector('[data-testid="promo-quiet"]')?.getBoundingClientRect();
    return card && empty ? { card: Math.round(card.height), at: Math.round(empty.y), h: Math.round(empty.height) } : null;
  });
  must(kept && kept.card === 392 && kept.at === 264 && kept.h === 84, `the empty card should stand where the offers were, the black card still 392 (${JSON.stringify(kept)})`);
  must((await page.getByTestId('promo-close').count()) === 0 && (await page.getByTestId('promo-dots').count()) === 0, 'the empty card has no × and no dots');
  await shot('home-promos-away', 0);
  /* the four cards open sheets, and a page opened from a sheet comes up as a sheet over it, the one under
     stepping back; Back puts away the one on top (Round 14, the owner's word) */
  await page.getByTestId('services-all').click();
  await see('Everything you can pay for from here');
  await page.waitForTimeout(700);
  await page.locator('[data-testid="most"] [aria-label="Airtime"]').filter({ visible: true }).last().click();
  await see('Buy airtime');
  await page.waitForTimeout(900);
  const stacked = await page.evaluate(() => [...document.querySelectorAll('[data-testid="sheet-grabber"]')].map(g => Math.round(g.getBoundingClientRect().y)));
  must(stacked.length === 2 && stacked[0] < stacked[1], `Airtime should come up as a sheet over the Services sheet, which steps back (grabbers at ${stacked})`);
  await shot('sheet-over-sheet', 0);
  await tap('Back');
  await page.waitForTimeout(900);
  must((await page.locator('[data-testid="sheet-grabber"]').count()) === 1, 'Back should put away only the sheet on top');
  await see('Everything you can pay for from here');
  await tap('Back');
  await page.waitForTimeout(900);
  await onPage('home');
  /* the Services card swipes through Bills, Airtime and Data inside itself: the swipe is the card's, and the pages stay */
  const strip = await page.getByTestId('services-strip').boundingBox();
  const servicesLabel = () => page.getByTestId('services-strip').getAttribute('aria-label');
  must((await servicesLabel()) === 'All services', 'the Services card should start on All services');
  await drag(strip.x + strip.width - 12, strip.y + 40, strip.x + 12, strip.y + 42);
  await onPage('home');
  must((await servicesLabel()) === 'Services: Bills', `one swipe should bring Bills (it says ${await servicesLabel()})`);
  await shot('home-services-bills', 300);
  await drag(strip.x + strip.width - 12, strip.y + 40, strip.x + 12, strip.y + 42);
  must((await servicesLabel()) === 'Services: Airtime', `two swipes should bring Airtime (it says ${await servicesLabel()})`);
  await drag(strip.x + strip.width - 12, strip.y + 40, strip.x + 12, strip.y + 42);
  must((await servicesLabel()) === 'Services: Data', `three swipes should bring Data (it says ${await servicesLabel()})`);
  /* anywhere else a swipe to the left turns the pages on: Activities, then Settings, and no further; a swipe to the right comes back.
     On home the swipe is taken across Savings and Loan, clear of the cards that swipe themselves */
  const row = (await page.getByTestId('grid-savings').boundingBox()) ?? grid;
  const across = Math.round(row.y + row.height / 2);
  await drag(340, across, 60, across + 5);
  await onPage('activities');
  await shot('pages-activities', 300);
  await drag(340, 450, 60, 455);
  await onPage('settings');
  await drag(340, 450, 60, 455);
  await onPage('settings');
  await drag(60, 450, 340, 455);
  await onPage('activities');
  /* a drag short of a third of the way settles back */
  await drag(300, 450, 240, 455);
  await onPage('activities');
  await tap('Home');
  await onPage('home');

  console.log('Pulling the card down');
  /* the day scrolls back to the top; a pull on the card from there opens the
     chat: the card grows until only the head of the day and its chips show
     below it, while the figure glides up into the header, shrinking from 32
     to 20 */
  const pull = async (name, traced) => {
    await toTop();
    await page.waitForTimeout(400);
    const grab = await page.getByTestId('grabber').boundingBox();
    must(grab, 'the grabber should be on the card');
    const gx = grab.x + grab.width / 2;
    const gy = grab.y;
    const pulled = Date.now();
    /* the finger and the trace run together, so the drag itself is in the samples. It sets off in small steps, as a
       finger does: the grabber sits 20 over the card's edge (Round 15), and on the web the pull is only taken up while
       the pointer is still on the card */
    const finger = (async () => {
      await page.mouse.move(gx, gy);
      await page.mouse.down();
      for (const dy of [6, 12, 18]) {
        await page.mouse.move(gx, gy + dy);
        await page.waitForTimeout(40);
      }
      for (let i = 1; i <= 16; i++) {
        await page.mouse.move(gx, gy + 18 + i * 22);
        await page.waitForTimeout(40);
      }
      await page.mouse.up();
    })();
    const samples = traced
      ? await trace(
          name,
          1500,
          [
            ['card', '[data-testid="card"]', false],
            ['figure', '[data-testid="balance"]', false],
          ],
          { since: pulled, picture: { at: 420, name: 'home-pulling' } },
        )
      : null;
    await finger;
    if (!samples) await page.waitForTimeout(900);
    return samples;
  };
  /* a push up closes it: on the chat once it is at its end, or on the day below */
  const pushUp = async (x, y) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(x, y - i * 26);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
  };
  const opening = await pull('card-opening', true);
  const first = opening[0];
  const last = opening[opening.length - 1];
  must(first && first.card && first.card.height < 420, `the card should start closed (${first?.card?.height}px)`);
  must(last && last.card && last.card.height >= 720 && last.card.height <= 780, `the card should open until just over the bar (${last?.card?.height}px)`);
  must(last.figure && last.figure.size <= 21, `the figure should have shrunk into the header (${last.figure?.size}px)`);
  const grew = opening.map(x => Math.round(x.card?.height ?? 0));
  must(new Set(grew).size >= 4, `the card should grow through the drag, not jump (${grew.join(' ')})`);
  console.log(`  card ${grew[0]} → ${grew[grew.length - 1]}px, figure ${opening[0].figure?.size} → ${last.figure.size}px`);
  /* the reading in dollars sits after the figure in the header now, and the
     head of the day with its chips still shows under the card */
  const chip = await page.getByRole('button', { name: 'Your dollars', exact: true }).filter({ visible: true }).last().boundingBox();
  const fig = await page.getByTestId('balance').boundingBox();
  /* the figure takes the word Wallet's place at the header's left edge, and the chip follows it */
  must(fig && fig.x < 24 && fig.y < 80, `the figure should sit at the header's left edge (at ${fig?.x},${fig?.y})`);
  must(
    chip && fig && chip.x >= fig.x + fig.width && chip.y < 80,
    `the dollars chip should sit after the figure in the header (at ${chip?.x},${chip?.y}; the figure ends at ${fig ? fig.x + fig.width : '?'})`,
  );
  /* Bills, Data and Services as chips, left-aligned right on top of the ask bar inside the card; and under
     the card the same bar as everywhere, the way round the app */
  const chips = await page.getByTestId('chat-chips').boundingBox();
  const askBar = await page.getByTestId('ask-bar').boundingBox();
  must(
    chips && askBar && chips.y + chips.height <= askBar.y && askBar.y - (chips.y + chips.height) <= 14 && Math.abs(chips.x - askBar.x) < 2,
    `the chips should sit left-aligned right on top of the ask bar (${JSON.stringify(chips)} over ${JSON.stringify(askBar)})`,
  );
  const homeGlyph = await page.getByTestId('glyph-home').boundingBox();
  must(homeGlyph && homeGlyph.y > last.card.height, `the bar should stay under the open chat (Home at ${homeGlyph?.y}, the card ${last.card.height} tall)`);
  /* and down the chat's left edge the soft light the chats drawer comes in from */
  const edge = await page.getByTestId('chats-edge').boundingBox();
  must(edge && edge.x === 0 && edge.width <= 20 && edge.height > 300, `a soft edge should run down the chat's left side (${JSON.stringify(edge)})`);
  await shot('home-chat-open');
  /* the bar works with the chat open: Activities turns the page and leaves the chat as it is; Home once comes back to it */
  await page.getByTestId('glyph-activities').click();
  await onPage('activities');
  await page.getByTestId('glyph-home').click();
  await onPage('home');
  must(((await page.locator('[data-testid="card"]').boundingBox())?.height ?? 0) > 700, 'Home once should come back to the chat just as it was');

  console.log('Sending money by asking');
  /* typing turns the bar active: the ring, and the send disc where the camera was */
  await page.getByLabel('Ask Beetle').fill('Send 20k to Sarah');
  await button('Send this').waitFor();
  await shot('chat-typing', 350);
  await tap('Send this');
  await see('Send 20k to Sarah');
  /* Beetle says what it is doing, in its own voice, while it works... */
  await see("I'm finding Sarah's account");
  await shot('chat-thinking', 0);
  await see("I'm checking the fee");
  /* ...and then the answer's words stream in, at reading speed, before the panel lands */
  const growing = [];
  const t1 = Date.now();
  while (Date.now() - t1 < 2600) {
    growing.push(await page.evaluate(() => (document.body.innerText.match(/I found Sarah Adeyemi[^\n]*/) || [''])[0].length));
    await page.waitForTimeout(50);
  }
  const lengths = growing.filter(n => n > 0);
  must(new Set(lengths).size >= 5, `the words should stream in rather than land whole (${[...new Set(lengths)].join(' ')})`);
  must(
    lengths.every((n, i) => i === 0 || n >= lengths[i - 1]),
    'the words should only ever add up',
  );
  console.log(`  the sentence grew through ${new Set(lengths).size} lengths`);
  await seeExactly('Send money');
  await shot('chat-transfer-running', 250);
  await button('Confirm ₦20,000').waitFor();
  await page.waitForTimeout(1900);
  await shot('chat-transfer-ready');
  /* the passcode stands between the button and the move: a wrong code
     shakes the dots and counts the tries, the right one lands a tick and the
     money goes */
  await tap('Confirm ₦20,000');
  await see('Enter your passcode');
  await shot('chat-passcode', 500);
  await type('111111');
  await see('Not it. 2 more tries.');
  await shot('chat-passcode-wrong', 200);
  await pay();
  await see('is with Sarah Adeyemi');
  /* what the passcode said leaves Everyday is what leaves: the ₦20,000 and the ₦26.88 fee */
  await see('₦575,293');
  /* and the receipt lands in the chat, in a few words, with nothing leading off to a full receipt (Round 19) */
  await page.getByTestId('receipt-card').last().waitFor();
  must((await page.getByText('The full receipt').count()) === 0, 'a receipt in the chat should not lead off to a full receipt');
  await shot('chat-transfer-sent', 500);
  /* a push up on the chat, now at its end, brings the card back up; the day
     has the transfer in it, and the chat that made it, filed at the top */
  /* the chat is still settling to its end after the receipt lands, longer on a slow machine; a push
     up before it has settled scrolls rather than closes, so give it a beat and try once more if so */
  await page.waitForTimeout(1200);
  for (let tries = 0; tries < 2; tries++) {
    await pushUp(196, 520);
    if (((await page.locator('[data-testid="card"]').boundingBox())?.height ?? 999) < 420) break;
    await page.waitForTimeout(800);
  }
  must((await page.locator('[data-testid="card"]').boundingBox())?.height < 420, 'a push up on the chat should close the card');

  /* the light at the card's edge (Round 21): pulled just past where letting go opens it and held there, the card goes
     on by itself while the finger is still down, the light showing as it gathers and pulses and gone once the pulse has
     run; Home then closes it with the quiet glow, gone again once it has shut */
  {
    await toTop();
    await page.waitForTimeout(400);
    const grab = await page.getByTestId('grabber').boundingBox();
    must(grab, 'the grabber should be on the card');
    const gx = grab.x + grab.width / 2;
    await page.mouse.move(gx, grab.y);
    await page.mouse.down();
    for (let dy = 6; dy <= 170; dy += 6) {
      await page.mouse.move(gx, grab.y + dy);
      await page.waitForTimeout(30);
    }
    const held = await trace('card-light-held', 900, [
      ['card', '[data-testid="card"]', false],
      ['light', '[data-testid="card-light"]', false],
    ]);
    const end = held[held.length - 1];
    must(end.card && end.card.height >= 720, `pulled past where it opens and held, the card should go on by itself (${end.card?.height}px)`);
    await page.mouse.up();
    must(
      held.some(x => x.light && x.light.opacity > 0.99),
      'the light should show at the edge as the card is pulled and pulses',
    );
    await page.waitForTimeout(1400);
    const rest = () => page.evaluate(() => +getComputedStyle(document.querySelector('[data-testid="card-light"]')).opacity);
    must((await rest()) === 0, 'the light should be gone once the pulse has run');
    const closing = trace('card-light-closing', 900, [
      ['card', '[data-testid="card"]', false],
      ['light', '[data-testid="card-light"]', false],
    ]);
    await page.getByTestId('glyph-home').click();
    const shut = await closing;
    must(
      shut.some(x => x.light && x.light.opacity > 0.99),
      'closing, the quiet glow should show at the edge',
    );
    await page.waitForTimeout(500);
    must((await page.locator('[data-testid="card"]').boundingBox())?.height < 420, 'Home should close the chat');
    must((await rest()) === 0, 'the glow should be gone once the card has shut');
    console.log(`  held past the open point, the card went on to ${Math.round(end.card.height)}px; the light came and went`);
  }

  /* the transfer is a line on Activities, the next page along */
  await tap('Activities');
  await onPage('activities');
  await see('GTBank · sent');
  await shot('activities-after-transfer');
  await tap('Home');
  await onPage('home');

  console.log('Being paid');
  /* Receive on the card puts up the sheet with the account's own details: the number at Beetle and the
     $tag, each with Copy, and Share details; under them Ask someone and In dollars. No paying in from a
     card, no code to scan and no page of its own for a bank transfer: the owner made it this short */
  await tap('Receive');
  await see('Give these to whoever is paying you');
  await page.getByTestId('receive-sheet-number').waitFor();
  await page.getByTestId('receive-sheet-tag').waitFor();
  must((await page.getByText('From a card', { exact: true }).count()) === 0, 'Receive should not offer paying in from a card');
  must((await page.getByText('Bank transfer', { exact: true }).count()) === 0, 'the details should be on the sheet, not behind a Bank transfer row');
  await shot('receive-sheet', 900);
  await tap('Copy account number');
  /* the browser may still refuse the clipboard on a machine with none; the
     sheet says so either way, and that is what is checked */
  const copied = page.getByText('copied. Paste it anywhere.').filter({ visible: true }).first();
  const refused = page.getByText('cannot reach the clipboard').filter({ visible: true }).first();
  await Promise.race([copied.waitFor(), refused.waitFor()]);
  console.log(`  the number was ${(await copied.count()) ? 'copied' : 'not copied: this browser has no clipboard to give'}`);
  /* Share details, with no share sheet in this browser, puts all of it on the clipboard instead */
  await tap('Share details');
  await page
    .getByText(/Your details are copied|cannot reach the clipboard/)
    .filter({ visible: true })
    .first()
    .waitFor();
  await tap('Done');
  await page.waitForTimeout(700);
  at('/home');

  console.log('Asking for money');
  /* "ask musa for 20k" typed in the chat is a page of its own: the request,
     filled from the words, Beetle Requests running until it has a date */
  await pull('card-for-asking', false);
  await page.getByLabel('Ask Beetle').fill('ask musa for 20k for the rent balance');
  await button('Send this').waitFor();
  await tap('Send this');
  await see('the line ending 4471');
  at('/request');
  await see('In 7 days');
  await shot('request-typed', 600);
  await tap('Send the request');
  await see('Request sent');
  must(page.url().includes('/asked/'), "the page that says it was sent should take the request's place");
  await shot('request-sent', 900);
  /* Set that up leads to the standing instruction, and Set it up lists it */
  await tap('Set that up');
  await see('Nudge whoever I asked for money');
  at('/rule');
  await tap('Set it up');
  await see('What I can do without asking you first');
  await see('Nudge whoever I asked for money');
  await shot('rules-remind', 900);
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  /* the chat Beetle filed is in the drawer, and carries the request's card, which opens the page again */
  await pull('card-for-the-drawer', false);
  await openChats();
  await see('₦20,000 asked of Musa');
  await tap('₦20,000 asked of Musa');
  await button('Request').waitFor();
  await shot('request-chat', 900);
  await tap('Request');
  await see('Request sent');
  await tap('Back');
  await page.waitForTimeout(700);
  at('/home');
  await backToHome();
  await page.waitForTimeout(700);
  /* the photo way: the camera reads the message, and the sheet over it says what it read */
  await pull('card-for-the-camera', false);
  await tap('Show me a photo');
  at('/scan');
  await page.waitForTimeout(600);
  if (
    await page
      .getByRole('button', { name: 'Allow the camera', exact: true })
      .isVisible()
      .catch(() => false)
  )
    await tap('Allow the camera');
  await page
    .getByText(/Point at an account number|No camera here/)
    .first()
    .waitFor();
  await tap('Use a sample photo');
  await tap('A message asking for your account');
  await see('Read from your photo');
  await see('Ask Musa for 20k');
  await shot('found-request', 900);
  await tap('Ask Musa');
  await see('the line ending 4471');
  at('/request');
  must((await page.locator('[data-testid="you-typed"]').count()) === 1, 'what the camera read should stand as the first thing said');
  await see('In 7 days');
  await shot('request-photo', 600);
  await tap('Back');
  await page.waitForTimeout(700);
  at('/home');
  await backToHome();
  await page.waitForTimeout(700);
  /* nothing yet: Ask someone on the sheet; Beetle asks, and each row fills where it is: who, how much on the picker, what for */
  await tap('Receive');
  await see('Give these to whoever is paying you');
  await tap('Ask someone');
  /* no bubble on the page: the line under the panel says what to tap */
  await see('Tap Person and Amount to fill them in.');
  at('/request');
  await shot('request-empty', 900);
  must((await page.getByLabel('Ask Beetle').filter({ visible: true }).count()) === 0, 'no page but home should carry an ask bar');
  await tap('Person');
  await see('Who should I ask?');
  await tap('Sarah Adeyemi');
  await see('Tap Amount to say how much to ask Sarah for.');
  await tap('Amount');
  await page.getByTestId('pick-amount').waitFor();
  await page.getByTestId('pick-amount').getByRole('button', { name: '₦5,000', exact: true }).click();
  await tap('Ask for ₦5,000');
  await see('Sarah Adeyemi, the line ending 8842');
  await see('₦5,000');
  await tap('For');
  await see('What is it for?');
  await tap('Lunch');
  await tap('Done');
  await see('Lunch');
  await see('In 7 days');
  await shot('request-reply', 600);
  /* the amount again, typed this time, on the picker over the page: no page of its own */
  await tap('Amount');
  await page.getByTestId('pick-amount').waitFor();
  await typeAmount(25000);
  await tap('Ask for ₦25,000');
  await see('₦25,000');
  at('/request');
  /* the person row opens the list of who has paid before */
  await tap('Person');
  await see('Who should I ask?');
  await tap('Musa Danjuma');
  await see('the line ending 4471');
  await shot('request-picked', 600);
  await tap('Back');
  await page.waitForTimeout(700);
  at('/home');
  /* and asking how to be paid is the Receive chip's card, in the chat: the number from any bank, and the $tag */
  await pull('card-for-the-ways', false);
  await page.getByLabel('Ask Beetle').fill('how do I get paid');
  await tap('Send this');
  await page.getByTestId('receive-card').last().waitFor();
  await page.getByTestId('receive-tag').last().waitFor();
  at('/home');
  await shot('chat-receive-typed', 900);
  await backToHome();
  await page.waitForTimeout(700);

  console.log('The chats, in the drawer in the chat');
  /* the chats live in the chat: a swipe from its left edge brings the drawer in from the left, following the
     finger, with New chat at its top and the chats under it — the one just filed, and the one Beetle started */
  await pull('card-for-chats', false);
  must((await page.getByTestId('chats-drawer').getAttribute('aria-hidden')) === 'true', 'the drawer should be out until it is asked for');
  const edgeBox = await page.getByTestId('chats-edge').boundingBox();
  await drag(4, edgeBox.y + 200, 300, edgeBox.y + 205, 16);
  await page.getByTestId('chats-drawer').getByRole('button', { name: 'New chat', exact: true }).waitFor();
  await see('Your usual top up');
  await see('Send 20k to Sarah');
  await shot('chat-drawer', 400);
  /* a chat picked there picks up where it was, panels and all */
  await tap('Send 20k to Sarah');
  await seeExactly('Send money');
  await page.waitForTimeout(700);
  await shot('chat-reopened');
  /* and Home on the bar, tapped in the chat, closes it: the edge and the drawer go with it */
  await backToHome();
  must((await page.getByTestId('chats-edge').count()) === 0, 'the edge and the drawer should go with the chat');
  /* and Beetle's own prompt, from the drawer, opens with the thing it wants handled */
  await pull('card-for-the-prompt', false);
  await openChats();
  await tap('Your usual top up');
  await see('Beetle Bills');
  await shot('chat-prompt', 900);
  await backToHome();
  await page.waitForTimeout(700);

  console.log('Reading a photo');
  /* the camera is on the bar, which lives in the open card now */
  await pull('card-again', false);
  await tap('Show me a photo');
  at('/scan');
  await page.waitForTimeout(600);
  if (
    await page
      .getByRole('button', { name: 'Allow the camera', exact: true })
      .isVisible()
      .catch(() => false)
  )
    await tap('Allow the camera');
  await page
    .getByText(/Point at an account number|No camera here/)
    .first()
    .waitFor();
  await shot('scan', 900);
  if (
    await page
      .getByRole('button', { name: 'Take the photo', exact: true })
      .isVisible()
      .catch(() => false)
  )
    await tap('Take the photo');
  else {
    await tap('Use a sample photo');
    await tap('An account slip');
  }
  await see('Read off the photo');
  at('/home');
  await see('Sarah Adeyemi at GTBank');
  await shot('chat-photo-read', 1200);
  await page.getByLabel('Ask Beetle').fill('5k');
  await page.keyboard.press('Enter');
  await button('Confirm ₦5,000').waitFor();
  await shot('chat-photo-transfer', 1900);
  await backToHome();
  await page.waitForTimeout(700);

  console.log('A place on its own');
  /* the lab, opened at its own address: from here on the tab on the edge
     brings it back; a step deep in the way in opens with the way there
     already walked, and home opens signed in */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  at('/lab');
  await tap('Face scan and username');
  await seeExactly('Face scan and username');
  at('/way-in');
  await see('Mobile number');
  await see('BVN number');
  await see('Password');
  await shot('lab-finish');
  await tap('Back to the lab');
  await see('Beetle Lab');
  at('/lab');
  await tap('Ready');
  await arrives('Your account is ready');
  at('/way-in');
  await shot('lab-ready');
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('A new account');
  await see(NEW_HOME);
  await onPage('home');
  await shot('lab-home-new', 400);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('A prompt from Beetle');
  await see('Beetle Bills');
  at('/home');
  await shot('lab-prompt', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('Beetle thinking');
  await see("I'm finding Sarah's account");
  await shot('lab-thinking', 0);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('A transfer, mid-way');
  await seeExactly('Send money');
  at('/home');
  await shot('lab-transfer', 1600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('The passcode');
  await see('Enter your passcode');
  at('/home');
  await shot('lab-passcode', 700);
  /* the screen behind the sheet, tapped above it, puts it away (the sheet, with the whole of it at its top, now reaches up to 69) */
  await button('Close').click({ position: { x: 196, y: 24 } });
  await button('Confirm ₦20,000').waitFor();
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a chat that carries on: the one filed a quarter of an hour ago comes
     back with the pull down, and New chat at the top of the drawer starts another */
  await tap('A chat that carries on');
  await see('Done. ₦20,000 is with Sarah Adeyemi.');
  at('/home');
  await shot('lab-carry', 900);
  await openChats();
  await tap('New chat');
  /* the old chat's words leave the card; its row in the day keeps them */
  const inCard = page.locator('[data-testid="card"]').getByText('Done. ₦20,000 is with Sarah Adeyemi.');
  await inCard.first().waitFor({ state: 'hidden' });
  await shot('lab-new', 900);
  must((await inCard.count()) === 0, 'New should start a fresh chat');
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a receipt lands in the chat after the passcode, in a few words; a tap opens it where it is, the way a line opens
     on Activities but in the chat's dark: the card loses its outline, reaches out to the chat's edge and grows every
     detail under what it says, the session id kept back, Share receipt and See in Activities at its foot, and the rest
     of the screen goes soft under a dark frost (Round 20, the owner's word: no sheet from the bottom in the chat) */
  await tap('A receipt in the chat');
  await page.getByTestId('receipt-card').first().waitFor();
  must((await page.getByText('The full receipt').count()) === 0, 'a receipt in the chat should not lead off to a full receipt');
  await shot('lab-receipt-card', 900);
  const small = await page.getByTestId('receipt-card').boundingBox();
  await tap('Receipt');
  await page.getByTestId('chat-receipt-veil').waitFor();
  await page.waitForTimeout(1000);
  const big = await page.getByTestId('receipt-card').boundingBox();
  must(small && big && big.height > small.height + 150, `the receipt should open with every detail under it (${Math.round(small?.height ?? 0)} → ${Math.round(big?.height ?? 0)})`);
  must(big.width > small.width + 40, `and reach out to the chat's edge (${Math.round(small.width)} → ${Math.round(big.width)})`);
  must(big.y >= 100 && big.y + big.height <= 660, `and stand clear of the header and of the chips and the ask bar (${Math.round(big.y)} to ${Math.round(big.y + big.height)})`);
  const outline = await page.getByTestId('receipt-card-outline').evaluate(el => Number(getComputedStyle(el).opacity));
  must(outline < 0.05, `an open receipt should have no outline (${outline})`);
  must((await page.getByTestId('chat-receipt').count()) === 1, 'the rest of the screen should go soft under the frost');
  must((await page.getByTestId('receipt-sheet').count()) === 0, 'and no sheet should come up from the bottom');
  await see('Balance after');
  await see('When');
  await page
    .getByRole('button', { name: /^Show the / })
    .first()
    .click();
  await page.getByTestId('in-place-session').waitFor();
  await shot('chat-receipt-open', 300);
  console.log(`  the receipt opened from ${Math.round(small.height)} to ${Math.round(big.height)} tall, where it was`);
  /* a tap on the frost puts it back */
  await page.mouse.click(200, 40);
  await page.getByTestId('chat-receipt').waitFor({ state: 'detached' });
  must(Math.abs(((await page.getByTestId('receipt-card').boundingBox())?.height ?? 0) - small.height) < 2, 'and the card should be as it was');
  /* See in Activities, from the open card, turns the pages to the record */
  await tap('Receipt');
  await page.getByTestId('chat-receipt-veil').waitFor();
  await page.waitForTimeout(900);
  await tap('See in Activities');
  await page.getByTestId('chat-receipt').waitFor({ state: 'detached' });
  await onPage('activities');
  await shot('receipt-to-activities', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the receipt sheet on the frames' transfer: the whole of it, the session id shown and copied, its share sheet */
  await tap('A transfer');
  await receiptSheet();
  await see('Rent part payment');
  at('/receipt/l08');
  await shot('receipt-transfer', 500);
  await tap('Copy the session id');
  await page
    .getByText(/copied\. Paste it anywhere\.|cannot reach the clipboard/)
    .first()
    .waitFor();
  await tap('Share receipt');
  await see('Share this receipt');
  await shot('receipt-share', 900);
  /* the share sheet's own Done: the receipt sheet under it has one too */
  await page.getByTestId('share').getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByText('Share this receipt').first().waitFor({ state: 'hidden' });
  /* what Beetle offers with a transfer, on its line opened on Activities, leads to the instruction, offered */
  await page.goto(`${base}/activities?receipt=l08`, { waitUntil: 'load' });
  await page.getByTestId('in-place-card').filter({ visible: true }).first().waitFor();
  await page.waitForTimeout(700);
  await tap('Set it up');
  await see('Nothing is saved until you say yes');
  at('/rule');
  await tap('Not now');
  await see('Rent part payment');
  /* the line was opened by its address, not from the lab, so the lab is gone to the same way */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('A bill paid');
  /* a prepaid bill's token is always shown in place, with its copy button */
  await button('Copy the token').waitFor();
  at('/receipt/l11');
  await shot('receipt-bill', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('Money in');
  await receiptSheet();
  at('/receipt/l10');
  await shot('receipt-in', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* Settings, from the gear on the bar: the pages slide across under the bar, which stays where it is,
     its glyphs and its plus untouched; the gear is solid and black once its page is showing */
  await tap('The demo account');
  await see('Total balance');
  /* home has come, and the foot has finished turning into the bar (from the receipt's Back and ask bar, a moment
     ago): risen into its place, the plus grown to its size */
  await page.waitForFunction(() => {
    const bar = document.querySelector('[data-testid="bar"]');
    const plus = bar?.querySelector('[aria-label="More"]');
    /* and the screen has finished sliding in: the pages sit at the left edge */
    const pager = document.querySelector('[data-testid="pager"]');
    return (
      !!bar && !!plus && !!pager && Math.abs(new DOMMatrix(getComputedStyle(bar).transform).m42) < 0.5 && plus.getBoundingClientRect().height > 55 && Math.abs(pager.getBoundingClientRect().left) < 0.5
    );
  });
  /* the tap and the trace together: the slide is quicker than a click takes to come back */
  const gearTapped = Date.now();
  const [slide] = await Promise.all([
    trace(
      'pages-slide',
      900,
      [
        ['row', '[data-testid="pager"] > div', false],
        ['bar', '[data-testid="bar"]', false],
        ['plus', '[data-testid="bar"] [aria-label="More"]', false],
      ],
      { since: gearTapped, picture: { at: 110, name: 'pages-sliding' } },
    ),
    tap('Settings'),
  ]);
  const lefts = slide.map(x => x.row?.left).filter(v => v !== undefined);
  must(lefts.length > 3 && lefts[0] > -200 && lefts[lefts.length - 1] < -700, `the pages should slide across to Settings (${Math.round(lefts[0] ?? 0)} → ${Math.round(lefts[lefts.length - 1] ?? 0)})`);
  must(new Set(lefts.map(Math.round)).size >= 4, 'through the move, not a jump');
  const barTops = slide.map(x => x.bar?.top).filter(v => v !== undefined);
  must(barTops.length > 3 && barTops.every(t => Math.abs(t - barTops[0]) < 1), `the bar should stay where it is (${[...new Set(barTops.map(Math.round))].join(' ')})`);
  must(
    slide.every(x => x.plus && x.plus.height > 50),
    `and keep its plus throughout (${slide.map(x => (x.plus ? Math.round(x.plus.height) : 'none')).join(' ')})`,
  );
  console.log(`  the pages went from ${Math.round(lefts[0])} to ${Math.round(lefts[lefts.length - 1])} under a bar that stayed at ${Math.round(barTops[0])}`);
  await see('What keeps the money yours');
  await onPage('settings');
  must((await button('Settings').getAttribute('aria-selected')) === 'true', 'the gear should say its page is showing');
  must((await page.getByTestId('foot').count()) === 0, 'Settings keeps the bar, not Back and the ask bar');
  await shot('settings', 500);
  /* the title shrinks as the page scrolls, to the size of home's word Wallet (14 from 32), over a soft blur rather than
     white; scrolled back to the top it grows back (Round 13) */
  const titleScale = () =>
    page.evaluate(() => {
      const h = document.querySelector('[data-testid="page-settings"] [data-testid="head"]');
      return h ? new DOMMatrix(getComputedStyle(h).transform).a : null;
    });
  must((await titleScale()) === 1, 'the title should start at its full size');
  await page.mouse.move(200, 520);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(600);
  const shrunk = await titleScale();
  must(shrunk !== null && Math.abs(shrunk - 14 / 32) < 0.02, `scrolled, the title should shrink to 14 (scale ${shrunk})`);
  await shot('settings-scrolled', 300);
  await page.mouse.wheel(0, -640);
  await page.waitForTimeout(600);
  must(Math.abs((await titleScale()) - 1) < 0.01, 'scrolled back to the top, the title should grow back');
  await tap('Your details');
  await see('Member since');
  await shot('settings-details', 900);
  await tap('Done');
  /* every row leads somewhere: Lock and privacy, and its switches kept on the phone. The page slides
     in from the right with the phone's own movement (Round 13), its title with it, level all the way */
  await tap('Lock and privacy');
  const journey = await trace('journey-lock', 1100, [['head', '[data-testid="head"]:last']], { picture: { at: 140, name: 'journey-lock-mid' } });
  const heads = journey.map(x => x.head).filter(h => h && h.height > 0);
  must(heads.length > 3, 'the title should be arriving');
  const headTops = heads.map(h => h.top);
  const headLefts = heads.map(h => h.left);
  must(Math.max(...headTops) - Math.min(...headTops) < 4, `the title should come in level, not rise or fall (${headTops.map(t => Math.round(t)).join(' ')})`);
  must(headLefts[0] > 60 && Math.abs(headLefts[headLefts.length - 1] - 20) < 2, `the page should slide in from the right (${headLefts.map(l => Math.round(l)).join(' ')})`);
  must(new Set(headLefts.map(Math.round)).size >= 3, 'through the slide, not a jump');
  console.log(`  the page slid in from ${Math.round(headLefts[0])} to ${Math.round(headLefts[headLefts.length - 1])}, its title level at ${Math.round(headTops[headTops.length - 1])}`);
  await see('What other people can see');
  at('/lock');
  await shot('settings-lock', 500);
  await page.getByRole('switch', { name: 'Hide my balance' }).click();
  await switched('Hide my balance', false);
  await tap('Back');
  await see('What keeps the money yours');
  await tap('Lock and privacy');
  await see('What other people can see');
  await switched('Hide my balance', false);
  await tap('Passcode');
  /* the passcode it is now first: a phone left open cannot have its passcode changed under it */
  await see('Your passcode now');
  at('/newcode');
  await type(PASSCODE);
  await see('A new passcode');
  await shot('settings-newcode', 500);
  await type('246810');
  await see('Once more');
  await type('246810');
  await see('Your passcode is new');
  await see('What other people can see');
  /* the password, for logging in on a new phone, is a page of its own (Round 32) */
  await tap('Password');
  await see('Change password');
  at('/password');
  await page.getByTestId('current-password').first().fill(PASSWORD);
  await page.getByTestId('new-password').first().fill('ladybird2468');
  await shot('settings-password', 500);
  await tap('Change password');
  await see('Your password is new');
  await see('What other people can see');
  await tap('Back');
  /* Spending limits, and what the line looks like */
  await tap('Spending limits');
  await see('Your caps');
  at('/limits');
  await shot('settings-limits', 500);
  await tap('Show me what that looks like');
  await see('Now type the words in full');
  at('/limitstop');
  await page.getByLabel('Type the three words').fill('Confirm this transa');
  await see('Five letters to go');
  await shot('settings-limitstop', 500);
  must((await button('Send ₦120,000').getAttribute('aria-disabled')) === 'true', 'the button should wait for the last letter');
  await page.getByLabel('Type the three words').fill('Confirm this transaction');
  await see('That is it. It can go now.');
  await tap('Send ₦120,000');
  await see('And it would go');
  await see('Your caps');
  await tap('Back');
  /* Standing instructions, and one offered */
  await tap('Standing instructions');
  await see('I will always ask first');
  at('/rules');
  await shot('settings-rules', 500);
  await page.getByRole('switch', { name: 'Top up Ikeja Electric' }).click();
  await tap('Back');
  await see('2 running');
  await tap('Standing instructions');
  await tap('Add an instruction');
  await see('Nothing is saved until you say yes');
  at('/rule');
  await shot('settings-rule', 500);
  await tap('Set it up');
  await see('Set up. It sits in Standing instructions');
  at('/rules');
  await switched('Top up Ikeja Electric', true);
  await tap('Back');
  await see('3 running');
  /* Devices, and the odd one signed out */
  await tap('Devices');
  await see('Everywhere this account is open');
  at('/devices');
  await shot('settings-devices', 500);
  await tap('Sign out everywhere else');
  /* it asks first, saying which ones go and that the money is not touched */
  await see('Sign out every other device?');
  await shot('settings-devices-ask', 500);
  await tap('Sign them out');
  await see('Only this phone is signed in now');
  must((await page.getByText('Chrome on Windows').count()) === 0, 'the odd one should be gone');
  await tap('Back');
  await see('1 signed in');
  /* Keys and recovery: the phone that is not yours, the freeze, the new passcode */
  await tap('Keys and recovery');
  await see('Signed in on a device I do not know');
  at('/lostphone');
  await shot('settings-lostphone', 500);
  await tap('Freeze it, then prove it is me');
  await see('Frozen');
  /* proving it is you is the passcode it is now, or the face */
  await see('Your passcode now');
  await type(PASSCODE);
  await see('A new passcode');
  await type('357913');
  await see('Once more');
  await type('357913');
  /* the word about it is a toast, gone in a couple of seconds, which a slow machine can
     miss; what has to hold is where it leads — home, the freeze lifted */
  await shot('settings-newcode-done', 0);
  await page
    .getByText('the money is yours again')
    .first()
    .waitFor({ timeout: 4000 })
    .then(
      () => console.log('  the toast said the money is yours again'),
      () => console.log('  (the toast had gone before it was looked for)'),
    );
  await page.waitForURL(/\/home/);
  at('/home');
  await see('Total balance');
  /* the card, from its row and from the day's tile */
  await tap('Settings');
  await tap('Cards');
  await see('Made for one merchant');
  at('/card');
  await shot('settings-card', 500);
  /* the whole number only after the passcode */
  await tap('Reveal');
  await see('Enter your passcode');
  must((await page.getByText('5399 8123 4567 4471').count()) === 0, 'the whole number should wait for the passcode');
  await type(PASSCODE);
  await see('5399 8123 4567 4471');
  await tap('Freeze');
  await see('This card is frozen');
  await tap('Unfreeze');
  await page.getByText('This card is frozen').first().waitFor({ state: 'hidden' });
  await tap('Rules');
  await see('I will always ask first');
  await tap('Back');
  await tap('Back');
  await see('What keeps the money yours');
  /* Contact support goes to the chat */
  await tap('Contact support');
  await see('I need a human to look at something');
  at('/home');
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('The demo account');
  await see('Total balance');
  await tap('Settings');
  await see('What keeps the money yours');
  await tap('Sign out');
  await page.getByTestId('confirm-sign-out').getByRole('button', { name: 'Sign out', exact: true }).click();
  await see('Sign up');
  at('/way-in');
  /* logging in with Google (Round 32): no password; on a phone that knows the account, straight in */
  await tap('Log in');
  await tap('Use another account');
  await tap('Google');
  await seeExactly('Continue with Google');
  await see('so there is no password');
  await shot('log-in-google', 500);
  await tap('Continue as Ibrahim');
  await arrives(DEMO_HOME);
  at('/home');
  await page
    .getByTestId('cover')
    .first()
    .waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => {});
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the bar at the foot of home, More up out of its plus, and the record */
  await tap('The bar');
  await see('Total balance');
  await button('More').waitFor();
  await shot('home-bar', 900);
  await tap('More');
  await button('Convert').waitFor();
  await shot('home-more', 900);
  must((await page.getByRole('button', { name: 'History', exact: true }).count()) === 0, 'More should carry three, not the two the bar has');
  must((await page.getByTestId('more-veil').count()) === 1, 'More should open over the page under its white veil');
  await button('Close').last().click();
  /* More folds away and then goes (another Convert, on a page to the side, is not More's) */
  await page.getByTestId('more').waitFor({ state: 'detached' });
  must((await page.getByTestId('more-veil').count()) === 0, 'the veil should go with More');
  await tap('Settings');
  await see('What keeps the money yours');
  await onPage('settings');
  await tap('Home');
  await see('Total balance');
  await onPage('home');
  await tap('Activities');
  await see('Everything that moved');
  await onPage('activities');
  /* all of the record is here now: All / Insights / In / Out, Money health under them on All and Insights only
     (Round 24, the owner's word), what Beetle noticed among the lines */
  await see('Money health');
  await see('Your usual top up');
  const filtersBox = () => page.getByRole('button', { name: 'Insights', exact: true }).filter({ visible: true }).first().boundingBox();
  const healthBox = () => button('Money health').boundingBox();
  const filtersAt = await filtersBox();
  must((await healthBox()).y > filtersAt.y + filtersAt.height, 'Money health should sit under the row of filters');
  await shot('activities', 700);
  await tap('In');
  must((await page.getByText('Pagrin Limited').filter({ visible: true }).count()) === 1, 'In should keep the salary');
  must((await page.getByText('Ikeja Electric').filter({ visible: true }).count()) === 0, 'and drop what went out');
  must((await page.getByText('Money health').filter({ visible: true }).count()) === 0, 'Money health is All and Insights only');
  must(Math.abs((await filtersBox()).y - filtersAt.y) < 1, 'the row of filters should stay put as Money health comes and goes');
  await tap('Insights');
  await see('Where your money went');
  await see('Money health');
  must((await page.getByText('Pagrin Limited').filter({ visible: true }).count()) === 0, 'Insights should hold what Beetle noticed, not the lines');
  await shot('activities-insights', 400);
  await tap('All');
  /* a settled line opens where it is: the line stays put and sharp, the page goes soft under a frost of
     white, and what the line does not say grows in under it — nothing pushed, nothing filling the screen */
  await button('Ikeja Electric').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const ikejaRow = await button('Ikeja Electric').boundingBox();
  /* the gap from the line to the next line under it, in the page as it is, so a scroll cannot change it */
  const gapUnder = () =>
    page.evaluate(() => {
      const lines = [...document.querySelectorAll('[data-testid="done-row"], [data-testid="status-row"]')]
        .map(e => ({ name: e.getAttribute('aria-label'), top: e.getBoundingClientRect().top, left: e.getBoundingClientRect().left }))
        .filter(l => l.left >= 0 && l.left < window.innerWidth);
      const at = lines.findIndex(l => l.name === 'Ikeja Electric');
      return at >= 0 && lines[at + 1] ? lines[at + 1].top - lines[at].top : null;
    });
  const gapBefore = await gapUnder();
  /* the line itself opens (Round 17, the owner's word): at no frame of the opening is the line drawn twice */
  await page.evaluate(() => {
    const w = window;
    w.__lines = [];
    const t0 = performance.now();
    const frame = () => {
      const drawn = [...document.querySelectorAll('div')].filter(e => {
        if (e.childElementCount || e.textContent !== 'Ikeja Electric') return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      });
      w.__lines.push(drawn.length);
      if (performance.now() - t0 < 1600) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await tap('Ikeja Electric');
  const opened = await trace(
    'in-place',
    1400,
    [
      ['line', '[data-testid="in-place-line"]'],
      ['card', '[data-testid="in-place-card"]'],
    ],
    { picture: { at: 140, name: 'in-place-mid' } },
  );
  const held = opened.map(x => x.line).filter(Boolean);
  must(
    held.length >= 3 && Math.abs(held[0].top - (ikejaRow?.y ?? 0)) < 6,
    `the line should stay where it was (${Math.round(held[0]?.top ?? 0)}, the line at ${Math.round(ikejaRow?.y ?? 0)}; seen in ${held.length} of ${opened.length} samples: ${opened.map(x => (x.line ? Math.round(x.line.top) : '-')).join(' ')})`,
  );
  await page.getByTestId('in-place-card').waitFor();
  await page.waitForTimeout(400);
  const drawnTwice = (await page.evaluate(() => window.__lines)).filter(n => n !== 1).length;
  must(!drawnTwice, `the line should be drawn once at every frame of opening, not twice (${drawnTwice} frames otherwise)`);
  must((await page.locator('[data-testid="in-place-line"] [data-testid="done-row"]').count()) === 1, "the open line should be the list's own line");
  const gapAfter = await gapUnder();
  const grownIn = (await page.getByTestId('in-place-card').boundingBox())?.height ?? 0;
  must(
    gapBefore !== null && gapAfter !== null && gapAfter - gapBefore > grownIn - 20,
    `the lines below should go down to make room (the next line ${Math.round(gapBefore ?? 0)} under it, then ${Math.round(gapAfter ?? 0)}, ${Math.round(grownIn)} grown in)`,
  );
  must((await page.getByTestId('in-place-veil').count()) === 1, 'the page should go soft under the frost');
  /* the bar goes down under the bottom of the screen while a line is open */
  const barAway = await page
    .waitForFunction(() => (document.querySelector('[data-testid="glyph-home"]')?.getBoundingClientRect().top ?? 9999) >= window.innerHeight - 2, null, { timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  must(barAway, 'the bar should step out of the way');
  /* what the line already says is not said again: not who, not the total */
  const card = page.getByTestId('in-place-card');
  must((await card.getByText('To', { exact: true }).count()) === 0, 'who it went to is the line, not the card');
  must((await card.getByText(/^Total /).count()) === 0, 'the total is the amount and the fee, not a row of its own');
  await card.getByText('Balance after', { exact: true }).waitFor();
  /* the session id is kept back until asked for */
  must((await page.getByTestId('in-place-session').count()) === 0, 'the session id should wait to be asked for');
  await page.getByRole('button', { name: /^Show the / }).click();
  await page.getByTestId('in-place-session').waitFor();
  await shot('in-place', 300);
  /* the ··· at the top right beside the title: Ask Beetle about this, and Report a problem */
  await page.getByTestId('in-place-more').click();
  await page.getByTestId('menu-card').waitFor();
  await see('Ask Beetle about this');
  await see('Report a problem');
  await shot('in-place-menu', 300);
  await page.getByTestId('menu-wash').click();
  await page.getByTestId('menu-card').waitFor({ state: 'detached' });
  /* Share receipt and Set it up side by side: Set it up leads to the instruction, offered */
  await page.getByTestId('in-place-repeat').click();
  await see('Nothing is saved until you say yes');
  await tap('Not now');
  await see('Everything that moved');
  /* the pages hold still while a line is open: a swipe to the left goes nowhere */
  await tap('Ikeja Electric');
  await page.getByTestId('in-place-card').waitFor();
  await page.waitForTimeout(500);
  await drag(340, 60, 60, 65);
  await onPage('activities');
  must((await page.getByTestId('in-place').count()) === 1, 'a swipe to the left should leave the line open');
  /* and a tap off it puts it all back, in two steps (Round 16, the owner's word): what came in under the line goes first
     while the frost stays whole, then the frost clears, its blur thinning rather than dropping out, so the receipt and
     the page never show through each other. Every frame of it is read in the page */
  await page.evaluate(() => {
    const w = window;
    w.__closing = [];
    const t0 = performance.now();
    const seen = e => {
      let o = 1;
      for (let n = e; n && n !== document.body; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      return o;
    };
    const frame = () => {
      const veil = document.querySelector('[data-testid="in-place-veil"]');
      const row = document.querySelector('[data-testid="in-place-row"]');
      const filter = veil ? [veil, ...veil.querySelectorAll('*')].map(e => getComputedStyle(e).backdropFilter).find(f => f && f !== 'none') : null;
      const px = filter ? Number((/blur\(([\d.]+)px\)/.exec(filter) ?? [])[1] ?? 0) : null;
      w.__closing.push({ ms: Math.round(performance.now() - t0), row: row ? seen(row) : 0, blur: px, veil: veil ? seen(veil) : 0 });
      if (performance.now() - t0 < 900) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.mouse.click(200, 40);
  await page.getByTestId('in-place').waitFor({ state: 'detached' });
  await page.waitForTimeout(300);
  const closing = await page.evaluate(() => window.__closing);
  const bare = closing.filter(f => f.row > 0.05 && (f.blur ?? 0) < 12);
  must(!bare.length, `the receipt's rows should be gone before the frost thins (${bare.map(f => `${f.ms}ms rows ${f.row.toFixed(2)} blur ${f.blur}`).join(', ')})`);
  const thinning = closing.filter(f => f.blur !== null && f.blur > 0.5 && f.blur < 13.5);
  must(thinning.length >= 3, `the frost's blur should thin as it clears, not drop out (${closing.map(f => f.blur).join(' ')})`);
  const cleared = closing.find(f => f.veil === 0 && f.ms > 0);
  must(cleared && cleared.ms < 600, `and it should all be gone within 0.6s (${cleared?.ms}ms)`);
  console.log(`  closed: the rows gone by ${closing.find(f => f.row <= 0.05)?.ms}ms, the frost thinning over ${thinning.length} frames, all gone at ${cleared?.ms}ms`);
  await see('Everything that moved');
  await onPage('activities');
  const barBack = await page
    .waitForFunction(() => (document.querySelector('[data-testid="glyph-home"]')?.getBoundingClientRect().top ?? 9999) < window.innerHeight - 20, null, { timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  must(barBack, 'the bar should be back once the line is closed');
  /* a line still on its way opens in place too (Round 13): what it is, with its next steps instead of
     Share and Set it up; the page it used to open is behind See the details */
  await tap('Sarah Adeyemi');
  await page.getByTestId('in-place-state').filter({ visible: true }).first().waitFor();
  await see('Do not send it again');
  /* the line over the frost is drawn just as the page draws it, its status glyph and all, so nothing doubles as it closes */
  must((await page.locator('[data-testid="in-place-line"] [data-testid="status-row"]').count()) === 1, 'a line on its way should keep its status glyph over the frost');
  at('/home');
  await see('GTBank · 0234 5678 90');
  must((await button('Ask about it').count()) === 1 && (await button('See the details').count()) === 1, 'a line on its way should offer to ask about it, and the details');
  await shot('in-place-pending', 900);
  await tap('See the details');
  /* the line goes back into its place first, then the page slides in */
  await page.waitForURL(/\/transfer\/l01/);
  await seeExactly('Do not send it again. This one is still live.');
  await tap('Back');
  await see('Everything that moved');
  /* Round 36: More's Send and Receive ask which account first, with what each holds and how money moves in each */
  await tap('More');
  await button('Convert').waitFor();
  await page.getByTestId('more').getByRole('button', { name: 'Receive', exact: true }).click();
  await see('Receive into your naira or your dollars');
  at('/pick');
  await see('sent on Solana to your Dollar account’s own address');
  await shot('pick-receive', 700);
  await tap('Dollar account');
  await see('Receive dollars');
  at('/coins');
  await tap('Back');
  await see('Which account?');
  await tap('Back');
  await see('Everything that moved');
  await tap('More');
  await button('Convert').waitFor();
  await page.getByTestId('more').getByRole('button', { name: 'Send', exact: true }).click();
  await see('Send from your naira or your dollars');
  at('/pick');
  await see('Naira account');
  await see('Stablecoins · $');
  await shot('pick-send', 700);
  await tap('Naira account');
  await see('Nothing moves until you slide');
  at('/send');
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the answer to a question about spending, from home's insight */
  await tap('The answer');
  await see('Where it went');
  at('/answer');
  await shot('answer', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* money arriving: the caption on the card says what came, the balance is
     up, the day has the line, and Beetle's chat about it waits with a dot */
  await tap('Money arrives');
  await see('+₦50,000 from Sarah');
  await see('₦645,320');
  await shot('lab-arrival', 300);
  /* the chat Beetle started is in the drawer, and carries the receipt's card: opened where it is, it says who it came from */
  await pull('card-for-the-arrival', false);
  await openChats();
  await see('₦50,000 came in');
  await tap('₦50,000 came in');
  await button('Receipt').waitFor();
  await tap('Receipt');
  await page.getByTestId('chat-receipt-veil').waitFor();
  await see('None on money in');
  await shot('lab-arrival-receipt', 900);
  await page.mouse.click(200, 40);
  await page.getByTestId('chat-receipt').waitFor({ state: 'detached' });
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* Beetle's model: no key here, so the try comes back from the script */
  await tap('The key, and a try');
  await see("Beetle's model");
  await see('No key. Beetle answers from the script.');
  at('/model');
  await tap('Ask it');
  await see('I can send money');
  await shot('lab-model', 300);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a chip over the input puts its card up in the chat, and nothing leaves it: Data is the line and the plan, on the own line */
  await tap('The chat, open');
  await button('Data').waitFor();
  await page.waitForTimeout(900);
  await tap('Data');
  await see('Which line, and which plan?');
  await page.locator('[data-testid="ask"]').last().waitFor();
  at('/home');
  await shot('chat-chip-data', 1200);
  await tap('Back to the lab');
  await see('Beetle Lab');
  console.log('What Beetle asks for');
  /* a transfer with no amount: the card, Sarah found by her name and asked about, the amount on the
     picker; Recent grows the card into the people paid before, and a pick fills it */
  const askPanel = page.locator('[data-testid="ask"]').last();
  const inAsk = name => askPanel.getByRole('button', { name, exact: true }).first().click();
  const askField = label => askPanel.getByLabel(label, { exact: true }).first();
  const stillSays = async words => must((await askPanel.getByTestId('ask-action').innerText()).includes(words), `the card's button should say what is still missing: ${words}`);
  await tap('Send, no amount given');
  await askPanel.waitFor();
  await askPanel.getByText('Is this the person?').waitFor();
  await askPanel.getByText('GTBank · 0234 5678 90').waitFor();
  await stillSays('Pick how much');
  await shot('ask-send', 900);
  await askPanel.getByTestId('ask-recent').click();
  await askPanel.getByTestId('ask-recent-list').waitFor();
  await see('People you have paid');
  await shot('ask-saved-people', 600);
  await askPanel.getByRole('button', { name: 'John Doe', exact: true }).click();
  await askPanel.getByTestId('ask-recent-list').waitFor({ state: 'detached' });
  await askPanel.getByText('Kuda · 3012 3456 78').waitFor();
  await typeAmount(2500);
  await shot('ask-send-filled', 300);
  /* the card's own button goes to the passcode: no second card to confirm the first */
  await inAsk('Confirm ₦2,500');
  await see('Enter your passcode');
  await pay();
  await see('is with John Doe');
  await page.getByTestId('receipt-card').last().waitFor();
  await shot('ask-send-done', 600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* data for a number not topped up before: the network read off the digits, the
     likely plans as chips, the rest a tap away, the plan typed or picked */
  await tap('Data for a new number');
  await askPanel.waitFor();
  await askPanel.getByTestId('network').first().waitFor();
  must((await askPanel.getByTestId('network').first().innerText()).trim() === 'Airtel', 'the badge should read the network off the digits');
  await stillSays('Pick a plan');
  await shot('ask-data', 900);
  await inAsk('All Airtel plans');
  await inAsk('18GB, ₦6,000');
  await see('18GB for 30 days · ₦6,000');
  await shot('ask-data-plans', 300);
  await askField('Plan').fill('1gb');
  await see('1GB for a week · ₦800');
  await askPanel.getByRole('button', { name: 'Buy 1GB · ₦800', exact: true }).waitFor();
  await shot('ask-data-panel', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* airtime: the own line with Change beside it, the amount on the picker; Recent grows the
     card into the numbers topped up before, and Mum fills it */
  await tap('Airtime, on your own line');
  await askPanel.waitFor();
  await see('Your own line');
  await shot('ask-airtime', 900);
  await askPanel.getByRole('button', { name: '₦2,000', exact: true }).click();
  await askPanel.getByRole('button', { name: 'Buy ₦2,000 airtime', exact: true }).waitFor();
  await askPanel.getByTestId('ask-recent').click();
  await see('Numbers you top up');
  await shot('ask-saved-lines', 600);
  await askPanel.getByRole('button', { name: 'Mum', exact: true }).click();
  await askPanel.getByTestId('ask-recent-list').waitFor({ state: 'detached' });
  await askPanel.getByText('0803 214 4471').waitFor();
  await shot('ask-airtime-panel', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a bill: the company, prepaid or postpaid, the meter looked up as its digits land, then the
     amount; or one paid before, from Recent; then the passcode and the receipt with its token */
  await tap('A bill, from the meters paid');
  await askPanel.waitFor();
  await stillSays('Pick the company');
  await shot('ask-bill', 900);
  await inAsk('JED');
  await inAsk('Prepaid');
  await askField('Meter number').fill('12345678901');
  await askPanel.getByTestId('ask-meter-under').filter({ hasText: 'Jos' }).waitFor();
  await askPanel.getByRole('button', { name: '₦8,000', exact: true }).click();
  await shot('ask-bill-new', 400);
  await askPanel.getByTestId('ask-recent').click();
  await see('Meters you have paid');
  await shot('ask-saved-meters', 600);
  await askPanel.getByRole('button', { name: 'Home', exact: true }).click();
  await askPanel.getByTestId('ask-recent-list').waitFor({ state: 'detached' });
  await see('Ibrahim Musa');
  await inAsk('Pay ₦8,000');
  await see('Enter your passcode');
  await pay();
  await see('The token is');
  await page.getByTestId('receipt-card').last().waitFor();
  await shot('ask-bill-paid', 600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  console.log('Sending money');
  /* Send money, from the card: To first, which takes a $tag, a name or a number; the amount
     picked where it is; a reference typed in place; the slide; the passcode with the whole
     of it on it; and the receipt, with the line in the day after */
  const slideToSend = async () => {
    /* the slide is the foot's, drawn over the page (Round 18): it takes what the page says a moment after the page says
       it, so wait, as a person would, for it to be there and ready */
    await page.waitForFunction(
      () => {
        const pill = document.querySelector('[data-testid="slide"]'),
          knob = document.querySelector('[data-testid="slide-knob"]');
        return !!pill && !!knob && pill.getAttribute('aria-disabled') !== 'true' && knob.getBoundingClientRect().width > 0;
      },
      null,
      { timeout: 5000 },
    );
    const knob = await page.getByTestId('slide-knob').boundingBox();
    const pill = await page.getByTestId('slide').boundingBox();
    await page.mouse.move(knob.x + 25, knob.y + 25);
    await page.mouse.down();
    await page.mouse.move(knob.x + 60, knob.y + 25, { steps: 6 });
    await page.mouse.move(pill.x + pill.width - 16, knob.y + 25, { steps: 12 });
    await page.mouse.up();
  };
  const inSaved = name => page.locator('[data-testid="saved"]').getByRole('button', { name, exact: true }).click();
  /* from the card's own Send, so the receipt's Back lands on home and the day has the line */
  await tap('The demo account');
  await see('Total balance');
  await tap('Send');
  await see('Nothing moves until you slide');
  at('/send');
  const slideFill = () => page.getByTestId('slide').evaluate(el => getComputedStyle(el).backgroundColor);
  must((await slideFill()) === 'rgb(241, 240, 237)', `the slide should wait, in the pale tone, for someone and an amount (${await slideFill()})`);
  await shot('send-empty', 900);
  /* a $tag is a Beetle account, looked up in Beetle's own directory: free, and there at once */
  await page.getByTestId('to-input').fill('$tobi');
  await page.getByTestId('to-choice').filter({ hasText: 'Tobi Bakare' }).first().click();
  await see('A Beetle account · free, and there at once');
  await see('To Tobi Bakare · Beetle');
  await shot('send-tag', 500);
  await page.getByTestId('to-change').click();
  /* ten digits ask for the bank, the likely ones first, and the name is looked up there before anything can move */
  await page.getByTestId('to-input').fill('0123456785');
  await page.getByTestId('to-banks').waitFor();
  await shot('send-number', 400);
  await page.getByTestId('to-bank').filter({ hasText: 'GTBank' }).first().click();
  await see('Name checked at GTBank');
  await shot('send-checked', 500);
  /* Change keeps what was typed, so another bank is a tap away; emptied, the field has the people paid before under it, one tap each */
  await page.getByTestId('to-change').click();
  await page.getByTestId('to-banks').waitFor();
  await page.getByTestId('to-input').fill('');
  await page.getByTestId('to-choice').filter({ hasText: 'John Doe' }).first().click();
  await see('Kuda · 3012 3456 78');
  /* the amount, picked on the page: the ruler dragged rolls the figure on, step by step; then the figure typed exactly */
  const ruler = await page.getByTestId('amount-ruler').boundingBox();
  await drag(ruler.x + ruler.width / 2, ruler.y + 24, ruler.x + ruler.width / 2 - 140, ruler.y + 25, 14);
  await page.waitForTimeout(900);
  const rolled = (await page.getByTestId('amount-figure').innerText()).replace(/\s/g, '');
  must(rolled !== '₦0', `the ruler should have moved the figure on (${rolled})`);
  await typeAmount(2500);
  await see('₦2,500');
  await shot('send-amount', 400);
  at('/send');
  await page.getByLabel('Reference', { exact: true }).fill('Lunch');
  await see('John sees it on their statement');
  must((await slideFill()) === 'rgb(43, 39, 33)', 'the slide should be the ink once there is someone and an amount');
  await shot('send-filled', 500);
  await slideToSend();
  await see('Enter your passcode');
  /* the passcode says the whole of it while the digits go in, and Cancel is plain under the pad */
  await see('They receive');
  await see('Leaves Everyday');
  await button('Cancel').waitFor();
  await shot('send-passcode', 600);
  await pay();
  /* the receipt comes up as the sheet over the Send money page (Round 19); Done goes back past that page to home */
  await receiptSheet();
  must(page.url().includes('/receipt/'), 'the passcode should lead to the receipt');
  await see('Lunch');
  await shot('send-receipt', 900);
  await receiptDone();
  await see('Total balance');
  at('/home');
  await tap('Activities');
  await onPage('activities');
  await see('Kuda · sent');
  await shot('send-activities-after', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the three parts filled from a message, as the frame draws it, sent the same way */
  await tap('Filled from a message');
  await see('send Sarah 50k for the flat deposit');
  await shot('send-message', 900);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('Flat deposit');
  await shot('send-message-receipt', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* who from a photo: the camera in the To field, the sample slip, and the person read off it */
  await tap('Send money');
  await see('Nothing moves until you slide');
  await page.getByTestId('to-camera').click();
  /* the camera screen offers the sample slip whatever state the camera is in */
  const sample = page.getByRole('button', { name: /sample photo/ }).first();
  await sample.waitFor();
  at('/scan');
  await sample.click();
  await tap('An account slip');
  await see('Read off the photo');
  await see('Sarah Adeyemi');
  at('/send');
  await shot('send-photo', 900);
  /* past the balance it cannot go: typed or dragged, the amount stops hard at all Everyday can send */
  await typeAmount(9000000);
  await see(/All of it: ₦/);
  const most = (await page.getByTestId('amount-figure').innerText()).replace(/\s/g, '');
  must(most !== '₦9,000,000', `the figure should stop at what Everyday can send (${most})`);
  await shot('send-over', 400);
  /* and Not enough, where an amount asked for elsewhere is past the balance: what there is, less the fee, can go now —
     the same figure Send money stops at, so it opens on All of it */
  await page.goto(`${base}/short?asked=900000`, { waitUntil: 'load' });
  await see('Not enough in Everyday');
  at('/short');
  await shot('send-short', 900);
  const offered = page.getByRole('button', { name: /^Send ₦[\d,]+ now$/ }).first();
  const canGo = ((await offered.getAttribute('aria-label')) ?? '').replace(/^Send | now$/g, '');
  await offered.click();
  await see(`All of it: ${canGo}`);
  at('/send');
  await shot('send-short-taken', 600);
  /* the page was opened by its address, which the lab's tab does not survive: back by the address too */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  /* a digit the reader was not sure of: both readings, and the one chosen goes onto the page */
  await tap('Check this number');
  await see('and I am not sure of the last digit');
  at('/misread');
  await shot('send-misread', 900);
  await tap('It is 0234 5678 90');
  await see('checked by you');
  at('/send');
  await shot('send-misread-taken', 600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  console.log('Bills, data and the drawer');
  /* the drawer, bills, data and borrowing: from home, with the demo account the lab left signed in */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  /* the month's bills, asked for in words, are a page of their own: what it comes to,
     what is covered, and the rows; a row opens the page that pays it */
  await pull('card-for-bills', false);
  await page.getByLabel('Ask Beetle').fill('my bills');
  await tap('Send this');
  await see('Everything that repeats each month');
  at('/bills');
  await see('3 of 5 covered');
  await shot('bills', 900);
  await page
    .getByRole('button', { name: /^Ikeja Electric,/ })
    .filter({ visible: true })
    .first()
    .click();
  await see('Ikeja Electric, on your saved meter');
  await see('The meter you paid last month');
  at('/pay');
  await shot('pay-bill', 900);
  /* a figure picked, and one typed on the page itself */
  await tap('₦15,000');
  await see('You picked it');
  await typeAmount(5000);
  await see('₦5,000');
  at('/pay');
  /* the meter card opens the meters paid before, with the camera under them */
  await page
    .getByRole('button', { name: /^Ikeja Electric, Prepaid/ })
    .first()
    .click();
  await inSaved("Mum's flat");
  await see('Eko Electricity, on the meter you picked');
  await shot('pay-bill-picked', 600);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('Eko Electricity');
  must(page.url().includes('/receipt/'), 'paying a bill should open its receipt');
  await shot('bill-receipt', 900);
  /* the drawer: every service a way in; Data opens the page on the line topped up most */
  await page.goto(`${base}/services`, { waitUntil: 'load' });
  await see('Everything you can pay for from here');
  at('/services');
  await shot('services', 900);
  await tap('Data');
  await see('The number you top up most');
  await see('5GB for 30 days');
  at('/buy');
  await shot('buy-data', 900);
  /* another bundle, another line, then the slide, the passcode and the receipt */
  await tap('2GB');
  await see('2GB for 30 days');
  await tap('Dad');
  await see('0805 331 0921');
  await shot('buy-data-dad', 600);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  must(page.url().includes('/receipt/'), 'buying data should open its receipt');
  await shot('data-receipt', 900);
  /* a message asking for data, read off a photo: the sheet over the camera, then the chat that prices it */
  await page.goto(`${base}/scan`, { waitUntil: 'load' });
  await see('Point at an account number');
  await tap('Use a sample photo');
  await tap('A message asking for data');
  await see('Read from your photo');
  await see('2k data for mum');
  await shot('found-topup', 900);
  await tap('Top up Mum');
  await see('ending 471');
  at('/topup');
  await see('Checking MTN plans');
  await see('2GB at ₦2,000 ran out early');
  await shot('topup', 600);
  await tap('Confirm ₦2,500');
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('5GB for 30 days');
  await shot('topup-receipt', 900);
  /* the chat Beetle filed carries the receipt's card */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-the-topup-chat', false);
  await openChats();
  await see('5GB for Mum');
  /* borrowing: the whole cost before deciding, and the money landing as money in */
  await page.goto(`${base}/loan`, { waitUntil: 'load' });
  await see('paid back monthly');
  at('/loan');
  /* the days are a row of the breakdown, "90 days ▾": tapped, a short list to pick from */
  await page.getByTestId('terms').click();
  await page.getByTestId('term-list').getByRole('button', { name: '60 days', exact: true }).click();
  await page.getByTestId('term-list').waitFor({ state: 'detached' });
  await see('Two payments of');
  await page.getByTestId('loan-amount').getByRole('button', { name: '₦100,000', exact: true }).click();
  await see('₦100,000');
  await shot('loan', 600);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('Beetle Loans');
  await shot('loan-receipt', 900);
  /* paying it back (Round 33): Borrow says what is owed, ₦100,000 for 60 days being ₦109,000; the next payment, behind
     the passcode, comes off it, and the limit frees up as it does */
  await receiptDone();
  await see('You owe Beetle Loans');
  await see('₦109,000');
  await see('₦150,000 is left of your limit');
  await shot('loan-owed', 600);
  await tap('Pay ₦54,500');
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('Paid back');
  await receiptDone();
  await see('You owe Beetle Loans');
  await see('₦200,000 is left of your limit');
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-the-loan-chat', false);
  await openChats();
  await see('₦100,000 borrowed');
  /* "borrow" typed in the chat is the page */
  await closeChats();
  await page.waitForTimeout(600);
  await page.getByLabel('Ask Beetle').fill('how much can I borrow');
  await tap('Send this');
  /* the Loan chip's card, typed: borrowing is done in the chat, where it was asked */
  await see('Pick how much and for how long');
  await page.getByTestId('loan-borrow').last().waitFor();
  at('/home');
  /* a bill read off a photo: the camera pointed at a bill, What I found, the meter confirmed, the passcode, the token */
  await page.goto(`${base}/scan?for=bill`, { waitUntil: 'load' });
  await see('Point at a bill or a meter');
  await tap('Use a sample photo');
  await tap('A light bill');
  await see('4457 8891');
  await see('Is this your meter?');
  at('/meter');
  await see('14 Bode Thomas');
  await shot('meter', 900);
  await tap('Yes, that is mine');
  await see('Yours, at 14 Bode Thomas');
  await tap('Continue');
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  /* the prepaid token, always shown in place with its copy button */
  await button('Copy the token').waitFor();
  await shot('meter-receipt', 900);
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  console.log('Dollars, the goal and money health');
  /* the dollars chip on the card opens Dollars; Convert takes a figure, the passcode, and lands on Converted */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  must((await button('The Dollar account, $412.60. Opens it').count()) === 1, 'the chip on the card should carry the Dollar account’s own balance');
  await page.getByTestId('chip').click();
  await see('Steady when the naira is not');
  at('/dollars');
  await seeExactly('Dollar account');
  await see('$412.60');
  must((await button('Receive').count()) === 1 && (await button('Send').count()) === 1, 'the Dollar account should carry Convert, Send and Receive');
  await shot('dollars', 900);
  await tap('Convert');
  await see('Naira into dollars');
  at('/convert');
  await typeAmount(155200);
  await see('You get about $100.00');
  await shot('convert', 600);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  /* its receipt comes up as the sheet every payment ends on (Round 19); Done goes back past Convert to Dollars */
  await receiptSheet();
  must(page.url().includes('/receipt/'), 'converting should end on its receipt');
  await see('into Dollars');
  await shot('converted', 900);
  await receiptDone();
  await see('Steady when the naira is not');
  await see('$512.60');
  /* Send on the Dollar account sends dollars (Round 36), below; paying a bank account from the dollars stays on Send
     money: the From row's sheet, the figure in dollars under the amount, no fee, and the receipt saying From Dollars */
  await page.goto(`${base}/send?from=dollars`, { waitUntil: 'load' });
  await see('The rate is held for sixty seconds');
  at('/send');
  await page.getByTestId('to-choice').filter({ hasText: 'Sarah Adeyemi' }).first().click();
  await typeAmount(50000);
  await see('About $32.22 from your dollars');
  await tap('From');
  await see('Two places the money can leave');
  await shot('pay-from', 700);
  await tap('Everyday');
  await see('Nothing moves until you slide');
  await tap('Dollars');
  await see('The rate is held for sixty seconds');
  await tap('Done');
  await page.waitForTimeout(500);
  await shot('send-dollars', 600);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await shot('send-dollars-receipt', 900);
  /* the Dollar account's stablecoins (Round 36, the owner's word), on Solana's test network: Receive says how receiving
     works and asks for a yes before it shows the address; test coins land as dollars with a line in Activities, a word
     from Beetle and the receipt; Send goes to a Beetle $tag, free, or a Solana wallet, checked before anything moves */
  await page.goto(`${base}/dollars`, { waitUntil: 'load' });
  await see('Steady when the naira is not');
  await tap('Receive');
  await see('Pick Solana where you send from');
  at('/coins');
  await see('Beetle never asks you to send coins');
  must((await page.getByTestId('coin-address-text').count()) === 0, 'the address should wait for a yes to how receiving works');
  await shot('coins-how', 900);
  must(await button('Show my address').isDisabled(), 'Show my address should wait for the yes');
  await page.getByTestId('coins-agree').click();
  await tap('Show my address');
  await page.getByTestId('coin-qr').waitFor();
  const solAddress = await page.getByTestId('coin-address-text').innerText();
  must(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(solAddress), `the Dollar account's address should be a Solana one, not ${solAddress}`);
  await see('Solana only');
  await see('USDC · USDT · PYUSD');
  await see(`Starts ${solAddress.slice(0, 4)} and ends ${solAddress.slice(-4)}`);
  await shot('coins-in', 900);
  await tap('Send $100 of test USDT');
  await receiptSheet();
  await see('Coins in');
  await see('$100.00 USDT on Solana');
  await shot('coins-arrived', 900);
  await receiptDone();
  /* the yes is kept: the address straight away next time, how it works a tap under it */
  await page.goto(`${base}/coins`, { waitUntil: 'load' });
  await page.getByTestId('coin-qr').waitFor();
  await tap('How receiving works');
  await see('Pick Solana where you send from');
  /* the coins are a line in Activities, in dollars */
  await page.goto(`${base}/activities`, { waitUntil: 'load' });
  await see('Everything that moved');
  await see('USDT in');
  /* out to a Beetle $tag: free and at once */
  await page.goto(`${base}/dollars`, { waitUntil: 'load' });
  await see('Steady when the naira is not');
  await tap('Send');
  await see('to a Beetle $tag or any Solana wallet');
  at('/coins/send');
  await page.getByTestId('dollar-tag').fill('amaka');
  await see('Amaka Eze · Dollar account');
  await typeAmount(20);
  await see('They get $20.00');
  await shot('coins-tag', 700);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('$20.00 to $amaka');
  await shot('coins-tag-sent', 900);
  await receiptDone();
  /* out to a wallet: another network's address is named, a coin's own address refused, our own refused, a new one warned */
  await page.goto(`${base}/coins/send`, { waitUntil: 'load' });
  await tap('Solana wallet');
  const to = page.getByTestId('coin-to');
  await to.fill('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  await see('Beetle sends dollars on Solana only');
  await to.fill('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  await see('Coins sent to it are lost');
  await to.fill(solAddress);
  await see('That is your own Beetle address');
  await to.fill('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
  await see('starting 9WzD and ending AWWM');
  await see('A new address');
  await typeAmount(50);
  await see('They get $50.00');
  await shot('coins-out', 700);
  await slideToSend();
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  await see('$50.00 USDC to 9WzDXw…AWWM');
  await shot('coins-sent', 900);
  await receiptDone();
  /* the goal: Savings pot on the drawer opens Holiday, as Savings on home does */
  await page.goto(`${base}/services`, { waitUntil: 'load' });
  await see('Everything you can pay for from here');
  await tap('Savings pot');
  await see('₦250,000 by 12 March');
  at('/goal');
  console.log('Saving, in four taps');
  /* saving from home: Savings (1), Add money (2), the amount and Put away (3), the passcode (4) */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('Holiday · 33%');
  let taps = 0;
  const counted = async go => {
    taps++;
    await go();
  };
  await counted(() => page.getByTestId('grid-savings').click());
  await see('₦250,000 by 12 March');
  at('/goal');
  await see('33%');
  /* the page comes up as a white sheet over home, which steps back behind it, its top showing over the sheet's (Round 14) */
  await sheetStill();
  const over = await page.evaluate(() => {
    const grab = [...document.querySelectorAll('[data-testid="sheet-grabber"]')].pop()?.getBoundingClientRect();
    const pager = document.querySelector('[data-testid="pager"]')?.getBoundingClientRect();
    return { grab: grab ? Math.round(grab.y) : -1, home: pager ? Math.round(pager.width) : 0, homeTop: pager ? Math.round(pager.y) : -1 };
  });
  must(over.grab > 52 && over.grab < 80, `the goal page should be a sheet, its grabber near its top (${JSON.stringify(over)})`);
  must(over.home > 360 && over.home < 393 && over.homeTop > 30 && over.homeTop < 52, `with home stepped back behind it (${JSON.stringify(over)})`);
  /* Add money and Take out sit straight under the ring, in view without a scroll */
  const adding = await button('Add money').boundingBox();
  must(adding && adding.y + adding.height < 852 - 104, `Add money should be in view above the foot (at ${adding?.y})`);
  await shot('goal', 900);
  await counted(() => tap('Add money'));
  await page.getByTestId('goal-amount').waitFor();
  await see('Into Holiday');
  await counted(() => tap('Put ₦10,000 away'));
  await see('Enter your passcode');
  await counted(() => type(PASSCODE));
  await receiptSheet();
  must(page.url().includes('/receipt/'), 'adding money should open its receipt');
  must(taps === 4, `saving should take four taps from home, not ${taps}`);
  await shot('goal-receipt', 900);
  await page.goto(`${base}/goal`, { waitUntil: 'load' });
  await see('₦92,400');
  await see('37%');
  /* what feeds it is one row now, and the Feed sheet is behind it */
  await tap('What is feeding it');
  await see('Pick something that runs without you thinking about it');
  await shot('feed-goal', 700);
  await page.getByRole('switch', { name: 'Round ups' }).click();
  await page.waitForTimeout(300);
  await tap('Done');
  await see('Payday, cash back');
  await tap('What is feeding it');
  await see('Pick something that runs without you thinking about it');
  await page.getByRole('switch', { name: 'Round ups' }).click();
  await page.waitForTimeout(300);
  await tap('Done');
  await see('Payday, round ups, cash back');
  /* money out: Take out, the amount, the passcode, and the Taken back receipt */
  await tap('Take out');
  await page.getByTestId('goal-take').waitFor();
  await see('Holiday holds ₦92,400');
  await shot('goal-take', 700);
  await tap('₦5,000');
  await tap('Take ₦5,000 out');
  await see('Enter your passcode');
  await pay();
  await receiptSheet();
  must(page.url().includes('/receipt/'), 'taking money out should open its receipt');
  await shot('goal-taken', 900);
  /* a goal in three taps from home: Savings (1), New goal (2), Start saving (3), the sheet filled with Rent */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('Holiday · 35%');
  taps = 0;
  await counted(() => page.getByTestId('grid-savings').click());
  await counted(() => tap('New goal'));
  await page.getByTestId('goal-sheet').waitFor();
  await see('A new goal');
  must((await page.getByLabel('Goal name').inputValue()) === 'Rent', 'a new goal should come filled with the next idea, Rent');
  await shot('goal-new', 900);
  await counted(() => tap('Start saving for Rent'));
  await see('Fed by hand');
  await see('₦600,000 by');
  must(taps === 3, `a goal should take three taps from home, not ${taps}`);
  must((await page.getByTestId('goal-pill').count()) === 2, 'the two goals should sit as pills');
  await shot('goal-rent', 1200);
  /* the pills switch in place */
  await tap('Holiday');
  await see('₦250,000 by 12 March');
  await tap('Rent');
  await see('₦600,000 by');
  /* edited from the ···: the same sheet with the goal's own name */
  await page.getByTestId('goal-more').click();
  await tap('Edit goal');
  await page.getByTestId('goal-sheet').waitFor();
  await see('Edit Rent');
  await page.getByLabel('Goal name').fill('Rent for March');
  await tap('Save changes');
  await see('What is in it has not moved');
  await seeExactly('Rent for March');
  /* paused from the ···, and started again from Beetle's line */
  await page.getByTestId('goal-more').click();
  await tap('Pause goal');
  await see('Paused for now');
  await see('until you start it again');
  await shot('goal-paused-by-hand', 900);
  await tap('Start again');
  await see('is moving again');
  /* ended from the ···: empty, so the sheet asks first, End goal in red */
  await page.getByTestId('goal-more').click();
  await tap('End goal');
  await see('End Rent for March?');
  await shot('goal-end', 700);
  await page.getByTestId('goal-end').getByRole('button', { name: 'End goal', exact: true }).click();
  await see('Rent for March has ended');
  await see('₦250,000 by 12 March');
  must((await page.getByTestId('goal-pill').count()) === 1, 'the ended goal should leave the pills');
  /* home's card for two goals, then one again */
  await page.goto(`${base}/goal?two=1`, { waitUntil: 'load' });
  await see('Rent');
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('2 goals · 10%');
  await shot('home-two-goals', 900);
  /* money is tight: the switch on the Rules page pauses every goal; Start again on Beetle's line lifts it */
  await page.goto(`${base}/rules`, { waitUntil: 'load' });
  await see('What I can do without asking you first');
  await page.getByRole('switch', { name: 'Money is tight this month' }).click();
  await page.waitForTimeout(400);
  await page.goto(`${base}/goal`, { waitUntil: 'load' });
  await see('Paused while things are tight');
  await see('Waiting while it is paused');
  await shot('goal-paused', 900);
  await tap('Start again');
  await see('₦250,000 by 12 March');
  console.log('Saving from the chat');
  /* the Save chip: Save (1), Put away (2), the passcode (3), in the open chat */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-save', false);
  taps = 0;
  await counted(() => tap('Save'));
  await page.getByTestId('save-card').waitFor();
  must((await page.getByTestId('save-goal').count()) === 2, 'the Save card should offer both goals as pills');
  await shot('chat-save', 900);
  await counted(() => tap('Put ₦10,000 into Holiday'));
  await see('Enter your passcode');
  await counted(() => type(PASSCODE));
  await see('is in Holiday');
  must(taps === 3, `saving from the chat should take three taps, not ${taps}`);
  await shot('chat-saved', 900);
  /* typed, it is the same card, filled with what the words said */
  await page.getByLabel('Ask Beetle').fill('save 5k for rent');
  await tap('Send this');
  await see('Put ₦5,000 into Rent');
  await shot('chat-save-typed', 900);
  /* money health from the row at the top of Activities, and its offer to Set this up */
  await page.goto(`${base}/activities`, { waitUntil: 'load' });
  await see('Everything that moved');
  await onPage('activities');
  await tap('Money health');
  await see('One number for how you are handling it');
  at('/health');
  await see('out of 100');
  await shot('health', 900);
  await tap('Set it up');
  await see('Nothing is saved until you say yes');
  await see('Hold ₦5,000 back on payday');
  await tap('Set it up');
  await see('What I can do without asking you first');
  await see('Hold ₦5,000 back on payday');
  /* the words typed at home that open the goal, and a new one */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-goal', false);
  await page.getByLabel('Ask Beetle').fill('how is my savings goal');
  await tap('Send this');
  await see('₦250,000 by 12 March');
  at('/goal');
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-new-goal', false);
  await page.getByLabel('Ask Beetle').fill('I want to save up for a car');
  await tap('Send this');
  await page.getByTestId('goal-sheet').waitFor();
  must((await page.getByLabel('Goal name').inputValue()) === 'A car', 'the words should name the new goal');
  at('/goal');
  /* an account with no goal yet: Start a goal puts up the sheet, filled with Rent */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('No goal yet');
  await see('Nothing put aside yet');
  at('/goal');
  await shot('goal-none', 900);
  await tap('Start a goal');
  await page.getByTestId('goal-sheet').waitFor();
  await tap('Start saving for Rent');
  await see('Nothing in it yet');
  /* the draft: words typed and the keyboard up */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('A draft, unsent');
  await page.waitForTimeout(1200);
  must((await page.getByLabel('Ask Beetle').inputValue()) === 'Send 20k to Sarah for', 'the draft should be waiting in the bar');
  await shot('draft', 900);
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  console.log('When it goes wrong');
  /* a dispute from a receipt: Report a problem under its ··· then They say it never arrived opens the day-three dispute the day already holds for Sarah's rent */
  await page.goto(`${base}/receipt/l08`, { waitUntil: 'load' });
  await receiptSheet();
  await page.getByTestId('receipt-more').filter({ visible: true }).first().click();
  await tap('Report a problem');
  await see('Tell me which and I start it now');
  at('/wrong/l08');
  await tap('They say it never arrived');
  await see('Your dispute, day 3 of 5');
  at('/dispute/demo');
  await see('GTBank acknowledged');
  await shot('dispute', 900);
  await tap('See what was filed');
  await see('What was filed with GTBank');
  await shot('dispute-filed', 600);
  /* a payment that was not yours: the card is frozen first, and a dispute opens on day one, with Beetle's chat carrying its card */
  await page.goto(`${base}/receipt/l06`, { waitUntil: 'load' });
  await receiptSheet();
  await page.getByTestId('receipt-more').filter({ visible: true }).first().click();
  await tap('Report a problem');
  await see('Tell me which and I start it now');
  await tap('I did not make this payment');
  await see('Your dispute, day 1 of 5');
  await see('Card frozen');
  must(page.url().includes('/dispute/d'), 'a new dispute should open on a page of its own');
  await shot('dispute-new', 900);
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-the-dispute-chat', false);
  await openChats();
  await see('Your dispute, day 1 of 5');
  /* the day it closes, from the lab: the money back, and the closing letter into the chats */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('The dispute is closed');
  await see('It is already in your balance');
  at('/dispute/demo');
  await shot('dispute-closed', 900);
  await tap('Yes, tell me');
  await see('It is in your chats');
  /* Before I filled this in: a person read off a photo on Send money carries the note that opens it; the usual figure comes back */
  await page.goto(`${base}/send`, { waitUntil: 'load' });
  await see('Nothing moves until you slide');
  await page.getByTestId('to-camera').click();
  const sample7 = page.getByRole('button', { name: /sample photo/ }).first();
  await sample7.waitFor();
  await sample7.click();
  await tap('An account slip');
  await see('Read off the photo');
  await tap('Before I filled this in');
  await see('Beetle Reasoning');
  at('/checking');
  /* the slip carries no figure, so the amount is the one part not read */
  await see('Not read');
  await shot('checking', 900);
  await tap('It is ₦20,000');
  await see('the usual amount');
  at('/send');
  await see('₦20,000');
  /* I will not do this one: the whole balance to a number never paid, from Slide to send; a smaller figure instead */
  await page.goto(`${base}/send`, { waitUntil: 'load' });
  await see('Nothing moves until you slide');
  await page.getByTestId('to-input').fill('0123456785');
  await page.getByTestId('to-bank').filter({ hasText: 'GTBank' }).first().click();
  await see('Name checked at GTBank');
  await tap('All of it');
  await see(/All of it: ₦/);
  await slideToSend();
  await see('to an account I have never seen');
  at('/refused');
  await see('Four minutes');
  await shot('refused', 900);
  await tap('Send ₦20,000 instead');
  await see('Enough to check it arrives');
  at('/send');
  /* the same words in the chat: Beetle says why it stopped */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-refusal', false);
  await page.getByLabel('Ask Beetle').fill('send everything to 0123456789');
  await tap('Send this');
  await arrives('I will not do this one from here');
  /* and from the Send chip's card: a $tag never paid, All of it, Confirm — the card stops there too, before the passcode */
  const refusals = () => page.evaluate(() => (document.body.innerText.match(/Your whole balance, to an account/g) || []).length);
  const refusedBefore = await refusals();
  await tap('Send');
  await page.getByTestId('ask-to-input').last().waitFor();
  await page.getByTestId('ask-to-input').last().fill('$tobi');
  await page.getByTestId('to-choice').filter({ hasText: 'Tobi Bakare' }).first().click();
  await page.locator('[data-testid="ask"]').last().getByRole('button', { name: 'All of it', exact: true }).click();
  await page.getByTestId('ask-action').last().click();
  await page.waitForFunction(n => (document.body.innerText.match(/Your whole balance, to an account/g) || []).length > n, refusedBefore);
  must((await page.getByText('Enter your passcode').count()) === 0, 'the card should stop before the passcode');
  /* offline: the browser goes dark, and Slide to send goes to You are offline; queue it, and Beetle's chat holds it */
  await page.goto(`${base}/send?demo=1`, { waitUntil: 'load' });
  await see('I took this from your message');
  offline = true;
  await page.context().setOffline(true);
  await page.waitForTimeout(400);
  await slideToSend();
  await see('Nothing you do here gets lost');
  at('/offline');
  await shot('offline', 900);
  await page.context().setOffline(false);
  offline = false;
  await page.waitForTimeout(300);
  await tap('Do that');
  await see('Lite mode is on');
  await tap('Queue it for later');
  await see(DEMO_HOME);
  await onPage('home');
  await pull('card-for-the-queue', false);
  await openChats();
  await see('₦50,000 to Sarah, queued');
  /* the chat's own line while offline */
  await closeChats();
  await page.waitForTimeout(600);
  offline = true;
  await page.context().setOffline(true);
  await page.waitForTimeout(400);
  await page.getByLabel('Ask Beetle').fill('send 5k to sarah');
  await tap('Send this');
  await arrives('balance I cannot check');
  await page.context().setOffline(false);
  offline = false;
  /* Not enough: the goal gives the shortfall back, and Musa can be asked for it */
  await page.goto(`${base}/short?asked=20000&have=12480`, { waitUntil: 'load' });
  await see('short of the ₦20,000 you asked for');
  await tap('Move it from Holiday');
  /* money out of a goal goes through the passcode too (Round 23) */
  await see('Enter your passcode');
  await type(PASSCODE);
  await see('came back from Holiday');
  at('/send');
  await page.goto(`${base}/short?asked=20000&have=12480`, { waitUntil: 'load' });
  await see('short of the ₦20,000 you asked for');
  await tap('Ask Musa for ₦7,520');
  await see('Musa');
  at('/request');
  /* a transfer's line, opened on Activities, offers the same again, as an instruction of its own (the receipt sheet
     keeps to the receipt and its two ways on: Round 19) */
  await page.goto(`${base}/activities?receipt=l05`, { waitUntil: 'load' });
  await page.getByTestId('in-place-card').filter({ visible: true }).first().waitFor();
  await page.waitForTimeout(700);
  await tap('Set it up');
  await see('Send ₦8,000 to John Doe');
  await see('Every Friday');
  at('/rule');
  await tap('Set it up');
  await see('What I can do without asking you first');
  await see('Send ₦8,000 to John Doe');
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  console.log('When a transfer is not done');
  await tap('Still on its way');
  await see('Do not send it again');
  at('/transfer/l01');
  await shot('transfer-pending', 1200);
  await tap('Yes, tell me');
  await see('I will tell you');
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('It did not go');
  await see('Your balance is exactly what it was');
  at('/transfer/l02');
  await shot('transfer-failed', 900);
  await tap('Try again now');
  await see('Chidi Okafor');
  await see('The same as before');
  at('/send');
  await shot('transfer-failed-again', 600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('It came back');
  await see('Account could not be credited');
  at('/transfer/l03');
  await shot('transfer-reversed', 900);
  await tap('Try Musa again');
  await see('Musa Danjuma');
  at('/send');
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('What went wrong?');
  await see('The payment');
  at('/wrong/l08');
  await shot('transfer-wrong', 900);
  await tap('It went to the wrong person');
  await see('Beetle Recall');
  at('/recall/l08');
  await shot('transfer-recall', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('I sent it wrong');
  await see('You are covered');
  at('/alreadygone/l08');
  await shot('transfer-alreadygone', 900);
  await tap('Take ₦20,000 back');
  await receiptSheet();
  await see('Cover for a number read wrong');
  must(page.url().includes('/receipt/'), 'the cover should have its receipt');
  await shot('transfer-cover', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a receipt's way to say something is wrong, under its ···, leads to What went wrong? */
  await tap('A transfer');
  await receiptSheet();
  await see('Rent part payment');
  await page.getByTestId('receipt-more').filter({ visible: true }).first().click();
  await tap('Report a problem');
  await see('Tell me which and I start it now');
  at('/wrong/l08');
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the face that did not take: the line in red, the face key, and Cancel plain under the pad (the sixth digit sends it) */
  await tap('Face ID missed');
  await see('Face ID did not catch you');
  await button('Cancel').waitFor();
  await shot('passcode-face-missed', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* with nothing to offer, the empty card stands in the black card: the owner's No promos over a next step that is true
     for the account, no × and no dots, and the card keeps its height; a tap takes the step (Round 15, Round 16) */
  await tap('Nothing to offer');
  await arrives(DEMO_HOME);
  await see('No promos');
  await see('Add to Holiday whenever you like');
  must((await page.getByTestId('promo-close').count()) === 0 && (await page.getByTestId('promo-dots').count()) === 0, 'the quiet card should have no × and no dots');
  const quietH = (await page.getByTestId('card').boundingBox())?.height ?? 0;
  must(Math.round(quietH) === 392, `and the black card should keep its height (${quietH})`);
  await shot('home-quiet', 600);
  await page.getByTestId('promo-quiet').click();
  await button('Add money').waitFor();
  await tap('Back');
  await page.waitForTimeout(900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the first time: the card dips on its own, with the words that say why, then settles */
  await tap('The first time');
  await arrives(DEMO_HOME);
  const dip = await trace('first-time-dip', 3900, [['card', '[data-testid="card"]', false]], { picture: { at: 2150, name: 'home-first-dip' } });
  const deepest = Math.max(...dip.map(x => x.card?.height ?? 0));
  const settled = dip[dip.length - 1]?.card?.height ?? 0;
  const closed = dip[0]?.card?.height ?? 0;
  must(deepest >= closed + 18, `the card should dip on the first visit (deepest ${deepest}px from ${closed}px)`);
  must(settled < closed + 16, `and settle back (${settled}px, from ${closed}px)`);
  must((await page.getByText('Pull down to ask Beetle').count()) === 0, 'the grabber carries no words since Round 14: the dip alone shows the pull');
  console.log(`  the card dipped to ${Math.round(deepest)}px and settled at ${Math.round(settled)}px`);

  /* ---- Finishing setting up, and the first day ---- */
  console.log('Finishing setting up, and the first day');
  /* the lab's ready screen: Finish setting up opens Where you live, the street and the area typed in one card */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('Ready');
  await see('Your account is ready');
  await tap('Finish setting up');
  await see('Street, town and state');
  at('/way-in');
  await page.getByTestId('street').fill('12 Bode Thomas Street');
  /* Next on the keyboard goes on to the area box (Round 33: on the phone it went nowhere) */
  await page.getByTestId('street').press('Enter');
  must(await page.getByTestId('area').evaluate(e => e === document.activeElement), 'Next on the street should move to the area box');
  await page.getByTestId('area').fill('Surulere, Lagos State');
  await shot('setup-address', 700);
  await tap('Continue');
  await see('Lay it flat and fill the frame');
  await shot('setup-idcard', 700);
  await tap('Take it');
  await see('One tap. It is the last question');
  await shot('setup-income', 700);
  /* the four sources are radio rows, not buttons */
  await page.getByRole('radio', { name: 'A salary' }).click();
  await tap('Continue');
  await see('Everything you could already do');
  await shot('setup-full', 2300);
  await tap('Take me in');
  await see(DEMO_HOME);
  await onPage('home');
  /* the limits it opened: Spending limits no longer offers finishing setting up; the caps stay what you set */
  await page.goto(`${base}/limits`, { waitUntil: 'load' });
  await see('₦100,000');
  must((await page.getByText('Finish setting up').count()) === 0, 'the offer should be gone once setting up is done');
  await shot('limits-after-setup', 700);
  /* a new account's first day: the New account chip, the empty day, Activities with nothing yet, and the first question */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('A new account');
  await see(NEW_HOME);
  await see('New account');
  await shot('first-home', 900);
  await tap('New account');
  await see('Street, town and state');
  at('/way-in');
  /* Back sits beside Continue at the foot; the way in's own chevron at the top is the first Back in the page and hidden here */
  await page.getByTestId('back').click();
  await see(NEW_HOME);
  await onPage('home');
  await pull('first-question-card', false);
  await page.getByLabel('Ask Beetle').fill('What can you do?');
  await tap('Send this');
  await arrives('I have no history to read');
  await see('I only tell you things I have seen in your own money');
  await shot('first-question', 700);
  await page.goto(`${base}/activities`, { waitUntil: 'load' });
  await see('Every line here will open a receipt');
  await shot('activities-empty', 700);
  /* the offer where a limit is in the way: Dollars and Borrow say to finish setting up */
  await page.goto(`${base}/dollars`, { waitUntil: 'load' });
  await see('Finish setting up');
  await shot('dollars-before-setup', 700);

  /* ---- The app locked ---- */
  console.log('The app locked');
  /* opened with an account signed in, the app asks first: a wrong code says so, the right one opens it */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('The demo account');
  await see(DEMO_HOME);
  await page.evaluate(() => sessionStorage.setItem('beetle.walk.lock', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.getByTestId('app-lock').waitFor();
  await see('Welcome back, Ibrahim');
  await shot('app-lock', 500);
  /* the face or the fingerprint is asked first (Round 32); the web has neither, so the six digits */
  await button('Forgot passcode?').waitFor();
  await type('000000');
  await see('Not it. 2 more tries.');
  await type(PASSCODE);
  await page.getByTestId('app-lock').waitFor({ state: 'detached' });
  await see(DEMO_HOME);
  await page.evaluate(() => sessionStorage.removeItem('beetle.walk.lock'));
  /* a link that puts words in the owner's mouth is not asked: only a question the app sent itself */
  await page.goto(`${base}/home?say=${encodeURIComponent('Send 50k to Sarah #1')}`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await page.waitForTimeout(1500);
  must((await page.getByText('Send 50k to Sarah', { exact: true }).count()) === 0, 'words from a link outside the app should not be asked');

  /* ---- Getting an account back ---- */
  console.log('Getting an account back');
  /* the email lost: the code to the account's number, its BVN, and a live face, before anything changes; then a day's hold */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('Recover your account');
  await seeExactly('Recover your account');
  at('/way-in');
  await shot('recover');
  await type(DEMO_PHONE);
  await seeExactly('OTP verification');
  await type(CODE);
  await seeExactly('BVN number');
  await type('11111111111');
  await see('That is not the BVN on this account');
  await shot('recover-bvn-wrong');
  await type(NIN);
  await seeExactly('Face scan');
  await shot('recover-face');
  await tap('Scan my face');
  await seeExactly('Your email');
  await see('ibrahim.musa@example.com');
  await shot('recover-found');
  await tap('Change the email');
  await seeExactly('Enter new email');
  await page.getByTestId('email').first().fill('ibrahim.new@example.com');
  await tap('Send the code');
  await seeExactly('OTP verification');
  await see('ibrahim.new@example.com');
  await type(CODE);
  await see('Your email is changed');
  await see('no more than ₦20,000 can leave');
  await shot('recovered', 600);
  await tap('Take me in');
  await arrives(DEMO_HOME);
  at('/home');
  /* the day's hold is in Settings too, with This wasn't me */
  await page
    .getByTestId('cover')
    .first()
    .waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => {});
  await tap('Settings');
  await see('Your email was changed today');
  await shot('hold-notice', 500);

  /* ---- Signing up again on the same phone (Round 34) ---- */
  console.log('Signing up again on the same phone');
  /* this build keeps the accounts it opens on the phone: the Google stand-in's own account already opened here is said
     so, the button reads Log in instead (it was left blank, the owner's phone), and another Google account typed opens
     a new one */
  await tap('Sign out');
  await page.getByTestId('confirm-sign-out').getByRole('button', { name: 'Sign out', exact: true }).click();
  await see('Sign up');
  at('/way-in');
  await page.evaluate(() =>
    localStorage.setItem(
      'beetle.accounts.v1',
      JSON.stringify([
        { accountNumber: '0155550000', phone: '08035550000', email: 'ibrahim.musa@gmail.com', signInWith: 'google', firstName: 'Ibrahim', lastName: 'Musa', createdAt: '2026-10-01T09:00:00Z' },
      ]),
    ),
  );
  await tap('Sign up');
  await seeExactly('Enter mobile number');
  await tap('Google');
  await seeExactly('Continue with Google');
  await tap('Continue as Ibrahim');
  await see('This Google email already has a Beetle account');
  await page.waitForTimeout(1200);
  const shownBar = await page.evaluate(() => {
    const words = [...document.querySelectorAll('div')].find(d => d.childElementCount === 0 && d.textContent === 'Log in instead');
    let o = 1;
    for (let n = words; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return words ? o : -1;
  });
  must(shownBar > 0.9, `the button should read Log in instead, not be left blank (its words at opacity ${shownBar})`);
  await see('Test build: start over on this phone');
  await shot('provider-taken', 500);
  await tap('Use another Google account');
  await page.getByTestId('provider-email').fill('ada.obi@gmail.com');
  await see('Continue as Ada');
  await tap('Continue as Ada');
  await seeExactly('Your details');
  must((await page.getByTestId('full-name').inputValue()) === 'Ada Obi', 'the name Google handed over should be in the box');
  /* Start over on this phone, in Settings: every account opened here forgotten, so the stand-in's own opens again */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('The demo account');
  await see(DEMO_HOME);
  await page.goto(`${base}/settings`, { waitUntil: 'load' });
  await see('What keeps the money yours');
  await tap('Start over on this phone');
  /* the phone forgets, then the app opens again from nothing */
  const reopened = page.waitForEvent('load', { timeout: 15000 });
  await page.getByTestId('confirm-start-over').getByRole('button', { name: 'Start over', exact: true }).click();
  await reopened;
  await button('Sign up').waitFor();
  must((await page.evaluate(() => localStorage.getItem('beetle.accounts.v1'))) === null, 'the accounts kept on this phone should be gone');
  await tap('Sign up');
  await seeExactly('Enter mobile number');
  await tap('Google');
  await tap('Continue as Ibrahim');
  await seeExactly('Your details');
  await shot('started-over', 500);
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
