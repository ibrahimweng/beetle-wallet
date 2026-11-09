/* Can I afford it? (Round 43, the owner's word). Somebody asks Beetle whether
   a thing fits, "a plate of food for ₦10,000" or "$10 of food", and Beetle
   holds it to the month: every bill and saving still to come before the next
   pay, and food and getting about until then, set aside first. What is left is
   what can be spent freely, and the answer says so plainly, with each thing it
   checked.

   The month comes from a plan: the demo account's is the frames' own (its
   salary, Netflix, the light, rent being saved for), and a new account's is put
   together from a few questions asked once in the chat, every one answered by a
   tap, with the likely answer first where something already told at sign-up or
   setting up points to it (where the money comes from, what Beetle is for, a
   meter or a line paid before). The plan is kept with the account and goes with
   it on sign out.

   Plain TypeScript: no screen, so the tests read it and a real model can call
   the same check as a tool. */
import { naira } from '../../lib/format';
import type { AimId } from '../aims/aims';
import type { Income } from '../setup/setup';

export type CommitmentKind = 'bill' | 'subscription' | 'saving' | 'family';

/** A thing that leaves every month, on its day. */
export type Commitment = { id: string; label: string; amount: number; day: number; kind: CommitmentKind };

/** What the month looks like: when the money comes in and how much, what leaves on which day, and what a day costs in
    food and getting about. `every` is 'month' for a salary on a day, 'week' for money that comes in weekly. */
export type MoneyPlan = { pay: number; payday: number; every: 'month' | 'week'; commitments: Commitment[]; daily: number };

/** The demo account's month, as its frames draw it: a salary on the 25th, Netflix on the card, the light, data, rent put
    away after payday and something for family. */
export const DEMO_PLAN: MoneyPlan = {
  pay: 450_000,
  payday: 25,
  every: 'month',
  daily: 4_000,
  commitments: [
    { id: 'data', label: 'Data', amount: 3_500, day: 1, kind: 'bill' },
    { id: 'netflix', label: 'Netflix', amount: 5_200, day: 3, kind: 'subscription' },
    { id: 'light', label: 'Light (Ikeja Electric)', amount: 15_000, day: 10, kind: 'bill' },
    { id: 'rent', label: 'Rent savings', amount: 60_000, day: 26, kind: 'saving' },
    { id: 'family', label: 'Money for Mum', amount: 20_000, day: 27, kind: 'family' },
  ],
};

/* ---- the check ---- */

export type Verdict = 'yes' | 'tight' | 'no';

/** One thing the answer checked: covered from what is there now, or from the next pay. */
export type CheckedRow = { label: string; amount: number; when: string; from: 'now' | 'pay' };

