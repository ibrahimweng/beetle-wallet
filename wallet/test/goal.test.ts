/* Saving, Round 12: several goals and where each stands, what a new goal is
   filled with, the dates said the way the frames say them, what Beetle says
   under a goal, home's card for all of them together, and the words that
   mean saving, a new goal, or the goal page. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { DEMO_SUMS, GOAL, NO_SUMS, pctOf, putAside } from '../src/features/goal/goal';
import {
  HOLIDAY_ID,
  IDEAS,
  byHand,
  dayWords,
  dueIn,
  freeName,
  holiday,
  isSave,
  lineFor,
  monthlyFor,
  monthsTo,
  nextIdea,
  nextOn,
  saveIn,
  seedGoals,
  standingOf,
  together,
  type Goal,
} from '../src/features/goal/goals';
import { isGoal, newGoalIn, pageFor } from '../src/features/request/intent';
import { rowFrom } from '../src/features/home/moves';
import { receiptFor } from '../src/features/receipts/receipts';
import { DEMO_ACCOUNT } from '../src/services/auth';

const today = new Date('2026-10-03T10:00:00');
const rent: Goal = { id: 'rent', name: 'Rent', target: 600_000, due: '2027-10-03' };

describe('the frames’ goal', () => {
  it('adds up the frame’s ₦82,400 and a third of the way', () => {
    expect(putAside(DEMO_SUMS)).toBe(82_400);
    expect(pctOf(82_400)).toBe(33);
    expect(putAside(NO_SUMS)).toBe(0);
    expect(putAside(NO_SUMS, 5_000)).toBe(5_000);
    expect(GOAL.target).toBe(250_000);
  });
  it('is always aimed at the next 12 March', () => {
    expect(nextOn(2, 12, today)).toBe('2027-03-12');
    expect(nextOn(2, 12, new Date('2027-02-01T10:00:00'))).toBe('2027-03-12');
    expect(holiday(today)).toEqual({ id: HOLIDAY_ID, name: 'Holiday', target: 250_000, due: '2027-03-12' });
  });
  it('is what the demo starts with, and an account that started one before goals were kept', () => {
    expect(seedGoals(true, false, today).map(g => g.name)).toEqual(['Holiday']);
    expect(seedGoals(false, true, today).map(g => g.name)).toEqual(['Holiday']);
    expect(seedGoals(false, false, today)).toEqual([]);
  });
});

describe('dates, the way the frames say them', () => {
  it('moves on by whole months, and never past a month’s last day', () => {
    expect(dueIn(6, today)).toBe('2027-04-03');
    expect(dueIn(12, today)).toBe('2027-10-03');
    expect(dueIn(1, new Date('2026-01-31T10:00:00'))).toBe('2026-02-28');
  });
  it('says the day and the month, and the year only when it is most of a year away', () => {
    expect(dayWords('2027-03-12', today)).toBe('12 March');
    expect(dayWords('2027-10-03', today)).toBe('3 October 2027');
    expect(monthsTo('2027-10-03', today)).toBe(12);
    expect(monthsTo('2026-10-05', today)).toBe(1);
  });
});

describe('a new goal, filled', () => {
  it('starts with the first idea that is not a goal already', () => {
    expect(nextIdea([])).toEqual(IDEAS[0]);
    expect(nextIdea([holiday(today)]).name).toBe('Rent');
    expect(nextIdea([holiday(today), rent]).name).toBe('Emergency fund');
    expect(nextIdea(IDEAS.map((i, n) => ({ id: `${n}`, name: i.name, target: i.target, due: '2027-01-01' }))).name).toBe('Something new');
  });
  it('never takes a name another goal has', () => {
    expect(freeName('rent', [rent])).toBe('Rent 2');
    expect(freeName('  school   fees ', [rent])).toBe('School fees');
    expect(freeName('Rent', [rent], 'rent')).toBe('Rent');
    expect(freeName('', [])).toBe('My goal');
  });
});

describe('where a goal stands', () => {
  const goals = [holiday(today), rent];
  const put = (goal: Goal, amount: number) => rowFrom({ name: goal.name, detail: 'Put away · 10:00', amount: -amount, icon: 'pot', kind: 'saving', goal: goal.id }, 500_000, 17, today);
  const took = (goal: Goal, amount: number) => rowFrom({ name: goal.name, detail: 'Taken back · 10:05', amount, icon: 'pot', kind: 'saving', goal: goal.id }, 500_000, 18, today);
  it('holds the frame’s sums for the demo’s Holiday, and only what was put in for any other', () => {
    const moves = [put(rent, 50_000), took(rent, 10_000), put(goals[0]!, 5_000)];
    const h = standingOf(goals[0]!, { goals, demo: true, tight: false, moves });
    const r = standingOf(rent, { goals, demo: true, tight: false, moves });
    expect(h).toMatchObject({ fed: true, aside: 87_400, pct: 35, state: 'running' });
    expect(r).toMatchObject({ fed: false, aside: 40_000, pct: 7, state: 'running' });
    expect(byHand(rent, moves)).toBe(40_000);
  });
  it('counts a line from before goals had ids as Holiday’s, by its name', () => {
    const old = { kind: 'saving', name: 'Holiday', amount: -2_000 };
    expect(byHand(goals[0]!, [old])).toBe(2_000);
    expect(byHand(rent, [old])).toBe(0);
  });
  it('waits when paused by hand, or every goal while money is tight', () => {
    expect(standingOf({ ...rent, paused: true }, { goals, demo: false, tight: false, moves: [] }).state).toBe('paused');
    expect(standingOf(rent, { goals, demo: false, tight: true, moves: [] }).state).toBe('paused');
    expect(standingOf(rent, { goals, demo: false, tight: false, moves: [] }).state).toBe('empty');
    expect(standingOf(rent, { goals, demo: false, tight: false, moves: [put(rent, 600_000)] }).state).toBe('reached');
  });
  it('says what a month would get there, and the frames’ words for Holiday', () => {
    const empty = standingOf(rent, { goals, demo: false, tight: false, moves: [] });
    expect(monthlyFor(empty, today)).toBe(50_000);
    expect(lineFor(empty, { today })).toBe('Nothing in it yet. ₦50,000 a month gets you there by 3 October 2027.');
    const going = standingOf(rent, { goals, demo: false, tight: false, moves: [put(rent, 100_000)] });
    expect(lineFor(going, { today })).toBe('₦500,000 to go. ₦42,000 a month gets you there by 3 October 2027.');
    const h = standingOf(goals[0]!, { goals, demo: true, tight: false, moves: [] });
    expect(lineFor(h, { today })).toContain('26 February');
    const tight = standingOf(goals[0]!, { goals, demo: true, tight: true, moves: [] });
    expect(lineFor(tight, { tight: true, today })).toContain('12 March to 9 April');
    const paused = standingOf({ ...rent, paused: true }, { goals, demo: false, tight: false, moves: [put(rent, 1_000)] });
    expect(lineFor(paused, { today })).toContain('until you start it again');
  });
  it('adds them up for home’s card', () => {
    const list = goals.map(g => standingOf(g, { goals, demo: true, tight: false, moves: [] }));
    expect(together(list)).toEqual({ aside: 82_400, target: 850_000, pct: 10 });
    expect(together([])).toEqual({ aside: 0, target: 0, pct: 0 });
  });
});

describe('money out of a goal, on its receipt', () => {
  it('reads Taken back, from the goal into Everyday', () => {
    const row = rowFrom({ name: 'Rent', detail: 'Taken back · 10:05', amount: 10_000, icon: 'pot', kind: 'saving', goal: 'rent' }, 400_000, 18, today);
    expect(row.goal).toBe('rent');
    const r = receiptFor(row, { account: DEMO_ACCOUNT, balanceNow: 410_000, rows: [row] });
    expect(r.head).toBe('Taken back');
    expect(r.line).toBe('From Rent');
  });
});

describe('the words that mean saving', () => {
  it('puts the Save card up for money put away', () => {
    expect(isSave('save 10k')).toBe(true);
    expect(isSave('Save 5000 for rent')).toBe(true);
    expect(isSave('put 10k away')).toBe(true);
    expect(isSave('put some money aside')).toBe(true);
    expect(isSave('I want to save')).toBe(true);
    expect(isSave('add 2k to my holiday goal')).toBe(true);
    expect(isSave('move 5k into rent', ['Rent'])).toBe(true);
  });
  it('leaves questions, transfers and the rest with Beetle', () => {
    expect(isSave('what should I be saving for?')).toBe(false);
    expect(isSave('how much should I save')).toBe(false);
    expect(isSave('send 10k to sarah')).toBe(false);
    expect(isSave('move 5k into rent')).toBe(false);
    expect(isSave('my savings goal')).toBe(false);
    expect(isSave('I want to save up for a car')).toBe(false);
  });
  it('reads how much, and the goal where one is named', () => {
    const goals = [holiday(today), rent];
    expect(saveIn('save 10k for rent', goals)).toEqual({ amount: 10_000, goalId: 'rent' });
    expect(saveIn('put ₦5,000 away', goals)).toEqual({ amount: 5_000, goalId: undefined });
  });
  it('opens a new goal, named where the words name it', () => {
    expect(newGoalIn('start a goal')).toEqual({});
    expect(newGoalIn('new savings goal')).toEqual({});
    expect(newGoalIn('I want to save up for a car')).toEqual({ name: 'A car' });
    expect(newGoalIn('saving for my wedding')).toEqual({ name: 'Wedding' });
    expect(newGoalIn('save 10k for a car')).toBeNull();
    expect(pageFor('start a goal')).toBe('/goal?new=1');
    expect(pageFor('save up for a car')).toBe('/goal?new=1&name=A%20car');
    expect(pageFor('my savings goal')).toBe('/goal');
    expect(isGoal('how is my saving going')).toBe(true);
    expect(pageFor('what should I be saving for?')).toBeNull();
  });
});
