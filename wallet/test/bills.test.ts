/* Round 5: a bill and a top-up read off a photo, what a bill buys, the
   month's bills, the bundles around one, and what a loan costs. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { BILL_TEXT, MockReader, TOPUP_TEXT, billIn, topupIn } from '../src/services/reader';
import { DEMO_MONTH, buysWords, billerById, monthOf, paidBills } from '../src/features/bills/billers';
import { LOAN, TERMS, costOf, countWord, dayOf, held } from '../src/features/loan/loan';
import { isBills, isLoan, isServices, pageFor } from '../src/features/request/intent';
import { serviceFor } from '../src/features/services/services';

describe('a bill off a photo', () => {
  it('reads the company, the meter, the figure and the address', () => {
    expect(billIn(BILL_TEXT)).toEqual({ disco: 'ikeja', meterKind: 'prepaid', meter: '44578891', amount: 8_000, address: '14 Bode Thomas' });
  });
  it('is not fooled by a message with a phone number in it', () => {
    expect(billIn(TOPUP_TEXT)).toBeNull();
  });
  it('comes back from the stand-in reader as a bill', async () => {
    const r = await new MockReader().read('file:///sample-bill.png');
    expect(r.bill?.meter).toBe('44578891');
    expect(r.request).toBeUndefined();
  });
});

describe('a top-up off a photo', () => {
  it('reads whose line, the network, the figure and that it is data', () => {
    expect(topupIn(TOPUP_TEXT)).toEqual({ from: 'Mum', line: '08032144471', network: 'MTN', amount: 2_000, data: true });
  });
  it('knows airtime from data, and the network from the prefix', () => {
    expect(topupIn('Bros send me 500 airtime 0805 331 0921')).toMatchObject({ line: '08053310921', network: 'Glo', amount: 500, data: false });
  });
  it('comes back from the stand-in reader as a top-up', async () => {
    const r = await new MockReader().read('file:///sample-topup.png');
    expect(r.topup?.from).toBe('Mum');
  });
});

describe('the bills', () => {
  it('adds the month up and counts what is covered', () => {
    expect(monthOf(DEMO_MONTH)).toEqual({ total: 40_000, covered: 3, open: 2, count: 5 });
  });
  it('says what a figure buys at each biller', () => {
    expect(buysWords(billerById('ikeja')!, 8_000)).toBe('About 38 kWh');
    expect(buysWords(billerById('ikeja')!, 3_000)).toBe('About 14 kWh');
    expect(buysWords(billerById('dstv')!, 25_000)).toBe('Two months');
    expect(buysWords(billerById('spectranet')!, 30_000)).toBe('200GB');
  });
});

describe('what a loan costs', () => {
  it("comes to the frame's figures for ₦150,000 over 90 days", () => {
    const c = costOf(150_000, 90, new Date('2026-08-20T09:00:00'));
    expect(c).toMatchObject({ interest: 18_000, fee: 1_500, total: 169_500, payments: 3, each: 56_500 });
    expect(dayOf(c.first)).toBe('19 September');
    expect(countWord(c.payments)).toBe('Three');
  });
  it('holds the figure to the range and the step', () => {
    expect(held(5_000)).toBe(LOAN.least);
    expect(held(300_000)).toBe(LOAN.most);
    expect(held(154_000)).toBe(150_000);
    expect(TERMS).toEqual([30, 60, 90]);
  });
});

describe('the words that open the new pages', () => {
  it('knows bills, a loan and the drawer', () => {
    expect(isBills('what do I owe this month')).toBe(true);
    expect(isLoan('how much can I borrow')).toBe(true);
    expect(isServices('all services')).toBe(true);
    expect(pageFor('my bills')).toBe('/bills');
    expect(pageFor('borrow 50k')).toBe('/loan');
    expect(pageFor('send 5k to sarah')).toBeNull();
  });
  it('finds a service by its name or a word for it', () => {
    expect(serviceFor('data')?.to).toBe('/buy');
    expect(serviceFor('light')?.to).toBe('/pay?biller=ikeja');
    expect(serviceFor('dstv')?.label).toBe('Cable TV');
    expect(serviceFor('the weather')).toBeNull();
  });
});

describe('the bills a new account pays, kept (Round 33)', () => {
  it('keeps one row a biller, the latest, after the month the frame draws', () => {
    const rows = [
      { kind: 'bill', name: 'Bet9ja', amount: -1_000, status: 'done', at: 1 },
      { kind: 'bill', name: 'Bet9ja', amount: -5_000, status: 'done', at: 2 },
      { kind: 'bill', name: 'Lagos Water', amount: -3_500, status: 'failed', at: 3 },
      { kind: 'bill', name: 'LAWMA waste', amount: -2_000, status: 'done', at: 4 },
      { kind: 'transfer', name: 'Sarah', amount: -20_000, status: 'done', at: 5 },
    ];
    const kept = paidBills(rows, DEMO_MONTH);
    expect(kept.map(b => [b.biller, b.amount, b.covered, b.to])).toEqual([['bet9ja', 5_000, 'paid', '/pay?biller=bet9ja']]);
    expect(paidBills(rows).map(b => b.biller)).toEqual(['lawma', 'bet9ja']);
  });
  it('says what a figure buys at the new billers', () => {
    expect(buysWords(billerById('bet9ja')!, 5_000)).toBe('Into the wallet');
    expect(buysWords(billerById('waec')!, 10_000)).toBe('Two PINs');
    expect(buysWords(billerById('lwc')!, 7_000)).toBe('Two months');
  });
});
