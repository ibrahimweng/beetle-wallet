/* What the app knows about the person: the session, once there is an
   account, and how far along the way in they are before that. Both are read
   back from the device before the first screen draws, so nothing ever renders
   against nothing and then jumps. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, sealed, secure, type Session } from '../../services';
import { keepPasscode, keptWeakly, matchesPasscode, type KeptPasscode } from '../../services/crypto';
import { demoPasscodeOpens } from '../passcode/check';
import type { Account } from '../../services';
import type { DocumentKind, IdentityRecord } from '../../services/identity';
import { EMPTY, type IdKind, type Progress } from './machine';
import { rememberHere } from './devices';

const PROGRESS_KEY = 'beetle.progress.v1';
const SESSION_KEY = 'beetle.session.v1';
/* Each account's passcode is its own (the analysis after Round 21: one
   passcode for the whole phone let any account signed in on it through
   with another's). One kept the old way, for the whole phone, is checked
   for the account signed in and moves to it the first time it is right. */
const LEGACY_PASSCODE_KEY = 'beetle.passcode.v1';
/* Since Round 32 the six digits (what opens the app and sends money) and the password (what logs in on a new phone)
   are two things, kept apart. Round 30 kept the password where the passcode had been (.v2), so the passcode moved on
   to .v3: a .v2 left over is tried as either, and moves to the right place the first time it is right. */
const passcodeKey = (account: string) => `beetle.passcode.${account}.v3`;
const OLD_KEY = (account: string) => `beetle.passcode.${account}.v2`;
const passwordKey = (account: string) => `beetle.password.${account}.v1`;

const readKept = async (key: string) => {
  const raw = await secure.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KeptPasscode;
  } catch {
    return null;
  }
};

async function keptFor(account: string | undefined): Promise<{ kept: KeptPasscode; legacy: boolean } | null> {
  const own = account ? await readKept(passcodeKey(account)) : null;
  if (own) return { kept: own, legacy: false };
  const old = account ? await readKept(OLD_KEY(account)) : null;
  if (old) return { kept: old, legacy: true };
  const legacy = await readKept(LEGACY_PASSCODE_KEY);
  return legacy ? { kept: legacy, legacy: true } : null;
}

type Actions = {
  /** The way in begins again from the top, with a mobile number or an email. */
  begin(via: 'phone' | 'email', contact: string): Promise<void>;
  /** Google or Apple handed over an email they have already checked: no code for it. */
  beginWith(provider: 'google' | 'apple', email: string, name?: string): Promise<void>;
  /** The mobile number, after the way in began with an email: a BVN is tied to one. */
  addPhone(phone: string): Promise<void>;
  markVerified(kind: 'phone' | 'email'): Promise<void>;
  /** The full name and date of birth, as typed (or as Google, Apple or a paper gave them). */
  setDetails(name: string, dob: string): Promise<void>;
  setIdKind(kind: IdKind): Promise<void>;
  /** The BVN or NIN the details matched, and the record behind it. */
  setIdentity(number: string, record: IdentityRecord, from?: IdKind | DocumentKind): Promise<void>;
  /** Stretch and keep the password; it is never kept as typed. */
  setPassword(password: string): Promise<void>;
  /** Stretch and keep the six digits chosen on the way in. */
  choosePasscode(code: string): Promise<void>;
  /** Open the account with the username, the face scanned and the passcode (and the password) kept, start the session, and know this phone. */
  finish(o: { username: string; passkey: boolean }): Promise<Session>;
  /** Does this password open the account? On Log in, before anybody is signed in. */
  passwordOpens(account: Account, password: string): Promise<boolean>;
  /** A new password for an account, after it has been got back, or changed in Settings. */
  resetPassword(account: Account, password: string): Promise<void>;
  /** Is there a passcode on this phone for the account? Logging in on a phone without one sets it. */
  hasPasscodeFor(account: Account): Promise<boolean>;
  /** The six digits for an account, before it is signed in: logging in on a phone without them. */
  setPasscodeFor(account: Account, code: string): Promise<void>;
  /** Do these six digits open the account on this phone? Logging in on a phone that knows it, when the face cannot. */
  passcodeOpensFor(account: Account, code: string): Promise<boolean>;
  startOver(): Promise<void>;
  signIn(session: Session): Promise<void>;
  signOut(): Promise<void>;
  /** Does what was typed match the passcode kept on this device for the account signed in? */
  checkPasscode(code: string): Promise<boolean>;
  /** A new passcode in place of the old one, for the account signed in. */
  setPasscode(code: string): Promise<void>;
  /** Is there a passcode kept on this device for the account signed in? */
  hasPasscode(): Promise<boolean>;
  /** Put the app in a state: how far the way in has got, and who is signed
      in. The lab uses it to open a place with the way there already walked. */
  seed(progress: Progress, session: Session | null): Promise<void>;
};

type App = { ready: boolean; session: Session | null; progress: Progress } & Actions;

