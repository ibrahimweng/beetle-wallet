import { describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async (k: string) => store.get(k) ?? null, setItem: async (k: string, v: string) => void store.set(k, v), removeItem: async (k: string) => void store.delete(k) },
}));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));

import { DEMO_PLAN, affordCheck, affordWords, dollarsIn, isAffordAsk, nextPay, nextQuestion, planFrom, thingIn, type Draft } from '@/features/afford/plan';
import { ScriptedAgent, type Context } from '@/services/agent';
import { MockMeters } from '@/services/nigeria';
import { MockReader } from '@/services/reader';
import { DEMO_ACCOUNT } from '@/services/auth';

/* the 18th: the light (10th) and Netflix (3rd) and data (1st) are gone for this month, so the next ones fall after payday */
const NOW = new Date(2026, 10, 18, 12);

describe('holding a purchase to the month', () => {
  it('sets aside every bill and saving before the next pay, and food until then', () => {
    const c = affordCheck(DEMO_PLAN, 595_320, 10_000, 'a plate of food', NOW);
    expect(c.payday).toBe('the 25th');
    expect(c.days).toBe(7);
    expect(c.essentials).toBe(28_000);
    /* nothing of the plan falls between the 18th and the 25th */
    expect(c.reserved).toBe(0);
    expect(c.verdict).toBe('yes');
    expect(c.after).toBe(595_320 - 28_000 - 10_000);
    expect(c.rows.every(r => r.label && r.amount > 0)).toBe(true);
  });
  it('says tight, then no, as the balance shrinks', () => {
    expect(affordCheck(DEMO_PLAN, 60_000, 10_000, 'food', NOW).verdict).toBe('yes');
    expect(affordCheck(DEMO_PLAN, 40_000, 10_000, 'food', NOW).verdict).toBe('tight');
    const no = affordCheck(DEMO_PLAN, 30_000, 10_000, 'food', NOW);
    expect(no.verdict).toBe('no');
    expect(affordWords(no)).toMatch(/^Not right now/);
  });
  it('counts what falls before payday, early in the month', () => {
    const early = affordCheck(DEMO_PLAN, 200_000, 10_000, 'food', new Date(2026, 10, 2, 9));
    /* Netflix on the 3rd and the light on the 10th come out of what is there now */
    expect(early.reserved).toBe(5_200 + 15_000);
    expect(early.rows.find(r => r.label === 'Netflix')?.from).toBe('now');
    expect(early.rows.find(r => r.label === 'Rent savings')?.from).toBe('pay');
  });
  it('words it the way a person would', () => {
    const w = affordWords(affordCheck(DEMO_PLAN, 595_320, 15_520, 'food', NOW, 10));
    expect(w).toMatch(/^Yes, you can buy food for \$10 \(about ₦15,520\)/);
    expect(w).toContain('rent savings');
    expect(w).toContain('a day until the 25th');
  });
  it('the next pay: today, this month or next, or the coming Friday', () => {
    expect(nextPay({ payday: 25, every: 'month' }, new Date(2026, 10, 25)).said).toBe('the 25th');
    expect(nextPay({ payday: 15, every: 'month' }, new Date(2026, 10, 18)).said).toBe('the 15th');
    expect(nextPay({ payday: 0, every: 'week' }, new Date(2026, 10, 18)).said).toBe('Friday');
  });
});

describe('reading the ask', () => {
  it('knows an afford ask, in naira or dollars', () => {
    expect(isAffordAsk('can i afford a plate of food for 10k')).toBe(true);
    expect(isAffordAsk('i want to buy food of $10, will i be able to afford it?')).toBe(true);
    expect(isAffordAsk('send 10k to sarah')).toBe(false);
    expect(dollarsIn('food of $10')).toBe(10);
    expect(dollarsIn('15 dollars of food')).toBe(15);
    expect(dollarsIn('₦10,000')).toBeNull();
  });
  it('names what is being bought', () => {
    expect(thingIn('I want to buy a plate of food that costs 10,000 naira')).toBe('a plate of food');
    expect(thingIn('Can I afford ₦10,000 at the restaurant?')).toBe('the meal');
  });
});

describe('a new account’s month, a tap at a time', () => {
  it('puts the answer setting up points to first, and why', () => {
    const q = nextQuestion({}, { income: 'business' })!;
    expect(q.id).toBe('income');
    expect(q.options[0]!.id).toBe('week');
    expect(q.options[0]!.sub).toMatch(/your own business/);
  });
  it('ticks the bills the aims point to', () => {
    const q = nextQuestion({ income: 'month-end', band: 'b2' }, { aims: ['family', 'salary'] })!;
    expect(q.multi).toBe(true);
    expect(q.options.filter(o => o.likely).map(o => o.id)).toEqual(['rent', 'light', 'family']);
  });
  it('asks rent only where rent was ticked, and ends with a plan', () => {
    const d: Draft = { income: 'month-end', band: 'b2', bills: ['light', 'data'] };
    expect(nextQuestion(d, {})!.id).toBe('daily');
    const done = { ...d, daily: 'd2' };
    expect(nextQuestion(done, {})).toBeNull();
    const plan = planFrom(done);
    expect(plan.pay).toBe(175_000);
    expect(plan.daily).toBe(4_000);
    expect(plan.commitments.map(c => c.id).sort()).toEqual(['data', 'light']);
  });
});

describe('Beetle, asked', () => {
  const agent = new ScriptedAgent(new MockReader(0), 0, new MockMeters(0));
  const demo: Context = { account: DEMO_ACCOUNT, balance: 595_320.75, rate: 1552, pending: null, now: NOW };
  it('answers the demo account at once, with the card', async () => {
    const r = await agent.ask({ text: 'I want to buy a plate of food that costs 10,000 naira. Can I afford it?' }, demo);
    expect(r.blocks[0]).toMatchObject({ kind: 'say' });
    expect((r.blocks[0] as { text: string }).text).toMatch(/^Yes, you can/);
    expect(r.blocks.some(b => b.kind === 'afford')).toBe(true);
  });
  it('turns dollars into naira at the rate', async () => {
    const r = await agent.ask({ text: 'Can I afford food of $10?' }, demo);
    const card = r.blocks.find(b => b.kind === 'afford') as { check: { cost: number; usd: number } };
    expect(card.check.cost).toBe(15_520);
    expect(card.check.usd).toBe(10);
  });
  it('asks a new account its month by taps, then answers and remembers', async () => {
    const fresh: Context = { account: { ...DEMO_ACCOUNT, demo: false, accountNumber: '0155550001' }, balance: 120_000, rate: 1552, pending: null, now: NOW, aims: ['salary'] };
    let r = await agent.ask({ text: 'Can I afford ₦10,000 of food?' }, fresh);
    expect(r.blocks.some(b => b.kind === 'choose')).toBe(true);
    const picks: Record<string, string[]> = { income: ['month-end'], band: ['b2'], bills: ['rent', 'light'], rent: ['r2'], daily: ['d2'] };
    for (let i = 0; i < 6 && r.pending?.need === 'plan'; i++) {
      const p = r.pending;
      r = await agent.ask({ choice: { chooseId: p.chooseId, picked: picks[p.question.id]! } }, { ...fresh, pending: p });
    }
    expect(r.pending).toBeNull();
    expect(r.blocks.some(b => b.kind === 'afford')).toBe(true);
    /* asked again, it answers straight away */
    const again = await agent.ask({ text: 'Can I afford ₦5,000 of food?' }, fresh);
    expect(again.blocks.some(b => b.kind === 'choose')).toBe(false);
    expect(again.blocks.some(b => b.kind === 'afford')).toBe(true);
  });
});
