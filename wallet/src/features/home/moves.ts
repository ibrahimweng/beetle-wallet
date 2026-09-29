/* What moved on this phone since the day the frames draw: every line a
   panel or an arrival added to the day, kept per account, so the balance
   and the receipts hold across a restart. */
import { useCallback, useEffect, useState } from 'react';
import { storage, type Move } from '../../services';
import type { LedgerRow } from './account';

export const movesKey = (account: string) => `beetle.moves.${account}.v1`;

/** A session id the way the frames print one: a running number, the date,
    the time, and two groups of the bank's own. */
export function sessionId(at = new Date(), seq = 16): string {
  const two = (n: number) => String(n).padStart(2, '0');
  const group = () => String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  return `${String(seq).padStart(6, '0')} ${String(at.getFullYear()).slice(2)}${two(at.getMonth() + 1)}${two(at.getDate())} ${two(at.getHours())}${two(at.getMinutes())}${two(at.getSeconds())} ${group()} ${group()}`;
}

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
    session: sessionId(at, seq),
    after: Math.round((balanceBefore + m.amount) * 100) / 100,
  };
}

export function useMoves(account: string | undefined) {
  const [moves, setMoves] = useState<LedgerRow[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!account) return;
    let live = true;
    storage.get<LedgerRow[]>(movesKey(account)).then(kept => {
      if (!live) return;
      setMoves(kept ?? []);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [account]);

  const add = useCallback(
    (row: LedgerRow) => {
      setMoves(list => {
        const next = [row, ...list];
        if (account) void storage.set(movesKey(account), next);
        return next;
      });
    },
    [account],
  );

  return { moves, ready, add };
}
