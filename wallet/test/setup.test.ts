import { describe, expect, it } from 'vitest';
import { DEMO_SETUP, EMPTY_SETUP, INCOMES, OPENS, addressOk, dayCap, nextSetup } from '../src/features/setup/setup';
import { SETUP_STAGES, isSetupStage, rowsFor } from '../src/features/onboarding/stages';

describe('finishing setting up', () => {
  it('asks the three things in the frames’ order, then says everything is on', () => {
    expect(nextSetup(EMPTY_SETUP)).toBe('address');
    expect(nextSetup({ done: false, address: { street: '12 Bode Thomas Street', area: 'Surulere, Lagos State' } })).toBe('idcard');
    expect(nextSetup({ done: false, address: { street: 'a street', area: 'an area' }, id: { name: 'MUSA IBRAHIM', number: '1234 5678 900' } })).toBe('income');
    expect(nextSetup(DEMO_SETUP)).toBe('full');
  });
  it('turns the day’s cap from ₦100,000 to ₦1,000,000 once it is done', () => {
    expect(dayCap(false)).toBe(100_000);
    expect(dayCap(true)).toBe(1_000_000);
    expect(OPENS[0]).toBe('Send up to ₦1,000,000 a day');
  });
  it('wants a street and somewhere it is', () => {
    expect(addressOk('12 Bode Thomas Street', 'Surulere, Lagos State')).toBe(true);
    expect(addressOk('12', 'Surulere')).toBe(false);
    expect(addressOk('12 Bode Thomas Street', '')).toBe(false);
  });
  it('offers the four sources the frame draws, a salary first', () => {
    expect(INCOMES.map(i => i.label)).toEqual(['A salary', 'My own business', 'Family or friends', 'Something else']);
  });
  it('is four stages of the way in, each showing the steps done above its title', () => {
    expect(SETUP_STAGES).toEqual(['address', 'idcard', 'income', 'full']);
    expect(isSetupStage('ready')).toBe(false);
    expect(rowsFor('address')).toEqual([]);
    expect(rowsFor('idcard').map(r => r.label)).toEqual(['Where you live']);
    expect(rowsFor('income').map(r => r.label)).toEqual(['Where you live', 'A photo of an ID']);
    expect(rowsFor('full').map(r => r.label)).toEqual(['Where you live', 'A photo of an ID', 'Where your money comes from']);
  });
});
