import { describe, expect, it, vi } from 'vitest';

/* the identity service reaches for the device's random numbers, which are not under test here */
vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { canEnter, landing, nextStep, routeOf, type Progress } from '@/features/onboarding/machine';
import { rowsFor } from '@/features/onboarding/stages';
import { ageOn, dateFrom, fullNameProblem, typingDate } from '@/features/onboarding/validation';
import { namesMatch } from '@/services/identity';

const record = { firstName: 'Ibrahim', lastName: 'Musa', recordName: 'MUSA IBRAHIM', born: '1996-06-14', birthYear: 1996 };
const KEPT = { v: 2 as const, salt: 's', rounds: 1000, hash: 'h' };
const typed = { name: 'Ibrahim Musa', dob: '1996-06-14' };

describe('the way in', () => {
  it('starts at the welcome and moves one step at a time from a mobile number', () => {
    let p: Progress = {};
    expect(nextStep(p)).toBe('welcome');
    p = { via: 'phone', phone: '08032144471' };
    expect(nextStep(p)).toBe('code');
    p = { ...p, phoneVerified: true };
    expect(nextStep(p)).toBe('details');
    p = { ...p, ...typed };
    expect(nextStep(p)).toBe('bvn');
    p = { ...p, identity: { number: '12345678900', record, from: 'bvn' } };
    expect(nextStep(p)).toBe('password');
    p = { ...p, password: KEPT };
    expect(nextStep(p)).toBe('passcode');
    p = { ...p, passcode: KEPT };
    expect(nextStep(p)).toBe('finish');
    p = { ...p, accountNumber: '0102445788' };
    expect(nextStep(p)).toBe('ready');
  });
  it('asks for the mobile number after the BVN when it began with an email', () => {
    let p: Progress = { via: 'email', email: 'a@b.co' };
    expect(nextStep(p)).toBe('code');
    p = { ...p, emailVerified: true, ...typed, identity: { number: '12345678900', record } };
    expect(nextStep(p)).toBe('phone');
    p = { ...p, phone: '08032144471' };
    expect(nextStep(p)).toBe('phonecode');
    p = { ...p, phoneVerified: true };
    expect(nextStep(p)).toBe('password');
  });
  it('takes Google’s or Apple’s checked email without a code, and asks no password (the owner’s word)', () => {
    let p: Progress = { via: 'google', email: 'a@gmail.com', emailVerified: true, name: 'Ibrahim Musa' };
    expect(nextStep(p)).toBe('details');
    p = { ...p, dob: '1996-06-14', identity: { number: '12345678900', record, from: 'nin' }, phone: '08032144471', phoneVerified: true };
    expect(nextStep(p)).toBe('passcode');
  });
  it('lets you back to a step you have done but not on to one you have not', () => {
    const p: Progress = { via: 'phone', phone: '08032144471', phoneVerified: true };
    expect(canEnter('code', p)).toBe(true);
    expect(canEnter('details', p)).toBe(true);
    expect(canEnter('bvn', p)).toBe(false);
    expect(canEnter('passcode', p)).toBe(false);
    expect(canEnter('ready', {})).toBe(false);
  });
  it('has an address for every step', () => {
    for (const step of ['welcome', 'code', 'details', 'bvn', 'phone', 'phonecode', 'password', 'passcode', 'finish', 'ready', 'home'] as const) expect(routeOf[step]).toMatch(/^\//);
  });
});

describe('the steps done, above the title', () => {
  const who: Progress = { via: 'phone', phone: '08032144471', phoneVerified: true, ...typed, identity: { number: '12345678900', record, from: 'bvn' } };
  it('names each for what was given', () => {
    expect(rowsFor('bvn', { via: 'phone', phone: '08032144471', phoneVerified: true }).map(r => r.label)).toEqual(['Mobile number']);
    expect(rowsFor('passcode', { ...who, password: KEPT }).map(r => r.label)).toEqual(['Mobile number', 'BVN number', 'Password']);
    expect(rowsFor('finish', { ...who, password: KEPT, passcode: KEPT }).map(r => r.label)).toEqual(['Mobile number', 'BVN number', 'Password and passcode']);
    expect(rowsFor('password', { ...who, identity: { number: '1', record, from: 'voters' } }).map(r => r.label)).toEqual(['Mobile number', 'Voter’s card']);
    expect(rowsFor('password', { ...who, identity: { number: '1', record, from: 'nin' } }).map(r => r.label)).toEqual(['Mobile number', 'NIN number']);
  });
  it('keeps four on the ready screen when it began with an email, and says Passcode alone for Google', () => {
    const p: Progress = { ...who, via: 'email', email: 'a@b.co', emailVerified: true };
    expect(rowsFor('ready', p).map(r => r.label)).toEqual(['Email and mobile number', 'BVN number', 'Password and passcode', 'Face scan and username']);
    expect(rowsFor('ready', { ...p, via: 'google' }).map(r => r.label)).toEqual(['Google account and mobile number', 'BVN number', 'Passcode', 'Face scan and username']);
  });
});

describe('your details', () => {
  it('wants two names at least, in letters', () => {
    expect(fullNameProblem('Ibrahim')).toBe('short');
    expect(fullNameProblem('Ibrahim Musa')).toBeNull();
    expect(fullNameProblem('Ngozi Okonjo-Iweala')).toBeNull();
    expect(fullNameProblem('Ibrahim Mu5a')).toBe('chars');
  });
  it('takes a date as it is typed, a real day in the past', () => {
    expect(typingDate('14061996')).toBe('14/06/1996');
    expect(typingDate('140')).toBe('14/0');
    expect(dateFrom('14/06/1996')).toBe('1996-06-14');
    expect(dateFrom('31/02/1996')).toBeNull();
    expect(dateFrom('14/06/2999')).toBeNull();
    expect(ageOn('2008-10-09', new Date(2026, 9, 8))).toBe(17);
    expect(ageOn('2008-10-08', new Date(2026, 9, 8))).toBe(18);
  });
  it('holds a name to a record by its first name and surname, in any order', () => {
    expect(namesMatch('Ibrahim Musa', record)).toBe(true);
    expect(namesMatch('musa ibrahim', record)).toBe(true);
    expect(namesMatch('Ibrahim Abdul Musa', record)).toBe(true);
    expect(namesMatch('Ibrahim Moses', record)).toBe(false);
  });
});

describe('landing', () => {
  it('is the ready screen once the account is opened and home after the way in is cleared', () => {
    expect(landing({ phone: '08032144471', accountNumber: '0102445788' })).toBe('ready');
    expect(landing({})).toBe('home');
  });
});
