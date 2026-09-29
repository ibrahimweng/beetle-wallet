import { describe, expect, it } from 'vitest';
import { activityAmount, activityRows } from '@/features/activities/rows';
import { DEMO_LEDGER } from '@/features/home/account';
import { naira, signed } from '@/lib/format';

describe('the record', () => {
  it('puts what needs a look first, then what settled, newest first', () => {
    const ids = activityRows(DEMO_LEDGER, 'today', 'All').map(r => r.id);
    expect(ids).toEqual(['l01', 'l02', 'l03', 'l04', 'l05', 'l06', 'l07', 'l08']);
  });
  it('leaves what went into your own goal out', () => {
    expect(activityRows(DEMO_LEDGER, 'today', 'All').some(r => r.kind === 'saving')).toBe(false);
  });
  it('narrows to what came in and what went out', () => {
    expect(activityRows(DEMO_LEDGER, 'yesterday', 'In').map(r => r.id)).toEqual(['l10']);
    expect(activityRows(DEMO_LEDGER, 'yesterday', 'Out').map(r => r.id)).toEqual(['l11', 'l12']);
    expect(activityRows(DEMO_LEDGER, 'today', 'In').map(r => r.id)).toEqual(['l03']);
  });
  it('signs a figure that moved and leaves one that did not bare', () => {
    const by = Object.fromEntries(DEMO_LEDGER.map(r => [r.id, r]));
    expect(activityAmount(by.l01!, signed, naira)).toBe('−₦20,000');
    expect(activityAmount(by.l02!, signed, naira)).toBe('₦12,000');
    expect(activityAmount(by.l03!, signed, naira)).toBe('₦20,000');
    expect(activityAmount(by.l10!, signed, naira)).toBe('+₦640,000');
  });
});
