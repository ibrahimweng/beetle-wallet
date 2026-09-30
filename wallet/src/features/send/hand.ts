/* What the pages around Send money hand back to it, and what it hands on.
   Change the amount hands back the figure, Check this number the person,
   Not enough the balance to send instead; the page takes it the moment it
   is in front again, the way the chat takes a photo. A reading the reader
   was not sure of goes the other way, to Check this number. */
import type { Person, Reading } from '../../services';

export type Draft = {
  who?: Person;
  /** what the page says under the person */
  whoNote?: string;
  /** they were read off a photo */
  read?: 'photo';
  amount?: number;
  /** what the page says under the amount */
  amountNote?: string;
  reference?: string;
  /** open the account number to type */
  typing?: boolean;
};

let waiting: Draft | null = null;
let soft: Reading | null = null;

export const draft = {
  put(d: Draft) {
    waiting = { ...(waiting ?? {}), ...d };
  },
  take(): Draft | null {
    const d = waiting;
    waiting = null;
    return d;
  },
};

export const softReading = {
  put(r: Reading) {
    soft = r;
  },
  take(): Reading | null {
    const r = soft;
    soft = null;
    return r;
  },
};

/** Sarah A., from Sarah Adeyemi: the frames' short form of a name. */
export const shortName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return last ? `${first} ${last.charAt(0)}.` : (first ?? name);
};

/** What the Send money page hands to Before I filled this in: who, how many times paid, the usual figure, and what was read. */
export type CheckDraft = { who: Person; times: number; usual?: { amount: number; reference?: string }; amount: number; read: boolean };

let checking: CheckDraft | null = null;

export const checkFor = {
  put(d: CheckDraft) {
    checking = d;
  },
  take(): CheckDraft | null {
    const d = checking;
    checking = null;
    return d;
  },
};
