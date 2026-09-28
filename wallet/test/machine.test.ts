import { describe, expect, it } from 'vitest';
import { canEnter, landing, nextStep, routeOf, type Progress } from '@/features/onboarding/machine';

const record = { firstName: 'Ibrahim', lastName: 'Musa', recordName: 'MUSA IBRAHIM', born: '1996-06-14', birthYear: 1996 };

describe('the way in', () => {
  it('starts at the welcome and moves one step at a time', () => {
    let p: Progress = {};
    expect(nextStep(p)).toBe('welcome');
    p = { phone: '08032144471' };
    expect(nextStep(p)).toBe('code');
    p = { ...p, phoneVerified: true };
    expect(nextStep(p)).toBe('identity');
    p = { ...p, identity: { number: '12345678900', record } };
    expect(nextStep(p)).toBe('confirm');
    p = { ...p, identityConfirmed: true };
    expect(nextStep(p)).toBe('face');
    p = { ...p, face: 'later' };
    expect(nextStep(p)).toBe('passcode');
    p = { ...p, passcodeSet: true, accountNumber: '0102445788' };
    expect(nextStep(p)).toBe('ready');
  });
  it('lets you back to a step you have done but not on to one you have not', () => {
    const p: Progress = { phone: '08032144471', phoneVerified: true };
    expect(canEnter('phone', p)).toBe(true);
    expect(canEnter('code', p)).toBe(true);
    expect(canEnter('identity', p)).toBe(true);
    expect(canEnter('confirm', p)).toBe(false);
    expect(canEnter('passcode', p)).toBe(false);
    expect(canEnter('ready', {})).toBe(false);
  });
  it('has an address for every step', () => {
    for (const step of ['welcome', 'phone', 'code', 'identity', 'confirm', 'face', 'passcode', 'ready', 'home'] as const) expect(routeOf[step]).toMatch(/^\//);
  });
});

describe('landing', () => {
  it('is the ready screen once the account is opened and home after the way in is cleared', () => {
    expect(landing({ phone: '08032144471', accountNumber: '0102445788' })).toBe('ready');
    expect(landing({})).toBe('home');
  });
});