export type AffordCheck = {
  /** what it costs, in naira */
  cost: number;
  /** what was asked in dollars, where it was */
  usd?: number;
  /** what it is, in a word or two: "food", "a plate of food" */
  what: string;
  verdict: Verdict;
  balance: number;
  /** the bills and savings to come before the next pay */
  reserved: number;
  /** food and getting about until the next pay */
  essentials: number;
  days: number;
  /** what can be spent freely now, before this */
  free: number;
  /** and after it */
  after: number;
  /** a day, after it, until the next pay */
  perDay: number;
  /** the most that still sits easily today */
  comfortable: number;
  /** the next pay, said as a day: "the 25th", "Friday" */
  payday: string;
  rows: CheckedRow[];
};

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${s}`;
};
const DAY = 24 * 60 * 60 * 1000;
const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
/** The day of the month, in this month or the next, the first on or after `from`. */
function nextOn(day: number, from: Date): Date {
  const y = from.getFullYear();
  const m = from.getMonth();
  const here = new Date(y, m, Math.min(day, daysIn(y, m)));
  if (here.getTime() >= from.getTime()) return here;
  return new Date(y, m + 1, Math.min(day, daysIn(y, m + 1)));
}
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** When the next pay lands, and how it is said. Monthly: the payday, today if it is today. Weekly: the coming Friday. */
export function nextPay(plan: Pick<MoneyPlan, 'payday' | 'every'>, now = new Date()): { at: Date; said: string } {
  const today = startOf(now);
  if (plan.every === 'week') {
    const ahead = (5 - today.getDay() + 7) % 7 || 7;
    const at = new Date(today.getTime() + ahead * DAY);
    return { at, said: WEEKDAYS[at.getDay()]! };
  }
  const at = nextOn(plan.payday, today);
  return { at, said: `the ${ordinal(at.getDate())}` };
}

/** A sum to the nearest ₦500 below it, the way a person would say what fits. */
const roundDown = (n: number) => Math.max(0, Math.floor(n / 500) * 500);

/** Can this be bought now and the month still hold? Every bill and saving due before the next pay is set aside, and
    food and getting about until then; what is left is free to spend. Yes where this leaves at least three days of food
    and costs no more than half of what is free; tight where it fits but takes more than that; no where it does not. */
export function affordCheck(plan: MoneyPlan, balance: number, cost: number, what = 'it', now = new Date(), usd?: number): AffordCheck {
  const today = startOf(now);
  const pay = nextPay(plan, now);
  const days = Math.max(1, Math.round((pay.at.getTime() - today.getTime()) / DAY));
  const rows: CheckedRow[] = [];
  let reserved = 0;
  for (const c of plan.commitments) {
    const due = nextOn(c.day, today);
    const before = plan.every === 'month' ? due.getTime() < pay.at.getTime() : false;
    if (before) reserved += c.amount;
    rows.push({ label: c.label, amount: c.amount, when: `the ${ordinal(due.getDate())}`, from: before ? 'now' : 'pay' });
  }
  /* weekly money: a week's share of every monthly thing comes out of what is there now */
  if (plan.every === 'week') reserved = Math.round(plan.commitments.reduce((a, c) => a + c.amount, 0) / 4);
  rows.sort((a, b) => (a.from === b.from ? 0 : a.from === 'now' ? -1 : 1));
  const essentials = plan.daily * days;
  const free = Math.max(0, balance - reserved - essentials);
  const after = free - cost;
  const perDay = Math.max(0, Math.floor(after / days));
  const verdict: Verdict = after < 0 ? 'no' : cost <= free / 2 && after >= plan.daily * 3 ? 'yes' : 'tight';
  return {
    cost,
    usd,
    what,
    verdict,
    balance,
    reserved,
    essentials,
    days,
    free,
    after,
    perDay,
    comfortable: roundDown(free / 2),
    payday: pay.said,
    rows: [...rows, { label: `Food and getting about, ${days} ${days === 1 ? 'day' : 'days'}`, amount: essentials, when: `until ${pay.said}`, from: 'now' }],
  };
}

const list = (words: string[]) => (words.length <= 1 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);

/** Beetle's answer in words, the reasons first and the figure it leaves. */
export function affordWords(c: AffordCheck): string {
  const price = c.usd ? `$${c.usd.toLocaleString('en-NG')} (about ${naira(c.cost)})` : naira(c.cost);
  const now = c.rows.filter(r => r.from === 'now' && !r.label.startsWith('Food')).map(r => r.label.replace(/ \(.*\)$/, ''));
  const later = c.rows.filter(r => r.from === 'pay').map(r => r.label.replace(/ \(.*\)$/, '').toLowerCase());
  const covered = now.length ? `${list(now)} ${now.length === 1 ? 'is' : 'are'} covered` : 'Nothing is due before your next pay';
  const fromPay = later.length ? `, ${list(later)} come${later.length === 1 ? 's' : ''} out of your pay on ${c.payday}` : '';
  const food = `, and food until then is set aside`;
  if (c.verdict === 'yes')
    return `Yes, you can buy ${c.what} for ${price}. ${covered}${fromPay}${food}. After it you still have ${naira(c.after)} to spend freely, about ${naira(c.perDay)} a day until ${c.payday}.`;
  if (c.verdict === 'tight')
    return `You can, but it is tight. ${covered}${fromPay}${food}. ${c.what === 'it' ? 'It' : capital(c.what)} for ${price} leaves ${naira(c.after)}, about ${naira(c.perDay)} a day until ${c.payday}. Up to ${naira(c.comfortable)} would sit easier.`;
  return `Not right now. You have ${naira(c.balance)}. ${covered.replace(/ covered$/, ' set aside first')}${fromPay}${food}, and that leaves ${naira(c.free)} free, less than ${price}. ${c.comfortable > 0 ? `Up to ${naira(c.comfortable)} fits today, or wait` : 'Wait'} for your pay on ${c.payday}.`;
}
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---- reading the ask ---- */

/** "Can I afford…", "I want to buy… will I be able to", "should I spend…": an ask to hold a purchase to the month. */
export const isAffordAsk = (lower: string) =>
  /\b(afford|can i (?:buy|get|spend|eat|go)|could i (?:buy|get|spend)|should i (?:buy|get|spend)|is it ok(?:ay)? to (?:buy|spend)|want to (?:buy|get|spend|eat)|wan buy|fit buy|enough (?:money )?(?:for|to buy))\b/.test(lower);

/** $10, 10 dollars, 10 usd: the dollars in the words, if any. */
export function dollarsIn(text: string): number | null {
  const m = text.match(/\$\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:dollars?|usd|bucks)\b/i);
  if (!m) return null;
  const n = Number(m[1] ?? m[2]);
  return n > 0 ? n : null;
}

/** What is being bought, in a word or two, from the words: "a plate of food", "food", "shoes". */
export function thingIn(text: string): string {
  const lower = text.toLowerCase();
  const m = lower.match(/\b(?:buy|get|afford|eat|spend on|for)\s+(?:a |an |some |the )?((?:plate of |pair of |bottle of |packet of |bag of )?[a-z]+(?: [a-z]+)?)/);
  const words = (m?.[1] ?? '')
    .split(' ')
    .filter(Boolean)
    .filter((w, i, all) => !/^(that|this|it|costs?|worth|at|for|which|naira|dollars?|usd|will|would|can|i|is|and|now|today|some)$/.test(w) && !(w === 'of' && i === all.length - 1));
  if (/\b(food|meal|eat|lunch|dinner|breakfast|restaurant|chop)\b/.test(lower) && !words.length) return 'the meal';
  const thing = words.join(' ').trim();
  if (!thing) return 'it';
  return /^(plate|pair|bottle|packet|bag|meal|phone|laptop|shoe|dress)/.test(thing) ? `a ${thing}` : thing;
}

/* ---- a new account's plan: the questions, answered by a tap ---- */

export type Draft = { income?: string; band?: string; bills?: string[]; rent?: string; daily?: string };

export type Choice = { id: string; label: string; sub?: string; /** told at sign-up or setting up, so it is put first */ likely?: boolean };
export type Question = { id: keyof Draft; title: string; options: Choice[]; multi?: boolean };

/** What Beetle knows already that points to an answer. */
export type Known = { income?: Income; aims?: readonly AimId[]; meters?: number; lines?: number; cards?: number };

const BANDS: { id: string; label: string; pay: number }[] = [
  { id: 'b1', label: 'Under ₦100,000', pay: 80_000 },
  { id: 'b2', label: '₦100,000 to ₦250,000', pay: 175_000 },
  { id: 'b3', label: '₦250,000 to ₦500,000', pay: 375_000 },
  { id: 'b4', label: 'Over ₦500,000', pay: 650_000 },
];
const RENTS: { id: string; label: string; amount: number }[] = [
  { id: 'r1', label: '₦25,000 a month', amount: 25_000 },
  { id: 'r2', label: '₦50,000 a month', amount: 50_000 },
  { id: 'r3', label: '₦100,000 a month', amount: 100_000 },
  { id: 'r4', label: '₦150,000 or more', amount: 150_000 },
];
const DAILIES: { id: string; label: string; amount: number }[] = [
  { id: 'd1', label: '₦2,000 a day', amount: 2_000 },
  { id: 'd2', label: '₦4,000 a day', amount: 4_000 },
  { id: 'd3', label: '₦7,000 a day', amount: 7_000 },
  { id: 'd4', label: '₦10,000 or more', amount: 10_000 },
];
const BILLS: { id: string; label: string }[] = [
  { id: 'rent', label: 'Rent' },
  { id: 'light', label: 'Light' },
  { id: 'data', label: 'Data and airtime' },
  { id: 'subs', label: 'Subscriptions (Netflix, Showmax)' },
  { id: 'family', label: 'Money for family' },
];

const first = (options: Choice[]) => [...options.filter(o => o.likely), ...options.filter(o => !o.likely)];

/** The next question still to answer, or null once there is enough for a plan. Every one is answered by a tap; the
    answer that what is already known points to comes first, and says why. */
export function nextQuestion(d: Draft, k: Known): Question | null {
  if (!d.income) {
    const told = (i: Income) => k.income === i;
    return {
      id: 'income',
      title: 'When does your money come in?',
      options: first([
        { id: 'month-end', label: 'A salary, at the end of the month', sub: told('salary') ? 'You said a salary when setting up' : 'Around the 25th', likely: told('salary') || (!k.income && !!k.aims?.includes('salary')) },
        { id: 'month-mid', label: 'A salary, in the middle of the month', sub: 'Around the 15th' },
        { id: 'week', label: 'Every week, from my business or work', sub: told('business') ? 'You said your own business when setting up' : 'Most weeks', likely: told('business') },
        { id: 'varies', label: 'It varies, family sends some', sub: told('family') ? 'You said family or friends when setting up' : 'No fixed day', likely: told('family') },
      ]),
    };
  }
  if (!d.band) {
    const young = k.income === 'family';
    return {
      id: 'band',
      title: 'About how much comes in a month?',
      options: first(BANDS.map(b => ({ id: b.id, label: b.label, likely: young && b.id === 'b1' }))),
    };
  }
  if (!d.bills) {
    const aims = k.aims ?? [];
    const likely: Record<string, boolean> = {
      rent: aims.includes('salary'),
      light: aims.includes('salary') || (k.meters ?? 0) > 0,
      data: aims.includes('daily') || (k.lines ?? 0) > 0,
      subs: (k.cards ?? 0) > 0,
      family: aims.includes('family'),
    };
    const why: Record<string, string> = {
      rent: 'You picked Get paid, pay rent and bills',
      light: (k.meters ?? 0) > 0 ? 'You have paid a meter on Beetle' : 'You picked Get paid, pay rent and bills',
      data: (k.lines ?? 0) > 0 ? 'Your line is on Beetle' : 'You picked Small daily payments',
      subs: 'You have a card on Beetle',
      family: 'You picked Send money to family',
    };
    return {
      id: 'bills',
      title: 'Which of these leave every month? Tick all that apply.',
      multi: true,
      options: BILLS.map(b => ({ id: b.id, label: b.label, likely: likely[b.id], sub: likely[b.id] ? why[b.id] : undefined })),
    };
  }
  if (d.bills.includes('rent') && !d.rent) {
    const pay = BANDS.find(b => b.id === d.band)?.pay ?? 175_000;
    /* rent is often a quarter to a third of pay: the closest is put first */
    const guess = RENTS.reduce((a, r) => (Math.abs(r.amount - pay * 0.28) < Math.abs(a.amount - pay * 0.28) ? r : a));
    return { id: 'rent', title: 'How much do you put towards rent?', options: first(RENTS.map(r => ({ id: r.id, label: r.label, likely: r.id === guess.id, sub: r.id === guess.id ? 'Close to a quarter of your pay' : undefined }))) };
  }
  if (!d.daily) {
    const pay = BANDS.find(b => b.id === d.band)?.pay ?? 175_000;
    const guess = DAILIES.reduce((a, r) => (Math.abs(r.amount - pay / 60) < Math.abs(a.amount - pay / 60) ? r : a));
    return {
      id: 'daily',
      title: 'What do food and getting about cost you a day?',
      options: first(DAILIES.map(r => ({ id: r.id, label: r.label, likely: r.id === guess.id, sub: r.id === guess.id ? 'Usual for what comes in' : undefined }))),
    };
  }
  return null;
}

/** The plan the answers make: what comes in, on which day, and each bill sized to the pay. */
export function planFrom(d: Draft): MoneyPlan {
  const pay = BANDS.find(b => b.id === d.band)?.pay ?? 175_000;
  const every = d.income === 'week' ? 'week' : 'month';
  const payday = d.income === 'month-mid' ? 15 : d.income === 'varies' ? 28 : 25;
  const scale = Math.max(0.5, Math.min(2, pay / 175_000));
  const size = (n: number) => Math.round((n * scale) / 500) * 500;
  const bills = d.bills ?? [];
  const commitments: Commitment[] = [];
  const after = (n: number) => ((payday + n - 1) % 28) + 1;
  if (bills.includes('data')) commitments.push({ id: 'data', label: 'Data and airtime', amount: size(4_000), day: after(6), kind: 'bill' });
  if (bills.includes('subs')) commitments.push({ id: 'subs', label: 'Subscriptions', amount: size(5_000), day: after(9), kind: 'subscription' });
  if (bills.includes('light')) commitments.push({ id: 'light', label: 'Light', amount: size(10_000), day: after(15), kind: 'bill' });
  if (bills.includes('rent')) commitments.push({ id: 'rent', label: 'Rent savings', amount: RENTS.find(r => r.id === d.rent)?.amount ?? size(40_000), day: after(1), kind: 'saving' });
  if (bills.includes('family')) commitments.push({ id: 'family', label: 'Money for family', amount: Math.round((pay * 0.08) / 500) * 500, day: after(2), kind: 'family' });
  return { pay, payday, every, commitments, daily: DAILIES.find(r => r.id === d.daily)?.amount ?? 3_000 };
}

/** What a tapped answer reads as, in the chat, as if it were said. */
export function answerWords(q: Question, picked: string[]): string {
  const labels = q.options.filter(o => picked.includes(o.id)).map(o => o.label);
  if (q.multi) return labels.length ? list(labels) : 'None of these';
  return labels[0] ?? '';
}

/** Where a plan is kept, with the account's own things, so signing out forgets it. */
export const planKey = (account: string) => `beetle.plan.${account}.v1`;
