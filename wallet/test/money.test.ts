/* The money fixes after the analysis of Round 21: what a payment takes out
   and when it is more than Everyday holds, the days a line moves through,
   the caps, the freeze and the wait, loans that add up and a limit that
   counts what is out, payments from dollars rounded up, and a changed amount
   that redraws its panel. */
import { vi } from 'vitest';
/* the services reach for the phone's storage; here they get stand-ins, as in agent.test.ts */
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { dayName, daysAgo, localIsoDay, sessionWhen } from '../src/lib/days';
import { CAPS, COOL_MS, pastCap, spentToday, stoppedBy } from '../src/features/settings/gate';
import { LOAN, costOf, eachWords, leftToBorrow, limitNote, nextPayment, owedIn } from '../src/features/loan/loan';
import { usdCost } from '../src/features/dollars/dollars';
import { overLine, takesOut } from '../src/services/rules';
import { PEOPLE, billPanelFor, transferPanel, withAmount } from '../src/services/agent';

const naira = (n: number) => '₦' + Math.floor(Math.abs(n)).toLocaleString('en-NG');

describe('what a payment takes out', () => {
  it('is the money and its fee going out, and nothing coming in', () => {
    expect(takesOut({ amount: -20_000 }, 20_026.88)).toBe(20_026.88);
    expect(takesOut({ amount: -8_000 }, undefined)).toBe(8_000);
    expect(takesOut({ amount: 50_000 }, 50_000)).toBe(0);
    expect(takesOut(undefined, 5_000)).toBe(0);
    expect(overLine('₦20,026.88', '₦10,000')).toContain('more than the ₦10,000 in Everyday');
  });
});

describe('the day a line is on', () => {
  const now = new Date(2026, 9, 8, 10, 0);
  it('is today, yesterday or earlier by this phone’s calendar', () => {
    expect(dayName(new Date(2026, 9, 8, 0, 30).getTime(), now)).toBe('today');
    expect(dayName(new Date(2026, 9, 7, 23, 59).getTime(), now)).toBe('yesterday');
    expect(dayName(new Date(2026, 9, 6, 21, 0).getTime(), now)).toBe('earlier');
    expect(daysAgo(new Date(2026, 9, 1).getTime(), now)).toBe(7);
  });
  it('reads the moment out of a session id, for lines kept before they kept their moment', () => {
    const at = sessionWhen('000017 261006 213647 123456 654321');
    expect(at).toBe(new Date(2026, 9, 6, 21, 36, 47).getTime());
    expect(sessionWhen('nothing like one')).toBeUndefined();
  });
  it('dates a receipt by the phone’s own day, not the UTC one', () => {
    expect(localIsoDay(new Date(2026, 9, 7, 0, 30))).toBe('2026-10-07');
  });
});

describe('the gate beyond the passcode', () => {
  it('counts what left today, not what went into a goal', () => {
    const rows = [
      { day: 'today' as const, status: 'done' as const, amount: -20_000, kind: 'transfer' as const },
      { day: 'today' as const, status: 'done' as const, amount: -5_000, kind: 'saving' as const },
      { day: 'yesterday' as const, status: 'done' as const, amount: -9_000, kind: 'bill' as const },
      { day: 'today' as const, status: 'pending' as const, amount: -1_000, kind: 'transfer' as const },
      { day: 'today' as const, status: 'done' as const, amount: 50_000, kind: 'in' as const },
    ];
    expect(spentToday(rows)).toBe(20_000);
  });
  it('stops past one transfer’s cap, or the day’s', () => {
    expect(pastCap(CAPS.transfer, 0)).toBeNull();
    expect(pastCap(CAPS.transfer + 1, 0)).toContain('over the ₦50,000 you set for one transfer');
    expect(pastCap(30_000, 80_000)).toContain('over the ₦100,000 you set for one day');
    expect(pastCap(20_000, 80_000)).toBeNull();
  });
  it('holds everything back while frozen, and for twelve hours after a new passcode', () => {
    const now = new Date(2026, 9, 8, 21, 36).getTime();
    expect(stoppedBy({ frozen: true }, now)).toContain('frozen');
    expect(stoppedBy({ frozen: false, sendAfter: now + COOL_MS }, now)).toContain('09:36 tomorrow');
    expect(stoppedBy({ frozen: false, sendAfter: now - 1 }, now)).toBeNull();
    expect(stoppedBy({ frozen: false }, now)).toBeNull();
    /* the day after a recovery: ₦20,000 can leave and no more, then the hold is over */
    const hold = { frozen: false, hold: { until: now + 24 * 60 * 60 * 1000 } };
    expect(stoppedBy(hold, now, 15000, 0)).toBeNull();
    expect(stoppedBy(hold, now, 15000, 10000)).toContain('₦10,000 of it is left');
    expect(stoppedBy(hold, now, 25000, 0)).toContain('no more than ₦20,000');
    expect(stoppedBy({ ...hold, hold: { until: now - 1 } }, now, 25000, 0)).toBeNull();
  });
});

