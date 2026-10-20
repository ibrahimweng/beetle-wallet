/* Beetle Glass in a browser: it draws, every control changes what it draws,
   history and the link keep up with it, a photo and a logo can be swapped in,
   the export comes out at the photo's own size, it fits a phone, and a browser
   without WebGL is told so plainly. Each case drives the real page and reads
   what it drew through window.beetleGlass rather than guessing at the screen.

   Run from the repository root after `npm install`:  node glass/test/glass.mjs
   CHROMIUM=/path/to/chrome uses a browser already on the machine. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = createServer((req, res) => {
  const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, rel);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

/* a runner has no graphics card: WebGL is drawn in software */
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
let failures = 0;
const check = (ok, what, detail = '') => { console.log(`  ${ok ? '✓' : '✗'} ${what}${ok || !detail ? '' : ' — ' + detail}`); if (!ok) failures++; };

async function open(hash = '', viewport = { width: 1280, height: 900 }, init = null) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  const errors = [];
  /* Sentient comes from Fontshare: a runner without the network still has to pass */
  p.on('console', m => { if (m.type() === 'error' && !/fontshare/.test(m.text() + (m.location().url || ''))) errors.push(m.text()); });
  p.on('pageerror', e => errors.push(e.message));
  if (init) await p.addInitScript(init);
  await p.goto(base + hash, { waitUntil: 'load' });
  const ready = await p.evaluate(() => window.beetleGlass.ready);
  const G = (fn, arg) => p.evaluate(fn, arg);
  const probe = () => G(() => window.beetleGlass.probe());
  return { ctx, p, errors, ready, G, probe };
}

