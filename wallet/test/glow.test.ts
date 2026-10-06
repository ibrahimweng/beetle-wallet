/* The light at the card's edge (Round 21): how much a pull gathers, when
   the phone knocks, the glow as it closes, and what the shader is handed.
   The shader itself is drawn in glow-shader.test.mjs. */
import { GATHER, PULSE, closingGlow, gathered, knocks, lit, reachOf, uniformsOf } from '../src/features/home/glow';

describe('the light a pull gathers', () => {
  it('is none at rest and all of it where the card goes on by itself', () => {
    expect(gathered(0)).toBe(0);
    expect(gathered(GATHER)).toBe(1);
    expect(gathered(1)).toBe(1);
    expect(gathered(-0.2)).toBe(0);
  });
  it('grows the further it is pulled', () => {
    let last = -1;
    for (let p = 0; p <= GATHER; p += GATHER / 20) {
      expect(gathered(p)).toBeGreaterThanOrEqual(last);
      last = gathered(p);
    }
  });
  it('knocks a quarter of the way, then twice more, before the pulse', () => {
    expect(knocks(0)).toBe(0);
    expect(knocks(GATHER * 0.24)).toBe(0);
    expect(knocks(GATHER * 0.26)).toBe(1);
    expect(knocks(GATHER * 0.51)).toBe(2);
    expect(knocks(GATHER * 0.76)).toBe(3);
    expect(knocks(1)).toBe(3);
  });
});

describe('the glow as the card closes', () => {
  it('is none while open and none once shut, and rises between', () => {
    expect(closingGlow(1)).toBe(0);
    expect(closingGlow(0)).toBe(0);
    expect(closingGlow(0.5)).toBe(1);
    expect(closingGlow(0.9)).toBeLessThan(0.5);
  });
});

describe('what the shader is handed', () => {
  it('draws nothing at rest', () => {
    expect(lit(uniformsOf({ width: 393, height: 852, edge: 392, a: 0, at: 0, t: -1, g: 0 }))).toBe(false);
    expect(lit(uniformsOf({ width: 393, height: 852, edge: 768, a: 0, at: 524, t: PULSE + 0.01, g: 0 }))).toBe(false);
  });
  it('draws while it gathers, pulses or glows', () => {
    expect(lit(uniformsOf({ width: 393, height: 852, edge: 450, a: 0.4, at: 0, t: -1, g: 0 }))).toBe(true);
    expect(lit(uniformsOf({ width: 393, height: 852, edge: 700, a: 1, at: 524, t: 0.2, g: 0 }))).toBe(true);
    expect(lit(uniformsOf({ width: 393, height: 852, edge: 600, a: 0, at: 0, t: -1, g: 0.6 }))).toBe(true);
  });
  it('runs its ring past the farthest corner of the card', () => {
    const at = 524;
    expect(reachOf(393, 852, at)).toBeGreaterThan(Math.hypot(393 / 2, at));
  });
});
