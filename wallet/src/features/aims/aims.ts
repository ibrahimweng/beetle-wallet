/* What somebody wants Beetle for (Round 41, the owner's word): picked once,
   right after the account is ready, and changed in Settings. Beetle reads
   them every time it answers, so the help fits the person: the model is told
   them, the chat's first line follows the first one picked, and the chips
   over the ask bar lead with what they came for. Pure, so it can be tested
   on its own. */
import type { IconName } from '../../icons';

export const AIMS = [
  {
    id: 'save',
    label: 'Save money',
    sub: 'Put money aside and keep it there',
    glyph: 'pot',
    brief: 'They want to save. When money comes in, suggest putting some aside with the Save chip.',
    hello: 'Want to put something aside today?',
  },
  {
    id: 'track',
    label: 'Track my spending',
    sub: 'See where my money goes',
    glyph: 'chart',
    brief: 'They want to see where their money goes. Point them to Insights in Activities when spending comes up.',
    hello: 'Your spending is in Activities, under Insights.',
  },
  {
    id: 'learn',
    label: 'Learn ways to save',
    sub: 'Tips that fit how I spend',
    glyph: 'school',
    brief: 'They want to learn to save. Now and then add one short, practical tip, never a lecture.',
    hello: 'Tip: round ups put the change from each payment into your savings.',
  },
  {
    id: 'strict',
    label: 'Keep me strict',
    sub: 'Budgets, limits and a nudge when I overspend',
    glyph: 'shield',
    brief: 'They want to be kept strict with money. Be firm and kind: say when a payment is large next to their balance, and remind them their limits are in Settings.',
    hello: 'Set your daily limits in Settings and they hold.',
  },
  {
    id: 'daily',
    label: 'Small daily payments',
    sub: 'Food, transport, airtime and data',
    glyph: 'card',
    brief: 'They make many small daily payments: airtime, data, food, transport. Keep these fast and offer the usual.',
    hello: 'Airtime, data or a quick transfer?',
  },
  {
    id: 'salary',
    label: 'Get paid, pay rent and bills',
    sub: 'Salary in, rent and bills out',
    glyph: 'bank',
    brief: 'They get paid here and pay rent and bills. Around payday, remind them to cover rent and bills first.',
    hello: 'A bill, rent or a transfer?',
  },
  {
    id: 'family',
    label: 'Send money to family',
    sub: 'Regular money to people I support',
    glyph: 'send',
    brief: 'They send money to family. Offer the people they have paid before first.',
    hello: 'Sending to family today?',
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; sub: string; glyph: IconName; brief: string; hello: string }>;

export type AimId = (typeof AIMS)[number]['id'];
export type Aim = (typeof AIMS)[number];

export const isAim = (v: unknown): v is AimId => AIMS.some(a => a.id === v);

/** The aims kept, in the order they are listed, with anything unknown dropped. */
export const aimsOf = (kept: unknown): AimId[] => (Array.isArray(kept) ? AIMS.filter(a => kept.includes(a.id)).map(a => a.id) : []);

/** The aims as the model reads them, or nothing when none were picked. */
export function aimsBrief(aims: readonly AimId[]): string | null {
  const picked = AIMS.filter(a => aims.includes(a.id));
  if (!picked.length) return null;
  return `What the owner wants Beetle for: ${picked.map(a => a.label.toLowerCase()).join('; ')}.\n${picked.map(a => a.brief).join(' ')}`;
}

/** The chat's first line, after the name, from the first aim picked. */
export const aimHello = (aims: readonly AimId[]): string | null => AIMS.find(a => aims.includes(a.id))?.hello ?? null;

/** The chips over the ask bar each aim brings to the front, most wanted first. */
const LEADS: Record<AimId, string[]> = {
  save: ['save'],
  track: [],
  learn: ['save'],
  strict: [],
  daily: ['data', 'send'],
  salary: ['receive', 'bills'],
  family: ['send'],
};

/** The chips in the order the aims ask for: those they bring forward first, then the rest as they were. */
export function chipOrder<T extends { key: string }>(chips: readonly T[], aims: readonly AimId[]): T[] {
  const first: string[] = [];
  for (const a of AIMS) if (aims.includes(a.id)) for (const k of LEADS[a.id]) if (!first.includes(k)) first.push(k);
  const rank = (c: T) => (first.includes(c.key) ? first.indexOf(c.key) : first.length + chips.indexOf(c));
  return [...chips].sort((a, b) => rank(a) - rank(b));
}
