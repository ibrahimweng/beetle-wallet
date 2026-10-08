/* The setting-up answers, kept on this phone for the account in the secure
   store (an address and an ID number are worth more than the rest), and
   otherwise the way the disputes are: read back before a screen draws,
   shared by every screen that holds them. The demo account has finished, by
   its frames. */
import { useCallback, useEffect, useState } from 'react';
import { sealed } from '../../services';
import { DEMO_SETUP, EMPTY_SETUP, type Setup } from './setup';

export const setupKey = (account: string) => `beetle.setup.${account}.v1`;
const key = setupKey;
const kept = new Map<string, Setup>();
const listeners = new Set<(account: string) => void>();

/** Forgotten on this phone: the lab starts a place afresh. */
export function forgetSetup(account: string) {
  kept.delete(account);
}

/** Answers kept for an account outside any screen: a NIN slip or a voter's card gave them when the account was opened. */
export function putSetup(account: string, patch: Partial<Setup>) {
  const next = { ...(kept.get(account) ?? EMPTY_SETUP), ...patch };
  kept.set(account, next);
  void sealed.set(key(account), next);
  listeners.forEach(l => l(account));
}

export function useSetup(account: string | undefined, demo: boolean) {
  const [setup, setSetup] = useState<Setup>(() => (account && kept.get(account)) || (demo ? DEMO_SETUP : EMPTY_SETUP));
  const [ready, setReady] = useState(() => !!account && kept.has(account));
  useEffect(() => {
    if (!account) return;
    let live = true;
    const listen = (a: string) => {
      if (a === account) setSetup(kept.get(a) ?? EMPTY_SETUP);
    };
    listeners.add(listen);
    if (kept.has(account)) {
      setSetup(kept.get(account) ?? EMPTY_SETUP);
      setReady(true);
    } else {
      void sealed.get<Setup>(key(account)).then(s => {
        if (!live) return;
        if (!kept.has(account)) kept.set(account, s ?? (demo ? DEMO_SETUP : EMPTY_SETUP));
        setSetup(kept.get(account) ?? EMPTY_SETUP);
        setReady(true);
      });
    }
    return () => {
      live = false;
      listeners.delete(listen);
    };
  }, [account, demo]);
  /** An answer in: kept with the rest. */
  const set = useCallback(
    (patch: Partial<Setup>) => {
      if (!account) return;
      const next = { ...(kept.get(account) ?? (demo ? DEMO_SETUP : EMPTY_SETUP)), ...patch };
      kept.set(account, next);
      void sealed.set(key(account), next);
      listeners.forEach(l => l(account));
    },
    [account, demo],
  );
  return { setup, ready, set };
}
