/* The built plugin in headless Chromium. A small host page plays Figma: it
   runs dist/code.js against the stand-in for figma, and shows dist/ui.html in
   a sandboxed iframe from srcdoc, with no network, as Figma does. The test
   drives the panel and reads the layers the plugin made.

     node glyphs/figma-plugin/test/ui.mjs           the checks
     node glyphs/figma-plugin/test/ui.mjs --shots   and pictures of the panel in test/shots/

   It also draws a sample of icons both ways, the site's SVG with its masks
   and the plugin's with outlined bodies, and checks that they cover the same
   pixels. */
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const glyphs = resolve(here, '../..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const HOST = `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0">
<script type="module">
import { makeFigma } from '/figma-plugin/test/fake-figma.js';
const [html, code] = await Promise.all(['/figma-plugin/dist/ui.html', '/figma-plugin/dist/code.js'].map(u => fetch(u).then(r => r.text())));
const figma = makeFigma({ command: new URLSearchParams(location.search).get('command') || '' });
window.figma = figma; window.drops = [];
const frame = document.createElement('iframe');
frame.setAttribute('sandbox', 'allow-scripts');
frame.style.cssText = 'width:420px;height:720px;border:0;display:block';
figma.showUI = (h, opts) => { figma.calls.push({ name: 'showUI', opts }); frame.srcdoc = h; document.body.append(frame); };
figma.ui.toPanel = msg => frame.contentWindow.postMessage({ pluginMessage: msg }, '*');
addEventListener('message', ev => {
  if (ev.source !== frame.contentWindow) return;
  if (ev.data && ev.data.pluginMessage) figma.ui.onmessage(ev.data.pluginMessage, { origin: 'null' });
  else if (ev.data && ev.data.pluginDrop) window.drops.push(ev.data.pluginDrop);
});
new Function('figma', '__html__', code)(figma, html);
</script>`;
const COMPARE = `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><script src="/vendor/clipper.js"></script><script type="module">
import * as E from '/src/lib/engine.js';
import { figmaSvg } from '/figma-plugin/ui/figma-svg.js';
window.E = E; window.figmaSvg = figmaSvg; window.ready = true;
</script>`;

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/host.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(HOST); }
  if (path === '/compare.html') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(COMPARE); }
  const file = resolve(glyphs, '.' + path);
  if (!file.startsWith(glyphs) || !existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const launch = { executablePath: existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined };
let browser;
try { browser = await chromium.launch(); } catch { browser = await chromium.launch(launch); }
let failures = 0;
const ok = (pass, what, detail = '') => { console.log(`  ${pass ? '✓' : '✗'} ${what}${pass || !detail ? '' : ' — ' + detail}`); if (!pass) failures++; };

async function open(query = '') {
  const page = await browser.newPage({ viewport: { width: 420, height: 720 } });
  const errors = [], requests = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith(base) && !/^(data|blob|about):/.test(r.url())) requests.push(r.url()); });
  await page.goto(base + '/host.html' + query);
  const ui = page.frameLocator('iframe');
  return { page, ui, errors, requests, fig: fn => page.evaluate(fn) };
}
const ours = () => window.figma.currentPage.findAll(n => n.getPluginData('beetle')).map(n => ({ id: n.id, type: n.type, name: n.name, parent: n.parent.type, d: JSON.parse(n.getPluginData('beetle')), kids: (n.children || []).length }));
const svgs = () => window.figma.calls.filter(c => c.name === 'createNodeFromSvg').map(c => c.svg);

console.log('figma plugin panel');
{
  const { page, ui, errors, requests, fig } = await open();
  const drew = await ui.locator('.grid .tile').nth(100).waitFor({ timeout: 20000 }).then(() => true, () => false);
  ok(drew, 'the library unpacks from inside the page and the grid draws');
  ok(await ui.locator('.tb-count').innerText().then(t => /3,305/.test(t)), 'all 3,305 icons are there', await ui.locator('.tb-count').innerText());

  /* the site's toolbar, in the open */
  const tb = ui.locator('.tb-controls');
  ok(await tb.isVisible(), 'the toolbar shows in the panel, not behind a Browse button');
  const styleBtns = await ui.locator('.tb-controls [aria-label="Style"] .seg-item').allInnerTexts();
  ok(styleBtns.join() === 'Stroke,Two-tone,Duotone,Fill', 'Style: Stroke, Two-tone, Duotone, Fill', styleBtns.join());
  const cornerBtns = await ui.locator('.tb-controls [aria-label="Corners"] .seg-item').allInnerTexts();
  ok(cornerBtns.join() === 'Rounded,Sharp', 'Corners: Rounded, Sharp');
  for (const label of ['Icon size', 'Stroke']) ok(await ui.locator(`.tb-controls input[aria-label="${label}"]`).count() === 1, `the ${label} slider`);
  ok(await ui.locator('.tb-controls .menu-shape').count() === 1 && /Shape/.test(await ui.locator('.tb-controls .menu-wrap').first().innerText()), 'the Shape menu');
  ok(await ui.locator('.tb-controls input[type=color]').count() === 1, 'the colour picker');
  ok(await ui.locator('.tb-controls .reset-btn').isDisabled(), 'Reset, off at the defaults');

  /* one click, one icon */
  const first = ui.locator('.grid .tile').first();
  const key = await first.getAttribute('data-key');
  await first.click();
  await page.waitForFunction(() => window.figma.currentPage.children.length > 0);
  let made = await fig(ours);
  ok(made.length === 1 && made[0].d.key === key && made[0].type === 'FRAME', `a click inserts the icon as a frame (${key})`);
  ok(made[0] && made[0].d.P.weight === 'outline' && made[0].d.P.S === 2.5, 'with the toolbar\'s settings stored on it');
  ok(made[0] && (await fig(() => window.figma.currentPage.children[0].width)) === 28, 'at the toolbar\'s size');
  let s = await fig(svgs);
  ok(s.length === 1 && !/currentColor|<mask|filter/.test(s[0]) && /#000000/.test(s[0]), 'the SVG has the colour written in, and no mask or filter');

  /* style, corners and colour reach Figma */
  await ui.locator('.tb-controls [aria-label="Style"] .seg-item:has-text("Fill")').click();
  await ui.locator('.tb-controls [aria-label="Corners"] .seg-item:has-text("Sharp")').click();
  await ui.locator('.tb-controls input[type=color]').evaluate(el => { el.value = '#ff5500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  ok(!(await ui.locator('.tb-controls .reset-btn').isDisabled()), 'Reset comes on once something changed');
  await page.waitForTimeout(200);
  await ui.locator('.grid .tile').nth(1).click();
  await page.waitForFunction(() => window.figma.currentPage.children.length > 1);
  made = await fig(ours); s = await fig(svgs);
  ok(made[1] && made[1].d.P.weight === 'solid' && made[1].d.P.corners === 'sharp' && made[1].d.color === '#ff5500', 'Fill, Sharp and the colour are what arrives');
  ok(/#ff5500/.test(s[1]) && !/#000000/.test(s[1]), 'in the chosen colour');
  await ui.locator('.tb-controls .reset-btn').click();

  /* sets and categories: the site's sidebar, in a sheet */
  await ui.locator('.pg-head button:has-text("Library")').click();
  await ui.locator('.sheet .nav-item:has-text("Four-style set")').click();
  await page.waitForTimeout(400);
  ok(/1,366/.test(await ui.locator('.tb-count').innerText()), 'the Library sheet picks a set: the four-style set has 1,366');
  await ui.locator('.page-head input[type=search]').fill('arrow');
  await page.waitForTimeout(400);
  const found = await ui.locator('.grid .tile').count();
  ok(found > 5 && found < 300, `search narrows the grid (${found} for "arrow")`);

  /* a batch */
  await fig(() => window.figma.select([]));
  const tiles = ui.locator('.grid .tile');
  await tiles.nth(0).click({ modifiers: ['Shift'] });
  await tiles.nth(1).click();
  await tiles.nth(2).click();
  ok(await ui.locator('.grid .tile.ticked').count() === 3 && /Insert 3/.test(await ui.locator('.pg-bar button:has-text("Insert")').innerText()), 'shift-click ticks icons, and the bar offers Insert 3');
  await ui.locator('.pg-bar button:has-text("Insert 3")').click();
  await page.waitForFunction(() => window.figma.currentPage.children.some(n => /^Beetle Glyphs, 3 icons/.test(n.name)));
  const grid3 = await fig(() => { const g = window.figma.currentPage.children.find(n => /^Beetle Glyphs, 3 icons/.test(n.name)); return g.children.map(c => JSON.parse(c.getPluginData('beetle')).key); });
  ok(grid3.length === 3 && grid3.every(k => k.startsWith('four:')), 'they arrive together in one grid frame');
  ok(await ui.locator('.grid .tile.ticked').count() === 0, 'and the ticks clear');

  /* as a component set */
  await fig(() => window.figma.select([]));
  await ui.locator('.pg-bar [aria-label="Insert as"] .seg-item:has-text("Variants")').click();
  await tiles.nth(3).click();
  await page.waitForFunction(() => window.figma.currentPage.children.some(n => n.type === 'COMPONENT_SET'));
  const set = await fig(() => { const c = window.figma.currentPage.children.find(n => n.type === 'COMPONENT_SET'); return c.children.map(v => v.name); });
  ok(set.length === 8 && set.includes('Style=Two-tone, Corners=Sharp'), 'Variants inserts a component set with Style and Corners');
  await ui.locator('.pg-bar [aria-label="Insert as"] .seg-item:has-text("Frame")').click();

  /* swap: select an icon on the canvas, click another */
  const target = await fig(() => { const n = window.figma.currentPage.children[0]; window.figma.select([n]); return { id: n.id, key: JSON.parse(n.getPluginData('beetle')).key }; });
  await page.waitForTimeout(150);
  ok(/selected\. Click an icon to swap it/.test(await ui.locator('.pg-sel').innerText()), 'with an icon selected, the bar says a click will swap it');
  const swapKey = await tiles.nth(4).getAttribute('data-key');
  await tiles.nth(4).click();
  await page.waitForFunction(id => JSON.parse(window.figma.byId.get(id).getPluginData('beetle')).key !== undefined && window.figma.calls.some(c => c.name === 'notify' && /Swapped/.test(c.text)), target.id);
  const swapped = await fig(() => JSON.parse(window.figma.currentPage.children[0].getPluginData('beetle')));
  ok(swapped.key === swapKey && swapped.key !== target.key, 'the click swaps it in place, the same layer with the new icon');

  /* update the page to new settings */
  await ui.locator('.tb-controls input[aria-label="Stroke"]').evaluate(el => { el.value = '1.5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await fig(() => window.figma.select([]));
  await ui.locator('.pg-bar button:has-text("Update page")').click();
  await page.waitForFunction(() => window.figma.calls.some(c => c.name === 'notify' && /^Updated/.test(c.text)));
  made = await fig(ours);
  ok(made.length >= 13 && made.every(m => m.d.P.S === 1.5), `Update page redraws every icon at stroke 1.5 (${made.length} layers)`);
  const variants = made.filter(m => m.d.kind === 'variant');
  ok(variants.length === 8 && new Set(variants.map(v => v.d.P.weight + v.d.P.corners)).size === 8, 'each variant keeps its own style and corners');

  /* settings are kept */
  await page.waitForTimeout(500);
  const saved = await fig(() => window.figma.clientStorage.data['beetle-glyphs-settings']);
  ok(saved && saved.P.S === 1.5 && saved.filter.set === 'four', 'the settings are saved through Figma for next time');

  /* drag out onto the canvas */
  await tiles.nth(0).evaluate(el => { el.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() })); el.dispatchEvent(new DragEvent('dragend', { bubbles: true, clientX: -40, clientY: 200 })); });
  await page.waitForFunction(() => window.drops.length > 0, null, { timeout: 5000 }).catch(() => {});
  const drop = await fig(() => window.drops[0]);
  ok(drop && drop.clientX === -40 && drop.dropMetadata.source === 'beetle-glyphs' && /<svg/.test(drop.dropMetadata.item.svg), 'dragging an icon out of the panel hands Figma a drop with the icon');

  /* goo, and the About sheet */
  await ui.locator('.pg-head button:has-text("Settings")').click();
  ok(await ui.locator('.sheet input#p-S').isVisible() && !(await ui.locator('.sheet input#p-goo').isVisible()), 'Settings has the site\'s sliders, without goo');
  ok(/Figma cannot import SVG filters/.test(await ui.locator('.sheet').innerText()), 'and says why goo is left out');
  await ui.locator('.sheet [aria-label="Close"]').click();
  await page.waitForTimeout(400);
  await ui.locator('.pg-head button:has-text("About")').click();
  const about = await ui.locator('.sheet').innerText();
  ok(/ISC License/i.test(about) && /Lucide/.test(about) && /MIT License/i.test(about) && /Keyline Icons/.test(about), 'About holds both licences in full');
  ok(!/Keyline/.test(await ui.locator('.pg-head, .pg-bar, .tb').allInnerTexts().then(t => t.join(' '))), 'the set is never named after Keyline outside the notice');
  ok(!errors.length, 'no errors in the console', errors.slice(0, 3).join(' | '));
  ok(!requests.length, 'nothing asked of the network', requests.slice(0, 3).join(' | '));
  await ui.locator('.sheet [aria-label="Close"]').click();
  await page.waitForTimeout(400);
  if (process.argv.includes('--shots')) {
    mkdirSync(resolve(here, 'shots'), { recursive: true });
    await page.screenshot({ path: resolve(here, 'shots/panel-light.png') });
    await ui.locator('html').evaluate(el => el.classList.add('figma-dark'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(here, 'shots/panel-dark.png') });
  }
  await page.close();
}

console.log('figma plugin: the relaunch button that updates');
{
  const { page, fig, errors } = await open('?command=sync');
  const closed = await page.waitForFunction(() => window.figma.closed, null, { timeout: 20000 }).then(() => true, () => false);
  ok(closed && (await fig(() => window.figma.calls.find(c => c.name === 'showUI').opts.visible)) === false, 'it runs with the panel hidden and closes when it is done');
  ok(!errors.length, 'no errors', errors.join(' | '));
  await page.close();
}

/* The site's SVG is the reference, with two of its own faults set aside, since
   the plugin does not have them: its masks use the default mask region, the
   fill's box plus 10%, which clips the stroke that grows a body; and with
   sharp corners a cut that is a dot has a butt end, so it cuts nothing.
   outline() gives a dot a square end, as the engine means it to. */
console.log('figma plugin: outlined bodies cover what the masks cover');
{
  const page = await browser.newPage();
  await page.goto(base + '/compare.html');
  await page.waitForFunction(() => window.ready);
  const icons = JSON.parse(readFileSync(resolve(glyphs, 'data/icons.json'), 'utf8'));
  const sample = [...Object.entries(icons.sets.core).filter((_, i) => i % 3 === 0), ...Object.entries(icons.sets.beetle)].map(([name, ic]) => ({ name, p: ic.p, ps: ic.ps }));
  const r = await page.evaluate(async sample => {
    const E = window.E, CL = window.ClipperLib, N = 96;
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d', { willReadFrequently: true });
    const ink = async svg => { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('width="24" height="24"', `width="${N}" height="${N}"`)); await img.decode(); g.clearRect(0, 0, N, N); g.drawImage(img, 0, 0); return g.getImageData(0, 0, N, N).data; };
    const isDot = (pr, P) => { let l = 0; for (const part of E.flatten(pr, P)) { if (part.closed) return false; for (let k = 1; k < part.pts.length; k++) l += Math.hypot(part.pts[k][0] - part.pts[k - 1][0], part.pts[k][1] - part.pts[k - 1][1]); } return l < 0.1; };
    let n = 0, dots = 0, worst = 0, worstName = '';
    for (const ic of sample) for (const weight of ['solid', 'duotone', 'two-tone']) for (const corners of ['rounded', 'sharp']) {
      const P = { ...E.DEF, weight, corners };
      const prims = weight === 'solid' && ic.ps ? ic.ps : ic.p;
      const site = E.svg(prims, P, { uid: 'x' });
      if (!site.includes('<mask')) continue;
      const roles = E.autoRoles(prims, P);
      if (corners === 'sharp' && prims.some((pr, i) => (roles[i] === 'detail' || roles[i] === 'cut') && isDot(pr, P))) { dots++; continue; }
      const ref = site.replace(/currentColor/g, '#000').replace(/<mask id=/g, '<mask maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32" id=');
      const a = await ink(ref), b = await ink(window.figmaSvg(prims, P, { CL, color: '#000000' }));
      let diff = 0, total = 0;
      for (let i = 3; i < a.length; i += 4) { diff += Math.abs(a[i] - b[i]); total += Math.max(a[i], b[i]); }
      const f = total ? diff / total : 0; n++;
      if (f > worst) { worst = f; worstName = `${ic.name} ${weight} ${corners}`; }
    }
    return { n, dots, worst, worstName };
  }, sample);
  ok(r.n > 800 && r.worst < 0.03, `${r.n} masked drawings match their outlined version within 3% of their ink (worst ${(r.worst * 100).toFixed(1)}%, ${r.worstName}; ${r.dots} with a dot cut in sharp corners set aside)`);
  await page.close();
}

await browser.close();
server.close();
if (failures) { console.error(`\n${failures} check${failures > 1 ? 's' : ''} failed`); process.exit(1); }
console.log('\nthe Figma plugin panel works');
