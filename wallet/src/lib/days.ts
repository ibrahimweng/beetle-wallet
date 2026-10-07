/* Which day something happened, by this phone's own calendar. A line
   moved on this phone keeps the moment it moved, and its day is worked out
   from that whenever it is shown: today, yesterday, then earlier, rather than
   "today" for ever (the analysis after Round 21). A receipt's date is the
   phone's own day too, never the UTC day, which in Lagos is yesterday's for
   the hour after midnight. */

export type DayName = 'today' | 'yesterday' | 'earlier';

const DAY = 86_400_000;
const two = (n: number) => String(n).padStart(2, '0');
const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Whole days between the day of `when` and today: 0 today, 1 yesterday. */
export const daysAgo = (when: number, now = new Date()) => Math.round((startOf(now) - startOf(new Date(when))) / DAY);

/** The day a moment falls on, as the record names it. */
export const dayName = (when: number, now = new Date()): DayName => {
  const n = daysAgo(when, now);
  return n <= 0 ? 'today' : n === 1 ? 'yesterday' : 'earlier';
};

/** The phone's own date, YYYY-MM-DD. */
export const localIsoDay = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

/** When a session id was made: "000017 261006 213647 …" is 6 October 2026 at 21:36:47. Lines moved on this phone
    before they kept their moment still carry it there. */
export function sessionWhen(session?: string): number | undefined {
  const m = session?.match(/^\d{6} (\d{2})(\d{2})(\d{2}) (\d{2})(\d{2})(\d{2})/);
  if (!m) return undefined;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number) as [number, number, number, number, number, number];
  const at = new Date(2000 + y, mo - 1, d, h, mi, s).getTime();
  return Number.isFinite(at) ? at : undefined;
}

/** 6 Oct: a day earlier than yesterday, short. */
export const shortDay = (when: number) => new Date(when).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
