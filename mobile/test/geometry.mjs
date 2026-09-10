/* Is the app drawn to the figures the file sets?

   The copy check proves the words are right. This proves the shapes are: a
   screen column 20 in from each edge starting 72 down, a card at 24 radius
   with 20 and 21 of padding, a 56 button at 28 radius, the dock 104 tall with
   a 48 ask bar at the pill radius, and the phone itself 393 wide.

   These are the numbers in src/design/tokens.ts, which were read off the
   frames. Measuring the running bundle against them is what stops the two
   drifting apart.

     node test/geometry.mjs dist
*/
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const { base, close } = await serve(process.argv[2] || 'dist');
const b = await launch();
const page = await b.newPage({ viewport: { width: 393, height: 852 } });
page.setDefaultTimeout(10000);

const fails = [];
const near = (what, got, want, slack = 1) => {
  if (got === null) return fails.push(`${what}: nothing to measure`);
  if (Math.abs(got - want) > slack) fails.push(`${what}: ${got}, the file says ${want}`);
};

await page.goto(base + '/donesend', { waitUntil: 'load' });
await page.waitForTimeout(500);

/* the phone itself */
near('screen width', await page.evaluate(() => document.body.clientWidth), 393);

/* the button the design sets at 56 with a 28 radius */
const button = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[role="button"]')].find(
    e => Math.abs(e.getBoundingClientRect().height - 56) < 6 && e.getBoundingClientRect().width > 300,
  );
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { h: r.height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) };
});
near('button height', button && button.h, 56);
near('button radius', button && button.radius, 28);

/* the ask bar: 48 tall at the pill radius */
const bar = await page.evaluate(() => {
  const input = document.querySelector('input[placeholder]');
  if (!input) return null;
  const row = input.parentElement;
  const r = row.getBoundingClientRect();
  return { h: r.height, radius: parseFloat(getComputedStyle(row).borderTopLeftRadius) };
});
near('ask bar height', bar && bar.h, 48);
near('ask bar radius', bar && bar.radius, 999, 0);

/* the column: 20 in from the edge, 72 down */
const column = await page.evaluate(() => {
  const h = [...document.querySelectorAll('div')].find(
    e => e.textContent.trim() === 'All done' && e.getClientRects().length,
  );
  return h ? { left: h.getBoundingClientRect().left, top: h.getBoundingClientRect().top } : null;
});
near('column from the left', column && column.left, 20);
near('column from the top', column && column.top, 72, 4);

/* a card the design has not overridden: 24 radius, 20 and 21 of padding */
const card = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find(e => {
    const cs = getComputedStyle(e);
    return (
      parseFloat(cs.borderTopLeftRadius) === 24 &&
      parseFloat(cs.paddingLeft) === 21 &&
      e.getClientRects().length
    );
  });
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { radius: 24, padTop: parseFloat(cs.paddingTop), padLeft: parseFloat(cs.paddingLeft) };
});
near('card radius', card && card.radius, 24);
near('card padding, top', card && card.padTop, 20);
near('card padding, side', card && card.padLeft, 21);

/* the dock with the action button in it: 24 above and below a 56 row */
await page.goto(base + '/home', { waitUntil: 'load' });
await page.waitForTimeout(600);
const dock = await page.evaluate(() => {
  const input = document.querySelector('input[placeholder]');
  if (!input) return null;
  const el = input.parentElement.parentElement;
  const cs = getComputedStyle(el);
  return { h: el.getBoundingClientRect().height, padTop: parseFloat(cs.paddingTop) };
});
near('dock height', dock && dock.h, 104, 2);
near('dock padding', dock && dock.padTop, 24);

await b.close();
close();

if (fails.length) {
  console.log('geometry: ' + fails.length + ' measurement(s) off the file');
  fails.forEach(f => console.log('  x ' + f));
  process.exit(1);
}
console.log(
  'geometry: the phone, the column, the card, the button and the dock all measure what the file sets',
);
