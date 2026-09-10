/* Does it actually move?

   Every other check here reads a screen once it has settled, which is exactly
   when an animation is invisible. This one looks at the moment after the tap
   and again once it is over, and fails if nothing happened in between. A
   screen that quietly stops animating is a screen nobody notices has stopped.

     node test/motion.mjs dist
*/
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const { base, close } = await serve(process.argv[2] || 'dist');
const b = await launch();
const page = await b.newPage({ viewport: { width: 393, height: 852 } });
page.setDefaultTimeout(10000);

const fails = [];
const errs = [];
page.on('pageerror', e => errs.push(e.message));

/* Where a piece of text is, and how visible, right now. */
const seen = text =>
  page.evaluate(t => {
    const el = [...document.querySelectorAll('div, span')].find(
      e => e.textContent.trim() === t && e.getClientRects().length,
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    /* opacity is set on an ancestor, so multiply the chain */
    let o = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      o *= parseFloat(getComputedStyle(n).opacity || '1');
    }
    return { top: r.top, opacity: o };
  }, text);

const settle = () => page.waitForTimeout(1100);

const moved = (what, early, late, { by = 6, fade = 0.12 } = {}) => {
  if (!early || !late) return fails.push(`${what}: could not find it`);
  const rose = Math.abs(late.top - early.top);
  const brightened = late.opacity - early.opacity;
  if (rose < by && brightened < fade) {
    fails.push(`${what}: it did not move — ${rose.toFixed(1)}px and ${brightened.toFixed(2)} of opacity`);
  }
};

/* ---- a screen assembling after a tap ---- */
await page.goto(base + '/home', { waitUntil: 'load' });
await settle();
await page.getByText('Services').first().click();
await page.waitForTimeout(90);
const screenEarly = await seen('School fees');
await settle();
const screenLate = await seen('School fees');
moved('a screen arriving', screenEarly, screenLate);

/* ---- a sheet coming up ---- */
await page.goto(base + '/home', { waitUntil: 'load' });
await settle();
await page.getByText('Receive', { exact: true }).first().click();
await page.waitForTimeout(70);
const sheetEarly = await seen('Bank transfer');
await settle();
const sheetLate = await seen('Bank transfer');
moved('a sheet coming up', sheetEarly, sheetLate, { by: 40 });

/* ---- the button's menu ---- */
await page.goto(base + '/home', { waitUntil: 'load' });
await settle();
await page.getByLabel('What can I do').first().click();
await page.waitForTimeout(60);
const menuEarly = await seen('Voice');
await settle();
const menuLate = await seen('Voice');
moved('the menu opening', menuEarly, menuLate);

/* the background behind it really is blurred, not just washed out */
const blurred = await page.evaluate(() =>
  [...document.querySelectorAll('*')].some(e => {
    const cs = getComputedStyle(e);
    return /blur/.test(cs.backdropFilter || '') || /blur/.test(cs.filter || '');
  }),
);
if (!blurred) fails.push('the menu: nothing behind it is blurred');

/* the buttons do not all arrive together */
const spread = await page.evaluate(async () => {
  const at = () =>
    ['Voice', 'Send money', 'Receive', 'History', 'Settings'].map(t => {
      const el = [...document.querySelectorAll('div')].find(
        e => e.textContent.trim() === t && e.getClientRects().length,
      );
      if (!el) return 0;
      let o = 1;
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        o *= parseFloat(getComputedStyle(n).opacity || '1');
      }
      return o;
    });
  return at();
});
if (Math.max(...spread) - Math.min(...spread) < 0.001 && spread[0] < 0.99) {
  fails.push('the menu: the buttons arrive all at once');
}

await b.close();
close();

const real = errs.filter(e => !/favicon|DevTools/i.test(e));
if (real.length) fails.push(`something threw: ${real[0]}`);

if (fails.length) {
  console.log('motion: ' + fails.length + ' thing(s) that should move and did not');
  fails.forEach(f => console.log('  x ' + f));
  process.exit(1);
}
console.log('motion: screens assemble after the tap, sheets come up, and the menu blurs what is behind it');
