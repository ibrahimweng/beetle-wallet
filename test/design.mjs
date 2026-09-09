/* What every screen says and draws, pinned.

   test/figma-map.json records which frame in the Figma file each screen was
   built from, so any line here can be traced back and re-checked with one
   read of that node. test/design.json is the pinned text and icons. A change
   to either that is not also made in the fixture fails, which is what stops
   copy and icons drifting away from the design between one sitting and the
   next.

   Rebuild the fixture with: node test/design.mjs --write
   Only do that having checked the change against the Figma frame the map
   names. Rewriting it to make a failure go away is how drift gets in. */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { serve } from './serve.mjs';
import { SCREENS } from '../src/screens/index.js';

const WRITE = process.argv.includes('--write');
const FIX = new URL('./design.json', import.meta.url);
const MAP = JSON.parse(readFileSync(new URL('./figma-map.json', import.meta.url), 'utf8'));

const { base, close } = await serve();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(base + '/index.html', { waitUntil: 'load' });
await p.waitForSelector('#phone-screen');

const now = {};
for (const id of Object.keys(SCREENS)) {
  await p.evaluate(i => { localStorage.removeItem('beetle.state.v2'); window.beetleGo(i); }, id);
  await p.waitForTimeout(25);
  now[id] = await p.evaluate(() => {
    const host = document.getElementById('phone-screen');
    const t = [];
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { const s = n.textContent.trim(); if (s) t.push(s); }
    return { t, g: [...host.querySelectorAll('[data-icon]')].map(x => x.getAttribute('data-icon')) };
  });
}
await b.close(); close();

if (WRITE) {
  writeFileSync(FIX, JSON.stringify(now, null, 0) + '\n');
  console.log(`design: wrote ${Object.keys(now).length} screens to the fixture`);
  process.exit(0);
}

const want = JSON.parse(readFileSync(FIX, 'utf8'));
let bad = 0;
const line = (a, b) => { const c = b.slice(); const o = []; for (const x of a) { const i = c.indexOf(x); i < 0 ? o.push(x) : c.splice(i, 1); } return o; };

for (const id of Object.keys(SCREENS)) {
  if (!want[id]) { console.log(`  ✗ ${id} is not in the fixture`); bad++; continue; }
  const lost = line(want[id].t, now[id].t), gained = line(now[id].t, want[id].t);
  const lostG = line(want[id].g, now[id].g), gainedG = line(now[id].g, want[id].g);
  if (!lost.length && !gained.length && !lostG.length && !gainedG.length) continue;
  bad++;
  const from = MAP[id] ? `${MAP[id].section} · ${MAP[id].design} (${MAP[id].node})` : 'no design frame recorded';
  console.log(`  ✗ ${id} — ${from}`);
  if (lost.length) console.log(`      gone:  ${JSON.stringify(lost.slice(0, 4))}`);
  if (gained.length) console.log(`      new:   ${JSON.stringify(gained.slice(0, 4))}`);
  if (lostG.length) console.log(`      icons gone: ${lostG.join(' ')}`);
  if (gainedG.length) console.log(`      icons new:  ${gainedG.join(' ')}`);
}
const mapped = Object.keys(SCREENS).filter(i => MAP[i]).length;
console.log(`design: ${Object.keys(SCREENS).length} screens pinned, ${mapped} traced to a Figma frame, ${bad} adrift`);
process.exit(bad ? 1 : 0);