const Ctx = createContext<App | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgressState] = useState<Progress>(EMPTY);
  const progressRef = useRef(progress);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([sealed.get<Progress>(PROGRESS_KEY), secure.get(SESSION_KEY)]);
      if (p) {
        progressRef.current = p;
        setProgressState(p);
      }
      if (s) {
        try {
          const kept = JSON.parse(s) as Session;
          sessionRef.current = kept;
          setSession(kept);
        } catch {
          await secure.remove(SESSION_KEY);
        }
      }
      setReady(true);
    })();
  }, []);

  const patch = useCallback(async (change: Partial<Progress>) => {
    const next = { ...progressRef.current, ...change };
    progressRef.current = next;
    setProgressState(next);
    await sealed.set(PROGRESS_KEY, next);
  }, []);

  const replaceProgress = useCallback(async (next: Progress) => {
    progressRef.current = next;
    setProgressState(next);
    if (Object.keys(next).length) await sealed.set(PROGRESS_KEY, next);
    else await sealed.remove(PROGRESS_KEY);
  }, []);

  const keepSession = useCallback(async (s: Session | null) => {
    sessionRef.current = s;
    setSession(s);
    if (s) await secure.set(SESSION_KEY, JSON.stringify(s));
    else await secure.remove(SESSION_KEY);
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      /* a new number or email starts the way in again from the top */
      begin: (via, contact) => replaceProgress(via === 'phone' ? { via, phone: contact } : { via, email: contact }),
      beginWith: (provider, email, name) => replaceProgress({ via: provider, email, emailVerified: true, ...(name ? { name } : {}) }),
      addPhone: phone => patch({ phone, phoneVerified: false }),
      markVerified: kind => patch(kind === 'phone' ? { phoneVerified: true } : { emailVerified: true }),
      setDetails: (name, dob) => patch({ name: name.trim().replace(/\s+/g, ' '), dob }),
      setIdKind: kind => patch({ idKind: kind }),
      /* the email a NIN slip or a voter's card carries stays on its record: an email nobody has proved is theirs is never
         put on an account, and never logs anybody in (Round 32: the walk found a card's email opening another account) */
      setIdentity: (number, record, from = 'bvn') => patch({ identity: { number, record, from } }),
      setPassword: async password => patch({ password: await keepPasscode(password) }),
      choosePasscode: async code => patch({ passcode: await keepPasscode(code) }),
      async finish({ username, passkey }) {
        const p = progressRef.current;
        const code = p.passcode;
        if (!p.phone || !p.identity || !code || !('rounds' in code)) throw new Error('The way in is not complete.');
        const provider = p.via === 'google' || p.via === 'apple' ? p.via : undefined;
        const s = await auth.createAccount({
          phone: p.phone,
          /* only an email that had its code, or that Google or Apple vouched for */
          email: p.emailVerified ? p.email : undefined,
          username,
          idNumber: p.identity.number,
          record: p.identity.record,
          passcodeHash: code.hash,
          salt: code.salt,
          faceEnrolled: true,
          signInWith: provider ?? 'password',
        });
        await secure.set(passcodeKey(s.account.accountNumber), JSON.stringify(code));
        if (p.password) await secure.set(passwordKey(s.account.accountNumber), JSON.stringify(p.password));
        await rememberHere(s.account, passkey);
        /* the secrets are with the account now; the way in keeps only that it is done */
        await patch({ accountNumber: s.account.accountNumber, password: undefined, passcode: undefined });
        await keepSession(s);
        return s;
      },
      async passwordOpens(account, password) {
        if (demoPasscodeOpens(password, account)) return true;
        const own = await readKept(passwordKey(account.accountNumber));
        if (own) return matchesPasscode(password, own);
        /* Round 30 kept the password where the passcode is now: right there, it moves to its own place */
        const old = await readKept(OLD_KEY(account.accountNumber));
        if (!old || !(await matchesPasscode(password, old))) return false;
        await secure.set(passwordKey(account.accountNumber), JSON.stringify(await keepPasscode(password)));
        await secure.remove(OLD_KEY(account.accountNumber));
        return true;
      },
      async resetPassword(account, password) {
        await secure.set(passwordKey(account.accountNumber), JSON.stringify(await keepPasscode(password)));
      },
      async hasPasscodeFor(account) {
        return !!account.demo || !!(await readKept(passcodeKey(account.accountNumber)));
      },
      async setPasscodeFor(account, code) {
        await secure.set(passcodeKey(account.accountNumber), JSON.stringify(await keepPasscode(code)));
      },
      async passcodeOpensFor(account, code) {
        if (demoPasscodeOpens(code, account)) return true;
        const own = await readKept(passcodeKey(account.accountNumber));
        return !!own && (await matchesPasscode(code, own));
      },
      startOver: () => replaceProgress(EMPTY),
      async signIn(s) {
        await keepSession(s);
        await replaceProgress(EMPTY);
      },
      /* the account stays where it is; this device just forgets the way in */
      async signOut() {
        await keepSession(null);
        await replaceProgress(EMPTY);
      },
      async checkPasscode(code) {
        const account = sessionRef.current?.account;
        if (demoPasscodeOpens(code, account)) return true;
        const found = await keptFor(account?.accountNumber);
        if (!found) return false;
        const right = await matchesPasscode(code, found.kept);
        /* right, and kept the old way or for the whole phone: kept again the new way, for this account alone */
        if (right && account && (found.legacy || keptWeakly(found.kept))) {
          await secure.set(passcodeKey(account.accountNumber), JSON.stringify(await keepPasscode(code)));
          if (found.legacy) {
            await secure.remove(LEGACY_PASSCODE_KEY);
            await secure.remove(OLD_KEY(account.accountNumber));
          }
        }
        return right;
      },
      async setPasscode(code) {
        const account = sessionRef.current?.account;
        if (!account) throw new Error('Nobody is signed in.');
        await secure.set(passcodeKey(account.accountNumber), JSON.stringify(await keepPasscode(code)));
      },
      async hasPasscode() {
        return !!(await keptFor(sessionRef.current?.account.accountNumber));
      },
      async seed(p, s) {
        await replaceProgress(p);
        await keepSession(s);
      },
    }),
    [patch, replaceProgress, keepSession],
  );

  const value = useMemo<App>(() => ({ ready, session, progress, ...actions }), [ready, session, progress, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): App {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp needs an AppProvider above it.');
  return v;
}
