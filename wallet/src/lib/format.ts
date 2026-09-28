/* Small formatters shared by the screens and the tests. */

/** Break a run of digits into groups: groupDigits('08032144471', [4, 3, 4]) → '0803 214 4471'. */
export function groupDigits(digits: string, groups: number[]): string {
  let i = 0;
  return groups
    .map(g => digits.slice(i, (i += g)))
    .filter(Boolean)
    .join(' ');
}

export const groupPhone = (digits: string) => groupDigits(digits, [4, 3, 4]);
export const groupIdentity = (digits: string) => groupDigits(digits, [4, 4, 3]);
export const groupAccount = (digits: string) => groupDigits(digits, [4, 4, 2]);

/** ₦ with thousands, no kobo. */
export const naira = (n: number) => '₦' + Math.floor(Math.abs(n)).toLocaleString('en-NG');
/** The kobo part, with its point: 595320.75 → '.75'. */
export const kobo = (n: number) => '.' + Math.abs(n).toFixed(2).split('.')[1];
/** Signed, the way a ledger row reads: −₦20,000, +₦50,000. */
export const signed = (n: number) => (n < 0 ? '−' : n > 0 ? '+' : '') + naira(n);

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

/** 14 June 1996, from an ISO date. */
export const longDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  return `${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
};
