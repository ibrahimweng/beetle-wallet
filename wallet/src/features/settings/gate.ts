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

/** What can leave in the day after a recovery (Round 30, the owner's word): enough for a fare and a meal, not enough
    for somebody who took the account over to empty it before the owner sees the alert and says This wasn't me. */
export const HOLD_CAP = 20000;

/** What has left today: settled money out, not what went into your own goals. */
export const spentToday = (rows: Pick<LedgerRow, 'day' | 'status' | 'amount' | 'kind'>[]) =>
  rows.filter(r => r.day === 'today' && r.status === 'done' && r.amount < 0 && r.kind !== 'saving').reduce((a, r) => a - r.amount, 0);

/** The cap a payment crosses, as the line says it, or null. */
export function pastCap(amount: number, spent: number): string | null {
  if (amount > CAPS.transfer) return `${naira(amount - CAPS.transfer)} over the ${naira(CAPS.transfer)} you set for one transfer`;
  if (spent + amount > CAPS.day) return `${naira(spent + amount - CAPS.day)} over the ${naira(CAPS.day)} you set for one day`;
  return null;
}

const clock = (at: Date, now: number) =>
  `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}${at.toDateString() === new Date(now).toDateString() ? '' : ' tomorrow'}`;

/** Why this payment cannot leave now, or null: the freeze, the wait after a new passcode, and the day's hold after a
    recovery, which lets HOLD_CAP out and no more (`amount` and `spent` are what it is held against). */
export function stoppedBy(p: { frozen: boolean; sendAfter?: number; hold?: { until: number } }, now = Date.now(), amount = 0, spent = 0): string | null {
  if (p.frozen) return 'The money is frozen, so nothing leaves until you prove it is you, from Keys and recovery in Settings.';
  if (p.hold && p.hold.until > now && spent + amount > HOLD_CAP) {
    const left = Math.max(0, HOLD_CAP - spent);
    return `The account was recovered today, so until ${clock(new Date(p.hold.until), now)} no more than ${naira(HOLD_CAP)} can leave${left > 0 ? `, and ${naira(left)} of it is left` : ''}. Money still comes in.`;
  }
  if (p.sendAfter && p.sendAfter > now) {
    return `Your password is new, so sending waits until ${clock(new Date(p.sendAfter), now)}. Money still comes in.`;
  }
  return null;
}
