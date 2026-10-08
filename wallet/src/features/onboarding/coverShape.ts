/* The shape of the reveal, shared by the phone's dark and the web's. */

/** the oval is this much taller than it is wide */
export const OVAL = 1.4;

/** How far the oval must open to leave nothing of the dark on the screen: past its corners. */
export function reachOf(width: number, height: number) {
  return Math.sqrt((width / 2) ** 2 + (height / (2 * OVAL)) ** 2) * 1.08;
}

/** How open the oval is, 0 to 1, as the reveal goes: it starts a beat in, after the coin's dip, and is open well before the end. */
export function ovalAt(b: number) {
  'worklet';
  const g = Math.max(0, Math.min(1, (b - 0.08) / 0.56));
  return 1 - Math.pow(1 - g, 3);
}

/** How much of the dark is left: whole through the dip, then fading to nothing by the end. */
export function darkAt(b: number) {
  'worklet';
  return 1 - Math.max(0, Math.min(1, (b - 0.18) / 0.82));
}
