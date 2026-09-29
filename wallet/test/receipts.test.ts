import { describe, expect, it } from 'vitest';
import { balanceAfter, clock12, fixedSession, nairaFull, receiptFor, shareLine } from '@/features/receipts/receipts';
import { DEMO_LEDGER, type LedgerRow } from '@/features/home/account';
import type { Account } from '@/services/auth';

const demo: Account = { accountNumber: '0102445788', phone: '08032144471', firstName: 'Ibrahim', lastName: 'Musa', createdAt: '2026-09-01T09:00:00Z', demo: true };
const fresh: Account = { ...demo, accountNumber: '0153386269', demo: false };

describe('receipts', () => {
  it('prints money with its kobo and the time in twelve hours', () => {
    expect(nairaFull(20026.88)).toBe('₦20,026.88');
    expect(nairaFull(640000)).toBe('₦640,000.00');
    expect(clock12('07:55')).toBe('7:55 AM');
    expect(clock12('14:22')).toBe('2:22 PM');
    expect(clock12('00:05')).toBe('12:05 AM');
  });

  it("carries the frames' own figures for the lines the frames draw", () => {
    const rent = DEMO_LEDGER.find(r => r.id === 'l08')!;
    const r = receiptFor(rent, { account: demo, balanceNow: 595320.75, rows: DEMO_LEDGER });
    expect(r.head).toBe('All done');
    expect(r.line).toBe('Sent to Sarah Adeyemi');
    expect(r.fields).toContainEqual(['Balance after', '₦659,320.75']);
    expect(r.fields).toContainEqual(['From', 'Everyday', '0102 4457 88']);
    expect(r.session).toBe('000016 260828 142204 471803 926104');
    expect(r.ask).toBe('Ask about this transfer');
    const salary = receiptFor(
      DEMO_LEDGER.find(r => r.id === 'l10')!,
      { account: demo, balanceNow: 595320.75, rows: DEMO_LEDGER },
    );
    expect(salary.head).toBe('Money in');
    expect(salary.status).toBe('Cleared');
    expect(salary.fields).toContainEqual(['Fee', 'None on money in']);
    const bill = receiptFor(
      DEMO_LEDGER.find(r => r.id === 'l11')!,
      { account: demo, balanceNow: 595320.75, rows: DEMO_LEDGER },
    );
    expect(bill.token).toBe('4471 8823 0195 6640 3277');
    expect(bill.sessionLabel).toBe('Ikeja reference');
  });

  it('works a line this phone added out from what its panel knew', () => {
    const row: LedgerRow = {
      id: 'm1',
      day: 'today',
      time: '14:22',
      icon: 'send',
      name: 'Sarah Adeyemi',
      detail: 'GTBank · sent · 14:22',
      amount: -20000,
      status: 'done',
      kind: 'transfer',
      fee: 25,
      person: { bank: 'GTBank', number: '0123456789' },
      session: '000017 260929 142204 111111 222222',
      after: 575295.75,
    };
    const r = receiptFor(row, { account: fresh, balanceNow: 575295.75, rows: [row] });
    expect(r.fields).toEqual([
      ['To', 'Sarah Adeyemi', 'GTBank · 0123 4567 89'],
      ['From', 'Everyday', '0153 3862 69'],
      ['Amount', '₦20,000.00'],
      ['Fee', '₦25.00', 'Transfers under ₦10,000 carry none'],
      ['Total charged', '₦20,025.00'],
      ['Balance after', '₦575,295.75'],
    ]);
    expect(r.session).toBe(row.session);
    expect(shareLine(r)).toBe('₦20,000 to Sarah Adeyemi, 2:22 PM');
  });

  it('works the balance after a line the frames draw back from today, and keeps a fixed session id', () => {
    const rows: LedgerRow[] = [
      { id: 'a', day: 'today', time: '10:00', icon: 'send', name: 'A', detail: '', amount: -1000, status: 'done', kind: 'transfer' },
      { id: 'b', day: 'today', time: '09:00', icon: 'send', name: 'B', detail: '', amount: -500, status: 'done', kind: 'transfer' },
      { id: 'c', day: 'yesterday', time: '18:00', icon: 'bank', name: 'C', detail: '', amount: 5000, status: 'done', kind: 'in' },
    ];
    expect(balanceAfter(rows[0]!, rows, 10_000)).toBe(10_000);
    expect(balanceAfter(rows[1]!, rows, 10_000)).toBe(11_000);
    expect(balanceAfter(rows[2]!, rows, 10_000)).toBe(11_500);
    expect(fixedSession('l09', '07:30')).toBe(fixedSession('l09', '07:30'));
    expect(fixedSession('l09', '07:30')).toMatch(/^000016 260828 073004 \d{6} \d{6}$/);
  });
});
