/* The test site (Round 40): the phone in the middle of the page running the
   app's own web build, View details beside it with what to type on each page,
   and the ways to try it on a phone, Expo Go first.

     npm run site                     # everything below, into site/out/
     node site/build.mjs [out]        # after the exports, site/out/ by default

   It needs the web export in dist/ (npm run bundle). Where the iOS and Android
   export is in dist-native/ too (npm run bundle:native), the site also serves
   the app to Expo Go itself: since May 2026 Expo Go only opens an EAS Update
   for the project's own Expo account, so anyone else scanning the code needs
   an update this site hosts, in plain JavaScript as Expo Go asks of a
   self-hosted one. The address the site will be at comes from SITE_URL, or on
   Vercel from the deployment; without one the Expo Go code falls back to the
   EAS link, which opens for the Expo account's own members only. Every path
   in the page is relative, so it can be hosted anywhere, even inside another
   page. */
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const DIST = join(ROOT, 'dist');
const NATIVE = join(ROOT, 'dist-native');
const OUT = resolve(process.argv[2] || join(here, 'out'));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'js'), { recursive: true });

/* a page anyone can open never carries a key: a bundle exported with one is refused here, before it goes anywhere */
const keyless = (text, what) => {
  if (/sk-ant-[A-Za-z0-9_-]{20,}/.test(text)) throw new Error(`The ${what} carries an Anthropic key. Export it again without EXPO_PUBLIC_ANTHROPIC_API_KEY set.`);
};

/* ---- the app on the page: the web bundle, its paths relative ---- */

