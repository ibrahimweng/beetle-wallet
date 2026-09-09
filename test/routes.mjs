/* There is no index in the app any more, so a screen nothing routes to is a
   screen nobody can ever see. Every screen must therefore be named as a
   destination by some other screen, or be reachable by asking for it.

   Reachability is asserted rather than crawled: half these screens only move
   once something has been typed into them, and a crawler that cannot type
   reports them as dead ends when a person gets through them fine. */
import { readFileSync, readdirSync } from 'fs';
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
import { SCREENS } from '../src/screens/index.js';

const IDS = Object.keys(SCREENS);

/* Any screen named as a string by another screen is a screen something can
   route to. Matching go('x') alone is not enough: destinations also arrive
   through a ternary, go(d === '…' ? 'who' : 'nomatch'), and through config a
   factory reads back, share: 'shareflat' becoming go(share). */
const named = new Set();
let src = '';
for (const f of readdirSync(new URL('../src/screens', import.meta.url))) {
  if (f === 'index.js') continue;
  src += readFileSync(new URL('../src/screens/' + f, import.meta.url), 'utf8');
}
for (const m of src.matchAll(/'([a-z0-9]+)'/g)) if (SCREENS[m[1]]) named.add(m[1]);

/* asking for a screen by name is a route in its own right */
const { base, close } = await serve();
const b = await chromium.launch();
const p = await b.newPage();
await p.goto(base + '/index.html', { waitUntil: 'load' });
await p.waitForSelector('#phone-screen');
const asked = new Set();
for (const id of IDS) {
  const hit = await p.evaluate(t => {
    const before = location.hash;
    const moved = window.beetleShow('show me the ' + t);
    const where = location.hash;
    if (moved) history.replaceState(null, '', before);
    return moved ? where.replace('#/', '') : null;
  }, SCREENS[id].title || id);
  if (hit) asked.add(hit);
}
await b.close(); close();

const ENTRY = ['start', 'home'];
const orphan = IDS.filter(i => !ENTRY.includes(i) && !named.has(i) && !asked.has(i));

console.log(`routes: ${named.size} screens are linked to, ${asked.size} can be asked for, ${IDS.length} exist`);
if (orphan.length) {
  console.log(`  ✗ ${orphan.length} screens nothing can reach:`);
  orphan.forEach(i => console.log('     ', i, '·', SCREENS[i].title));
} else {
  console.log('        every screen has a way in');
}
process.exit(orphan.length ? 1 : 0);
