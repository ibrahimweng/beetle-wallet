/* What the app knows about the person: the session, once there is an
   account, and how far along the way in they are before that. Both are read
   back from the device before the first screen draws, so nothing ever renders
   against nothing and then jumps. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, secure, storage, type Session } from '../../services';
import { hashPasscode, randomSalt } from '../../services/crypto';
import type { IdentityRecord } from '../../services/identity';
import { EMPTY, type Progress } from './machine';

const PROGRESS_KEY = 'beetle.progress.v1';
const SESSION_KEY = 'beetle.session.v1';
const PASSCODE_KEY = 'beetle.passcode.v1';

type Actions = {
  setPhone(phone: string): Promise<void>;
  markVerified(): Promise<void>;
  setIdentity(number: string, record: IdentityRecord): Promise<void>;
  confirmIdentity(): Promise<void>;
  setFace(v: 'enrolled' | 'later'): Promise<void>;
  /** Hash and keep the passcode, open the account, start the session. */
  finish(passcode: string): Promise<Session>;
  startOver(): Promise<void>;
  signIn(session: Session): Promise<void>;
  signOut(): Promise<void>;
  /** Does what was typed match the passcode kept on this device? */
  checkPasscode(code: string): Promise<boolean>;
  /** A new passcode in place of the old one, hashed the same way. */
  setPasscode(code: string): Promise<void>;
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

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([storage.get<Progress>(PROGRESS_KEY), secure.get(SESSION_KEY)]);
      if (p) {
        progressRef.current = p;
        setProgressState(p);
      }
      if (s) {
        try {
          setSession(JSON.parse(s) as Session);
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
    await storage.set(PROGRESS_KEY, next);
  }, []);

  const replaceProgress = useCallback(async (next: Progress) => {
    progressRef.current = next;
    setProgressState(next);
    if (Object.keys(next).length) await storage.set(PROGRESS_KEY, next);
    else await storage.remove(PROGRESS_KEY);
  }, []);

  const keepSession = useCallback(async (s: Session | null) => {
    setSession(s);
    if (s) await secure.set(SESSION_KEY, JSON.stringify(s));
    else await secure.remove(SESSION_KEY);
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      /* a new number starts the way in again from the top */
      setPhone: phone => replaceProgress({ phone }),
      markVerified: () => patch({ phoneVerified: true }),
      setIdentity: (number, record) => patch({ identity: { number, record }, identityConfirmed: false }),
      confirmIdentity: () => patch({ identityConfirmed: true }),
      setFace: v => patch({ face: v }),
      async finish(passcode) {
        const p = progressRef.current;
        if (!p.phone || !p.identity) throw new Error('The way in is not complete.');
        const salt = await randomSalt();
        const hash = await hashPasscode(passcode, salt);
        await secure.set(PASSCODE_KEY, JSON.stringify({ hash, salt }));
        const s = await auth.createAccount({
          phone: p.phone,
          record: p.identity.record,
          passcodeHash: hash,
          salt,
          faceEnrolled: p.face === 'enrolled',
        });
        await patch({ passcodeSet: true, accountNumber: s.account.accountNumber });
        await keepSession(s);
        return s;
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
        const raw = await secure.get(PASSCODE_KEY);
        if (!raw) return false;
        const { hash, salt } = JSON.parse(raw) as { hash: string; salt: string };
        return (await hashPasscode(code, salt)) === hash;
      },
      async setPasscode(code) {
        const salt = await randomSalt();
        const hash = await hashPasscode(code, salt);
        await secure.set(PASSCODE_KEY, JSON.stringify({ hash, salt }));
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
