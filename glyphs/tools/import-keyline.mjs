/* import-keyline.mjs — copies the four-style set (Keyline Icons, MIT) into
   glyphs/sources/keyline/ from a checkout of its repository:

     git clone https://github.com/keyline-icons/keyline-icons
     node glyphs/tools/import-keyline.mjs path/to/keyline-icons

   It reads the set's own generated data (packages/cli/icons.json: every icon in
   stroke, two-tone, duotone and fill, each with rounded and sharp corners), its
   keywords and categories, and the names that look like containers but are not.
   Nothing in the checkout is run. build-library.mjs turns the result into the
   library; this only has to run again to take a newer release.

   The licence notice goes to glyphs/LICENSE-keyline.txt and stays with the
   icons. Their terms ask that a fork or a competing set is not named after
   theirs, so the site calls this the four-style set and credits them by name. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = process.argv[2];
if (!src || !existsSync(resolve(src, 'packages/cli/icons.json'))) { console.error('usage: node glyphs/tools/import-keyline.mjs path/to/keyline-icons (a checkout with packages/cli/icons.json)'); process.exit(1); }

const data = JSON.parse(readFileSync(resolve(src, 'packages/cli/icons.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(resolve(src, 'packages/react/package.json'), 'utf8'));
const notContainers = JSON.parse(readFileSync(resolve(src, 'lib/icon-not-containers.json'), 'utf8'));
let commit = '';
try { commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* not a git checkout */ }

/* the three roots the set uses, by one letter: a line with round ends, a line
   with butt ends, and a drawing with no line at all */
const ROOTS = {
  r: '{"fill":"none","stroke":"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"}',
  b: '{"fill":"none","stroke":"currentColor","stroke-width":"2","stroke-linecap":"butt","stroke-linejoin":"round"}',
  f: '{"fill":"none"}',
};
const codeOf = r => { const j = JSON.stringify(r); const k = Object.keys(ROOTS).find(c => ROOTS[c] === j); if (!k) throw new Error('a root this tool does not know: ' + j); return k; };
const tidy = body => body.replace(/>\s+</g, '><').trim();

const icons = {};
for (const [name, ic] of Object.entries(data.icons)) {
  const out = { r: {}, s: {} };
  for (const style of data.styles) {
    if (!ic[style] || !ic.sharp || !ic.sharp[style]) throw new Error(`${name} has no ${style} in both corners`);
    out.r[style] = [codeOf(ic[style].root), tidy(ic[style].body)];
    out.s[style] = [codeOf(ic.sharp[style].root), tidy(ic.sharp[style].body)];
  }
  icons[name] = out;
}
const category = {};
for (const c of data.categories) for (const n of c.names) if (!category[n]) category[n] = c.label;

const dir = resolve(root, 'sources', 'keyline');
mkdirSync(dir, { recursive: true });
const source = { repo: 'https://github.com/keyline-icons/keyline-icons', version: pkg.version, commit, license: 'MIT, see glyphs/LICENSE-keyline.txt' };
writeFileSync(resolve(dir, 'icons.json'), JSON.stringify({ source, styles: data.styles, roots: Object.fromEntries(Object.entries(ROOTS).map(([k, v]) => [k, JSON.parse(v)])), icons }));
writeFileSync(resolve(dir, 'meta.json'), JSON.stringify({ source, keywords: data.keywords, category, notContainers: notContainers.names || notContainers }));
const licence = readFileSync(resolve(src, 'LICENSE'), 'utf8');
writeFileSync(resolve(root, 'LICENSE-keyline.txt'), `The four-style set of Beetle Glyphs (glyphs/sources/keyline and the icons
built from it) is Keyline Icons ${pkg.version}, used under the MIT licence below:
${source.repo}

This notice stays with the icons. The set is not named after Keyline Icons and
does not use its wordmark or logo, as its terms ask.

---

${licence.trim()}
`);
console.log(`keyline ${pkg.version}${commit ? ' @ ' + commit.slice(0, 8) : ''}: ${Object.keys(icons).length} icons in ${data.styles.length} styles and 2 corners, ${Object.keys(category).length} with a category`);
