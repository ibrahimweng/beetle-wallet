/* The success pulse's numbers, shared by the phone and the web (Round 44). */

/** The beam's colourful light (Border beam's own palette, Libraries.dev), round the ring and back to its start. */
export const PULSE_LIGHT = ['rgb(255,50,100)', 'rgb(255,120,40)', 'rgb(50,200,80)', 'rgb(30,185,170)', 'rgb(40,140,255)', 'rgb(100,70,255)', 'rgb(180,40,240)', 'rgb(240,50,180)', 'rgb(255,50,100)'];

export const PULSE = {
  /** after the sheet has come up and the coin has landed */
  delay: 420,
  /** one ring, from the coin's rim to its farthest */
  ring: 1500,
  /** the second ring after the first */
  gap: 520,
  /** how far past the rim a ring goes */
  reach: 40,
  /** the ring's own line at the rim, thinning as it goes */
  width: 6,
  /** its softness */
  blur: 2.5,
  /** the glow round the line: wider and softer, at a part of its strength */
  glowWidth: 18,
  glowBlur: 10,
  glow: 0.55,
  /** at its brightest */
  peak: 1,
} as const;

/** How bright a ring is, from how far it has gone: bright almost at once, then fading as it spreads. */
export const ringAlpha = (k: number) => {
  'worklet';
  if (k <= 0 || k >= 1) return 0;
  return PULSE.peak * Math.min(1, k / 0.12) * Math.pow(1 - k, 1.3);
};

/** The square the rings are drawn in: the coin and as far as a ring and its glow reach. */
export const pulseBox = (radius: number) => Math.ceil((radius + PULSE.reach + PULSE.glowWidth / 2 + PULSE.glowBlur * 3) * 2);

/** How long the whole pulse takes, both rings. */
export const PULSE_TOTAL = PULSE.delay + PULSE.gap + PULSE.ring;
