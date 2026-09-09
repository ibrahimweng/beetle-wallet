/* No emoji anywhere, every icon name resolves to a real glyph, and no icon
   name is ever rendered as text instead of drawn. All three of those were
   real mistakes in this codebase, so all three are checked. */
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'fs';
import { serve } from './serve.mjs';
import { ICONS } from '../src/icons.js';

let failures = 0;
const fail = (msg, detail = '') => { failures++; console.log('  ✗ ' + msg, detail); };

/* ---- 1. no emoji in the source ---- */
const files = ['src/ui.js', 'src/data.js', 'src/app.js', 'src/store.js', 'src/actions.js', 'src/flow.js', 'src/agent.js']
  .concat(readdirSync(new URL('../src/screens', import.meta.url)).map(f => 'src/screens/' + f));
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}\u{2800}-\u{28FF}\u{25A0}-\u{25FF}]/gu;
const ALLOWED = '·—–’‘“”…‹›→↑+−';   // punctuation and the arrows inside prose
let emoji = 0;
for (const f of files) {
  readFileSync(new URL('../' + f, import.meta.url), 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(EMOJI);
    if (!m || m.every(c => ALLOWED.includes(c))) return;
    emoji++;
    fail(`emoji in ${f}:${i + 1}`, m.filter(c => !ALLOWED.includes(c)).join(' '));
  });
}
console.log(`icons: ${emoji === 0 ? 'no emoji in the source' : emoji + ' lines still carry emoji'}`);

/* ---- 2 and 3: in the browser ---- */
const { base, close } = await serve();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const warned = new Set();
p.on('console', m => { if (m.text().startsWith('No icon called')) warned.add(m.text()); });
await p.goto(base + '/public/index.html');
await p.waitForSelector('#rail-body');

const ids = await p.evaluate(() => [...document.querySelectorAll('.rail-link em')].map(n => n.textContent));
const names = Object.keys(ICONS);
const leaks = new Map();
for (const id of ids) {
  await p.evaluate(i => window.beetleGo(i), id);
  await p.waitForTimeout(10);
  const found = await p.evaluate(list => {
    const out = [];
    const walk = document.createTreeWalker(document.getElementById('phone-screen'), NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent.trim();
      /* the keyboard's send key really does say a word */
      if (list.includes(t) && !n.parentElement.classList.contains('kbd-key')) {
        out.push(t + ' in .' + (n.parentElement.className || n.parentElement.tagName));
      }
    }
    return out;
  }, names);
  found.forEach(f => leaks.set(f, (leaks.get(f) || 0) + 1));
}
for (const [k, n] of leaks) fail('icon name drawn as text: ' + k, `(${n} screens)`);
for (const w of warned) fail(w);

console.log(`icons: ${names.length} glyphs, ${leaks.size} rendered as text, ${warned.size} names not in the set`);
await b.close(); close();
process.exit(failures ? 1 : 0);
