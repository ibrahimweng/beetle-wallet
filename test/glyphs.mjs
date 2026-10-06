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
    for (const set of ['all', 'scenarios', 'beetle', 'core']) {
      const entries = L.search({ q: '', set, cat: 'all' });
      const names = entries.map(e => L.exportName(e.key));
      views[set] = { n: entries.length, unique: new Set(names).size };
    }
    const app = L.search({ q: '', set: 'beetle', cat: 'all' });
    const sprite = X.spriteOf(app, P, prims);
    const ids = [...sprite.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]);
    const json = JSON.parse(X.jsonOf(L.search({ q: '', set: 'all', cat: 'all' }), P, prims));
    return { views, symbols: ids.length, uniqueSymbols: new Set(ids).size, appGlyphs: app.length, jsonIcons: Object.keys(json.icons).length, all: views.all.n,
      card: [L.exportName('param:card'), L.exportName('beetle:card')], alias: L.exportName('beetle:card-filled'), snippet: X.usageSnippet('core:house', 'outline') };
  })`);
  for (const [set, v] of Object.entries(r.views)) check(v.n === v.unique, `every icon in the ${set} view has a name of its own (${v.unique} of ${v.n})`);
  check(r.symbols === r.appGlyphs && r.uniqueSymbols === r.symbols, `the app glyphs sprite has one symbol per icon (${r.uniqueSymbols} of ${r.appGlyphs})`);
  check(r.jsonIcons === r.all, `the JSON keeps every icon (${r.jsonIcons} of ${r.all})`);
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
    await menu(); await p.locator('.sheet button[aria-label="Close"]').click();
    await menu(); await p.keyboard.press('Escape');
    await menu(); await p.mouse.click(860, 450);
    await menu(); await p.locator('.sheet .nav-item', { hasText: 'App glyphs' }).click();
  }
  check(await sheet() === 0, 'the library sheet closes every way it can');
  const after = await live();
  check(after === before, `opening and closing it eight times leaves the store with the listeners it had (${after}, was ${before})`);
  await store(`s => s.set({ filter: { q: '', set: 'all', cat: 'all' } })`);
  await ctx.close();
}

await b.close();
close();
console.log(failures ? `glyphs: ${failures} failed` : 'glyphs: all passed');
process.exit(failures ? 1 : 0);
