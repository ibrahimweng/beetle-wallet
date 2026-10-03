/* Several goals, each a name, what it aims for and the day it is aimed at,
   kept on this phone per account (see store.ts). The demo account starts
   with Holiday, the frames' goal; a new account with none. The first goal is
   the one the payday slice, round ups and cash back go to; the rest are fed
   by hand. What a goal holds is what its feeds put in (the demo's Holiday has
   the frames' figures) and what was put in by hand, less what was taken
   back: the lines in the day say which. Nothing here touches the screen, so
   the tests read it as it is. */
import { amountIn } from '../../services/agent';
import { naira } from '../../lib/format';
import { DEMO_SUMS, GOAL, NO_SUMS, putAside, type FeedId } from './goal';

export type Goal = {
  id: string;
  name: string;
  target: number;
  /** the day it is aimed at, yyyy-mm-dd */
  due: string;
  /** paused by hand: what feeds it waits, its date moves, and Beetle stops nudging */
  paused?: boolean;
};

/** The demo's goal, the one the frames draw. */
export const HOLIDAY_ID = 'holiday';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateOf = (due: string) => {
  const [y, m, d] = due.split('-').map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
};

/** The next time a day of the year comes round, from today: Holiday's 12 March is always ahead. */
export function nextOn(month: number, day: number, today = new Date()): string {
  const d = new Date(today.getFullYear(), month, day);
  if (d <= today) d.setFullYear(d.getFullYear() + 1);
  return iso(d);
}

/** The frames' Holiday: ₦250,000 by 12 March. */
export const holiday = (today = new Date()): Goal => ({ id: HOLIDAY_ID, name: GOAL.name, target: GOAL.target, due: nextOn(2, 12, today) });

/** What an account has before anything about its goals is kept: the demo's
    Holiday, Holiday again for an account that started one before goals were
    kept (Start a goal made Holiday then), or nothing. */
export const seedGoals = (demo: boolean, started: boolean, today = new Date()): Goal[] => (demo || started ? [holiday(today)] : []);

/** The months from today a goal is set for, the day moved on as far. */
export function dueIn(months: number, today = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth() + months, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(today.getDate(), last));
  return iso(d);
}

