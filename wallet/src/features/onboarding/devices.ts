/* The accounts this phone knows (Round 30, the owner's word). A phone an
   account has been opened on, or logged in on with its face scanned, is
   known: logging in again there is Face ID alone. Anywhere else it is the
   code, then the password (or a passkey, or Google or Apple), and the face
   scanned the first time, so a stolen password and a stolen code are still
   not enough on a stranger's phone.

   Kept in the secure store, so another phone cannot copy its way into being
   known. The real thing binds a key made inside the phone's own secure chip
   to the account on the server; this keeps the shape of it. */
import { sealed } from '../../services';
import type { Account } from '../../services';

export type Known = {
  accountNumber: string;
  phone: string;
  firstName: string;
  /** a passkey for Beetle was saved on this phone for the account */
  passkey: boolean;
  /** when it was last used here */
  at: number;
};

const KEY = 'beetle.devices.v1';

export async function knownHere(): Promise<Known[]> {
  return (await sealed.get<Known[]>(KEY)) ?? [];
}

/** The account last used on this phone, for Log in's "Welcome back". */
export async function lastHere(): Promise<Known | null> {
  const list = await knownHere();
  return list.slice().sort((a, b) => b.at - a.at)[0] ?? null;
}

export async function isKnownHere(accountNumber: string): Promise<Known | null> {
  return (await knownHere()).find(k => k.accountNumber === accountNumber) ?? null;
}

/** This phone is known for the account from now on: opened here, or logged in here with the face scanned. */
export async function rememberHere(account: Pick<Account, 'accountNumber' | 'phone' | 'firstName'>, passkey?: boolean, now = Date.now()) {
  const list = await knownHere();
  const was = list.find(k => k.accountNumber === account.accountNumber);
  const next: Known = { accountNumber: account.accountNumber, phone: account.phone, firstName: account.firstName, passkey: passkey ?? was?.passkey ?? false, at: now };
  await sealed.set(KEY, [...list.filter(k => k.accountNumber !== account.accountNumber), next]);
  return next;
}

/** Forgotten on this phone: the next log in here is a stranger's again. */
export async function forgetHere(accountNumber: string) {
  await sealed.set(
    KEY,
    (await knownHere()).filter(k => k.accountNumber !== accountNumber),
  );
}
