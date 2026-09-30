import { describe, expect, it, vi } from 'vitest';

/* the services reach for the device through the index; none of that is under test */
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));

import { MlKitReader, MockReader, accountNumbersIn } from '@/services/reader';

describe('reading a photo', () => {
  it('picks the ten-digit numbers out of the words, however they are grouped', () => {
    expect(accountNumbersIn('Account number\n0123456789\nBank')).toEqual(['0123456789']);
    expect(accountNumbersIn('0123 4567 89 and 0123-456-789')).toEqual(['0123456789']);
    expect(accountNumbersIn('call 0803 214 4471, ref 20260929123456')).toEqual([]);
    expect(accountNumbersIn('two: 0123456789, 2034567890')).toEqual(['0123456789', '2034567890']);
  });
  it('stands in where the device has no reader', async () => {
    const r = new MlKitReader();
    expect(r.real).toBe(false);
    const read = await new MockReader(0).read();
    expect(read.real).toBe(false);
    expect(read.numbers).toEqual(['0234567890']);
  });
});
