/* The date of birth on the wheels (design/DateWheel.tsx): the months by
   name, how many days each has, and which years are offered. Pure, so the
   rules can be tested on their own. */

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

/** Days in a month (1 to 12) of a year, February's 29 in a leap year. */
export const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** A day as an ISO date. */
export const isoOf = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** An ISO date as its day, month and year, or null. */
export function partsOf(iso: string | null | undefined): { day: number; month: number; year: number } | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null;
}

/** The youngest year on the wheel: sixteen, so a 16 or 17 year old picks their own year and is told why not, rather
    than finding it missing. */
export const YOUNGEST = 16;
/** Where the year wheel starts: most people opening an account are in their twenties. */
export const START_AGE = 22;

/** The years on the wheel, oldest first, and the one it starts on. */
export function wheelYears(now = new Date()): { list: number[]; start: number } {
  const top = now.getFullYear() - YOUNGEST;
  const list = Array.from({ length: 100 - YOUNGEST + 1 }, (_, i) => top - (100 - YOUNGEST) + i);
  return { list, start: now.getFullYear() - START_AGE };
}

/** An ISO date as people say it: 14 June 1996. */
export function spokenDate(iso: string): string {
  const p = partsOf(iso);
  return p ? `${p.day} ${MONTHS[p.month - 1]} ${p.year}` : iso;
}
