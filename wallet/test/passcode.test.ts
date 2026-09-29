import { describe, expect, it, vi } from 'vitest';

/* the gate reaches the services for the build's keys, and they reach for the device */
vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
}));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => new Uint8Array(n),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async () => 'h',
}));

import { LOCK_MS, checkCode, lockedFor, refusal, resetGate } from '@/features/passcode/check';

const own = async (code: string) => code === '482915';

describe('the gate before money moves', () => {
  it("lets the device's own passcode through, and the build's keys", async () => {
    resetGate();
    expect(await checkCode('482915', own)).toEqual({ ok: true });
    expect(await checkCode('654321', own)).toEqual({ ok: true });
    expect(await checkCode('123456', own)).toEqual({ ok: true });
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
  });
});
