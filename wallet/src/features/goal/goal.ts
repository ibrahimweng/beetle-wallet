/* The goal the frames draw — Holiday, ₦250,000 by 12 March — and what feeds
   it: the payday slice (the standing instruction on the Rules page), round
   ups from card payments and the cash back on top ups, each with what it
   has put in so far. The figures are the demo's own until an account
   service keeps them; a new account's goal starts from nothing. */
import type { IconName } from '../../icons';

export const GOAL = {
  name: 'Holiday',
  target: 250_000,
  by: '12 March',
  early: '26 February',
  /** where the date moves to while things are tight */
  pausedBy: '9 April',
  pausedSince: '3 August',
} as const;

export type FeedId = 'payday' | 'roundups' | 'cashback';

export type Feed = {
  id: FeedId;
  glyph: IconName;
  /** the goal page's words */
  title: string;
  how: string;
  /** the sheet's words for the same thing */
  pick: string;
  pickHow: string;
  /** what it brings in a month */
  monthly: number;
  /** waits while money is tight; cash back keeps coming */
  pausable: boolean;
};

export const FEEDS: Feed[] = [
  { id: 'payday', glyph: 'gift', title: 'Payday transfer', how: '₦20,000 every month', pick: 'A slice of payday', pickHow: '10% the day your salary lands', monthly: 20_000, pausable: true },
  { id: 'roundups', glyph: 'swap', title: 'Round ups', how: 'The change from card payments', pick: 'Round ups', pickHow: 'The change from every card payment', monthly: 2_280, pausable: true },
  {
    id: 'cashback',
    glyph: 'card',
    title: 'Money back on top ups',
    how: 'Instead of cash back',
    pick: 'Money back on top ups',
    pickHow: 'Cash back comes here instead of out',
    monthly: 120,
    pausable: false,
  },
];

/** What each feed has put in so far on the demo account, as the frame prints it. */
export const DEMO_SUMS: Record<FeedId, number> = { payday: 80_000, roundups: 2_280, cashback: 120 };
export const NO_SUMS: Record<FeedId, number> = { payday: 0, roundups: 0, cashback: 0 };

/** What the goal holds: what the feeds have put in, plus what was added by hand. */
export const putAside = (sums: Record<FeedId, number>, added = 0) => FEEDS.reduce((a, f) => a + sums[f.id], 0) + added;

/** 33, from ₦82,400 of ₦250,000. */
export const pctOf = (aside: number, target = GOAL.target) => Math.min(100, Math.round((aside / target) * 100));

export type FeedRow = { id: FeedId; glyph: IconName; title: string; sub: string; value: string; tone: 'accent' | 'quiet' };

/** A feed's row on the goal page: on, paused while things are tight, or turned off. */
export function feedRow(f: Feed, on: boolean, paused: boolean, sum: number): FeedRow {
  if (!on) return { id: f.id, glyph: f.glyph, title: f.title, sub: 'Turned off', value: 'Off', tone: 'quiet' };
  if (paused && f.pausable) return { id: f.id, glyph: f.glyph, title: f.title, sub: `Paused since ${GOAL.pausedSince}`, value: 'Paused', tone: 'quiet' };
  return { id: f.id, glyph: f.glyph, title: f.title, sub: paused ? 'Still going in' : f.how, value: `₦${sum.toLocaleString('en-NG')}`, tone: 'accent' };
}

/** Beetle's word on the goal, as the frames say it. */
export function goalLine(state: 'none' | 'empty' | 'running' | 'paused'): string {
  if (state === 'none') return 'A goal works best when a rule feeds it. Tell me what you are saving for.';
  if (state === 'empty') return 'Nothing in it yet. Add money, or let a rule feed it, and I keep count here.';
  if (state === 'paused') return `You told me money is tight, so I have stopped moving it. Your date moves from ${GOAL.by} to ${GOAL.pausedBy}. Nothing has been taken and nothing has been charged.`;
  return `You are a fortnight ahead. Keep this up and you will get there on ${GOAL.early}.`;
}
