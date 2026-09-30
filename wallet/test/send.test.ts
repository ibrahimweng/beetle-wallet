/* What the Send money page hands around, and what the state screens say. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { MockReader, SOFT_READING } from '@/services/reader';
import { feeFor, feeLabel } from '@/services/agent';
import { draft, shortName, softReading } from '@/features/send/hand';
import { bankOf, firstOf, returnReference, shifted, whenOf } from '@/features/transfers/states';
import { DEMO_LEDGER } from '@/features/home/account';

describe('what the pages hand back to Send money', () => {
  it('keeps what was put until it is taken, and merges what comes after', () => {
    draft.put({ amount: 20_000, amountNote: 'You typed it' });
    draft.put({ typing: true });
    expect(draft.take()).toEqual({ amount: 20_000, amountNote: 'You typed it', typing: true });
    expect(draft.take()).toBeNull();
  });
  it('carries a soft reading once', () => {
    softReading.put(SOFT_READING);
    expect(softReading.take()?.soft).toEqual({ number: '0234567890', maybe: '0234567896' });
    expect(softReading.take()).toBeNull();
  });
  it('shortens a name the way the frames do', () => {
    expect(shortName('Sarah Adeyemi')).toBe('Sarah A.');
    expect(shortName('Musa')).toBe('Musa');
  });
});

describe('the stand-in reader', () => {
  it('is sure of the sample slip, and unsure of the soft one', async () => {
    const r = new MockReader(0);
    expect((await r.read('slip.png')).soft).toBeUndefined();
    const soft = await r.read('soft-slip.png');
    expect(soft.numbers).toEqual(['0234567890']);
    expect(soft.soft?.maybe).toBe('0234567896');
  });
});

describe('the fee', () => {
  it('is free under ten thousand and the banks’ own above, as the receipts print it', () => {
    expect(feeLabel(feeFor(8_000))).toBe('Free');
    expect(feeLabel(feeFor(10_000))).toBe('₦26.88');
    expect(feeLabel(feeFor(50_000))).toBe('₦26.88');
    expect(feeLabel(feeFor(50_001))).toBe('₦53.75');
  });
});

describe('what a state screen says about a line', () => {
  const pending = DEMO_LEDGER.find(r => r.id === 'l01')!;
  const failed = DEMO_LEDGER.find(r => r.id === 'l02')!;
  it('knows the bank a line went through', () => {
    expect(bankOf(pending)).toBe('GTBank');
    expect(bankOf(failed)).toBe('Access Bank');
    expect(bankOf({ ...pending, name: 'Nobody', person: undefined })).toBe('their bank');
  });
  it('moves a time and stays inside the day', () => {
    expect(shifted('14:22', 120)).toBe('16:22');
    expect(shifted('14:22', -42)).toBe('13:40');
    expect(shifted('23:30', 60)).toBe('00:30');
  });
  it('gives a return the same reference every time, in the frames’ shape', () => {
    expect(returnReference('l03')).toMatch(/^REV-\d{5}-\d{4}$/);
    expect(returnReference('l03')).toBe(returnReference('l03'));
    expect(returnReference('l03')).not.toBe(returnReference('l01'));
  });
  it('says when, and whom', () => {
    expect(whenOf(pending)).toBe('Today, 14:22');
    expect(firstOf('Sarah Adeyemi')).toBe('Sarah');
  });
});
