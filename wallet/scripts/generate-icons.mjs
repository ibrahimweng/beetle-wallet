/* The icon set is the glyphs exported from the Figma file. It lives once, in
   ../../src/icons.js at the repository root, and this writes the copy this app
   imports so the two can never drift apart. Run `npm run icons` after
   re-exporting. */
import { writeFileSync } from 'fs';
import { ICONS } from '../../src/icons.js';

/* The set is drawn to one rule — a glyph's line is 0.075 of its box and a
   bare mark's 0.10 — but the export writes no width on the glyph paths, so
   they would draw at the SVG default, a third of what the file shows, and
   thin beside the marks. The widths go back in here, every line gets round
   ends and joins, and every line takes the colour it is given: a chevron
   exported in grey or an arrow in white is drawn in whatever the screen
   asks for. Fills are left alone. */
const GLYPH = 1.8;
function normalise(svg) {
  return svg.replace(/<(path|circle|line|rect|polyline|ellipse)\b([^>]*?)(\/?)>/g, (whole, tag, attrs, close) => {
    if (!/\bstroke=/.test(attrs)) return whole;
    let a = attrs.replace(/\bstroke="(?:white|#[0-9a-fA-F]{3,6})"/, 'stroke="currentColor"');
    if (!/stroke-width=/.test(a)) a += ` stroke-width="${GLYPH}"`;
    if (!/stroke-linecap=/.test(a)) a += ' stroke-linecap="round"';
    if (!/stroke-linejoin=/.test(a)) a += ' stroke-linejoin="round"';
    return `<${tag}${a}${close}>`;
  });
}

/* The bar draws Home, Activities and Settings solid. The file has a solid
   house and a solid clock but only the outline gear, so the solid gear is
   derived here from the file's own rather than drawn: its cog filled, with
   the same line run round its edge so it keeps the outline's size, and its
   centre left open. */
function solidGear(svg) {
  const [hole, cog] = [...svg.matchAll(/<path d="([^"]+)"/g)].map(m => m[1]);
  if (!hole || !cog) throw new Error('icons: the gear has changed shape; look at solidGear');
  return `<path d="${cog}${hole}" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/><path d="${cog}" stroke="currentColor" fill="none"/>`;
}
const DERIVED = { 'gear-filled': solidGear(ICONS.gear) };

/* The brand's mark (Round 25): the ladybird in flight that is also a B, out
   of the brand file's own vector, set in the 24 box with 1 clear round it.
   It replaces the file's blue shutter wherever the mark is drawn. */
const BRAND = {
  mark: '<path d="M 19.27 1.22 C 19.5 1 19.86 1.01 20.07 1.25 C 22.27 3.87 22.13 7.79 19.67 10.25 C 17.27 12.65 13.49 12.83 10.87 10.79 L 10.8 10.87 C 12.83 13.49 12.65 17.27 10.25 19.67 C 7.79 22.13 3.88 22.27 1.26 20.07 C 1.02 19.86 1 19.49 1.22 19.27Z M 19.27 1.22" fill="currentColor"/><path d="M 12.75 4.68 C 12.97 4.9 12.97 5.24 12.76 5.45 L 5.45 12.75 C 5.24 12.96 4.9 12.96 4.69 12.75 C 4.61 12.68 4.57 12.59 4.55 12.5 C 4.54 12.5 4.54 12.5 4.54 12.49 C 4.54 12.48 4.53 12.46 4.53 12.44 C 4.53 12.44 4.53 12.43 4.53 12.43 C 4.08 10.02 4.6 7.72 6.16 6.16 C 7.73 4.59 10.04 4.08 12.47 4.53 C 12.48 4.54 12.49 4.54 12.49 4.54 C 12.59 4.56 12.68 4.61 12.75 4.68" fill="currentColor"/><path d="M 21.35 11.61 C 21.4 11.67 21.44 11.73 21.47 11.79 C 23 15.07 22.82 18.56 20.69 20.69 C 18.57 22.81 15.08 23 11.79 21.46 C 11.77 21.46 11.76 21.45 11.75 21.44 C 11.69 21.42 11.65 21.39 11.61 21.35 C 11.41 21.14 11.4 20.81 11.6 20.6 C 11.6 20.59 11.61 20.59 11.61 20.58 L 11.63 20.57 C 13.2 18.86 13.94 16.63 13.8 14.43 C 13.79 14.43 13.79 14.43 13.8 14.43 C 13.8 14.39 13.79 14.34 13.79 14.3 C 13.8 14.17 13.85 14.04 13.95 13.94 C 14.06 13.83 14.2 13.78 14.34 13.79 C 14.37 13.79 14.4 13.79 14.42 13.79 C 14.43 13.79 14.43 13.8 14.44 13.8 C 16.64 13.93 18.88 13.2 20.59 11.61 C 20.72 11.48 20.9 11.43 21.06 11.46 C 21.07 11.47 21.08 11.47 21.09 11.47 C 21.19 11.49 21.28 11.54 21.35 11.61" fill="currentColor"/>',
};
/* The file has no envelope, and the way in names an email as a step done (Round 30): a solid one in the set's
   manner, the box filled with its corners rounded as the card's are, and the flap a white line cut out of it. */
const EXTRA = {
  'mail-filled': '<rect x="2" y="4.5" width="20" height="15" rx="3.2" fill="currentColor"/><path d="M6 9 L12 13.2 L18 9" stroke="white" fill="none"/>',
};
const ALL = { ...ICONS, ...DERIVED, ...BRAND, ...EXTRA };

/* A solid glyph's details — the face in Face ID, the stripe on the card, the
   tick in the shield, the hands on the clock, the house's door — are drawn
   in the file as white lines and shapes laid over the fill. Drawn as they
   are, they are white on a white screen and a white smear on a dark one, and
   once every line takes the screen's colour they vanish into the fill. So
   they are cut out of it instead: the white pieces become a mask, and what
   shows through is whatever the glyph sits on. The mask's id is a
   placeholder the Icon makes unique for each glyph it draws. */
const CUT = '__CUT__';
const WHITE = /\b(stroke|fill)="(?:white|#fff|#ffffff)"/i;
function cutOut(svg) {
  const parts = [...svg.matchAll(/<(path|circle|line|rect|polyline|ellipse)\b[^>]*\/>/g)].map(m => m[0]);
  if (!parts.some(p => /\bfill="currentColor"/.test(p)) || !parts.some(p => WHITE.test(p))) return normalise(svg);
  const cuts = parts.filter(p => WHITE.test(p)).map(p => normalise(p).replace(/\b(stroke|fill)="(?:currentColor|white|#fff|#ffffff)"/gi, '$1="#000"'));
  const ink = parts.filter(p => !WHITE.test(p)).map(normalise);
  return `<defs><mask id="${CUT}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/>${cuts.join('')}</mask></defs><g mask="url(#${CUT})">${ink.join('')}</g>`;
}

const names = Object.keys(ALL).sort();
const body = names.map(n => `  ${JSON.stringify(n)}: ${JSON.stringify(cutOut(ALL[n]))},`).join('\n');

writeFileSync(
  new URL('../src/icons.ts', import.meta.url),
  `/* Generated by scripts/generate-icons.mjs. Do not edit by hand.
   These are the glyphs from the Figma file, exported as SVG, with the
   line widths the file draws them at put back on the paths, and a solid
   glyph's white details cut out of it (${CUT} is made unique per glyph drawn). */

export const ICONS = {
${body}
} as const;

export type IconName = keyof typeof ICONS;
export const iconNames = Object.keys(ICONS) as IconName[];
`,
);
console.log(`icons: wrote ${names.length} glyphs`);
