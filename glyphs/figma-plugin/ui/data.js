/* The data, from inside the page. The build stores each of the site's data
   files in a script element, compressed and written as base64, under a
   made-up address. This answers fetch() for those addresses, so the site's
   own loadLibrary() and loadDrawings() run unchanged, and unpacks a file
   only when it is first asked for. It also answers the two licence notices,
   which the site's ZIP download fetches from beside the page. Any other
   address is refused: the plugin has no network access. */
const blobs = new Map();
/* the licence notices, which the site's ZIP download asks for beside the page */
const NOTICES = { 'LICENSE-core': 'licence-core', 'LICENSE-keyline': 'licence-four' };
for (const el of document.querySelectorAll('script[type="application/gzip-base64"]')) blobs.set(el.dataset.url, el);

async function unpack(el) {
  const bin = atob(el.textContent.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export function installData() {
  const own = window.fetch && window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = String(input && input.url ? input.url : input);
    const el = blobs.get(url);
    if (el) return unpack(el);
    const notice = /(?:^|\/)(LICENSE-core|LICENSE-keyline)\.txt$/.exec(url.split(/[?#]/)[0]);
    if (notice) return new Response(document.getElementById(NOTICES[notice[1]]).textContent, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    if (own && /^(data|blob):/.test(url)) return own(input, init);
    throw new TypeError(`Beetle Glyphs has no network access, so it cannot fetch ${url}`);
  };
}

export const DATA_URL = [...blobs.keys()].find(u => u.endsWith('/data/icons.json'));
