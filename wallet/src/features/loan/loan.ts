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
  each: number;
  first: Date;
};

export function costOf(amount: number, days: Term, today = new Date()): Cost {
  const months = days / 30;
  const interest = Math.round(amount * LOAN.monthly * months);
  const fee = Math.round(amount * LOAN.fee);
  const total = amount + interest + fee;
  const first = new Date(today);
  first.setDate(first.getDate() + 30);
  return { amount, days, interest, fee, total, payments: months, each: Math.round(total / months), first };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 19 September, the way the frame says a day. */
export const dayOf = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

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
