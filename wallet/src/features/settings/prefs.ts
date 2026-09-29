/* What the settings pages set, kept on this phone for the account: what it
   takes to open the app and what shows once it is open, which standing
   instructions run, whether the card is frozen, and whether the other
   devices were signed out. Read back before the pages draw, so a switch
   never shows one thing and then flips to another. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { storage } from '../../services';

export type Prefs = {
  faceId: boolean;
  hideBalance: boolean;
  hideShots: boolean;
  amountsInNotes: boolean;
  /** Money is tight this month: savings wait */
  tight: boolean;
  rules: { payday: boolean; ikeja: boolean; data: boolean };
  /** how long the app stays open before it asks again */
  askAfter: string;
  cardFrozen: boolean;
  othersSignedOut: boolean;
  /** the money frozen from Not your phone, until a new passcode is set */
  frozen: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  faceId: true,
  hideBalance: true,
  hideShots: true,
  amountsInNotes: false,
  tight: false,
  rules: { payday: true, ikeja: true, data: true },
  askAfter: '2 minutes',
  cardFrozen: false,
  othersSignedOut: false,
  frozen: false,
};

export const prefsKey = (account: string) => `beetle.prefs.${account}.v1`;

/** The waits Ask again after cycles through. */
export const ASK_AGAIN = ['2 minutes', '5 minutes', '15 minutes', 'Straight away'];

/** How many standing instructions are running. */
export const rulesRunning = (p: Prefs) => Object.values(p.rules).filter(Boolean).length;

export function usePrefs(account: string | undefined) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const ref = useRef(prefs);
  ref.current = prefs;
  /* read on the way in, and again each time the screen comes back into
     view, since a page under this one may have changed something */
  const load = useCallback(() => {
    if (!account) return;
    let live = true;
    void storage.get<Partial<Prefs>>(prefsKey(account)).then(kept => {
      if (!live) return;
      setPrefs({ ...DEFAULT_PREFS, ...(kept ?? {}), rules: { ...DEFAULT_PREFS.rules, ...(kept?.rules ?? {}) } });
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [account]);
  useEffect(load, [load]);
  useFocusEffect(load);
  const set = useCallback(
    (change: Partial<Prefs>) => {
      const next = { ...ref.current, ...change };
      ref.current = next;
      setPrefs(next);
      if (account) void storage.set(prefsKey(account), next);
    },
    [account],
  );
  return { prefs, ready, set };
}
