/* A small ZIP writer, enough for a folder of SVGs: each file deflated with the
   browser's own CompressionStream where it has one, stored where it doesn't. */
const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
async function deflate(bytes) {
  if (typeof CompressionStream !== 'function') return null;
  try { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch { return null; }
}

/* files: [{ name, data: string | Uint8Array }], names with / for folders -> a Blob */
export async function zip(files, date = new Date()) {
  const enc = new TextEncoder(), local = [], central = [];
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), raw = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(raw), packed = await deflate(raw);
    const method = packed && packed.length < raw.length ? 8 : 0, body = method ? packed : raw;
    /* the same fields open the file's own header and its entry in the directory */
    const fields = (v, at) => { v.setUint16(at, 0x0800, true); v.setUint16(at + 2, method, true); v.setUint16(at + 4, time, true); v.setUint16(at + 6, day, true); v.setUint32(at + 8, crc, true); v.setUint32(at + 12, body.length, true); v.setUint32(at + 16, raw.length, true); v.setUint16(at + 20, name.length, true); };
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); fields(head, 6);
    local.push(head, name, body);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true); entry.setUint16(4, 20, true); entry.setUint16(6, 20, true); fields(entry, 8); entry.setUint32(42, offset, true);
    central.push(entry, name);
    offset += 30 + name.length + body.length;
  }
  const size = central.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...local, ...central, end], { type: 'application/zip' });
}
