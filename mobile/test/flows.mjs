/* Walk the app the way somebody would, and check the money actually moves.

   This drives the exported bundle — the same JavaScript the phone runs — by
   tapping what is on the screen rather than by calling into the state layer.
   A flow that only looks right but does not move the balance fails here.

     node test/flows.mjs dist
*/
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const { base, close } = await serve(process.argv[2] || 'dist');
const b = await launch();
const page = await b.newPage({ viewport: { width: 393, height: 852 } });
page.setDefaultTimeout(8000);

const fails = [];
const errs = [];
page.on('pageerror', e => errs.push(e.message));

const at = id =>
  (step = `open ${id}`) &&
  page.goto(`${base}/${id}`, { waitUntil: 'load' }).then(() => page.waitForTimeout(450));

/* The stack keeps the screens you came through mounted and hidden, so a name
   can match something behind what you are looking at. Only what is on screen
   can be tapped. */
const onScreen = async locator => {
  for (const el of await locator.all()) if (await el.isVisible()) return el;
  return locator.first();
};
const tap = async (name, exact = false) => {
  step = `tap ${name}`;
  const el = await onScreen(page.getByText(name, { exact }));
  await el.waitFor({ state: 'visible' });
  await el.scrollIntoViewIfNeeded();
  await el.click();
  await page.waitForTimeout(400);
};
/* exact, because a loose match finds "Slide to send ₦20,000" when you ask
   for the key marked 2, and that one is on a screen behind this one */
const tapLabel = async label => {
  step = `tap ${label}`;
  const el = await onScreen(page.getByLabel(label, { exact: true }));
  await el.waitFor({ state: 'visible' });
  await el.scrollIntoViewIfNeeded();
  await el.click();
  await page.waitForTimeout(350);
};
const sees = async (what, where) => {
  const text = await page.evaluate(() => document.body.innerText || '');
  if (!text.includes(what)) fails.push(`${where}: expected to see "${what}"`);
};
const balance = () =>
  page.evaluate(() => {
    const raw = localStorage.getItem('beetle.state.v2');
    return raw ? JSON.parse(raw).everyday : null;
  });
const passcode = async () => {
  for (const k of ['1', '2', '3', '4', '5', '6']) await tapLabel(k);
  await page.waitForTimeout(500);
};
const slide = async label => {
  step = `slide ${label}`;
  const el = await onScreen(page.getByLabel(label));
  await el.waitFor({ state: 'visible' });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box = await el.boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 14; i++) await page.mouse.move(x + (290 * i) / 14, y);
  await page.mouse.up();
  await page.waitForTimeout(600);
};
let step = '';
const flow = async (name, fn) => {
  errs.length = 0;
  step = 'opening';
  try {
    await fn();
  } catch (e) {
    fails.push(`${name} (${step}): ${e.message.split('\n')[0]}`);
  }
  const real = errs.filter(e => !/favicon|DevTools/i.test(e));
  if (real.length) fails.push(`${name}: threw ${JSON.stringify(real[0])}`);
};

/* ---- 1. the way in ---- */
await flow('way in', async () => {
  await at('start');
  await tap('Open an account');
  await sees('Your number', 'number');
  /* the number arrives filled in; one key makes it yours and it moves on */
  await tapLabel('1');
  await sees('Six digits', 'code');
});

/* ---- 2. sending money ---- */
/* The way in the frames draw: the button, the voice sheet, the chat it puts
   together, then the passcode. */
await flow('send', async () => {
  await at('home');
  const before = await balance();
  await tapLabel('What can I do');
  await tap('Voice');
  await sees('Listening', 'ask');
  await tap('Release to send');
  await sees('Beetle Transfers', 'chat');
  await tap('Confirm ₦20,000');
  await sees('Enter your passcode', 'confirm');
  await passcode();
  await sees('All done', 'donesend');
  const after = await balance();
  if (after === null || before === null) fails.push('send: no saved balance to compare');
  else if (!(after < before)) fails.push(`send: balance did not fall (${before} → ${after})`);
});

/* ---- 3. past a cap, the slide still goes, through the second ask ---- */
await flow('past the cap', async () => {
  await at('pay');
  await sees('Slide to send', 'pay');
  await slide(/^Slide to send/);
  await sees('Past your own limit', 'limitstop');
  await sees('Now type the words in full', 'limitstop');
});

/* ---- 4. buying data ---- */
await flow('buy', async () => {
  await at('home');
  const before = await balance();
  await tap('Airtime');
  await sees('Other bundles', 'airtime');
  await slide(/^Slide to buy/);
  await sees('Enter your passcode', 'confirmbuy');
  await passcode();
  await sees('All done', 'done');
  const after = await balance();
  if (!(after < before)) fails.push(`buy: balance did not fall (${before} → ${after})`);
});

/* ---- 5. paying a bill ---- */
await flow('bill', async () => {
  await at('home');
  const before = await balance();
  await tap('Bills');
  await sees('covered', 'bills');
  await tap('Ikeja Electric');
  await sees('Or pick an amount', 'powerpay');
  await slide(/^Slide to pay/);
  await sees('Enter your passcode', 'confirmmeter');
  await passcode();
  await sees('Meter token', 'power');
  const after = await balance();
  if (!(after < before)) fails.push(`bill: balance did not fall (${before} → ${after})`);
});

/* ---- 6. asking to be paid ---- */
await flow('request', async () => {
  await at('ways');
  await tap('Ask for money');
  await sees('Listening', 'askreq');
  await tap('Release to send');
  await sees('Ask to be paid', 'request');
  await tap('Send the request');
  await sees('Request sent', 'sent');
  const before = await balance();
  await tap('Pretend they just paid');
  await sees('Money in', 'donein');
  const after = await balance();
  if (!(after > before)) fails.push(`request: balance did not rise (${before} → ${after})`);
});

/* ---- 7. the ask bar answers, and takes you places ---- */
await flow('ask bar', async () => {
  await at('home');
  await page.getByLabel('Ask Beetle').fill('what is my limit today?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await sees('Spending limits', 'ask → limits');

  await at('agentchat');
  await tap('What did I spend on today?');
  await sees('airtime and data last month', 'agentchat');
});

/* ---- 8. the button opens and closes ---- */
await flow('the button', async () => {
  await at('home');
  await tapLabel('What can I do');
  await sees('Voice', 'actions');
  await page.mouse.click(60, 200);
  await page.waitForTimeout(500);
  await sees('Total balance', 'back on home');
});

await b.close();
close();

if (fails.length) {
  console.log(`flows: ${fails.length} problem(s)`);
  fails.forEach(f => console.log('  ✗', f));
  process.exit(1);
}
console.log(
  'flows: the way in, sending, going past a cap, buying, a bill, a request, the ask bar and the button all work',
);
