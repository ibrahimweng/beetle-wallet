/* Package the exported web bundle as a page that can be hosted anywhere,
   including inside another page: every path relative, the address never
   changed by navigation, and a page around it with the keys to the mocks.

     npx expo export --platform web --output-dir dist
     node artifact/build.mjs [out]        # out/ by default */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(here, '..', 'dist');
const OUT = resolve(process.argv[2] || join(here, 'out'));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, '_expo/static/js/web'), { recursive: true });

/* the bundle, with its asset paths made relative to the page */
const jsDir = join(DIST, '_expo/static/js/web');
const entry = readdirSync(jsDir).find(f => /^entry-.*\.js$/.test(f));
if (!entry) throw new Error('No exported bundle in dist/. Run npm run bundle first.');
const js = readFileSync(join(jsDir, entry), 'utf8').replace(/"\/assets\//g, '"assets/');
writeFileSync(join(OUT, '_expo/static/js/web', entry), js);
cpSync(join(DIST, 'assets'), join(OUT, 'assets'), { recursive: true });

/* the app's page: the bundle by a relative path, and history that keeps the
   address as it is, because a host that serves the page at one address has
   nothing to serve at /welcome */
const keepAddress = `<script>(function(){var p=history.pushState.bind(history),r=history.replaceState.bind(history);history.pushState=function(s,t){p(s,t)};history.replaceState=function(s,t){r(s,t)};})();</script>`;
let app = readFileSync(join(DIST, 'index.html'), 'utf8')
  .replace('src="/_expo/', 'src="_expo/')
  .replace('<script src=', keepAddress + '\n    <script src=');
if (!app.includes('src="_expo/')) throw new Error('The script tag in dist/index.html was not where this expected it.');
writeFileSync(join(OUT, 'app.html'), app);

/* the page around it, with the mark from the icon set */
const icons = readFileSync(resolve(here, '..', 'src', 'icons.ts'), 'utf8');
const mark = JSON.parse('"' + icons.match(/"mark":\s*"((?:[^"\\]|\\.)*)"/)[1] + '"');
const page = readFileSync(join(here, 'page.html'), 'utf8').replace('{{MARK}}', `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${mark}</svg>`);
writeFileSync(join(OUT, 'index.html'), page);

/* what to publish */
const files = [];
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(OUT, p));
  }
};
walk(OUT);
writeFileSync(join(OUT, 'files.json'), JSON.stringify(files.filter(f => f !== 'index.html' && f !== 'files.json').sort(), null, 2));
console.log(`${files.length} files in ${OUT}`);
