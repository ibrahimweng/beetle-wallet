/* Getting in: a code by text, and an account at the end of the way in. The
   interface is what the screens use; the mock is what this build runs on. */
import { storage } from './storage';
import { randomToken, wait } from './support';
import type { IdentityRecord } from './identity';

export type CodeRequest = { sentTo: string; expiresInSeconds: number; resendAfterSeconds: number };
export type Verify = { ok: true; token: string } | { ok: false; reason: 'no-match' | 'expired' | 'too-many' };

export type Account = {
  accountNumber: string;
  phone: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  /** the account the design is drawn around, with its history */
  demo?: boolean;
};

export type Session = { token: string; account: Account };

export interface AuthService {
  requestCode(phone: string): Promise<CodeRequest>;
  verifyCode(phone: string, code: string): Promise<Verify>;
  /** Is there an account on this number? Sign in asks before sending a code. */
  knownPhone(phone: string): Promise<boolean>;
  createAccount(input: { phone: string; record: IdentityRecord; passcodeHash: string; salt: string; faceEnrolled: boolean }): Promise<Session>;
  /** The session for a phone that verified a code on sign in. */
  signIn(phone: string, token: string): Promise<Session | null>;
}

/** The owner's own number. Signing in with it opens the demo account, history
    and all. */
export const DEMO_PHONE = '09069113588';
export const DEMO_ACCOUNT: Account = {
  accountNumber: '0102445788',
  phone: DEMO_PHONE,
  firstName: 'Ibrahim',
  lastName: 'Musa',
  createdAt: '2026-03-02T09:00:00Z',
  demo: true,
};

/** The code this build accepts. A real service sends one by text. */
export const MOCK_CODE = '123456';
/** The passcodes this build lets through although the rules would refuse
    them, so that trying the app never means thinking one up: the code
    forwards, and backwards. A real build refuses both. */
export const DEMO_PASSCODES = ['123456', '654321'];
const ACCOUNTS_KEY = 'beetle.accounts.v1';

/* The mock keeps the accounts opened on this device, so signing out and back
   in works, and it answers the way the real one will: a code that does not
   match, one that has expired, and too many tries. */
export class MockAuthService implements AuthService {
  private tries = new Map<string, number>();
  constructor(private readonly delay = 600) {}

  async requestCode(phone: string): Promise<CodeRequest> {
    await wait(this.delay);
    this.tries.set(phone, 0);
    return { sentTo: phone, expiresInSeconds: 300, resendAfterSeconds: 30 };
  }

  async verifyCode(phone: string, code: string): Promise<Verify> {
    await wait(this.delay);
    const n = (this.tries.get(phone) ?? 0) + 1;
    this.tries.set(phone, n);
    if (n > 3) return { ok: false, reason: 'too-many' };
    if (code === '000000') return { ok: false, reason: 'expired' };
    if (code !== MOCK_CODE) return { ok: false, reason: 'no-match' };
    this.tries.set(phone, 0);
    return { ok: true, token: await randomToken() };
  }

  async knownPhone(phone: string): Promise<boolean> {
    if (phone === DEMO_PHONE) return true;
    const list = (await storage.get<Account[]>(ACCOUNTS_KEY)) ?? [];
    return list.some(a => a.phone === phone);
  }

  async createAccount(input: { phone: string; record: IdentityRecord; passcodeHash: string; salt: string; faceEnrolled: boolean }): Promise<Session> {
    await wait(this.delay);
    const list = (await storage.get<Account[]>(ACCOUNTS_KEY)) ?? [];
    const existing = list.find(a => a.phone === input.phone);
    const account: Account = existing ?? {
      accountNumber: accountNumberFor(input.phone),
      phone: input.phone,
      firstName: input.record.firstName,
      lastName: input.record.lastName,
      createdAt: new Date().toISOString(),
    };
    if (!existing) await storage.set(ACCOUNTS_KEY, [...list, account]);
    return { token: await randomToken(), account };
  }

  async signIn(phone: string, token: string): Promise<Session | null> {
    if (phone === DEMO_PHONE) return { token, account: DEMO_ACCOUNT };
    const list = (await storage.get<Account[]>(ACCOUNTS_KEY)) ?? [];
    const account = list.find(a => a.phone === phone);
    return account ? { token, account } : null;
  }
}

/** A ten-digit account number derived from the phone, so the same number
    always opens the same account in this build. */
export function accountNumberFor(phone: string): string {
  let h = 7;
  for (const c of phone) h = (h * 31 + c.charCodeAt(0)) % 1_000_000_007;
  return '01' + String(h).padStart(8, '0').slice(-8);
}
