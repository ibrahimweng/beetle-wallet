/* The amount picker's steps, as plain arithmetic (see design/Amount): finer
   where the money is small — ₦100 a step up to ₦10,000, ₦500 up to
   ₦100,000, ₦1,000 above — and the last step is the cap itself. Each runs
   on the UI thread too, as the ruler moves. */

/** The value at a step of the ruler: ₦100 a step up to ₦10,000, ₦500 up to ₦100,000, ₦1,000 above. */
export function valueAt(i: number): number {
  'worklet';
  if (i <= 100) return i * 100;
  if (i <= 280) return 10_000 + (i - 100) * 500;
  return 100_000 + (i - 280) * 1_000;
}

/** The step nearest a value. */
export function stepOf(v: number): number {
  'worklet';
  if (v <= 10_000) return Math.round(Math.max(0, v) / 100);
  if (v <= 100_000) return 100 + Math.round((v - 10_000) / 500);
  return 280 + Math.round((v - 100_000) / 1_000);
}

/** The ruler's last step for a cap: the first step at or past it. The value there is the cap itself. */
export function lastStep(max: number): number {
  'worklet';
  if (max <= 10_000) return Math.ceil(Math.max(0, max) / 100);
  if (max <= 100_000) return 100 + Math.ceil((max - 10_000) / 500);
  return 280 + Math.ceil((max - 100_000) / 1_000);
}

/** A step's value, never past the cap. */
export function pickedAt(i: number, max: number): number {
  'worklet';
  return Math.min(max, valueAt(i));
}

/** The step a figure sits on, for a ruler that stops at `max`: the cap is the last step, though it is not on the grid (₦595,267 is not ₦595,000). */
export function stepFor(v: number, max: number): number {
  'worklet';
  const last = lastStep(max);
  return v >= max ? last : Math.min(last, stepOf(v));
}
