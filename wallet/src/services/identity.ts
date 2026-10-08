/* The identity check: eleven digits go to the register and a name comes back.
   Behind an interface so the mock here can be swapped for the real service
   without touching a screen. */

export type IdentityRecord = {
  firstName: string;
  lastName: string;
  /** How the register writes it: surname first, in capitals. */
  recordName: string;
  /** ISO date. */
  born: string;
  birthYear: number;
  /** what a NIN slip or a voter's card gives besides (Round 30): where the person lives, and the email on the record */
  address?: string;
  email?: string;
};

/** The government papers that stand in for the BVN step (Round 30). */
export type DocumentKind = 'slip' | 'voters';

export type IdentityLookup = { found: true; record: IdentityRecord } | { found: false };

/** What checking typed details against a BVN or NIN says (Round 32): that they match, and the record; or only that they
    do not, never what the record holds, so a number typed by anybody gives away nobody's name or birthday. */
export type IdentityCheck = { ok: true; record: IdentityRecord } | { ok: false; reason: 'no-record' | 'mismatch' };

/** Do a full name as typed and a record's name belong to the same person? The record's first and last names both
    there, in any order, with a middle name or two besides, case and spacing aside. */
export function namesMatch(typed: string, record: Pick<IdentityRecord, 'firstName' | 'lastName'>): boolean {
  const words = typed
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter(Boolean);
  return words.includes(record.firstName.toLowerCase()) && words.includes(record.lastName.toLowerCase());
}

export interface IdentityService {
  lookup(number: string): Promise<IdentityLookup>;
  /** The full name and date of birth as typed, held to the record behind a BVN (NIBSS) or a NIN (NIMC). */
  verify(kind: 'bvn' | 'nin', number: string, typed: { name: string; dob: string }): Promise<IdentityCheck>;
  /** What a photo of a NIN slip or a voter's card gives: the number read off it, and the record behind it, address and email included. */
  readDocument(kind: DocumentKind, read?: { number?: string; name?: string }): Promise<IdentityLookup & { number?: string }>;
}

const NAMES: [string, string, string][] = [
  ['Ibrahim', 'Musa', '1996-06-14'],
  ['Sarah', 'Adeyemi', '1993-02-02'],
  ['Chidi', 'Okafor', '1989-11-30'],
  ['Musa', 'Danjuma', '1998-08-19'],
  ['Amaka', 'Nwosu', '1995-04-07'],
  ['Tunde', 'Bakare', '1991-12-25'],
];

import { wait } from './support';

/** The mock register. Any eleven digits come back with a record, except a
    number with four zeros in a row, which is how a tester asks for "nothing
    came back". The design's own number, 1234 5678 900, is Ibrahim Musa. */
export class MockIdentityService implements IdentityService {
  constructor(private readonly delay = 700) {}
  async lookup(number: string): Promise<IdentityLookup> {
    await wait(this.delay);
    if (!/^\d{11}$/.test(number) || number.includes('0000')) return { found: false };
    const sum = number.split('').reduce((a, c) => a + Number(c), 0);
    const pick = number === '12345678900' ? NAMES[0]! : NAMES[sum % NAMES.length]!;
    const [firstName, lastName, born] = pick;
    return {
      found: true,
      record: { firstName, lastName, recordName: `${lastName} ${firstName}`.toUpperCase(), born, birthYear: Number(born.slice(0, 4)) },
    };
  }

  /** The mock holds the design's own number, 1234 5678 900, to Ibrahim Musa born 14 June 1996; any other number with
      a record takes the name and the birthday typed, so trying the app never means knowing a stranger's. */
  async verify(_kind: 'bvn' | 'nin', number: string, typed: { name: string; dob: string }): Promise<IdentityCheck> {
    const found = await this.lookup(number);
    if (!found.found) return { ok: false, reason: 'no-record' };
    if (number === '12345678900') {
      return namesMatch(typed.name, found.record) && typed.dob === found.record.born ? { ok: true, record: found.record } : { ok: false, reason: 'mismatch' };
    }
    const words = typed.name.trim().split(/\s+/);
    const firstName = words[0] ?? '';
    const lastName = words[words.length - 1] ?? '';
    return { ok: true, record: { firstName, lastName, recordName: `${lastName} ${firstName}`.toUpperCase(), born: typed.dob, birthYear: Number(typed.dob.slice(0, 4)) } };
  }

  /** The mock reads the design's own papers, Ibrahim Musa's, unless the camera read another number off them. */
  async readDocument(kind: DocumentKind, read: { number?: string; name?: string } = {}): Promise<IdentityLookup & { number?: string }> {
    const number = read.number && /^\d{11}$/.test(read.number.replace(/\s/g, '')) ? read.number.replace(/\s/g, '') : '12345678900';
    const found = await this.lookup(number);
    if (!found.found) return found;
    const { firstName, lastName } = found.record;
    return {
      found: true,
      number,
      record: {
        ...found.record,
        address: kind === 'voters' ? '4 Adeola Odeku Street, Victoria Island, Lagos' : '12 Bode Thomas Street, Surulere, Lagos',
        email: `${firstName}.${lastName}@example.com`.toLowerCase(),
      },
    };
  }
}
