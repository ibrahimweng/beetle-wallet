/* Beetle Glyphs in a browser: the library draws where it is deployed, the
   path without its slash still finds it, every export names each icon once,
   and the point editor only changes what the viewer meant to change. Each
   case drives the real page and then reads the page's own store. */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const { base, close } = await serve();
const b = await chromium.launch();
let failures = 0;
const check = (ok, what, detail = '') => { console.log(`  ${ok ? '✓' : '✗'} ${what}${ok || !detail ? '' : ' — ' + detail}`); if (!ok) failures++; };

async function open(path, viewport = { width: 1440, height: 1000 }) {
  const ctx = await b.newContext({ viewport });
  const p = await ctx.newPage();
  const errors = [];
  /* the web font is decoration: a runner without the network still has to pass */
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(m.location().url || '')) errors.push(m.text()); });
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(base + path, { waitUntil: 'load' });
  const drew = await p.waitForFunction(() => document.querySelectorAll('.grid .tile, .grid button').length > 100, null, { timeout: 15000 }).then(() => true, () => false);
  const mod = name => `new URL('src/lib/${name}.js', location.href).href`;
  const store = fn => p.evaluate(`import(${mod('store')}).then(({ store }) => (${fn})(store))`);
  return { ctx, p, errors, drew, mod, store };
}

