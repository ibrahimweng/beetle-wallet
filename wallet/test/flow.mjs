/* The whole way in, driven through a browser against the exported web bundle,
   which is the same JavaScript the phone runs. It opens on the lab, picks the
   welcome, opens an account from there to home, comes back to find the
   session kept, signs out, tries the doors that should be shut, signs back in
   with the number the design is drawn around, and then uses the lab to open
   a step deep in the way in and home on its own. Every screen on the way is
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
  console.log('The lab');
  /* this build opens on the lab; the welcome is its first place */
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByText('Beetle', { exact: true }).first().waitFor();
  await shot('boot', 250);
  await see('Beetle Lab');
  at('/lab');
  await shot('lab');
  await tap('Welcome');

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

  await see('Nothing has moved yet');
  at('/home');
  await shot('home-new');
  await toBottom();
  await shot('home-new-bottom');

  console.log('Coming back');
  /* opening the app again starts at the loading screen, which in this build
     goes to the lab; the session was kept, so the way in is not for somebody
     who is already in, and sends them home */
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.getByText('Beetle', { exact: true }).first().waitFor();
  await shot('boot-again', 250);
  await see('Beetle Lab');
  at('/lab');
  await page.goto(`${base}/way-in`, { waitUntil: 'load' });
  await see('Nothing has moved yet');
  at('/home');

  console.log('Signing out');
  /* the mark at the top left opens Settings, and Sign out is there */
  await tap('Settings');
  await see('What keeps the money yours');
  at('/settings');
  await tap('Sign out');
  await see('Open an account');
  at('/way-in');
  /* and home, or a later step, is not for somebody who is not */
  await page.goto(`${base}/home`, { waitUntil: 'load' });
  await see('Open an account');
  at('/way-in');
  /* and an address that is not a screen goes back to the start */
  await page.goto(`${base}/passcode`, { waitUntil: 'load' });
  await see('Beetle Lab');
  at('/lab');

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

  await arrives('Money health');
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
  await tap('In');
  await shot('home-in', 400);
  await tap('All');
  await toBottom();
  await shot('home-bottom');

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
  must(last && last.card && last.card.height >= 600 && last.card.height <= 700, `the card should open until only the head of the day, its chips and the shortcuts show (${last?.card?.height}px)`);
  must(last.figure && last.figure.size <= 21, `the figure should have shrunk into the header (${last.figure?.size}px)`);
  const grew = opening.map(x => Math.round(x.card?.height ?? 0));
  must(new Set(grew).size >= 4, `the card should grow through the drag, not jump (${grew.join(' ')})`);
  console.log(`  card ${grew[0]} → ${grew[grew.length - 1]}px, figure ${opening[0].figure?.size} → ${last.figure.size}px`);
  /* the reading in dollars sits after the figure in the header now, and the
     head of the day with its chips still shows under the card */
  const chip = await page.getByRole('button', { name: 'Your dollars', exact: true }).filter({ visible: true }).last().boundingBox();
  must(chip && chip.x > 150 && chip.y < 80, `the dollars chip should sit after the figure in the header (at ${chip?.x},${chip?.y})`);
  const chipsRow = await page.getByRole('button', { name: 'Chats', exact: true }).boundingBox();
  must(chipsRow && chipsRow.y > last.card.height && chipsRow.y + chipsRow.height <= 852, `the chips should show under the open card (at ${chipsRow?.y})`);
  /* and the shortcuts under the chips, whole, on the screen */
  const bills = await page.getByRole('button', { name: 'Bills', exact: true }).filter({ visible: true }).first().boundingBox();
  must(bills && bills.y > chipsRow.y + chipsRow.height && bills.y + bills.height <= 852, `the shortcuts should sit under the chips (at ${bills?.y})`);
  await shot('home-chat-open');

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
    growing.push(await page.evaluate(() => (document.body.innerText.match(/₦20,000 to Sarah Adeyemi[^\n]*/) || [''])[0].length));
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
  await see('₦575,320');
  /* and the receipt lands in the chat, in a few words */
  await see('The full receipt');
  await shot('chat-transfer-sent', 500);
  /* a push up on the chat, now at its end, brings the card back up; the day
     has the transfer in it, and the chat that made it, filed at the top */
  await pushUp(196, 520);
  must((await page.locator('[data-testid="card"]').boundingBox())?.height < 420, 'a push up on the chat should close the card');
  await see('GTBank · sent');
  await see('Send 20k to Sarah');
  await shot('home-after-transfer');

  console.log('Being paid');
  /* Receive opens the card on the account's own details; the number can be
     copied, and Done closes the card again */
  await tap('Receive');
  await see('Your account number');
  await see('0102 4457 88');
  await shot('receive', 900);
  await tap('Copy the number');
  /* the browser may still refuse the clipboard on a machine with none; the
     pane says so either way, and that is what is checked */
  const copied = page.getByText('copied. Paste it anywhere.').filter({ visible: true }).first();
  const refused = page.getByText('cannot reach the clipboard').filter({ visible: true }).first();
  await Promise.race([copied.waitFor(), refused.waitFor()]);
  console.log(`  the number was ${(await copied.count()) ? 'copied' : 'not copied: this browser has no clipboard to give'}`);
  await tap('Done');
  await page.waitForTimeout(900);
  const afterDetails = await page.locator('[data-testid="card"]').boundingBox();
  must(afterDetails && afterDetails.height < 420, `Done should close the card again (${afterDetails?.height}px)`);

  console.log('The chats in the day');
  /* under their own chip: the one just filed, and the one Beetle started */
  await tap('Chats');
  await page.waitForTimeout(400);
  await see('Your usual top up');
  must((await page.getByText('Money health').filter({ visible: true }).count()) === 0, 'the Chats chip should show chats only');
  await shot('home-chats');
  /* a chat's row picks it back up where it was, panels and all */
  await tap('Send 20k to Sarah');
  await see('Beetle Transfers');
  await page.waitForTimeout(700);
  await shot('chat-reopened');
  /* and a push up on the day below closes it too */
  await pushUp(196, 690);
  must((await page.locator('[data-testid="card"]').boundingBox())?.height < 420, 'a push up on the day below should close the card');
  /* and Beetle's own prompt opens with the thing it wants handled */
  await tap('Your usual top up');
  await see('Beetle Bills');
  await shot('chat-prompt', 900);
  await tap('Back to the day');
  await page.waitForTimeout(700);
  await tap('All');

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
    .getByText(/Fill the frame with the account number|No camera here/)
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
  else await tap('Use the sample photo');
  await see('Read off the photo');
  at('/home');
  await see('Sarah Adeyemi at GTBank');
  await shot('chat-photo-read', 1200);
  await page.getByLabel('Ask Beetle').fill('5k');
  await page.keyboard.press('Enter');
  await button('Confirm ₦5,000').waitFor();
  await shot('chat-photo-transfer', 1900);
  await tap('Back to the day');
  await page.waitForTimeout(700);

  console.log('A place on its own');
  /* the tab on the edge brings the lab back; a step deep in the way in opens
     with the way there already walked, and home opens signed in */
  await tap('Back to the lab');
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
  await see('Nothing has moved yet');
  at('/home');
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
  /* the screen behind the sheet, tapped above it, puts it away */
  await button('Close').click({ position: { x: 196, y: 90 } });
  await button('Confirm ₦20,000').waitFor();
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a chat that carries on: the one filed a quarter of an hour ago comes
     back with the pull down, and New at the top right starts another */
  await tap('A chat that carries on');
  await see('Done. ₦20,000 is with Sarah Adeyemi.');
  at('/home');
  await shot('lab-carry', 900);
  await tap('New chat');
  /* the old chat's words leave the card; its row in the day keeps them */
  const inCard = page.locator('[data-testid="card"]').getByText('Done. ₦20,000 is with Sarah Adeyemi.');
  await inCard.first().waitFor({ state: 'hidden' });
  await shot('lab-new', 900);
  must((await inCard.count()) === 0, 'New should start a fresh chat');
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* a receipt lands in the chat after the passcode, in a few words; a tap on it opens the page */
  await tap('A receipt in the chat');
  await see('The full receipt');
  await shot('lab-receipt-card', 900);
  await tap('Receipt');
  await see('All done');
  await see('Balance after');
  must(page.url().includes('/receipt/'), 'the card should open the receipt page');
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
  /* Settings, from the mark at the top left of home: Your details on its sheet, and Sign out */
  await tap('The demo account');
  await see('Pull down');
  await tap('Settings');
  await see('What keeps the money yours');
  at('/settings');
  await shot('settings', 500);
  await tap('Your details');
  await see('Member since');
  await shot('settings-details', 900);
  await tap('Done');
  /* every row leads somewhere: Lock and privacy, and its switches kept on the phone. The page's
     title arrives from the row's own place, carrying its words up, and the row pulses on the way back */
  const lockRow = await button('Lock and privacy').boundingBox();
  await tap('Lock and privacy');
  const journey = await trace('journey-lock', 1100, [['head', '[data-testid="head"]']], { picture: { at: 140, name: 'journey-lock-mid' } });
  const heads = journey.map(x => x.head).filter(h => h && h.opacity > 0.01);
  must(heads.length > 3, 'the title should be on the way');
  must(
    heads[0].top > heads[heads.length - 1].top + 60 && heads[0].top > (lockRow?.y ?? 0) - 120,
    `the title should travel up from the row (from ${Math.round(heads[0].top)} to ${Math.round(heads[heads.length - 1].top)}, the row at ${Math.round(lockRow?.y ?? 0)})`,
  );
  console.log(`  the title came up from ${Math.round(heads[0].top)} to ${Math.round(heads[heads.length - 1].top)}, the row being at ${Math.round(lockRow?.y ?? 0)}`);
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
  await see('the money is yours again');
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
  await button('Close').last().click();
  await page.getByText('Send money').first().waitFor({ state: 'hidden' });
  await tap('Settings');
  await see('What keeps the money yours');
  at('/settings');
  await tap('Back');
  await see('Pull down');
  await tap('Activities');
  await see('Everything that moved');
  at('/activities');
  await shot('activities', 700);
  await tap('In');
  must((await page.getByText('Pagrin Limited').filter({ visible: true }).count()) === 1, 'In should keep the salary');
  must((await page.getByText('Ikeja Electric').filter({ visible: true }).count()) === 0, 'and drop what went out');
  await tap('All');
  /* a line grows into its receipt in a few words, the rest receding; the full receipt arrives from the amount */
  await button('Ikeja Electric').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const ikejaRow = await button('Ikeja Electric').boundingBox();
  await tap('Ikeja Electric');
  const peeked = await trace('peek-open', 800, [['card', '[data-testid="peek-card"]']], { picture: { at: 120, name: 'peek-mid' } });
  const cards = peeked.map(x => x.card).filter(Boolean);
  must(
    cards.length > 3 && cards[cards.length - 1].height > cards[0].height + 40,
    `the card should grow out of the line (${Math.round(cards[0]?.height ?? 0)} to ${Math.round(cards[cards.length - 1]?.height ?? 0)})`,
  );
  must(Math.abs((cards[0]?.top ?? 0) - (ikejaRow?.y ?? 0)) < 6, 'and start where the line is');
  await shot('peek', 300);
  await tap('The full receipt');
  const arrived = await trace('journey-receipt', 1200, [['amount', '[data-testid="amount"]']]);
  const amounts = arrived.map(x => x.amount).filter(a => a && a.opacity > 0.01);
  must(
    amounts.length > 3 && amounts[0].top > amounts[amounts.length - 1].top + 40,
    `the amount should travel up from the card (${Math.round(amounts[0]?.top ?? 0)} to ${Math.round(amounts[amounts.length - 1]?.top ?? 0)})`,
  );
  console.log(
    `  the line grew from ${Math.round(cards[0].height)} to ${Math.round(cards[cards.length - 1].height)}, and the amount came up from ${Math.round(amounts[0].top)} to ${Math.round(amounts[amounts.length - 1].top)}`,
  );
  await see('Copy the token');
  at('/receipt/l11');
  await tap('Set it up');
  await see('Nothing is saved until you say yes');
  await tap('Not now');
  await see('Copy the token');
  await tap('Back');
  await see('Everything that moved');
  must((await page.locator('[data-testid="peek"]').count()) === 0, 'the peek should be gone once its receipt is left');
  await tap('Sarah Adeyemi');
  await see('has its screen in round 3');
  await tap('More');
  await see('Send money');
  await tap('Send money');
  await see('Who should I send to');
  at('/home');
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
  await see('₦50,000 came in');
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
  /* a shortcut under the open card hands its thing to the chat */
  await tap('The chat, open');
  await button('Data').waitFor();
  await page.waitForTimeout(900);
  await tap('Data');
  await see('Beetle Data');
  await shot('lab-shortcut-data', 1600);
  await tap('Back to the lab');
  await see('Beetle Lab');
  /* the first time: the card dips on its own, with the words that say why, then settles */
  await tap('The first time');
  await arrives('Money health');
  const dip = await trace('first-time-dip', 3900, [['card', '[data-testid="card"]', false]], { picture: { at: 2150, name: 'home-first-dip' } });
  const deepest = Math.max(...dip.map(x => x.card?.height ?? 0));
  const settled = dip[dip.length - 1]?.card?.height ?? 0;
  const closed = dip[0]?.card?.height ?? 0;
  must(deepest >= closed + 18, `the card should dip on the first visit (deepest ${deepest}px from ${closed}px)`);
  must(settled < closed + 16, `and settle back (${settled}px, from ${closed}px)`);
  must((await page.getByText('Pull down to ask Beetle').count()) > 0, 'the grabber should say what the pull is for');
  console.log(`  the card dipped to ${Math.round(deepest)}px and settled at ${Math.round(settled)}px`);
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
