/* The line a state screen is about, by its id, with the day around it. */
import { useMemo } from 'react';
import { useApp } from '../onboarding/store';
import { useSessionGuard } from '../onboarding/useGuard';
import { holdingsFor, type LedgerRow } from '../home/account';
import { useMoves } from '../home/moves';

export function useLine(id: string) {
  const app = useApp();
  const ok = useSessionGuard();
  const account = app.session?.account;
  const { moves, ready, add } = useMoves(account?.accountNumber);
  const h = useMemo(() => (account ? holdingsFor(account) : null), [account]);
  const rows: LedgerRow[] = useMemo(() => [...moves, ...(h?.ledger ?? [])], [moves, h]);
  const balance = (h?.everyday ?? 0) + moves.reduce((a, r) => a + r.amount, 0);
  const row = rows.find(r => r.id === id) ?? null;
  return { ok: ok && !!account, account, ready, row, rows, balance, moves, add };
}