/* ---------- it draws where it is deployed ---------- */
for (const path of ['/public/glyphs/', '/glyphs/']) {
  console.log(`glyphs [${path}]`);
  const { ctx, p, errors, drew } = await open(path);
  check(drew, 'the library loads');
  const tiles = await p.evaluate(() => document.querySelectorAll('.grid svg').length);
  check(tiles >= 200, `the grid draws (${tiles} icons on the first page)`);
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- the path without its slash ---------- */
console.log('glyphs [/public/glyphs, no slash]');
{
  const { ctx, p, drew } = await open('/public/glyphs');
  check(drew, 'the library loads');
  check(new URL(p.url()).pathname === '/public/glyphs/', 'it moves to the path with the slash', p.url());
  check(await p.evaluate(() => document.title) === 'Beetle Glyphs', 'and it is the icon library, not the wallet');
  await ctx.close();
}

/* ---------- exports ---------- */
console.log('glyphs exports');
{
  const { ctx, p, mod } = await open('/public/glyphs/');
  const r = await p.evaluate(`Promise.all([import(${mod('library')}), import(${mod('export')}), import(${mod('store')})]).then(([L, X, S]) => {
    const P = S.store.get().P, prims = k => L.primsOf(k, S.store.get());
    const views = {};
    for (const set of ['all', 'scenarios', 'beetle', 'core', 'four']) {
      const entries = L.search({ q: '', set, cat: 'all' });
      const names = entries.map(e => L.exportName(e.key));
      views[set] = { n: entries.length, unique: new Set(names).size };
    }
    const app = L.search({ q: '', set: 'beetle', cat: 'all' });
    const sprite = X.spriteOf(app, P, prims);
    const ids = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]);
    const json = JSON.parse(X.jsonOf(L.search({ q: '', set: 'all', cat: 'all' }), P, prims));
    return { views, symbols: ids.length, uniqueSymbols: new Set(ids).size, appGlyphs: app.length, jsonIcons: Object.keys(json.icons).length, all: views.all.n,
      card: [L.exportName('param:card'), L.exportName('beetle:card')], alias: L.exportName('beetle:card-filled'), snippet: X.usageSnippet('core:house', P) };
  })`);
  for (const [set, v] of Object.entries(r.views)) check(v.n === v.unique, `every icon in the ${set} view has a name of its own (${v.unique} of ${v.n})`);
  check(r.symbols === r.appGlyphs && r.uniqueSymbols === r.symbols, `the app glyphs sprite has one symbol per icon (${r.uniqueSymbols} of ${r.appGlyphs})`);
  check(r.jsonIcons === r.all, `the JSON keeps every icon (${r.jsonIcons} of ${r.all})`);
  check(r.views.four.n === 1366, `the four-style set is all there (${r.views.four.n} of 1366)`);
  check(r.card[0] === 'param-card' && r.card[1] === 'beetle-card' && r.alias === 'beetle-card', 'a shared name gets its set in front, and an alias goes by its icon', r.card.concat(r.alias).join(', '));
  check(r.snippet.includes('content: "\\E000"') && !r.snippet.includes('\\uE000'), 'the font snippet escapes the codepoint the way CSS reads it');
  await ctx.close();
}

/* ---------- the point editor ---------- */
console.log('glyphs editor');
{
  const { ctx, p, store } = await open('/public/glyphs/');
  const edits = () => store('s => Object.keys(s.get().edits)');
  const pick = async sel => { await store(`s => s.set({ sel: ${JSON.stringify(sel)}, scope: 'icon', edits: {} })`); await p.waitForTimeout(100); };
  /* the centre of a handle that is not under another one, in page pixels */
  const handle = css => p.evaluate(css => { for (const el of document.querySelectorAll('.canvas ' + css)) { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; if (r.width && document.elementFromPoint(x, y) === el) return { x, y }; } return null; }, css);
  const press = async (at, dx = 0, dy = 0) => { if (!at) return; await p.mouse.move(at.x, at.y); await p.mouse.down(); if (dx || dy) await p.mouse.move(at.x + dx, at.y + dy, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(80); };

  await pick('param:card');
  let at = await handle('circle.pt');
  check(!!at, 'the canvas shows the points of card');
  await press(at, 1, 1);
  check((await edits()).length === 0, 'a click that wobbles a pixel selects the point and leaves the icon alone', JSON.stringify(await edits()));

  await store(`s => s.set({ scope: 'library' })`); await p.waitForTimeout(80);
  for (const k of ['Backspace', 'Delete', 'ArrowLeft']) await p.keyboard.press(k);
  check((await edits()).length === 0, 'with the editor out of sight, Delete, Backspace and the arrows do nothing to it', JSON.stringify(await edits()));
  await store(`s => s.set({ scope: 'icon' })`); await p.waitForTimeout(80);

  at = await handle('circle.pt');
  await press(at, 40, 0);
  check((await edits()).length === 1, 'a real drag still moves the point');

  await pick('param:star');
  at = await handle('circle.pt');
  await press(at);
  await p.keyboard.press('Backspace');
  check((await edits()).length === 0, 'Backspace on a point of a loop leaves the icon alone, as the button does');

  await pick('core:mop');
  at = await handle('circle.ctl');
  check(!!at, 'mop shows its bezier handles');
  await press(at);
  check(await p.evaluate(() => [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Delete point').disabled), 'the Delete point button is off for a bezier handle');
  await p.keyboard.press('Backspace');
  check((await edits()).length === 0, 'and Backspace does not delete the segment behind it either');

  at = await handle('circle.pt[data-si]:not([data-si="0"])');
  await press(at);
  await p.keyboard.press('Delete');
  check((await edits()).length === 1, 'Delete still removes an anchor the button would remove');

  await store(`s => s.set({ edits: {} })`);
  await ctx.close();
}

/* ---------- the library sheet on a small screen ---------- */
console.log('glyphs on a tablet');
{
  /* wide enough for the overlay to show beside the sheet, narrow enough for the menu button */
  const { ctx, p, store } = await open('/public/glyphs/', { width: 900, height: 900 });
  const live = () => store('s => s.listeners');
  const before = await live();
  const menu = () => p.getByRole('button', { name: 'Open library navigation' }).click();
  const sheet = () => p.locator('.sheet').count();
  /* every way the sheet can close: its close button, Escape, the overlay, and picking a set */
  for (let round = 0; round < 2; round++) {
    const gone = () => p.waitForFunction(() => !document.querySelector('.sheet'), null, { timeout: 3000 });
    await menu(); await p.locator('.sheet button[aria-label="Close"]').click(); await gone();
    await menu(); await p.waitForSelector('.sheet'); await p.keyboard.press('Escape'); await gone();
    await menu(); await p.waitForSelector('.sheet'); await p.mouse.click(860, 450); await gone();
    await menu(); await p.locator('.sheet .nav-item', { hasText: 'App glyphs' }).click(); await gone();
  }
  await p.waitForFunction(() => !document.querySelector('.sheet'), null, { timeout: 3000 }).catch(() => {});
  check(await sheet() === 0, 'the library sheet closes every way it can');
  const after = await live();
  check(after === before, `opening and closing it eight times leaves the store with the listeners it had (${after}, was ${before})`);
  await store(`s => s.set({ filter: { q: '', set: 'all', cat: 'all' } })`);
  await ctx.close();
}

/* ---------- the four-style set and the toolbar ---------- */
console.log('glyphs four styles and the toolbar');
{
  const { ctx, p, store, errors } = await open('/public/glyphs/');
  await store(`s => s.set({ filter: { q: '', set: 'four', cat: 'all', box: 'all' } })`);
  const inked = () => p.evaluate(() => [...document.querySelectorAll('.grid .tile')].slice(0, 60).filter(t => t.querySelector('svg').innerHTML.length > 40).length);
  const loaded = () => p.evaluate(() => performance.getEntriesByType('resource').map(r => new URL(r.name).pathname).filter(n => n.includes('/data/four/')).map(n => n.split('/').pop()));
  for (const [style, weight] of [['Stroke', 'outline'], ['Two-tone', 'two-tone'], ['Duotone', 'duotone'], ['Fill', 'solid']]) for (const corners of ['Rounded', 'Sharp']) {
    await p.click(`.tb .seg-item:has-text("${corners}")`); await p.click(`.tb .seg-item:has-text("${style}")`);
    const file = `${corners.toLowerCase()}-${weight}.json`;
    await p.waitForFunction(f => performance.getEntriesByType('resource').some(r => r.name.endsWith('/data/four/' + f)), file, { timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(150);
    const n = await inked();
    check(n === 60 && await store(`s => s.get().P.weight + ' ' + s.get().P.corners`) === `${weight} ${corners.toLowerCase()}`, `${style.toLowerCase()}, ${corners.toLowerCase()}: the toolbar picks it and every icon draws (${n} of 60)`);
  }
  check((await loaded()).length === 8, `each of the eight drawings was fetched only when it was picked (${(await loaded()).length})`);
  await p.click('.tb .pill.raised:has-text("Shape")'); await p.click('.menu-row[data-value="circle"]');
  await p.waitForTimeout(150);
  check(await p.evaluate(() => document.querySelector('.tb-count').textContent) === '66 icons shown', 'Shape: Circle leaves the 66 icons drawn in a circle', await p.evaluate(() => document.querySelector('.tb-count').textContent));
  const size = p.locator('.tb .tick-slider').first().locator('input');
  await size.focus(); for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowRight');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.grid')).getPropertyValue('--icon-size').trim()) === '32px', 'the size slider moves with the keyboard and the icons follow it');
  const reset = p.locator('.tb .reset-btn');
  check(!(await reset.isDisabled()), 'Reset is on once anything has moved from its default');
  await reset.click(); await p.waitForTimeout(100);
  const st = await store(`s => [s.get().P.weight, s.get().P.corners, s.get().view.size, s.get().filter.box].join(' ')`);
  check(st === 'outline rounded 28 all' && await reset.isDisabled(), 'Reset puts style, corners, size and shape back, then waits', st);
  await p.click('.tb .pill.square[aria-label="Grid settings"]'); await p.click('.menu-settings .switch');
  await p.keyboard.press('Escape');
  const tile = p.locator('.grid .tile').nth(3); await tile.hover(); await p.waitForTimeout(200);
  const tip = await p.evaluate(() => { const t = document.querySelector('.grid-tip'); return t && !t.hidden && t.classList.contains('on') ? t.textContent : ''; });
  check(tip === await tile.getAttribute('aria-label'), `with the names off, the label follows the pointer (${tip})`);
  await store(`s => s.set({ view: { ...s.get().view, names: true } })`);
  check(!errors.length, 'no console errors on the way', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- the drawer on a phone ---------- */
console.log('glyphs toolbar on a phone');
{
  const { ctx, p, store } = await open('/public/glyphs/', { width: 390, height: 844 });
  check(await p.locator('.tb > .tb-controls').isHidden() && await p.locator('.tb-browse').isVisible(), 'the controls fold behind Browse');
  await p.click('.tb-browse'); await p.waitForSelector('.sheet-bottom .tb-controls');
  await p.click('.sheet-bottom .seg-item:has-text("Fill")');
  check(await store(`s => s.get().P.weight`) === 'solid', 'the drawer holds the same controls');
  await p.keyboard.press('Escape'); await p.waitForFunction(() => !document.querySelector('.sheet'), null, { timeout: 3000 }).catch(() => {});
  check(await p.locator('.tb > .tb-controls').count() === 1, 'and closing it puts them back under the toolbar');
  check(await p.locator('.tb-dot').isVisible(), 'a dot on Browse says something is off its default');
  await ctx.close();
}

/* ---------- the filled styles of the line icons ---------- */
console.log('glyphs filled styles of line icons');
{
  const { ctx, p, store, mod, errors } = await open('/public/glyphs/');
  const fetched = () => p.evaluate(() => performance.getEntriesByType('resource').filter(r => new URL(r.name).pathname.endsWith('/data/fills.json')).length);
  check(await fetched() === 0, 'the stored analysis waits until a filled style is shown');
  await store(`s => s.set({ filter: { q: '', set: 'core', cat: 'all', box: 'all' }, P: { ...s.get().P, weight: 'solid' } })`);
  await p.waitForFunction(() => performance.getEntriesByType('resource').some(r => r.name.endsWith('/data/fills.json')), null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(300);
  check(await fetched() === 1, 'and is fetched once when one is');
  const r = await p.evaluate(`Promise.all([import(${mod('library')}), import(${mod('engine')}), import(${mod('store')})]).then(([L, E, S]) => {
    const st = S.store.get(), at = (key, weight, corners = 'rounded') => L.primsOf(key, { ...st, P: { ...st.P, weight, corners } }, weight);
    const svgOf = (key, weight, corners) => E.svg(at(key, weight, corners), { ...st.P, weight, corners }, { uid: 'x', weight });
    /* in a duotone something stays in full: a path outside every faint group and every mask */
    const full = s => [...new DOMParser().parseFromString(s, 'image/svg+xml').querySelectorAll('path')].some(el => !el.closest('mask') && !el.closest('[opacity]'));
    const core = L.search({ q: '', set: 'core', cat: 'all' });
    const faint = core.filter(e => !full(svgOf(e.key, 'duotone'))).map(e => e.key);
    const pl = (key, c) => JSON.stringify((at(key, 'solid', c).a || {}).pl);
    return {
      faint, n: core.length,
      globe: svgOf('core:globe', 'solid'), globeLine: svgOf('core:globe', 'outline'),
      heartPlus: (at('core:heart-plus', 'solid').a || {}).b || [],
      sharp: pl('core:toggle-left', 'sharp') !== pl('core:toggle-left', 'rounded'),
      own: ['bet', 'power', 'send'].map(n => !!L.entryOf('beetle:' + n).makeSolid),
      alias: [L.entryOf('beetle:power-tone'), L.entryOf('beetle:send-filled')].map(e => e && e.key),
    };
  })`);
  check(r.faint.length === 0, `in duotone every core icon keeps something in full (${r.n - r.faint.length} of ${r.n})`, r.faint.slice(0, 5).join(', '));
  check(r.globe.includes('<mask') && r.globe !== r.globeLine, 'globe fills: a plate under its line, its meridians cut out');
  check(r.heartPlus.length === 2, `heart-plus closes across the gap its plus sits in, and keeps the plus apart (${r.heartPlus.length} badge parts)`);
  check(r.sharp, 'sharp corners take an analysis of their own where the plates move (toggle-left)');
  check(r.own.every(x => !x), 'bet, power and send take their filled styles from their line');
  check(r.alias[0] === 'beetle:power' && r.alias[1] === 'beetle:send', 'and their old names still find them', r.alias.join(', '));
  check(!errors.length, 'no console errors on the way', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- the toolbar stays in view ---------- */
console.log('glyphs toolbar while scrolling');
{
  const { ctx, p } = await open('/public/glyphs/', { width: 1440, height: 900 });
  const bar = () => p.evaluate(() => { const t = document.querySelector('.tb'); const r = t.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), stuck: t.classList.contains('stuck') }; });
  check(!(await bar()).stuck, 'at the top of the page the toolbar sits in its place');
  await p.mouse.wheel(0, 1800); await p.waitForTimeout(400);
  const down = await bar();
  check(down.top === 56 && down.stuck, `scrolled down, it stays under the top bar (${down.top}px)`);
  check(down.h <= 110, `in two rows, not three (${down.h}px)`);
  await p.mouse.wheel(0, -5000); await p.waitForTimeout(400);
  check(!(await bar()).stuck, 'and lets go at the top again');
  await ctx.close();
}

/* ---------- a category as a ZIP of SVGs ---------- */
console.log('glyphs category download');
{
  const { readFileSync } = await import('fs');
  const { inflateRawSync } = await import('zlib');
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(base + '/public/glyphs/'); await p.waitForFunction(() => document.querySelectorAll('.grid .tile').length > 100);
  await p.evaluate(() => import(new URL('src/lib/store.js', location.href).href).then(({ store }) => store.set({ P: { ...store.get().P, weight: 'solid' }, view: { ...store.get().view, color: '#ff7a1a' } })));
  const row = p.locator('.nav-row').filter({ hasText: 'animals' });
  const count = +(await row.locator('.count').textContent()).replace(/\D/g, '');
  await row.hover();
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), row.locator('.nav-dl').click()]);
  const buf = readFileSync(await dl.path());
  /* the central directory, read from the end */
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const files = [];
  for (let at = buf.readUInt32LE(end + 16), i = 0; i < buf.readUInt16LE(end + 10); i++) {
    const method = buf.readUInt16LE(at + 10), csize = buf.readUInt32LE(at + 20), nlen = buf.readUInt16LE(at + 28), off = buf.readUInt32LE(at + 42);
    const name = buf.toString('utf8', at + 46, at + 46 + nlen);
    const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), raw = buf.subarray(start, start + csize);
    files.push({ name, text: (method === 8 ? inflateRawSync(raw) : raw).toString('utf8') });
    at += 46 + nlen + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32);
  }
  const svgs = files.filter(f => f.name.endsWith('.svg'));
  check(dl.suggestedFilename() === 'beetle-glyphs-animals-fill.zip', 'the file is named for the category and the style', dl.suggestedFilename());
  check(svgs.length === count, `it holds every icon the category counts (${svgs.length} of ${count})`);
  check(svgs.every(f => f.text.startsWith('<svg') && f.text.includes('#ff7a1a') && !f.text.includes('currentColor')), 'each one an SVG in the grid\'s colour');
  check(files.some(f => f.name.endsWith('/LICENSE-core.txt') && f.text.includes('ISC')) && files.some(f => f.name.endsWith('/README.txt')), 'with the licence of the set it draws on and a note of the settings');
  await ctx.close();
}

await b.close();
close();
console.log(failures ? `glyphs: ${failures} failed` : 'glyphs: all passed');
process.exit(failures ? 1 : 0);
