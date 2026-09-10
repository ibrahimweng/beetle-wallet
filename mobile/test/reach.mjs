/* Nothing is stranded.

   Every screen in the design has to be reachable by tapping, from the first
   screen the app opens on. This walks the source rather than the running app:
   for each built screen it reads which route ids that file names, and follows
   them from `start`. A screen nobody can get to is a screen that was drawn
   and then lost, which is the thing this test exists to stop. */
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', 'src');

const routeSrc = readFileSync(join(src, 'routes.ts'), 'utf8');
const routes = routeSrc
  .match(/export type Route =([\s\S]*?);/)[1]
  .split('|')
  .map(s => s.trim().replace(/["']/g, ''))
  .filter(Boolean);
const isRoute = new Set(routes);

/* Which file draws which screen, taken from the registry in navigation.tsx. */
const navSrc = readFileSync(join(src, 'navigation.tsx'), 'utf8');
const imports = [...navSrc.matchAll(/import\s+\{([^}]+)\}\s+from\s+'\.\/screens\/([\w-]+)'/g)].flatMap(
  ([, names, file]) => names.split(',').map(n => [n.trim().split(' as ')[0], file]),
);
const fileFor = new Map(imports);

const built = new Map(); // route -> file that draws it
for (const [, route, comp] of navSrc.matchAll(/^\s{2}(\w+): \(\{ nav \}\) => <(\w+)/gm)) {
  const file = fileFor.get(comp);
  if (file) built.set(route, file);
}

/* What each file can reach: any route id it names, whether that is `go('x')`,
   a `to:` in a table, or a literal in a list of choices. */
const mentions = new Map();
for (const f of readdirSync(join(src, 'screens'))) {
  const text = readFileSync(join(src, 'screens', f), 'utf8');
  mentions.set(
    f.replace(/\.tsx?$/, ''),
    new Set([...text.matchAll(/'([a-z0-9]+)'/g)].map(m => m[1]).filter(r => isRoute.has(r))),
  );
}
/* The ask bar is on nearly every screen and can take you to any of these. */
const agent = new Set(
  [...readFileSync(join(src, 'state', 'agent.ts'), 'utf8').matchAll(/'([a-z0-9]+)'/g)]
    .map(m => m[1])
    .filter(r => isRoute.has(r)),
);
/* A ledger line opens the screen its row names. */
const ledger = new Set(
  [...readFileSync(join(src, 'state', 'data.js'), 'utf8').matchAll(/to: '([a-z0-9]+)'/g)]
    .map(m => m[1])
    .filter(r => isRoute.has(r)),
);

const out = new Map();
for (const [route, file] of built) {
  const to = new Set([...(mentions.get(file) ?? []), ...agent]);
  if (file === 'home' || file === 'services') for (const r of ledger) to.add(r);
  out.set(route, to);
}

/* Walk from the screen the app opens on. */
const seen = new Set(['start']);
const queue = ['start'];
while (queue.length) {
  const at = queue.shift();
  for (const next of out.get(at) ?? [])
    if (!seen.has(next)) {
      seen.add(next);
      queue.push(next);
    }
}

const stranded = routes.filter(r => !seen.has(r));
const unbuilt = routes.filter(r => !built.has(r));

if (unbuilt.length) console.log(`reach: ${unbuilt.length} route(s) with no screen: ${unbuilt.join(', ')}`);
if (stranded.length)
  console.log(`reach: ${stranded.length} screen(s) nothing can reach: ${stranded.join(', ')}`);
if (!stranded.length && !unbuilt.length)
  console.log(`reach: all ${routes.length} screens are reachable from start`);
process.exit(stranded.length || unbuilt.length ? 1 : 0);
