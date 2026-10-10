import { describe, expect, it } from 'vitest';
import { DEMO_CARD, faceLine, isCardLine, linesOf, luhnDigit, luhnOk, makeCard, newNumber, seedCards, standing, expiryFrom } from '../src/features/settings/card';
import type { LedgerRow } from '../src/features/home/account';

describe('virtual cards (Round 37)', () => {
  it('the demo has the frames’ Netflix card; any other account starts with none', () => {
    expect(seedCards(true)).toEqual([DEMO_CARD]);
    expect(seedCards(false)).toEqual([]);
    expect(faceLine(DEMO_CARD)).toBe('NETFLIX ONLY');
    expect(standing(DEMO_CARD)).toEqual({ spent: 21000, left: 29000, pct: 42 });
  });

  it('a new card’s number is the issuer’s and passes the check every card number passes', () => {
    for (let i = 0; i < 50; i++) {
      const n = newNumber();
      expect(n).toMatch(/^5399\d{12}$/);
      expect(luhnOk(n)).toBe(true);
    }
    expect(luhnDigit('7992739871')).toBe('3');
    expect(luhnOk('5399812345674471')).toBe(luhnDigit('539981234567447') === '1');
  });

  it('a new card runs three years, is kept to what it is for, and starts with nothing spent', () => {
    const c = makeCard({ merchant: '', limit: 20_000, tone: 'sea' }, new Date(2026, 9, 10));
    expect(c.expiry).toBe('10/29');
    expect(expiryFrom(new Date(2026, 0, 1))).toBe('01/29');
    expect(faceLine(c)).toBe('ONLINE');
    expect(faceLine({ ...c, nickname: 'Groceries' })).toBe('GROCERIES');
    expect(standing(c)).toEqual({ spent: 0, left: 20_000, pct: 0 });
    expect(standing({ ...c, loaded: 5_000 }).left).toBe(25_000);
    expect(c.cvv).toMatch(/^\d{3}$/);
  });

  it('a card lists its own loads, newest first, then what it paid before; another card’s are not its', () => {
    const other = makeCard({ merchant: 'Spotify', limit: 50_000, tone: 'clay' });
    const load = (id: string, cardId?: string): LedgerRow => ({
      id,
      day: 'today',
      time: '10:00',
      icon: 'card',
      name: 'Virtual card',
      detail: `Loaded · •••• ${cardId === other.id ? other.number.slice(-4) : '4471'} · 10:00`,
      amount: -5000,
      status: 'done',
      kind: 'card',
      cardId,
    });
    const rows = [load('a', 'c1'), load('b', other.id), load('c')];
    const mine = linesOf(DEMO_CARD, rows, () => 'Today');
    expect(mine.slice(0, 2).map(l => l.id)).toEqual(['c', 'a']);
    expect(mine[0]).toMatchObject({ loaded: true, amount: 5000, receipt: 'c' });
    expect(
      mine
        .filter(l => !l.loaded)
        .map(l => l.amount)
        .reduce((a, b) => a + b, 0),
    ).toBe(-21000);
    expect(linesOf(other, rows, () => 'Today').map(l => l.id)).toEqual(['b']);
    expect(isCardLine(other, rows[2]!)).toBe(false);
  });
});
