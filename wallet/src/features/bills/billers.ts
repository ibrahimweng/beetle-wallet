/* The bills an account pays: who is billed by whom, on what, for how much,
   and when. The demo account has the month the Bills frame draws — the
   light, the television, the internet, the waste and Mum's data — with
   what stands behind each: a standing instruction, a payment already made,
   or nothing yet. A real account service will fill this from what came
   through; the billers themselves are a table this build keeps. */
import type { IconName } from '../../icons';

export type BillerKind = 'power' | 'tv' | 'internet' | 'waste' | 'data' | 'water' | 'school';

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
  /** what a pick of a figure buys: kWh, months, gigabytes */
  buys: 'kwh' | 'months' | 'gb';
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
];

export const billerById = (id: string): Biller | null => BILLERS.find(b => b.id === id) ?? null;

/** What a figure buys at a biller: About 38 kWh, Two months, 100GB. */
export function buysWords(b: Biller, amount: number): string {
  if (b.buys === 'kwh') return `About ${unitsFor(amount)} kWh`;
  if (b.buys === 'gb') return `${Math.round((amount / b.usual) * 100)}GB`;
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

/** What the month comes to, and how much of it is spoken for. */
export function monthOf(bills: MonthBill[]) {
  const total = bills.reduce((a, b) => a + b.amount, 0);
  const covered = bills.filter(b => b.covered !== 'none').length;
  return { total, covered, open: bills.length - covered, count: bills.length };
}

/** About 38 kWh: what a figure buys on a prepaid meter. */
import { unitsFor } from '../../services/nigeria';
export { unitsFor };
