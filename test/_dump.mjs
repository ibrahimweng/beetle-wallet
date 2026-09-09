import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { serve } from './serve.mjs';
import { SCREENS } from '../src/screens/index.js';

const { base, close } = await serve();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(base + '/index.html', { waitUntil: 'load' });
await p.waitForSelector('#phone-screen');

const out = {};
for (const id of Object.keys(SCREENS)) {
  await p.evaluate(i => { localStorage.removeItem('beetle.state.v2'); window.beetleGo(i); }, id);
  await p.waitForTimeout(30);
  out[id] = await p.evaluate(() => {
    const host = document.getElementById('phone-screen');
    const t = [];
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { const s = n.textContent.trim(); if (s) t.push(s); }
    return { t, g: [...host.querySelectorAll('[data-icon]')].map(x => x.getAttribute('data-icon')) };
  });
}
writeFileSync(process.argv[2], JSON.stringify(out));
const chars = JSON.stringify(out).length;
console.log('screens', Object.keys(out).length, 'chars', chars, 'strings', Object.values(out).reduce((a, s) => a + s.t.length, 0));
await b.close(); await close();
