/* The disputes this phone has open or closed for the account, kept the way
   the day's moves are: one list per account, shared by every screen holding
   it, read back before the pages draw. The demo account starts with the
   frame's own. */
import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../services';
import { DEMO_DISPUTE, type Dispute } from './dispute';
import { onForget } from '../../lib/forget';

const key = (account: string) => `beetle.disputes.${account}.v1`;
const kept = new Map<string, Dispute[]>();
onForget(account => kept.delete(account));
const listeners = new Set<(account: string) => void>();

/** The list as this phone last had it, forgotten: the lab starts a place afresh. */
export function forgetDisputes(account: string) {
  kept.delete(account);
}

export function useDisputes(account: string | undefined, demo: boolean) {
  const [disputes, setDisputes] = useState<Dispute[]>(() => (account && kept.get(account)) || []);
  const [ready, setReady] = useState(() => !!account && kept.has(account));
  useEffect(() => {
    if (!account) return;
    let live = true;
    const listen = (a: string) => {
      if (a === account) setDisputes(kept.get(a) ?? []);
    };
    listeners.add(listen);
    if (kept.has(account)) {
      setDisputes(kept.get(account) ?? []);
      setReady(true);
    } else {
      void storage.get<Dispute[]>(key(account)).then(list => {
        if (!live) return;
        if (!kept.has(account)) kept.set(account, list ?? (demo ? [DEMO_DISPUTE] : []));
        setDisputes(kept.get(account) ?? []);
        setReady(true);
      });
    }
    return () => {
      live = false;
      listeners.delete(listen);
    };
  }, [account, demo]);
  const put = useCallback(
    (list: Dispute[]) => {
      if (!account) return;
      kept.set(account, list);
      void storage.set(key(account), list);
      listeners.forEach(l => l(account));
    },
    [account],
  );
  /** A dispute opened, or one changed: it goes to the top. */
  const add = useCallback(
    (d: Dispute) => {
      const now = (account && kept.get(account)) || [];
      put([d, ...now.filter(x => x.id !== d.id)]);
    },
    [account, put],
  );
  return { disputes, ready, add };
}
