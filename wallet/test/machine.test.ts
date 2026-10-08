import { describe, expect, it } from 'vitest';
import { canEnter, landing, nextStep, routeOf, type Progress } from '@/features/onboarding/machine';
import { rowsFor } from '@/features/onboarding/stages';

const record = { firstName: 'Ibrahim', lastName: 'Musa', recordName: 'MUSA IBRAHIM', born: '1996-06-14', birthYear: 1996 };
const KEPT = { v: 2 as const, salt: 's', rounds: 1000, hash: 'h' };

describe('the way in', () => {
  it('starts at the welcome and moves one step at a time from a mobile number', () => {
    let p: Progress = {};
    expect(nextStep(p)).toBe('welcome');
    p = { via: 'phone', phone: '08032144471' };
    expect(nextStep(p)).toBe('code');
    p = { ...p, phoneVerified: true };
    expect(nextStep(p)).toBe('bvn');
    p = { ...p, identity: { number: '12345678900', record, from: 'bvn' } };
    expect(nextStep(p)).toBe('details');
    p = { ...p, identityConfirmed: true };
    expect(nextStep(p)).toBe('password');
    p = { ...p, password: KEPT };
    expect(nextStep(p)).toBe('finish');
    p = { ...p, accountNumber: '0102445788' };
    expect(nextStep(p)).toBe('ready');
  });
  it('asks for the mobile number after the BVN when it began with an email', () => {
    let p: Progress = { via: 'email', email: 'a@b.co' };
    expect(nextStep(p)).toBe('code');
    p = { ...p, emailVerified: true };
    expect(nextStep(p)).toBe('bvn');
    p = { ...p, identity: { number: '12345678900', record }, identityConfirmed: true };
    expect(nextStep(p)).toBe('phone');
    p = { ...p, phone: '08032144471' };
    expect(nextStep(p)).toBe('phonecode');
    p = { ...p, phoneVerified: true };
    expect(nextStep(p)).toBe('password');
  });
  it('takes Google’s or Apple’s checked email without a code', () => {
    expect(nextStep({ via: 'google', email: 'a@gmail.com', emailVerified: true })).toBe('bvn');
  });
  it('lets you back to a step you have done but not on to one you have not', () => {
    const p: Progress = { via: 'phone', phone: '08032144471', phoneVerified: true };
    expect(canEnter('code', p)).toBe(true);
    expect(canEnter('bvn', p)).toBe(true);
    expect(canEnter('details', p)).toBe(false);
    expect(canEnter('password', p)).toBe(false);
    expect(canEnter('ready', {})).toBe(false);
  });
  it('has an address for every step', () => {
    for (const step of ['welcome', 'code', 'bvn', 'details', 'phone', 'phonecode', 'password', 'finish', 'ready', 'home'] as const) expect(routeOf[step]).toMatch(/^\//);
  });
});

describe('the steps done, above the title', () => {
  const who: Progress = { via: 'phone', phone: '08032144471', phoneVerified: true, identity: { number: '12345678900', record, from: 'bvn' }, identityConfirmed: true };
  it('names each for what was given', () => {
    expect(rowsFor('bvn', { via: 'phone', phone: '08032144471', phoneVerified: true }).map(r => r.label)).toEqual(['Mobile number']);
    expect(rowsFor('finish', { ...who, password: KEPT }).map(r => r.label)).toEqual(['Mobile number', 'BVN number', 'Password']);
    expect(rowsFor('password', { ...who, identity: { number: '1', record, from: 'voters' } }).map(r => r.label)).toEqual(['Mobile number', 'Voter’s card']);
  });
  it('keeps four on the ready screen when it began with an email', () => {
    const p: Progress = { ...who, via: 'email', email: 'a@b.co', emailVerified: true };
    expect(rowsFor('ready', p).map(r => r.label)).toEqual(['Email and mobile number', 'BVN number', 'Password', 'Face scan and username']);
  });
});

describe('landing', () => {
  it('is the ready screen once the account is opened and home after the way in is cleared', () => {
    expect(landing({ phone: '08032144471', accountNumber: '0102445788' })).toBe('ready');
    expect(landing({})).toBe('home');
  });
});
