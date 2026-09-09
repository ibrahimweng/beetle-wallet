/* Every screen must draw, with no console errors and no sideways scroll —
   in both the way it is deployed and the way it is published. */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
import { SCREENS } from '../src/screens/index.js';

/* There is no index in the app any more, so the registry is the list. */
const IDS = Object.keys(SCREENS);
const EXPECTED = IDS.length;

const WAYS = [
  { name: 'public/ (the exact directory Vercel serves)', path: '/public/index.html' },
  { name: 'the repository as it sits (npm start, Pages from the branch)', path: '/index.html' },
  { name: 'the single file bundle (what the artifact serves)', path: '/dist/beetle.html' },
];

const { base, close } = await serve();
const b = await chromium.launch();
let failures = 0;

for (const way of WAYS) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base + way.path, { waitUntil: 'load' });

  /* If the registry check trips, the app never boots — say why rather than
     timing out on a selector that will never appear. */
  try {
    await p.waitForSelector('#phone-screen', { timeout: 8000 });
  } catch {
    console.log(`render [${way.name}]: the app did not boot`);
    errors.forEach(e => console.log('  ✗', e));
    failures++; await p.close(); continue;
  }

  const ids = IDS;
  const bad = [];
  for (const id of ids) {
    errors.length = 0;
    await p.evaluate(i => window.beetleGo(i), id);
    await p.waitForTimeout(18);
    const r = await p.evaluate(want => {
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
        /* a missing screen used to fall back to the first one and look fine */
        wrongScreen: location.hash !== '#/' + want,
        hscroll: sc ? sc.scrollWidth - sc.clientWidth : 0,
        over,
      };
    }, id);
    if (r.failed || r.empty || r.wrongScreen || r.hscroll > 1 || r.over.length || errors.length)
      bad.push({ id, ...r, errors: [...errors] });
  }

  console.log(`render [${way.name}]: ${ids.length} screens, ${bad.length} broken`);
  bad.forEach(x => console.log('  ✗', x.id, JSON.stringify(x).slice(0, 200)));
  failures += bad.length;
  await p.close();
}

await b.close();
close();
process.exit(failures ? 1 : 0);
