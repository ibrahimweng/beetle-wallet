import { beforeEach, describe, expect, it, vi } from 'vitest';

/* The services are plain TypeScript, but they reach for AsyncStorage and
   expo-crypto, which do not exist in Node. They are replaced with what the
   tests need: a Map, and a hash that is enough to tell two inputs apart. */
const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => void store.set(k, v),
    removeItem: async (k: string) => void store.delete(k),
  },
}));
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 37) % 256),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (_a: string, s: string) => 'h' + s.length + s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_003, 7),
}));

import { MockAuthService, DEMO_PHONE, accountNumberFor } from '@/services/auth';
import { MockIdentityService } from '@/services/identity';
import { hashPasscode } from '@/services/crypto';

beforeEach(() => store.clear());

describe('the code by text', () => {
  const auth = new MockAuthService(0);
  it('accepts the build code and nothing else', async () => {
    await auth.requestCode('08032144471');
    expect(await auth.verifyCode('08032144471', '111111')).toEqual({ ok: false, reason: 'no-match' });
    expect(await auth.verifyCode('08032144471', '000000')).toEqual({ ok: false, reason: 'expired' });
    const r = await auth.verifyCode('08032144471', '123456');
    expect(r.ok).toBe(true);
  });
  it('stops after three wrong ones', async () => {
    await auth.requestCode('07012345678');
    for (let i = 0; i < 3; i++) await auth.verifyCode('07012345678', '999999');
    expect(await auth.verifyCode('07012345678', '123456')).toEqual({ ok: false, reason: 'too-many' });
    await auth.requestCode('07012345678');
    expect((await auth.verifyCode('07012345678', '123456')).ok).toBe(true);
  });
});

describe('the account', () => {
  const auth = new MockAuthService(0);
  const record = { firstName: 'Amaka', lastName: 'Nwosu', recordName: 'NWOSU AMAKA', born: '1995-04-07', birthYear: 1995 };
  it('is opened once and found again on sign in', async () => {
    expect(await auth.knownPhone('08112345678')).toBe(false);
    const s = await auth.createAccount({ phone: '08112345678', record, passcodeHash: 'h', salt: 's', faceEnrolled: false });
    expect(s.account.accountNumber).toBe(accountNumberFor('08112345678'));
    expect(s.account.accountNumber).toMatch(/^01\d{8}$/);
    expect(await auth.knownPhone('08112345678')).toBe(true);
    const again = await auth.createAccount({ phone: '08112345678', record, passcodeHash: 'h', salt: 's', faceEnrolled: false });
    expect(again.account.accountNumber).toBe(s.account.accountNumber);
    const back = await auth.signIn('08112345678', 't');
    expect(back?.account.firstName).toBe('Amaka');
  });
  it('knows the demo number', async () => {
    expect(await auth.knownPhone(DEMO_PHONE)).toBe(true);
    const s = await auth.signIn(DEMO_PHONE, 't');
    expect(s?.account.demo).toBe(true);
    expect(s?.account.accountNumber).toBe('0102445788');
  });
});

describe('the register', () => {
  const id = new MockIdentityService(0);
  it('gives the design its own name and turns away four zeros', async () => {
    const r = await id.lookup('12345678900');
    expect(r.found && r.record.firstName).toBe('Ibrahim');
    expect(r.found && r.record.recordName).toBe('MUSA IBRAHIM');
    expect(await id.lookup('12340000567')).toEqual({ found: false });
    expect(await id.lookup('123')).toEqual({ found: false });
  });
});

describe('the passcode hash', () => {
  it('depends on the salt and the code', async () => {
    const a = await hashPasscode('402917', 'salt-a');
    expect(a).toBe(await hashPasscode('402917', 'salt-a'));
    expect(a).not.toBe(await hashPasscode('402917', 'salt-b'));
    expect(a).not.toBe(await hashPasscode('402918', 'salt-a'));
  });
});
