/* The Figma Community listing pictures, drawn by the site's own engine:

     node glyphs/figma-plugin/listing/make.mjs

   writes into glyphs/figma-plugin/listing/:
     icon.png          128 by 128, the plugin's icon
     thumbnail.png     1920 by 1080, the cover
     carousel-1..8.png 1920 by 1080, one picture each: the four styles,
                       the corners, the stroke, colour, and the panel itself

   Every icon is drawn by glyphs/src through the same library the site uses,
   and the panel picture is the built dist/ui.html, so running this again
   after a change on the site gives pictures that match it. Nothing here uses
   the network. The pictures name no other set and show no other logo,
   Figma's included. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const glyphs = resolve(here, '../..');
const require = createRequire(import.meta.url);
const CL = require(resolve(glyphs, 'vendor/clipper.js'));

/* the site's library, answered from the files on disk */
const BASE = 'https://listing.beetle-glyphs.invalid/';
globalThis.location = { href: BASE };
globalThis.fetch = async url => ({ ok: true, status: 200, json: async () => JSON.parse(readFileSync(resolve(glyphs, String(url).slice(BASE.length)), 'utf8')) });
const E = await import(pathToFileURL(resolve(glyphs, 'src/lib/engine.js')).href);
E.useClipper(CL);
const L = await import(pathToFileURL(resolve(glyphs, 'src/lib/library.js')).href);
await L.loadLibrary(BASE + 'data/icons.json');

const WANT = ['bell', 'calendar', 'camera', 'chart-pie', 'bookmark', 'briefcase', 'bug', 'cake', 'calculator', 'car', 'cloud', 'compass', 'credit-card', 'database', 'download', 'eye', 'file', 'flag', 'folder', 'gift', 'globe', 'heart', 'home', 'image', 'key', 'lightbulb', 'lock', 'map', 'microphone', 'moon', 'music', 'paperclip', 'pencil', 'phone', 'printer', 'rocket', 'search', 'send', 'settings', 'shield', 'star', 'sun', 'tag', 'trophy', 'umbrella', 'user', 'video', 'wallet', 'wifi', 'zap', 'bot', 'brain', 'battery', 'bike', 'anchor', 'award', 'banknote', 'book', 'bird', 'atom', 'alarm-clock', 'archive', 'basketball', 'bed', 'bitcoin', 'broom', 'building', 'cable', 'cast', 'bottle'];
const ICONS = WANT.map(n => 'four:' + n).filter(k => L.entryOf(k));
const STYLES = [['outline', 'Stroke'], ['two-tone', 'Two-tone'], ['duotone', 'Duotone'], ['solid', 'Fill']];
const INK = '#0a0a0a', MUTED = '#6b6b6b', LINE = '#e3e3e3';
let uid = 0;
async function draw(key, over = {}, size = 64, color = INK) {
  const P = { ...E.DEF, ...over };
  await L.drawingsFor(P);
  return E.svg(L.primsOf(key, { P, edits: {} }), P, { size, uid: 'l' + (++uid) }).replace(/currentColor/g, color);
}
const grid = async (keys, over, { size = 64, cols = 10, gap = 44, color = INK } = {}) =>
  `<div class="grid" style="grid-template-columns:repeat(${cols},${size}px);gap:${gap}px">${(await Promise.all(keys.map(k => draw(k, over, size, color)))).join('')}</div>`;

const page = (body, w = 1920, h = 1080) => `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${w}px; height: ${h}px; overflow: hidden; background: #fff; color: ${INK}; font-family: Geist, Inter, "Liberation Sans", sans-serif; -webkit-font-smoothing: antialiased; }
  .grid { display: grid; }
  .grid svg { display: block; }
  .slide { width: 100%; height: 100%; padding: 120px 140px; display: flex; flex-direction: column; justify-content: center; gap: 96px; }
  h1 { font-size: 88px; line-height: 1; font-weight: 700; letter-spacing: -0.035em; }
  h2 { font-size: 64px; line-height: 1.05; font-weight: 700; letter-spacing: -0.03em; }
  p { font-size: 32px; line-height: 1.35; color: ${MUTED}; max-width: 30ch; }
  .label { font-size: 22px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${MUTED}; }
  .row { display: flex; align-items: center; }
</style><body>${body}</body>`;

