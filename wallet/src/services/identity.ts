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
export type DocumentKind = 'nin' | 'voters';

export type IdentityLookup = { found: true; record: IdentityRecord } | { found: false };

export interface IdentityService {
  lookup(number: string): Promise<IdentityLookup>;
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
