import { describe, expect, it } from 'vitest';
import { AIMS, aimHello, aimsBrief, aimsOf, chipOrder, isAim } from '@/features/aims/aims';
import { MONTHS, daysIn, isoOf, partsOf, spokenDate, wheelYears, YOUNGEST, START_AGE } from '@/lib/dates';

describe('the date of birth on three wheels', () => {
  it('knows how long each month is, February in a leap year included', () => {
    expect(daysIn(2024, 2)).toBe(29);
    expect(daysIn(2023, 2)).toBe(28);
    expect(daysIn(2001, 4)).toBe(30);
    expect(daysIn(2001, 12)).toBe(31);
    expect(MONTHS).toHaveLength(12);
  });

  it('writes and reads a day as an ISO date', () => {
    expect(isoOf(1996, 6, 14)).toBe('1996-06-14');
    expect(partsOf('1996-06-14')).toEqual({ year: 1996, month: 6, day: 14 });
    expect(partsOf('14/06/1996')).toBeNull();
    expect(spokenDate('1996-06-14')).toBe('14 June 1996');
  });

  it('offers a hundred years back to sixteen, starting in a young person’s twenties', () => {
    const now = new Date(2026, 10, 7);
    const { list, start } = wheelYears(now);
    expect(list[list.length - 1]).toBe(2026 - YOUNGEST);
    expect(list[0]).toBe(1926);
    expect(start).toBe(2026 - START_AGE);
    expect(list).toContain(start);
    expect(list.every((y, i) => i === 0 || y === (list[i - 1] ?? 0) + 1)).toBe(true);
  });

});

describe('what Beetle is for', () => {
  it('offers the seven aims the owner asked for', () => {
    expect(AIMS.map(a => a.label)).toEqual([
      'Save money',
      'Track my spending',
      'Learn ways to save',
      'Keep me strict',
      'Small daily payments',
      'Get paid, pay rent and bills',
      'Send money to family',
    ]);
    for (const a of AIMS) {
      expect(a.sub.length, a.id).toBeLessThanOrEqual(46);
      expect(a.hello.length, a.id).toBeLessThanOrEqual(80);
    }
  });

  it('keeps only real aims, in the order they are listed', () => {
    expect(aimsOf(['family', 'nonsense', 'save'])).toEqual(['save', 'family']);
    expect(aimsOf(undefined)).toEqual([]);
    expect(isAim('daily')).toBe(true);
    expect(isAim('rent')).toBe(false);
  });

  it('tells the model what they came for, and nothing when nothing was picked', () => {
    expect(aimsBrief([])).toBeNull();
    const brief = aimsBrief(['save', 'daily'])!;
    expect(brief).toMatch(/^What the owner wants Beetle for: save money; small daily payments\./);
    expect(brief).toContain('Save chip');
  });

  it('opens the chat on the first aim, and leads the chips with what they came for', () => {
    expect(aimHello(['family', 'save'])).toBe('Want to put something aside today?');
    expect(aimHello([])).toBeNull();
    const chips = ['send', 'bills', 'data', 'receive', 'save', 'loan'].map(key => ({ key }));
    expect(chipOrder(chips, []).map(c => c.key)).toEqual(['send', 'bills', 'data', 'receive', 'save', 'loan']);
    expect(chipOrder(chips, ['save', 'daily']).map(c => c.key)).toEqual(['save', 'data', 'send', 'bills', 'receive', 'loan']);
    expect(chipOrder(chips, ['salary']).map(c => c.key)).toEqual(['receive', 'bills', 'send', 'data', 'save', 'loan']);
  });

});
