/* The bills an account pays: who is billed by whom, on what, for how much,
   and when. The demo account has the month the Bills frame draws — the
   light, the television, the internet, the waste and Mum's data — with
   what stands behind each: a standing instruction, a payment already made,
   or nothing yet. A real account service will fill this from what came
   through; the billers themselves are a table this build keeps. */
import type { IconName } from '../../icons';
import { shortDay } from '../../lib/days';

export type BillerKind = 'power' | 'tv' | 'internet' | 'waste' | 'data' | 'water' | 'school' | 'betting';

export type Biller = {
  id: string;
  name: string;
  kind: BillerKind;
  glyph: IconName;
  /** what the account is called on their side: Meter, Smartcard, Account */
  accountLabel: string;
  /** the demo account's own, grouped as they print it */
  account: string;
  /** what Beetle knows the account as: Prepaid, Compact, Home */
  plan?: string;
  /** what lands, and when: a token in a few seconds, the decoder at once */
  lands: [label: string, value: string];
  /** the usual figure, and the three the page offers */
  usual: number;
  picks: number[];
  /** the page's line under the title */
  sub: string;
  /** the lock line at the foot: what lands, and where */
  lock: string;
  /** what a pick of a figure buys: kWh, months, gigabytes, result PINs, or money in a wallet */
  buys: 'kwh' | 'months' | 'gb' | 'pins' | 'wallet';
};

export const BILLERS: Biller[] = [
  {
    id: 'ikeja',
    name: 'Ikeja Electric',
    kind: 'power',
    glyph: 'power',
    accountLabel: 'Meter',
    account: '4457 8891',
    plan: 'Prepaid',
    lands: ['Token arrives', 'In a few seconds'],
    usual: 8_000,
    picks: [3_000, 8_000, 15_000],
    sub: 'on your saved meter',
    lock: 'The token appears here and in your messages.',
    buys: 'kwh',
  },
  {
    id: 'dstv',
    name: 'DStv Compact',
    kind: 'tv',
    glyph: 'tv',
    accountLabel: 'Smartcard',
    account: '4131 2288 3907',
    plan: 'Compact',
    lands: ['Decoder', 'Back on at once'],
    usual: 12_500,
    picks: [12_500, 25_000, 37_500],
    sub: 'on your saved smartcard',
    lock: 'The decoder comes back on the moment it goes through.',
    buys: 'months',
  },
  {
    id: 'spectranet',
    name: 'Spectranet',
    kind: 'internet',
    glyph: 'globe',
    accountLabel: 'Account',
    account: '2201 8843',
    plan: 'Home 100GB',
    lands: ['Data lands', 'At once'],
    usual: 15_000,
    picks: [7_500, 15_000, 30_000],
    sub: 'on your home account',
    lock: 'The data lands the moment it goes through.',
    buys: 'gb',
  },
  {
    id: 'lawma',
    name: 'LAWMA waste',
    kind: 'waste',
    glyph: 'waste',
    accountLabel: 'Property',
    account: '14 Bode Thomas',
    plan: 'Monthly',
    lands: ['Settles', 'The month, at once'],
    usual: 2_000,
    picks: [2_000, 4_000, 6_000],
    sub: 'for the flat',
    lock: 'The month settles the moment it goes through.',
    buys: 'months',
  },
  /* Round 33: the three All services said were not in Beetle yet (the audit after Round 32) */
  {
    id: 'lwc',
    name: 'Lagos Water',
    kind: 'water',
    glyph: 'water',
    accountLabel: 'Account',
    account: '0381 2275',
    plan: 'Household',
    lands: ['Settles', 'The month, at once'],
    usual: 3_500,
    picks: [3_500, 7_000, 10_500],
    sub: 'for the flat',
    lock: 'The month settles the moment it goes through.',
    buys: 'months',
  },
  {
    id: 'waec',
    name: 'WAEC result checker',
    kind: 'school',
    glyph: 'school',
    accountLabel: 'Candidate',
    account: '4250 1187 0021',
    plan: 'Result PIN',
    lands: ['PIN arrives', 'In a few seconds'],
    usual: 5_000,
    picks: [5_000, 10_000, 15_000],
    sub: 'for the candidate you saved',
    lock: 'The PIN appears here and in your messages.',
    buys: 'pins',
  },
  {
    id: 'bet9ja',
    name: 'Bet9ja',
    kind: 'betting',
    glyph: 'bet',
    accountLabel: 'User ID',
    account: '4521 0098',
    plan: 'Wallet',
    lands: ['Wallet', 'Funded at once'],
    usual: 5_000,
    picks: [1_000, 5_000, 10_000],
    sub: 'on your saved user ID',
    lock: 'The wallet is funded the moment it goes through.',
    buys: 'wallet',
  },
];

