/* What moved on this phone since the day the frames draw: every line a
   panel, the Send money page or an arrival added to the day, kept per
   account, so the balance and the receipts hold across a restart. Every
   screen that holds the list sees a line the moment any of them adds it:
   home's day picks up what the Send money page moved. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage, type Move } from '../../services';
import { dayName, sessionWhen } from '../../lib/days';
import type { LedgerRow } from './account';
import { fromEveryday } from './everyday';

export { fromEveryday };

export const movesKey = (account: string) => `beetle.moves.${account}.v1`;

/** A session id the way the frames print one: a running number, the date,
    the time, and two groups of the bank's own. */
export function sessionId(at = new Date(), seq = 16): string {
  const two = (n: number) => String(n).padStart(2, '0');
  const group = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  return `${String(seq).padStart(6, '0')} ${String(at.getFullYear()).slice(2)}${two(at.getMonth() + 1)}${two(at.getDate())} ${two(at.getHours())}${two(at.getMinutes())}${two(at.getSeconds())} ${group()} ${group()}`;
}

/** What the rows moved in naira, fees and all. */
export const balanceOf = (rows: { amount: number; usd?: number; kind: string; fee?: number }[]) => rows.reduce((a, r) => a + fromEveryday(r), 0);

/** The line the day gets for a move, with what its receipt will need. */
export function rowFrom(m: Move, balanceBefore: number, seq: number, at = new Date()): LedgerRow {
  return {
    id: `m${at.getTime().toString(36)}`,
    day: 'today',
    time: m.detail.slice(-5),
    icon: m.icon,
    name: m.name,
    detail: m.detail,
    amount: m.amount,
    status: 'done',
    kind: m.kind,
    fee: m.fee,
    reference: m.reference,
    person: m.person ? { bank: m.person.bank, number: m.person.number } : undefined,
    target: m.target,
    read: m.read,
    usd: m.usd,
    goal: m.goal,
    covers: m.covers,
    coin: m.coin,
    session: sessionId(at, seq),
    after: Math.round((balanceBefore + fromEveryday(m)) * 100) / 100,
    at: at.getTime(),
  };
}

/** A line as it stands today: one moved on this phone is today's, yesterday's or earlier, by when it moved (or the
    date in its session id, for one kept before lines kept their moment); a line the frames draw keeps its day. */
export function aged(row: LedgerRow, now = new Date()): LedgerRow {
  const when = row.at ?? sessionWhen(row.session);
  if (when === undefined) return row;
  const day = dayName(when, now);
  return day === row.day && row.at === when ? row : { ...row, day, at: when };
}

/* one list per account, shared by every screen holding it */
const kept = new Map<string, LedgerRow[]>();
const listeners = new Set<(account: string) => void>();

/** The list as this phone last had it, forgotten: the lab starts a place afresh. */
export function forgetMoves(account: string) {
  kept.delete(account);
}

export function useMoves(account: string | undefined) {
  const [moves, setMoves] = useState<LedgerRow[]>(() => (account && kept.get(account)) || []);
  const [ready, setReady] = useState(() => !!account && kept.has(account));
  useEffect(() => {
    if (!account) return;
    let live = true;
    const listen = (a: string) => {
      if (a === account && live) setMoves(kept.get(a) ?? []);
    };
    listeners.add(listen);
    const have = kept.get(account);
    if (have) {
      setMoves(have);
      setReady(true);
    } else {
      storage.get<LedgerRow[]>(movesKey(account)).then(list => {
        if (!live) return;
        if (!kept.has(account)) kept.set(account, list ?? []);
        setMoves(kept.get(account) ?? []);
        setReady(true);
      });
    }
    return () => {
      live = false;
      listeners.delete(listen);
    };
  }, [account]);

  const add = useCallback(
    (row: LedgerRow) => {
      if (!account) return;
      const next = [row, ...(kept.get(account) ?? [])];
      kept.set(account, next);
      void storage.set(movesKey(account), next);
      listeners.forEach(l => l(account));
    },
    [account],
  );

  /* each line on the day it is now, not the day it was added on */
  const shown = useMemo(() => moves.map(r => aged(r)), [moves]);
  return { moves: shown, ready, add };
}
