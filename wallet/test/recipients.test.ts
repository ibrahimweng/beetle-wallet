/* Who money goes to: a $tag in Beetle's directory, the banks a number is
   likely at, the name a bank answers with, and the closest names to what
   was typed. */
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'web', select: (o: Record<string, unknown>) => o.default } }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digestStringAsync: async () => 'h' }));
import { BEETLE, BANK_LIST, bankIn, checkDigit, closest, findTag, fits, likelyBanks, nameAt, phoneShaped, tagIn, toKind } from '@/services/recipients';
import { arrivesAt, feeTo } from '@/services/rules';
import { PEOPLE } from '@/services/agent';

describe('a tag', () => {
  it('is read out of the words, whatever its case', () => {
    expect(tagIn('send $Tobi 5k')).toBe('tobi');
    expect(tagIn('$amaka')).toBe('amaka');
    expect(tagIn('send tobi 5k')).toBeNull();
    expect(tagIn('₦5,000')).toBeNull();
  });
  it('finds the Beetle account, which is at Beetle', async () => {
    const p = await findTag('$tobi', 0);
    expect(p).toEqual({ name: 'Tobi Bakare', bank: BEETLE, number: '9012345671', tag: 'tobi' });
    expect(await findTag('nobody', 0)).toBeNull();
  });
});

describe('the banks a number is at', () => {
  it('works the check digit the way the CBN sets it', () => {
    /* 058 + 012345678: 0·3+5·7+8·3+0·3+1·7+2·3+3·3+4·7+5·3+6·3+7·7+8·3 = 215 → 10 − 5 = 5 */
    expect(checkDigit('058', '012345678')).toBe(5);
    const gt = BANK_LIST.find(b => b.name === 'GTBank')!;
    expect(fits('0123456785', gt)).toBe(true);
    expect(fits('0123456784', gt)).toBe(false);
  });
  it('puts first the bank it was paid at, then the ones its digits fit', () => {
    const banks = likelyBanks('0123456785');
    expect(banks).toContain('GTBank');
    expect(banks.every(name => name !== 'OPay')).toBe(true);
    expect(likelyBanks('0234567890', PEOPLE)[0]).toBe('GTBank');
  });
  it('offers the newer banks for a phone number without its nought', () => {
    expect(phoneShaped('8031234567')).toBe(true);
    expect(likelyBanks('8031234567').slice(0, 4)).toEqual(['Kuda', 'Moniepoint', 'OPay', 'PalmPay']);
    expect(phoneShaped('0234567890')).toBe(false);
  });
  it('knows a Beetle account number for Beetle', () => {
    expect(likelyBanks('9012345671')[0]).toBe(BEETLE);
  });
  it('reads a bank out of the words', () => {
    expect(bankIn('my account at guaranty trust')).toBe('GTBank');
    expect(bankIn('to opay')).toBe('OPay');
    expect(bankIn('her beetle account')).toBe(BEETLE);
    expect(bankIn('the shop')).toBeNull();
    /* the whole list (Round 39): whole words only, the longest name first, and names that are plain words need "bank" */
    expect(bankIn('my diamond bank account')).toBe('Access Bank (Diamond)');
    expect(bankIn('send it to my vbank')).toBe('VFD MFB');
    expect(bankIn('the carbon in the air')).toBeNull();
    expect(bankIn('my carbon app')).toBe('Carbon');
    expect(bankIn('at the branch')).toBeNull();
    expect(bankIn('my kudaa')).toBeNull();
  });
  it('knows every bank and money app the transfer network reaches, Heritage gone', () => {
    expect(BANK_LIST.length).toBeGreaterThan(250);
    expect(BANK_LIST.some(b => /heritage/i.test(b.name))).toBe(false);
    expect(new Set(BANK_LIST.map(b => b.name)).size).toBe(BANK_LIST.length);
    for (const name of ['Jaiz Bank', 'Globus Bank', 'Paga', '9PSB', 'MoMo PSB', 'FairMoney', 'VFD MFB'])
      expect(
        BANK_LIST.some(b => b.name === name),
        name,
      ).toBe(true);
  });
});

describe('the name on an account', () => {
  it('answers with the name of someone paid before, at their bank only', () => {
    const at = nameAt('0234567890', 'GTBank', PEOPLE);
    expect(at).toEqual({ found: true, person: { name: 'Sarah Adeyemi', bank: 'GTBank', number: '0234567890' } });
    const wrong = nameAt('0234567890', 'Zenith Bank', PEOPLE);
    expect(wrong.found).toBe(false);
    if (!wrong.found) expect(wrong.why).toContain('You paid this number at GTBank');
  });
  it('answers at a bank the digits fit, the same name every time, and nowhere else', () => {
    const a = nameAt('0123456785', 'GTBank');
    const b = nameAt('0123456785', 'GTBank');
    expect(a.found).toBe(true);
    expect(a).toEqual(b);
    expect(nameAt('0123456785', 'Unity Bank').found).toBe(false);
  });
  it('turns away a number that is not ten digits', () => {
    expect(nameAt('01234', 'GTBank')).toEqual({ found: false, why: 'An account number is ten digits.' });
  });
});

describe('the closest names', () => {
  const paid = PEOPLE.map((p, i) => ({ ...p, times: 4 - i }));
  it('finds the people paid before and Beetle accounts, each with its bank', () => {
    const m = closest('sarah', paid);
    expect(m.map(x => `${x.person.name} · ${x.person.bank}`)).toEqual(['Sarah Adeyemi · GTBank', 'Sarah Bello · Beetle']);
  });
  it('looks only in the directory after a $', () => {
    const m = closest('$ch', paid);
    expect(m.map(x => x.person.bank)).toEqual([BEETLE]);
    expect(m[0]!.person.tag).toBe('chidi');
  });
  it('tells a tag, a number and a name apart', () => {
    expect(toKind('$tobi')).toBe('tag');
    expect(toKind('0123 456')).toBe('number');
    expect(toKind('Sarah')).toBe('name');
    expect(toKind('  ')).toBe('empty');
  });
});

describe('the cost and the time', () => {
  it('is free and instant to a Beetle account, the banks fee to any other', () => {
    expect(feeTo(80_000, BEETLE)).toBe(0);
    expect(feeTo(80_000, 'GTBank')).toBe(53.75);
    expect(feeTo(20_000, 'GTBank')).toBe(26.88);
    expect(arrivesAt(80_000, BEETLE)).toBe('Instantly');
    expect(arrivesAt(80_000, 'GTBank')).toBe('Under a minute');
  });
});
