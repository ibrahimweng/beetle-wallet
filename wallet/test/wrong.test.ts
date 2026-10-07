/* Round 7: a dispute from the day it opens to the day it closes, the rules
   Beetle keeps before money moves, what it checked before filling a
   transfer in, the offline words, and when a transfer repeats. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-router', () => ({ useFocusEffect: () => undefined, useRouter: () => ({}) }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { DAYS, DEMO_DISPUTE, closedDemo, closingLetter, filedWords, newDispute, stepsOf, whereLines } from '../src/features/dispute/dispute';
import { OFFLINE_LINE, TRY_FIRST, accountAge, refusalLine, refuses, wantsEverything } from '../src/services/rules';
import { checksOf, sureLine } from '../src/features/send/rules';
import { lastCheckedLine, minutesOffline } from '../src/features/offline/online';
import { whenAgain } from '../src/features/settings/again';
import type { LedgerRow } from '../src/features/home/account';

const row: LedgerRow = {
  id: 'r1',
  day: 'today',
  time: '09:14',
  icon: 'send',
  name: 'Sarah Adeyemi',
  detail: 'GTBank · sent · 09:14',
  amount: -20_000,
  status: 'done',
  kind: 'transfer',
  person: { bank: 'GTBank', number: '0234567890' },
};

describe('a dispute', () => {
  it('opens today, filed at once, with the answer due in a week', () => {
    const d = newDispute(row, 'trace', new Date('2026-08-28T10:00:00'));
    expect(d).toMatchObject({
      rowId: 'r1',
      kind: 'trace',
      amount: 20_000,
      name: 'Sarah Adeyemi',
      bank: 'GTBank',
      opened: '28 Aug',
      openedLong: '28 August',
      decisionBy: '4 September',
      day: 1,
      status: 'open',
    });
    expect(stepsOf(d).map(s => [s.label, s.value, s.done])).toEqual([
      ['You reported it', '28 Aug', true],
      ['Filed with GTBank', '28 Aug', true],
      ['GTBank acknowledged', 'Waiting', false],
      ['Their decision', 'By 4 September', false],
    ]);
    expect(stepsOf(newDispute(row, 'fraud'))[1]?.label).toBe('Card frozen');
    expect(stepsOf(newDispute(row, 'recall'))[1]?.label).toBe('Sarah asked to approve');
  });
  it("is the frame's on the demo account, day three of five, and closes the frame's way", () => {
    expect(DAYS).toBe(5);
    expect(stepsOf(DEMO_DISPUTE)[2]).toEqual({ label: 'GTBank acknowledged', value: '29 Aug', done: true });
    const w = whereLines(DEMO_DISPUTE);
    expect(w.notes[2]?.text).toContain('4 September');
    expect(w.foot).toContain('watch this screen');
    const c = closedDemo();
    expect(c.status).toBe('closed');
    expect(stepsOf(c).map(s => s.value)).toEqual(['28 Aug', '3 Sep', '11:40']);
    expect(closingLetter(c)).toContain('3 September');
    expect(closingLetter(c)).toContain('11:40');
  });
  it('says what was filed, word for word', () => {
    expect(filedWords(DEMO_DISPUTE)).toContain('Filed with GTBank on 28 August');
    expect(filedWords(DEMO_DISPUTE)).toContain('₦20,000 sent to Sarah Adeyemi (GTBank) at 14:22');
    expect(filedWords(newDispute(row, 'fraud'))).toContain('card has been frozen');
  });
});

describe('the rules before money moves', () => {
  it('stops the whole balance to somebody never paid, and nothing else', () => {
    expect(refuses(595_320, 595_320, false)).toBe(true);
    expect(refuses(595_320, 595_320, true)).toBe(false);
    expect(refuses(20_000, 595_320, false)).toBe(false);
    expect(refuses(0, 0, false)).toBe(false);
    /* All of it: the balance less the fee, rounded down to the naira, leaves a few kobo, and is still all of it */
    expect(refuses(575_240, 575_293.87, false)).toBe(true);
    expect(refuses(249_946, 250_000, false)).toBe(true);
    expect(refuses(575_239, 575_293.87, false)).toBe(false);
    /* to a Beetle account there is no fee to count */
    expect(refuses(30_000, 30_000, false, 'Beetle')).toBe(true);
    expect(refuses(29_999, 30_000, false, 'Beetle')).toBe(false);
    expect(accountAge(false)).toBe('Four minutes');
    expect(accountAge(true)).toBeUndefined();
    expect(TRY_FIRST).toBe(20_000);
  });
  it('hears "everything" and says why it stopped', () => {
    expect(wantsEverything('send everything to 0123456789')).toBe(true);
    expect(wantsEverything('send my whole balance to musa')).toBe(true);
    expect(wantsEverything('send 20k to sarah')).toBe(false);
    expect(refusalLine('₦595,320', '₦20,000')).toContain('four minutes old');
    expect(refusalLine('₦595,320', '₦20,000')).toContain('send ₦20,000 first');
    expect(OFFLINE_LINE).toContain('balance I cannot check');
  });
});

describe('what Beetle checked before filling a transfer in', () => {
  it('is sure of the name, the history and the bank, and not of an amount read off a photo', () => {
    const checks = checksOf('Sarah', 'GTBank', 14, true, false);
    expect(checks.map(c => [c.label, c.value])).toEqual([
      ['Read the name Sarah', 'Certain'],
      ['Matched 14 past payments', 'Certain'],
      ['Confirmed the account with GTBank', 'Certain'],
      ['Read the amount', 'Not certain'],
    ]);
    expect(sureLine(checks)).toBe('Three of the four I am sure about.');
    expect(checksOf('Sarah', 'GTBank', 1, false, false)[1]?.label).toBe('Matched 1 past payment');
    expect(checksOf('Ada', 'Kuda', 0, false, true).map(c => c.value)).toEqual(['Certain', 'Not certain', 'Certain', 'Certain']);
    expect(checksOf('Sarah', 'GTBank', 14, false, false)[3]?.value).toBe('Not read');
  });
});

describe('offline', () => {
  it('counts the minutes and says them', () => {
    expect(minutesOffline()).toBe(0);
    expect(lastCheckedLine(0)).toBe('Last checked just now');
    expect(lastCheckedLine(1)).toBe('Last checked a minute ago');
    expect(lastCheckedLine(12)).toBe('Last checked 12 minutes ago');
  });
});

describe('when a transfer repeats', () => {
  it('reads it off what it was for', () => {
    expect(whenAgain('Rent part payment')).toBe('The first of every month');
    expect(whenAgain('Grocery shopping')).toBe('Every Friday');
    expect(whenAgain('School fees')).toBe('The start of every term');
    expect(whenAgain('Flat deposit')).toBe('The first of every month');
    expect(whenAgain(undefined)).toBe('The same day every month');
  });
});
