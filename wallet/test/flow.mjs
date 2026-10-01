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
const DEMO_PHONE = '09069113588';
const NEW_PHONE = '08123456789';
/* the owner's passcode: the code backwards, which this build lets through */
const PASSCODE = '654321';

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
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
    if (picture && !taken && Date.now() - t0 >= picture.at) {
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
          /* a selector: the element itself */
          const el = document.querySelector(match);
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
  await page.getByText('Beetle', { exact: true }).first().waitFor();
  await shot('boot', 250);

  console.log('Opening an account');
  await see('Open an account');
  at('/way-in');
  await shot('welcome');

  /* the whole change traced from the tap, with a frame mid-way: the welcome
     softens out in 280ms, the number step sharpens in over 520ms */
  const tapped = Date.now();
  await tap('Open an account');
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
     mid-way can take longer than the fade itself) */
  const seen = change.findIndex(x => x.welcome);
  const gone = seen < 0 ? undefined : change.find((x, i) => i > seen && (!x.welcome || x.welcome.opacity < 0.15));
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
  at('/way-in');
  await shot('code');
  await type('111111');
  await see('did not match');
  await shot('code-wrong');
  await type(CODE);

  await see('whichever you know');
  at('/way-in');
  await shot('identity');
  await type('12340000123');
  await see('Nothing came back');
  await shot('no-match');
  await tap('Try again');
  await see('whichever you know');
  at('/way-in');
  await type(NIN);

  await see('Ibrahim Musa');
  at('/way-in');
  await shot('confirm');
  await tap('Yes, that is me');
  await shot('confirm-leaving', 120);

  await see('Hold still and look at the camera');
  at('/way-in');
  await shot('face');
  await tap('Take it');
  await button('Hold still…').waitFor();
  await shot('face-checking', 100);

  await see('pick something nobody watching could guess');
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
  await see('The same six, to be sure');
  await shot('passcode-again');
  await type('654322');
  await see('They did not match');
  await shot('passcode-mismatch');
  await type(PASSCODE);
  await see('The same six, to be sure');
  await type(PASSCODE);

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

  await see(NEW_HOME);
  await onPage('home');
  await shot('home-new');

  console.log('Coming back');
  /* opening the app again starts at the loading screen; the session was
     kept, so it goes home, and the way in is not for somebody who is already
     in: it sends them home too */
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByText('Beetle', { exact: true }).first().waitFor();
  await shot('boot-again', 250);
  await see(NEW_HOME);
  await onPage('home');
  await page.goto(`${base}/way-in`, { waitUntil: 'load' });
  await see(NEW_HOME);
  await onPage('home');

  console.log('The lab, behind the version line');
  /* the card's header carries only the word Wallet: Settings is the gear on the bar */
  must((await page.getByTestId('mark').count()) === 0, 'the card should carry no mark: Settings is on the bar');
  must((await page.getByTestId('wallet').count()) === 1, 'the word Wallet should stay in the header');
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
  await see('Open an account');
  at('/way-in');
  /* and home, or a later step, is not for somebody who is not */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('Open an account');
  at('/way-in');
  /* and an address that is not a screen goes back to the start: the boot, and the way in */
  await page.goto(`${base}/passcode`, { waitUntil: 'load' });
  await see('Open an account');
  at('/way-in');

  console.log('Signing in');
  await page.goto(`${base}/way-in`, { waitUntil: 'load' });
  await see('Open an account');
  await tap('Sign in');
  await see('Welcome back');
  at('/way-in');
  await shot('sign-in');
  await type('09020000000');
  await see('I do not know this number yet');
  await shot('sign-in-unknown');
  await wipe(11);
  await type(DEMO_PHONE);
  await see('On a phone I already know');
  at('/way-in');
  await shot('sign-in-code');
  await type(CODE);

  await arrives(DEMO_HOME);
  at('/home');
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
  /* under the black card, four cards two by two, Fuse's way: Savings with its ring and how it is going, Loan, Card, and Services */
  await see('Holiday · 33%');
  await see('A fortnight ahead');
  await see('•••• 4471');
  await see('Airtime');
  must((await page.getByText('See all').count()) === 0, 'the record should have left home for Activities');
  must((await page.getByTestId('grid-savings').boundingBox())?.height === 152, 'the cards are 152 tall');
  /* the Services card swipes through its three inside itself: the swipe is the card's, and the pages stay */
  const strip = await page.getByTestId('services-strip').boundingBox();
  await drag(strip.x + strip.width - 12, strip.y + 40, strip.x + 12, strip.y + 42);
  await onPage('home');
  await see('Light, TV and more');
  await shot('home-services-bills', 300);
  await drag(strip.x + strip.width - 12, strip.y + 40, strip.x + 12, strip.y + 42);
  await see('A plan for any line');
  /* anywhere else a swipe to the left turns the pages on: Activities, then Settings, and no further; a swipe to the right comes back */
  await drag(340, 450, 60, 455);
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
    const grab = await page.getByText('Pull down', { exact: true }).first().boundingBox();
    must(grab, 'the grabber should be on the card');
    const gx = grab.x + grab.width / 2;
    const gy = grab.y;
    const pulled = Date.now();
    /* the finger and the trace run together, so the drag itself is in the samples */
    const finger = (async () => {
      await page.mouse.move(gx, gy);
      await page.mouse.down();
      for (let i = 1; i <= 16; i++) {
        await page.mouse.move(gx, gy + i * 22);
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
  await see('Beetle Transfers');
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
  await type(PASSCODE);
  await see('is with Sarah Adeyemi');
  /* what the passcode said leaves Everyday is what leaves: the ₦20,000 and the ₦26.88 fee */
  await see('₦575,293');
  /* and the receipt lands in the chat, in a few words */
  await see('The full receipt');
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
  /* the transfer is a line on Activities, the next page along */
  await tap('Activities');
  await onPage('activities');
  await see('GTBank · sent');
  await shot('activities-after-transfer');
  await tap('Home');
  await onPage('home');

  console.log('Being paid');
  /* Receive on the card puts up the sheet with the four ways money can come;
     Bank transfer sends it down and opens Three ways to be paid, with the
     number to copy and the code behind Show it */
  await tap('Receive');
  await see('Pick how you want the money to reach you');
  await shot('receive-sheet', 900);
  await tap('Bank transfer');
  await see('All of them safe to hand out');
  at('/ways');
  must((await page.getByText('Pick how you want').filter({ visible: true }).count()) === 0, 'the sheet should have gone down before the page came');
  await shot('ways', 900);
  await tap('Copy it');
  /* the browser may still refuse the clipboard on a machine with none; the
     page says so either way, and that is what is checked */
  const copied = page.getByText('copied. Paste it anywhere.').filter({ visible: true }).first();
  const refused = page.getByText('cannot reach the clipboard').filter({ visible: true }).first();
  await Promise.race([copied.waitFor(), refused.waitFor()]);
  console.log(`  the number was ${(await copied.count()) ? 'copied' : 'not copied: this browser has no clipboard to give'}`);
  await tap('Show it');
  await see('Point their camera at this');
  at('/mycode');
  /* the code is a real one: its modules drawn as one path, its three eyes as rounded squares */
  const modules = await page.locator('[data-testid="code"] path').first().getAttribute('d');
  must(modules && modules.startsWith('M') && modules.length > 400, 'the code should be drawn as a path of modules');
  await shot('mycode', 900);
  /* Save it on the web downloads the picture; Share it, with no share sheet here, puts the words on the clipboard */
  await tap('Save it');
  const saved = page
    .getByText(/Downloaded|would not take|cannot draw|Nothing here to save/)
    .filter({ visible: true })
    .first();
  await saved.waitFor();
  console.log(`  Save it: ${(await saved.innerText()).trim()}`);
  await tap('Share it');
  await page
    .getByText(/No share sheet here/)
    .filter({ visible: true })
    .first()
    .waitFor();
  await tap('Back');
  await see('All of them safe to hand out');
  await tap('Back');
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
  await see('Pick how you want the money to reach you');
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
  await see('Beetle Transfers');
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
  await tap('Your face');
  await see('Hold still and look at the camera');
  at('/way-in');
  await see('Your number');
  await see('Who you are');
  await shot('lab-face');
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
  await see('Beetle Transfers');
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
  /* a receipt lands in the chat after the passcode, in a few words; a tap opens it where it is, a
     little larger with a few lines more, over the chat gone soft under the dark veil — never half the screen */
  await tap('A receipt in the chat');
  await see('The full receipt');
  await shot('lab-receipt-card', 900);
  const small = await page.getByTestId('receipt-card').boundingBox();
  await tap('Receipt');
  await page.getByTestId('chat-receipt-card').waitFor();
  await page.waitForTimeout(800);
  const big = await page.getByTestId('chat-receipt-card').boundingBox();
  must(
    small && big && big.height > small.height + 60 && big.height < 852 / 2,
    `the receipt should open a little larger, never half the screen (${Math.round(small?.height ?? 0)} → ${Math.round(big?.height ?? 0)})`,
  );
  must(big.y <= small.y + 1, `and open where it is (${Math.round(small.y)} → ${Math.round(big.y)})`);
  must((await page.getByTestId('chat-receipt-veil').count()) === 1, 'the chat should go soft under the dark veil');
  await see('Balance after');
  await shot('chat-receipt-open', 300);
  console.log(`  the receipt opened from ${Math.round(small.height)} to ${Math.round(big.height)} tall, where it was`);
  /* the full receipt is one tap further */
  await tap('The full receipt');
  await see('All done');
  must(page.url().includes('/receipt/'), 'The full receipt should open the page');
  await shot('receipt-live', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the receipt pages from the frames: a transfer, its session id copied, its share sheet, what Beetle offers */
  await tap('A transfer');
  await see('Rent part payment');
  at('/receipt/l08');
  await shot('receipt-transfer', 500);
  await tap('Copy it');
  await page
    .getByText(/copied\. Paste it anywhere\.|cannot reach the clipboard/)
    .first()
    .waitFor();
  await tap('Share receipt');
  await see('Share this receipt');
  await shot('receipt-share', 900);
  await tap('Done');
  await page.getByText('Share this receipt').first().waitFor({ state: 'hidden' });
  /* what Beetle offers on the receipt leads to the instruction, offered */
  await tap('Set it up');
  await see('Nothing is saved until you say yes');
  at('/rule');
  await tap('Not now');
  await see('Rent part payment');
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('A bill paid');
  await see('Copy the token');
  at('/receipt/l11');
  await shot('receipt-bill', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  await tap('Money in');
  await see('None on money in');
  at('/receipt/l10');
  await shot('receipt-in', 500);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* Settings, from the gear on the bar: the pages slide across under the bar, which stays where it is,
     its glyphs and its plus untouched; the gear is solid and black once its page is showing */
  await tap('The demo account');
  await see('Pull down');
  /* home has come, and the foot has finished turning into the bar (from the receipt's Back and ask bar, a moment
     ago): risen into its place, the plus grown to its size */
  await page.waitForFunction(() => {
    const bar = document.querySelector('[data-testid="bar"]');
    const plus = bar?.querySelector('[aria-label="More"]');
    return !!bar && !!plus && Math.abs(new DOMMatrix(getComputedStyle(bar).transform).m42) < 0.5 && plus.getBoundingClientRect().height > 55;
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
  await tap('Your details');
  await see('Member since');
  await shot('settings-details', 900);
  await tap('Done');
  /* every row leads somewhere: Lock and privacy, and its switches kept on the phone. The page's
     title arrives with the rest of the page, in its own place: it does not travel from the row or grow */
  await tap('Lock and privacy');
  const journey = await trace('journey-lock', 1100, [['head', '[data-testid="head"]']], { picture: { at: 140, name: 'journey-lock-mid' } });
  const heads = journey.map(x => x.head).filter(h => h && h.opacity > 0.01);
  must(heads.length > 3, 'the title should be arriving');
  const headTops = heads.map(h => h.top);
  must(Math.max(...headTops) - Math.min(...headTops) < 4, `the title should arrive in its own place, not travel (${headTops.map(t => Math.round(t)).join(' ')})`);
  console.log(`  the title arrived in its place at ${Math.round(headTops[headTops.length - 1])}, with the page`);
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
  await see('A new passcode');
  at('/newcode');
  await shot('settings-newcode', 500);
  await type('246810');
  await see('Once more');
  await type('246810');
  await see('Your passcode is new');
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
  await see('Pull down');
  /* the card, from its row and from the day's tile */
  await tap('Settings');
  await tap('Cards');
  await see('Made for one merchant');
  at('/card');
  await shot('settings-card', 500);
  await tap('Reveal');
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
  await see('Pull down');
  await tap('Settings');
  await see('What keeps the money yours');
  await tap('Sign out');
  await page.getByTestId('confirm-sign-out').getByRole('button', { name: 'Sign out', exact: true }).click();
  await see('Open an account');
  at('/way-in');
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the bar at the foot of home, More up out of its plus, and the record */
  await tap('The bar');
  await see('Pull down');
  await button('More').waitFor();
  await shot('home-bar', 900);
  await tap('More');
  await see('Send money');
  await shot('home-more', 900);
  must((await page.getByRole('button', { name: 'History', exact: true }).count()) === 0, 'More should carry three, not the two the bar has');
  must((await page.getByTestId('more-veil').count()) === 1, 'More should open over the page under its white veil');
  await button('Close').last().click();
  /* More folds away and then goes (another Send money, on a page to the side, is not More's) */
  await page.getByTestId('more').waitFor({ state: 'detached' });
  must((await page.getByTestId('more-veil').count()) === 0, 'the veil should go with More');
  await tap('Settings');
  await see('What keeps the money yours');
  await onPage('settings');
  await tap('Home');
  await see('Pull down');
  await onPage('home');
  await tap('Activities');
  await see('Everything that moved');
  await onPage('activities');
  /* all of the record is here now: Money health at the top, All / Insights / In / Out, what Beetle noticed among the lines */
  await see('Money health');
  await see('Your usual top up');
  await shot('activities', 700);
  await tap('In');
  must((await page.getByText('Pagrin Limited').filter({ visible: true }).count()) === 1, 'In should keep the salary');
  must((await page.getByText('Ikeja Electric').filter({ visible: true }).count()) === 0, 'and drop what went out');
  await tap('Insights');
  await see('Where your money went');
  must((await page.getByText('Pagrin Limited').filter({ visible: true }).count()) === 0, 'Insights should hold what Beetle noticed, not the lines');
  await shot('activities-insights', 400);
  await tap('All');
  /* a settled line opens where it is: the line stays put and sharp, the page goes soft under a frost of
     white, and what the line does not say grows in under it — nothing pushed, nothing filling the screen */
  await button('Ikeja Electric').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const ikejaRow = await button('Ikeja Electric').boundingBox();
  await tap('Ikeja Electric');
  const opened = await trace(
    'in-place',
    900,
    [
      ['line', '[data-testid="in-place-line"]'],
      ['card', '[data-testid="in-place-card"]'],
    ],
    { picture: { at: 140, name: 'in-place-mid' } },
  );
  const held = opened.map(x => x.line).filter(Boolean);
  must(held.length > 3 && Math.abs(held[0].top - (ikejaRow?.y ?? 0)) < 6, `the line should stay where it was (${Math.round(held[0]?.top ?? 0)}, the line at ${Math.round(ikejaRow?.y ?? 0)})`);
  await page.getByTestId('in-place-card').waitFor();
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
  /* and a tap off it puts it all back */
  await page.getByTestId('in-place-away').click({ position: { x: 200, y: 40 } });
  await page.getByTestId('in-place').waitFor({ state: 'detached' });
  await see('Everything that moved');
  await onPage('activities');
  const barBack = await page
    .waitForFunction(() => (document.querySelector('[data-testid="glyph-home"]')?.getBoundingClientRect().top ?? 9999) < window.innerHeight - 20, null, { timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  must(barBack, 'the bar should be back once the line is closed');
  /* a line still on its way opens its own page, its title coming up from the line's words */
  await tap('Sarah Adeyemi');
  await see('Do not send it again');
  at('/transfer/l01');
  await tap('Back');
  await see('Everything that moved');
  await tap('More');
  await see('Send money');
  await tap('Send money');
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
  await page.getByTestId('chat-receipt-card').waitFor();
  await see('None on money in');
  await tap('The full receipt');
  await see('Money in');
  must(page.url().includes('/receipt/'), 'the card in the chat should lead to the receipt');
  await shot('lab-arrival-receipt', 900);
  await tap('Back');
  await page.waitForTimeout(700);
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
  await type(PASSCODE);
  await see('is with John Doe');
  await see('The full receipt');
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
  await type(PASSCODE);
  await see('The token is');
  await see('The full receipt');
  await shot('ask-bill-paid', 600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  console.log('Sending money');
  /* Send money, from the card: To first, which takes a $tag, a name or a number; the amount
     picked where it is; a reference typed in place; the slide; the passcode with the whole
     of it on it; and the receipt, with the line in the day after */
  const slideToSend = async () => {
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
  await see('Pull down');
  await tap('Send');
  await see('Nothing moves until you slide');
  at('/send');
  const slideFill = () => page.getByTestId('slide').evaluate(el => getComputedStyle(el).backgroundColor);
  must((await slideFill()) === 'rgb(245, 245, 247)', `the slide should wait, in the pale grey, for someone and an amount (${await slideFill()})`);
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
  must((await slideFill()) === 'rgb(0, 0, 0)', 'the slide should be black once there is someone and an amount');
  await shot('send-filled', 500);
  await slideToSend();
  await see('Enter your passcode');
  /* the passcode says the whole of it while the digits go in, and Cancel is plain under the pad */
  await see('They receive');
  await see('Leaves Everyday');
  await button('Cancel').waitFor();
  await shot('send-passcode', 600);
  await type(PASSCODE);
  await see('Sent to John Doe');
  must(page.url().includes('/receipt/'), 'the passcode should lead to the receipt');
  await see('Lunch');
  await shot('send-receipt', 900);
  await tap('Back');
  await see('Pull down');
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
  await type(PASSCODE);
  await see('Sent to Sarah Adeyemi');
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
  await tap('Ikeja Electric');
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
  await type(PASSCODE);
  await see('Bill paid');
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
  await type(PASSCODE);
  await see('All done');
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
  await type(PASSCODE);
  await see('All done');
  await see('5GB for 30 days · Mum');
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
  await type(PASSCODE);
  await see('Money in');
  await see('From Beetle Loans');
  await shot('loan-receipt', 900);
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
  await type(PASSCODE);
  await see('Bill paid');
  await see('Meter token');
  await shot('meter-receipt', 900);
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  console.log('Dollars, the goal and money health');
  /* the dollars chip on the card opens Dollars; Convert takes a figure, the passcode, and lands on Converted */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await page.getByTestId('chip').click();
  await see('Steady when the naira is not');
  at('/dollars');
  await see('$412.60');
  await shot('dollars', 900);
  await tap('Convert');
  await see('Naira into dollars');
  at('/convert');
  await typeAmount(155200);
  await see('You get about $100.00');
  await shot('convert', 600);
  await slideToSend();
  await see('Enter your passcode');
  await type(PASSCODE);
  await see('It is in your dollars already');
  must(page.url().includes('/converted/'), 'converting should land on Converted');
  await see('$512.60');
  await shot('converted', 900);
  await tap('See your dollars');
  await see('Steady when the naira is not');
  await see('$512.60');
  /* Send from the dollars: the From row's sheet, the figure in dollars under the amount, no fee, and the receipt saying From Dollars */
  await tap('Send');
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
  await type(PASSCODE);
  await see('All done');
  await see('$32.22 at ₦1,552 to $1');
  await shot('send-dollars-receipt', 900);
  /* the goal: Savings pot on the drawer opens Holiday; Feed it more is the sheet; Add money puts the picker up over the page, then the passcode and a receipt */
  await page.goto(`${base}/services`, { waitUntil: 'load' });
  await see('Everything you can pay for from here');
  await tap('Savings pot');
  await see('₦250,000 by 12 March');
  at('/goal');
  await see('33%');
  await shot('goal', 900);
  await tap('Feed it more');
  await see('Pick something that runs without you thinking about it');
  await shot('feed-goal', 700);
  await page.getByRole('switch', { name: 'Round ups' }).click();
  await page.waitForTimeout(300);
  await tap('Done');
  await see('Turned off');
  await tap('Feed it more');
  await see('Pick something that runs without you thinking about it');
  await page.getByRole('switch', { name: 'Round ups' }).click();
  await page.waitForTimeout(300);
  await tap('Done');
  await see('₦2,280');
  await tap('Add money');
  await page.getByTestId('goal-amount').waitFor();
  await see('Into Holiday');
  await tap('₦5,000');
  await tap('Put ₦5,000 away');
  await see('Enter your passcode');
  await type(PASSCODE);
  await see('All done');
  await see('Put away');
  must(page.url().includes('/receipt/'), 'adding money should open its receipt');
  await shot('goal-receipt', 900);
  await page.goto(`${base}/goal`, { waitUntil: 'load' });
  await see('₦87,400');
  await see('35%');
  /* money is tight: the switch on the Rules page pauses the goal; Start again lifts it */
  await page.goto(`${base}/rules`, { waitUntil: 'load' });
  await see('What I can do without asking you first');
  await page.getByRole('switch', { name: 'Money is tight this month' }).click();
  await page.waitForTimeout(400);
  await page.goto(`${base}/goal`, { waitUntil: 'load' });
  await see('Paused while things are tight');
  await see('Paused since 3 August');
  await shot('goal-paused', 900);
  await tap('Start again');
  await see('₦250,000 by 12 March');
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
  /* the words typed at home that open the goal */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see(DEMO_HOME);
  await pull('card-for-goal', false);
  await page.getByLabel('Ask Beetle').fill('how is my savings goal');
  await tap('Send this');
  await see('₦250,000 by 12 March');
  at('/goal');
  /* an account with no goal yet: Start a goal makes one */
  await page.goto(`${base}/lab`, { waitUntil: 'load' });
  await see('Beetle Lab');
  await tap('No goal yet');
  await see('Nothing put aside yet');
  at('/goal');
  await shot('goal-none', 900);
  await tap('Start a goal');
  await see('₦250,000 by 12 March');
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
  await see('Sent to Sarah Adeyemi');
  await page.getByTestId('more-menu').click();
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
  await see('Sent to Sarah Adeyemi');
  await page.getByTestId('more-menu').click();
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
  await see('came back from Holiday');
  at('/send');
  await page.goto(`${base}/short?asked=20000&have=12480`, { waitUntil: 'load' });
  await see('short of the ₦20,000 you asked for');
  await tap('Ask Musa for ₦7,520');
  await see('Musa');
  at('/request');
  /* a transfer's receipt offers the same again, as an instruction of its own */
  await page.goto(`${base}/receipt/l05`, { waitUntil: 'load' });
  await see('Sent to John Doe');
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
  await see('Money in');
  await see('Cover for a number read wrong');
  must(page.url().includes('/receipt/'), 'the cover should have its receipt');
  await shot('transfer-cover', 900);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a receipt's way to say something is wrong, under its ···, leads to What went wrong? */
  await tap('A transfer');
  await see('Rent part payment');
  await page.getByTestId('more-menu').click();
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
  /* the first time: the card dips on its own, with the words that say why, then settles */
  await tap('The first time');
  await arrives(DEMO_HOME);
  const dip = await trace('first-time-dip', 3900, [['card', '[data-testid="card"]', false]], { picture: { at: 2150, name: 'home-first-dip' } });
  const deepest = Math.max(...dip.map(x => x.card?.height ?? 0));
  const settled = dip[dip.length - 1]?.card?.height ?? 0;
  const closed = dip[0]?.card?.height ?? 0;
  must(deepest >= closed + 18, `the card should dip on the first visit (deepest ${deepest}px from ${closed}px)`);
  must(settled < closed + 16, `and settle back (${settled}px, from ${closed}px)`);
  must((await page.getByText('Pull down to ask Beetle').count()) > 0, 'the grabber should say what the pull is for');
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
  await page.getByLabel('Street').fill('12 Bode Thomas Street');
  await page.getByLabel('Area, town and state').fill('Surulere, Lagos State');
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
