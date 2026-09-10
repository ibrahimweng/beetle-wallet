/* Open every screen that has been built and check it draws without an error.

   It runs against the exported web bundle, which is the same JavaScript the
   phone runs, so a screen that throws here throws there. Screens that are
   still ToBuild are reported separately rather than counted as failures.

     npx expo export --platform web --output-dir dist
     node test/screens.mjs dist
*/
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { launch } from './browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', process.argv[2] || 'dist');
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(ROOT, url);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(ROOT, 'index.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

/* routes.ts is TypeScript, so read the ids out of it rather than import it */
const src = await readFile(join(here, '..', 'src', 'routes.ts'), 'utf8');
const ids = [...src.matchAll(/^\s*["']?([a-z0-9]+)["']?:\s*\{\s*$/gm)].map(m => m[1]);

const b = await launch();
const page = await b.newPage({ viewport: { width: 393, height: 852 } });
page.setDefaultTimeout(10000);

const broken = [],
  toBuild = [];
for (const id of ids) {
  const errs = [];
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') errs.push(m.text());
  });
  await page.goto(`${base}/${id}`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const text = await page.evaluate(() => document.body.innerText || '');
  if (text.includes('Not built in React Native yet')) {
    toBuild.push(id);
    continue;
  }
  const real = errs.filter(e => !/favicon|Download the React DevTools/i.test(e));
  if (!text.trim() || real.length) broken.push({ id, empty: !text.trim(), errs: real.slice(0, 2) });
}
await b.close();
server.close();

const built = ids.length - toBuild.length;
console.log(
  `screens: ${built}/${ids.length} built, ${broken.length} broken, ${toBuild.length} still to build`,
);
broken.forEach(x => console.log('  ✗', x.id, x.empty ? '(drew nothing)' : JSON.stringify(x.errs)));
process.exit(broken.length ? 1 : 0);
