/* The liquid under More (Round 44, the owner's word: Gooey, from
   Libraries.dev, for the plus): each action buds out of the black button as
   a drop of ink, stretches, lets go, rises, and melts into its glyph as the
   glyph arrives, so at rest there is nothing new on the screen. Closing runs
   it backwards: the glyphs melt back into drops that fall into the button.

   The drops and the button are drawn blurred and then cut at half their
   alpha, which is what makes two shapes near each other run together. These
   are the numbers both the phone (Skia) and the web (an SVG filter) use. */

/** the ink of the button, so the drops are the button's own */
export const GOO_BLUR = 9;
/** the cut: alpha × GAIN − SHIFT, in Skia's 0..1 */
export const GOO_GAIN = 20;
export const GOO_SHIFT = 9;
/** a drop at its fullest, a little under the glyph it becomes */
export const DROP_R = 15;
/** the button's own disc under the goo, a hair under its 28 so the button covers it exactly */
export const FAB_R = 27;

const unit = (v: number) => {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
};
const smooth = (v: number) => {
  'worklet';
  const x = unit(v);
  return x * x * (3 - 2 * x);
};

/** Where a drop is and how big, from how far its action has come (0 at the button, 1 at rest, past 1 in the overshoot). */
export const dropAt = (shown: number, from: { x: number; y: number }, to: { x: number; y: number }) => {
  'worklet';
  /* it rises ahead of the glyph, reaching the glyph's place by three quarters of the way */
  const k = smooth(shown / 0.75);
  /* full as it leaves the button, gone into the glyph by the time the glyph is there */
  const r = DROP_R * (0.55 + 0.45 * smooth(shown / 0.25)) * (1 - smooth((shown - 0.55) / 0.35));
  return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, r: shown <= 0.001 ? 0 : r };
};
