import { describe, expect, it } from 'vitest';
import { checkPhone, isCode, isIdentityNumber, isNigerianMobile, normalisePhone, passcodeProblem } from '@/features/onboarding/validation';
import { groupAccount, groupDigits, groupPhone, initialsOf, kobo, longDate, naira, signed } from '@/lib/format';

describe('a Nigerian mobile number', () => {
  it('is eleven digits starting 070, 080, 081, 090 or 091', () => {
    for (const n of ['08032144471', '07012345678', '08112345678', '09012345678', '09112345678']) expect(isNigerianMobile(n)).toBe(true);
    for (const n of ['0803214447', '08032144471 ', '06012345678', '12345678901', '01234567890']) expect(isNigerianMobile(n)).toBe(false);
  });
  it('is read the ways people write it', () => {
    expect(normalisePhone('0803 214 4471')).toBe('08032144471');
    expect(normalisePhone('+234 803 214 4471')).toBe('08032144471');
    expect(normalisePhone('2348032144471')).toBe('08032144471');
    expect(normalisePhone('8032144471')).toBe('08032144471');
    expect(normalisePhone('0803')).toBeNull();
    expect(normalisePhone('080321444a1')).toBeNull();
  });
  it('says what is wrong with one', () => {
    expect(checkPhone('08032144471')).toEqual({ ok: true, phone: '08032144471' });
    expect(checkPhone('0803')).toEqual({ ok: false, reason: 'short' });
    expect(checkPhone('06032144471')).toEqual({ ok: false, reason: 'not-nigerian' });
  });
});

describe('the code and the identity number', () => {
  it('are six and eleven digits', () => {
    expect(isCode('123456')).toBe(true);
    expect(isCode('12345')).toBe(false);
    expect(isIdentityNumber('12345678900')).toBe(true);
    expect(isIdentityNumber('1234567890')).toBe(false);
  });
});

describe('a passcode', () => {
  it('turns away the easy ones', () => {
    expect(passcodeProblem('123456')).toBe('common');
    expect(passcodeProblem('234567')).toBe('run');
    expect(passcodeProblem('987654')).toBe('run');
    expect(passcodeProblem('777777')).toBe('same');
    expect(passcodeProblem('373737')).toBe('pairs');
    expect(passcodeProblem('12345')).toBe('short');
  });
  it('turns away the year of birth on the record', () => {
    expect(passcodeProblem('199642', { birthYear: 1996 })).toBe('birth-year');
    expect(passcodeProblem('199642')).toBeNull();
  });
  it('accepts an ordinary one', () => {
    expect(passcodeProblem('402917')).toBeNull();
    expect(passcodeProblem('839021', { birthYear: 1996 })).toBeNull();
  });
});

describe('formatting', () => {
  it('groups digits the way the design writes them', () => {
    expect(groupPhone('08032144471')).toBe('0803 214 4471');
    expect(groupPhone('0803')).toBe('0803');
    expect(groupDigits('12345678900', [4, 4, 3])).toBe('1234 5678 900');
    expect(groupAccount('0102445788')).toBe('0102 4457 88');
  });
  it('writes money', () => {
    expect(naira(595320.75)).toBe('₦595,320');
    expect(kobo(595320.75)).toBe('.75');
    expect(kobo(0)).toBe('.00');
    expect(signed(-20000)).toBe('−₦20,000');
    expect(signed(640000)).toBe('+₦640,000');
  });
  it('writes names and dates', () => {
    expect(initialsOf('Ibrahim Musa')).toBe('IM');
    expect(longDate('1996-06-14')).toBe('14 June 1996');
  });
});
