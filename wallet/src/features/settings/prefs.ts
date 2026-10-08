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
  rules: {
    payday: boolean;
    ikeja: boolean;
    data: boolean;
    /** a nudge to whoever was asked for money, if nothing comes */
    remind: boolean;
    /** ₦20,000 into dollars the day the salary lands */
    dollars: boolean;
    /** ₦5,000 held back on payday, for the score */
    budget: boolean;
    /** the same transfer again, offered by its receipt */
    again: boolean;
  };
  /** what the transfer offered by a receipt was: who, how much, and when it runs */
  again?: { rowId: string; title: string; when: string };
  /** lite mode while data is short: no pictures and no motion */
  lite: boolean;
  /** what feeds the goal besides the payday slice */
  feeds: { roundups: boolean; cashback: boolean };
  /** a goal has been started on an account the design does not seed one for */
  goal: boolean;
  /** how long the app stays open before it asks again */
  askAfter: string;
  cardFrozen: boolean;
  /** what has been loaded onto the virtual card from Everyday, on top of what its month allows */
  cardLoaded: number;
  othersSignedOut: boolean;
  /** the money frozen from Not your phone, until a new passcode is set */
  frozen: boolean;
  /** sending waits until then: twelve hours after a new passcode set from Not your phone */
  sendAfter?: number;
  /** the day after a recovery (Round 30): until then sending is capped at HOLD_CAP and nothing new is added, and the old
      email and the phone have been told, with This wasn't me on what they were sent */
  hold?: { until: number; why: 'email' | 'password' };
};

export const DEFAULT_PREFS: Prefs = {
  faceId: true,
  hideBalance: true,
  hideShots: true,
  amountsInNotes: false,
  tight: false,
  rules: { payday: true, ikeja: true, data: true, remind: false, dollars: false, budget: false, again: false },
  lite: false,
  feeds: { roundups: true, cashback: true },
  goal: false,
  askAfter: '2 minutes',
  cardFrozen: false,
  cardLoaded: 0,
  othersSignedOut: false,
  frozen: false,
};

export const prefsKey = (account: string) => `beetle.prefs.${account}.v1`;

/** The waits Ask again after cycles through. */
export const ASK_AGAIN = ['2 minutes', '5 minutes', '15 minutes', 'Straight away'];

/** How long a wait of Ask again after is: away from the app for this long, and it asks again. */
export const askAfterMs = (wait: string) => (wait === 'Straight away' ? 0 : (Number.parseInt(wait, 10) || 2) * 60_000);

/** The prefs as the phone keeps them, read once, outside any screen (the lock reads them so). */
export async function readPrefs(account: string): Promise<Prefs> {
  const kept = await storage.get<Partial<Prefs>>(prefsKey(account));
  return { ...DEFAULT_PREFS, ...(kept ?? {}), rules: { ...DEFAULT_PREFS.rules, ...(kept?.rules ?? {}) }, feeds: { ...DEFAULT_PREFS.feeds, ...(kept?.feeds ?? {}) } };
}

/** The day's hold after a recovery, put on the account's prefs before anybody is signed in on this phone with it. */
export async function holdAfterRecovery(account: string, why: 'email' | 'password', now = Date.now()) {
  const kept = (await storage.get<Partial<Prefs>>(prefsKey(account))) ?? {};
  await storage.set(prefsKey(account), { ...kept, hold: { until: now + 24 * 60 * 60 * 1000, why } });
}

/** How many standing instructions are running. */
export const rulesRunning = (p: Prefs) => Object.values(p.rules).filter(Boolean).length;

/** How much the goal's rules bring in a month, for the receipts' offers. */
export const feedsOn = (p: Prefs) => (p.rules.payday ? 1 : 0) + (p.feeds.roundups ? 1 : 0) + (p.feeds.cashback ? 1 : 0);

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
      setPrefs({ ...DEFAULT_PREFS, ...(kept ?? {}), rules: { ...DEFAULT_PREFS.rules, ...(kept?.rules ?? {}) }, feeds: { ...DEFAULT_PREFS.feeds, ...(kept?.feeds ?? {}) } });
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
