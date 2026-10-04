/* The record, in the order its frame lists it: what needs a look first —
   still on its way, did not go, came back — then what settled, newest
   first. What you moved into your own goal is not in it: that money is
   still yours. */
import type { LedgerRow } from '../home/account';

export type Segment = 'All' | 'Insights' | 'In' | 'Out';
export const SEGMENTS: Segment[] = ['All', 'Insights', 'In', 'Out'];

const minutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export function activityRows(ledger: LedgerRow[], day: LedgerRow['day'], segment: Segment): LedgerRow[] {
  if (segment === 'Insights') return [];
  const inDay = ledger.filter(r => r.day === day && r.kind !== 'saving').filter(r => (segment === 'All' ? true : segment === 'In' ? r.amount > 0 : r.amount < 0));
  const byTime = (a: LedgerRow, b: LedgerRow) => minutes(b.time) - minutes(a.time);
  const open = inDay.filter(r => r.status !== 'done').sort(byTime);
  const settled = inDay.filter(r => r.status === 'done').sort(byTime);
  return [...open, ...settled];
}

/** The figure on a line: signed once it settled or is on its way, bare where it did not go or came back. */
export const activityAmount = (r: LedgerRow, signed: (n: number) => string, naira: (n: number) => string) => (r.status === 'failed' || r.status === 'reversed' ? naira(r.amount) : signed(r.amount));

/** What a line says under its name: its own words with the time, where they do not carry one already. */
export const detailOf = (r: LedgerRow) => (r.detail.includes(':') ? r.detail : `${r.detail} · ${r.time}`);
