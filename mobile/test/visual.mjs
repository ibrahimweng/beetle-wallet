/* Does it look like the design?

   Every other check reads what a screen says. This one looks at it. Each
   frame in test/frames is a PNG of the Figma frame at its own size, pulled
   straight out of the file. This renders the same screen from the exported
   bundle at the same size and compares them pixel by pixel.

   The number it reports is the share of pixels that differ. It is never zero
   and is not meant to be: a live balance, a caret, an anti-aliased edge and a
   font that is not the file's own all move pixels. What it is for is finding
   the screens that are wrong — a card in the wrong place, a section missing,
   a colour off — which stand out from the noise by an order of magnitude.

   test/visual.json holds where each screen stands today. A screen that drifts
   more than a point and a half past its own number fails, which catches a
   change that moves something without saying so. Rewrite the budget with
   --write once you have looked at the diff and know the new number is right.

     node test/visual.mjs dist            report every screen, worst first
     node test/visual.mjs dist home pay   just those
     node test/visual.mjs dist --write    record where every screen stands
*/
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FRAMES = join(here, 'frames');
const SHOTS = join(here, 'shots');
const args = process.argv.slice(2);
const dir = args[0] && !args[0].startsWith('-') ? args[0] : 'dist';
const only = args.slice(1).filter(a => !a.startsWith('-'));
const WRITE = args.includes('--write');
const BUDGET = join(here, 'visual.json');
const budget = existsSync(BUDGET) ? JSON.parse(readFileSync(BUDGET, 'utf8')) : {};
/* what a screen may drift before it counts as a change nobody meant */
const SLACK = 1.5;

if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

const have = readdirSync(FRAMES)
  .filter(f => f.endsWith('.png'))
  .map(f => f.replace('.png', ''))
  .filter(id => !only.length || only.includes(id));

if (!have.length) {
  console.log('visual: no frames to compare. Put <screen>.png in test/frames.');
  process.exit(0);
}

const { base, close } = await serve(dir);
const b = await launch();

const rows = [];
for (const id of have) {
  const want = PNG.sync.read(readFileSync(join(FRAMES, id + '.png')));
  /* the frame's own size is the viewport, so the whole design renders at once
     and nothing is cut off the bottom */
  const page = await b.newPage({ viewport: { width: want.width, height: want.height } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '/' + id, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const shot = await page.screenshot({ path: join(SHOTS, id + '.png') });
  await page.close();

  const got = PNG.sync.read(shot);
  const w = Math.min(want.width, got.width);
  const h = Math.min(want.height, got.height);
  const diff = new PNG({ width: w, height: h });
  const off = pixelmatch(crop(want, w, h).data, crop(got, w, h).data, diff.data, w, h, {
    threshold: 0.2,
    includeAA: false,
  });
  writeFileSync(join(SHOTS, id + '.diff.png'), PNG.sync.write(diff));
  rows.push({ id, off, of: w * h, pct: (off / (w * h)) * 100 });
}

await b.close();
close();

/* pixelmatch wants both buffers the same size */
function crop(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
  return out;
}

rows.sort((a, b2) => b2.pct - a.pct);
console.log('visual: ' + rows.length + ' screen(s) against their frame, worst first\n');
for (const r of rows) {
  const bar = '█'.repeat(Math.min(30, Math.round(r.pct)));
  console.log('  ' + r.pct.toFixed(1).padStart(5) + '%  ' + r.id.padEnd(16) + bar);
}
const mean = rows.reduce((a, r) => a + r.pct, 0) / rows.length;
console.log('\n  average ' + mean.toFixed(1) + '%  ·  shots and diffs in test/shots');

if (WRITE) {
  const out = {};
  for (const r of rows.sort((a, b2) => a.id.localeCompare(b2.id))) out[r.id] = Number(r.pct.toFixed(1));
  writeFileSync(BUDGET, JSON.stringify(out, null, 1) + '\n');
  console.log('  wrote where ' + rows.length + ' screen(s) stand to test/visual.json');
  process.exit(0);
}

const worse = rows.filter(r => budget[r.id] !== undefined && r.pct > budget[r.id] + SLACK);
if (worse.length) {
  console.log('\nvisual: ' + worse.length + ' screen(s) further from the frame than they were');
  for (const r of worse) {
    console.log('  x ' + r.id + ': ' + r.pct.toFixed(1) + '%, was ' + budget[r.id].toFixed(1) + '%');
  }
  process.exit(1);
}
