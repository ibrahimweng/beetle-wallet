/* The code an account is paid by: a real QR, made here so that a bank app's
   camera reads it. What it carries is this build's own address for the
   account — the number and the name — until there is a bank behind the app
   to hand out the standard's (NQR) payload; the drawing does not care what
   the modules spell. Error correction M: a quarter of the code can be
   covered — by a thumb, a glare — and it still reads. */
import qrcode from 'qrcode-generator';

export type Code = {
  /** modules across (and down) */
  size: number;
  /** dark(row, column) */
  dark: (r: number, c: number) => boolean;
};

/** What the code says: where to pay, and whom. */
export function payload(accountNumber: string, name: string): string {
  return `beetle://pay?to=${accountNumber}&name=${encodeURIComponent(name)}`;
}

/** The code for some words, the smallest that holds them. */
export function codeFor(text: string): Code {
  const q = qrcode(0, 'M');
  q.addData(text, 'Byte');
  q.make();
  const size = q.getModuleCount();
  return { size, dark: (r, c) => q.isDark(r, c) };
}

/** Is a module part of one of the three finder eyes, and which: the eyes
    are drawn as rounded squares, the rest as plain modules. */
export function eyeAt(code: Code, r: number, c: number): 'tl' | 'tr' | 'bl' | null {
  const n = code.size;
  if (r < 7 && c < 7) return 'tl';
  if (r < 7 && c >= n - 7) return 'tr';
  if (r >= n - 7 && c < 7) return 'bl';
  return null;
}

/** One SVG path for every dark module outside the eyes, each a square of
    `cell` on a grid starting at `pad`: one path draws in one go. */
export function modulesPath(code: Code, cell: number, pad = 0): string {
  const parts: string[] = [];
  for (let r = 0; r < code.size; r++) {
    let c = 0;
    while (c < code.size) {
      if (!code.dark(r, c) || eyeAt(code, r, c)) {
        c++;
        continue;
      }
      /* a run of dark modules is one rectangle */
      let end = c;
      while (end + 1 < code.size && code.dark(r, end + 1) && !eyeAt(code, r, end + 1)) end++;
      const x = pad + c * cell;
      const y = pad + r * cell;
      parts.push(`M${x} ${y}h${(end - c + 1) * cell}v${cell}h${-(end - c + 1) * cell}z`);
      c = end + 1;
    }
  }
  return parts.join('');
}

/** The code as pixels, for a reader: `scale` pixels a module, with a quiet
    zone of four modules, as the standard asks. RGBA, white and black. */
export function rasterise(code: Code, scale = 4, quiet = 4): { data: Uint8ClampedArray; width: number; height: number } {
  const w = (code.size + 2 * quiet) * scale;
  const data = new Uint8ClampedArray(w * w * 4);
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.floor(y / scale) - quiet;
      const c = Math.floor(x / scale) - quiet;
      const dark = r >= 0 && c >= 0 && r < code.size && c < code.size && code.dark(r, c);
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = dark ? 0 : 255;
      data[i + 3] = 255;
    }
  }
  return { data, width: w, height: w };
}