describe('a loan', () => {
  it('has payments that come to what is paid back, to the naira', () => {
    const c = costOf(50_000, 90);
    expect(c.total).toBe(56_500);
    expect(c.each * (c.payments - 1) + c.last).toBe(c.total);
    expect(eachWords(c, naira)).toBe('₦18,833, the last ₦18,834');
    const even = costOf(150_000, 90);
    expect(even.last).toBe(even.each);
    expect(eachWords(even, naira)).toBe('₦56,500');
  });
  it('counts what is already out against the limit', () => {
    const out = [
      { kind: 'in', name: 'Beetle Loans', amount: 200_000 },
      { kind: 'in', name: 'Musa Danjuma', amount: 20_000 },
    ];
    expect(leftToBorrow([])).toBe(LOAN.most);
    expect(leftToBorrow(out)).toBe(50_000);
    expect(leftToBorrow([...out, { kind: 'in', name: 'Beetle Loans', amount: 50_000 }])).toBe(0);
    expect(limitNote(50_000, naira)).toBe('₦50,000 is left of your limit');
    expect(limitNote(0, naira)).toContain('all of your limit');
  });
});

describe('a payment from dollars', () => {
  it('costs the dollars rounded up to the cent, never a cent short', () => {
    expect(usdCost(7, 1_552)).toBe(0.01);
    expect(usdCost(155_200, 1_552)).toBe(100);
    expect(usdCost(1_915.17, 1_552)).toBe(1.24);
    expect(usdCost(0, 1_552)).toBe(0);
  });
});

describe('a panel whose amount changes', () => {
  it('is drawn again: a transfer’s fee follows the amount', () => {
    const p = transferPanel(PEOPLE[0]!, 5_000);
    const q = withAmount(p, 20_000);
    expect(q.id).toBe(p.id);
    expect(q.action?.amount).toBe(20_026.88);
    expect(q.move?.fee).toBe(26.88);
    expect(q.rows.find(r => r.label === 'Fee')?.value).not.toBe(p.rows.find(r => r.label === 'Fee')?.value);
  });
  it('is drawn again: a bill’s units and token follow the amount', () => {
    const meter = { disco: 'ikeja', meterKind: 'prepaid' as const, meter: '44578891', name: 'Ibrahim Musa', label: 'Home' };
    const p = billPanelFor(meter, 8_000);
    const q = withAmount(p, 20_000);
    expect(q.rows.find(r => r.label === 'Units')?.value).toBe(billPanelFor(meter, 20_000).rows.find(r => r.label === 'Units')?.value);
    expect(q.move?.reference).toBe(billPanelFor(meter, 20_000).move?.reference);
    expect(q.move?.reference).not.toBe(p.move?.reference);
  });
});

describe('a loan paid back (Round 33)', () => {
  const taken = { kind: 'in', name: 'Beetle Loans', amount: 150_000, detail: 'Loan · 90 days · 09:41' };
  it('owes the loan’s total, interest and fee with it, and frees the limit as it is paid', () => {
    expect(owedIn([taken])).toBe(169_500);
    expect(nextPayment([taken])).toBe(56_500);
    expect(leftToBorrow([taken])).toBe(100_000);
    const one = { kind: 'bill', name: 'Beetle Loans', amount: -56_500, detail: 'Paid back · 10:00' };
    expect(owedIn([taken, one])).toBe(113_000);
    expect(leftToBorrow([taken, one])).toBe(150_000);
    const rest = { kind: 'bill', name: 'Beetle Loans', amount: -113_000, detail: 'Paid back · 10:05' };
    expect(owedIn([taken, one, rest])).toBe(0);
    expect(nextPayment([taken, one, rest])).toBe(0);
    expect(leftToBorrow([taken, one, rest])).toBe(LOAN.most);
  });
});
