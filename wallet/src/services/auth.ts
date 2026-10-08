/* Getting in: a code by text or by email, and an account at the end of the
   way in. The interface is what the screens use; the mock is what this
   build runs on. Since Round 30 an account has an email and a username (its
   $tag) as well as its number, and is found by any of the three; the number
   on its identity record is kept against it so that only its owner can
   recover it (the real service keeps that on the server, never on the
   phone). */
import { storage } from './storage';
import { randomToken, wait } from './support';
import type { IdentityRecord } from './identity';
import { BEETLE_USERS } from './recipients';

export type CodeRequest = { sentTo: string; expiresInSeconds: number; resendAfterSeconds: number };
export type Verify = { ok: true; token: string } | { ok: false; reason: 'no-match' | 'expired' | 'too-many' };

export type Account = {
  accountNumber: string;
  phone: string;
  email?: string;
  /** the $tag people pay, without the $ */
  username?: string;
  /** the BVN or NIN the account was opened with: recovery asks for it again */
  idNumber?: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  /** the account the design is drawn around, with its history */
  demo?: boolean;
};

export type Session = { token: string; account: Account };

export type NewAccount = { phone: string; email?: string; username?: string; idNumber?: string; record: IdentityRecord; passcodeHash: string; salt: string; faceEnrolled: boolean };

export interface AuthService {
  /** A code to a mobile number or an email. */
  requestCode(to: string): Promise<CodeRequest>;
  verifyCode(to: string, code: string): Promise<Verify>;
  /** Is there an account on this number? Sign in asks before sending a code. */
  knownPhone(phone: string): Promise<boolean>;
  /** The account a mobile number, an email or a username belongs to, or nobody. */
  findAccount(contact: string): Promise<Account | null>;
  /** Is this username free to take? */
  usernameFree(username: string): Promise<boolean>;
  createAccount(input: NewAccount): Promise<Session>;
  /** The session for a contact that verified a code on sign in. */
  signIn(contact: string, token: string): Promise<Session | null>;
  /** A new email on the account, once the owner has proven it is theirs and the new one has had its code. */
  changeEmail(accountNumber: string, email: string): Promise<Account>;
}

/** The demo account's number, made up for it: signing in with it opens the
    demo account, history and all. (It was the owner's own number until the
    analysis after Round 21; a real number has no place in a public repository.) */
export const DEMO_PHONE = '08030000001';
export const DEMO_ACCOUNT: Account = {
  accountNumber: '0102445788',
  phone: DEMO_PHONE,
  email: 'ibrahim.musa@example.com',
  username: 'ibrahim',
  idNumber: '12345678900',
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
/** The passwords this build lets through on the demo account and in the lab since the six digits became a password
    (Round 30): letters and a number, eight long, the same word forwards and backwards. A real build refuses both. */
export const DEMO_PASSWORDS = ['beetle123', 'beetle321'];
const ACCOUNTS_KEY = 'beetle.accounts.v1';
/** what has changed on the demo account on this device: its email, after a recovery */
const DEMO_KEY = 'beetle.demo-account.v1';

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
    return !!(await this.findAccount(phone));
  }

  async findAccount(contact: string): Promise<Account | null> {
    const c = contact.trim().replace(/^\$/, '').toLowerCase();
    const matches = (a: Account) => a.phone === c || a.email?.toLowerCase() === c || a.username === c;
    const list = (await storage.get<Account[]>(ACCOUNTS_KEY)) ?? [];
    const own = list.find(matches);
    if (own) return own;
    /* the demo account, as this device last saw it (its email can be changed by a recovery) */
    const demo = { ...DEMO_ACCOUNT, ...((await storage.get<Partial<Account>>(DEMO_KEY)) ?? {}) };
    return matches(demo) ? demo : null;
  }

  async usernameFree(username: string): Promise<boolean> {
    await wait(this.delay / 2);
    const u = username.toLowerCase();
    if (BEETLE_USERS.some(x => x.tag === u)) return false;
    return !(await this.findAccount(u));
  }

  async createAccount(input: NewAccount): Promise<Session> {
    await wait(this.delay);
    const list = (await storage.get<Account[]>(ACCOUNTS_KEY)) ?? [];
    const existing = list.find(a => a.phone === input.phone);
    const account: Account = existing ?? {
      accountNumber: accountNumberFor(input.phone),
      phone: input.phone,
      email: input.email,
      username: input.username,
      idNumber: input.idNumber,
      firstName: input.record.firstName,
      lastName: input.record.lastName,
      createdAt: new Date().toISOString(),
    };
    if (!existing) await storage.set(ACCOUNTS_KEY, [...list, account]);
    return { token: await randomToken(), account };
  }

  async signIn(contact: string, token: string): Promise<Session | null> {
    const account = await this.findAccount(contact);
    return account ? { token, account } : null;
  }

  async changeEmail(accountNumber: string, email: string): Promise<Account> {
    await wait(this.delay);
    if (accountNumber === DEMO_ACCOUNT.accountNumber) {
      await storage.set(DEMO_KEY, { email });
      return { ...DEMO_ACCOUNT, email };
    }
    const list = (await storage.get<Account[]>(ACCOUNTS_KEY)) ?? [];
    const next = list.map(a => (a.accountNumber === accountNumber ? { ...a, email } : a));
    await storage.set(ACCOUNTS_KEY, next);
    const changed = next.find(a => a.accountNumber === accountNumber);
    if (!changed) throw new Error('No such account.');
    return changed;
  }
}

/** A ten-digit account number derived from the phone, so the same number
    always opens the same account in this build. */
export function accountNumberFor(phone: string): string {
  let h = 7;
  for (const c of phone) h = (h * 31 + c.charCodeAt(0)) % 1_000_000_007;
  return '01' + String(h).padStart(8, '0').slice(-8);
}
