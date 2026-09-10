/* Does the app say what the frame says?

   test/frames.json is every line of text read straight out of the Figma
   frames, one entry per screen, keyed the way src/routes.ts keys them. This
   opens the same screen in the exported bundle and reports any line the frame
   carries that the screen does not.

   Not every difference is a fault. A figure that now comes from the live
   balance moves; a component's unoverridden placeholder text is in the frame
   but was never meant to ship; a line was deliberately reworded or added.
   Those are listed in test/copy.json, one entry per screen, and anything not
   listed there fails. Rebuild that list with --write only after checking each
   new difference against the frame — rewriting it to make a failure go away
   is how drift gets in.

     node test/copy.mjs dist [--write]
*/
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const WRITE = process.argv.includes('--write');
const dir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'dist';

const frames = JSON.parse(readFileSync(join(here, 'frames.json'), 'utf8'));
const allowed = JSON.parse(readFileSync(join(here, 'copy.json'), 'utf8'));

const { base, close } = await serve(dir);
const b = await launch();
const page = await b.newPage({ viewport: { width: 393, height: 852 } });
page.setDefaultTimeout(10000);

/* Only what is on screen: the stack keeps the screens behind it mounted. */
const readScreen = () =>
  page.evaluate(() => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const s = (n.textContent || '').trim();
      if (!s) continue;
      const el = n.parentElement;
      if (!el || !el.getClientRects().length) continue;
      out.push(s);
      /* React splits an interpolated line into several text nodes; the element
       around them is what a reader actually sees */
      if (el.textContent && el.textContent.length < 400) out.push(el.textContent.trim());
    }
    /* the ask bar's line is a placeholder, not a text node */
    for (const i of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
      if (i.getClientRects().length) out.push(i.getAttribute('placeholder'));
    }
    return out;
  });

/* A single digit or a fragment of a split line is not copy worth checking. */
const worth = s => s.trim().length > 2;

const missing = {};
for (const id of Object.keys(frames)) {
  await page.goto(base + '/' + id, { waitUntil: 'load' });
  await page.waitForTimeout(420);
  const joined = (await readScreen()).join('  ');
  const gone = frames[id].filter(worth).filter(line => !joined.includes(line));
  if (gone.length) missing[id] = [...new Set(gone)];
}
await b.close();
close();

if (WRITE) {
  writeFileSync(
    join(here, 'copy.json'),
    JSON.stringify({ _why: allowed._why ?? {}, ...missing }, null, 1) + '\n',
  );
  const n = Object.values(missing).reduce((a, x) => a + x.length, 0);
  console.log(
    'copy: wrote ' + n + ' accepted difference(s) across ' + Object.keys(missing).length + ' screen(s)',
  );
  process.exit(0);
}

const news = [];
for (const [id, lines] of Object.entries(missing)) {
  if (id.startsWith('_')) continue;
  const ok = new Set(allowed[id] || []);
  for (const l of lines) if (!ok.has(l)) news.push([id, l]);
}
if (news.length) {
  console.log('copy: ' + news.length + ' line(s) the frame says and the app does not');
  news.slice(0, 60).forEach(([id, l]) => console.log('  x ' + id + ': ' + JSON.stringify(l)));
  process.exit(1);
}
const checked = Object.values(frames).flat().filter(worth).length;
console.log(
  'copy: ' +
    checked +
    ' lines from ' +
    Object.keys(frames).length +
    ' frames are on the screens that should say them, with ' +
    Object.entries(allowed)
      .filter(([k]) => !k.startsWith('_'))
      .flatMap(([, v]) => v).length +
    ' recorded differences',
);
