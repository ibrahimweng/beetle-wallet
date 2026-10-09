/* Round 6: the sums the dollars pages do, the health rows, the words typed
   at home that open the new pages, and the ledger's naira balance when a
   line is paid from the dollars. The goals have goal.test.ts. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-router', () => ({ useFocusEffect: () => undefined, useRouter: () => ({}) }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { DEMO_SOURCES, FREE_UNDER_USD, dollarsOf, feeForUsd, heldLine, nairaOf, rateLine, sourcesOf, usdFull, usdOf } from '../src/features/dollars/dollars';
import { healthLine, healthRows } from '../src/features/health/health';
import { DEFAULT_PREFS } from '../src/features/settings/prefs';
import { isConvert, isGoal, isHealth, pageFor } from '../src/features/request/intent';
import { serviceFor } from '../src/features/services/services';
import { balanceOf, rowFrom } from '../src/features/home/moves';
import { receiptFor } from '../src/features/receipts/receipts';
import { DEMO_ACCOUNT } from '../src/services/auth';
import { TEST_MONEY, holdingsFor } from '../src/features/home/account';

describe('dollars', () => {
  it('converts at the rate and prints the way the frames do', () => {
    expect(usdOf(155_200, 1_552)).toBe(100);
    expect(usdOf(50_000, 1_552)).toBe(32.22);
    expect(nairaOf(100, 1_552)).toBe(155_200);
    expect(usdFull(412.6)).toBe('$412.60');
    expect(usdFull(-32.22)).toBe('$32.22');
    expect(rateLine(1_552)).toBe('₦1,552 to $1');
  });
  it('charges nothing under $500 and one percent over', () => {
    expect(feeForUsd(100)).toBe(0);
    expect(feeForUsd(FREE_UNDER_USD - 0.01)).toBe(0);
    expect(feeForUsd(600)).toBe(6);
  });
  it('counts the dollars from the account and the rows on this phone', () => {
    expect(dollarsOf(412.6, [])).toBe(412.6);
    expect(dollarsOf(412.6, [{ usd: 100 }, { usd: -32.22 }, {}])).toBe(480.38);
    expect(DEMO_SOURCES.reduce((a, s) => a + s.usd, 0)).toBe(412.6);
    const rows = [
      { id: 'a', usd: 100, time: '09:41', kind: 'convert' },
      { id: 'b', usd: -32.22, time: '09:50', kind: 'transfer' },
      { id: 'c', time: '10:00', kind: 'bill' },
    ];
    expect(sourcesOf(rows, 1_552)).toEqual([{ id: 'a', glyph: 'swap', title: 'Converted from naira', sub: 'Today 09:41 · at ₦1,552', usd: 100 }]);
  });
  it('says what holding them was worth, and what an empty holding is', () => {
    expect(heldLine(412.6, 1_552)).toContain('March at ₦1,410');
    expect(heldLine(412.6, 1_552)).toContain('₦58,600 less');
    expect(heldLine(0, 1_552)).toContain('Nothing here yet');
    expect(heldLine(500, 1_552, false)).toBe('Worth ₦776,000 at today’s rate. They stay in dollars until you turn them back, at the rate on the day.');
  });
});

describe('the test money a new account starts with (Round 33)', () => {
  const opened = { accountNumber: '0123456789', phone: '08031234567', firstName: 'Ada', lastName: 'Obi', createdAt: '2026-10-08T09:30:00Z' };
  it('gives every new account ₦250,000 and $500, said as a line of its own', () => {
    const h = holdingsFor(opened);
    expect(h.everyday).toBe(250_000);
    expect(h.dollars).toBe(TEST_MONEY.usd);
    expect(h.ledger).toHaveLength(1);
    expect(h.ledger[0]).toMatchObject({ id: 'test-money', kind: 'in', amount: 250_000, status: 'done' });
    /* what is spent comes off it: a payment of ₦50,000 leaves ₦200,000 */
    expect(h.everyday + balanceOf([{ amount: -50_000, kind: 'transfer' }])).toBe(200_000);
  });
  it('leaves the demo its own day and the lab’s first day empty', () => {
    expect(holdingsFor(DEMO_ACCOUNT).everyday).toBe(595320.75);
    const empty = holdingsFor({ ...opened, startsEmpty: true });
    expect([empty.everyday, empty.dollars, empty.ledger.length]).toEqual([0, 0, 0]);
  });
});

describe('money health', () => {
  it('reads the switches and the transfers', () => {
    const rows = healthRows(DEFAULT_PREFS, 0);
    expect(rows.map(r => r.value)).toEqual(['9 of 9', '3 months', 'On', 'On', '18% over']);
    expect(healthRows({ ...DEFAULT_PREFS, hideBalance: false, faceId: false, tight: true }, 2).map(r => r.value)).toEqual(['11 of 11', 'Paused', 'Off', 'Passcode', '18% over']);
    expect(rows[4]?.tone).toBe('warn');
    expect(healthLine(72)).toContain('18%');
    expect(healthLine(null)).toContain('Nothing to score yet');
  });
});

describe('the words that open the new pages', () => {
  it('knows convert, the goal and the score', () => {
    expect(isConvert('convert 50k to dollars')).toBe(true);
    expect(isGoal('how is my holiday goal')).toBe(true);
    expect(isHealth('what is my money health')).toBe(true);
    expect(pageFor('convert some naira')).toBe('/convert');
    expect(pageFor('my savings goal')).toBe('/goal');
    expect(pageFor('money health')).toBe('/health');
    expect(pageFor('what about dollars')).toBeNull();
    expect(serviceFor('dollars')?.to).toBe('/dollars');
    expect(serviceFor('savings')?.to).toBe('/goal');
  });
});

describe('a line paid from the dollars', () => {
  it('leaves the naira balance alone and says so on the receipt', () => {
    const at = new Date('2026-09-30T09:50:00');
    const row = rowFrom(
      {
        name: 'Sarah Adeyemi',
        detail: 'GTBank · sent from dollars · 09:50',
        amount: -50_000,
        icon: 'send',
        kind: 'transfer',
        fee: 0,
        person: { name: 'Sarah Adeyemi', bank: 'GTBank', number: '0234567890' },
        usd: -32.22,
      },
      595_320,
      17,
      at,
    );
    expect(row.after).toBe(595_320);
    expect(balanceOf([row])).toBe(0);
    const converted = rowFrom({ name: 'Dollars', detail: '$100.00 at ₦1,552 to $1 · 09:41', amount: -155_200, icon: 'swap', kind: 'convert', usd: 100 }, 595_320, 17, at);
    expect(converted.after).toBe(440_120);
    expect(balanceOf([converted])).toBe(-155_200);
    const r = receiptFor(row, { account: DEMO_ACCOUNT, balanceNow: 595_320, rows: [row] });
    expect(r.fields.find(f => f[0] === 'From')).toEqual(['From', 'Dollars', '$32.22 at ₦1,552 to $1']);
    expect(r.fields.find(f => f[0] === 'Total charged')?.[1]).toBe('$32.22');
    const c = receiptFor(converted, { account: DEMO_ACCOUNT, balanceNow: 440_120, rows: [converted] });
    expect(c.head).toBe('Converted');
    expect(c.line).toBe('$100.00 into Dollars');
    expect(c.fields.find(f => f[0] === 'Rate')?.[1]).toBe('₦1,552 to $1');
  });
});
