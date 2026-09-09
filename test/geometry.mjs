/* Where every line of text sits on every screen, measured from the top of the
   scrolling content so it compares with the design frame's own coordinates.

   This is not a pass or fail test. It is the measuring stick for checking the
   app against the Figma file: run it, then hand the numbers to a read of the
   frames named in figma-map.json and compare x, y, size and weight line by
   line. Guessing at layout by eye is how the type ended up too loose and the
   onboarding trail ended up drawn as headings.

     node test/geometry.mjs out.json
*/
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { serve } from './serve.mjs';

const MAP = JSON.parse(readFileSync(new URL('./figma-map.json', import.meta.url), 'utf8'));
const { base, close } = await serve();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 1 });
await p.goto(base + '/index.html', { waitUntil: 'load' });
await p.waitForSelector('#phone-screen');

const out = {};
for (const id of Object.keys(MAP)) {
  await p.evaluate(i => { localStorage.removeItem('beetle.state.v2'); window.beetleGo(i); }, id);
  await p.waitForTimeout(30);
  out[id] = await p.evaluate(() => {
    const host = document.getElementById('phone-screen');
    const hb = host.getBoundingClientRect();
    const sc = host.querySelector('.screen-scroll');
    const top = sc ? sc.getBoundingClientRect().top - sc.scrollTop : hb.top;
    const rows = [];
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const s = n.textContent.trim();
      if (!s) continue;
      const el = n.parentElement;
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const cs = getComputedStyle(el);
      rows.push([s.slice(0, 24), Math.round(r.left - hb.left), Math.round(r.top - top),
        Math.round(parseFloat(cs.fontSize)), parseInt(cs.fontWeight, 10) || 400]);
    }
    return rows;
  });
}
writeFileSync(process.argv[2], JSON.stringify(out));
console.log('screens', Object.keys(out).length, 'chars', JSON.stringify(out).length);
await b.close(); await close();