const mark = (size, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="${bg}"/><g fill="none" stroke="${fg}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.9 7.9a6.4 6.4 0 1 1-9.8 0"/><circle cx="12" cy="12" r="2.7"/></g></svg>`;

const pictures = [];
/* the icon: the site's own mark, ink on paper turned round so it holds on a white listing */
pictures.push(['icon.png', page(`<div style="width:128px;height:128px">${mark(128, '#fff', INK)}</div>`, 128, 128), 128, 128]);

/* the cover: the name, what it is, and the icons in their four styles */
{
  const rows = [];
  for (let r = 0; r < 4; r++) rows.push(await grid(ICONS.slice(r * 6, r * 6 + 6), { weight: STYLES[r][0] }, { size: 72, cols: 6, gap: 56 }));
  pictures.push(['thumbnail.png', page(`<div class="slide" style="flex-direction:row;align-items:center">
    <div style="display:flex;flex-direction:column;gap:40px;width:760px">
      <div class="row" style="gap:28px">${mark(96, '#fff', INK)}<h1>Beetle Glyphs</h1></div>
      <p style="font-size:40px;color:${INK};max-width:18ch">3,305 icons in four styles, with rounded or sharp corners.</p>
      <p>Free. Every icon is drawn again from your stroke, corners and colour.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:56px">${rows.join('')}</div>
  </div>`)]);
}

/* one picture per style */
const ABOUT = {
  outline: 'Clean lines that stay live strokes in Figma, so the weight is still yours to change.',
  'two-tone': 'The line over a soft fill of the same colour.',
  duotone: 'A soft body with the details and lines in full.',
  solid: 'Solid shapes, with every cut and hole kept clear.',
};
let n = 0;
for (const [w, name] of STYLES) {
  pictures.push([`carousel-${++n}.png`, page(`<div class="slide">
    <div style="display:flex;flex-direction:column;gap:20px"><div class="label">Style ${n} of 4</div><h2>${name}</h2><p style="max-width:44ch">${ABOUT[w]}</p></div>
    ${await grid(ICONS.slice(0, 30), { weight: w }, { size: 96, cols: 10, gap: 64 })}
  </div>`)]);
}

/* the corners */
{
  const pick = ICONS.slice(30, 40);
  const line = async (label, over) => `<div class="row" style="gap:48px"><div class="label" style="width:220px">${label}</div>${await grid(pick, over, { size: 72, cols: pick.length, gap: 48 })}</div>`;
  pictures.push([`carousel-${++n}.png`, page(`<div class="slide">
    <div style="display:flex;flex-direction:column;gap:20px"><h2>Rounded or sharp</h2><p style="max-width:44ch">Every style comes with both corners. Sharp squares each corner and cuts the line ends flat.</p></div>
    <div style="display:flex;flex-direction:column;gap:56px">
      ${await line('Rounded', { weight: 'outline', corners: 'rounded' })}
      ${await line('Sharp', { weight: 'outline', corners: 'sharp' })}
      ${await line('Rounded', { weight: 'solid', corners: 'rounded' })}
      ${await line('Sharp', { weight: 'solid', corners: 'sharp' })}
    </div>
  </div>`)]);
}

/* the stroke, re-derived */
{
  const pick = ICONS.slice(40, 50);
  const lines = [];
  for (const S of [1, 1.75, 2.5, 3.25, 4]) lines.push(`<div class="row" style="gap:48px"><div class="label" style="width:220px">Stroke ${S}</div>${await grid(pick, { weight: 'outline', S }, { size: 64, cols: pick.length, gap: 52 })}</div>`);
  pictures.push([`carousel-${++n}.png`, page(`<div class="slide">
    <div style="display:flex;flex-direction:column;gap:20px"><h2>Any stroke</h2><p style="max-width:44ch">Move one slider and every icon is drawn again. Corners and gaps keep their shape.</p></div>
    <div style="display:flex;flex-direction:column;gap:40px">${lines.join('')}</div>
  </div>`)]);
}

/* colour */
{
  const COLORS = ['#0a0a0a', '#e5484d', '#f76b15', '#ffb224', '#30a46c', '#0090ff', '#6e56cf', '#d6409f'];
  const tiles = [];
  for (let i = 0; i < 32; i++) tiles.push(await draw(ICONS[i + 8], { weight: STYLES[i % 4][0] }, 72, COLORS[i % COLORS.length]));
  pictures.push([`carousel-${++n}.png`, page(`<div class="slide">
    <div style="display:flex;flex-direction:column;gap:20px"><h2>Any colour</h2><p style="max-width:44ch">Pick a colour in the toolbar, and the icons arrive in it.</p></div>
    <div class="grid" style="grid-template-columns:repeat(16,72px);gap:34px">${tiles.join('')}</div>
  </div>`)]);
}

/* the panel itself: the built plugin, with a stand-in that only answers "ready" */
{
  const html = readFileSync(resolve(here, '../dist/ui.html'), 'utf8');
  pictures.push([`carousel-${++n}.png`, page(`<div class="slide" style="flex-direction:row;align-items:center;justify-content:space-between;gap:120px">
    <div style="display:flex;flex-direction:column;gap:24px;width:820px"><h2>The site's own toolbar, in one panel</h2>
      <p>Search, pick a style, set the stroke and click. Insert one icon, a batch, or a component set with Style and Corners variants. Swap an icon in place, or update a whole page to new settings.</p>
      <p>Everything is inside the plugin. It never uses the network.</p></div>
    <div style="width:546px;height:936px"><div style="transform:scale(1.3);transform-origin:0 0;width:420px;border:1px solid ${LINE};border-radius:12px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,.12)"><iframe id="panel" sandbox="allow-scripts" style="display:block;width:420px;height:720px;border:0"></iframe></div></div>
  </div>
  <script>
    const f = document.getElementById('panel');
    f.srcdoc = ${JSON.stringify(html).replace(/<\//g, '<\\/')};
    addEventListener('message', ev => { const m = ev.data && ev.data.pluginMessage; if (m && m.type === 'ready') f.contentWindow.postMessage({ pluginMessage: { type: 'init', command: 'open', saved: null, selection: { count: 0, ours: [] } } }, '*'); });
  </script>`), 1920, 1080, true]);
}

/* ---------- photograph them ---------- */
let browser;
try { browser = await chromium.launch(); } catch { browser = await chromium.launch({ executablePath: existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined }); }
mkdirSync(here, { recursive: true });
for (const [file, html, w = 1920, h = 1080, panel] of pictures) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html, { waitUntil: 'load' });
  if (panel) await p.frameLocator('#panel').locator('.grid .tile').nth(40).waitFor({ timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(panel ? 600 : 100);
  await p.screenshot({ path: resolve(here, file) });
  await p.close();
  console.log(`listing/${file}`);
}
await browser.close();
writeFileSync(resolve(here, 'README.md'), `# Listing pictures

The pictures for the plugin's page on Figma Community. \`make.mjs\` draws them with the site's own engine, so run it again after a change on the site, before you publish:

\`\`\`
node glyphs/figma-plugin/listing/make.mjs
\`\`\`

- \`icon.png\`: the plugin's icon, 128 by 128.
- \`thumbnail.png\`: the cover, 1920 by 1080.
- \`carousel-1.png\` to \`carousel-${n}.png\`: the carousel, 1920 by 1080 each, in this order: ${STYLES.map(s => s[1]).join(', ')}, then rounded or sharp corners, any stroke, any colour, and the panel itself.

They name no other icon set and show no other logo, Figma's included, as the review guidelines and the four-style set's licence ask.
`);
console.log(`${pictures.length} pictures, from ${ICONS.length} icons`);
