/* The gate an account's payments go through: see gate. What counts against
   the day's cap is the day as Spending limits shows it, so the page and the
   gate never disagree: the demo account's day, as its frames draw it, has
   ₦84,000 out already, and the next ₦16,000 is where it stops and asks
   twice, as What happens at the line shows. */
import { useMemo } from 'react';
import type { Account } from '../../services';
import { holdingsFor } from '../home/account';
import { useMoves } from '../home/moves';
import { usePrefs } from './prefs';
import { pastCap, spentToday, stoppedBy } from './gate';

/** The gate for an account: why nothing can leave, and the cap a payment would cross. */
export function useSendGate(account: Account | undefined) {
  const { prefs } = usePrefs(account?.accountNumber);
  const { moves } = useMoves(account?.accountNumber);
  const spent = useMemo(() => spentToday([...moves, ...(account ? holdingsFor(account).ledger : [])]), [moves, account]);
  return {
    spent,
    stopped: () => stoppedBy(prefs),
    past: (amount: number) => pastCap(amount, spent),
  };
}
