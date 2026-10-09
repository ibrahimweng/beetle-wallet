/* What a loan costs, the way the Borrow frame lays it out: four percent a
   month on the whole for as many months as it runs, a one-off fee of one
   percent, paid back in equal monthly payments, the first a month from
   today. The figures are this build's own until a lender stands behind
   the app; the frame's ₦150,000 for 90 days comes to ₦169,500 in three
   payments of ₦56,500. */
export const LOAN = { least: 10_000, most: 250_000, step: 10_000, monthly: 0.04, fee: 0.01, late: 2_000 } as const;
export const TERMS = [30, 60, 90] as const;
export type Term = (typeof TERMS)[number];

export type Cost = {
  amount: number;
  days: Term;
  interest: number;
  fee: number;
  total: number;
  payments: number;
  /** each payment, and the last, which takes what rounding to the naira left over, so they come to the total */
  each: number;
  last: number;
  first: Date;
};

export function costOf(amount: number, days: Term, today = new Date()): Cost {
  const months = days / 30;
  const interest = Math.round(amount * LOAN.monthly * months);
  const fee = Math.round(amount * LOAN.fee);
  const total = amount + interest + fee;
  const first = new Date(today);
  first.setDate(first.getDate() + 30);
  /* whole naira each, and the last takes the remainder: the payments come to what is paid back, to the naira (the
     analysis after Round 21: three of ₦18,833 came to ₦1 short of ₦56,500) */
  const each = Math.floor(total / months);
  return { amount, days, interest, fee, total, payments: months, each, last: total - each * (months - 1), first };
}

/** What each payment is: ₦56,500, or ₦18,833 with the last ₦18,834 where the total does not divide evenly. */
export const eachWords = (c: Pick<Cost, 'each' | 'last'>, naira: (n: number) => string) => (c.last === c.each ? naira(c.each) : `${naira(c.each)}, the last ${naira(c.last)}`);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 19 September, the way the frame says a day. */
export const dayOf = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

type LoanRow = { kind: string; name: string; amount: number; detail?: string; at?: number };

const isTaken = (r: LoanRow) => r.kind === 'in' && r.name === 'Beetle Loans';
/** a payment back: a bill to Beetle Loans (Round 33, the audit after Round 32: there was no way to pay one back) */
const isPaidBack = (r: LoanRow) => r.kind === 'bill' && r.name === 'Beetle Loans' && r.amount < 0;
/** what a loan line comes to in all: its cost for the days in its words, or the amount where they are not there */
const totalOf = (r: LoanRow) => {
  const days = Number(r.detail?.match(/(30|60|90) days/)?.[1]);
  return days ? costOf(r.amount, days as Term).total : r.amount;
};

/** Each loan taken, oldest first, with what is still owed on it and how much of what it lent is still out: what is paid
    back clears the oldest first (the analysis after Round 34: shared across the loans by their totals, two long loans
    paid back freed more of the limit than they had taken, and a third went past it). The day lists newest first. */
function loansOut(rows: LoanRow[]) {
  const taken = rows
    .filter(isTaken)
    .map((row, i) => ({ row, i, total: totalOf(row) }))
    .sort((a, b) => (a.row.at ?? 0) - (b.row.at ?? 0) || b.i - a.i);
  let paid = rows.filter(isPaidBack).reduce((a, r) => a - r.amount, 0);
  return taken.map(t => {
    const off = Math.min(paid, t.total);
    paid -= off;
    const owed = t.total - off;
    return { row: t.row, owed, out: t.total ? Math.round((t.row.amount * owed) / t.total) : 0 };
  });
}

/** What is still owed in all, interest and fee with it. */
export const owedIn = (rows: LoanRow[]) => loansOut(rows).reduce((a, l) => a + l.owed, 0);

/** What is borrowed and not yet paid back: each loan's own amount, less its part of what has been paid back on it, so
    the limit frees up as it is. */
export const borrowedIn = (rows: LoanRow[]) => loansOut(rows).reduce((a, l) => a + l.out, 0);

/** The next payment: the newest loan still owing's monthly one, or what is owed where that is less (the analysis after
    Round 34: it was the oldest loan's). */
export function nextPayment(rows: LoanRow[]): number {
  const owing = loansOut(rows).filter(l => l.owed > 0);
  const last = owing.at(-1);
  if (!last) return 0;
  const days = Number(last.row.detail?.match(/(30|60|90) days/)?.[1]);
  const each = days ? costOf(last.row.amount, days as Term).each : last.owed;
  return Math.min(owedIn(rows), each);
}

/** How much more can be borrowed: the limit, less what is out (the analysis after Round 21: the limit was only the
    most one loan could be, so it could be taken again and again). */
export const leftToBorrow = (rows: LoanRow[]) => Math.max(0, LOAN.most - borrowedIn(rows));

/** The line under the amount: what is left of the limit, or that it is all out. */
export const limitNote = (left: number, naira: (n: number) => string) =>
  left < LOAN.least
    ? `${naira(LOAN.most - left)} is out, all of your limit. It frees up as you pay it back.`
    : left < LOAN.most
      ? `${naira(left)} is left of your limit`
      : `${naira(left)} is your limit`;

/** One, Three, Six: how the frame counts payments. */
export const countWord = (n: number) => ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][n] ?? String(n);

/** The figure held to the frame's range and step. */
export const held = (n: number) => Math.min(LOAN.most, Math.max(LOAN.least, Math.round(n / LOAN.step) * LOAN.step));

/** What happens if a payment is missed, in the owner's words: no collateral; a
    late fee for each week it is overdue; what is due is taken from money
    arriving in Everyday; reported to the credit bureau after 30 days late. */
export const MISSED = {
  collateral: 'No collateral',
  fee: `₦${LOAN.late.toLocaleString('en-NG')} late fee for each week a payment is overdue`,
  collect: 'What is due is taken from money arriving in Everyday',
  bureau: 'Reported to the credit bureau after 30 days late',
} as const;

/** How payments are taken: from Everyday on the day, with a word the day before. */
export const COLLECTED = 'From Everyday on the day; I tell you the day before';
