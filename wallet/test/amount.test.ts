/* The amount picker's steps: ₦100 up to ₦10,000, ₦500 up to ₦100,000,
   ₦1,000 above; the last step is the cap itself. */
import { describe, expect, it } from 'vitest';
import { lastStep, pickedAt, stepFor, stepOf, valueAt } from '../src/lib/steps';

describe('the ruler’s steps', () => {
  it('are finer where the money is small', () => {
    expect(valueAt(0)).toBe(0);
    expect(valueAt(1)).toBe(100);
    expect(valueAt(100)).toBe(10_000);
    expect(valueAt(101)).toBe(10_500);
    expect(valueAt(280)).toBe(100_000);
    expect(valueAt(281)).toBe(101_000);
  });
  it('find the nearest step for any figure', () => {
    expect(stepOf(20_000)).toBe(120);
    expect(stepOf(20_350)).toBe(121);
    expect(valueAt(stepOf(250_000))).toBe(250_000);
    for (const v of [0, 100, 9_900, 10_000, 55_500, 100_000, 659_000]) expect(valueAt(stepOf(v))).toBe(v);
  });
  it('stop hard at the cap, which is the last step’s value', () => {
    const cap = 659_320.75;
    const last = lastStep(cap);
    expect(valueAt(last)).toBeGreaterThanOrEqual(cap);
    expect(valueAt(last - 1)).toBeLessThan(cap);
    expect(pickedAt(last, cap)).toBe(cap);
    expect(pickedAt(last - 1, cap)).toBe(659_000);
    expect(lastStep(50_000)).toBe(180);
    expect(pickedAt(lastStep(50_000), 50_000)).toBe(50_000);
  });
  it('put the cap on the last step, though it is not on the grid', () => {
    const cap = 595_267;
    expect(stepFor(cap, cap)).toBe(lastStep(cap));
    expect(pickedAt(stepFor(cap, cap), cap)).toBe(cap);
    expect(pickedAt(stepFor(9_000_000, cap), cap)).toBe(cap);
    expect(valueAt(stepFor(595_000, cap))).toBe(595_000);
    expect(valueAt(stepFor(20_000, cap))).toBe(20_000);
  });
});
