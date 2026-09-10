/* Serve the exported bundle with the fallback a single page app needs, so a
   route like /donesend loads the app rather than 404ing. */
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

export async function serve(dir = 'dist') {
  const ROOT = resolve(here, '..', dir);
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
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
