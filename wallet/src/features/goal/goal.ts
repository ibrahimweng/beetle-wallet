/* The goal the frames draw — Holiday, ₦250,000 by 12 March — and what feeds
   the first goal: the payday slice (the standing instruction on the Rules
   page), round ups from card payments and the cash back on top ups, each
   with what it has put into the demo's Holiday so far. The figures are the
   demo's own until an account service keeps them; any other goal starts
   from nothing. Several goals, and where each stands, are goals.ts. */
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

/** Beetle's word on the page of an account with no goal yet, as its frame says it. */
export const NO_GOAL_LINE = 'A goal works best when a rule feeds it. Tell me what you are saving for.';