/* ---------- it draws ---------- */
console.log('glass draws');
{
  const { ctx, p, errors, ready, G, probe } = await open();
  check(ready.webgl === true, 'WebGL 2 is there and the shader compiles');
  check(await p.title() === 'Beetle Glass', 'the page is Beetle Glass');
  const photo = await G(() => window.beetleGlass.photo);
  check(photo && photo.width === 1600 && photo.height === 2400, 'the sample photo loads at its own size', JSON.stringify(photo));
  check((await G(() => window.beetleGlass.logo)).custom === false, 'the Beetle mark is the logo tile to start with');
  const first = await probe();
  check(first.width > 100 && first.height > 100, `the preview has a size (${first.width} × ${first.height})`);
  check(first.spread > 20 && first.mean[3] > 250, 'it draws a picture, not a blank', JSON.stringify(first));
  check(!(await p.locator('#frame').getAttribute('class')).includes('loading'), 'the loading shimmer is gone once it has drawn');

  const s = await G(() => window.beetleGlass.state);
  check(s.shape === 'circle' && s.size === 50 && s.randomness === 30 && s.distortion === 50 && s.blur === 20 && s.highlights === 30,
    'the first look is circles, medium size, 30% random, medium bend, light blur, subtle highlights');

  /* with every effect off, the tiles show the photo unchanged: so the default really is glass */
  await G(() => window.beetleGlass.update({ distortion: 0, blur: 0, shadows: 0, highlights: 0, softness: 0, randomness: 0 }));
  const plain = await probe();
  check(plain.hash !== first.hash, 'the glass changes the photo');

  const look = async partial => { await G(x => window.beetleGlass.update(x), partial); return (await probe()).hash; };
  await G(() => window.beetleGlass.update({ distortion: 50, shadows: 20, highlights: 30, blur: 20, randomness: 30 }));
  const shapes = [];
  for (const shape of ['circle', 'square', 'oval', 'logo']) shapes.push(await look({ shape }));
  check(new Set(shapes).size === 4, 'each of the four shapes draws differently');
  const lenses = [];
  for (const lens of ['prism', 'lens', 'contour', 'flat']) lenses.push(await look({ shape: 'circle', lens }));
  check(new Set(lenses).size === 4, 'each of the four lens styles bends differently');
  const fills = [];
  for (const fill of ['photo', 'frosted', 'colour', 'clear']) fills.push(await look({ lens: 'lens', fill }));
  check(new Set(fills).size === 4, 'each way of filling the gaps draws differently');
  const clear = await probe();
  check(clear.mean[3] < 250, 'Clear leaves the gaps see-through', String(clear.mean[3]));
  await G(() => window.beetleGlass.update({ fill: 'photo' }));
  const seeds = [await look({ seed: 1 }), await look({ seed: 2 })];
  check(seeds[0] !== seeds[1], 'the seed moves the random layout');
  const lights = [await look({ lightAngle: 45 }), await look({ lightAngle: 225 })];
  check(lights[0] !== lights[1], 'the light direction moves the shading');
  const extras = [await look({ chroma: 0, grain: 0 }), await look({ chroma: 40 }), await look({ chroma: 0, grain: 40 })];
  check(new Set(extras).size === 3, 'chromatic aberration and grain each show');
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- the controls ---------- */
console.log('glass controls');
{
  const { ctx, p, errors, G } = await open();
  const state = () => G(() => window.beetleGlass.state);

  await p.getByRole('radio', { name: 'Square' }).click();
  check((await state()).shape === 'square', 'the Square choice makes square tiles');
  await p.getByRole('radio', { name: 'Logo' }).click();
  check(await p.locator('#logoRow').isVisible(), 'Logo shows the logo upload');
  await p.getByRole('radio', { name: 'Circle' }).click();
  await p.keyboard.press('ArrowRight');
  check((await state()).shape === 'square', 'arrow keys move along the shapes');
  check(await p.evaluate(() => document.activeElement.textContent) === 'Square', 'and the focus moves with the choice');

  const size = p.getByLabel('Size', { exact: true });
  await size.focus();
  for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowRight');
  check((await state()).size === 55, 'the Size slider moves with the keyboard', String((await state()).size));
  check((await p.locator('.ctl[data-key="size"] output').textContent()) === '55', 'and shows its value');
  await size.dblclick();
  check((await state()).size === 50, 'double-clicking a slider puts it back to its default');
  check(await p.locator('#tip-size').count() === 1 && (await size.getAttribute('aria-describedby')) === 'tip-size', 'a slider has its tooltip');

  const before = await state();
  await p.getByRole('button', { name: 'Shuffle' }).click();
  const shuffled = await state();
  check(shuffled.seed !== before.seed && JSON.stringify({ ...shuffled, seed: 0 }) === JSON.stringify({ ...before, seed: 0 }), 'Shuffle changes the seed and nothing else');
  check((await p.locator('#seedShown').textContent()) === String(shuffled.seed), 'the seed is shown');

  await p.getByRole('button', { name: 'Randomize all' }).click();
  const r = await state();
  const inRange = ['size', 'randomness', 'distortion', 'blur', 'gap', 'shadows', 'highlights'].every(k => r[k] >= 0 && r[k] <= 100);
  check(JSON.stringify(r) !== JSON.stringify(shuffled) && inRange, 'Randomize all picks a new look within range');
  check(r.size >= 30 && r.distortion >= 25 && r.distortion <= 85, 'and keeps to the tasteful ranges', JSON.stringify({ size: r.size, distortion: r.distortion }));

  await p.getByRole('button', { name: 'Undo' }).click();
  check(JSON.stringify(await state()) === JSON.stringify(shuffled), 'Undo takes the randomize back');
  await p.keyboard.press('Control+Shift+Z');
  check(JSON.stringify(await state()) === JSON.stringify(r), 'and Redo puts it back');

  await p.getByRole('button', { name: 'Randomize size' }).click();
  const diced = await state();
  check(JSON.stringify({ ...diced, size: 0 }) === JSON.stringify({ ...r, size: 0 }), 'a dice changes only its own setting');

  /* a slider drag is one step of history, not one for every pixel it moved */
  const stepsBefore = (await G(() => window.beetleGlass.history)).index;
  const box = await p.locator('#c-distortion').boundingBox();
  await p.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
  await p.mouse.down();
  for (let i = 1; i <= 10; i++) await p.mouse.move(box.x + box.width * (0.2 + i * 0.06), box.y + box.height / 2);
  await p.mouse.up();
  check((await G(() => window.beetleGlass.history)).index === stepsBefore + 1, 'a slider dragged is one step of history');

  for (const name of ['Frosted Dots', 'Water Droplets', 'Pixel Mosaic', 'Soft Ovals', 'Logo Pattern', 'Ribbed Glass']) {
    await p.getByRole('button', { name, exact: true }).click();
    const pressed = await p.getByRole('button', { name, exact: true }).getAttribute('aria-pressed');
    check(pressed === 'true', `the ${name} preset applies and shows as chosen`);
  }
  const ribbed = await state();
  check(ribbed.squareCells === false && ribbed.cellAspect < 0 && ribbed.shape === 'square', 'Ribbed Glass is tall narrow cells');

  /* the link carries the settings, and opening it brings them back */
  await p.getByRole('button', { name: 'Logo Pattern', exact: true }).click();
  const hash = await p.evaluate(() => location.hash);
  check(hash.includes('shape=logo') && !hash.includes('photo'), 'the link carries the settings and nothing of the photo', hash);
  const json = JSON.parse(await G(() => window.beetleGlass.settingsJSON()));
  check(json.app === 'Beetle Glass' && json.settings.shape === 'logo', 'the settings copy out as JSON');
  const again = await open(hash);
  check(JSON.stringify(await again.G(() => window.beetleGlass.state)) === JSON.stringify(await state()), 'a copied link opens to the same look');
  await again.ctx.close();

  /* Advanced, its groups and the light's dial */
  await p.getByRole('tab', { name: 'Advanced' }).click();
  check(await p.locator('#pane-advanced').isVisible() && !(await p.locator('#pane-simple').isVisible()), 'the Advanced tab shows its controls');
  await p.locator('summary', { hasText: 'Light' }).click();
  const dial = p.getByRole('slider', { name: 'Light direction' });
  const a0 = (await state()).lightAngle;
  await dial.focus();
  await p.keyboard.press('ArrowLeft');
  check((await state()).lightAngle === (a0 + 5) % 360, 'the light dial turns with the keyboard');
  const square = p.getByRole('switch', { name: 'Square cells' });
  check((await state()).squareCells === true && await p.locator('#c-cellAspect').isDisabled(), 'Cell shape waits while cells are square');
  await square.click();
  check((await state()).squareCells === false && (await square.getAttribute('aria-checked')) === 'false', 'the Square cells switch turns off');
  check(await p.locator('#c-cellAspect').isEnabled(), 'and Cell shape can then be moved');

  /* Reset, then the theme */
  await p.getByRole('button', { name: 'Reset' }).click();
  const reset = await state();
  check(reset.shape === 'circle' && reset.size === 50 && reset.distortion === 50, 'Reset brings the defaults back');
  await p.locator('#theme').click();
  check(await p.evaluate(() => document.documentElement.dataset.theme) === 'light', 'the theme can be set to light');
  await p.locator('#theme').click();
  check(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'and to dark');

  /* everything that can be pressed or typed in has a name */
  const nameless = await p.evaluate(() => [...document.querySelectorAll('button, input, [role="slider"]')]
    .filter(n => !n.hidden && n.type !== 'file' && n.offsetParent !== null)
    .filter(n => {
      const by = n.getAttribute('aria-labelledby');
      return !(n.getAttribute('aria-label') || (by && document.getElementById(by)?.textContent.trim()) || n.textContent.trim() || (n.id && document.querySelector(`label[for="${n.id}"]`)));
    }).map(n => n.outerHTML.slice(0, 80)));
  check(!nameless.length, 'every control has a name', nameless.join(' | '));
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- photos and logos in, a PNG out ---------- */
console.log('glass in and out');
{
  const { ctx, p, errors, G } = await open();

  /* a photo of its own, from the file picker */
  const png = await p.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 300; c.height = 200;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 300, 200);
    g.addColorStop(0, '#f04f22'); g.addColorStop(1, '#2b2721');
    x.fillStyle = g; x.fillRect(0, 0, 300, 200);
    return c.toDataURL('image/png').split(',')[1];
  });
  await p.locator('#file').setInputFiles({ name: 'mine.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await p.waitForFunction(() => window.beetleGlass.photo && window.beetleGlass.photo.width === 300);
  check((await p.locator('#dims').textContent()) === '300 × 200', 'a picked photo replaces the sample');
  check(await p.getByText('Your image never leaves your device').isVisible(), 'the page says the image stays on the device');

  /* an SVG of its own becomes the tile */
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M5 0 10 10H0z"/></svg>';
  await p.getByRole('radio', { name: 'Logo' }).click();
  await p.locator('#logoFile').setInputFiles({ name: 'triangle.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
  await p.waitForFunction(() => window.beetleGlass.logo && window.beetleGlass.logo.custom);
  check((await G(() => window.beetleGlass.state)).shape === 'logo', 'an uploaded SVG becomes the Logo tile');
  await p.getByRole('button', { name: 'Use Beetle mark' }).click();
  await p.waitForFunction(() => window.beetleGlass.logo && !window.beetleGlass.logo.custom);
  check(true, 'and the Beetle mark comes back');
  const bad = await p.evaluate(() => window.beetleGlass.useLogoText('<svg xmlns="http://www.w3.org/2000/svg"></svg>').then(() => 'took it', e => e.message));
  check(bad !== 'took it', 'an SVG with no size is turned away with a reason', bad);

  /* the export: the photo's own size, a PNG, and not blank */
  await p.reload({ waitUntil: 'load' });
  await p.evaluate(() => window.beetleGlass.ready);
  const out = await p.evaluate(async () => {
    const r = await window.beetleGlass.exportBlob();
    const bmp = await createImageBitmap(r.blob);
    const c = new OffscreenCanvas(64, 96);
    const x = c.getContext('2d');
    x.drawImage(bmp, 0, 0, 64, 96);
    const d = x.getImageData(0, 0, 64, 96).data;
    let lo = 255, hi = 0;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; lo = Math.min(lo, l); hi = Math.max(hi, l); }
    return { type: r.blob.type, width: r.width, height: r.height, bmp: [bmp.width, bmp.height], range: hi - lo };
  });
  check(out.type === 'image/png' && out.width === 1600 && out.height === 2400 && out.bmp[0] === 1600 && out.bmp[1] === 2400,
    'Export makes a PNG at the photo’s own 1600 × 2400', JSON.stringify(out));
  check(out.range > 60, 'and it is a picture, not a blank');
  const download = p.waitForEvent('download');
  await p.getByRole('button', { name: 'Export' }).click();
  check((await download).suggestedFilename() === 'beetle-sample-beetle-glass.png', 'the Export button downloads it');
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- a phone ---------- */
console.log('glass on a phone');
{
  const { ctx, p, errors, probe } = await open('', { width: 390, height: 844 });
  check(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'nothing runs off the side');
  check((await probe()).spread > 20, 'the picture draws');
  const sheet = await p.locator('#panel').boundingBox();
  check(sheet.y > 400 && sheet.y + sheet.height <= 845, 'the controls sit in a sheet at the bottom', JSON.stringify(sheet));
  await p.getByRole('button', { name: 'Show more controls' }).click();
  await p.waitForTimeout(300);
  const raised = await p.locator('#panel').boundingBox();
  check(raised.height > sheet.height + 100, 'and the sheet raises');
  check(await p.getByRole('button', { name: 'Export' }).isVisible(), 'Export is still in reach');
  check(!errors.length, 'no console errors', errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ---------- a browser without WebGL ---------- */
console.log('glass without WebGL');
{
  const off = () => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) { return /webgl/.test(kind) ? null : get.call(this, kind, ...rest); };
  };
  const { ctx, p, ready } = await open('', undefined, off);
  check(ready.webgl === false, 'it knows WebGL is missing');
  check(await p.getByRole('alert').filter({ hasText: 'WebGL' }).isVisible(), 'and says so plainly');
  check(await p.getByRole('button', { name: 'Export' }).isDisabled(), 'with Export switched off');
  await ctx.close();
}

await browser.close();
server.close();
if (failures) { console.log(`\n${failures} check${failures === 1 ? '' : 's'} failed`); process.exit(1); }
console.log('\nBeetle Glass: all checks passed');
