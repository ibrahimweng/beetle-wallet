/* Every screen must draw, with no console errors and no sideways scroll. */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

export const page = () => '<!doctype html><html><head><meta charset="utf-8"></head><body>'
  + readFileSync(new URL('../dist/beetle.html', import.meta.url), 'utf8') + '</body></html>';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', e => errors.push(e.message));
await p.setContent(page(), { waitUntil: 'load' });
await p.waitForSelector('#rail-body');

const ids = await p.evaluate(() => [...document.querySelectorAll('.rail-link em')].map(n => n.textContent));
const bad = [];
for (const id of ids) {
  errors.length = 0;
  await p.evaluate(i => window.beetleGo(i), id);
  await p.waitForTimeout(18);
  const r = await p.evaluate(() => {
    const host = document.getElementById('phone-screen');
    const sc = host.querySelector('.screen-scroll');
    const h = host.getBoundingClientRect();
    const over = [...host.querySelectorAll('*')].filter(n => {
      const b = n.getBoundingClientRect();
      return b.width && (b.left < h.left - 1 || b.right > h.right + 1);
    }).map(n => n.className).slice(0, 2);
    return {
      failed: (host.innerText || '').includes('This screen did not draw'),
      empty: host.children.length < 2,
      hscroll: sc ? sc.scrollWidth - sc.clientWidth : 0,
      over,
    };
  });
  if (r.failed || r.empty || r.hscroll > 1 || r.over.length || errors.length)
    bad.push({ id, ...r, errors: [...errors] });
}
console.log(`render: ${ids.length} screens, ${bad.length} broken`);
bad.forEach(x => console.log('  ✗', x.id, JSON.stringify(x).slice(0, 200)));
await b.close();
process.exit(bad.length ? 1 : 0);
