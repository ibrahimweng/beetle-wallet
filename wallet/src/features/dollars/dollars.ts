/* Dollars: what the demo account holds, where each dollar came from, the
   rate this build runs at, and the sums the pages do. The rate is the
   account's own (₦1,552 to the dollar, as the frames print it) until a
   market feed stands behind the app; the sources are the frame's three
   until a partner bank's ledger says otherwise. */
import type { IconName } from '../../icons';

/** how far the rate moved this week, the frame's way: up ₦18 in your favour */
export const RATE_MOVE = 18;
/** what a conversion costs: nothing under $500, one percent over */
export const FREE_UNDER_USD = 500;
export const CONVERT_FEE = 0.01;
/** the rate the demo's oldest dollars were bought at, for Beetle's word on holding them */
export const MARCH_RATE = 1_410;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** $32.22 from ₦50,000 at ₦1,552. */
export const usdOf = (nairaAmount: number, rate: number) => round2(nairaAmount / rate);
/** What a naira payment costs in dollars: rounded up to the cent, so a charge is never short of what goes (the analysis
    after Round 21: rounded to the nearest cent, ₦7 could go for $0.00). */
export const usdCost = (nairaAmount: number, rate: number) => (nairaAmount > 0 ? Math.ceil(Math.round((nairaAmount / rate) * 1e6) / 1e4) / 100 : 0);
/** ₦155,200 from $100 at ₦1,552. */
export const nairaOf = (usd: number, rate: number) => Math.round(usd * rate);
/** $412.60, $1,234.50: dollars the way the frames print them. */
export const usdFull = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** ₦1,552 to $1. */
export const rateLine = (rate: number) => `₦${rate.toLocaleString('en-NG')} to $1`;
/** The fee on a conversion: free while the day's conversions stay under $500, one percent once they reach it (the
    analysis after Round 34: a figure over $500 split into smaller ones went free). `today` is what was already
    converted today, either way. */
export const feeForUsd = (usd: number, today = 0) => (today + usd < FREE_UNDER_USD ? 0 : round2(usd * CONVERT_FEE));
/** Naira into dollars, down to the cent: never a cent more than the naira buys (the analysis after Round 34: rounded to
    the nearest, ₦1,545 bought $1.00, and turned back it was ₦1,552). */
export const usdIn = (nairaAmount: number, rate: number) => Math.floor(Math.round((nairaAmount / rate) * 1e6) / 1e4) / 100;
/** The dollars converted today, either way, from the day's lines. */
export const convertedToday = (rows: { kind: string; usd?: number; at?: number }[], now = new Date()) =>
  round2(rows.filter(r => r.kind === 'convert' && r.at !== undefined && new Date(r.at).toDateString() === now.toDateString()).reduce((a, r) => a + Math.abs(r.usd ?? 0), 0));

export type DollarSource = { id: string; glyph: IconName; title: string; sub: string; usd: number };

/** Where the demo's dollars came from, newest first, as the frame lists them. */
export const DEMO_SOURCES: DollarSource[] = [
  { id: 's1', glyph: 'swap', title: 'Converted from naira', sub: '12 August · at ₦1,534', usd: 180 },
  { id: 's2', glyph: 'down', title: 'From Musa Danjuma', sub: '28 July · for the generator', usd: 120 },
  { id: 's3', glyph: 'swap', title: 'Converted from naira', sub: '3 March · at ₦1,410', usd: 112.6 },
];

/** What the dollars come to: the account's own, plus every conversion and every payment from them on this phone. */
export const dollarsOf = (base: number, rows: { usd?: number }[]) => round2(base + rows.reduce((a, r) => a + (r.usd ?? 0), 0));

/** The dollars that came in on this phone, as sources, newest first: converted from naira, or arrived as USDC or USDT. */
export function sourcesOf(rows: { id: string; usd?: number; time: string; kind: string; name?: string }[], rate: number): DollarSource[] {
  return rows
    .filter(r => (r.usd ?? 0) > 0 && (r.kind === 'convert' || r.kind === 'coin'))
    .map(r =>
      r.kind === 'coin'
        ? { id: r.id, glyph: 'down', title: r.name ?? 'Coins in', sub: `Today ${r.time} · one coin to the dollar`, usd: r.usd ?? 0 }
        : { id: r.id, glyph: 'swap', title: 'Converted from naira', sub: `Today ${r.time} · at ₦${rate.toLocaleString('en-NG')}`, usd: r.usd ?? 0 },
    );
}

/** Beetle's word on holding dollars: what the same money would be worth in naira. Only the demo's were put away in March;
    any other account's word is what they are worth today (Round 33: the test dollars were told they came in March). */
export function heldLine(usd: number, rate: number, demo = true): string {
  if (usd <= 0) return 'Nothing here yet. Convert some naira and it stays in dollars until you turn it back, at the rate on the day.';
  if (!demo) return `Worth ₦${nairaOf(usd, rate).toLocaleString('en-NG')} at today’s rate. They stay in dollars until you turn them back, at the rate on the day.`;
  const less = Math.round((usd * (rate - MARCH_RATE)) / 100) * 100;
  return `You put these away in March at ₦${MARCH_RATE.toLocaleString('en-NG')}. Held in naira that same money would be worth ₦${less.toLocaleString('en-NG')} less than it is now.`;
}
