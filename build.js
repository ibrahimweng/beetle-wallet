/* Beetle — build.
   Rolls the ES modules and the two stylesheets into one self-contained page,
   because a published artifact is a single file with no network to fetch from.

   Each module becomes an IIFE returning its exports; imports become
   destructuring from the module already built. No dependencies. */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'fs';
import { dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const src = p => readFileSync(resolve(here, p), 'utf8');

/* dependency order, hand-kept: a module may only import ones above it */
const ORDER = [
  'src/ui.js',
  'src/data.js',
  'src/store.js',
  'src/flow.js',
  'src/actions.js',
  'src/agent.js',
  'src/screens/act1.js',
  'src/screens/home.js',
  'src/screens/act2.js',
  'src/screens/act3a.js',
  'src/screens/act3b.js',
  'src/screens/act4.js',
  'src/screens/index.js',
  'src/app.js',
];

const key = path => 'M$' + relative('.', path).replace(/[^\w]/g, '_');

/* './x.js' seen from inside `from` -> the key of the module it means */
const target = (from, spec) => key(relative(here, resolve(here, dirname(from), spec)));

function wrap(path) {
  let code = src(path);
  const exports = [];

  /* import { a, b as c } from './x.js'  ->  const { a, b: c } = M$x; */
  code = code.replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';?\s*$/gm, (_, names, spec) =>
    `const {${names.replace(/\bas\b/g, ':')}} = ${target(path, spec)};`);

  /* import * as ns from './x.js'  ->  const ns = M$x; */
  code = code.replace(/^import\s*\*\s*as\s*(\w+)\s*from\s*'([^']+)';?\s*$/gm, (_, ns, spec) =>
    `const ${ns} = ${target(path, spec)};`);

  /* export const/let/function X  ->  const/let/function X, remembered */
  code = code.replace(/^export\s+(const|let|async function|function)\s+(\w+)/gm, (_, kind, name) => {
    exports.push(name);
    return `${kind} ${name}`;
  });

  /* export { a, b };  ->  nothing here, the names just join the exports */
  code = code.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (_, names) => {
    names.split(',').map(n => n.trim()).filter(Boolean).forEach(n => exports.push(n.split(/\s+as\s+/).pop()));
    return '';
  });

  if (/^export\b/m.test(code)) throw new Error('unhandled export syntax in ' + path);
  if (/^import\b/m.test(code)) throw new Error('unhandled import syntax in ' + path);

  return `/* ${path} */\nconst ${key(path)} = (function () {\n${code}\nreturn { ${exports.join(', ')} };\n})();\n`;
}

const js = ORDER.map(wrap).join('\n');
const css = src('src/tokens.css') + '\n' + src('src/app.css');

const page = `<title>Beetle</title>
<style>
${css}
</style>

<script type="module">
${js}
</script>
`;

mkdirSync(resolve(here, 'dist'), { recursive: true });
writeFileSync(resolve(here, 'dist/beetle.html'), page);
console.log('dist/beetle.html', (page.length / 1024).toFixed(1) + ' kB');

/* Assemble what a host should serve into one directory. Vercel is pointed at
   this rather than at the repository root, so there is no guessing about what
   ends up on the deployment — and the tests can check the exact thing. */
const out = resolve(here, 'public');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const item of ['index.html', 'src', 'dist']) {
  cpSync(resolve(here, item), resolve(out, item), { recursive: true });
}
console.log('public/ ready to serve');
