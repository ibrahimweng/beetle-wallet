/* The requests this account has sent: who was asked, for how much, what
   for, when it lapses and its reference, kept per account so the page for
   one holds across a restart. Every screen holding the list sees a request
   the moment it is added, the way the day sees a move. */
import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../services/storage';
import { clock } from '../../lib/clock';
import type { Payer } from './people';

export type Request = {
  id: string;
  who: Pick<Payer, 'name' | 'phone' | 'pronoun'>;
  amount: number;
  note?: string;
  /** when it lapses, as the page says it */
  expires: string;
  reference: string;
  /** HH:MM */
  time: string;
  day: 'today';
  read?: 'photo';
};

export const requestsKey = (account: string) => `beetle.requests.${account}.v1`;

/** REQ-40112-8873: the reference a request gets. */
export function requestReference(): string {
  const n = (digits: number) => String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, '0');
  return `REQ-${n(5)}-${n(4)}`;
}

/** A request put together now. */
export function requestFrom(who: Payer, amount: number, note: string | undefined, read: 'photo' | undefined, at = new Date()): Request {
  return {
    id: `r${at.getTime().toString(36)}`,
    who: { name: who.name, phone: who.phone, pronoun: who.pronoun },
    amount,
    note: note || undefined,
    expires: 'In 7 days',
    reference: requestReference(),
    time: clock(at),
    day: 'today',
    read,
  };
}

/** The frame's request, for the lab. */
export const DEMO_REQUEST: Request = {
  id: 'demo',
  who: { name: 'Musa Danjuma', phone: '08032214471', pronoun: 'he' },
  amount: 20_000,
  note: 'Rent balance',
  expires: 'In 7 days',
  reference: 'REQ-40112-8873',
  time: '09:41',
  day: 'today',
  read: 'photo',
};

const kept = new Map<string, Request[]>();
const listeners = new Set<(account: string) => void>();

export function forgetRequests(account: string) {
  kept.delete(account);
}

export function useRequests(account: string | undefined) {
  const [requests, setRequests] = useState<Request[]>(() => (account && kept.get(account)) || []);
  const [ready, setReady] = useState(() => !!account && kept.has(account));
  useEffect(() => {
    if (!account) return;
    let live = true;
    const listen = (a: string) => {
      if (a === account && live) setRequests(kept.get(a) ?? []);
    };
    listeners.add(listen);
    const have = kept.get(account);
    if (have) {
      setRequests(have);
      setReady(true);
    } else {
      storage.get<Request[]>(requestsKey(account)).then(list => {
        if (!live) return;
        if (!kept.has(account)) kept.set(account, list ?? []);
        setRequests(kept.get(account) ?? []);
        setReady(true);
      });
    }
    return () => {
      live = false;
      listeners.delete(listen);
    };
  }, [account]);

  const add = useCallback(
    (r: Request) => {
      if (!account) return;
      const next = [r, ...(kept.get(account) ?? [])];
      kept.set(account, next);
      void storage.set(requestsKey(account), next);
      listeners.forEach(l => l(account));
    },
    [account],
  );

  return { requests, ready, add };
}