/** "12 March"; "3 October 2027" where it is most of a year away or more, so it never reads as today. */
export function dayWords(due: string, today = new Date()): string {
  const d = dateOf(due);
  const far = d.getTime() - today.getTime() > 300 * 86_400_000;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${far ? ` ${d.getFullYear()}` : ''}`;
}

/** Whole months from today to the day, never fewer than one. */
export function monthsTo(due: string, today = new Date()): number {
  const days = (dateOf(due).getTime() - today.getTime()) / 86_400_000;
  return Math.max(1, Math.round(days / 30.44));
}

/* ---- starting one ---- */

export type Idea = { name: string; target: number; months: Span };

/** What a new goal is filled with, in the order they are offered: what
    people here save for most, with a usual figure and a date to match. */
export const IDEAS: Idea[] = [
  { name: 'Rent', target: 600_000, months: 12 },
  { name: 'Emergency fund', target: 300_000, months: 6 },
  { name: 'School fees', target: 250_000, months: 6 },
  { name: 'A new phone', target: 450_000, months: 6 },
  { name: 'Holiday', target: 250_000, months: 6 },
];

/** How far off a goal can be set: the quiet row's four. */
export const SPANS = [3, 6, 12, 24] as const;
export type Span = (typeof SPANS)[number];
export const spanWords = (m: number) => (m === 12 ? 'In a year' : m === 24 ? 'In 2 years' : `In ${m} months`);

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The idea a new goal starts with: the first that is not a goal already. */
export function nextIdea(goals: Goal[]): Idea {
  return IDEAS.find(i => !goals.some(g => same(g.name, i.name))) ?? { name: 'Something new', target: 100_000, months: 6 };
}

/** A goal's name, tidied: the first letter up, no longer than the pills can hold. */
export const tidyName = (name: string) => {
  const t = name.trim().replace(/\s+/g, ' ').slice(0, 24);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** A name nobody else on the list has: Rent, then Rent 2. */
export function freeName(name: string, goals: Goal[], except?: string): string {
  const base = tidyName(name) || 'My goal';
  const taken = (n: string) => goals.some(g => g.id !== except && same(g.name, n));
  if (!taken(base)) return base;
  let i = 2;
  while (taken(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

/* ---- where one stands ---- */

export type GoalState = 'empty' | 'running' | 'paused' | 'reached';

export type Move = { kind: string; name: string; amount: number; goal?: string };

/** The lines in the day that are a goal's own: put in (out of Everyday) or
    taken back. A line from before goals had ids is the demo Holiday's by
    its name. */
export const isGoalsLine = (m: Move, goal: Goal) => m.kind === 'saving' && (m.goal ? m.goal === goal.id : goal.id === HOLIDAY_ID && m.name === goal.name);

/** What was put in by hand, less what was taken back. */
export const byHand = (goal: Goal, moves: Move[]) => moves.filter(m => isGoalsLine(m, goal)).reduce((a, m) => a - m.amount, 0);

export type Standing = {
  goal: Goal;
  /** the payday slice, round ups and cash back come here */
  fed: boolean;
  paused: boolean;
  sums: Record<FeedId, number>;
  aside: number;
  pct: number;
  state: GoalState;
};

/** Where a goal stands: whether the feeds come to it, whether it waits (by
    hand, or every goal while money is tight), what it holds, how far along,
    and so which words it gets. */
export function standingOf(goal: Goal, { goals, demo, tight, moves }: { goals: Goal[]; demo: boolean; tight: boolean; moves: Move[] }): Standing {
  const fed = goals[0]?.id === goal.id;
  const paused = tight || !!goal.paused;
  const sums = demo && goal.id === HOLIDAY_ID ? DEMO_SUMS : NO_SUMS;
  const aside = Math.max(0, putAside(sums, byHand(goal, moves)));
  const pct = goal.target ? Math.min(100, Math.round((aside / goal.target) * 100)) : 0;
  const state: GoalState = paused ? 'paused' : aside >= goal.target ? 'reached' : aside ? 'running' : 'empty';
  return { goal, fed, paused, sums, aside, pct, state };
}

/** What would get there on the day: what is left over the months left, up to the next ₦500. */
export const monthlyFor = (s: Standing, today = new Date()) => Math.ceil(Math.max(0, s.goal.target - s.aside) / monthsTo(s.goal.due, today) / 500) * 500;

/** Beetle's word under a goal. The demo's Holiday says what its frames say. */
export function lineFor(s: Standing, { tight = false, today = new Date() }: { tight?: boolean; today?: Date } = {}): string {
  const by = dayWords(s.goal.due, today);
  const frames = s.goal.id === HOLIDAY_ID && s.goal.target === GOAL.target && by === GOAL.by;
  if (s.state === 'paused') {
    if (tight && frames) return `You told me money is tight, so I have stopped moving it. Your date moves from ${GOAL.by} to ${GOAL.pausedBy}. Nothing has been taken and nothing has been charged.`;
    if (tight) return 'You told me money is tight, so I have stopped moving money into your goals. Nothing has been taken and nothing has been charged.';
    return `Paused. Nothing goes in on its own until you start it again, and nothing has been taken. ${naira(s.aside)} is still yours, here.`;
  }
  if (s.state === 'reached') return `You got there: ${naira(s.aside)}. Take it out whenever you are ready, or keep it going.`;
  if (frames && s.state === 'running' && s.sums.payday) return `You are a fortnight ahead. Keep this up and you will get there on ${GOAL.early}.`;
  const monthly = monthlyFor(s, today);
  if (s.state === 'empty') return `Nothing in it yet. ${naira(monthly)} a month gets you there by ${by}.`;
  return `${naira(s.goal.target - s.aside)} to go. ${naira(monthly)} a month gets you there by ${by}.`;
}

/** All of them together, for home's Savings card. */
export function together(list: Standing[]): { aside: number; target: number; pct: number } {
  const aside = list.reduce((a, s) => a + s.aside, 0);
  const target = list.reduce((a, s) => a + s.goal.target, 0);
  return { aside, target, pct: target ? Math.min(100, Math.round((aside / target) * 100)) : 0 };
}

/* ---- the words that mean saving ---- */

/** "save 10k for rent", "put 5k away", "add ₦2,000 to my holiday goal", "I
    want to save": the Save card in the chat. A question about what to save
    for stays with Beetle, "save up for a car" starts a goal, and "send" is
    always a transfer. */
export function isSave(text: string, names: string[] = []): boolean {
  const lower = text.toLowerCase().trim();
  if (/\?$/.test(lower) || /\b(should i|what (to|should|do)|how (much|do|does)|saving for)\b/.test(lower)) return false;
  /* "save up for a car" with no figure is a goal to start, not money to put away */
  if (!amountIn(lower) && /\b(save|saving)( up)? for (an?|my) /.test(lower)) return false;
  if (/\b(put|stash|set|tuck|keep)\b.*\b(away|aside)\b/.test(lower)) return true;
  if (/^((i want|i'd like|i would like|help me|let me|i need) to |please )?save\b/.test(lower)) return true;
  if (!amountIn(lower) || !/\b(add|put|move)\b/.test(lower)) return false;
  if (/\b(to|into) (my |the )?([a-z]+ ){0,2}(goal|savings|pot)\b/.test(lower)) return true;
  const named = names.map(n => n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return named.some(w => new RegExp(`\\b(to|into) (my |the )?${w}\\b`).test(lower));
}

/** What the words ask to save: how much, and which goal where one is named. */
export function saveIn(text: string, goals: Goal[]): { amount?: number; goalId?: string } {
  const lower = text.toLowerCase();
  const amount = amountIn(lower) ?? undefined;
  const named = [...goals].sort((a, b) => b.name.length - a.name.length).find(g => lower.includes(g.name.toLowerCase()));
  return { amount, goalId: named?.id };
}