const jsDir = join(DIST, '_expo/static/js/web');
const entry = existsSync(jsDir) && readdirSync(jsDir).find(f => /^entry-.*\.js$/.test(f));
if (!entry) throw new Error('No exported web bundle in dist/. Run npm run bundle first.');
const js = readFileSync(join(jsDir, entry), 'utf8').replace(/"\/assets\//g, '"assets/');
keyless(js, 'web bundle');
writeFileSync(join(OUT, 'js', entry), js);
cpSync(join(DIST, 'assets'), join(OUT, 'assets'), { recursive: true });

/* the app's own page: the bundle by a relative path under a plain name (some
   hosts keep names starting with an underscore for themselves), and history
   that keeps the address as it is, because a host that serves the page at one
   address has nothing to serve at /welcome */
const keepAddress = `<script>(function(){var p=history.pushState.bind(history),r=history.replaceState.bind(history);history.pushState=function(s,t){p(s,t)};history.replaceState=function(s,t){r(s,t)};})();</script>`;
const app = readFileSync(join(DIST, 'index.html'), 'utf8')
  .replace('src="/_expo/static/js/web/', 'src="js/')
  .replace('<script src=', keepAddress + '\n    <script src=');
if (!app.includes('src="js/')) throw new Error('The script tag in dist/index.html was not where this expected it.');
writeFileSync(join(OUT, 'app.html'), app);

/* ---- where the site is ---- */

const config = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo;
const projectId = config.extra?.eas?.projectId;
const sdk = JSON.parse(readFileSync(join(ROOT, 'node_modules/expo/package.json'), 'utf8')).version.split('.')[0];
const runtimeVersion = `exposdk:${sdk}.0.0`;
const host =
  (process.env.SITE_URL || '').replace(/^https?:\/\//, '').replace(/\/+$/, '') || (process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL) || '';
const origin = host ? `https://${host}` : '';

/* ---- the app for Expo Go, served from here ---- */

const md5 = buf => createHash('md5').update(buf).digest('hex');
const sha256 = buf => createHash('sha256').update(buf).digest('base64url');
/* a UUID worked from what the update holds, so the same build is the same update */
const uuidOf = text => {
  const h = createHash('sha256').update(text).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  json: 'application/json',
  mp4: 'video/mp4',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
};

let selfHosted = false;
if (origin && existsSync(join(NATIVE, 'metadata.json'))) {
  const meta = JSON.parse(readFileSync(join(NATIVE, 'metadata.json'), 'utf8'));
  /* the app's config as Expo Go reads it, without the EAS project and its update address: this update is the site's own */
  const expoClient = JSON.parse(execFileSync('npx', ['expo', 'config', '--type', 'public', '--json'], { cwd: ROOT, encoding: 'utf8' }));
  delete expoClient.updates;
  if (expoClient.extra) delete expoClient.extra.eas;
  const createdAt = new Date().toISOString();
  mkdirSync(join(OUT, 'expo', 'js'), { recursive: true });
  mkdirSync(join(OUT, 'expo', 'assets'), { recursive: true });
  for (const platform of ['ios', 'android']) {
    const files = meta.fileMetadata?.[platform];
    if (!files) throw new Error(`dist-native/ has no ${platform} bundle. Run npm run bundle:native.`);
    const bundle = readFileSync(join(NATIVE, files.bundle));
    if (bundle.subarray(0, 4).toString('hex') === 'c61fbc03')
      throw new Error(`The ${platform} bundle is Hermes bytecode; Expo Go only runs plain JavaScript from a site. Export it with --no-bytecode.`);
    keyless(bundle.toString('utf8'), `${platform} bundle`);
    const name = `${platform}-${md5(bundle)}.js`;
    writeFileSync(join(OUT, 'expo', 'js', name), bundle);
    const assets = files.assets.map(a => {
      const body = readFileSync(join(NATIVE, a.path));
      const key = a.path.split('/').pop();
      const file = `${key}.${a.ext}`;
      writeFileSync(join(OUT, 'expo', 'assets', file), body);
      return { hash: sha256(body), key, contentType: TYPES[a.ext] ?? 'application/octet-stream', fileExtension: `.${a.ext}`, url: `${origin}/expo/assets/${file}` };
    });
    const manifest = {
      id: uuidOf(`${platform}:${md5(bundle)}:${assets.map(a => a.hash).join(',')}`),
      createdAt,
      runtimeVersion,
      launchAsset: { hash: sha256(bundle), key: md5(bundle), contentType: 'application/javascript', url: `${origin}/expo/js/${name}` },
      assets,
      metadata: {},
      extra: { expoClient, scopeKey: `@beetle-site/${config.slug}` },
    };
    writeFileSync(join(OUT, 'expo', `${platform}.json`), JSON.stringify(manifest));
  }
  /* the address opened in a browser, rather than in Expo Go */
  writeFileSync(
    join(OUT, 'expo', 'index.html'),
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Beetle for Expo Go</title><body style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 16px">This address is the Beetle app for <b>Expo Go</b>. Open Expo Go on your phone and scan the code on <a href="../">the test site</a>.</body>',
  );
  selfHosted = true;
}

/* ---- the codes ---- */

const expoLink = selfHosted ? `exps://${host}/expo` : `exp://u.expo.dev/${projectId}?runtime-version=${encodeURIComponent(runtimeVersion)}&channel-name=preview`;
const qr = async text =>
  (await QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1a130d', light: '#ffffff' } })).replace('<svg ', '<svg role="img" aria-label="QR code" ');
const expoCode = await qr(expoLink);
const siteCode = origin ? await qr(`${origin}/`) : '';

/* ---- the page around it ---- */

const icons = readFileSync(join(ROOT, 'src', 'icons.ts'), 'utf8');
const mark = JSON.parse('"' + icons.match(/"mark":\s*"((?:[^"\\]|\\.)*)"/)[1] + '"');
const fill = (html, values) =>
  html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in values)) throw new Error(`site/page.html asks for {{${k}}}, which the build does not fill.`);
    return values[k];
  });
const page = fill(readFileSync(join(here, 'page.html'), 'utf8'), {
  MARK: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${mark}</svg>`,
  EXPO_CODE: expoCode,
  EXPO_LINK: expoLink,
  EXPO_WHO: selfHosted ? 'anyone' : 'team',
  SITE_CODE: siteCode,
  SITE_URL: origin ? `${origin}/` : '',
  SDK: sdk,
});
writeFileSync(join(OUT, 'index.html'), page);

/* ---- what to publish, for a host that takes a list ---- */

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
console.log(`${files.length} files in ${OUT}${selfHosted ? `, Expo Go served from ${origin}/expo` : ', Expo Go through EAS (the Expo account only)'}`);
