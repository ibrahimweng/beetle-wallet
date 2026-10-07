/* What stands between money and leaving besides the passcode, kept where
   Settings says it is (the analysis after Round 21: all three were shown and
   none was kept):

   - the freeze from Not your phone: nothing leaves until a new passcode
     proves it is you;
   - the twelve hours after that new passcode, which the toast promises;
   - the caps on Spending limits: past the one-transfer cap or the day's,
     the passcode alone is not enough (no face, since a face can be held up
     to a phone) and the three words are typed in full, as What happens at
     the line shows.

   Money that stays yours (into a goal, onto your own card, into dollars)
   does not pass through it. */
import type { LedgerRow } from '../home/account';
import { naira } from '../../lib/format';

export const CAPS = { transfer: 50000, day: 100000, month: 900000 } as const;

/** How long sending waits after a new passcode set from Not your phone. */
export const COOL_MS = 12 * 60 * 60 * 1000;

/** What has left today: settled money out, not what went into your own goals. */
export const spentToday = (rows: Pick<LedgerRow, 'day' | 'status' | 'amount' | 'kind'>[]) =>
  rows.filter(r => r.day === 'today' && r.status === 'done' && r.amount < 0 && r.kind !== 'saving').reduce((a, r) => a - r.amount, 0);

/** The cap a payment crosses, as the line says it, or null. */
export function pastCap(amount: number, spent: number): string | null {
  if (amount > CAPS.transfer) return `${naira(amount - CAPS.transfer)} over the ${naira(CAPS.transfer)} you set for one transfer`;
  if (spent + amount > CAPS.day) return `${naira(spent + amount - CAPS.day)} over the ${naira(CAPS.day)} you set for one day`;
  return null;
}

/** Why nothing can leave now, or null. */
export function stoppedBy(p: { frozen: boolean; sendAfter?: number }, now = Date.now()): string | null {
  if (p.frozen) return 'The money is frozen, so nothing leaves until you prove it is you, from Keys and recovery in Settings.';
  if (p.sendAfter && p.sendAfter > now) {
    const at = new Date(p.sendAfter);
    const when = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
    return `Your passcode is new, so sending waits until ${when}${at.toDateString() === new Date(now).toDateString() ? '' : ' tomorrow'}. Money still comes in.`;
  }
  return null;
}
