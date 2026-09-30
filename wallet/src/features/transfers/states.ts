/* What the state screens say about a line: the bank it went through, when
   things happened around it, and the reference a return carries. The day
   the frames draw carries the frames' own figures; a line this phone added
   carries what its page knew. */
import { PEOPLE, type Person } from '../../services/agent';
import type { LedgerRow } from '../home/account';

/** The bank a transfer went through: the line's own, or the person's the day knows. */
export function bankOf(row: LedgerRow): string {
  return row.person?.bank ?? PEOPLE.find(p => p.name === row.name)?.bank ?? 'their bank';
}

/** Who a transfer went to, as the Send money page needs them: the line's own, or the person the day knows by name. */
export function personOf(row: LedgerRow): Person | undefined {
  if (row.person) return { name: row.name, bank: row.person.bank, number: row.person.number };
  return PEOPLE.find(p => p.name === row.name);
}

/** Their first name, as Beetle says it. */
export const firstOf = (name: string) => name.split(' ')[0] ?? name;

/** HH:MM moved by some minutes, staying inside the day. */
export function shifted(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = ((((h ?? 0) * 60 + (m ?? 0) + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** The reference a return carries, the same every time it is asked for: REV-40118-2290 in the frames' shape. */
export function returnReference(id: string): string {
  let h = 11;
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) % 1_000_000_007;
  return `REV-${String(h % 100_000).padStart(5, '0')}-${String(Math.floor(h / 100_000) % 10_000).padStart(4, '0')}`;
}

/** When a line happened, as a page's subtitle says it: Today, 14:22. */
export const whenOf = (row: LedgerRow) => `${row.day === 'today' ? 'Today' : 'Yesterday'}, ${row.time}`;
