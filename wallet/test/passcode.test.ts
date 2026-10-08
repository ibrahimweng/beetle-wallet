import { describe, expect, it, vi } from 'vitest';

/* the gate reaches the services for the build's keys, and they reach for the device */
vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
}));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).map((_, i) => (i * 37 + 11) % 256),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (_: string, s: string) => `one-round:${s}`,
}));
vi.mock('expo-updates', () => ({ channel: 'production' }));

import { LOCKS_MS, LOCK_MS, checkCode, demoHint, demoPasscodeOpens, lockedFor, refusal, resetGate, waitWords } from '@/features/passcode/check';
import { PASSCODE_ROUNDS, keepPasscode, keptWeakly, matchesPasscode } from '@/services/crypto';

const own = async (code: string) => code === '482915';

describe('the gate before money moves', () => {
  it("lets the device's own passcode through, and nothing else", async () => {
    resetGate();
    expect(await checkCode('482915', own)).toEqual({ ok: true });
    expect(await checkCode('654321', own)).toEqual({ ok: false, triesLeft: 2 });
  });
  it("lets the build's six digits and its passwords open only the lab and the demo account", () => {
    /* the six digits, for the lock and the sheet before money moves (Round 32: they are back) */
    expect(demoPasscodeOpens('654321', { demo: true }, false)).toBe(true);
    expect(demoPasscodeOpens('123456', undefined, true)).toBe(true);
    expect(demoPasscodeOpens('654321', { demo: false }, false)).toBe(false);
    expect(demoPasscodeOpens('654321', undefined, false)).toBe(false);
    expect(demoPasscodeOpens('111111', { demo: true }, true)).toBe(false);
    /* the password, for logging in on a new phone */
    expect(demoPasscodeOpens('beetle321', { demo: true }, false)).toBe(true);
    expect(demoPasscodeOpens('beetle123', undefined, true)).toBe(true);
    expect(demoPasscodeOpens('beetle321', { demo: false }, false)).toBe(false);
    expect(demoPasscodeOpens('beetle321', undefined, false)).toBe(false);
    expect(demoPasscodeOpens('ladybird1', { demo: true }, true)).toBe(false);
  });
  it("says the build's keys only where they open it", () => {
    expect(demoHint({ demo: true }, 'passcode', false)).toBe('This build takes 654321 as well.');
    expect(demoHint(undefined, 'password', true)).toBe('This build takes beetle321 as well.');
    expect(demoHint({ demo: true }, undefined, false)).toContain('654321');
    expect(demoHint({ demo: false }, 'passcode', false)).toBeUndefined();
  });
  it('shuts for longer each time it shuts again, until a right one lands', async () => {
    resetGate();
    let t = 5_000_000;
    const three = async () => {
      await checkCode('000000', own, t);
      await checkCode('000001', own, t);
      return checkCode('000002', own, t);
    };
    expect(await three()).toEqual({ ok: false, lockedFor: LOCKS_MS[0] / 1000 });
    t += LOCKS_MS[0];
    expect(await three()).toEqual({ ok: false, lockedFor: LOCKS_MS[1] / 1000 });
    t += LOCKS_MS[1];
    expect(await three()).toEqual({ ok: false, lockedFor: LOCKS_MS[2] / 1000 });
    t += LOCKS_MS[2];
    expect(await checkCode('482915', own, t)).toEqual({ ok: true });
    expect(await three()).toEqual({ ok: false, lockedFor: LOCKS_MS[0] / 1000 });
    resetGate();
  });
  it('counts wrong tries and shuts after three', async () => {
    resetGate();
    const t = 1_000_000;
    expect(await checkCode('000000', own, t)).toEqual({ ok: false, triesLeft: 2 });
    expect(await checkCode('000001', own, t)).toEqual({ ok: false, triesLeft: 1 });
    expect(await checkCode('000002', own, t)).toEqual({ ok: false, lockedFor: 30 });
    expect(lockedFor(t + 1000)).toBe(29);
    /* shut means shut, even to the right code, until the time is up */
    expect(await checkCode('482915', own, t + 5000)).toEqual({ ok: false, lockedFor: 25 });
    expect(await checkCode('482915', own, t + LOCK_MS)).toEqual({ ok: true });
    expect(lockedFor(t + LOCK_MS)).toBe(0);
  });
  it('forgets the wrong ones once a right one lands', async () => {
    resetGate();
    expect(await checkCode('000000', own)).toEqual({ ok: false, triesLeft: 2 });
    expect(await checkCode('482915', own)).toEqual({ ok: true });
    expect(await checkCode('000000', own)).toEqual({ ok: false, triesLeft: 2 });
  });
  it('says what happened in words', () => {
    expect(refusal({ ok: false, triesLeft: 2 })).toBe('Not it. 2 more tries.');
    expect(refusal({ ok: false, triesLeft: 1 })).toBe('Not it. One more try.');
    expect(refusal({ ok: false, lockedFor: 30 })).toBe('That was three tries. Give it 30 seconds and try again.');
    expect(refusal({ ok: false, lockedFor: 300 })).toBe('That was three tries. Give it 5 minutes and try again.');
    expect(waitWords(7200)).toBe('2 hours');
  });
});

describe('the passcode as the phone keeps it', () => {
  it('is stretched, never kept as typed, and matches only itself', async () => {
    const kept = await keepPasscode('482915');
    expect(kept.v).toBe(2);
    expect(kept.rounds).toBe(PASSCODE_ROUNDS);
    expect(kept.hash).not.toContain('482915');
    expect(kept.hash).toHaveLength(64);
    expect(await matchesPasscode('482915', kept)).toBe(true);
    expect(await matchesPasscode('482916', kept)).toBe(false);
    expect(keptWeakly(kept)).toBe(false);
  });
  it('still checks one kept the first way, and says it is kept weakly', async () => {
    const old = { salt: 'abc', hash: 'one-round:abc:482915' };
    expect(await matchesPasscode('482915', old)).toBe(true);
    expect(await matchesPasscode('000000', old)).toBe(false);
    expect(keptWeakly(old)).toBe(true);
  });
});
