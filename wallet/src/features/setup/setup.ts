/* Finishing setting up, from the frames that follow the account being
   ready: where you live, a photo of an ID, and where the money comes from.
   Three answers, asked once, that turn the last limits on: sending a
   million naira a day, holding dollars, borrowing against the history. The
   figures are the frames' own until a bank's check stands behind them. */
import type { TrailStep } from '../../design';

export type Income = 'salary' | 'business' | 'family' | 'else';

export type Setup = {
  /** the street, and the area, town and state under it */
  address?: { street: string; area: string };
  /** what the photo of the ID gave: the name and the number, nothing else kept */
  id?: { name: string; number: string };
  income?: Income;
  /** every answer in, and Take me in pressed */
  done: boolean;
};

export const EMPTY_SETUP: Setup = { done: false };

export const INCOMES: { id: Income; label: string }[] = [
  { id: 'salary', label: 'A salary' },
  { id: 'business', label: 'My own business' },
  { id: 'family', label: 'Family or friends' },
  { id: 'else', label: 'Something else' },
];

/** What finishing opens, in the frames' order. */
export const OPENS = ['Send up to ₦1,000,000 a day', 'Hold dollars', 'Borrow against your history'] as const;

/** The frame's own answers, for the lab and the demo account. */
export const DEMO_SETUP: Setup = { address: { street: '12 Bode Thomas Street', area: 'Surulere, Lagos State' }, id: { name: 'MUSA IBRAHIM', number: '1234 5678 900' }, income: 'salary', done: true };

/** How far the day's cap can be raised: to a million once setting up is finished, ₦100,000 before. The caps themselves are what you set. */
export const DAY_CAP = { before: 100_000, after: 1_000_000 } as const;
export const dayCap = (done: boolean) => (done ? DAY_CAP.after : DAY_CAP.before);

/** The three steps, as the trail names them once each is done. */
export const LIVE: TrailStep = { icon: 'home-filled', label: 'Where you live' };
export const IDCARD: TrailStep = { icon: 'camera-filled', label: 'A photo of an ID' };
export const INCOME: TrailStep = { icon: 'receive-filled', label: 'Where your money comes from' };

/** The next step still to answer, or nothing when every one is in. */
export function nextSetup(s: Setup): 'address' | 'idcard' | 'income' | 'full' {
  if (!s.address) return 'address';
  if (!s.id) return 'idcard';
  if (!s.income) return 'income';
  return 'full';
}

/** An address has a street and somewhere it is. */
export const addressOk = (street: string, area: string) => street.trim().length >= 3 && area.trim().length >= 3;

/** Everything is on: what the full frame says under it. */
export const FULL_LINE = 'You can send a million naira a day and hold dollars now.';