export const billerById = (id: string): Biller | null => BILLERS.find(b => b.id === id) ?? null;

/** What a figure buys at a biller: About 38 kWh, Two months, 100GB. */
export function buysWords(b: Biller, amount: number): string {
  if (b.buys === 'kwh') return `About ${unitsFor(amount)} kWh`;
  if (b.buys === 'gb') return `${Math.round((amount / b.usual) * 100)}GB`;
  if (b.buys === 'wallet') return 'Into the wallet';
  if (b.buys === 'pins') {
    const pins = Math.round(amount / b.usual);
    return `${['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][pins] ?? pins} PIN${pins === 1 ? '' : 's'}`;
  }
  const months = Math.round(amount / b.usual);
  return `${['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][months] ?? months} month${months === 1 ? '' : 's'}`;
}

/** A bill in the month: whose, when, and whether something stands behind it. */
export type MonthBill = {
  id: string;
  biller: string;
  name: string;
  glyph: IconName;
  amount: number;
  /** Due Thursday, Paid 2 August */
  when: string;
  /** a standing instruction pays it, it is paid, or nothing stands behind it */
  covered: 'rule' | 'paid' | 'none';
  /** where the row goes: a biller's page, or data */
  to: string;
};

/** The month the frame draws, for the demo account. */
export const DEMO_MONTH: MonthBill[] = [
  { id: 'b-ikeja', biller: 'ikeja', name: 'Ikeja Electric', glyph: 'power', amount: 8_000, when: 'Due Thursday', covered: 'rule', to: '/pay?biller=ikeja' },
  { id: 'b-dstv', biller: 'dstv', name: 'DStv Compact', glyph: 'tv', amount: 12_500, when: 'Due 24 August', covered: 'none', to: '/pay?biller=dstv' },
  { id: 'b-spectranet', biller: 'spectranet', name: 'Spectranet', glyph: 'globe', amount: 15_000, when: 'Due 27 August', covered: 'none', to: '/pay?biller=spectranet' },
  { id: 'b-lawma', biller: 'lawma', name: 'LAWMA waste', glyph: 'waste', amount: 2_000, when: 'Paid 2 August', covered: 'paid', to: '/pay?biller=lawma' },
  { id: 'b-mtn', biller: 'mtn', name: 'MTN 5GB', glyph: 'data', amount: 2_500, when: 'Paid 4 August', covered: 'paid', to: '/buy' },
];

/** The bills paid on this phone, one row a biller, the latest of each, leaving out those already in the month: what
    Bills keeps once the first is paid (Round 33, the audit after Round 32: a new account's Bills said it would keep
    the first bill paid, and kept nothing). */
export function paidBills(rows: { kind: string; name: string; amount: number; status: string; at?: number; target?: { kind: string } }[], have: MonthBill[] = []): MonthBill[] {
  const out: MonthBill[] = [];
  for (const r of [...rows].sort((a, b) => (b.at ?? 0) - (a.at ?? 0))) {
    if (r.kind !== 'bill' || r.status !== 'done') continue;
    const b = BILLERS.find(x => x.name === r.name) ?? (r.target?.kind === 'meter' ? BILLERS.find(x => x.kind === 'power') : undefined);
    if (!b || have.some(h => h.biller === b.id) || out.some(o => o.biller === b.id)) continue;
    out.push({ id: `b-${b.id}`, biller: b.id, name: b.name, glyph: b.glyph, amount: Math.abs(r.amount), when: r.at ? `Paid ${shortDay(r.at)}` : 'Paid', covered: 'paid', to: `/pay?biller=${b.id}` });
  }
  return out;
}

/** What the month comes to, and how much of it is spoken for. */
export function monthOf(bills: MonthBill[]) {
  const total = bills.reduce((a, b) => a + b.amount, 0);
  const covered = bills.filter(b => b.covered !== 'none').length;
  return { total, covered, open: bills.length - covered, count: bills.length };
}

/** About 38 kWh: what a figure buys on a prepaid meter. */
import { unitsFor } from '../../services/nigeria';
export { unitsFor };
