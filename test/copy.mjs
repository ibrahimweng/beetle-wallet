/* Every screen must still say what the Figma file says. The expected strings
   are the ones read out of the design. The product name in them is Beetle,
   which is what the file says now that it has been renamed from Indigo. */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { serve } from './serve.mjs';

const EXPECT = JSON.parse(readFileSync(new URL('./figma-copy.json', import.meta.url), 'utf8'));
const { base, close } = await serve();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(base + '/public/index.html');
await p.waitForSelector('#rail-body');

let missing = 0, checked = 0;
for (const [id, wants] of Object.entries(EXPECT)) {
  await p.evaluate(i => window.beetleGo(i), id);
  await p.waitForTimeout(12);
  const text = (await p.locator('#phone-screen').innerText()).replace(/\s+/g, ' ');
  for (const w of wants) {
    checked++;
    if (!text.includes(w)) { missing++; console.log(`  ✗ ${id}: missing "${w}"`); }
  }
}
console.log(`copy: ${checked} strings from the design, ${missing} missing`);
await b.close(); close();
process.exit(missing ? 1 : 0);
